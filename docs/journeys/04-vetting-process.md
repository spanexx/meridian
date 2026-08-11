# Journey: Vetting Process

## Story

> **As a vetter**, I want to review submitted opportunities so that only legitimate, profitable deals get executed with collective funds.

---

## Prerequisites

- Member status: `ACTIVE`
- Role includes: `VETTER` (earned through reputation)
- Reputation tier: SILVER or higher

---

## Becoming a Vetter

Members earn vetting privileges through reputation:

| Requirement | Threshold |
|-------------|-----------|
| Overall Score | ≥ 300 |
| Reputation Tier | SILVER+ |
| Account Age | ≥ 30 days |
| Successful Contributions | ≥ 5 |

When threshold met, system automatically grants `VETTER` role.

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VETTING WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │ Browse  │───►│ Review  │───►│  Cast   │───►│ Provide │        │
│   │ Queue   │    │ Details │    │  Vote   │    │Feedback │        │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│                                                       │            │
│                                                       ▼            │
│   When votes reach threshold:                   ┌─────────┐        │
│                                                 │ Outcome │        │
│                                                 │Determined│       │
│                                                 └─────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Browse Vetting Queue

### API Call
```
GET /api/v1/vetting/queue?status=pending&category=all&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "opportunity_id": "opp_507f1f77bcf86cd799439011",
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
        },
        "auto_checks": {
          "duplicate_check": "PASSED",
          "fraud_check": "PASSED",
          "math_validation": "PASSED"
        }
      }
    ],
    "queue_stats": {
      "total_pending": 12,
      "your_votes_today": 5,
      "max_votes_per_day": 20
    }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

## Step 2: Review Opportunity Details

### API Call
```
GET /api/v1/opportunities/{opportunity_id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "title": "Best Buy Clearance - 4K TVs at 60% Off",
    "description": "Best Buy store #1234 in Austin is closing...",
    "category": "RETAIL_ARBITRAGE",
    
    "submitted_by": {
      "member_id": "mem_abc123",
      "display_name": "dealfinder42",
      "reputation": {
        "tier": "SILVER",
        "signal_score": 65,
        "total_signals_submitted": 25,
        "signals_approved": 18,
        "signals_executed": 12,
        "avg_roi": 45.2
      }
    },
    
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
    },
    
    "financials": {
      "estimated_profit": 6500,
      "estimated_roi": 72.2,
      "risk_level": "LOW",
      "confidence": "HIGH"
    },
    
    "evidence": [
      {
        "id": "ev_abc123",
        "type": "SCREENSHOT",
        "url": "https://storage.meridian.com/evidence/...",
        "description": "Price tag showing $479 for Samsung 65\" TV",
        "uploaded_at": "2026-03-13T10:05:00Z"
      },
      {
        "id": "ev_def456",
        "type": "LINK",
        "url": "https://bestbuy.com/store-1234-closing",
        "description": "Official store closing announcement",
        "uploaded_at": "2026-03-13T10:06:00Z"
      }
    ],
    
    "auto_checks": {
      "duplicate_check": {
        "status": "PASSED",
        "details": "No similar opportunities found"
      },
      "fraud_check": {
        "status": "PASSED",
        "details": "Source URL verified as legitimate"
      },
      "math_validation": {
        "status": "PASSED",
        "details": "ROI within expected range for category"
      }
    },
    
    "vetting": {
      "status": "IN_PROGRESS",
      "started_at": "2026-03-13T12:00:00Z",
      "votes": {
        "approve": 1,
        "reject": 0,
        "required": 3
      },
      "your_vote": null,
      "expires_at": "2026-03-15T10:15:00Z"
    },
    
    "similar_past_opportunities": [
      {
        "opportunity_id": "opp_past123",
        "title": "Target Clearance Electronics",
        "outcome": "EXECUTED",
        "actual_roi": 58.5,
        "executed_at": "2026-02-15"
      }
    ]
  }
}
```

---

## Step 3: Cast Vote

### API Call
```
POST /api/v1/opportunities/{opportunity_id}/vote
```

**Request (Approve):**
```json
{
  "vote": "APPROVE",
  "confidence": "HIGH",
  "comment": "Verified the Best Buy location. Sale is legitimate. Good ROI potential."
}
```

**Request (Reject):**
```json
{
  "vote": "REJECT",
  "confidence": "HIGH",
  "comment": "The sale ended yesterday. This opportunity is no longer valid.",
  "rejection_reason": "EXPIRED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "vote_id": "vote_xyz789",
    "opportunity_id": "opp_507f1f77bcf86cd799439011",
    "vote": "APPROVE",
    "confidence": "HIGH",
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

### Rejection Reasons
| Reason | Description |
|--------|-------------|
| `EXPIRED` | Opportunity deadline has passed |
| `DUPLICATE` | Similar opportunity already exists |
| `INVALID_SOURCE` | Source cannot be verified |
| `UNREALISTIC_ROI` | Profit projections are unrealistic |
| `HIGH_RISK` | Risk exceeds acceptable threshold |
| `INSUFFICIENT_EVIDENCE` | Not enough proof provided |
| `FRAUD_SUSPECTED` | Appears to be scam/fraud |

### Backend Behavior
1. Validate vetter has not already voted
2. Validate opportunity is in VETTING status
3. Check daily vote limit not exceeded
4. Record vote in `opportunity_votes` collection
5. Update vote counts on opportunity
6. Check if threshold reached:
   - If approvals ≥ required → Approve opportunity
   - If rejections ≥ required → Reject opportunity
7. Award reputation points to vetter
8. Log audit event: `opportunity.voted`

### Database Changes
```javascript
// New document in 'opportunity_votes' collection
{
  "_id": ObjectId("vote_xyz789"),
  "opportunity_id": ObjectId("opp_507f..."),
  "voter_id": ObjectId("vetter_123"),
  "vote": "APPROVE",
  "confidence": "HIGH",
  "comment": "Verified the Best Buy location...",
  "created_at": ISODate("2026-03-13T14:00:00Z")
}

// Update 'opportunities' collection
{
  "_id": ObjectId("opp_507f..."),
  "vetting": {
    "votes": {
      "approve": 2,    // incremented
      "reject": 0,
      "required": 3
    }
  }
}
```

---

## Step 4: Threshold Reached

When votes reach required threshold, the system finalizes the decision.

### Approval Flow
```
Votes FOR ≥ 3 (required)
        │
        ▼
┌───────────────────────┐
│ Update opportunity    │
│ status to APPROVED    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Notify signal         │
│ contributor           │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Queue for execution   │
│ prioritization        │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Award reputation to   │
│ accurate vetters      │
└───────────────────────┘
```

### Rejection Flow
```
Votes AGAINST ≥ 3 (required)
        │
        ▼
┌───────────────────────┐
│ Update opportunity    │
│ status to REJECTED    │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Notify signal         │
│ contributor (reason)  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Deduct reputation     │
│ from contributor      │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Award reputation to   │
│ accurate vetters      │
└───────────────────────┘
```

---

## Vetter Reputation

### Earning Reputation from Vetting

| Action | Reputation Points |
|--------|-------------------|
| Vote cast | +2 |
| Accurate vote (matched outcome) | +5 |
| Early accurate vote (first 2 voters) | +3 bonus |
| Inaccurate vote | -3 |
| High-confidence accurate vote | +3 bonus |
| High-confidence inaccurate vote | -5 penalty |

### Example
```
Opportunity approved, you voted APPROVE with HIGH confidence:
  Base vote:           +2
  Accurate vote:       +5
  High-confidence:     +3
  ─────────────────────
  Total:              +10 reputation points
```

### Vetter Privileges by Tier

| Tier | Vote Weight | Daily Vote Limit | Sees Advanced Info |
|------|-------------|------------------|-------------------|
| SILVER | 1.0x | 10 | Basic |
| GOLD | 1.5x | 20 | + Submitter history |
| PLATINUM | 2.0x | 30 | + Similar outcomes |

---

## Vetting Configuration

### System Parameters
```javascript
{
  "votes_required_approval": 3,
  "votes_required_rejection": 3,
  "vetting_timeout_hours": 48,
  "min_confidence_for_decision": "MEDIUM",
  "auto_reject_on_timeout": false,
  "require_comment_for_reject": true
}
```

### Category-Specific Rules

| Category | Required Votes | Timeout | Special Rules |
|----------|----------------|---------|---------------|
| RETAIL_ARBITRAGE | 3 | 48h | Standard |
| LIQUIDATION | 3 | 72h | May require operator approval |
| VEHICLE | 4 | 72h | Requires access verification |
| REAL_ESTATE | 5 | 96h | Requires high-value approval |
| DIGITAL | 3 | 48h | Standard |
| COMMODITY | 3 | 48h | Standard |

---

## Auto-Vetting (System Checks)

Before human vetting, the Opportunity engine runs automated checks. These are **recommendations** from the RecommenderProvider (duplicate/fraud/math) — they inform the vetting decision, they never make it. Humans decide.

### 1. Duplicate Check
```go
func (s *OpportunityEngine) checkDuplicate(opp *Opportunity) CheckResult {
    // Search for similar opportunities in last 30 days
    similar := s.repo.FindSimilar(opp.Title, opp.Source, 30)
    
    for _, s := range similar {
        if s.SimilarityScore > 0.8 {
            return CheckResult{
                Status: "FAILED",
                Reason: fmt.Sprintf("Similar to %s (%.0f%% match)", s.ID, s.SimilarityScore*100),
            }
        }
    }
    return CheckResult{Status: "PASSED"}
}
```

### 2. Fraud Check
```go
func (s *OpportunityEngine) checkFraud(opp *Opportunity) CheckResult {
    // Check source URL against known scam database
    if s.fraudDB.IsKnownScam(opp.Source.URL) {
        return CheckResult{Status: "FAILED", Reason: "Source URL flagged as scam"}
    }
    
    // Check for suspicious patterns
    patterns := s.detectSuspiciousPatterns(opp)
    if len(patterns) > 0 {
        return CheckResult{Status: "FLAGGED", Reason: strings.Join(patterns, "; ")}
    }
    
    return CheckResult{Status: "PASSED"}
}
```

### 3. Math Validation
```go
func (s *OpportunityEngine) validateMath(opp *Opportunity) CheckResult {
    roi := (opp.EstimatedValue - opp.EstimatedCost) / opp.EstimatedCost * 100
    
    if roi < 0 {
        return CheckResult{Status: "FAILED", Reason: "Negative ROI"}
    }
    if roi > 500 {
        return CheckResult{Status: "FLAGGED", Reason: "ROI exceeds 500% - requires manual review"}
    }
    
    return CheckResult{Status: "PASSED"}
}
```

---

## Vetting Dashboard

### API Call
```
GET /api/v1/vetting/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "your_stats": {
      "total_votes_cast": 156,
      "accurate_votes": 142,
      "accuracy_rate": 91.0,
      "reputation_earned": 780,
      "votes_today": 5,
      "votes_remaining_today": 15
    },
    "queue_stats": {
      "pending_opportunities": 12,
      "by_category": {
        "RETAIL_ARBITRAGE": 5,
        "LIQUIDATION": 3,
        "VEHICLE": 2,
        "REAL_ESTATE": 1,
        "DIGITAL": 1
      },
      "expiring_soon": 3
    },
    "recent_outcomes": [
      {
        "opportunity_id": "opp_abc...",
        "title": "Costco Wholesale Lot",
        "your_vote": "APPROVE",
        "outcome": "APPROVED",
        "was_accurate": true
      }
    ]
  }
}
```

---

## Notifications

| Event | Type | Recipients |
|-------|------|------------|
| New opportunity in queue | `VETTING_NEW_OPPORTUNITY` | All vetters |
| Opportunity expiring soon | `VETTING_EXPIRING` | Vetters who haven't voted |
| Vote counted | `VETTING_VOTE_COUNTED` | Voter |
| Decision reached | `VETTING_COMPLETE` | All voters + submitter |
| Accuracy result | `VETTING_ACCURACY` | Individual voter |

---

## Audit Trail

```javascript
// opportunity.voted
{
  "action": "opportunity.voted",
  "actor": { "type": "MEMBER", "id": "vetter_123" },
  "resource": { "type": "opportunity", "id": "opp_507f..." },
  "details": {
    "vote": "APPROVE",
    "confidence": "HIGH",
    "votes_after": { "approve": 2, "reject": 0 }
  }
}

// opportunity.approved
{
  "action": "opportunity.approved",
  "actor": { "type": "SYSTEM" },
  "resource": { "type": "opportunity", "id": "opp_507f..." },
  "details": {
    "final_votes": { "approve": 3, "reject": 0 },
    "vetting_duration_hours": 26
  }
}
```
