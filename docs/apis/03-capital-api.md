# Capital API

## Overview

Capital management endpoints for deposits, withdrawals, balance queries, and withdrawal method management.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/capital/balance` | Get member's capital balance |
| GET | `/capital/transactions` | Get transaction history |
| POST | `/capital/deposits` | Initiate deposit |
| GET | `/capital/deposits/{id}` | Get deposit status |
| POST | `/capital/withdrawals` | Request withdrawal |
| GET | `/capital/withdrawals/{id}` | Get withdrawal status |
| POST | `/capital/withdrawals/{id}/verify` | Verify withdrawal with 2FA |
| POST | `/capital/withdrawals/{id}/cancel` | Cancel pending withdrawal |
| GET | `/capital/withdrawal-methods` | List withdrawal methods |
| POST | `/capital/withdrawal-methods` | Add withdrawal method |
| DELETE | `/capital/withdrawal-methods/{id}` | Remove withdrawal method |
| GET | `/capital/pool/status` | Get pool status (public) |

---

## GET /capital/balance

Get authenticated member's capital balance.

### Story
> As a member, I want to see my current balance so I know how much I can withdraw or is earning.

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "balances": {
      "available": "15250.75",
      "locked": "5000.00",
      "pending_deposit": "0.00",
      "pending_withdrawal": "0.00",
      "total": "20250.75"
    },
    "lifetime": {
      "total_deposited": "50000.00",
      "total_withdrawn": "35000.00",
      "total_earned": "5250.75"
    },
    "withdrawal_limits": {
      "min_amount": "50.00",
      "max_single": "10000.00",
      "daily_limit": "25000.00",
      "daily_used": "0.00",
      "daily_remaining": "25000.00"
    },
    "next_payout_estimate": {
      "amount": "350.00",
      "expected_date": "2026-03-20"
    }
  }
}
```

---

## GET /capital/transactions

Get member's transaction history.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| type | string | all | Filter by type |
| from | date | - | Start date |
| to | date | - | End date |

### Transaction Types
- `DEPOSIT` - Incoming deposit
- `WITHDRAWAL` - Outgoing withdrawal
- `ALLOCATION` - Capital locked for execution
- `RELEASE` - Capital unlocked from execution
- `DISTRIBUTION` - Profit distribution

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_abc123",
        "type": "DISTRIBUTION",
        "amount": "487.49",
        "description": "Profit distribution from Best Buy Clearance",
        "reference": {
          "type": "PAYOUT",
          "id": "pay_xyz789"
        },
        "balance_after": "15250.75",
        "created_at": "2026-03-25T16:00:00Z"
      },
      {
        "id": "tx_def456",
        "type": "ALLOCATION",
        "amount": "-1800.00",
        "description": "Capital allocated for execution",
        "reference": {
          "type": "EXECUTION",
          "id": "exec_789abc"
        },
        "balance_after": "13450.75",
        "created_at": "2026-03-15T10:00:00Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156
    }
  }
}
```

---

## POST /capital/deposits

Initiate a deposit.

### Story
> As a KYC-verified member, I want to deposit funds so I can participate in arbitrage opportunities.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "amount": "5000.00",
  "payment_method": "CARD",
  "idempotency_key": "dep_user123_1710324000"
}
```

### Validation
| Field | Rules |
|-------|-------|
| amount | Required, min 100.00, max 50000.00 |
| payment_method | Required, enum: CARD, ACH, WIRE |
| idempotency_key | Required, unique per 24h |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "deposit_id": "dep_507f1f77bcf86cd799439011",
    "amount": "5000.00",
    "status": "PENDING",
    "payment": {
      "provider": "STRIPE",
      "client_secret": "pi_xxx_secret_yyy",
      "publishable_key": "pk_live_xxx"
    },
    "fees": {
      "processing_fee": "145.00",
      "net_deposit": "4855.00"
    },
    "expires_at": "2026-03-13T11:00:00Z"
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `KYC_REQUIRED` | Member not KYC verified |
| `LIMIT_EXCEEDED` | Daily limit exceeded |
| `VALIDATION_ERROR` | Invalid amount or method |

### Side Effects
- Creates pending transaction
- Moves amount to pending_deposit
- Initializes payment provider
- Logs: `capital.deposit_initiated`

---

## POST /capital/withdrawals

Request a withdrawal.

### Story
> As a member with available balance, I want to withdraw funds to my bank account.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "amount": "5000.00",
  "withdrawal_method_id": "wm_abc123",
  "idempotency_key": "wd_user123_1710324000"
}
```

### Validation
| Field | Rules |
|-------|-------|
| amount | Required, min 50.00, max 10000.00, ≤ available balance |
| withdrawal_method_id | Required, must be verified |
| idempotency_key | Required, unique per 24h |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_507f1f77bcf86cd799439011",
    "amount": "5000.00",
    "fee": "0.00",
    "net_amount": "5000.00",
    "status": "PENDING_VERIFICATION",
    "method": {
      "type": "BANK_ACCOUNT",
      "details": {
        "bank_name": "Chase",
        "account_last4": "4567"
      }
    },
    "requires_2fa": true,
    "estimated_arrival": "2026-03-16T00:00:00Z"
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `INSUFFICIENT_BALANCE` | Not enough available funds |
| `KYC_REQUIRED` | Member not KYC verified |
| `METHOD_NOT_VERIFIED` | Withdrawal method not verified |
| `LIMIT_EXCEEDED` | Daily/weekly limit exceeded |
| `COOLDOWN_ACTIVE` | Security cooldown in effect |

### Side Effects
- Creates pending transaction
- Moves amount to pending_withdrawal
- Logs: `capital.withdrawal_requested`

---

## POST /capital/withdrawals/{id}/verify

Verify withdrawal with 2FA code.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "code": "123456"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_507f...",
    "status": "PENDING_PROCESSING",
    "message": "Withdrawal verified. Processing will begin shortly."
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `AUTH_2FA_INVALID` | Invalid 2FA code |
| `INVALID_STATE` | Withdrawal not in pending verification |

---

## POST /capital/withdrawal-methods

Add a new withdrawal method.

### Headers
```
Authorization: Bearer <access_token>
```

### Request (Bank Account)
```json
{
  "type": "BANK_ACCOUNT",
  "details": {
    "account_holder_name": "Jane Doe",
    "account_number": "123456789",
    "routing_number": "021000021",
    "bank_name": "Chase",
    "account_type": "CHECKING"
  },
  "is_default": true
}
```

### Request (PayPal)
```json
{
  "type": "PAYPAL",
  "details": {
    "email": "jane@example.com"
  },
  "is_default": false
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "wm_abc123",
    "type": "BANK_ACCOUNT",
    "details": {
      "account_holder_name": "Jane Doe",
      "account_number_last4": "6789",
      "bank_name": "Chase"
    },
    "verified": false,
    "verification_method": "micro_deposits",
    "verification_instructions": "Two small deposits will be made to your account within 1-2 business days. Enter the amounts to verify."
  }
}
```

### Verification Methods
| Type | Method | Timeline |
|------|--------|----------|
| BANK_ACCOUNT | Micro-deposits | 1-2 business days |
| PAYPAL | Email confirmation | Instant |
| CRYPTO | Signed message | Instant |

---

## GET /capital/pool/status

Get current pool status (public, no auth required).

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totals": {
      "total_capital": "1250000.00",
      "available_capital": "750000.00",
      "deployed_capital": "312500.00"
    },
    "health": {
      "status": "HEALTHY",
      "reserve_ratio": 15.0,
      "deployment_ratio": 25.0
    },
    "activity": {
      "active_executions": 8,
      "contributors_count": 342
    },
    "performance": {
      "avg_roi_30d": 32.5,
      "total_profit_30d": "87500.00",
      "executions_completed_30d": 15
    },
    "snapshot_at": "2026-03-13T10:00:00Z"
  }
}
```

---

## Deposit Flow Sequence

```
┌────────────────────────────────────────────────────────────────────┐
│                      DEPOSIT FLOW                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   1. POST /capital/deposits                                        │
│      └─► Returns client_secret for Stripe                         │
│                                                                    │
│   2. Frontend: Stripe.confirmCardPayment(client_secret)           │
│      └─► User enters card details, confirms                       │
│                                                                    │
│   3. Stripe Webhook: payment_intent.succeeded                     │
│      └─► Backend processes webhook                                │
│      └─► Updates transaction status                               │
│      └─► Credits member balance                                   │
│                                                                    │
│   4. GET /capital/deposits/{id} (polling)                         │
│      └─► Returns COMPLETED status                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Withdrawal Flow Sequence

```
┌────────────────────────────────────────────────────────────────────┐
│                     WITHDRAWAL FLOW                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   1. POST /capital/withdrawals                                     │
│      └─► Returns requires_2fa: true                               │
│                                                                    │
│   2. POST /capital/withdrawals/{id}/verify                        │
│      └─► User enters 2FA code                                     │
│      └─► Status: PENDING_PROCESSING                               │
│                                                                    │
│   3. Background: ProcessWithdrawal job                            │
│      └─► Calls payment provider (Stripe/PayPal)                   │
│      └─► Status: PROCESSING                                       │
│                                                                    │
│   4. Stripe Webhook: payout.paid                                  │
│      └─► Status: COMPLETED                                        │
│      └─► Notification sent                                        │
│                                                                    │
│   5. GET /capital/withdrawals/{id}                                │
│      └─► Returns final status                                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Fee Schedule

### Deposits
| Method | Fee | Minimum |
|--------|-----|---------|
| Card | 2.9% + $0.30 | $0.30 |
| ACH | 0.8% | $0.00 |
| Wire | $15 flat | $15.00 |

### Withdrawals
| Method | Fee | Processing Time |
|--------|-----|-----------------|
| ACH | Free | 1-3 business days |
| PayPal | 2.9% + $0.30 | Same day |
| Wire | $25 flat | 1-2 business days |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /capital/balance | 60 | 1 min |
| POST /capital/deposits | 5 | 1 hour |
| POST /capital/withdrawals | 3 | 1 hour |
| GET /capital/pool/status | 30 | 1 min |
