# Journey: Payout Distribution

## Story

> **As a participant**, I want to receive my share of profits when an execution completes so that I can see returns on my contributions.

---

## The Payout Split

When an execution completes profitably, the net profit is distributed:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROFIT DISTRIBUTION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Gross Revenue: $12,500                                           │
│   - Total Costs: $7,835                                            │
│   ─────────────────────                                            │
│   Gross Profit:  $4,665                                            │
│   - Platform Fee (5%): $233.25                                     │
│   ─────────────────────                                            │
│   Net Profit:    $4,431.75                                         │
│                                                                     │
│   Distribution:                                                     │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │ Capital Contributors (55%)     │ $2,437.46                  │ │
│   │ Signal Contributor (25%)       │ $1,107.94                  │ │
│   │ Access Contributor (10%)       │ $443.18 (if applicable)    │ │
│   │ Operations (5%)                │ $221.59                    │ │
│   │ Platform Reserve (5%)          │ $221.59                    │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Distribution Rules

### Standard Split (No Access Contributor)
| Recipient | Percentage | Description |
|-----------|------------|-------------|
| Capital | 60% | Pro-rata among all capital contributors |
| Signal | 25% | The member who found the opportunity |
| Operations | 10% | Operators who executed the deal |
| Platform | 5% | Platform reserve fund |

### With Access Contributor
| Recipient | Percentage | Description |
|-----------|------------|-------------|
| Capital | 55% | Pro-rata among all capital contributors |
| Signal | 25% | The member who found the opportunity |
| Access | 10% | The member who provided access |
| Operations | 5% | Operators who executed the deal |
| Platform | 5% | Platform reserve fund |

---

## Payout Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PAYOUT LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │Execution│───►│Calculate│───►│ Create  │───►│ Process │        │
│   │Completes│    │  Split  │    │ Payout  │    │ Distrib │        │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│                                                       │            │
│                                                       ▼            │
│                                                 ┌─────────┐        │
│                                                 │ Credit  │        │
│                                                 │ Wallets │        │
│                                                 └─────────┘        │
│                                                       │            │
│                                                       ▼            │
│                                                 ┌─────────┐        │
│                                                 │ Notify  │        │
│                                                 │ Members │        │
│                                                 └─────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Calculate Distribution

When `execution.completed` fires, the Payout engine reacts and calculates the payout:

### Calculation Logic
```go
type PayoutCalculation struct {
    ExecutionID    string
    GrossProfit    float64
    PlatformFee    float64
    NetProfit      float64
    Distributions  []Distribution
}

func (s *PayoutEngine) CalculateDistribution(exec *Execution) *PayoutCalculation {
    grossProfit := exec.Capital.Recovered - exec.Capital.Spent
    platformFee := grossProfit * 0.05
    netProfit := grossProfit - platformFee
    
    distributions := []Distribution{}
    
    // Capital contributors (55% or 60%)
    capitalShare := netProfit * s.getCapitalSharePercent(exec)
    for _, contributor := range exec.Capital.Contributors {
        amount := capitalShare * (contributor.Percentage / 100)
        distributions = append(distributions, Distribution{
            MemberID:   contributor.MemberID,
            Type:       "CAPITAL",
            Percentage: contributor.Percentage * (capitalShare / netProfit),
            Amount:     amount,
        })
    }
    
    // Signal contributor (25%)
    signalShare := netProfit * 0.25
    distributions = append(distributions, Distribution{
        MemberID:   exec.Participants.SignalContributor,
        Type:       "SIGNAL",
        Percentage: 25,
        Amount:     signalShare,
    })
    
    // Access contributor (10% if applicable)
    if exec.Participants.AccessContributor != "" {
        accessShare := netProfit * 0.10
        distributions = append(distributions, Distribution{
            MemberID:   exec.Participants.AccessContributor,
            Type:       "ACCESS",
            Percentage: 10,
            Amount:     accessShare,
        })
    }
    
    // Operations (5% or 10%)
    opsShare := netProfit * s.getOpsSharePercent(exec)
    distributions = append(distributions, Distribution{
        MemberID:   exec.Participants.Operator,
        Type:       "OPERATIONS",
        Percentage: opsShare / netProfit * 100,
        Amount:     opsShare,
    })
    
    return &PayoutCalculation{
        ExecutionID:   exec.ID,
        GrossProfit:   grossProfit,
        PlatformFee:   platformFee,
        NetProfit:     netProfit,
        Distributions: distributions,
    }
}
```

---

## Step 2: Create Payout Record

### API (Internal/System)
```
POST /api/v1/payouts
```

**Request:**
```json
{
  "execution_id": "exec_789abc",
  "totals": {
    "gross_profit": 4665,
    "platform_fee": 233.25,
    "distributable": 4431.75
  },
  "distributions": [
    { "member_id": "mem_001", "type": "CAPITAL", "percentage": 11, "amount": 487.49 },
    { "member_id": "mem_002", "type": "CAPITAL", "percentage": 16.5, "amount": 731.24 },
    { "member_id": "mem_003", "type": "CAPITAL", "percentage": 27.5, "amount": 1218.73 },
    { "member_id": "mem_abc", "type": "SIGNAL", "percentage": 25, "amount": 1107.94 },
    { "member_id": "mem_access", "type": "ACCESS", "percentage": 10, "amount": 443.18 },
    { "member_id": "mem_operator", "type": "OPERATIONS", "percentage": 5, "amount": 221.59 }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "payout_id": "pay_xyz123",
    "execution_id": "exec_789abc",
    "status": "PENDING",
    "totals": {
      "gross_profit": 4665,
      "platform_fee": 233.25,
      "distributable": 4431.75
    },
    "distributions_count": 6,
    "created_at": "2026-03-25T16:00:00Z"
  }
}
```

### Database Changes
```javascript
// New document in 'payouts' collection
{
  "_id": ObjectId("pay_xyz123"),
  "execution_id": ObjectId("exec_789abc"),
  "status": "PENDING",
  "totals": {
    "gross_profit": NumberDecimal("4665"),
    "platform_fee": NumberDecimal("233.25"),
    "distributable": NumberDecimal("4431.75")
  },
  "distributions": [
    {
      "member_id": ObjectId("mem_001"),
      "type": "CAPITAL",
      "percentage": 11,
      "amount": NumberDecimal("487.49"),
      "status": "PENDING"
    },
    // ... more distributions
  ],
  "created_at": ISODate("2026-03-25T16:00:00Z")
}
```

---

## Step 3: Process Distribution

### Background Job
The payout processor runs distributions atomically:

```go
func (s *PayoutEngine) ProcessPayout(payoutID string) error {
    payout := s.repo.GetByID(payoutID)
    
    // Begin transaction
    session, _ := s.db.StartSession()
    defer session.EndSession(context.Background())
    
    err := session.StartTransaction()
    if err != nil {
        return err
    }
    
    for i, dist := range payout.Distributions {
        // Create credit transaction
        tx := &Transaction{
            MemberID:    dist.MemberID,
            Type:        "DISTRIBUTION",
            Amount:      dist.Amount,
            Reference:   Reference{Type: "PAYOUT", ID: payoutID},
            Description: fmt.Sprintf("Profit distribution (%s) from execution %s", dist.Type, payout.ExecutionID),
        }
        
        // Credit member's wallet via the Money engine contract
        // (commands are synchronous through contracts; facts are events)
        err := s.money.CreditBalance(dist.MemberID, dist.Amount, tx)
        if err != nil {
            session.AbortTransaction(context.Background())
            return err
        }
        
        // Update distribution status
        payout.Distributions[i].Status = "COMPLETED"
        payout.Distributions[i].TransactionID = tx.ID
    }
    
    payout.Status = "COMPLETED"
    payout.CompletedAt = time.Now()
    
    s.repo.Update(payout)
    session.CommitTransaction(context.Background())
    
    // Publish the fact — the Notification engine reacts to
    // payout.distributed and notifies each recipient
    s.publish(Event{Type: "payout.distributed", Aggregate: Reference{Type: "payout", ID: payout.ID}, Payload: payout})
    
    return nil
}
```

---

## Step 4: View Payout (Member)

### API Call
```
GET /api/v1/payouts/{payout_id}
```

**Response (Capital Contributor):**
```json
{
  "success": true,
  "data": {
    "payout_id": "pay_xyz123",
    "execution": {
      "id": "exec_789abc",
      "opportunity_title": "Best Buy Clearance - 4K TVs at 60% Off"
    },
    "status": "COMPLETED",
    "totals": {
      "gross_profit": 4665,
      "net_profit": 4431.75,
      "roi": 56.6
    },
    "your_distribution": {
      "type": "CAPITAL",
      "contribution": 1800,
      "percentage_of_capital": 20,
      "amount_received": 487.49,
      "personal_roi": 27.1
    },
    "completed_at": "2026-03-25T16:05:00Z"
  }
}
```

**Response (Signal Contributor):**
```json
{
  "success": true,
  "data": {
    "payout_id": "pay_xyz123",
    "execution": {
      "id": "exec_789abc",
      "opportunity_title": "Best Buy Clearance - 4K TVs at 60% Off"
    },
    "status": "COMPLETED",
    "totals": {
      "gross_profit": 4665,
      "net_profit": 4431.75,
      "roi": 56.6
    },
    "your_distribution": {
      "type": "SIGNAL",
      "percentage": 25,
      "amount_received": 1107.94,
      "note": "You earned this by finding this opportunity!"
    },
    "reputation_impact": {
      "signal_score_change": +35,
      "reason": "Successful execution with 56.6% ROI"
    },
    "completed_at": "2026-03-25T16:05:00Z"
  }
}
```

---

## Step 5: List My Payouts

### API Call
```
GET /api/v1/members/me/payouts?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "payout_id": "pay_xyz123",
        "opportunity_title": "Best Buy Clearance - 4K TVs",
        "type": "CAPITAL",
        "amount": 487.49,
        "status": "COMPLETED",
        "completed_at": "2026-03-25T16:05:00Z"
      },
      {
        "payout_id": "pay_abc456",
        "opportunity_title": "Manheim Auto Auction Lot",
        "type": "SIGNAL",
        "amount": 2350.00,
        "status": "COMPLETED",
        "completed_at": "2026-03-20T10:00:00Z"
      }
    ],
    "summary": {
      "total_earned": 45680.25,
      "from_capital": 12500.00,
      "from_signals": 28500.00,
      "from_access": 4680.25,
      "payouts_count": 35
    }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

---

## Capital Return (On Completion)

In addition to profit distribution, capital contributors get their principal back:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CAPITAL RETURN + PROFIT                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Original Contribution: $1,800 (locked during execution)          │
│   + Profit Share:        $487.49                                   │
│   ─────────────────────────────                                    │
│   Total Returned:        $2,287.49 (to available balance)          │
│                                                                     │
│   Locked Balance:  $1,800 → $0                                     │
│   Available Balance: $3,200 → $5,487.49                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Capital Return Logic
Principal return is Money engine work — it reacts to `payout.recorded` / `execution.completed` and unlocks each contributor's funds.

```go
func (s *MoneyEngine) ReturnCapital(execution *Execution) error {
    for _, contributor := range execution.Capital.Contributors {
        // Return locked capital to available
        s.UnlockFunds(contributor.MemberID, contributor.Amount)
        
        // Create transaction record
        tx := &Transaction{
            MemberID:    contributor.MemberID,
            Type:        "RELEASE",
            Amount:      contributor.Amount,
            Reference:   Reference{Type: "EXECUTION", ID: execution.ID},
            Description: "Capital returned from completed execution",
        }
        s.transactionRepo.Create(tx)
    }
    return nil
}
```

---

## Handling Losses

If an execution results in a loss:

### Loss Distribution
```
┌─────────────────────────────────────────────────────────────────────┐
│                      LOSS SCENARIO                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Capital Spent:   $7,835                                          │
│   Revenue Recovered: $6,000                                        │
│   ─────────────────────                                            │
│   Loss:           $1,835                                           │
│                                                                     │
│   Distribution:                                                     │
│   - Capital contributors absorb loss proportionally                │
│   - Signal contributor: $0 (no penalty, but reputation impact)     │
│   - Access contributor: $0                                         │
│   - Operations: $0                                                 │
│                                                                     │
│   Capital Return:                                                   │
│   - Original: $1,800                                               │
│   - Loss share: -$367 (20% of $1,835)                             │
│   - Returned: $1,433                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Reputation Impact
| Role | Loss Impact |
|------|-------------|
| Signal Contributor | -10 to -30 score (based on loss severity) |
| Access Contributor | No impact (unless access was the problem) |
| Operator | Minor impact if execution was handled properly |

---

## Notifications

| Event | Type | Recipients |
|-------|------|------------|
| Payout calculated | `PAYOUT_PENDING` | All recipients |
| Payout completed | `PAYOUT_COMPLETED` | All recipients |
| Loss incurred | `EXECUTION_LOSS` | Capital contributors, signal contributor |

### Payout Notification Example
```json
{
  "type": "PAYOUT_COMPLETED",
  "title": "Payout Received!",
  "body": "You received $487.49 from 'Best Buy Clearance - 4K TVs'. Your capital investment returned 27.1%.",
  "data": {
    "payout_id": "pay_xyz123",
    "amount": 487.49,
    "type": "CAPITAL"
  }
}
```

---

## Audit Trail

```javascript
// payout.created
{
  "action": "payout.created",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "payout", "id": "pay_xyz123" },
  "details": {
    "execution_id": "exec_789abc",
    "gross_profit": 4665,
    "net_profit": 4431.75,
    "distributions_count": 6
  }
}

// payout.distributed
{
  "action": "payout.distributed",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "payout", "id": "pay_xyz123" },
  "details": {
    "member_id": "mem_001",
    "type": "CAPITAL",
    "amount": 487.49,
    "transaction_id": "tx_abc123"
  }
}

// payout.completed
{
  "action": "payout.completed",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "payout", "id": "pay_xyz123" },
  "details": {
    "total_distributed": 4431.75,
    "recipients_count": 6
  }
}
```

---

## Configuration

### Distribution Percentages
```javascript
{
  "payout.capital_share_with_access": 55,
  "payout.capital_share_without_access": 60,
  "payout.signal_share": 25,
  "payout.access_share": 10,
  "payout.operations_share_with_access": 5,
  "payout.operations_share_without_access": 10,
  "payout.platform_share": 5
}
```

### Tier Bonuses
Signal contributors with higher tiers earn bonus:

| Tier | Signal Share |
|------|--------------|
| BRONZE | 25% |
| SILVER | 27% |
| GOLD | 29% |
| PLATINUM | 30% |

Bonus comes from reduced platform share.
