# MERIDIAN — System Overview

## What Is MERIDIAN?

MERIDIAN is a **collective arbitrage engine** — a member-owned platform where participants pool resources to execute arbitrage opportunities and share profits. Unlike traditional investment platforms, MERIDIAN accepts three forms of contribution:

1. **Capital** — Money deposited into the collective pool
2. **Signals** — Actionable arbitrage opportunities (buy X here, sell Y there)
3. **Access** — Credentials, licenses, or resources that enable deals others can't execute

Returns are generated from **real economic activity** — buying assets at one price and selling at another — not from new member deposits.

---

## Core Principles

### 1. Multi-Modal Contribution
Money isn't the only way to participate. A person with sharp eyes and no capital can earn as much as a passive investor with deep pockets.

### 2. Real Value Creation
Every dollar of profit comes from actual buy/sell transactions. The platform has no obligation to pay returns it hasn't earned.

### 3. Meritocratic Reputation
Signal quality matters. Contributors who find profitable opportunities earn more and gain privileges. Those who submit bad signals lose reputation and get throttled.

### 4. Radical Transparency
Every opportunity is visible to members with full financial breakdown. No black-box accounting.

### 5. No Recruitment Dependency
Growth comes from finding better opportunities, not recruiting more members. A smaller group with better signals outperforms a larger group with mediocre ones.

---

## Engineering Principles

MERIDIAN's architecture is built on a small set of rules that keep the system replaceable for years:

- **Everything is replaceable.** MongoDB, Redis, Stripe, eBay, the LLM used for vetting — all are temporary providers behind interfaces. Replacing one must not touch anything outside its adapter.
- **Interfaces are forever.** Engines and providers expose stable contracts (requests, returns, errors, guarantees). Everything else is private.
- **The kernel is tiny and domain-blind.** A small core only receives events, dispatches work, coordinates execution, and records execution. It knows nothing about arbitrage, members, or money.
- **Capabilities, not features.** Not "eBay integration" but a Marketplace capability — eBay, Amazon, and local/wholesale become providers behind it. Not "Stripe" but a Payment capability.
- **Engines publish facts; nobody commands anybody.** Components emit events ("SomethingHappened") and react to events. No engine depends on another engine.
- **Dependencies point inward.** The UI depends on the gateway, the gateway on engines, engines on the kernel — never the reverse.
- **Complexity lives at the edge.** The center stays boring; provider adapters carry the specialized complexity.
- **Every decision is reversible.** We choose interfaces first, providers second. If a better technology appears, it replaces a provider — not the architecture.
- **AI recommends; humans decide.** Automated checks and scoring support vetting; humans make the call.
- **Observability is the product.** Every event is recorded, every action traceable, every execution auditable.

The question that measures every decision:

> "If we completely replace this component tomorrow, how much of the rest of the system must change?" — the ideal answer is **nothing**.

---

## Technology Stack (Current Providers)

No technology below is privileged. Each entry is the *current* provider behind a capability contract — all of them can be swapped without touching the rest of the system.

| Capability | Current Provider | Contract It Satisfies |
|------------|------------------|-----------------------|
| Application runtime | Go (Golang) | Implementation language of the kernel, engines, and adapters |
| Data storage | MongoDB | StorageProvider — engine-owned collections; no shared database |
| Frontend | Angular | UI — depends only on the gateway API |
| API | REST + WebSocket | Gateway contracts — commands, queries, real-time events |
| Authentication | JWT + Refresh Tokens | Identity contract — stateless auth with token rotation |
| File storage | S3-compatible | StorageProvider — documents, images, receipts |
| Background work | Redis-based queue | DispatchProvider — outbox to workers |
| Cache | Redis | CacheProvider — hot data, rate limiting |
| Payments | Stripe / PayPal / crypto | PaymentProvider — deposits and withdrawals |
| Marketplaces | eBay / Amazon / wholesale | MarketplaceProvider — listings and sales |
| Notifications | Email / push / in-app | NotificationProvider — lifecycle messages |
| Vetting intelligence | LLM + OCR (recommendation only) | RecommenderProvider — auto-checks, humans decide |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANGULAR FRONTEND (UI)                       │
│        depends on the gateway only — never anything deeper       │
└─────────────────────────────────────────────────────────────────┘
                              │  REST + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (edge)                         │
│          auth · rate limiting · routing · query composition      │
│                 against engine contracts, not internals          │
└─────────────────────────────────────────────────────────────────┘
                              │  commands + queries
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    MONEY     │    │ OPPORTUNITY  │    │  EXECUTION   │
│   ENGINE     │    │   ENGINE     │    │   ENGINE     │
└──────────────┘    └──────────────┘    └──────────────┘
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    PAYOUT    │    │  REPUTATION  │    │  MEMBER & ID │
│   ENGINE     │    │   ENGINE     │    │   ENGINE     │
└──────────────┘    └──────────────┘    └──────────────┘
        │             publish facts (events)             │
        ▼                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        THE KERNEL (tiny)                         │
│    receives events · dispatches work · coordinates execution     │
│          · records execution (event store + outbox)              │
│        domain-blind: no business logic, no domain terms          │
└─────────────────────────────────────────────────────────────────┘
                              │  dispatch
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROVIDER ADAPTERS (the edge)                  │
│   Payment      Marketplace   Notification   Storage  Recommender │
│  Stripe/PayPal  eBay/Amazon/   email/push/     S3     LLM/OCR   │
│  /crypto       wholesale      in-app                            │
└─────────────────────────────────────────────────────────────────┘
```

Three layers, three rules:

1. **The kernel** is the only shared component. It is boring, small, and knows no domain.
2. **Engines** own capabilities *and their data*. They never call each other — they publish facts and react to facts.
3. **Providers** live at the farthest edge. Swapping one changes nothing outside its adapter.

---

## Domain Entities (Summary)

| Entity | Purpose | Owned By |
|--------|---------|----------|
| **Member** | A registered participant — can contribute capital, signals, or access | Identity & Access + Member engines |
| **Capital Account** | Tracks a member's capital contribution, available balance, locked funds | Money engine |
| **Opportunity** | A submitted arbitrage signal awaiting vetting/execution | Opportunity engine |
| **Execution** | An active operation — funds deployed, assets being acquired/sold | Execution engine |
| **Inventory Item** | A specific asset acquired during execution | Execution engine |
| **Sale** | A completed sale of an inventory item | Execution engine |
| **Payout** | A distribution of profits to a contributor | Payout engine |
| **Reputation Score** | A member's track record across contribution types | Reputation engine |
| **Access Credential** | A registered access resource a member provides | Member & Identity engine |
| **Transaction** | An atomic financial event (deposit, withdrawal, allocation, distribution) | Money engine |
| **Event** | A recorded fact — the kernel's only data | Kernel |

---

## Capabilities (Engines)

Each engine implements one capability and owns the data and logic for it. Engines expose stable contracts; they never depend on each other or on providers.

| Engine | Capability | Responsibility |
|--------|------------|----------------|
| **Identity & Access** | Identity | Registration, login, JWT management, password reset, 2FA, roles, permissions |
| **Member** | Member | Profile management, KYC lifecycle, access credentials, activity history |
| **Money** | Capital & Accounting | Deposits, withdrawals, balance tracking, pool accounting, allocation |
| **Opportunity** | Signals & Vetting | Signal submission, vetting workflow, voting, auto-checks (recommendations) |
| **Execution** | Operations | Funding, acquisition, inventory tracking, listing, sale management |
| **Payout** | Distribution | Profit calculation, distribution, payout history |
| **Reputation** | Scoring | Scoring, tier management, privilege calculation |
| **Notification** | Notification | Outbound lifecycle messages via notification providers |
| **Admin** | Oversight | System configuration, member management, oversight tools |

---

## Providers at the Edge

Providers are adapters behind contracts. Adding a new provider (new marketplace, new payment rail, new email service) means **adding** an adapter — never editing an engine or the kernel.

| Capability | Contract | Providers (current) |
|------------|----------|---------------------|
| Payment | `PaymentProvider` | Stripe, PayPal, Coinbase (crypto) |
| Marketplace | `MarketplaceProvider` | eBay, Amazon, local/wholesale |
| Notification | `NotificationProvider` | Email (SES/SendGrid), push (FCM/APNs), in-app |
| Storage | `StorageProvider` | S3-compatible |
| Recommendation | `RecommenderProvider` | LLM (fraud/math checks), OCR (KYC extraction) — recommendations only, humans decide |
| Dispatch | `DispatchProvider` | Redis queue (in-process first, external later) |
| Cache | `CacheProvider` | Redis |

---

## API Design Principles

1. **Contract-first** — Every endpoint maps to an engine contract. Responses never leak engine internals.
2. **RESTful** — Standard HTTP verbs, resource-oriented URLs
3. **Consistent Response Format** — All responses follow `{ success, data, error, meta }` structure
4. **Pagination** — All list endpoints support cursor-based pagination
5. **Versioning** — API versioned via URL prefix (`/api/v1/`)
6. **Rate Limiting** — Per-endpoint limits based on member tier
7. **Idempotency** — Mutation endpoints support idempotency keys for safe retries
8. **Audit Trail** — Every mutation creates an audit log entry (derived from the event stream)

---

## Security Model

### Authentication
- JWT access tokens (15-minute expiry)
- Refresh tokens (7-day expiry, rotated on use)
- Optional 2FA (TOTP)

### Authorization
- Role-based access control (Member, Vetter, Operator, Admin)
- Resource-level permissions (own data vs. collective data)
- Action-specific guards (e.g., withdrawal requires KYC)

### Data Protection
- Encryption at rest (MongoDB encryption)
- Encryption in transit (TLS 1.3)
- PII segregation (sensitive fields in separate collection)
- Audit logging for all sensitive operations (from the event stream)

### Architectural Security
- Secrets live only in provider adapters — engines and the kernel never hold credentials
- Provider credentials are injected at the composition root, never hardcoded
- Every action is traceable through the event stream

---

## Documentation Structure

```
docs/
├── 00-system-overview.md          ← You are here
├── 00-goal-analysis.md            ← Goal, objectives, and the AUTO compass
├── 01-architecture.md             ← Technical architecture deep-dive
├── 02-data-model.md               ← Collections, ownership, and schemas
│
├── journeys/
│   ├── 01-registration.md         ← New member onboarding
│   ├── 02-capital-contribution.md ← Depositing funds
│   ├── 03-signal-submission.md    ← Submitting an opportunity
│   ├── 04-vetting-process.md      ← How opportunities get approved
│   ├── 05-execution-flow.md       ← From approval to liquidation
│   ├── 06-payout-distribution.md  ← How profits are split
│   └── 07-withdrawal.md           ← Taking money out
│
├── money/
│   ├── 01-pool-accounting.md      ← How the capital pool works
│   ├── 02-profit-calculation.md   ← How profits are computed
│   ├── 03-distribution-rules.md   ← The split formula
│   ├── 04-fee-structure.md        ← Platform fees
│   └── 05-risk-reserves.md        ← Buffer and loss handling
│
├── apis/
│   ├── 00-api-conventions.md      ← Common patterns and formats
│   ├── 01-auth-api.md             ← Authentication endpoints
│   ├── 02-member-api.md           ← Member management
│   ├── 03-capital-api.md          ← Capital operations
│   ├── 04-opportunity-api.md      ← Signal management
│   ├── 05-execution-api.md        ← Execution tracking
│   ├── 06-payout-api.md           ← Payout operations
│   ├── 07-reputation-api.md       ← Reputation queries
│   ├── 08-marketplace-api.md      ← Resale channel integration
│   └── 09-admin-api.md            ← Administrative functions
│
├── engines/                       ← Engine internals (one per capability)
│   ├── identity-engine.md         ← Identity & access internals
│   ├── member-engine.md           ← Member/KYC/access internals
│   ├── money-engine.md            ← Capital & accounting internals
│   ├── opportunity-engine.md      ← Signal & vetting internals
│   ├── execution-engine.md        ← Operations internals
│   ├── payout-engine.md           ← Distribution internals
│   ├── reputation-engine.md       ← Scoring internals
│   ├── notification-engine.md     ← Notification internals
│   └── admin-engine.md            ← Oversight internals
│
├── providers/                     ← Adapter contracts and implementations
│   ├── payment-providers.md       ← Stripe, PayPal, crypto
│   ├── marketplace-providers.md   ← eBay, Amazon, wholesale
│   ├── notification-providers.md  ← Email, push, in-app
│   ├── storage-providers.md       ← S3-compatible
│   └── recommendation-providers.md← LLM/OCR (recommend only, humans decide)
│
└── frontend/
    ├── 00-frontend-overview.md    ← Angular app structure
    ├── 01-state-management.md     ← NgRx store design
    ├── 02-routing.md              ← Route structure
    ├── 03-components.md           ← Shared components
    └── 04-pages.md                ← Page modules
```

---

## Next Steps

1. Read [01-architecture.md](./01-architecture.md) for the kernel/engine/provider deep-dive
2. Read [02-data-model.md](./02-data-model.md) for collection ownership and schemas
3. Explore [journeys/](./journeys/) for user flow documentation
4. Review [apis/](./apis/) for endpoint specifications
