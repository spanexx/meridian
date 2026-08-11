# Money Management: Profit Calculation & Distribution

## Overview

This document explains how profits are calculated for each execution and how they are distributed among participants.

**Ownership:** financials calculation is Execution engine work (revenue, costs, inventory); the profit split and distribution are Payout engine work, reacting to `execution.completed`. Neither engine calls the other — the event is the handoff.

---

## Profit Calculation

### Basic Formula
```
Gross Profit = Total Revenue - Total Costs

Where:
  Total Revenue = Sum of all sales proceeds
  Total Costs = Acquisition + Fees + Shipping + Storage + Operations
```

### Detailed Breakdown

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROFIT CALCULATION EXAMPLE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   REVENUE                                                          │
│   ───────────────────────────────────────────                      │
│   Item Sales:              $12,500.00                              │
│   - Marketplace Fees:       -$875.00 (7%)                          │
│   - Shipping (outbound):    -$450.00                               │
│   ───────────────────────────────────────────                      │
│   Net Revenue:             $11,175.00                              │
│                                                                     │
│   COSTS                                                            │
│   ───────────────────────────────────────────                      │
│   Acquisition:              $7,485.00                              │
│   Shipping (inbound):         $350.00                              │
│   Storage:                    $100.00                              │
│   Insurance:                   $75.00                              │
│   Miscellaneous:               $25.00                              │
│   ───────────────────────────────────────────                      │
│   Total Costs:              $8,035.00                              │
│                                                                     │
│   PROFIT                                                           │
│   ───────────────────────────────────────────                      │
│   Gross Profit:             $3,140.00                              │
│   - Platform Fee (5%):       -$157.00                              │
│   ───────────────────────────────────────────                      │
│   Net Distributable:        $2,983.00                              │
│                                                                     │
│   ROI: 37.1% ($2,983 / $8,035)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Distribution Formula

### Standard Split (With Access Contributor)
```
Capital Share    = Net Profit × 55%
Signal Share     = Net Profit × 25%
Access Share     = Net Profit × 10%
Operations Share = Net Profit × 5%
Platform Share   = Net Profit × 5%  (already deducted as fee)
```

### Without Access Contributor
```
Capital Share    = Net Profit × 60%
Signal Share     = Net Profit × 25%
Operations Share = Net Profit × 10%
Platform Share   = Net Profit × 5%
```

---

## Capital Distribution

Capital share is distributed proportionally among all capital contributors based on their allocation percentage.

### Formula
```
Member Capital Payout = Capital Share × (Member Allocation / Total Allocation)
```

### Example
```
Net Profit: $2,983.00
Capital Share (55%): $1,640.65

Contributor A: Allocated $10,000 (20%) → $328.13
Contributor B: Allocated $15,000 (30%) → $492.20
Contributor C: Allocated $25,000 (50%) → $820.33
───────────────────────────────────────────────
Total Capital Distribution: $1,640.66
```

### Return Calculation Per Contributor
```go
type ContributorReturn struct {
    MemberID       string
    Allocation     float64  // Amount locked for this execution
    ProfitShare    float64  // Their share of capital distribution
    TotalReturn    float64  // Allocation + ProfitShare
    PersonalROI    float64  // (ProfitShare / Allocation) × 100
}

func CalculateContributorReturn(contributor Allocation, capitalShare float64, totalAllocated float64) ContributorReturn {
    sharePercent := contributor.Amount / totalAllocated
    profitShare := capitalShare * sharePercent
    
    return ContributorReturn{
        MemberID:    contributor.MemberID,
        Allocation:  contributor.Amount,
        ProfitShare: profitShare,
        TotalReturn: contributor.Amount + profitShare,
        PersonalROI: (profitShare / contributor.Amount) * 100,
    }
}
```

---

## Signal Contributor Bonuses

Signal contributors can earn bonus percentage based on their reputation tier.

### Tier Bonuses
| Tier | Base Share | Bonus | Total Share |
|------|------------|-------|-------------|
| BRONZE | 25% | 0% | 25% |
| SILVER | 25% | +2% | 27% |
| GOLD | 25% | +4% | 29% |
| PLATINUM | 25% | +5% | 30% |

Bonus comes from reduced platform share.

### Example
```
Net Profit: $2,983.00
Signal Contributor Tier: GOLD

Base Share: $2,983 × 25% = $745.75
Tier Bonus: $2,983 × 4% = $119.32
─────────────────────────────────────
Total Signal Payout: $865.07
```

---

## Operations Distribution

If multiple operators involved, operations share is split based on role.

### Standard Split
| Role | Share of Operations |
|------|---------------------|
| Lead Operator | 60% |
| Acquisition Support | 25% |
| Liquidation Support | 15% |

### Example
```
Operations Share: $149.15

Lead Operator:        $89.49 (60%)
Acquisition Support:  $37.29 (25%)
Liquidation Support:  $22.37 (15%)
```

---

## Loss Handling

When an execution results in a loss:

### Loss Distribution
```
┌─────────────────────────────────────────────────────────────────────┐
│                       LOSS SCENARIO                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Total Costs:     $8,035.00                                       │
│   Total Revenue:   $6,000.00                                       │
│   ───────────────────────────────────────────                      │
│   Net Loss:       -$2,035.00                                       │
│                                                                     │
│   LOSS ABSORPTION                                                   │
│   ───────────────────────────────────────────                      │
│   1. Platform Reserve covers first 25%:        -$508.75            │
│   2. Remaining loss to capital contributors:   -$1,526.25          │
│                                                                     │
│   CAPITAL LOSS DISTRIBUTION (proportional)                         │
│   Contributor A (20%): -$305.25 → Returns $9,694.75                │
│   Contributor B (30%): -$457.88 → Returns $14,542.12               │
│   Contributor C (50%): -$763.13 → Returns $24,236.87               │
│                                                                     │
│   OTHER PARTICIPANTS                                               │
│   Signal Contributor: $0 (no penalty, reputation impact only)      │
│   Access Contributor: $0                                           │
│   Operations: $0                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Loss Coverage Rules
1. Platform reserve covers first 25% of loss (up to 5% of reserve)
2. Remaining loss distributed among capital contributors proportionally
3. Signal/access/operations contributors don't lose money
4. Reputation impact applied to signal contributor

### Loss Limits
```javascript
{
  "loss.platform_coverage_percent": 25,
  "loss.platform_coverage_max_of_reserve": 5,
  "loss.max_per_execution_percent": 50 // Trigger emergency if loss > 50%
}
```

---

## Profit Calculation Code

### Full Calculation Function
```go
type ExecutionFinancials struct {
    ExecutionID     string
    
    // Revenue
    GrossSales      float64
    MarketplaceFees float64
    ShippingOut     float64
    NetRevenue      float64
    
    // Costs
    AcquisitionCost float64
    ShippingIn      float64
    StorageCost     float64
    InsuranceCost   float64
    OtherCosts      float64
    TotalCosts      float64
    
    // Profit
    GrossProfit     float64
    PlatformFee     float64
    NetProfit       float64
    ROI             float64
    
    // Flags
    IsProfit        bool
    IsLoss          bool
}

func CalculateExecutionFinancials(exec *Execution, inventory []InventoryItem) *ExecutionFinancials {
    fin := &ExecutionFinancials{ExecutionID: exec.ID}
    
    // Calculate revenue from sales
    for _, item := range inventory {
        if item.Status == "SOLD" {
            fin.GrossSales += item.Sale.SalePrice
            fin.MarketplaceFees += item.Sale.Fees
            fin.ShippingOut += item.Sale.ShippingCost
        }
    }
    fin.NetRevenue = fin.GrossSales - fin.MarketplaceFees - fin.ShippingOut
    
    // Calculate costs
    fin.AcquisitionCost = exec.Acquisition.TotalCost
    fin.ShippingIn = exec.Acquisition.Shipping
    fin.StorageCost = exec.Logistics.StorageCost
    fin.InsuranceCost = exec.Logistics.InsuranceCost
    fin.OtherCosts = exec.Logistics.OtherCosts
    fin.TotalCosts = fin.AcquisitionCost + fin.ShippingIn + fin.StorageCost + 
                     fin.InsuranceCost + fin.OtherCosts
    
    // Calculate profit
    fin.GrossProfit = fin.NetRevenue - fin.TotalCosts
    fin.PlatformFee = math.Max(0, fin.GrossProfit * 0.05) // Only on profit
    fin.NetProfit = fin.GrossProfit - fin.PlatformFee
    
    // Calculate ROI
    if fin.TotalCosts > 0 {
        fin.ROI = (fin.NetProfit / fin.TotalCosts) * 100
    }
    
    fin.IsProfit = fin.NetProfit > 0
    fin.IsLoss = fin.NetProfit < 0
    
    return fin
}
```

### Distribution Calculation
```go
type ProfitDistribution struct {
    ExecutionID   string
    NetProfit     float64
    
    CapitalTotal  float64
    SignalTotal   float64
    AccessTotal   float64
    OpsTotal      float64
    PlatformTotal float64
    
    CapitalDistributions []MemberDistribution
    SignalDistribution   MemberDistribution
    AccessDistribution   *MemberDistribution // nil if no access contributor
    OpsDistributions     []MemberDistribution
}

type MemberDistribution struct {
    MemberID   string
    Type       string
    Amount     float64
    Percentage float64
}

func CalculateDistribution(exec *Execution, financials *ExecutionFinancials) *ProfitDistribution {
    dist := &ProfitDistribution{
        ExecutionID: exec.ID,
        NetProfit:   financials.NetProfit,
    }
    
    if financials.IsLoss {
        return calculateLossDistribution(exec, financials)
    }
    
    netProfit := financials.NetProfit
    hasAccess := exec.Participants.AccessContributor != ""
    
    // Calculate shares based on whether access contributor exists
    if hasAccess {
        dist.CapitalTotal = netProfit * 0.55
        dist.SignalTotal = netProfit * 0.25
        dist.AccessTotal = netProfit * 0.10
        dist.OpsTotal = netProfit * 0.05
    } else {
        dist.CapitalTotal = netProfit * 0.60
        dist.SignalTotal = netProfit * 0.25
        dist.OpsTotal = netProfit * 0.10
    }
    
    // Apply signal tier bonus
    signalTier := getSignalContributorTier(exec.Participants.SignalContributor)
    bonus := getTierBonus(signalTier)
    if bonus > 0 {
        bonusAmount := netProfit * bonus
        dist.SignalTotal += bonusAmount
        dist.PlatformTotal -= bonusAmount // Comes from platform share
    }
    
    // Distribute capital share among contributors
    totalAllocated := exec.Capital.Allocated
    for _, contrib := range exec.Capital.Contributors {
        sharePercent := contrib.Amount / totalAllocated
        amount := dist.CapitalTotal * sharePercent
        dist.CapitalDistributions = append(dist.CapitalDistributions, MemberDistribution{
            MemberID:   contrib.MemberID,
            Type:       "CAPITAL",
            Amount:     amount,
            Percentage: sharePercent * 100,
        })
    }
    
    // Signal distribution
    dist.SignalDistribution = MemberDistribution{
        MemberID:   exec.Participants.SignalContributor,
        Type:       "SIGNAL",
        Amount:     dist.SignalTotal,
        Percentage: 25 + (bonus * 100),
    }
    
    // Access distribution (if applicable)
    if hasAccess {
        dist.AccessDistribution = &MemberDistribution{
            MemberID:   exec.Participants.AccessContributor,
            Type:       "ACCESS",
            Amount:     dist.AccessTotal,
            Percentage: 10,
        }
    }
    
    // Operations distribution
    dist.OpsDistributions = distributeOpsShare(exec, dist.OpsTotal)
    
    return dist
}
```

---

## Payout Timeline

### Standard Timeline
```
Execution Completed
        │
        ▼ (Immediate)
Financials Calculated
        │
        ▼ (Within 1 hour)
Payout Record Created
        │
        ▼ (Within 4 hours)
Distributions Processed
        │
        ▼ (Immediate)
Member Wallets Credited
        │
        ▼ (Immediate)
Notifications Sent
```

### Delayed Payout (Large Amounts)
For executions with profit > $50,000:
- 24-hour review period
- Admin approval required
- Stepped distribution possible

---

## Tax Reporting

### Member Tax Summary
```
GET /api/v1/members/me/tax-summary?year=2026
```

```json
{
  "year": 2026,
  "member_id": "mem_123",
  "totals": {
    "capital_earnings": "12500.00",
    "signal_earnings": "28500.00",
    "access_earnings": "4680.25",
    "operations_earnings": "2500.00",
    "total_earnings": "48180.25"
  },
  "payouts": [
    {
      "date": "2026-03-25",
      "execution_title": "Best Buy Clearance",
      "type": "CAPITAL",
      "amount": "487.49"
    }
  ],
  "1099_eligible": true,
  "1099_threshold": "600.00"
}
```

### Platform Reporting
System generates:
- 1099-MISC for US members earning > $600
- Summary reports for international tax compliance
- Audit-ready transaction logs
