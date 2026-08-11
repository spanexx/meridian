# MERIDIAN — Technical Architecture

## Overview

This document details MERIDIAN's technical architecture: the kernel, the domain engines, the provider adapters, how they communicate, and how data flows through the system.

Every component is temporary. The architecture is designed so that any component — database, queue, payment rail, marketplace, LLM — can be replaced without touching the rest of the system. One question measures every decision:

> "If we completely replace this component tomorrow, how much of the rest of the system must change?" — the ideal answer is **nothing**.

### Rules of the Architecture

1. **The kernel is tiny and domain-blind.** It receives events, dispatches work, coordinates execution, and records execution. Nothing else.
2. **Engines implement capabilities.** Each engine owns one capability and its data. Engines never call each other — they publish facts and react to facts.
3. **Providers live at the edge.** All external technology is an adapter behind a contract. Nothing is special; nothing is permanent.
4. **Dependencies point inward.** UI → Gateway → Engines → Kernel. Providers attach at the edge via contracts. Inner layers never know outer layers exist.
5. **Complexity is pushed outward.** The center stays boring; specialized complexity lives in engines and provider adapters.
6. **Everything observable.** Every fact is recorded as an event. The event stream is the memory of the system — logs, audit, projections, and real-time updates all derive from it.

---

## System Components

### 1. The Kernel (tiny, domain-blind)

The kernel is the only shared component. It contains **no business logic** and understands **no domain** — no members, no opportunities, no money. It only:

1. **Receives events** — engines publish facts; the kernel persists them
2. **Dispatches work** — routes events to interested engines/workers
3. **Coordinates execution** — drives multi-step workflows (sagas) via event sequencing
4. **Records execution** — append-only event store + outbox; the audit trail derives from it

```
┌─────────────────────────────────────────────────────────────┐
│                        THE KERNEL                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Event Store  │  │   Outbox     │  │   Dispatcher     │  │
│  │ (append-only)│  │(transactional│  │ (fan-out to      │  │
│  │              │  │  writes)     │  │  subscribers)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Coordinator (sagas: state machines over event flow)  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Explicitly NOT the kernel's job:**
- No domain logic (vetting, allocation, profit splits, scoring)
- No provider knowledge (Stripe, eBay, S3, LLM)
- No domain configuration (shares, thresholds, tiers)
- No member data

```go
// kernel.Event — the only data shape the kernel knows.
type Event struct {
    Type       string    `json:"type"`                 // e.g. "execution.funded"
    Version    int       `json:"version"`              // payload schema version
    Aggregate  Reference `json:"aggregate"`            // {type, id}
    Payload    any       `json:"payload"`
    Actor      Reference `json:"actor,omitempty"`      // {type: member|system, id}
    RequestID  string    `json:"request_id,omitempty"` // correlation
    OccurredAt time.Time `json:"occurred_at"`
}

// The kernel's entire surface:
type Kernel interface {
    Publish(ctx context.Context, ev Event) error          // record + dispatch
    Subscribe(handler func(ctx context.Context, ev Event)) // domain-blind fan-out
}
```

**Storage:** the event store (`events` collection) and the outbox are kernel-owned. State changes are written **transactionally with their events** (outbox pattern) so no fact is ever lost.

### 2. Domain Engines (capabilities)

Each engine implements one capability: it owns its contracts, its logic, and its data. Engines are open for extension (new behavior via new event handlers) and closed for modification.

| Engine | Capability | Owns | Reacts To |
|--------|------------|------|-----------|
| **Identity & Access** | Identity | `members` (auth), roles, permissions | — |
| **Member** | Member | `member_kyc`, `access_credentials` | `member.registered` |
| **Money** | Capital & Accounting | `capital_accounts`, `transactions`, `pool_snapshots` | `capital.deposit_confirmed`, `execution.funding_requested`, `payout.distributed` |
| **Opportunity** | Signals & Vetting | `opportunities`, `opportunity_votes` | `identity.member_kyc_verified` |
| **Execution** | Operations | `executions`, `inventory` | `opportunity.approved`, `money.allocated` |
| **Payout** | Distribution | `payouts` | `execution.completed` |
| **Reputation** | Scoring | `reputation_scores` | every member-relevant event |
| **Community** | Community directory & membership | `communities`, `community_members` | `governance.proposal.passed`, `member.kyc_verified` |
| **Governance** | Community-decided changes | `governance_proposals`, `governance_votes`, `governance_actions` | `governance.proposal.submitted`, `governance.vote.cast` |
| **Notification** | Notification | `notifications` | every lifecycle event |
| **Admin** | Oversight | `system_config` | `pool.alert_raised`, `governance.proposal.passed` (parameter scope) |

**Rules for engines:**
- Engines **never call each other.** Cross-engine work happens through events.
- Engines expose **contracts** for commands and queries (see below). The gateway depends on contracts, never implementations.
- Each engine **owns its collections.** There is no shared database. Reading another engine's data means calling its contract, not its database.
- Adding a capability means **adding** an engine or a provider — never editing the kernel.

```go
// Every engine exposes its contract to the gateway and to other
// engines' read-side needs. Implementations are private.
type Money interface {
    RequestDeposit(ctx context.Context, memberID string, amount Amount, rail PaymentRail) (DepositRequest, error)
    RequestWithdrawal(ctx context.Context, memberID string, amount Amount, method WithdrawalMethod) error
    Allocate(ctx context.Context, executionID string, amount Amount) (Allocation, error)   // reads allocation rules
    PoolStatus(ctx context.Context) (PoolStatus, error)                                    // read side
}
```

### 3. API Gateway (edge, in front of engines)

The gateway is the single entry point for clients. It has **no business logic** — it translates HTTP/WS into engine contract calls.

**Responsibilities:**
- Authentication verification (JWT validation)
- Rate limiting (per-endpoint, per-member)
- Routing commands and queries to engine contracts
- Query composition (joining contract results for UI views)
- WebSocket fan-out of events to subscribed clients
- Request/response logging
- CORS handling

```
┌─────────────────────────────────────────────────┐
│                  API GATEWAY                    │
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │   Auth    │  │   Rate    │  │  Request  │  │
│  │Middleware │  │  Limiter  │  │  Logger   │  │
│  └───────────┘  └───────────┘  └───────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │          Contract Router                   │ │
│  │  /api/v1/auth/*     → Identity contract   │ │
│  │  /api/v1/members/*  → Member contract     │ │
│  │  /api/v1/capital/*  → Money contract      │ │
│  │  /api/v1/opps/*     → Opportunity contract│ │
│  │  /ws/*              → event fan-out       │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4. Provider Adapters (the outermost edge)

All external technology — payments, marketplaces, notifications, storage, LLM/OCR, cache, queue — is a **provider behind a contract**. Adapters translate the contract into the provider's world; they contain all the specialized complexity and credentials.

Swapping a provider = **adding/replacing an adapter**, wiring it at the composition root. Nothing else changes.

| Capability | Contract | Providers |
|------------|----------|-----------|
| Payment | `PaymentProvider` | Stripe, PayPal, Coinbase (crypto) |
| Marketplace | `MarketplaceProvider` | eBay, Amazon, local/wholesale |
| Notification | `NotificationProvider` | Email, push, in-app |
| Storage | `StorageProvider` | S3-compatible |
| Recommendation | `RecommenderProvider` | LLM, OCR — recommendations only, humans decide |
| Dispatch | `DispatchProvider` | Redis queue |
| Cache | `CacheProvider` | Redis |

### 5. Data & Infrastructure (providers too)

- **MongoDB** is the current storage provider. Engines own their collections; the kernel owns the event stream. No shared collections.
- **Redis** is the current cache + dispatch provider, behind `CacheProvider` / `DispatchProvider` contracts. In v1 the dispatcher may run in-process; the contract keeps that decision reversible.
- **S3** is the current file storage provider, behind `StorageProvider`.

---

## Contracts (Interfaces Are Forever)

Implementations change; interfaces do not. Every engine and provider exposes a stable contract defining:

- **what can be requested** (operations + inputs)
- **what can be returned** (results)
- **what errors exist** (typed error codes)
- **what guarantees are provided** (idempotency, atomicity, delivery)

Contracts live in one place (`contracts/`) so nothing depends on an implementation by accident.

```go
// A provider contract at the edge. Adding a marketplace = adding a
// struct implementing this; the Execution engine never changes.
type MarketplaceProvider interface {
    ListItem(ctx context.Context, item ListableItem, price Amount) (Listing, error)
    UpdateListing(ctx context.Context, listingID string, price Amount) error
    CloseListing(ctx context.Context, listingID string, reason string) error
    FetchOrders(ctx context.Context, since time.Time) ([]Order, error)
    // Errors: ErrProviderUnavailable, ErrListingNotFound, ErrRateLimited
}

type NotificationProvider interface {
    Send(ctx context.Context, channel Channel, to Recipient, msg Message) (DeliveryResult, error)
    // Guarantees: at-least-once delivery; dedupe by message ID
}

type RecommenderProvider interface {
    // Returns a recommendation. Humans decide — the provider never
    // approves or rejects anything by itself.
    AssessOpportunity(ctx context.Context, opp OpportunitySummary) (Recommendation, error)
}
```

**Provider references in domain data:** engines store opaque provider keys (`stripe`, `ebay`, `ses`) and provider-side IDs. They never store provider internals, credentials, or schema — the adapter owns that mapping.

---

## Event-Driven Communication

### Rules

1. **Engines publish facts; they do not command other components.**
2. **Nobody depends on anybody else.** An engine that reacts to `opportunity.approved` is replaceable independently of the engine that published it.
3. **Events are written transactionally** with the state change they describe (outbox pattern) — no fact is ever lost.
4. **Commands are synchronous; facts are asynchronous.** A request that must return a result (deposit, allocate, list item) goes through a contract. Announcements of what happened travel as events.
5. **Real-time updates are just the event stream** — the gateway subscribes to events and fans them out over WebSocket. No engine knows a UI exists.

### Event Envelope

```go
type Event struct {
    Type       string    `json:"type"`                 // "execution.funded"
    Version    int       `json:"version"`              // payload schema version
    Aggregate  Reference `json:"aggregate"`            // {type, id}
    Payload    any       `json:"payload"`
    Actor      Reference `json:"actor,omitempty"`      // who/what caused it
    RequestID  string    `json:"request_id,omitempty"` // correlation ID
    OccurredAt time.Time `json:"occurred_at"`
}
```

### Event Catalog

| Namespace | Event | Meaning | Typical Reactors |
|-----------|-------|---------|------------------|
| identity | `member.registered` | New member created | Member, Notification |
| identity | `member.status_changed` | ACTIVE / SUSPENDED / BANNED | Member, Money |
| identity | `member.kyc_verified` | KYC approved | Opportunity, Notification |
| identity | `member.kyc_rejected` | KYC rejected | Notification |
| money | `capital.deposit_confirmed` | Deposit credited | Notification |
| money | `capital.withdrawal_completed` | Withdrawal paid out | Notification |
| money | `capital.allocated` | Capital locked for an execution | Execution |
| money | `capital.released` | Capital + profit returned to contributors | Reputation |
| opportunity | `opportunity.submitted` | Signal submitted | Opportunity (vetting), Notification |
| opportunity | `opportunity.vote_cast` | Vetter voted | Opportunity |
| opportunity | `opportunity.approved` | Vetting approved | Execution, Notification |
| opportunity | `opportunity.rejected` | Vetting rejected | Reputation, Notification |
| execution | `execution.funding_requested` | Execution asks for capital | Money |
| execution | `execution.funded` | Funding complete | Notification |
| execution | `execution.item_listed` | Item live on a marketplace | — |
| execution | `execution.item_sold` | Item sold | Execution (completion check) |
| execution | `execution.completed` | All items sold | Payout, Reputation |
| execution | `execution.failed` | Execution failed | Money (loss handling), Reputation |
| payout | `payout.recorded` | Payout computed | — |
| payout | `payout.distributed` | Members credited | Notification, Reputation |
| reputation | `reputation.tier_changed` | Member tier changed | Notification |
| pool | `pool.snapshot_taken` | Periodic pool snapshot | Admin |
| pool | `pool.alert_raised` | Reserve/health threshold crossed | Admin, Notification |
| governance | `governance.proposal.submitted` | A new proposal opened (parameter or community_creation) | Governance (vote collection), Notification |
| governance | `governance.vote.cast` | A VETTER+ cast a vote | Governance (tally) |
| governance | `governance.proposal.passed` | Threshold reached or deadline closed with passes | Admin (parameter scope), Community (community_creation scope), Notification |
| governance | `governance.proposal.rejected` | Threshold reached or deadline closed with rejections | Reputation (signals proposer's reputation), Notification |
| governance | `governance.proposal.withdrawn` | Proposer retracted before close | Notification |
| governance | `governance.proposal.expired` | Voting window elapsed without threshold | Notification |
| community | `community.created` | A community became active (either seeded at boot or post-vote) | Money (pool binding), Notification |
| community | `community.archived` | A community was archived | Money (freeze related pools), Notification |
| community | `community.member_joined` | A member joined | Notification |
| community | `community.member_left` | A member left | Notification |
| community | `community.settings_updated` | Admin/Community updated config fields | Notification |

### Saga Example: From Approval to Funding

Nobody commands anybody. The execution funding flow is a chain of facts:

```
1. opportunity.approved         (Opportunity engine publishes)
        │ kernel records + dispatches
2. Execution engine reacts: creates execution draft,
        publishes execution.funding_requested
3. Money engine reacts: allocates capital proportionally,
        publishes capital.allocated
4. Execution engine reacts: moves execution to FUNDING,
        publishes execution.funded
5. Notification engine reacts: notifies all participants
        via its providers (email, push, in-app)
```

Each step is observable, each step is recorded, and any engine in the chain can be replaced without touching the others.

---

## Data Flow Patterns

### Pattern 1: Synchronous Request-Response (commands & queries)

Requests that need a result go through contracts. The gateway composes results for the UI.

```
Client → Gateway → Engine contract → Engine logic → Engine's own store
                                          ↑
Client ← Gateway ← Engine result ←────────┘
```

### Pattern 2: Async Event Processing (facts)

State changes publish events transactionally (outbox). The kernel dispatches them to reactors.

```
Engine mutates state + writes event  (same transaction)
                     │
                     ▼
               Kernel Outbox
                     │
                     ▼
                Dispatcher ──► interested engines / workers
                     │
                     ▼
              Provider adapters (e.g., NotificationProvider)
```

### Pattern 3: Real-Time Updates (WebSocket)

The gateway subscribes to the kernel's event stream and fans events out to clients. Engines never know the UI exists.

```
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│     Client     │◄────►│   Gateway WS   │◄────►│  Kernel event  │
│   (Angular)    │      │    Fan-Out     │      │     stream     │
└────────────────┘      └────────────────┘      └────────────────┘
                                                        ▲
                                                        │
                                                any engine publishes
```

---

## Code Layout

Dependencies point inward: `main` wires providers into engines; engines depend on `contracts` and `kernel`; the gateway depends on engine contracts.

```
backend/
├── cmd/
│   └── server/
│       └── main.go                # Composition root: wire kernel + engines + providers
├── internal/
│   ├── kernel/                    # Tiny, domain-blind: bus, outbox, event store, sagas
│   ├── contracts/                 # Interfaces are forever — engine + provider contracts
│   ├── gateway/                   # HTTP/WS edge: auth, rate limiting, routing, fan-out
│   ├── engines/
│   │   ├── identity/              # Registration, login, tokens, roles
│   │   ├── member/                # Profile, KYC lifecycle, access credentials
│   │   ├── money/                 # Accounts, transactions, pool, allocation
│   │   ├── opportunity/           # Signals, vetting, voting
│   │   ├── execution/             # Funding, acquisition, inventory, sales
│   │   ├── payout/                # Profit calculation, distribution
│   │   ├── reputation/            # Scoring, tiers, privileges
│   │   ├── notification/          # Lifecycle messages
│   │   └── admin/                 # Config, oversight, snapshots
│   ├── providers/                 # Adapters behind contracts (all edge complexity)
│   │   ├── payment/               # stripe/ | paypal/ | coinbase/
│   │   ├── marketplace/           # ebay/ | amazon/ | wholesale/
│   │   ├── notification/          # email/ | push/ | inapp/
│   │   ├── storage/               # s3/
│   │   └── recommender/           # llm/ | ocr/
│   └── shared/                    # Errors, validation, logging (no business logic)
└── go.mod
```

No engine imports `providers/`. No engine imports another engine. The kernel imports nothing but its own store and dispatch contracts.

---

## Authentication Flow

### Registration

```
1. Client submits registration form
2. Identity engine validates input
3. Identity engine hashes password (bcrypt)
4. Identity engine creates member record (status: PENDING)
5. Identity engine publishes member.registered
6. Notification engine reacts: sends verification email
7. Member clicks verification link
8. Identity engine updates status to ACTIVE, publishes member.status_changed
9. Identity engine issues JWT + refresh token
```

### Login

```
1. Client submits credentials
2. Identity engine validates credentials
3. Identity engine checks member status (must be ACTIVE)
4. Identity engine generates JWT (15m) + refresh token (7d)
5. Identity engine returns tokens
6. Client stores tokens
7. Client attaches JWT to subsequent requests
```

### Token Refresh

```
1. Client's JWT expires (or approaching expiry)
2. Client sends refresh token to /auth/refresh
3. Identity engine validates refresh token
4. Identity engine rotates refresh token (old one invalidated)
5. Identity engine issues new JWT + new refresh token
6. Client stores new tokens
```

### Logout

```
1. Client sends logout request with refresh token
2. Identity engine invalidates refresh token
3. Identity engine adds JWT to blacklist (until natural expiry)
4. Client clears stored tokens
```

---

## Authorization Model

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `MEMBER` | Standard participant | Own profile, capital, opportunities |
| `VETTER` | Trusted reviewer | Above + vote on opportunities |
| `OPERATOR` | Execution manager | Above + manage executions |
| `ADMIN` | System administrator | Full access |

### Permission Matrix

| Resource | MEMBER | VETTER | OPERATOR | ADMIN |
|----------|--------|--------|----------|-------|
| Own profile | RW | RW | RW | RW |
| Other profiles | - | R | R | RW |
| Own capital | RW | RW | RW | RW |
| Pool totals | R | R | R | RW |
| Submit opportunity | W | W | W | W |
| Vote on opportunity | - | W | W | W |
| Approve opportunity | - | - | W | W |
| Start execution | - | - | W | W |
| View all executions | - | R | RW | RW |
| Distribute payouts | - | - | - | W |
| System config | - | - | - | RW |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your available balance is insufficient for this operation",
    "details": {
      "required": 5000.00,
      "available": 3200.00
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-13T10:30:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | State conflict (e.g., duplicate) |
| `INSUFFICIENT_BALANCE` | 422 | Not enough funds |
| `KYC_REQUIRED` | 422 | Operation requires KYC verification |
| `PROVIDER_UNAVAILABLE` | 502 | A provider adapter failed (never leaked as 500) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

Contract errors are typed and stable. Provider failures are mapped to `PROVIDER_UNAVAILABLE` at the adapter boundary — engine and gateway code never sees provider-specific error shapes.

---

## Logging & Observability

Observability is part of the product, not an afterthought. The event stream is the primary record: logs carry `request_id` correlation, audit derives from events, metrics summarize the stream, and traces cross engine boundaries.

### Structured Logging

```go
logger.Info("opportunity submitted",
    "request_id", requestID,
    "member_id", memberID,
    "opportunity_id", oppID,
    "category", category,
    "estimated_value", estimatedValue,
)
```

### Metrics (Prometheus)

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `events_published_total` | Counter | Events by type |
| `outbox_lag_seconds` | Gauge | Outbox → dispatch delay |
| `pool_total_capital` | Gauge | Total capital in pool |
| `pool_deployed_capital` | Gauge | Capital in active executions |
| `opportunities_submitted_total` | Counter | Total opportunities submitted |
| `opportunities_approved_total` | Counter | Total opportunities approved |
| `executions_active` | Gauge | Currently active executions |
| `payouts_distributed_total` | Counter | Total payouts made |
| `provider_errors_total` | Counter | Provider adapter failures by provider |

### Tracing

Distributed tracing via OpenTelemetry for request flow visibility across engines, and across the event dispatch path (publish → dispatch → reactor).

---

## Deployment Architecture

### Delay Complexity: Monolith First

v1 deploys as **one process with clear internal boundaries** — the kernel, engines, and gateway as packages, provider adapters as injectable implementations. Process-per-engine is a deployment decision, not an architectural one; the contracts make that split a configuration change later.

### Development

```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Go API  │  │ MongoDB │  │  Redis  │     │
│  │ :8080   │  │ :27017  │  │ :6379   │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │          Angular Dev Server         │   │
│  │              :4200                  │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

Provider adapters run against sandbox/mock modes in development (Stripe test mode, marketplace sandboxes, in-process notification sink).

### Production

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   API Pod    │    │   API Pod    │    │   API Pod    │
│   (Go)       │    │   (Go)       │    │   (Go)       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  MongoDB     │    │    Redis     │    │     S3       │
│  Cluster     │    │   Cluster    │    │   Storage    │
└──────────────┘    └──────────────┘    └──────────────┘
```

If a capability outgrows the monolith, the engine is extracted as its own process behind the same contract — the rest of the system does not change.

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers scale horizontally
- Engines are stateless except for their owned stores — scaling an engine means scaling its store, not touching other engines
- MongoDB replica set for read scaling
- Redis cluster for cache distribution

### Performance Optimizations
- Connection pooling for MongoDB
- Indexed queries for common access patterns
- Caching for frequently-read data (pool totals, reputation scores) behind `CacheProvider`
- Pagination for all list endpoints
- Event batches dispatched asynchronously; outbox lag is a first-class metric

### Database Indexes

Full index definitions live per-collection in [02-data-model.md](./02-data-model.md). Summary of hot paths:

```javascript
// members collection
{ "email": 1 }                    // unique
{ "status": 1 }                   // filter active members
{ "created_at": -1 }              // recent members

// opportunities collection
{ "status": 1, "created_at": -1 } // list by status
{ "submitted_by": 1 }             // member's opportunities
{ "category": 1, "status": 1 }    // filter by category

// executions collection
{ "status": 1 }                   // active executions
{ "opportunity_id": 1 }           // link to opportunity

// transactions collection
{ "member_id": 1, "created_at": -1 } // member history
{ "type": 1, "created_at": -1 }      // by type
{ "execution_id": 1 }                // execution transactions

// events collection (kernel-owned)
{ "aggregate.type": 1, "aggregate.id": 1, "sequence": 1 } // replay per aggregate
{ "type": 1, "occurred_at": -1 }                           // by event type
{ "request_id": 1 }                                        // correlation lookups
```
