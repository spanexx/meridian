# Governance API

## Overview

Governance endpoints for proposing community-decided changes, voting on open proposals, and inspecting the current Community-Governed Parameter values. Per `GRILL-governance.txt`:

- Governance owns `governance_proposals`, `governance_votes`, `governance_actions`.
- Governance does NOT write parameter values to `system_config` (that's Admin). It publishes `governance.proposal.passed` and Admin subscribes.
- Governance does NOT create communities. Same event pattern with `target_type=COMMUNITY_CREATION`; Community subscribes.
- Two `target_type` values: `PARAMETER` and `COMMUNITY_CREATION`.
- Safety rails are never votable. Wireframe's community-detail and governance pages show them read-only.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/governance/proposals` | List proposals (filter by status, target_type) |
| POST | `/governance/proposals` | Submit a new proposal |
| GET | `/governance/proposals/{id}` | Get one proposal with full vote detail |
| PATCH | `/governance/proposals/{id}` | Update rationale or withdraw (proposer only, while voting) |
| POST | `/governance/proposals/{id}/vote` | Cast a vote |
| GET | `/governance/proposals/{id}/votes` | List votes on a proposal (admin/audit) |
| GET | `/governance/parameters` | Current Community-Governed Parameter values (cross-community view; community-scoped is `GET /communities/{id}/parameters`) |
| GET | `/governance/safety-rails` | List of integrity items that are never votable |
| GET | `/governance/recent-votes` | Recent closed proposals (last 4-10) |

---

## GET /governance/proposals

List proposals. Public read for status `passed`, `rejected`, `expired`, `withdrawn`. Authenticated read for `voting` so anyone can see the tally.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | voting | `voting`, `passed`, `rejected`, `expired`, `withdrawn`, `all` |
| target_type | string | all | `PARAMETER`, `COMMUNITY_CREATION` |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "proposal_id": "prop_507f...",
        "target_type": "PARAMETER",
        "parameter_key": "governance.roi_floor",
        "display_title": "Raise ROI floor to 18%",
        "current_value": "15",
        "proposed_value": "18",
        "rationale": "Market conditions support a higher floor.",
        "proposer": {
          "member_id": "mem_507f...",
          "display_name": "Dana V.",
          "tier": "T4"
        },
        "status": "voting",
        "tally": {
          "approve_weighted": 7,
          "reject_weighted": 2,
          "required_weighted_votes": 5,
          "your_weight_if_eligible": 4,
          "has_voted": false
        },
        "expires_at": "2026-03-14T10:00:00Z",
        "created_at": "2026-03-13T10:00:00Z"
      }
    ],
    "summary": {
      "total_pending": 2,
      "total_passed_30d": 4,
      "total_rejected_30d": 1
    }
  }
}
```

---

## POST /governance/proposals

Submit a new proposal. Any authenticated member may propose per `00-goal-analysis.md:52`.

### Headers
```
Authorization: Bearer <access_token>
X-Idempotency-Key: gov_<user>_<timestamp>
```

### Request (PARAMETER scope)
```json
{
  "target_type": "PARAMETER",
  "parameter_key": "governance.roi_floor",
  "proposed_value": "18",
  "rationale": "Market conditions support a higher floor; recent execution ROI averages 17.3%.",
  "required_weighted_votes": 5,
  "voting_window_hours": 72
}
```

### Request (COMMUNITY_CREATION scope)
```json
{
  "target_type": "COMMUNITY_CREATION",
  "community_payload": {
    "name": "Tech Arbitrage Collective",
    "focus": "electronics",
    "geographic_scope": "asia_pacific",
    "min_contribution": "1000.00"
  },
  "rationale": "...",
  "required_weighted_votes": 10,
  "voting_window_hours": 72
}
```

### Validation
| Field | Rules |
|-------|-------|
| target_type | Required, enum: `PARAMETER`, `COMMUNITY_CREATION` |
| parameter_key | Required when target_type=PARAMETER; must be one of the six votable keys |
| proposed_value | Required when target_type=PARAMETER; type matches parameter (NUMBER, JSON, etc.) |
| community_payload | Required when target_type=COMMUNITY_CREATION |
| rationale | Required, 20-2000 chars |
| required_weighted_votes | Optional, default 5 (PARAMETER) or 10 (COMMUNITY_CREATION); integer >= 1 |
| voting_window_hours | Optional, default 72; integer 1-336 (max 14 days) |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "proposal_id": "prop_507f...",
    "status": "voting",
    "required_weighted_votes": 5,
    "expires_at": "2026-03-16T10:00:00Z"
  }
}
```

### Side Effects
- Creates a `governance_proposals` row with `status=voting`.
- Publishes `governance.proposal.submitted`.

### Errors
| Code | Condition |
|------|-----------|
| `INVALID_PARAMETER` | `parameter_key` is not in the votable set |
| `SAFETY_RAIL` | Tried to propose on a safety rail (e.g. integrity.*, kyc.*) |
| `COOLDOWN_ACTIVE` | Same proposer has an open identical proposal within 24h |

---

## GET /governance/proposals/{id}

Get a single proposal with vote detail.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "proposal_id": "prop_507f...",
    "target_type": "PARAMETER",
    "parameter_key": "governance.roi_floor",
    "display_title": "Raise ROI floor to 18%",
    "current_value": "15",
    "proposed_value": "18",
    "rationale": "Market conditions support a higher floor.",
    "proposer": { "member_id": "mem_507f...", "display_name": "Dana V.", "tier": "T4" },
    "status": "voting",
    "tally": {
      "approve_weighted": 7,
      "reject_weighted": 2,
      "required_weighted_votes": 5,
      "approvals_remaining": 0,
      "your_weight_if_eligible": 4,
      "has_voted": false
    },
    "voting_window_hours": 72,
    "expires_at": "2026-03-14T10:00:00Z",
    "applied_at": null,
    "votes": [
      { "voter_id": "mem_...", "vote": "approve", "weight": 4, "comment": "Market supports this.", "voted_at": "2026-03-13T11:00:00Z" }
    ],
    "actions": [
      { "action_type": "submitted", "actor_id": "mem_507f...", "occurred_at": "2026-03-13T10:00:00Z" }
    ],
    "created_at": "2026-03-13T10:00:00Z"
  }
}
```

---

## PATCH /governance/proposals/{id}

Update rationale (anytime before pass) or withdraw (proposer only, while status is `voting`).

### Headers
```
Authorization: Bearer <access_token>
```

### Request (withdraw)
```json
{ "status": "withdrawn" }
```

### Request (edit rationale)
```json
{ "rationale": "Updated rationale with new data." }
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "proposal_id": "prop_507f...",
    "status": "withdrawn",
    "withdrawn_at": "2026-03-13T15:00:00Z"
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `FORBIDDEN` | Caller is not the proposer (withdraw only — edits are open to anyone for now) |
| `INVALID_STATE` | Proposal status is not `voting` |

### Side Effects
- On withdraw: status flips to `withdrawn`, publishes `governance.proposal.withdrawn`.

---

## POST /governance/proposals/{id}/vote

Cast a vote. Members with `vetting_weight > 0` (VETTER+ and above) are eligible per `GRILL-governance.txt:8` and `00-goal-analysis.md:53`. Weight is snapshotted from `vetting_weight` at cast time.

### Headers
```
Authorization: Bearer <access_token>
X-Idempotency-Key: vote_<user>_<timestamp>
```

### Request
```json
{
  "vote": "approve",
  "comment": "Verified the boutique. Sale is legitimate."
}
```

### Validation
| Field | Rules |
|-------|-------|
| vote | Required, enum: `approve`, `reject` |
| comment | Optional, max 500 chars |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "vote_id": "vote_xyz789",
    "proposal_id": "prop_507f...",
    "vote": "approve",
    "weight": 4,
    "tally": {
      "approve_weighted": 8,
      "reject_weighted": 2,
      "required_weighted_votes": 5,
      "approvals_remaining": 0,
      "your_weight_if_eligible": 4,
      "has_voted": true
    },
    "reputation_earned": 1
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `NOT_VETTER` | Caller has `vetting_weight` of 0 |
| `INVALID_STATE` | Proposal status is not `voting` |
| `ALREADY_VOTED` | Caller already voted on this proposal |
| `EXPIRED` | Voting window has closed |

### Side Effects
- Inserts a `governance_votes` row with the snapshotted weight.
- Updates the cached tally on `governance_proposals`.
- Publishes `governance.vote.cast`.
- If threshold reached, immediately publishes `governance.proposal.passed` or `governance.proposal.rejected`.

---

## GET /governance/proposals/{id}/votes

List individual votes on a proposal. Used by admin audit and the wireframe's proposals tab.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "vote_id": "vote_xyz789",
        "voter_id": "mem_507f...",
        "voter_display_name": "Jules T.",
        "voter_tier": "T4",
        "vote": "approve",
        "weight": 4,
        "comment": "Verified the boutique.",
        "voted_at": "2026-03-13T11:00:00Z"
      }
    ]
  }
}
```

---

## GET /governance/parameters

Cross-community view of all six Community-Governed Parameters (current values only, no provenance). For per-community provenance use `GET /communities/{id}/parameters` (from `05-community-api.md`).

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "scope": "global",
    "parameters": [
      { "key": "governance.roi_floor", "value": "15", "unit": "%", "votable": true },
      { "key": "governance.win_rate_target", "value": "70", "unit": "%", "votable": true },
      { "key": "governance.reserve_ratio_target", "value": "12", "unit": "%", "votable": true },
      { "key": "governance.single_execution_cap", "value": "50000", "unit": "USD", "votable": true },
      { "key": "governance.vetting.votes_required", "value": "3", "unit": "votes", "votable": true },
      { "key": "governance.distribution.shares", "value": "60/25/15", "unit": "ratio", "votable": true }
    ]
  }
}
```

---

## GET /governance/safety-rails

The locked integrity items, listed explicitly in the wireframe's governance page sidebar.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "safety_rails": [
      { "key": "integrity.reconciliation", "label": "Daily reconciliation & audit trail", "rationale": "Every dollar accounted for; never votable per 00-goal-analysis.md line 58-63." },
      { "key": "integrity.no_ponzi", "label": "No-ponzi · no unearned returns", "rationale": "Returns come from real economic activity only." },
      { "key": "integrity.kyc", "label": "KYC & identity rules", "rationale": "Required for capital flows." },
      { "key": "integrity.human_control", "label": "Human control over money & reputation", "rationale": "AI recommends, humans decide." },
      { "key": "architecture.kernel_engines_providers", "label": "Technical architecture (kernel/engines/providers)", "rationale": "Architectural immutability." }
    ]
  }
}
```

---

## GET /governance/recent-votes

Recent closed proposals (last 10). Wireframe's governance page right-column "Recent Votes" card renders this.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "proposal_id": "prop_...",
        "display_title": "ROI floor 15%",
        "parameter_key": "governance.roi_floor",
        "decided_at": "2026-02-14T10:00:00Z",
        "approval_percent": 87,
        "status": "passed"
      }
    ]
  }
}
```

---

## Errors Specific to Governance API

In addition to `00-api-conventions.md`:

| Code | HTTP | Description |
|------|------|-------------|
| `SAFETY_RAIL` | 422 | Tried to propose on an integrity safety rail |
| `NOT_VETTER` | 403 | Voter must have vetting_weight > 0 |
| `ALREADY_VOTED` | 409 | This member has already voted on this proposal |
| `COOLDOWN_ACTIVE` | 422 | Same proposer has an open identical proposal within 24h |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /governance/proposals | 60 | 1 min |
| POST /governance/proposals | 5 | 1 day |
| POST /governance/proposals/{id}/vote | 30 | 1 day |
| GET /governance/parameters | 60 | 1 min |
| GET /governance/safety-rails | 60 | 1 min |

---

## WebSocket Channels

| Channel | Events |
|---------|--------|
| `governance` | `governance.proposal.submitted`, `governance.vote.cast`, `governance.proposal.passed`, `governance.proposal.rejected`, `governance.proposal.withdrawn`, `governance.proposal.expired` |
| `governance:{proposal_id}` | Tally updates, vote detail live |

---

## Wireframe integration notes

The wireframe's `governance/index.html` page (page 17 in `wireframe/story.txt`) renders:

1. **Active Proposals cards** (2 instances) — each calls `GET /governance/proposals/{id}` plus the live vote bar comes from the `governance` channel.
2. **Community-Governed Parameters grid** — calls `GET /governance/parameters` for the 6 votable values and per-cell provenance from `GET /governance/recent-votes`.
3. **Safety Rails card** — calls `GET /governance/safety-rails`.
4. **Recent Votes card** — calls `GET /governance/recent-votes`.
5. **Propose change modal** — calls `POST /governance/proposals`.

The wireframe's **community-detail** and **community-detail/settings** pages (pages 6 and 7) display the parameters with per-parameter provenance; this comes from `GET /communities/{id}/parameters` (not from this doc) because provenance is community-scoped.

---

## Implementation Notes

- `governance_votes` must have a unique compound index on `(proposal_id, voter_id)` per `02-data-model.md`.
- `weight` field on `governance_votes` is snapshotted from `vetting_weight` at cast time. Future reputation changes do not retroactively shift past decisions.
- When a proposal's threshold is reached (approve_weighted >= required OR reject_weighted >= required) within the window, status flips immediately and the corresponding `governance.proposal.passed` or `governance.proposal.rejected` event fires.
- On `governance.proposal.passed` with `target_type=PARAMETER`, Admin engine subscribes and writes the new value to `system_config`. The proposal's `applied_at` is set when Admin's write completes (not before). This guarantees `00-goal-analysis.md:56` ("future only") — Admin checks `applied_at` and refuses to write if a newer proposal already applied.
- Safety rails (the 5 listed under `GET /governance/safety-rails`) are NEVER votable; the proposal endpoint returns `SAFETY_RAIL` if someone tries.
