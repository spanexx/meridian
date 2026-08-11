# Journey: Signal Submission

## Story

> **As a member with market knowledge**, I want to submit an arbitrage opportunity so that I can earn a share of the profits without needing to contribute capital.

---

## Prerequisites

- Member status: `ACTIVE`
- Email verified
- No KYC required (signals don't involve money handling)

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SIGNAL SUBMISSION FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │  Find   │───►│ Create  │───►│  Add    │───►│ Submit  │        │
│   │  Deal   │    │  Draft  │    │Evidence │    │   for   │        │
│   └─────────┘    └─────────┘    └─────────┘    │ Vetting │        │
│                                                └─────────┘        │
│   Member spots    Basic info     Screenshots,         │            │
│   opportunity     entered        links, docs          │            │
│                                                       ▼            │
│                                                ┌─────────┐        │
│                                                │ Vetting │        │
│                                                │ Process │        │
│                                                └─────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Find an Opportunity

Member identifies an arbitrage opportunity in the real world. Examples:

| Category | Example Opportunity |
|----------|---------------------|
| Retail Arbitrage | Best Buy clearance TVs at 60% off retail |
| Liquidation | Bankrupt electronics store auction |
| Vehicle | Dealer auction with below-market Mercedes |
| Real Estate | Tax lien certificate at 40% of property value |
| Digital | Premium domain available at registration price |
| Commodity | Wholesale coffee below spot price |

---

## Step 2: Create Draft Opportunity

### API Call
```
POST /api/v1/opportunities
```

**Request:**
```json
{
  "title": "Best Buy Clearance - 4K TVs at 60% Off",
  "description": "Best Buy store #1234 in Austin is closing. All display model TVs are 60% off retail. Samsung and LG 65\" 4K models at $400-600 that resell for $900-1200 on eBay.",
  "category": "RETAIL_ARBITRAGE",
  "details": {
    "source": {
      "name": "Best Buy",
      "url": "https://bestbuy.com/store-closing",
      "location": "Austin, TX"
    },
    "acquisition": {
      "estimated_cost": 8500,
      "quantity": 15,
      "unit": "units",
      "deadline": "2026-03-20T23:59:59Z"
    },
    "resale": {
      "estimated_value": 15000,
      "channels": ["ebay", "facebook_marketplace", "local"],
      "time_to_liquidate": "2-3 weeks"
    },
    "requirements": {
      "capital_needed": 9000,
      "access_needed": [],
      "skills_needed": ["shipping", "listing"]
    }
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "DRAFT",
    "title": "Best Buy Clearance - 4K TVs at 60% Off",
    "category": "RETAIL_ARBITRAGE",
    "calculated": {
      "estimated_profit": 6500,
      "estimated_roi": 72.2,
      "risk_level": "LOW",
      "confidence_required": "MEDIUM"
    },
    "validation": {
      "is_complete": false,
      "missing_fields": [],
      "warnings": ["Consider adding photographic evidence"]
    },
    "created_at": "2026-03-13T10:00:00Z"
  }
}
```

### Backend Behavior
1. Validate member is active
2. Validate required fields
3. Auto-calculate financials:
   - `estimated_profit` = estimated_value - estimated_cost
   - `estimated_roi` = (profit / cost) × 100
   - `risk_level` based on category + ROI + time_to_liquidate
4. Check for duplicate opportunities (similar title/source/location)
5. Create opportunity with status "DRAFT"
6. Log audit event: `opportunity.created`

### Database Changes
```javascript
// New document in 'opportunities' collection
{
  "_id": ObjectId("opp_507f1f77bcf86cd799439011"),
  "submitted_by": ObjectId("507f1f77bcf86cd799439011"),
  "title": "Best Buy Clearance - 4K TVs at 60% Off",
  "description": "...",
  "category": "RETAIL_ARBITRAGE",
  "details": { ... },
  "financials": {
    "estimated_profit": NumberDecimal("6500"),
    "estimated_roi": 72.2,
    "risk_level": "LOW",
    "confidence": "MEDIUM"
  },
  "evidence": [],
  "status": "DRAFT",
  "vetting": null,
  "created_at": ISODate("2026-03-13T10:00:00Z"),
  "updated_at": ISODate("2026-03-13T10:00:00Z")
}
```

---

## Step 3: Add Evidence

Evidence increases approval chances and signal contributor reputation.

### Upload Evidence File
```
POST /api/v1/opportunities/{opportunity_id}/evidence
Content-Type: multipart/form-data
```

**Request (Form Data):**
```
file: [binary image/document]
type: "SCREENSHOT"
description: "Price tag showing $479 for Samsung 65\" TV"
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "evidence_id": "ev_abc123",
    "type": "SCREENSHOT",
    "url": "https://storage.meridian.com/evidence/opp_507f/ev_abc123.jpg",
    "description": "Price tag showing $479 for Samsung 65\" TV",
    "uploaded_at": "2026-03-13T10:05:00Z"
  }
}
```

### Evidence Types
| Type | Format | Purpose |
|------|--------|---------|
| `SCREENSHOT` | Image | Price listings, auction pages |
| `LINK` | URL | Source website, listing page |
| `DOCUMENT` | PDF | Auction catalog, invoice |
| `VIDEO` | Video | Store walkthrough, condition check |

### Backend Behavior
1. Validate file type and size (max 10MB)
2. Upload to S3-compatible storage
3. Generate thumbnail (for images)
4. Append to opportunity's evidence array
5. Update opportunity `updated_at`

---

## Step 4: Update Opportunity (Optional)

While in DRAFT status, member can update details.

### API Call
```
PUT /api/v1/opportunities/{opportunity_id}
```

**Request:**
```json
{
  "details": {
    "acquisition": {
      "estimated_cost": 8000,
      "quantity": 14
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "DRAFT",
    "calculated": {
      "estimated_profit": 7000,
      "estimated_roi": 87.5,
      "risk_level": "LOW"
    },
    "updated_at": "2026-03-13T10:10:00Z"
  }
}
```

---

## Step 5: Submit for Vetting

### API Call
```
POST /api/v1/opportunities/{opportunity_id}/submit
```

**Request:**
```json
{
  "confidence": "HIGH",
  "notes": "Visited store yesterday. Stock is confirmed. Sale ends March 20."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "SUBMITTED",
    "submitted_at": "2026-03-13T10:15:00Z",
    "vetting": {
      "status": "PENDING",
      "auto_checks": {
        "duplicate_check": "PASSED",
        "fraud_check": "PASSED",
        "math_validation": "PASSED"
      },
      "estimated_review_time": "24-48 hours"
    }
  }
}
```

### Backend Behavior
1. Validate opportunity is in DRAFT status
2. Validate all required fields are complete
3. Run auto-vetting checks:
   - **Duplicate check**: Similar opportunities in last 30 days
   - **Fraud check**: Known scam patterns, suspicious URLs
   - **Math validation**: ROI within reasonable bounds
4. Update status to "SUBMITTED"
5. Queue for human vetting (if auto-checks pass)
6. Notify vetters of new opportunity
7. Log audit event: `opportunity.submitted`

### Auto-Vetting Checks

| Check | What It Does | Fail Condition |
|-------|--------------|----------------|
| Duplicate | Searches existing opportunities | >80% similarity score |
| Fraud | Pattern matching against known scams | Matches scam database |
| Math | Validates ROI calculations | ROI > 500% or negative |
| Source | Validates source URL | Known fake/phishing site |

---

## Step 6: Track Vetting Status

### API Call
```
GET /api/v1/opportunities/{opportunity_id}
```

**Response (During Vetting):**
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "VETTING",
    "title": "Best Buy Clearance - 4K TVs at 60% Off",
    "vetting": {
      "status": "IN_PROGRESS",
      "started_at": "2026-03-13T12:00:00Z",
      "votes": {
        "approve": 2,
        "reject": 0,
        "required": 3
      },
      "auto_checks": {
        "duplicate_check": "PASSED",
        "fraud_check": "PASSED",
        "math_validation": "PASSED"
      }
    }
  }
}
```

---

## Step 7: Vetting Complete

### Approved
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "APPROVED",
    "vetting": {
      "result": "APPROVED",
      "completed_at": "2026-03-14T14:30:00Z",
      "votes": {
        "approve": 3,
        "reject": 0,
        "required": 3
      }
    },
    "next_steps": "Opportunity queued for execution. You'll be notified when it starts."
  }
}
```

### Rejected
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "status": "REJECTED",
    "vetting": {
      "result": "REJECTED",
      "completed_at": "2026-03-14T14:30:00Z",
      "rejection_reason": "Sale ended before submission. Opportunity is no longer valid.",
      "votes": {
        "approve": 0,
        "reject": 3,
        "required": 3
      }
    },
    "reputation_impact": {
      "signal_score_change": -5,
      "reason": "Submitted invalid/expired opportunity"
    }
  }
}
```

---

## Opportunity Categories

### RETAIL_ARBITRAGE
- Store clearance, closeouts, sales
- Price differences between retailers
- Seasonal discounts

**Required Details:**
- Store name and location
- Product SKUs or descriptions
- Current price vs. resale price
- Sale end date

### LIQUIDATION
- Bankruptcy auctions
- Business closures
- Estate sales

**Required Details:**
- Auction house/venue
- Lot descriptions
- Estimated value
- Auction date/time

### VEHICLE
- Dealer-only auctions
- Salvage vehicles
- Fleet sales

**Required Details:**
- Vehicle VIN or description
- Condition report
- Market value comparison
- Auction access requirements

### REAL_ESTATE
- Foreclosures
- Tax liens
- Distressed properties

**Required Details:**
- Property address
- Appraised value
- Asking price
- Property condition

### DIGITAL
- Domain names
- Websites
- Digital assets

**Required Details:**
- Asset identifier
- Current price
- Comparable sales
- Traffic/revenue data

### COMMODITY
- Bulk goods
- Raw materials
- Wholesale lots

**Required Details:**
- Product specification
- Quantity available
- Market price comparison
- Storage requirements

---

## Reputation Impact

### On Submission
| Outcome | Signal Score Impact |
|---------|---------------------|
| Approved + Executed + Profitable | +20 to +50 (based on ROI) |
| Approved + Executed + Loss | -10 to -30 (based on loss) |
| Approved but not executed | 0 |
| Rejected (valid reasons) | -5 |
| Rejected (fraud/duplicate) | -20 |
| Auto-check failure | -10 |

### Signal Contributor Benefits
| Tier | Approval Rate | Signal Share | Max Opportunity Size |
|------|---------------|--------------|----------------------|
| Bronze | Any | 25% | $10,000 |
| Silver | >50% | 27% | $25,000 |
| Gold | >70% | 29% | $50,000 |
| Platinum | >85% | 30% | $100,000 |

---

## Notifications

| Event | Type | Channels |
|-------|------|----------|
| Draft saved | `OPPORTUNITY_DRAFT_SAVED` | In-app |
| Submitted | `OPPORTUNITY_SUBMITTED` | In-app |
| Vetting started | `OPPORTUNITY_VETTING_STARTED` | In-app |
| Approved | `OPPORTUNITY_APPROVED` | Email, In-app, Push |
| Rejected | `OPPORTUNITY_REJECTED` | Email, In-app |
| Execution started | `OPPORTUNITY_EXECUTING` | Email, In-app, Push |
| Execution completed | `OPPORTUNITY_COMPLETED` | Email, In-app, Push |

---

## My Opportunities List

### API Call
```
GET /api/v1/opportunities/mine?status=all&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "opportunity_id": "opp_507f...",
        "title": "Best Buy Clearance - 4K TVs",
        "status": "APPROVED",
        "submitted_at": "2026-03-13T10:15:00Z",
        "financials": {
          "estimated_profit": 6500,
          "estimated_roi": 72.2
        }
      }
    ],
    "summary": {
      "total_submitted": 15,
      "approved": 10,
      "rejected": 3,
      "pending": 2,
      "total_profit_generated": 45000,
      "avg_roi": 45.5
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

## Error Handling

### Incomplete Submission
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot submit incomplete opportunity",
    "details": {
      "missing_fields": ["details.acquisition.deadline", "details.resale.channels"]
    }
  }
}
```

### Duplicate Detected
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_OPPORTUNITY",
    "message": "A similar opportunity was submitted recently",
    "details": {
      "similar_opportunity_id": "opp_xyz...",
      "similarity_score": 85,
      "submitted_at": "2026-03-10T08:00:00Z"
    }
  }
}
```

---

## Audit Trail

```javascript
// opportunity.created
{
  "action": "opportunity.created",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "opportunity", "id": "opp_507f..." },
  "details": {
    "title": "Best Buy Clearance - 4K TVs",
    "category": "RETAIL_ARBITRAGE"
  }
}

// opportunity.submitted
{
  "action": "opportunity.submitted",
  "actor": { "type": "MEMBER", "id": "507f..." },
  "resource": { "type": "opportunity", "id": "opp_507f..." },
  "details": {
    "auto_check_results": {
      "duplicate_check": "PASSED",
      "fraud_check": "PASSED",
      "math_validation": "PASSED"
    }
  }
}
```
