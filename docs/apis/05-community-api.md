# Community API

## Overview

Community directory and membership endpoints. Communities are the cooperative entities that an Execution reads to know which pool it draws from, that Governance scopes parameter proposals against, and that Money binds to a pool. v1 ships with exactly one record (id `community.default`) seeded at startup; the wireframe surfaces 3 placeholder rows (Active, Proposed, Archived) — the real backend only persists the Active one.

Engine boundary per `GRILL-communities.txt`:

- Community owns `communities` and `community_members` collections.
- Community does NOT write to `system_config` (that's Admin) or `governance_proposals` (that's Governance). It publishes `governance.proposal.passed` (with target_type=COMMUNITY_CREATION) and Community subscribes to do the create.
- Community does NOT read `members` or `member_kyc`. Calls Member's `IsKYCVerified(member_id)` contract instead.

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/communities` | List communities |
| POST | `/communities` | Propose a new community (opens a governance proposal) |
| GET | `/communities/{id}` | Get one community |
| PATCH | `/communities/{id}` | Update community identity fields (community-scoped settings, not parameter values) |
| POST | `/communities/{id}/archive` | Archive community |
| POST | `/communities/{id}/transfer-admin` | Transfer admin role |
| GET | `/communities/{id}/members` | List community members |
| POST | `/communities/{id}/members` | Join community |
| DELETE | `/communities/{id}/members/{member_id}` | Leave community |
| GET | `/communities/{id}/parameters` | Current Community-Governed Parameter values + provenance |

---

## GET /communities

List communities. Public read.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | all | `active`, `proposed`, `archived` |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "comm_507f1f77bcf86cd799439011",
        "name": "MERIDIAN Alpha",
        "focus": "general_arbitrage",
        "geographic_scope": "global",
        "status": "active",
        "founded_at": "2024-03-01T00:00:00Z",
        "min_contribution": "1000.00",
        "settings": {
          "open_enrollment": true,
          "require_kyc_at_join": true,
          "vetter_auto_promotion": false
        },
        "pool_capital": "1423580.00",
        "member_count": 124,
        "roi_ytd": 18.4,
        "executions_count": 47,
        "open_proposals": 2
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "has_next": false
    }
  }
}
```

---

## POST /communities

Propose a new community. Per `GRILL-communities.txt:6-7`, this opens a `governance.proposal` with `target_type=COMMUNITY_CREATION`. Returns the proposal; Community is created only when the proposal passes.

### Headers
```
Authorization: Bearer <access_token>
X-Idempotency-Key: comm_<user>_<timestamp>
```

### Request
```json
{
  "name": "Tech Arbitrage Collective",
  "focus": "electronics",
  "geographic_scope": "asia_pacific",
  "min_contribution": "1000.00",
  "rationale": "Electronics supply-side expertise across the team justifies a dedicated community."
}
```

### Validation
| Field | Rules |
|-------|-------|
| name | Required, 1-80 chars, must be unique |
| focus | Required, enum per `community.focus` vocabulary |
| geographic_scope | Required, enum per `community.geographic_scope` vocabulary |
| min_contribution | Required, decimal >= 100.00 |
| rationale | Required, 20-2000 chars |

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "proposal_id": "prop_507f1f77bcf86cd799439011",
    "proposal_type": "COMMUNITY_CREATION",
    "status": "voting",
    "required_weighted_votes": 10,
    "expires_at": "2026-03-16T10:00:00Z"
  }
}
```

### Side Effects
- Creates a `governance_proposal` row with `target_type=COMMUNITY_CREATION`, `community_payload` carrying the proposed fields.
- Publishes `governance.proposal.submitted`.

---

## GET /communities/{id}

Get a single community. Public read.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "comm_507f1f77bcf86cd799439011",
    "name": "MERIDIAN Alpha",
    "focus": "general_arbitrage",
    "geographic_scope": "global",
    "status": "active",
    "founded_at": "2024-03-01T00:00:00Z",
    "min_contribution": "1000.00",
    "settings": { ... },
    "stats": {
      "pool_capital": "1423580.00",
      "available_capital": "936350.00",
      "locked_capital": "487230.00",
      "reserve_ratio": 18.2,
      "member_count": 124,
      "member_composition": {
        "capital_providers": 42,
        "signal_providers": 67,
        "access_providers": 15
      },
      "roi_ytd": 18.4,
      "executions_count": 47,
      "executions_active": 3,
      "open_proposals": 2
    },
    "safety_rails": [
      "integrity_verification",
      "reconciliation_checks",
      "no_ponzi",
      "human_control",
      "kyc_identity",
      "kernel_engines_providers"
    ]
  }
}
```

---

## PATCH /communities/{id}

Update community identity fields (not parameter values). Admin role required.

### Headers
```
Authorization: Bearer <access_token>
X-Idempotency-Key: comm_<user>_<timestamp>
```

### Request
```json
{
  "name": "MERIDIAN Alpha",
  "focus": "general_arbitrage",
  "geographic_scope": "global",
  "min_contribution": "1000.00",
  "description": "Member-owned general arbitrage community.",
  "settings": {
    "open_enrollment": true,
    "require_kyc_at_join": true,
    "vetter_auto_promotion": false
  }
}
```

### Validation
Same as POST, all fields optional on PATCH.

### Side Effects
- Updates the `communities` row.
- Publishes `community.settings_updated`.

### Errors
| Code | Condition |
|------|-----------|
| `FORBIDDEN` | Caller is not an admin of this community |
| `NOT_FOUND` | Community does not exist |

---

## POST /communities/{id}/archive

Archive the community. Stops new signals and capital. Existing executions continue to settle. Per `GRILL-communities.txt`, this is not unilateral — opens a `governance.proposal` with `target_type=COMMUNITY_ARCHIVAL` if the archive would have system-wide impact, OR directly archives if non-controversial. Wireframe shows this in the Danger Zone of community settings; for v1 the simpler direct path is acceptable.

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "community_id": "comm_507f...",
    "status": "archived",
    "archived_at": "2026-03-13T10:00:00Z"
  }
}
```

### Side Effects
- Sets community `status` to `archived`.
- Publishes `community.archived`.
- Money subscribes and freezes related pool accounts.

---

## POST /communities/{id}/transfer-admin

Transfer admin role to another member. Requires the target member's acceptance.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{ "to_member_id": "mem_507f..." }
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "from_member_id": "mem_abc...",
    "to_member_id": "mem_507f...",
    "transfer_id": "trf_xyz789",
    "acceptance_required": true,
    "expires_at": "2026-03-20T10:00:00Z"
  }
}
```

### Side Effects
- Creates a pending transfer record; target member must accept.
- Publishes `community.transfer_initiated`.

---

## GET /communities/{id}/members

List members of a community.

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| contribution_type | string | all | `capital`, `signal`, `access`, `operator`, `admin` |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "member_id": "mem_507f...",
        "display_name": "Dana V.",
        "contribution_type": "capital",
        "joined_at": "2024-03-01T00:00:00Z",
        "tier": "T4",
        "reputation_score": 92
      }
    ]
  },
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 124, "has_next": true }
  }
}
```

---

## POST /communities/{id}/members

Join a community. Requires KYC verified (calls Member contract `IsKYCVerified`) and not already a member. Honors `settings.require_kyc_at_join`.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "contribution_type": "signal"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "community_id": "comm_507f...",
    "member_id": "mem_abc...",
    "contribution_type": "signal",
    "joined_at": "2026-03-13T10:00:00Z"
  }
}
```

### Errors
| Code | Condition |
|------|-----------|
| `KYC_REQUIRED` | Member not KYC verified |
| `ALREADY_EXISTS` | Member already in this community |
| `FORBIDDEN` | Community settings require invitation (`open_enrollment=false`) |
| `INVALID_STATE` | Community is archived |

### Side Effects
- Inserts a `community_members` row.
- Publishes `community.member_joined`.

---

## DELETE /communities/{id}/members/{member_id}

Leave a community. The last admin may not leave without transferring first.

### Headers
```
Authorization: Bearer <access_token>
```

### Response (204 No Content)

### Errors
| Code | Condition |
|------|-----------|
| `FORBIDDEN` | Caller is not the member being removed (only self-leave is allowed) |
| `INVALID_STATE` | Last admin; transfer required first |

### Side Effects
- Deletes the `community_members` row.
- Publishes `community.member_left`.

---

## GET /communities/{id}/parameters

Current Community-Governed Parameter values for this community, with provenance from the latest applied `governance_proposal`. Wireframe's community-detail card and community-detail/settings page render this directly.

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "community_id": "comm_507f...",
    "parameters": [
      {
        "key": "governance.roi_floor",
        "display_name": "ROI floor",
        "value": "15",
        "unit": "%",
        "votable": true,
        "provenance": {
          "proposal_id": "prop_...",
          "proposer_display_name": "@amelia",
          "approved_at": "2026-02-14T10:00:00Z",
          "approval_percent": 87
        }
      },
      {
        "key": "governance.win_rate_target",
        "display_name": "Win-rate target",
        "value": "75",
        "unit": "%",
        "votable": true,
        "provenance": {
          "proposal_id": "prop_...",
          "proposer_display_name": "@raj",
          "approved_at": "2026-02-14T10:00:00Z",
          "approval_percent": 87
        }
      },
      {
        "key": "governance.distribution.capital_share",
        "display_name": "Capital share",
        "value": "60",
        "unit": "%",
        "votable": true,
        "provenance": { "...": "..." }
      },
      {
        "key": "governance.distribution.signal_share",
        "display_name": "Signal share",
        "value": "25",
        "unit": "%",
        "votable": true,
        "provenance": { "...": "..." }
      },
      {
        "key": "governance.distribution.access_share",
        "display_name": "Access share",
        "value": "15",
        "unit": "%",
        "votable": true,
        "provenance": { "...": "..." }
      },
      {
        "key": "governance.vetting.votes_required",
        "display_name": "Vetting votes required",
        "value": "3",
        "unit": "votes",
        "votable": true,
        "provenance": { "...": "..." }
      },
      {
        "key": "governance.single_execution_cap",
        "display_name": "Single execution cap",
        "value": "50000",
        "unit": "USD",
        "votable": true,
        "provenance": { "...": "..." }
      },
      {
        "key": "integrity.reconciliation",
        "display_name": "Daily reconciliation",
        "value": null,
        "unit": null,
        "votable": false,
        "provenance": null,
        "safety_rail": true
      }
    ]
  }
}
```

### Note on parameters list
Six `votable: true` parameters per `GRILL-governance.txt:3` and `00-goal-analysis.md:44-49`. Safety rails (`integrity.*`, `no_ponzi`, `kyc.*`, `human_control`, `kernel.engines_providers`) come back with `votable: false` for display only.

---

## Errors Specific to Community API

In addition to the standard error codes in `00-api-conventions.md`:

| Code | HTTP | Description |
|------|------|-------------|
| `COMMUNITY_LAST_ADMIN` | 422 | Cannot remove the last admin |
| `COMMUNITY_ARCHIVED` | 409 | Operation requires an active community |
| `KYC_REQUIRED` | 403 | Member not KYC verified |
| `NOT_ADMIN` | 403 | Operation requires community admin role |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /communities | 60 | 1 min |
| POST /communities | 5 | 1 day |
| GET /communities/{id} | 120 | 1 min |
| GET /communities/{id}/parameters | 120 | 1 min |
| POST /communities/{id}/members | 10 | 1 hour |
| GET /communities/{id}/members | 60 | 1 min |

---

## WebSocket Channels

| Channel | Events |
|---------|--------|
| `community:{id}` | `community.member_joined`, `community.member_left`, `community.settings_updated`, `community.archived` |
| `community:{id}:parameters` | `governance.proposal.passed` (parameter scope, this community) |

---

## Implementation Notes

- The `community_members` collection must have a unique compound index on `(community_id, member_id)` per `02-data-model.md` for `communities` collection.
- v1 seed: insert one `communities` row with id `community.default`, name `MERIDIAN Alpha`, status `active`, min_contribution `1000.00` at startup. Wireframe pages 5/6/7 collapse to viewing that one record.
- Wireframe pages currently show two display-only stub rows (Proposed, Archived); the real backend does not populate these for v1.
