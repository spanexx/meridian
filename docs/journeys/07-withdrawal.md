# Journey: Withdrawal

## Story

> **As a member with available balance**, I want to withdraw funds to my bank account so that I can access my earnings.

---

## Prerequisites

- Member status: `ACTIVE`
- KYC status: `VERIFIED`
- At least one verified withdrawal method
- Available balance > minimum withdrawal amount

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WITHDRAWAL FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │ Request │───►│Security │───►│ Process │───►│ Transfer│        │
│   │Withdraw │    │ Check   │    │ Approval│    │  Funds  │        │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│                                                       │            │
│   Enter amount    2FA, daily     Admin review        │            │
│   and method      limits         (if required)       ▼            │
│                                                ┌─────────┐        │
│                                                │ Confirm │        │
│                                                └─────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: View Available Balance

### API Call
```
GET /api/v1/capital/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balances": {
      "available": "15250.75",
      "locked": "5000.00",
      "pending_withdrawal": "0.00"
    },
    "withdrawal": {
      "min_amount": 50,
      "max_single": 10000,
      "daily_limit": 25000,
      "daily_used": 0,
      "daily_remaining": 25000
    },
    "methods": [
      {
        "id": "wm_abc123",
        "type": "BANK_ACCOUNT",
        "details": {
          "bank_name": "Chase",
          "account_last4": "4567"
        },
        "is_default": true,
        "verified": true
      },
      {
        "id": "wm_def456",
        "type": "PAYPAL",
        "details": {
          "email": "j***@example.com"
        },
        "is_default": false,
        "verified": true
      }
    ]
  }
}
```

---

## Step 2: Request Withdrawal

### API Call
```
POST /api/v1/capital/withdrawals
```

**Request:**
```json
{
  "amount": "5000.00",
  "withdrawal_method_id": "wm_abc123",
  "idempotency_key": "wd_user123_1710324000"
}
```

**Success Response (201):**
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
    "estimated_arrival": "2026-03-16T00:00:00Z",
    "created_at": "2026-03-13T10:00:00Z"
  }
}
```

### Backend Behavior
1. Validate member KYC is verified
2. Validate withdrawal method exists and is verified
3. Validate amount within limits
4. Check daily withdrawal limit not exceeded
5. Check idempotency key for duplicate prevention
6. Create pending withdrawal transaction
7. Move funds from `available` to `pending_withdrawal`
8. If amount > threshold or risk flags, require 2FA
9. Log audit event: `capital.withdrawal_requested`

### Database Changes
```javascript
// New document in 'transactions' collection
{
  "_id": ObjectId("wd_507f..."),
  "member_id": ObjectId("mem_123"),
  "type": "WITHDRAWAL",
  "status": "PENDING_VERIFICATION",
  "amount": NumberDecimal("-5000.00"),
  "currency": "USD",
  "external": {
    "method": "BANK_ACCOUNT",
    "withdrawal_method_id": "wm_abc123"
  },
  "idempotency_key": "wd_user123_1710324000",
  "created_at": ISODate("2026-03-13T10:00:00Z")
}

// Update capital_accounts
{
  "member_id": ObjectId("mem_123"),
  "balances": {
    "available": NumberDecimal("10250.75"),    // was 15250.75
    "pending_withdrawal": NumberDecimal("5000.00")  // was 0
  }
}
```

---

## Step 3: Two-Factor Authentication

If 2FA is required (amount > $1000 or risk flags):

### API Call
```
POST /api/v1/capital/withdrawals/{withdrawal_id}/verify
```

**Request:**
```json
{
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_507f...",
    "status": "PENDING_PROCESSING",
    "message": "Verification successful. Withdrawal is being processed."
  }
}
```

**Error Response (Invalid Code):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_2FA_CODE",
    "message": "Invalid verification code. Please try again.",
    "details": {
      "attempts_remaining": 2
    }
  }
}
```

### Backend Behavior
1. Validate 2FA code
2. If valid: update status to `PENDING_PROCESSING`
3. If invalid: increment attempts, lock after 3 failures
4. Queue for processing
5. Log audit event: `capital.withdrawal_verified`

---

## Step 4: Processing

### Automatic Processing (Small Amounts)
Withdrawals under $5,000 with no risk flags are processed automatically.

### Manual Review (Large Amounts)
Withdrawals over $5,000 or with risk flags go to admin queue.

### API (Admin)
```
POST /api/v1/admin/withdrawals/{withdrawal_id}/approve
```

**Request:**
```json
{
  "notes": "Verified member identity. Approved."
}
```

### Processing Flow
```go
func (s *MoneyEngine) ProcessWithdrawal(withdrawalID string) error {
    withdrawal := s.repo.GetByID(withdrawalID)
    
    // Update status
    withdrawal.Status = "PROCESSING"
    s.repo.Update(withdrawal)
    
    // Initiate transfer via PaymentProvider adapters
    // (swapping rails = swapping adapters, never the engine)
    var result *TransferResult
    switch withdrawal.Method.Type {
    case "BANK_ACCOUNT":
        result = s.payment.Stripe.CreatePayout(withdrawal)
    case "PAYPAL":
        result = s.payment.PayPal.CreatePayout(withdrawal)
    case "CRYPTO":
        result = s.payment.Crypto.SendTransfer(withdrawal)
    }
    
    if result.Success {
        withdrawal.Status = "COMPLETED"
        withdrawal.ExternalID = result.TransferID
        withdrawal.CompletedAt = time.Now()
    } else {
        withdrawal.Status = "FAILED"
        withdrawal.FailureReason = result.Error
        // Return funds to available balance (internal)
        s.reverseWithdrawal(withdrawal)
    }
    
    s.repo.Update(withdrawal)

    // Publish the fact — the Notification engine reacts to
    // capital.withdrawal_completed / capital.withdrawal_failed
    evtType := "capital.withdrawal_completed"
    if withdrawal.Status == "FAILED" {
        evtType = "capital.withdrawal_failed"
    }
    s.publish(Event{Type: evtType, Aggregate: Reference{Type: "withdrawal", ID: withdrawal.ID}, Payload: withdrawal})
    
    return nil
}
```

---

## Step 5: Confirmation

### API Call (Polling)
```
GET /api/v1/capital/withdrawals/{withdrawal_id}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_507f...",
    "amount": "5000.00",
    "fee": "0.00",
    "net_amount": "5000.00",
    "status": "COMPLETED",
    "method": {
      "type": "BANK_ACCOUNT",
      "details": {
        "bank_name": "Chase",
        "account_last4": "4567"
      }
    },
    "external_reference": "po_stripe_xyz789",
    "created_at": "2026-03-13T10:00:00Z",
    "completed_at": "2026-03-13T10:30:00Z",
    "new_balance": {
      "available": "10250.75"
    }
  }
}
```

---

## Withdrawal Limits

| Limit Type | Amount | Notes |
|------------|--------|-------|
| Minimum | $50 | Covers processing costs |
| Maximum single | $10,000 | Risk management |
| Daily limit | $25,000 | AML compliance |
| Weekly limit | $100,000 | Risk management |
| Monthly limit | $250,000 | Risk management |

### Tier-Based Limits
| Tier | Daily Limit | Weekly Limit |
|------|-------------|--------------|
| BRONZE | $10,000 | $50,000 |
| SILVER | $25,000 | $100,000 |
| GOLD | $50,000 | $200,000 |
| PLATINUM | $100,000 | $500,000 |

---

## Withdrawal Methods

### Bank Account (ACH)
- Processing time: 1-3 business days
- Fee: Free (for verified members)
- Requires micro-deposit verification

### PayPal
- Processing time: Same day to 24 hours
- Fee: 2.9% + $0.30
- Requires email verification

### Wire Transfer
- Processing time: 1-2 business days
- Fee: $25 flat
- For amounts > $10,000

### Crypto (Future)
- Processing time: Network dependent
- Fee: Network fee + 1%
- Requires wallet verification

---

## Fee Structure

| Method | Fee | Minimum Fee |
|--------|-----|-------------|
| ACH | Free | - |
| PayPal | 2.9% + $0.30 | $0.30 |
| Wire | $25 flat | $25 |
| Crypto | Network + 1% | Variable |

---

## Security Measures

### 2FA Requirements
| Condition | 2FA Required |
|-----------|--------------|
| Amount > $1,000 | Yes |
| New withdrawal method | Yes |
| First withdrawal | Yes |
| Unusual activity detected | Yes |
| Amount < $1,000 (trusted) | Optional |

### Cooling Period
- New withdrawal method: 48-hour hold before first use
- Large withdrawals (>$10,000): 24-hour hold
- Changed password: 24-hour withdrawal hold

### Risk Signals
The system flags withdrawals when:
- IP address is new or from high-risk location
- Withdrawal immediately follows large deposit
- Pattern matches fraud indicators
- Account recently compromised

---

## List My Withdrawals

### API Call
```
GET /api/v1/capital/withdrawals?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "withdrawal_id": "wd_507f...",
        "amount": "5000.00",
        "method": "BANK_ACCOUNT",
        "status": "COMPLETED",
        "created_at": "2026-03-13T10:00:00Z",
        "completed_at": "2026-03-13T10:30:00Z"
      },
      {
        "withdrawal_id": "wd_abc...",
        "amount": "2500.00",
        "method": "PAYPAL",
        "status": "COMPLETED",
        "created_at": "2026-03-01T14:00:00Z",
        "completed_at": "2026-03-01T15:00:00Z"
      }
    ],
    "summary": {
      "total_withdrawn": "125000.00",
      "withdrawals_count": 15,
      "this_month": "7500.00"
    }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

## Cancel Withdrawal

Only pending withdrawals can be cancelled.

### API Call
```
POST /api/v1/capital/withdrawals/{withdrawal_id}/cancel
```

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_507f...",
    "status": "CANCELLED",
    "refund": {
      "amount": "5000.00",
      "returned_to": "available_balance"
    },
    "new_balance": {
      "available": "15250.75"
    }
  }
}
```

---

## Error Handling

### Insufficient Balance
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your available balance is insufficient for this withdrawal.",
    "details": {
      "requested": "5000.00",
      "available": "3200.00"
    }
  }
}
```

### Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "LIMIT_EXCEEDED",
    "message": "This withdrawal would exceed your daily limit.",
    "details": {
      "daily_limit": "25000.00",
      "daily_used": "20000.00",
      "remaining": "5000.00",
      "requested": "7000.00"
    }
  }
}
```

### Method Not Verified
```json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_VERIFIED",
    "message": "This withdrawal method has not been verified yet.",
    "details": {
      "method_id": "wm_abc123",
      "verification_status": "PENDING",
      "verification_type": "micro_deposits"
    }
  }
}
```

### Account Locked
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Your account is temporarily locked for withdrawals.",
    "details": {
      "reason": "suspicious_activity",
      "locked_until": "2026-03-14T10:00:00Z",
      "contact_support": true
    }
  }
}
```

---

## Notifications

| Event | Type | Channels |
|-------|------|----------|
| Withdrawal requested | `WITHDRAWAL_REQUESTED` | Email, In-app |
| 2FA required | `WITHDRAWAL_2FA_REQUIRED` | Push, SMS |
| Processing started | `WITHDRAWAL_PROCESSING` | In-app |
| Completed | `WITHDRAWAL_COMPLETED` | Email, In-app, Push |
| Failed | `WITHDRAWAL_FAILED` | Email, In-app, Push |
| Cancelled | `WITHDRAWAL_CANCELLED` | In-app |

---

## Audit Trail

```javascript
// capital.withdrawal_requested
{
  "action": "capital.withdrawal_requested",
  "actor": { "type": "MEMBER", "id": "mem_123" },
  "resource": { "type": "transaction", "id": "wd_507f..." },
  "details": {
    "amount": "5000.00",
    "method": "BANK_ACCOUNT"
  }
}

// capital.withdrawal_verified
{
  "action": "capital.withdrawal_verified",
  "actor": { "type": "MEMBER", "id": "mem_123" },
  "resource": { "type": "transaction", "id": "wd_507f..." },
  "details": {
    "verification_method": "2FA"
  }
}

// capital.withdrawal_completed
{
  "action": "capital.withdrawal_completed",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "transaction", "id": "wd_507f..." },
  "details": {
    "amount": "5000.00",
    "external_reference": "po_stripe_xyz789",
    "processing_time_seconds": 1800
  }
}
```
