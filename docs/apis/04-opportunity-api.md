# Opportunity API

## Overview

Opportunity (signal) management endpoints for submission, vetting, and tracking.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/opportunities` | List opportunities |
| POST | `/opportunities` | Create draft opportunity |
| GET | `/opportunities/{id}` | Get opportunity details |
| PUT | `/opportunities/{id}` | Update draft opportunity |
| DELETE | `/opportunities/{id}` | Delete draft opportunity |
| POST | `/opportunities/{id}/evidence` | Upload evidence |
| DELETE | `/opportunities/{id}/evidence/{eid}` | Remove evidence |
| POST | `/opportunities/{id}/submit` | Submit for vetting |
| GET | `/opportunities/mine` | Get my opportunities |
| GET | `/vetting/queue` | Get vetting queue (vetters) |
| POST | `/opportunities/{id}/vote` | Cast vote (vetters) |

---

## POST /opportunities

Create a new opportunity draft.

### Story
> As a member who found an arbitrage deal, I want to submit it so the collective can evaluate and potentially execute it.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
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

### Categories
| Category | Description |
|----------|-------------|
| `RETAIL_ARBITRAGE` | Store sales, clearance, price differences |
| `LIQUIDATION` | Bankruptcy, estate, auction |
| `VEHICLE` | Auto auctions, fleet sales |
| `REAL_ESTATE` | Foreclosure, tax liens |
| `DIGITAL` | Domains, websites, digital assets |
| `COMMODITY` | Bulk goods, raw materials |
| `EVENT` | Tickets, limited releases |

### Response (201 Created)
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

### Auto-Calculations
System automatically computes:
- `estimated_profit` = estimated_value - estimated_cost
- `estimated_roi` = (profit / cost) × 100
- `risk_level` = based on category, ROI, time to liquidate
- `confidence_required` = based on capital needed, risk level

---

## POST /opportunities/{id}/evidence

Upload supporting evidence.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### Request (Form Data)
| Field | Type | Description |
|-------|------|-------------|
| file | file | Image, PDF, or document |
| type | string | SCREENSHOT, LINK, DOCUMENT, VIDEO |
| description | string | Brief description |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "evidence_id": "ev_abc123",
    "type": "SCREENSHOT",
    "url": "https://storage.meridian.com/evidence/opp_507f/ev_abc123.jpg",
    "thumbnail_url": "https://storage.meridian.com/evidence/opp_507f/ev_abc123_thumb.jpg",
    "description": "Price tag showing $479 for Samsung 65\" TV",
    "uploaded_at": "2026-03-13T10:05:00Z"
  }
}
```

### Limits
- Max file size: 10MB
- Max evidence per opportunity: 10 files
- Supported formats: jpg, png, pdf, mp4

---

## POST /opportunities/{id}/submit

Submit opportunity for vetting.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "confidence": "HIGH",
  "notes": "Visited store yesterday. Stock is confirmed. Sale ends March 20."
}
```

### Confidence Levels
| Level | Description |
|-------|-------------|
| `LOW` | Based on online info only |
| `MEDIUM` | Some direct verification |
| `HIGH` | Personally verified, high confidence |

### Response (200 OK)
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

### Auto-Checks
Before human vetting:
1. **Duplicate Check**: Similar opportunities in last 30 days
2. **Fraud Check**: Known scam patterns, suspicious URLs
3. **Math Validation**: ROI within reasonable bounds (0-500%)

### Errors
| Code | Condition |
|------|-----------|
| `VALIDATION_ERROR` | Missing required fields |
| `DUPLICATE_OPPORTUNITY` | Similar opportunity exists |
| `AUTO_CHECK_FAILED` | Failed automated checks |

---

## GET /vetting/queue

Get opportunities pending vetting (vetters only).

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | pending | pending, voted, all |
| category | string | all | Filter by category |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "opportunity_id": "opp_507f...",
        "title": "Best Buy Clearance - 4K TVs at 60% Off",
        "category": "RETAIL_ARBITRAGE",
        "submitted_at": "2026-03-13T10:15:00Z",
        "submitted_by": {
          "display_name": "dealfinder42",
          "reputation_tier": "SILVER",
          "signal_score": 65,
          "approval_rate": 72
        },
        "financials": {
          "estimated_profit": 6500,
          "estimated_roi": 72.2,
          "capital_needed": 9000,
          "risk_level": "LOW"
        },
        "vetting_status": {
          "votes_for": 1,
          "votes_against": 0,
          "votes_needed": 3,
          "your_vote": null,
          "expires_at": "2026-03-15T10:15:00Z"
        }
      }
    ],
    "queue_stats": {
      "total_pending": 12,
      "your_votes_today": 5,
      "max_votes_per_day": 20
    }
  }
}
```

### Authorization
Requires `VETTER` role.

---

## POST /opportunities/{id}/vote

Cast vote on opportunity (vetters only).

### Headers
```
Authorization: Bearer <access_token>
```

### Request (Approve)
```json
{
  "vote": "APPROVE",
  "confidence": "HIGH",
  "comment": "Verified the Best Buy location. Sale is legitimate. Good ROI potential."
}
```

### Request (Reject)
```json
{
  "vote": "REJECT",
  "confidence": "HIGH",
  "comment": "The sale ended yesterday. This opportunity is no longer valid.",
  "rejection_reason": "EXPIRED"
}
```

### Rejection Reasons
| Reason | Description |
|--------|-------------|
| `EXPIRED` | Opportunity deadline passed |
| `DUPLICATE` | Similar opportunity exists |
| `INVALID_SOURCE` | Cannot verify source |
| `UNREALISTIC_ROI` | Projections unrealistic |
| `HIGH_RISK` | Risk too high |
| `INSUFFICIENT_EVIDENCE` | Need more proof |
| `FRAUD_SUSPECTED` | Appears fraudulent |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "vote_id": "vote_xyz789",
    "opportunity_id": "opp_507f...",
    "vote": "APPROVE",
    "vetting_status": {
      "votes_for": 2,
      "votes_against": 0,
      "votes_needed": 3,
      "status": "IN_PROGRESS"
    },
    "reputation_earned": 2
  }
}
```

### Threshold Reached
When votes reach threshold, status auto-updates:
- If approvals ≥ required: `APPROVED`
- If rejections ≥ required: `REJECTED`

---

## GET /opportunities/mine

Get member's submitted opportunities.

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | all | DRAFT, SUBMITTED, VETTING, APPROVED, REJECTED, EXECUTED |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "opportunity_id": "opp_507f...",
        "title": "Best Buy Clearance - 4K TVs",
        "category": "RETAIL_ARBITRAGE",
        "status": "APPROVED",
        "submitted_at": "2026-03-13T10:15:00Z",
        "financials": {
          "estimated_profit": 6500,
          "estimated_roi": 72.2
        },
        "execution": {
          "status": "LIQUIDATING",
          "current_profit": 4200
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
  }
}
```

---

## Opportunity Status Flow

```
DRAFT ──submit──► SUBMITTED ──auto-check──► VETTING
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        │                                           │
                        ▼                                           ▼
                   APPROVED ──execute──► EXECUTED          REJECTED
                        │
                        └──► EXPIRED (if deadline passes)
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /opportunities | 10 | 1 day |
| POST /opportunities/{id}/submit | 3 | 1 hour |
| POST /opportunities/{id}/vote | 20 | 1 day |
| GET /vetting/queue | 60 | 1 min |

---

## Reputation Impact

### Signal Contributor
| Outcome | Score Change |
|---------|--------------|
| Approved + Profitable | +20 to +50 |
| Approved + Loss | -10 to -30 |
| Rejected (valid) | -5 |
| Rejected (fraud) | -20 |

### Vetter
| Outcome | Score Change |
|---------|--------------|
| Accurate vote | +5 |
| Inaccurate vote | -3 |
| High-confidence accurate | +3 bonus |
| High-confidence inaccurate | -5 penalty |
