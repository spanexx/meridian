# Journey: Execution Flow

## Story

> **As an operator**, I want to execute approved opportunities so that the collective can realize profits from arbitrage deals.

---

## Prerequisites

- Opportunity status: `APPROVED`
- Capital pool has sufficient funds
- Access requirements met (if any)
- Operator assigned

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXECUTION LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │APPROVED │──►│ FUNDING │──►│ACQUIRING│──►│ HOLDING │──►│LIQUIDAT-│      │
│  │         │   │         │   │         │   │         │   │   ING   │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│                                                                 │          │
│       Capital        Assets         Inventory      Sales        │          │
│       allocated      purchased      managed        processed    │          │
│                                                                 ▼          │
│                                                           ┌─────────┐     │
│                                                           │COMPLETED│     │
│                                                           └─────────┘     │
│                                                                            │
│                                                           Profits          │
│                                                           distributed      │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Status Definitions

| Status | Description |
|--------|-------------|
| `FUNDING` | Capital being allocated from pool |
| `ACQUIRING` | Assets being purchased |
| `HOLDING` | Assets in storage, awaiting sale |
| `LIQUIDATING` | Assets being sold |
| `COMPLETED` | All assets sold, profits calculated |
| `FAILED` | Execution failed (partial or full) |
| `CANCELLED` | Cancelled before completion |

---

## Step 1: Start Execution (APPROVED → FUNDING)

### Automatic Trigger
When an opportunity is approved, the system queues it for execution based on priority.

### Manual Trigger (Operator)
```
POST /api/v1/executions
```

**Request:**
```json
{
  "opportunity_id": "opp_507f1f77bcf86cd799439011",
  "capital_allocation": 9000,
  "operator_notes": "Verified stock availability. Proceeding with acquisition."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789abc",
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "FUNDING",
    "capital": {
      "allocated": 9000,
      "from_pool": true,
      "contributors": [
        { "member_id": "mem_001", "amount": 1800, "percentage": 20 },
        { "member_id": "mem_002", "amount": 2700, "percentage": 30 },
        { "member_id": "mem_003", "amount": 4500, "percentage": 50 }
      ]
    },
    "participants": {
      "signal_contributor": "mem_abc",
      "operator": "mem_operator1"
    },
    "timeline": {
      "started_at": "2026-03-15T10:00:00Z"
    }
  }
}
```

### Backend Behavior
1. Verify opportunity is APPROVED status
2. Verify sufficient pool capital available
3. Create execution record
4. Publish `execution.funding_requested`

The **Money engine** reacts to `execution.funding_requested` — the Execution engine never touches capital accounts:
5. Calculate capital allocation per contributor (pro-rata based on available balance)
6. Lock capital from each contributor's account, publish `capital.allocated`

Then:
7. Execution engine reacts to `capital.allocated`: status → FUNDING, publishes `execution.funded`
8. Notification engine reacts to `execution.funded`: notifies participants
9. Kernel records every event — audit trail: `execution.started`, `capital.allocated`, `execution.funded`

### Capital Allocation Logic
This logic lives in the **Money engine** — it reacts to `execution.funding_requested`. The Execution engine never reads capital accounts.

```go
func (s *MoneyEngine) allocateCapital(amount float64) []Allocation {
    // Reacts to execution.funding_requested
    // Get all capital contributors with available balance
    contributors := s.repo.GetContributorsWithAvailableBalance()
    
    // Calculate total available
    totalAvailable := 0.0
    for _, c := range contributors {
        totalAvailable += c.AvailableBalance
    }
    
    // Allocate proportionally
    allocations := []Allocation{}
    for _, c := range contributors {
        share := c.AvailableBalance / totalAvailable
        allocation := amount * share
        allocations = append(allocations, Allocation{
            MemberID:   c.MemberID,
            Amount:     allocation,
            Percentage: share * 100,
        })
    }
    
    return allocations
}
```

### Database Changes
```javascript
// New document in 'executions' collection
{
  "_id": ObjectId("exec_789abc"),
  "opportunity_id": ObjectId("opp_507f..."),
  "status": "FUNDING",
  "participants": {
    "signal_contributor": ObjectId("mem_abc"),
    "operator": ObjectId("mem_operator1")
  },
  "capital": {
    "allocated": NumberDecimal("9000"),
    "spent": NumberDecimal("0"),
    "recovered": NumberDecimal("0"),
    "contributors": [
      { "member_id": ObjectId("mem_001"), "amount": NumberDecimal("1800"), "percentage": 20 },
      { "member_id": ObjectId("mem_002"), "amount": NumberDecimal("2700"), "percentage": 30 },
      { "member_id": ObjectId("mem_003"), "amount": NumberDecimal("4500"), "percentage": 50 }
    ]
  },
  "timeline": {
    "approved_at": ISODate("2026-03-14T14:30:00Z")
  },
  "created_at": ISODate("2026-03-15T10:00:00Z")
}

// Update capital_accounts for each contributor
// Move from 'available' to 'locked'
{
  "member_id": ObjectId("mem_001"),
  "balances": {
    "available": NumberDecimal("3200"),  // was 5000, now 5000-1800
    "locked": NumberDecimal("1800")      // was 0, now 1800
  }
}

// Create transaction records for each allocation
{
  "type": "ALLOCATION",
  "member_id": ObjectId("mem_001"),
  "amount": NumberDecimal("-1800"),
  "reference": { "type": "EXECUTION", "id": ObjectId("exec_789abc") },
  "description": "Capital allocated for execution"
}
```

---

## Step 2: Acquisition (FUNDING → ACQUIRING)

### Update Status
```
PUT /api/v1/executions/{execution_id}/status
```

**Request:**
```json
{
  "status": "ACQUIRING",
  "notes": "Capital confirmed. Proceeding to purchase."
}
```

### Record Purchase
```
POST /api/v1/executions/{execution_id}/acquisition
```

**Request:**
```json
{
  "method": "DIRECT_PURCHASE",
  "vendor": "Best Buy Store #1234",
  "items": [
    {
      "name": "Samsung 65\" 4K TV (QN65Q80B)",
      "sku": "6501234",
      "quantity": 5,
      "unit_cost": 479,
      "total_cost": 2395,
      "condition": "LIKE_NEW"
    },
    {
      "name": "LG 65\" OLED TV (OLED65C2)",
      "sku": "6505678",
      "quantity": 4,
      "unit_cost": 599,
      "total_cost": 2396,
      "condition": "LIKE_NEW"
    },
    {
      "name": "Sony 55\" 4K TV (XR55A80K)",
      "sku": "6509012",
      "quantity": 6,
      "unit_cost": 449,
      "total_cost": 2694,
      "condition": "LIKE_NEW"
    }
  ],
  "total_cost": 7485,
  "fees": 0,
  "shipping": 350,
  "invoice_reference": "INV-BB-2026031501"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789abc",
    "acquisition": {
      "method": "DIRECT_PURCHASE",
      "vendor": "Best Buy Store #1234",
      "total_cost": 7485,
      "fees": 0,
      "shipping": 350,
      "grand_total": 7835
    },
    "inventory_created": 15,
    "capital": {
      "allocated": 9000,
      "spent": 7835,
      "remaining": 1165
    }
  }
}
```

### Backend Behavior
1. Validate execution is in ACQUIRING status
2. Create inventory items from purchase
3. Update execution's `capital.spent`
4. Upload invoice document to storage
5. Update status to HOLDING
6. Log audit event: `execution.acquisition_completed`

### Database Changes
```javascript
// Update 'executions' collection
{
  "_id": ObjectId("exec_789abc"),
  "status": "HOLDING",
  "acquisition": {
    "method": "DIRECT_PURCHASE",
    "vendor": "Best Buy Store #1234",
    "total_cost": NumberDecimal("7835"),
    "invoice_url": "https://storage.../invoices/exec_789abc.pdf"
  },
  "capital": {
    "spent": NumberDecimal("7835")
  },
  "timeline": {
    "acquisition_completed_at": ISODate("2026-03-15T14:00:00Z")
  }
}

// New documents in 'inventory' collection
{
  "_id": ObjectId("inv_001"),
  "execution_id": ObjectId("exec_789abc"),
  "name": "Samsung 65\" 4K TV (QN65Q80B)",
  "sku": "6501234",
  "acquisition": {
    "cost": NumberDecimal("479"),
    "quantity": 1,
    "acquired_at": ISODate("2026-03-15T14:00:00Z")
  },
  "condition": "LIKE_NEW",
  "status": "IN_STORAGE",
  "created_at": ISODate("2026-03-15T14:00:00Z")
}
// ... (14 more inventory items)
```

---

## Step 3: Holding & Listing (HOLDING → LIQUIDATING)

### List Item for Sale
```
POST /api/v1/inventory/{inventory_id}/list
```

**Request:**
```json
{
  "channel": "EBAY",
  "list_price": 899.99,
  "listing_title": "Samsung 65\" QN65Q80B QLED 4K Smart TV - Excellent Condition",
  "listing_description": "Store display model in excellent condition. Fully functional with remote..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "inventory_id": "inv_001",
    "listing": {
      "channel": "EBAY",
      "listing_id": "ebay_294738291",
      "listing_url": "https://ebay.com/itm/294738291",
      "list_price": 899.99,
      "listed_at": "2026-03-16T10:00:00Z"
    },
    "status": "LISTED"
  }
}
```

### Batch List Items
```
POST /api/v1/executions/{execution_id}/list-batch
```

**Request:**
```json
{
  "items": [
    { "inventory_id": "inv_001", "channel": "EBAY", "list_price": 899.99 },
    { "inventory_id": "inv_002", "channel": "EBAY", "list_price": 899.99 },
    { "inventory_id": "inv_003", "channel": "AMAZON", "list_price": 929.99 }
  ]
}
```

When first item is listed, execution transitions to LIQUIDATING.

---

## Step 4: Recording Sales (During LIQUIDATING)

### Record Sale
```
POST /api/v1/inventory/{inventory_id}/sale
```

**Request:**
```json
{
  "sale_price": 875.00,
  "fees": 87.50,
  "shipping_cost": 45.00,
  "buyer_info": "buyer_xyz (eBay)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "inventory_id": "inv_001",
    "sale": {
      "sold_at": "2026-03-18T15:30:00Z",
      "sale_price": 875.00,
      "fees": 87.50,
      "shipping_cost": 45.00,
      "net_proceeds": 742.50
    },
    "status": "SOLD",
    "execution_progress": {
      "items_sold": 1,
      "items_total": 15,
      "revenue_so_far": 742.50,
      "projected_profit": 5800
    }
  }
}
```

### Backend Behavior
1. Update inventory item with sale details
2. Calculate net proceeds: `sale_price - fees - shipping`
3. Update execution's `capital.recovered`
4. Create transaction record
5. Check if all items sold → transition to COMPLETED

---

## Step 5: Completion (LIQUIDATING → COMPLETED)

When all inventory items are sold (or marked as unsold/returned), the execution completes.

### Auto-Completion Check
```go
func (s *ExecutionEngine) checkCompletion(executionID string) {
    execution := s.repo.GetByID(executionID)
    inventory := s.inventoryRepo.GetByExecution(executionID)
    
    allResolved := true
    for _, item := range inventory {
        if item.Status == "LISTED" || item.Status == "IN_STORAGE" {
            allResolved = false
            break
        }
    }
    
    if allResolved {
        s.completeExecution(execution)
    }
}
```

### Manual Completion (Operator)
```
POST /api/v1/executions/{execution_id}/complete
```

**Request:**
```json
{
  "notes": "All items sold. Proceeding to profit distribution."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789abc",
    "status": "COMPLETED",
    "financials": {
      "total_cost": 7835,
      "total_revenue": 12500,
      "gross_profit": 4665,
      "platform_fee": 233.25,
      "net_profit": 4431.75,
      "roi": 56.6
    },
    "timeline": {
      "started_at": "2026-03-15T10:00:00Z",
      "completed_at": "2026-03-25T16:00:00Z",
      "duration_days": 10
    },
    "payout_scheduled": true,
    "payout_id": "pay_xyz123"
  }
}
```

### Backend Behavior
1. Calculate final financials
2. Return unused capital to pool (if any)
3. Unlock capital from contributor accounts
4. Create payout record
5. Queue payout distribution
6. Update reputation scores:
   - Signal contributor: based on actual ROI
   - Operators: based on execution efficiency
7. Notify all participants
8. Log audit event: `execution.completed`

---

## Execution Monitoring

### Get Execution Details
```
GET /api/v1/executions/{execution_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_789abc",
    "opportunity": {
      "id": "opp_507f...",
      "title": "Best Buy Clearance - 4K TVs at 60% Off"
    },
    "status": "LIQUIDATING",
    "participants": {
      "signal_contributor": {
        "member_id": "mem_abc",
        "display_name": "dealfinder42",
        "share": 25
      },
      "access_contributor": null,
      "operator": {
        "member_id": "mem_operator1",
        "display_name": "ops_manager"
      }
    },
    "capital": {
      "allocated": 9000,
      "spent": 7835,
      "recovered": 8250,
      "contributors_count": 45
    },
    "inventory": {
      "total_items": 15,
      "sold": 10,
      "listed": 3,
      "in_storage": 2,
      "returned": 0
    },
    "financials": {
      "revenue_to_date": 8250,
      "costs_to_date": 7835,
      "projected_profit": 4200,
      "projected_roi": 53.6
    },
    "timeline": {
      "started_at": "2026-03-15T10:00:00Z",
      "acquisition_completed_at": "2026-03-15T14:00:00Z",
      "liquidation_started_at": "2026-03-16T10:00:00Z",
      "estimated_completion": "2026-03-28T00:00:00Z"
    }
  }
}
```

### Get Execution Inventory
```
GET /api/v1/executions/{execution_id}/inventory
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "inventory_id": "inv_001",
        "name": "Samsung 65\" 4K TV",
        "acquisition_cost": 479,
        "status": "SOLD",
        "sale": {
          "sale_price": 875,
          "net_proceeds": 742.50
        },
        "profit": 263.50,
        "roi": 55.0
      },
      {
        "inventory_id": "inv_002",
        "name": "Samsung 65\" 4K TV",
        "acquisition_cost": 479,
        "status": "LISTED",
        "listing": {
          "channel": "EBAY",
          "list_price": 899.99,
          "days_listed": 5
        }
      }
    ],
    "summary": {
      "total_acquisition_cost": 7485,
      "total_revenue": 8250,
      "total_profit": 415,
      "avg_roi": 52.3,
      "avg_days_to_sell": 4.2
    }
  }
}
```

---

## Failure Handling

### Mark Item as Unsellable
```
POST /api/v1/inventory/{inventory_id}/write-off
```

**Request:**
```json
{
  "reason": "DAMAGED",
  "notes": "Screen damaged during shipping. Cannot be resold.",
  "salvage_value": 50
}
```

### Cancel Execution
```
POST /api/v1/executions/{execution_id}/cancel
```

**Request:**
```json
{
  "reason": "OPPORTUNITY_EXPIRED",
  "notes": "Sale ended before we could purchase."
}
```

Cancellation:
- Returns all locked capital to contributors
- Updates execution status to CANCELLED
- No payout distributed
- Signal contributor reputation unaffected (if external cause)

---

## Notifications

| Event | Type | Recipients |
|-------|------|------------|
| Execution started | `EXECUTION_STARTED` | Signal contributor, capital contributors |
| Acquisition complete | `EXECUTION_ACQUIRED` | All participants |
| First sale | `EXECUTION_FIRST_SALE` | Signal contributor |
| Execution complete | `EXECUTION_COMPLETED` | All participants |
| Payout ready | `PAYOUT_READY` | All participants |

---

## Audit Trail

```javascript
// execution.started
{
  "action": "execution.started",
  "actor": { "type": "MEMBER", "id": "operator_123" },
  "resource": { "type": "execution", "id": "exec_789abc" },
  "details": {
    "opportunity_id": "opp_507f...",
    "capital_allocated": 9000,
    "contributors_count": 45
  }
}

// execution.acquisition_completed
{
  "action": "execution.acquisition_completed",
  "actor": { "type": "MEMBER", "id": "operator_123" },
  "resource": { "type": "execution", "id": "exec_789abc" },
  "details": {
    "vendor": "Best Buy Store #1234",
    "items_acquired": 15,
    "total_cost": 7835
  }
}

// execution.completed
{
  "action": "execution.completed",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "execution", "id": "exec_789abc" },
  "details": {
    "gross_profit": 4665,
    "net_profit": 4431.75,
    "roi": 56.6,
    "duration_days": 10
  }
}
```
