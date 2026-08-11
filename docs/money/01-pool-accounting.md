# Money Management: Pool Accounting

## Overview

The capital pool is the heart of MERIDIAN's financial operations. This document describes how the pool is structured, tracked, and managed.

**Owner:** All pool logic lives in the **Money engine**. Allocation is triggered by the `execution.funding_requested` event; principal and profit flow back when the execution completes. The Money engine never calls other engines — it reacts to facts and publishes facts.

---

## Pool Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAPITAL POOL                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Total Pool Capital: $1,250,000                                   │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    AVAILABLE (60%)                           │ │
│   │                       $750,000                               │ │
│   │                                                              │ │
│   │   Ready to be deployed to approved opportunities            │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    DEPLOYED (25%)                            │ │
│   │                       $312,500                               │ │
│   │                                                              │ │
│   │   Currently locked in active executions                     │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │                    RESERVE (15%)                             │ │
│   │                       $187,500                               │ │
│   │                                                              │ │
│   │   Platform reserve for losses, operations, emergencies      │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pool Components

### 1. Total Pool Capital
Sum of all member capital accounts (available + locked).

```go
func (s *MoneyEngine) GetTotalCapital() float64 {
    result := s.db.Aggregate([]bson.M{
        {"$group": bson.M{
            "_id": nil,
            "total": bson.M{"$sum": bson.M{
                "$add": []string{"$balances.available", "$balances.locked"},
            }},
        }},
    })
    return result.Total
}
```

### 2. Available Capital
Capital that can be allocated to new opportunities.

```go
func (s *MoneyEngine) GetAvailableCapital() float64 {
    result := s.db.Aggregate([]bson.M{
        {"$group": bson.M{
            "_id": nil,
            "available": bson.M{"$sum": "$balances.available"},
        }},
    })
    return result.Available
}
```

### 3. Deployed Capital
Capital currently locked in active executions.

```go
func (s *MoneyEngine) GetDeployedCapital() float64 {
    result := s.db.Aggregate([]bson.M{
        {"$group": bson.M{
            "_id": nil,
            "locked": bson.M{"$sum": "$balances.locked"},
        }},
    })
    return result.Locked
}
```

### 4. Platform Reserve
Accumulated from platform fees, used for:
- Covering execution losses
- Operational expenses
- Emergency liquidity
- Future development

---

## Pool Health Metrics

### Reserve Ratio
```
Reserve Ratio = Platform Reserve / Total Pool Capital

Target: ≥ 15%
Warning: < 10%
Critical: < 5%
```

### Deployment Ratio
```
Deployment Ratio = Deployed Capital / Total Pool Capital

Healthy: 20-40%
Maximum: 50%
```

### Liquidity Ratio
```
Liquidity Ratio = Available Capital / Total Pool Capital

Healthy: ≥ 50%
Minimum: 30%
```

---

## Pool Status API

### Endpoint
```
GET /api/v1/capital/pool/status
```

### Response
```json
{
  "success": true,
  "data": {
    "totals": {
      "total_capital": "1250000.00",
      "available_capital": "750000.00",
      "deployed_capital": "312500.00",
      "platform_reserve": "187500.00"
    },
    "ratios": {
      "reserve_ratio": 15.0,
      "deployment_ratio": 25.0,
      "liquidity_ratio": 60.0
    },
    "health": {
      "status": "HEALTHY",
      "alerts": []
    },
    "activity": {
      "active_executions": 8,
      "pending_opportunities": 12,
      "contributors_count": 342
    },
    "performance": {
      "total_profit_ytd": "450000.00",
      "total_distributed_ytd": "382500.00",
      "avg_roi": 32.5,
      "executions_completed_ytd": 85
    },
    "snapshot_at": "2026-03-13T10:00:00Z"
  }
}
```

---

## Capital Flow

### Inflows

| Source | Destination | Trigger |
|--------|-------------|---------|
| Member deposit | Member available balance | Payment confirmed |
| Execution profit | Capital share to members | Payout distribution |
| Execution profit | Platform reserve (5%) | Payout distribution |

### Outflows

| Source | Destination | Trigger |
|--------|-------------|---------|
| Member available | Member locked | Execution started |
| Member locked | Member available + profit | Execution completed |
| Member available | External (bank/PayPal) | Withdrawal completed |
| Platform reserve | Cover losses | Execution loss |

---

## Allocation Algorithm

When an execution starts, capital is allocated proportionally from all members with available balance.

### Algorithm
```go
func (s *MoneyEngine) AllocateCapital(amount float64) []Allocation {
    // Reacts to execution.funding_requested
    // Get all members with available balance
    accounts := s.repo.GetAccountsWithAvailableBalance()
    
    // Calculate total available
    totalAvailable := 0.0
    for _, acc := range accounts {
        totalAvailable += acc.Balances.Available
    }
    
    // Ensure sufficient funds
    if totalAvailable < amount {
        return nil // Insufficient capital
    }
    
    // Allocate proportionally
    allocations := []Allocation{}
    remaining := amount
    
    for _, acc := range accounts {
        // Calculate proportional share
        share := acc.Balances.Available / totalAvailable
        allocation := math.Min(amount * share, remaining)
        
        if allocation > 0 {
            allocations = append(allocations, Allocation{
                MemberID:   acc.MemberID,
                Amount:     allocation,
                Percentage: (allocation / amount) * 100,
            })
            remaining -= allocation
        }
        
        if remaining <= 0 {
            break
        }
    }
    
    return allocations
}
```

### Example
```
Total Available: $750,000
Execution Needs: $50,000

Member A: $150,000 available (20%) → Allocates $10,000
Member B: $75,000 available (10%) → Allocates $5,000
Member C: $225,000 available (30%) → Allocates $15,000
Member D: $300,000 available (40%) → Allocates $20,000
─────────────────────────────────────────────────────
Total Allocated: $50,000
```

---

## Lock/Unlock Mechanics

### Locking Capital (Execution Start)
```go
func (s *MoneyEngine) LockFunds(memberID string, amount float64, executionID string) error {
    account := s.repo.GetByMemberID(memberID)
    
    if account.Balances.Available < amount {
        return ErrInsufficientBalance
    }
    
    // Atomic update
    update := bson.M{
        "$inc": bson.M{
            "balances.available": -amount,
            "balances.locked": amount,
        },
    }
    
    s.repo.UpdateByMemberID(memberID, update)
    
    // Record transaction
    s.transactionRepo.Create(&Transaction{
        MemberID:    memberID,
        Type:        "ALLOCATION",
        Amount:      -amount,
        Reference:   Reference{Type: "EXECUTION", ID: executionID},
        Description: "Capital locked for execution",
    })
    
    return nil
}
```

### Unlocking Capital (Execution Complete)
```go
func (s *MoneyEngine) UnlockFunds(memberID string, principal float64, profit float64, executionID string) error {
    totalReturn := principal + profit
    
    // Atomic update
    update := bson.M{
        "$inc": bson.M{
            "balances.locked": -principal,
            "balances.available": totalReturn,
            "lifetime.total_earned": profit,
        },
    }
    
    s.repo.UpdateByMemberID(memberID, update)
    
    // Record transactions
    s.transactionRepo.Create(&Transaction{
        MemberID:    memberID,
        Type:        "RELEASE",
        Amount:      principal,
        Reference:   Reference{Type: "EXECUTION", ID: executionID},
        Description: "Capital released from execution",
    })
    
    if profit > 0 {
        s.transactionRepo.Create(&Transaction{
            MemberID:    memberID,
            Type:        "DISTRIBUTION",
            Amount:      profit,
            Reference:   Reference{Type: "EXECUTION", ID: executionID},
            Description: "Profit distribution from execution",
        })
    }
    
    return nil
}
```

---

## Pool Snapshots

The system captures periodic snapshots of pool state for auditing and analysis.

### Snapshot Schedule
| Type | Frequency | Retention |
|------|-----------|-----------|
| HOURLY | Every hour | 7 days |
| DAILY | Midnight UTC | 90 days |
| WEEKLY | Sunday midnight | 2 years |
| MONTHLY | 1st of month | Forever |

### Snapshot Structure
```javascript
{
  "_id": ObjectId(),
  "timestamp": ISODate("2026-03-13T00:00:00Z"),
  "type": "DAILY",
  "capital": {
    "total_available": NumberDecimal("750000"),
    "total_locked": NumberDecimal("312500"),
    "total_pending": NumberDecimal("25000"),
    "reserve_balance": NumberDecimal("187500")
  },
  "members": {
    "total_members": 450,
    "active_contributors": 342,
    "capital_contributors": 320,
    "signal_contributors": 85,
    "access_contributors": 12
  },
  "activity": {
    "opportunities_submitted": 5,
    "opportunities_approved": 3,
    "executions_started": 2,
    "executions_completed": 1
  },
  "financials": {
    "deposits_today": NumberDecimal("45000"),
    "withdrawals_today": NumberDecimal("32000"),
    "profit_distributed_today": NumberDecimal("8500"),
    "platform_fees_today": NumberDecimal("425")
  }
}
```

### Snapshot API
```
GET /api/v1/admin/pool/snapshots?type=DAILY&from=2026-03-01&to=2026-03-13
```

---

## Alerts & Thresholds

### Reserve Alert Levels
| Level | Threshold | Action |
|-------|-----------|--------|
| HEALTHY | ≥ 15% | Normal operations |
| WARNING | 10-15% | Alert admins, slow new executions |
| CRITICAL | 5-10% | Pause new executions |
| EMERGENCY | < 5% | Halt all executions, emergency protocol |

### Alert Configuration
```javascript
{
  "pool.reserve_ratio_warning": 10,
  "pool.reserve_ratio_critical": 5,
  "pool.deployment_ratio_max": 50,
  "pool.liquidity_ratio_min": 30,
  "pool.single_execution_max_percent": 15
}
```

### Alert Notifications
```json
{
  "type": "POOL_ALERT",
  "level": "WARNING",
  "title": "Reserve Ratio Below Target",
  "body": "Pool reserve ratio is at 12%, below the 15% target.",
  "data": {
    "current_ratio": 12.0,
    "target_ratio": 15.0,
    "reserve_amount": "150000.00",
    "total_capital": "1250000.00"
  },
  "recipients": ["ADMIN"],
  "created_at": "2026-03-13T10:00:00Z"
}
```

---

## Reconciliation

### Daily Reconciliation
System performs daily reconciliation to ensure:
1. Sum of all member balances = Total pool capital
2. All transactions balance (debits = credits)
3. Locked amounts match active execution allocations
4. Reserve balance matches accumulated platform fees minus expenses

### Reconciliation Report
```go
type ReconciliationReport struct {
    Date              time.Time
    Status            string // BALANCED | DISCREPANCY
    MemberBalancesSum float64
    PoolTotalCapital  float64
    Discrepancy       float64
    TransactionsNet   float64
    LockedVsExecutions float64
    Issues            []string
}
```

### Discrepancy Handling
If discrepancy detected:
1. Alert admin immediately
2. Pause affected operations
3. Generate detailed audit trail
4. Manual investigation required
5. Adjustment entry if needed (with full audit)
