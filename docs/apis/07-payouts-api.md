# Payouts API

## Overview

Payout distribution endpoints: a **pool-wide payout ledger**, a member's
personal payout history with an earnings summary, single-payout detail, and the
**system/internal** endpoint that creates a distribution when an execution
completes.

> **Backend status:** the frontend `ApiClient` + `MockGateway` already serve
> these shapes, but no backend exists yet. This document is the backend
> contract. Canonical shapes live in
> `frontend/src/app/core/models/payout.ts` (see [Canonical models](#canonical-models)).

> **Prior art:** the member + detail endpoints trace to
> `docs/journeys/06-payout-distribution.md` and `docs/02-data-model.md` payout
> conventions. The **pool-wide GET /payouts ledger was NOT previously
> documented** — it is first defined here (see
> [Conflicts / Open Questions](#conflicts--open-questions)).

---

## Endpoints Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/payouts` | Pool-wide payout ledger | Member |
| GET | `/members/me/payouts` | Signed-in member's payouts + summary | Member |
| GET | `/payouts/{id}` | Single payout detail (ledger-row shape) | Member |
| POST | `/payouts` | Create payout distribution | System/internal only |

---

## Conventions for This API

| Convention | Rule | Example |
|-----------|------|---------|
| Money (`amount`) | **String** type, always with cents, no currency symbol | `"2340.80"` |
| Percentages (`share`) | Number | `46` |
| IDs | String, prefixed `pay_`, `exec_`, `mem_` | `pay_x7k3n9` |
| Dates | ISO 8601 | `2026-03-14T09:12:41Z` |
| Enums | UPPER_SNAKE_CASE (`PayoutType`, `PayoutStatus`) | `CAPITAL`, `COMPLETED` |

> **Money-as-STRING** is the canonical convention (00-api-conventions.md §Field
> Conventions): amounts are decimal strings so precision is not lost to float
> arithmetic. `share` is a number because it is a 0–100 percentage, not money.

### PayoutType

| Value | Meaning |
|-------|---------|
| `CAPITAL` | Return/share from capital contribution |
| `SIGNAL` | Share to the member who found the opportunity |
| `ACCESS` | Share to the member who provided access |
| `OPERATIONS` | Share to operators who executed the deal |

> `OPERATIONS` is part of the canonical type (journey 06 splits) even though
> the current wireframe ledger UI only surfaces CAPITAL/SIGNAL/ACCESS rows.

### PayoutStatus

| Value | Meaning |
|-------|---------|
| `PENDING` | Distribution calculated, not yet paid |
| `COMPLETED` | Distribution credited to member wallet |

---
## GET /payouts

Pool-wide payout ledger — every distribution across all executions.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |
| type | string | all | Filter: CAPITAL, SIGNAL, ACCESS, OPERATIONS |
| status | string | all | Filter: PENDING, COMPLETED |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "payout_id": "pay_0001",
        "execution_ref": "E-1039",
        "member_id": "mem_dv",
        "type": "CAPITAL",
        "amount": "2340.80",
        "share": 46,
        "status": "PENDING",
        "created_at": "2026-03-18T00:00:00Z"
      },
      { "payout_id": "pay_0004", "execution_ref": "E-1030", "member_id": "mem_dv", "type": "CAPITAL", "amount": "1890.20", "share": 46, "status": "COMPLETED", "created_at": "2026-03-04T00:00:00Z" }
    ]
  },
  "meta": { "request_id": "req_abc123", "timestamp": "2026-03-18T09:00:00Z", "pagination": { "page": 1, "limit": 20, "total": 48, "total_pages": 3, "has_next": true, "has_prev": false } }
}
```

### Field Notes
- `execution_ref` — human-readable execution reference (e.g. `E-1039`), not
  the `exec_` prefixed ID; see CONTEXT.md ref formats.
- `share` — member's percentage share of the distributable pool (number, 0–100).
- `member_id` — the recipient member.

---
## GET /members/me/payouts

The signed-in member's payout history plus an optional earnings summary.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "payout_id": "pay_0001",
        "opportunity_title": "Best Buy Clearance - 4K TVs",
        "type": "CAPITAL",
        "amount": "2340.80",
        "status": "PENDING",
        "completed_at": "2026-03-18T00:00:00Z"
      }
    ],
    "summary": { "total_earned": "1847.23", "from_capital": "1162.40", "from_signals": "482.10", "from_access": "202.73", "payouts_count": 9 }
  },
  "meta": { "request_id": "req_abc124", "timestamp": "2026-03-18T09:01:00Z", "pagination": { "page": 1, "limit": 20, "total": 9, "total_pages": 1, "has_next": false, "has_prev": false } }
}
```

### Summary Fields
- `total_earned` — lifetime earned across all types (money string).
- `from_capital` / `from_signals` / `from_access` — subtotal by type (money string).
- `payouts_count` — number of payouts in the summary.

> `summary` is optional and represents all-time totals, not just the current
> page. If absent, the client must not render the summary block.

---
## GET /payouts/{id}

Single payout detail. Returns the same **ledger-row shape** as `GET /payouts`
(`PayoutLedgerRow`).

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Payout ID, `pay_` prefixed (e.g. `pay_0001`) |

### Response (200 OK)
**404 Not Found** if no payout matches `{id}`.
```json
{
  "success": true,
  "data": {
    "payout_id": "pay_0001",
    "execution_ref": "E-1039",
    "member_id": "mem_dv",
    "type": "CAPITAL",
    "amount": "2340.80",
    "share": 46,
    "status": "PENDING",
    "created_at": "2026-03-18T00:00:00Z"
  },
  "meta": { "request_id": "req_abc125", "timestamp": "2026-03-18T09:02:00Z" }
}
```

---
## POST /payouts

Create a payout distribution when an execution completes. **System/internal
only** — not callable by a normal member session.

### Story
> As the system, I want to create a payout distribution after an execution
> completes so recipients get credited per the journey-06 split.

### Headers
```
Authorization: Bearer <system_or_operator_token>
X-Idempotency-Key: <unique-key>
```

### Request
```json
{
  "execution_id": "exec_1039",
  "distributions": [
    { "member_id": "mem_dv", "type": "CAPITAL", "percentage": 55, "amount": "2437.46" },
    { "member_id": "mem_mr", "type": "SIGNAL", "percentage": 25, "amount": "1107.94" }
  ]
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "payout_id": "pay_0049",
    "execution_id": "exec_1039",
    "status": "PENDING",
    "totals": { "gross_profit": "5982.05", "platform_fee": "299.10", "distributable": "5682.95" },
    "distributions_count": 6,
    "created_at": "2026-03-18T09:05:00Z"
  },
  "meta": { "request_id": "req_abc126", "timestamp": "2026-03-18T09:05:00Z" }
}
```

### Notes
- **Actor is SYSTEM** — every payout creation is recorded as `SYSTEM` in the
  audit trail (journey 06): `payout.created`, then `payout.distributed` per
  member, then `payout.completed`.
- 409 Conflict if a payout already exists for the execution.
- Use `X-Idempotency-Key` so retries do not create duplicate distributions.

---
