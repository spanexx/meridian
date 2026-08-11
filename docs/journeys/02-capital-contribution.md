# Journey: Capital Contribution

## Story

> **As a verified member**, I want to deposit funds into the collective pool so that I can earn returns from successful arbitrage operations.

---

## Prerequisites

- Member status: `ACTIVE`
- KYC status: `VERIFIED`
- At least one withdrawal method added

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CAPITAL CONTRIBUTION FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │Complete │───►│  Add    │───►│ Choose  │───►│ Confirm │        │
│   │   KYC   │    │Withdraw │    │ Amount  │    │ Deposit │        │
│   └─────────┘    │ Method  │    └─────────┘    └─────────┘        │
│                  └─────────┘          │              │             │
│                                       ▼              ▼             │
│                                  ┌─────────┐   ┌─────────┐        │
│                                  │ Payment │   │ Balance │        │
│                                  │Provider │   │ Updated │        │
│                                  └─────────┘   └─────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: KYC Verification (If Not Complete)

*See [journeys/03-kyc-verification.md](./03-kyc-verification.md) for detailed KYC flow.*

Member must have `kyc_status: "VERIFIED"` before depositing.

---

## Step 2: Add Withdrawal Method (First Time Only)

Before depositing, member must have at least one verified withdrawal method. This ensures funds can be returned.

### API Call
```
POST /api/v1/capital/withdrawal-methods
```

**Request (Bank Account):**
```json
{
  "type": "BANK_ACCOUNT",
  "details": {
    "account_holder_name": "Jane Doe",
    "account_number": "****4567",
    "routing_number": "****8901",
    "bank_name": "Chase",
    "account_type": "CHECKING"
  },
  "is_default": true
}
```

**Request (PayPal):**
```json
{
  "type": "PAYPAL",
  "details": {
    "email": "jane@example.com"
  },
  "is_default": false
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "wm_abc123",
    "type": "BANK_ACCOUNT",
    "details": {
      "account_holder_name": "Jane Doe",
      "account_number_last4": "4567",
      "bank_name": "Chase"
    },
    "verified": false,
    "verification_required": "micro_deposits"
  }
}
```

### Backend Behavior
1. Validate withdrawal method details
2. For bank accounts: initiate micro-deposit verification
3. For PayPal: send verification email
4. Store method with `verified: false`
5. Queue verification job
6. Log audit event: `capital.withdrawal_method_added`

---

## Step 3: View Pool Status (Optional)

Member can view current pool status before deciding how much to deposit.

### API Call
```
GET /api/v1/capital/pool/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pool_totals": {
      "total_capital": "1250000.00",
      "available_capital": "875000.00",
      "deployed_capital": "375000.00",
      "reserve_balance": "250000.00"
    },
    "activity": {
      "active_executions": 8,
      "pending_opportunities": 12,
      "members_contributing": 342
    },
    "performance": {
      "avg_roi_last_30_days": 28.5,
      "total_profit_last_30_days": "87500.00",
      "executions_completed_last_30_days": 15
    },
    "your_position": {
      "capital_contributed": "5000.00",
      "share_of_pool": 0.4,
      "estimated_monthly_return": "142.50"
    }
  }
}
```

---

## Step 4: Initiate Deposit

### User Action
Member enters deposit amount and selects payment method.

### API Call
```
POST /api/v1/capital/deposits
```

**Request:**
```json
{
  "amount": "5000.00",
  "payment_method": "CARD",
  "idempotency_key": "dep_user123_1710324000"
}
```

**Success Response (201):**
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

### Backend Behavior
1. Validate member has verified KYC
2. Validate member has at least one withdrawal method
3. Validate amount (min $100, max $50,000 per transaction)
4. Check idempotency key for duplicate prevention
5. Create pending transaction record
6. Initialize Stripe PaymentIntent
7. Return client_secret for frontend completion
8. Log audit event: `capital.deposit_initiated`

### Database Changes
```javascript
// New document in 'transactions' collection
{
  "_id": ObjectId("dep_507f1f77bcf86cd799439011"),
  "member_id": ObjectId("507f1f77bcf86cd799439011"),
  "type": "DEPOSIT",
  "status": "PENDING",
  "amount": NumberDecimal("4855.00"),
  "currency": "USD",
  "external": {
    "provider": "STRIPE",
    "provider_id": "pi_xxx",
    "method": "CARD",
    "fee": NumberDecimal("145.00")
  },
  "idempotency_key": "dep_user123_1710324000",
  "created_at": ISODate("2026-03-13T10:00:00Z")
}

// Update 'capital_accounts' collection
{
  "member_id": ObjectId("507f1f77bcf86cd799439011"),
  "balances": {
    "pending_deposit": NumberDecimal("4855.00")  // increased
  }
}
```

---

## Step 5: Complete Payment (Frontend)

### Frontend Action
Using Stripe Elements, the frontend collects card details and confirms the payment.

```typescript
// Angular component
async confirmPayment() {
  const { error, paymentIntent } = await this.stripe.confirmCardPayment(
    this.clientSecret,
    {
      payment_method: {
        card: this.cardElement,
        billing_details: {
          name: this.memberName,
          email: this.memberEmail
        }
      }
    }
  );
  
  if (error) {
    this.handleError(error);
  } else if (paymentIntent.status === 'succeeded') {
    this.pollDepositStatus();
  }
}
```

---

## Step 6: Webhook Confirmation

Stripe sends a webhook when payment succeeds.

### Webhook Endpoint
```
POST /api/v1/webhooks/stripe
```

**Stripe Event (payment_intent.succeeded):**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 500000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "deposit_id": "dep_507f1f77bcf86cd799439011",
        "member_id": "507f1f77bcf86cd799439011"
      }
    }
  }
}
```

### Backend Behavior
1. Verify webhook signature
2. Find transaction by provider_id
3. Update transaction status to `COMPLETED`
4. Update member's capital account:
   - Move amount from `pending_deposit` to `available`
   - Update `lifetime.total_deposited`
5. Update member's `contribution_types` to include "CAPITAL"
6. Recalculate reputation (tenure bonus)
7. Create notification for member
8. Log audit event: `capital.deposit_completed`

### Database Changes
```javascript
// Update 'transactions' collection
{
  "_id": ObjectId("dep_507f1f77bcf86cd799439011"),
  "status": "COMPLETED",
  "balance_before": NumberDecimal("0"),
  "balance_after": NumberDecimal("4855.00"),
  "completed_at": ISODate("2026-03-13T10:02:00Z")
}

// Update 'capital_accounts' collection
{
  "member_id": ObjectId("507f1f77bcf86cd799439011"),
  "balances": {
    "available": NumberDecimal("4855.00"),      // increased
    "pending_deposit": NumberDecimal("0")       // cleared
  },
  "lifetime": {
    "total_deposited": NumberDecimal("4855.00") // increased
  }
}

// Update 'members' collection
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "contribution_types": ["CAPITAL"]              // added
}
```

---

## Step 7: Confirmation

### API Call (Polling)
```
GET /api/v1/capital/deposits/{deposit_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deposit_id": "dep_507f1f77bcf86cd799439011",
    "amount": "4855.00",
    "gross_amount": "5000.00",
    "processing_fee": "145.00",
    "status": "COMPLETED",
    "completed_at": "2026-03-13T10:02:00Z",
    "new_balance": {
      "available": "4855.00",
      "total": "4855.00"
    }
  }
}
```

---

## Payment Methods Supported

### Card Payments (Stripe)
- Visa, Mastercard, Amex
- Processing fee: 2.9% + $0.30
- Instant credit upon success

### Bank Transfer (ACH)
- Processing fee: 0.8% (max $5)
- 3-5 business days to clear

### Crypto (Future)
- BTC, ETH, USDC
- Network fee + 1% processing
- Confirmation after 3 network confirmations

---

## Deposit Limits

| Limit Type | Amount | Rationale |
|------------|--------|-----------|
| Minimum deposit | $100 | Cover processing costs |
| Maximum single deposit | $50,000 | Risk management |
| Maximum daily | $100,000 | AML compliance |
| Maximum monthly | $500,000 | Risk management |

---

## Fee Structure

| Payment Method | Fee | Example ($1000) |
|----------------|-----|-----------------|
| Card | 2.9% + $0.30 | $29.30 |
| ACH | 0.8% (max $5) | $5.00 |
| Crypto | Network + 1% | Variable |

Fees are deducted from deposit. User receives net amount.

---

## What Happens to Deposited Capital

Once deposited, capital enters the pool:

1. **Available Balance**: Ready to be deployed to opportunities
2. **When Opportunity Approved**: Pro-rata allocation based on available balance
3. **During Execution**: Portion moves to `locked` balance
4. **After Execution**: Principal + profit returned to `available`

```
Your $4,855 deposit
       │
       ▼
Pool Total: $1,254,855
       │
       ├── Reserved (20%): $250,971 ← Your share: $971
       │
       └── Deployable (80%): $1,003,884 ← Your share: $3,884
              │
              ▼
       When opportunity approved:
       Proportional allocation based on
       your share of deployable capital
```

---

## Notifications

| Event | Type | Channels |
|-------|------|----------|
| Deposit initiated | `DEPOSIT_INITIATED` | In-app |
| Deposit completed | `DEPOSIT_COMPLETED` | Email, In-app, Push |
| Deposit failed | `DEPOSIT_FAILED` | Email, In-app |

---

## Error Handling

### Payment Declined
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "Your payment was declined. Please try a different payment method.",
    "details": {
      "decline_code": "insufficient_funds"
    }
  }
}
```

### KYC Not Verified
```json
{
  "success": false,
  "error": {
    "code": "KYC_REQUIRED",
    "message": "Please complete KYC verification before depositing funds.",
    "details": {
      "kyc_status": "NOT_STARTED",
      "kyc_url": "/kyc/start"
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
    "message": "This deposit would exceed your daily limit.",
    "details": {
      "limit": "100000.00",
      "used_today": "75000.00",
      "available": "25000.00",
      "requested": "30000.00"
    }
  }
}
```

---

## Audit Trail

```javascript
// capital.deposit_initiated
{
  "action": "capital.deposit_initiated",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "transaction", "id": "dep_507f..." },
  "details": {
    "amount": "5000.00",
    "payment_method": "CARD"
  }
}

// capital.deposit_completed
{
  "action": "capital.deposit_completed",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "transaction", "id": "dep_507f..." },
  "details": {
    "gross_amount": "5000.00",
    "net_amount": "4855.00",
    "fee": "145.00",
    "new_balance": "4855.00"
  }
}
```

---

## Related Journeys

- [KYC Verification](./03-kyc-verification.md) — Required before deposit
- [Withdrawal](./07-withdrawal.md) — Taking funds out
- [Payout Distribution](./06-payout-distribution.md) — Receiving returns
