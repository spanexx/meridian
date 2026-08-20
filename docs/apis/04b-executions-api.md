# Execution API

## Overview

Execution (deal) management endpoints for starting, tracking, and completing
arbitrage executions. The backend must implement this contract; the frontend's
typed `ApiClient` (`execution.ts` models) and `MockGateway` (`mock-seed.ts`)
already serve these shapes and are the canonical reference for the JSON below.

> This doc **documents the mock-only `GET /executions` list endpoint** (gap §4.1)
> as the canonical board endpoint. Shape source of truth:
> `frontend/src/app/core/models/execution.ts`.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/executions` | List ALL executions (board) |
| GET | `/executions/{id}` | Get execution detail |
| POST | `/executions` | Create an execution (201) |
| POST | `/executions/{id}/complete` | Complete an execution |

---

## Base Path & Auth

All endpoints live under the API root `api/v1` per `00-api-conventions.md`:
`GET /api/v1/executions`, `GET /api/v1/executions/{id}`,
`POST /api/v1/executions`, `POST /api/v1/executions/{id}/complete`.

Auth is **Bearer** per 00-conventions on every endpoint
(`Authorization: Bearer <access_token>`; mutations also send
`X-Idempotency-Key`). Auth errors: `AUTH_TOKEN_MISSING` (401),
`AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED` (401).

---

## GET /executions


List **all** executions (canonical board endpoint). Currently mock-only
(gap §4.1); the backend must implement it as documented here.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "executions": [
      {
        "execution_id": "E-1042",
        "title": "Limited Edition Sneaker Resale",
        "opportunity": { "id": "O-2037", "title": "Travis Scott × Nike" },
        "image_seed": "sneaker-thumb",
        "status": "HOLDING",
        "participants": {
          "signal_contributor": { "member_id": "mem_mike-rivera", "display_name": "Mike Rivera", "share": 30 },
          "access_contributor": { "member_id": "mem_sarah-park", "display_name": "Sarah Park", "share": 12 },
          "operator": { "member_id": "mem_alexchen", "display_name": "Alex Chen" }
        },
        "capital": { "allocated": "18500.00", "spent": "18200.00", "recovered": "4280.00", "contributors_count": 42 },
        "inventory": { "total_items": 8, "sold": 3, "listed": 5, "in_storage": 0, "returned": 0 },
        "financials": { "revenue_to_date": "4280.00", "costs_to_date": "18200.00", "projected_profit": "4061.00", "projected_roi": 12.4 },
        "timeline": {
          "started_at": "2026-03-09T09:14:00Z",
          "acquisition_completed_at": "2026-03-11T10:15:00Z",
          "liquidation_started_at": "2026-03-12T09:14:00Z",
          "estimated_completion": "2026-03-13T21:14:00Z"
        }
      }
    ]
  }
}
```

Every row is a full `ExecutionDetail` (the mock seeds 16 executions; no
pagination contract yet — see CONFLICTS / OPEN QUESTIONS).

### Error Codes
| Code | HTTP | Condition |
|------|------|-----------|
| `AUTH_TOKEN_MISSING` | 401 | No bearer token |

---

## GET /executions/{id}

Single execution detail.

### Response (200 OK)
Same `ExecutionDetail` shape as a `GET /executions` row — e.g. `E-1042`
'Limited Edition Sneaker Resale', status `HOLDING`, `capital.allocated`
`"18500.00"`, `participants.signal_contributor` Mike Rivera (`share` 30),
`financials.projected_roi` 12.4 (see `GET /executions` for the body).

> **Id prefixes:** 00-conventions stipulate `exec_`/`mem_`/`opp_`; the mock
> seed emits wireframe refs (`E-1042`, `mem_mike-rivera`). `{id}` accepts
> whatever the backend emits for `execution_id` — see CONFLICTS.

### Error Codes
| Code | HTTP | Condition |
|------|------|-----------|
| `NOT_FOUND` | 404 | Unknown execution id |
| `AUTH_TOKEN_MISSING` | 401 | No bearer token |

---

## POST /executions

Create an execution (start of the lifecycle, `APPROVED → FUNDING`).

### Request
```json
{
  "opportunity_id": "O-2037",
  "capital_allocation": "18500.00",
  "operator_notes": "Verified stock availability. Proceeding with acquisition."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `opportunity_id` | string | yes | The `APPROVED` opportunity to execute |
| `capital_allocation` | string (money) | yes | Capital to deploy; string per 00-conventions |
| `operator_notes` | string | no | Free-text operator note |

### Response (201 Created)
Response is `ExecutionCreateResponse` (string money; plain-id-string
participants):

```json
{
  "success": true,
  "data": {
    "execution_id": "E-1043",
    "opportunity_id": "O-2037",
    "status": "FUNDING",
    "capital": {
      "allocated": "18500.00",
      "from_pool": true,
      "contributors": [
        { "member_id": "mem_001", "amount": "3700.00", "percentage": 20 },
        { "member_id": "mem_002", "amount": "5550.00", "percentage": 30 },
        { "member_id": "mem_003", "amount": "9250.00", "percentage": 50 }
      ]
    },
    "participants": {
      "signal_contributor": "mem_mike-rivera",
      "operator": "mem_alexchen"
    },
    "timeline": { "started_at": "2026-03-15T10:00:00Z" }
  }
}
```

Behavior (`05-execution-flow.md`): verify opportunity `APPROVED` + sufficient
pool capital, create execution, allocate capital pro-rata, status `FUNDING`,
publish `execution.funded`.

### Error Codes
| Code | HTTP | Condition |
|------|------|-----------|
| `VALIDATION_ERROR` | 400 | Missing/invalid fields or malformed body |
| `NOT_FOUND` | 404 | Opportunity id does not exist |
| `INVALID_STATE` | 422 | Opportunity not `APPROVED` |
| `INSUFFICIENT_BALANCE` | 422 | Pool lacks capital for the allocation |
| `AUTH_TOKEN_MISSING` | 401 | No bearer token |

---

## POST /executions/{id}/complete

Manually complete an execution (`LIQUIDATING → COMPLETED`).

### Request
```json
{ "notes": "All items sold. Proceeding to profit distribution." }
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | no | Optional completion note |

### Response (200 OK)
Response is `ExecutionCompleteResponse` — **all financials as string money**,
`roi` a number:

```json
{
  "success": true,
  "data": {
    "execution_id": "E-1033",
    "status": "COMPLETED",
    "financials": {
      "total_cost": "7800.00",
      "total_revenue": "9240.00",
      "gross_profit": "1440.00",
      "platform_fee": "72.00",
      "net_profit": "1368.00",
      "roi": 18.5
    },
    "timeline": {
      "started_at": "2026-02-03T00:00:00Z",
      "completed_at": "2026-03-01T00:00:00Z",
      "duration_days": 26
    },
    "payout_scheduled": true,
    "payout_id": "pay_0001"
  }
}
```

Behavior (`05-execution-flow.md`): calculate final financials, return unused
capital to pool, unlock contributor capital, create payout + queue
distribution, update reputation, notify, log `execution.completed`.

### Error Codes
| Code | HTTP | Condition |
|------|------|-----------|
| `NOT_FOUND` | 404 | Unknown execution id |
| `INVALID_STATE` | 422 | Not in a completable state (inventory unresolved) |
| `VALIDATION_ERROR` | 400 | Malformed request body |
| `AUTH_TOKEN_MISSING` | 401 | No bearer token |

---

## Canonical Models

Exact field lists from `frontend/src/app/core/models/execution.ts` (source of
truth). Money fields are **strings** (`"5000.00"`) per `00-api-conventions.md`
(always with cents, no symbol); percentages / ROI / shares stay numbers.

| Type | Fields |
|------|--------|
| `ExecutionStatus` | `FUNDING` `ACQUIRING` `HOLDING` `LIQUIDATING` `COMPLETED` `FAILED` `CANCELLED` |
| `ExecutionContributor` | `member_id: string; amount: string; percentage: number` |
| `ExecutionParticipants` | `signal_contributor`/`access_contributor`: `{member_id, display_name, share} \| null`; `operator`: `{member_id, display_name} \| null` |
| `ExecutionDetail` | `execution_id; title; opportunity {id, title}; image_seed; status; participants; capital {allocated, spent, recovered, contributors_count}; inventory {total_items, sold, listed, in_storage, returned}; financials {revenue_to_date, costs_to_date, projected_profit, projected_roi}; timeline {started_at, acquisition_completed_at, liquidation_started_at, estimated_completion}` |
| `ExecutionCreateResponse` | `execution_id; opportunity_id; status; capital {allocated, from_pool, contributors: ExecutionContributor[]}; participants {signal_contributor: string; operator: string}; timeline {started_at}` |
| `ExecutionCompleteResponse` | `execution_id; status; financials {total_cost, total_revenue, gross_profit, platform_fee, net_profit, roi}; timeline {started_at, completed_at, duration_days}; payout_scheduled: boolean; payout_id: string` |

---

## CONFLICTS / OPEN QUESTIONS

- **Participants shape conflict (create vs detail) — gap §4.12.** `POST
  /executions` returns `participants.signal_contributor` / `operator` as plain
  **id strings**; `GET /executions/{id}` returns them as **objects**
  (`{member_id, display_name, share}`) and adds `access_contributor`, which the
  create response lacks. Backend must decide whether to unify or keep the
  split (frontend keeps it as-is).
- **Money string vs number.** Journey `05-execution-flow.md` renders numbers;
  `00-conventions.md` + `execution.ts` type money as strings with cents. This
  contract mandates **string money** in all responses; `roi` / `percentage` /
  `share` stay numbers.
- **Mock-only `GET /executions` (gap §4.1).** Exists only in the mock seed;
  documented here as canonical. No pagination contract yet — the client
  expects `data.executions` as a full array.
- **Id prefixes.** Conventions require `exec_` / `mem_` / `opp_`; the mock seed
  emits wireframe refs (`E-1042`, `mem_mike-rivera`). Backend must pick one
  identity scheme for `execution_id` and use a `pay_`-prefixed `payout_id`.