# MERIDIAN — Data Model (MongoDB)

## Overview

MongoDB is the **current storage provider** — nothing more. Collections are not shared; they are owned. Each engine owns the collections for its capability and reads them only through its contract. The kernel owns the event stream (the record of execution). Providers own nothing: their external state is referenced only through opaque provider keys and provider-side IDs stored inside engine-owned documents.

| Owner | Collections |
|-------|-------------|
| **Kernel** | `events`, `audit_logs` (derived) |
| **Identity & Access engine** | `members` (auth portion) |
| **Member engine** | `members` (profile/KYC portion), `member_kyc`, `access_credentials` |
| **Money engine** | `capital_accounts`, `transactions`, `pool_snapshots` |
| **Opportunity engine** | `opportunities`, `opportunity_votes` |
| **Execution engine** | `executions`, `inventory` |
| **Payout engine** | `payouts` |
| **Reputation engine** | `reputation_scores` |
| **Community engine** | `communities`, `community_members` |
| **Governance engine** | `governance_proposals`, `governance_votes`, `governance_actions` |
| **Notification engine** | `notifications` |
| **Admin engine** | `system_config` |

Two consequences of this ownership model:

1. **No engine reads another engine's collections.** Cross-engine data access happens through contracts (queries) and events (facts).
2. **State changes are written transactionally with their events** (outbox pattern) — an engine's state change and the fact describing it land in the same transaction, so nothing is ever lost.

---

## Collection: `events`

**Owner:** Kernel — the kernel's only data. Domain-blind: it stores no domain meaning, only facts.

**Purpose:** Append-only record of everything that happened. Written transactionally with the state change each event describes (outbox pattern). The source of truth for the audit trail, real-time fan-out, projections, and metrics. Note: v1 treats engine collections as source-of-truth-with-events (not full event sourcing) — the event stream is complete enough to rebuild read models later if that ever becomes necessary.

```javascript
{
  "_id": ObjectId,

  "type": String,                    // e.g. "execution.funded", "capital.allocated"
  "version": Number,                 // payload schema version

  "aggregate": {
    "type": String,                  // e.g. "execution", "opportunity", "member"
    "id": ObjectId
  },

  "payload": Object,                 // shape determined by type + version

  "actor": {
    "type": String,                  // MEMBER | SYSTEM | ADMIN | PROVIDER
    "id": ObjectId                   // member_id where applicable
  },

  "request_id": String,              // correlation ID linking to audit_logs and logs
  "occurred_at": Date,
  "sequence": Number                 // monotonic sequence for ordered replay
}
```

**Indexes:**
```javascript
{ "aggregate.type": 1, "aggregate.id": 1, "sequence": 1 } // ordered replay per aggregate
{ "type": 1, "occurred_at": -1 }                            // by event type
{ "request_id": 1 }                                          // correlation lookups
```

---

## Collection: `members`

**Purpose:** Core member identity and authentication.
**Owner:** Identity & Access engine (auth fields) and Member engine (profile/KYC fields) — exposed to the rest of the system only through contracts.

```javascript
{
  "_id": ObjectId,
  "email": String,                    // unique, indexed
  "password_hash": String,            // bcrypt hash
  "status": String,                   // PENDING | ACTIVE | SUSPENDED | BANNED
  
  "profile": {
    "first_name": String,
    "last_name": String,
    "display_name": String,
    "phone": String,
    "country": String,
    "timezone": String,
    "avatar_url": String
  },
  
  "roles": [String],                  // ["MEMBER", "VETTER", "OPERATOR", "ADMIN"]
  
  "kyc_status": String,               // NOT_STARTED | PENDING | VERIFIED | REJECTED
  "kyc_verified_at": Date,
  
  "two_factor_enabled": Boolean,
  "two_factor_secret": String,        // encrypted
  
  "contribution_types": [String],     // ["CAPITAL", "SIGNAL", "ACCESS"]
  
  "settings": {
    "email_notifications": Boolean,
    "push_notifications": Boolean,
    "newsletter": Boolean
  },
  
  "created_at": Date,
  "updated_at": Date,
  "last_login_at": Date,
  "email_verified_at": Date
}
```

**Indexes:**
```javascript
{ "email": 1 }                        // unique
{ "status": 1 }
{ "kyc_status": 1 }
{ "roles": 1 }
{ "created_at": -1 }
```

---

## Collection: `member_kyc`

**Purpose:** KYC documents and verification records.
**Owner:** Member engine.
**Human control:** `verification_result.verified_by` of `"SYSTEM"` means a *recommendation* from a RecommenderProvider (OCR/LLM), never a decision. A human (admin) always makes the final verification call.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members
  
  "documents": [{
    "type": String,                   // PASSPORT | DRIVERS_LICENSE | NATIONAL_ID | PROOF_OF_ADDRESS
    "file_url": String,               // S3 path
    "file_hash": String,              // for integrity
    "uploaded_at": Date,
    "status": String,                 // PENDING | VERIFIED | REJECTED
    "rejection_reason": String
  }],
  
  "extracted_data": {
    "full_name": String,
    "date_of_birth": Date,
    "nationality": String,
    "document_number": String,
    "expiry_date": Date,
    "address": {
      "street": String,
      "city": String,
      "state": String,
      "postal_code": String,
      "country": String
    }
  },
  
  "verification_result": {
    "status": String,                 // PENDING | VERIFIED | REJECTED
    "verified_by": String,            // "SYSTEM" | member_id (admin)
    "verified_at": Date,
    "rejection_reason": String,
    "risk_score": Number,             // 0-100
    "flags": [String]                 // ["HIGH_RISK_COUNTRY", "DOCUMENT_EXPIRED", etc.]
  },
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1 }                    // unique
{ "verification_result.status": 1 }
```

---

## Collection: `capital_accounts`

**Purpose:** Per-member capital tracking.
**Owner:** Money engine.
**Providers:** `deposit_address` keys (`btc`, `eth`, `usdc`) are provider keys for crypto payment rails — the Money engine never depends on a specific rail's internals. `withdrawal_methods[].type` values (BANK_ACCOUNT, PAYPAL, CRYPTO) map to PaymentProvider adapters.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members, unique
  
  "balances": {
    "available": Decimal128,          // withdrawable balance
    "locked": Decimal128,             // in active executions
    "pending_deposit": Decimal128,    // awaiting confirmation
    "pending_withdrawal": Decimal128  // withdrawal in progress
  },
  
  "lifetime": {
    "total_deposited": Decimal128,
    "total_withdrawn": Decimal128,
    "total_earned": Decimal128,       // profit distributions
    "total_deployed": Decimal128      // capital used in executions
  },
  
  "currency": String,                 // USD (primary)
  
  "deposit_address": {                // for crypto deposits
    "btc": String,
    "eth": String,
    "usdc": String
  },
  
  "withdrawal_methods": [{
    "id": String,
    "type": String,                   // BANK_ACCOUNT | PAYPAL | CRYPTO
    "details": Object,                // varies by type
    "is_default": Boolean,
    "verified": Boolean,
    "added_at": Date
  }],
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1 }                    // unique
```

---

## Collection: `transactions`

**Purpose:** Immutable ledger of all financial movements.
**Owner:** Money engine.
**Providers:** `external.provider` is an opaque provider key (STRIPE, PAYPAL, COINBASE) and `external.provider_id` is the provider's own reference. The engine stores keys, never provider internals or credentials; the adapter owns the mapping.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members
  
  "type": String,                     // DEPOSIT | WITHDRAWAL | ALLOCATION | RELEASE | DISTRIBUTION | FEE | ADJUSTMENT
  "status": String,                   // PENDING | COMPLETED | FAILED | REVERSED
  
  "amount": Decimal128,               // positive = credit, negative = debit
  "currency": String,                 // USD
  
  "balance_before": Decimal128,
  "balance_after": Decimal128,
  
  "reference": {
    "type": String,                   // EXECUTION | PAYOUT | EXTERNAL
    "id": ObjectId                    // ref to related entity
  },
  
  "external": {                       // for deposits/withdrawals
    "provider": String,               // STRIPE | PAYPAL | COINBASE
    "provider_id": String,            // external transaction ID
    "method": String,                 // CARD | BANK | CRYPTO
    "fee": Decimal128
  },
  
  "description": String,
  "metadata": Object,                 // arbitrary context
  
  "idempotency_key": String,          // for safe retries
  
  "created_at": Date,
  "completed_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1, "created_at": -1 }
{ "type": 1, "status": 1 }
{ "reference.type": 1, "reference.id": 1 }
{ "idempotency_key": 1 }              // unique, sparse
{ "created_at": -1 }
```

---

## Collection: `opportunities`

**Purpose:** Submitted arbitrage signals.
**Owner:** Opportunity engine.
**Human control:** `vetting.auto_checks` are RecommenderProvider assessments (duplicate/fraud/math) — they inform the decision; the vetting vote (human) is the decision.

```javascript
{
  "_id": ObjectId,
  "submitted_by": ObjectId,           // ref: members
  
  "title": String,
  "description": String,
  
  "category": String,                 // RETAIL_ARBITRAGE | LIQUIDATION | VEHICLE | REAL_ESTATE | DIGITAL | COMMODITY | EVENT
  
  "details": {
    "source": {
      "name": String,                 // "Best Buy", "Manheim Auction", etc.
      "url": String,
      "location": String              // city/state or "online"
    },
    "acquisition": {
      "estimated_cost": Decimal128,
      "quantity": Number,
      "unit": String,                 // "units", "lot", "property"
      "deadline": Date                // auction date, sale end, etc.
    },
    "resale": {
      "estimated_value": Decimal128,
      "channels": [String],           // ["ebay", "amazon", "wholesale"]
      "time_to_liquidate": String     // "1 week", "1 month", etc.
    },
    "requirements": {
      "capital_needed": Decimal128,
      "access_needed": [String],      // ["dealer_license", "wholesale_account"]
      "skills_needed": [String]       // ["appraisal", "shipping"]
    }
  },
  
  "financials": {
    "estimated_profit": Decimal128,
    "estimated_roi": Number,          // percentage
    "risk_level": String,             // LOW | MEDIUM | HIGH
    "confidence": String              // LOW | MEDIUM | HIGH
  },
  
  "evidence": [{
    "type": String,                   // SCREENSHOT | LINK | DOCUMENT
    "url": String,
    "description": String,
    "uploaded_at": Date
  }],
  
  "status": String,                   // DRAFT | SUBMITTED | VETTING | APPROVED | REJECTED | EXPIRED | EXECUTED
  
  "vetting": {
    "started_at": Date,
    "completed_at": Date,
    "result": String,                 // APPROVED | REJECTED
    "rejection_reason": String,
    "auto_checks": {
      "duplicate_check": Boolean,
      "fraud_check": Boolean,
      "math_validation": Boolean
    },
    "votes": {
      "approve": Number,
      "reject": Number,
      "required": Number              // votes needed for decision
    }
  },
  
  "created_at": Date,
  "updated_at": Date,
  "submitted_at": Date,
  "expires_at": Date
}
```

**Indexes:**
```javascript
{ "status": 1, "created_at": -1 }
{ "submitted_by": 1, "created_at": -1 }
{ "category": 1, "status": 1 }
{ "vetting.result": 1 }
```

---

## Collection: `opportunity_votes`

**Purpose:** Individual vetting votes on opportunities.
**Owner:** Opportunity engine.

```javascript
{
  "_id": ObjectId,
  "opportunity_id": ObjectId,         // ref: opportunities
  "voter_id": ObjectId,               // ref: members
  
  "vote": String,                     // APPROVE | REJECT
  "confidence": String,               // LOW | MEDIUM | HIGH
  "comment": String,
  
  "created_at": Date
}
```

**Indexes:**
```javascript
{ "opportunity_id": 1, "voter_id": 1 } // unique compound
{ "opportunity_id": 1 }
```

---

## Collection: `executions`

**Purpose:** Active and completed arbitrage operations.
**Owner:** Execution engine.
**Events:** each status change (`FUNDING`, `ACQUIRING`, `HOLDING`, `LIQUIDATING`, `COMPLETED`, `FAILED`, `CANCELLED`) is written alongside its event (`execution.funded`, `execution.item_sold`, `execution.completed`, ...) in the same transaction.

```javascript
{
  "_id": ObjectId,
  "opportunity_id": ObjectId,         // ref: opportunities
  
  "status": String,                   // FUNDING | ACQUIRING | HOLDING | LIQUIDATING | COMPLETED | FAILED | CANCELLED
  
  "participants": {
    "signal_contributor": ObjectId,   // ref: members (from opportunity)
    "access_contributor": ObjectId,   // ref: members (if applicable)
    "operator": ObjectId              // ref: members (execution manager)
  },
  
  "capital": {
    "allocated": Decimal128,          // total capital committed
    "spent": Decimal128,              // actual acquisition cost
    "recovered": Decimal128,          // from sales
    "contributors": [{
      "member_id": ObjectId,
      "amount": Decimal128,
      "percentage": Number            // share of capital pool used
    }]
  },
  
  "timeline": {
    "approved_at": Date,
    "funding_completed_at": Date,
    "acquisition_started_at": Date,
    "acquisition_completed_at": Date,
    "liquidation_started_at": Date,
    "liquidation_completed_at": Date,
    "closed_at": Date
  },
  
  "acquisition": {
    "method": String,                 // AUCTION | DIRECT_PURCHASE | WHOLESALE
    "vendor": String,
    "invoice_url": String,
    "total_cost": Decimal128,
    "fees": Decimal128,
    "shipping": Decimal128
  },
  
  "logistics": {
    "storage_location": String,
    "shipping_provider": String,
    "tracking_numbers": [String]
  },
  
  "financials": {
    "gross_revenue": Decimal128,
    "total_costs": Decimal128,
    "net_profit": Decimal128,
    "roi": Number,                    // percentage
    "platform_fee": Decimal128
  },
  
  "notes": [{
    "author_id": ObjectId,
    "content": String,
    "created_at": Date
  }],
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "status": 1 }
{ "opportunity_id": 1 }
{ "participants.signal_contributor": 1 }
{ "participants.access_contributor": 1 }
{ "created_at": -1 }
```

---

## Collection: `inventory`

**Purpose:** Individual items acquired during executions.
**Owner:** Execution engine.
**Providers:** `listing.channel` (EBAY, AMAZON, LOCAL, WHOLESALE) is a MarketplaceProvider key; `listing.listing_id` is the provider's own reference. Adding a marketplace means adding an adapter — the schema does not change.

```javascript
{
  "_id": ObjectId,
  "execution_id": ObjectId,           // ref: executions
  
  "name": String,
  "description": String,
  "category": String,
  "sku": String,                      // if applicable
  
  "acquisition": {
    "cost": Decimal128,
    "quantity": Number,
    "unit_cost": Decimal128,
    "acquired_at": Date
  },
  
  "condition": String,                // NEW | LIKE_NEW | GOOD | FAIR | PARTS
  
  "status": String,                   // IN_TRANSIT | IN_STORAGE | LISTED | SOLD | RETURNED
  
  "listing": {
    "channel": String,                // EBAY | AMAZON | LOCAL | WHOLESALE
    "listing_id": String,             // external listing ID
    "listing_url": String,
    "list_price": Decimal128,
    "listed_at": Date
  },
  
  "sale": {
    "sold_at": Date,
    "sale_price": Decimal128,
    "fees": Decimal128,               // marketplace fees
    "shipping_cost": Decimal128,
    "net_proceeds": Decimal128,
    "buyer_info": String
  },
  
  "images": [{
    "url": String,
    "is_primary": Boolean
  }],
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "execution_id": 1 }
{ "status": 1 }
{ "listing.channel": 1, "status": 1 }
```

---

## Collection: `payouts`

**Purpose:** Profit distribution records.
**Owner:** Payout engine.
**Events:** created on `execution.completed`; `distributions[].transaction_id` links to the Money engine's ledger via the transaction contract.

```javascript
{
  "_id": ObjectId,
  "execution_id": ObjectId,           // ref: executions
  
  "status": String,                   // PENDING | PROCESSING | COMPLETED | FAILED
  
  "totals": {
    "gross_profit": Decimal128,
    "platform_fee": Decimal128,
    "distributable": Decimal128       // gross_profit - platform_fee
  },
  
  "distributions": [{
    "member_id": ObjectId,
    "type": String,                   // CAPITAL | SIGNAL | ACCESS | OPERATIONS
    "percentage": Number,             // share percentage
    "amount": Decimal128,
    "transaction_id": ObjectId,       // ref: transactions
    "status": String                  // PENDING | COMPLETED | FAILED
  }],
  
  "created_at": Date,
  "processed_at": Date,
  "completed_at": Date
}
```

**Indexes:**
```javascript
{ "execution_id": 1 }
{ "status": 1 }
{ "distributions.member_id": 1 }
```

---

## Collection: `reputation_scores`

**Purpose:** Member reputation tracking.
**Owner:** Reputation engine — recalculated as a reaction to member-relevant events; the engine never asks other engines for data.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members, unique
  
  "overall_score": Number,            // 0-1000
  "tier": String,                     // BRONZE | SILVER | GOLD | PLATINUM
  
  "signal_score": {
    "score": Number,                  // 0-100
    "total_submitted": Number,
    "total_approved": Number,
    "total_executed": Number,
    "approval_rate": Number,          // percentage
    "avg_roi": Number,                // average ROI of executed signals
    "total_profit_generated": Decimal128
  },
  
  "capital_score": {
    "score": Number,                  // 0-100
    "tenure_days": Number,
    "avg_balance": Decimal128,
    "total_contributed": Decimal128,
    "stability_score": Number         // based on withdrawal patterns
  },
  
  "access_score": {
    "score": Number,                  // 0-100
    "credentials_registered": Number,
    "times_utilized": Number,
    "success_rate": Number,           // percentage
    "total_value_enabled": Decimal128
  },
  
  "community_score": {
    "score": Number,                  // 0-100
    "vetting_participation": Number,
    "accurate_votes": Number,
    "helpful_comments": Number
  },
  
  "history": [{
    "date": Date,
    "overall_score": Number,
    "tier": String,
    "event": String                   // what caused the change
  }],
  
  "privileges": {
    "can_vet": Boolean,
    "can_operate": Boolean,
    "signal_share_bonus": Number,     // percentage bonus (0-5)
    "capital_share_bonus": Number,
    "max_signal_size": Decimal128,    // max opportunity size allowed
    "vetting_weight": Number          // vote weight multiplier
  },
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1 }                    // unique
{ "overall_score": -1 }
{ "tier": 1 }
```

---

## Collection: `access_credentials`

**Purpose:** Registered access resources members provide.
**Owner:** Member engine.
**Human control:** `verification.status` is set by a human (admin); automated checks may only recommend.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members
  
  "type": String,                     // DEALER_LICENSE | WHOLESALE_ACCOUNT | WAREHOUSE | AUCTION_ACCESS | REGIONAL_PRESENCE
  "name": String,
  "description": String,
  
  "details": {
    // varies by type
    "license_number": String,
    "issuing_authority": String,
    "location": String,
    "capacity": String,
    "restrictions": [String]
  },
  
  "verification": {
    "status": String,                 // PENDING | VERIFIED | REJECTED
    "verified_at": Date,
    "verified_by": ObjectId,
    "documents": [{
      "type": String,
      "url": String,
      "uploaded_at": Date
    }]
  },
  
  "availability": {
    "is_available": Boolean,
    "next_available_at": Date,
    "blackout_dates": [{ start: Date, end: Date }]
  },
  
  "usage": {
    "times_used": Number,
    "total_value_enabled": Decimal128,
    "last_used_at": Date
  },
  
  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1 }
{ "type": 1, "verification.status": 1 }
{ "availability.is_available": 1 }
```

---

## Collection: `pool_snapshots`

**Purpose:** Point-in-time state of the collective pool — an observability artifact owned by the Money engine, produced by its own aggregation over `capital_accounts` and `transactions`.

```javascript
{
  "_id": ObjectId,
  
  "timestamp": Date,
  "type": String,                     // HOURLY | DAILY | WEEKLY | MONTHLY
  
  "capital": {
    "total_available": Decimal128,
    "total_locked": Decimal128,
    "total_pending": Decimal128,
    "reserve_balance": Decimal128
  },
  
  "members": {
    "total_members": Number,
    "active_contributors": Number,
    "capital_contributors": Number,
    "signal_contributors": Number,
    "access_contributors": Number
  },
  
  "activity": {
    "opportunities_submitted": Number,
    "opportunities_approved": Number,
    "executions_active": Number,
    "executions_completed": Number
  },
  
  "financials": {
    "total_profit_ytd": Decimal128,
    "total_distributed_ytd": Decimal128,
    "avg_roi": Number,
    "platform_fees_ytd": Decimal128
  },
  
  "created_at": Date
}
```

**Indexes:**
```javascript
{ "timestamp": -1 }
{ "type": 1, "timestamp": -1 }
```

---

## Collection: `audit_logs`

**Purpose:** System-wide audit trail.
**Owner:** Kernel — a **derived read model** over the `events` collection, generated for convenient querying (before/after state, resource history). The event stream is the source of truth; `audit_logs` can always be rebuilt from it.

```javascript
{
  "_id": ObjectId,
  
  "actor": {
    "type": String,                   // MEMBER | SYSTEM | ADMIN
    "id": ObjectId,                   // member_id if applicable
    "ip_address": String,
    "user_agent": String
  },
  
  "action": String,                   // e.g., "member.created", "opportunity.approved", "payout.distributed"
  "resource": {
    "type": String,                   // e.g., "member", "opportunity", "execution"
    "id": ObjectId
  },
  
  "details": {
    "before": Object,                 // previous state (for updates)
    "after": Object,                  // new state
    "metadata": Object                // additional context
  },
  
  "request_id": String,               // correlation ID
  "timestamp": Date
}
```

**Indexes:**
```javascript
{ "timestamp": -1 }
{ "actor.id": 1, "timestamp": -1 }
{ "action": 1, "timestamp": -1 }
{ "resource.type": 1, "resource.id": 1 }
```

---

## Collection: `notifications`

**Purpose:** Member notification records.
**Owner:** Notification engine.
**Providers:** each channel (`in_app`, `email`, `push`) is delivered by a NotificationProvider adapter. The engine records delivery state per channel; it never depends on a specific email/push vendor.

```javascript
{
  "_id": ObjectId,
  "member_id": ObjectId,              // ref: members
  
  "type": String,                     // KYC_APPROVED | OPPORTUNITY_APPROVED | PAYOUT_READY | etc.
  "title": String,
  "body": String,
  
  "channels": {
    "in_app": { sent: Boolean, read: Boolean, read_at: Date },
    "email": { sent: Boolean, sent_at: Date },
    "push": { sent: Boolean, sent_at: Date }
  },
  
  "reference": {
    "type": String,
    "id": ObjectId
  },
  
  "priority": String,                 // LOW | NORMAL | HIGH | URGENT
  
  "created_at": Date,
  "expires_at": Date
}
```

**Indexes:**
```javascript
{ "member_id": 1, "created_at": -1 }
{ "member_id": 1, "channels.in_app.read": 1 }
{ "type": 1 }
```

---

## Collection: `system_config`

**Purpose:** Runtime configuration values.
**Owner:** Admin engine. Domain-blind rule: the kernel holds **no** configuration — domain values (shares, thresholds, tiers) belong here, in the engines that read them.

**Provider registry:** active providers per capability are configuration, so switching a provider is a config change plus wiring an adapter — no engine edits.

**Governance:** Community-Governed Parameters (see `00-goal-analysis.md`) carry provenance — proposer, decision date, vote tally — and are set only through a Governance Vote, never by the platform. Integrity safety rails are never votable values.

```javascript
{
  "_id": ObjectId,
  "key": String,                      // unique
  "value": Mixed,
  "type": String,                     // STRING | NUMBER | BOOLEAN | JSON
  "description": String,
  "updated_by": ObjectId,
  "updated_at": Date
}
```

**Example configurations:**
```javascript
{ key: "pool.reserve_percentage", value: 20, type: "NUMBER" }  // Community-Governed Parameter — set via Governance Vote, with provenance
{ key: "payout.capital_share", value: 55, type: "NUMBER" }
{ key: "payout.signal_share", value: 25, type: "NUMBER" }
{ key: "payout.access_share", value: 10, type: "NUMBER" }
{ key: "payout.operations_share", value: 5, type: "NUMBER" }
{ key: "payout.platform_share", value: 5, type: "NUMBER" }
{ key: "opportunity.max_single_allocation", value: 15, type: "NUMBER" }
{ key: "vetting.votes_required", value: 3, type: "NUMBER" }
{ key: "withdrawal.min_amount", value: 50, type: "NUMBER" }
{ key: "withdrawal.processing_days", value: 3, type: "NUMBER" }
```

**Indexes:**
```javascript
{ "key": 1 }                          // unique
```

---

## Collection: `communities`

**Owner:** Community engine. Added 2026-08-10 per `GRILL-communities.txt`. v1 ships with exactly one record (id `community.default`) seeded at startup.

**Purpose:** Directory of community entities — the "this is the cooperative" object that an Execution reads to know which pool it draws from, that Governance scopes parameter proposals against, that Money binds to a pool.

```javascript
{
  "_id": ObjectId,

  "name": String,                       // "MERIDIAN Alpha"
  "focus": String,                      // "general_arbitrage" | "electronics" | ...
  "geographic_scope": String,           // "global" | "north_america" | "europe" | ...
  "status": String,                     // "active" | "proposed" | "archived"
  "founded_at": Date,

  "min_contribution": Decimal,          // community-level minimum capital contribution
  "settings": {
    "open_enrollment": Boolean,
    "require_kyc_at_join": Boolean,    // default true
    "vetter_auto_promotion": Boolean
  },

  "created_at": Date,
  "updated_at": Date
}
```

**Indexes:**
```javascript
{ "status": 1 }                          // list by status
{ "name": 1 }                            // unique
```

---

## Collection: `community_members`

**Owner:** Community engine. Added 2026-08-10 per `GRILL-communities.txt`.

**Purpose:** Membership graph — which member is part of which community, with what contribution type. Separated from the entity itself so a member can (in future) be part of multiple communities.

```javascript
{
  "_id": ObjectId,

  "community_id": ObjectId,
  "member_id": ObjectId,

  "contribution_type": String,           // "capital" | "signal" | "access" | "operator" | "admin"
  "joined_at": Date,

  "created_at": Date
}
```

**Indexes:**
```javascript
{ "community_id": 1, "member_id": 1 }    // unique
{ "member_id": 1 }                       // reverse lookup
```

---

## Collection: `governance_proposals`

**Owner:** Governance engine. Added 2026-08-10 per `GRILL-governance.txt`.

**Purpose:** Lifecycle state for any community-decided change. Two `target_type` values: `PARAMETER` (proposes a `system_config` value) and `COMMUNITY_CREATION` (proposes spawning a new community).

```javascript
{
  "_id": ObjectId,

  "target_type": String,                 // "PARAMETER" | "COMMUNITY_CREATION"
  "parameter_key": String,               // when target_type=PARAMETER; e.g. "governance.roi_floor"
  "community_payload": {                 // when target_type=COMMUNITY_CREATION
    "name": String,
    "focus": String,
    "geographic_scope": String,
    "min_contribution": Decimal
  },

  "current_value": Mixed,                // snapshot at submission time, used for provenance
  "proposed_value": Mixed,
  "rationale": String,

  "proposer_id": ObjectId,
  "status": String,                      // "voting" | "passed" | "rejected" | "expired" | "withdrawn"
  "required_weighted_votes": Number,
  "expires_at": Date,
  "applied_at": Date | null,             // set when recipient engine applies

  "created_at": Date,
  "updated_at": Date
}
```

**Event references:**
- `governance.proposal.submitted` (created with status=PROPOSED → flipped to VOTING on first vote)
- `governance.proposal.passed` (flips status to PASSED)
- `governance.proposal.rejected` (flips status to REJECTED)
- `governance.proposal.withdrawn` (flips status to WITHDRAWN)
- `governance.proposal.expired` (flips status to EXPIRED)

---

## Collection: `governance_votes`

**Owner:** Governance engine. Added 2026-08-10.

**Purpose:** One row per vote. Weight is snapshotted at vote time from `vetting_weight` so future reputation changes do not retroactively shift past decisions.

```javascript
{
  "_id": ObjectId,

  "proposal_id": ObjectId,
  "voter_id": ObjectId,

  "vote": String,                        // "approve" | "reject"
  "weight": Number,                      // snapshot of vetting_weight at cast time
  "comment": String | null,

  "voted_at": Date
}
```

**Indexes:**
```javascript
{ "proposal_id": 1, "voter_id": 1 }      // unique, enforces one vote per member per proposal
{ "proposal_id": 1 }                     // tally lookup
```

---

## Collection: `governance_actions`

**Owner:** Governance engine. Added 2026-08-10.

**Purpose:** Append-only audit trail of state transitions on proposals. Generated automatically by the Governance engine when a proposal changes status — never written from outside, never edited. The "decision provenance" the goals doc requires.

```javascript
{
  "_id": ObjectId,

  "proposal_id": ObjectId,
  "action_type": String,                 // "passed" | "rejected" | "applied" | "withdrawn" | "expired"
  "actor_id": ObjectId,                  // member_id or system
  "detail": Object,                      // optional structured detail (e.g. weighted tallies)

  "occurred_at": Date
}
```

**Indexes:**
```javascript
{ "proposal_id": 1, "occurred_at": -1 }  // audit timeline per proposal
```
