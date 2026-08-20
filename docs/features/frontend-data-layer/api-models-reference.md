# API Models Reference — canonical shapes for the frontend data layer

Date: 2026-08-18
Source: strict extraction from docs/apis/00-api-conventions.md,
01-auth-api.md, 03-capital-api.md, 04-opportunity-api.md,
05-community-api.md, 06-governance-api.md, docs/apis/members.md,
docs/journeys/05-execution-flow.md, docs/journeys/06-payout-distribution.md.
Only fields actually read in those docs are listed — nothing invented.
This file is the SINGLE reference for the frontend model files in
frontend/src/app/core/models/* and for the MockGateway seed shapes.

## Conventions that apply everywhere

- Money = STRING with two decimals ("5000.00", "-1800.00") on ledgers
  (00 §Field Conventions). Analytics/estimates in 04 + journeys are
  NUMBERS — keep that split (ledger string vs analytics number).
- Dates = ISO 8601 ("2026-03-13T10:00:00Z"); one date-only exception:
  balance.next_payout_estimate.expected_date ("2026-03-20").
- IDs prefixed: mem_, opp_, exec_, pay_, prop_, vote_, ev_, tx_, wd_,
  dep_, wm_, comm_, trf_, inv_. Member id in members.md is a plain hex
  ObjectId (gap §4.11).
- Envelope: { success:true, data, meta } / { success:false,
  error:{code,message,details}, meta }. meta.pagination:
  {page,limit,total,total_pages?,has_next?,has_prev?}.
- Envelope container keys vary: paginated lists use data.items per 00
  but capital uses data.transactions, mine/vetting use
  data.opportunities, payout list uses data.payouts (gap §4.13).

## Endpoint tables (paths for the ApiClient)

Auth: POST /auth/register, /auth/login, /auth/login/2fa, /auth/refresh,
/auth/logout, /auth/verify-email, /auth/resend-verification,
/auth/forgot-password, /auth/reset-password, /auth/change-password,
/auth/2fa/setup, /auth/2fa/verify, /auth/2fa/disable; GET /auth/me.

Capital: GET /capital/balance; GET /capital/transactions
(page,limit,type,from,to); POST /capital/deposits;
GET /capital/deposits/{id}; POST /capital/withdrawals;
GET /capital/withdrawals/{id}; POST /capital/withdrawals/{id}/verify;
POST /capital/withdrawals/{id}/cancel;
GET+POST /capital/withdrawal-methods; DELETE
/capital/withdrawal-methods/{id}; GET /capital/pool/status (public).

Opportunity: GET+POST /opportunities; GET+PUT+DELETE /opportunities/{id};
POST /opportunities/{id}/evidence; DELETE
/opportunities/{id}/evidence/{eid}; POST /opportunities/{id}/submit;
GET /opportunities/mine (filter status,page,limit); GET /vetting/queue
(VETTER; filter status pending|voted|all, category);
POST /opportunities/{id}/vote.

Community: GET+POST /communities (filter status active|proposed|archived);
GET /communities/{id}; PATCH /communities/{id};
POST /communities/{id}/archive; POST /communities/{id}/transfer-admin;
GET+POST /communities/{id}/members (filter contribution_type);
DELETE /communities/{id}/members/{member_id};
GET /communities/{id}/parameters.

Governance: GET+POST /governance/proposals (filter status
voting|passed|rejected|expired|withdrawn|all, target_type);
GET /governance/proposals/{id}; PATCH /governance/proposals/{id}
(withdraw); POST /governance/proposals/{id}/vote;
GET /governance/proposals/{id}/votes; GET /governance/parameters;
GET /governance/safety-rails; GET /governance/recent-votes.

Member: GET+PUT /members/me; GET+PUT /members/me/settings.

Execution (RESOLVED 2026-08-18 — docs/apis/04b-executions-api.md):
POST /executions; PUT /executions/{execution_id}/status;
POST /executions/{execution_id}/acquisition;
POST /executions/{execution_id}/list-batch;
GET /executions/{execution_id};
GET /executions/{execution_id}/inventory;
POST /executions/{execution_id}/complete;
POST /executions/{execution_id}/cancel;
POST /inventory/{inventory_id}/list|sale|write-off.
GET /executions (list) is documented there as the canonical board
endpoint (frontend ApiClient.executionsList()).

Payout (RESOLVED 2026-08-18 — docs/apis/07-payouts-api.md):
POST /payouts (internal); GET /payouts/{payout_id};
GET /members/me/payouts?page&limit; pool-wide GET /payouts ledger
documented there (PayoutLedgerRow in payout.ts is the canonical shape).

Notifications (RESOLVED 2026-08-18 — docs/apis/08-notifications-api.md):
GET /notifications; POST /notifications/{id}/read;
POST /notifications/read-all; GET+PATCH /members/me/settings.
Type list and payload example below remain the canonical enums.

## Enums (exact values)

OpportunityCategory: 'RETAIL_ARBITRAGE' | 'LIQUIDATION' | 'VEHICLE' |
'REAL_ESTATE' | 'DIGITAL' | 'COMMODITY' | 'EVENT'
OpportunityStatus: 'DRAFT' | 'SUBMITTED' | 'VETTING' | 'APPROVED' |
'REJECTED' | 'EXECUTED' | 'EXPIRED'
VettingVote: 'APPROVE' | 'REJECT' (UPPER — distinct from governance)
VettingStatus: 'PENDING' | 'IN_PROGRESS'
RejectionReason: 'EXPIRED' | 'DUPLICATE' | 'INVALID_SOURCE' |
'UNREALISTIC_ROI' | 'HIGH_RISK' | 'INSUFFICIENT_EVIDENCE' |
'FRAUD_SUSPECTED'
Confidence: 'LOW' | 'MEDIUM' | 'HIGH'
EvidenceType: 'SCREENSHOT' | 'LINK' | 'DOCUMENT' | 'VIDEO'
ExecutionStatus: 'FUNDING' | 'ACQUIRING' | 'HOLDING' | 'LIQUIDATING' |
'COMPLETED' | 'FAILED' | 'CANCELLED'
InventoryStatus: 'IN_STORAGE' | 'LISTED' | 'SOLD'
PayoutType: 'CAPITAL' | 'SIGNAL' | 'ACCESS' | 'OPERATIONS'
PayoutStatus: 'PENDING' | 'COMPLETED'
CommunityStatus: 'active' | 'proposed' | 'archived' (LOWERCASE)
CommunityContributionType: 'capital' | 'signal' | 'access' | 'operator'
| 'admin' (LOWERCASE)
MemberStatus: 'pending' | 'active' | 'inactive' | 'suspended'
(LOWERCASE)
MemberRole: 'MEMBER' | 'VETTER' | 'OPERATOR' | 'ADMIN'
KycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
ContributionTypesAuth (GET /auth/me only): 'CAPITAL' | 'SIGNAL'
(UPPER — conflicts with CommunityContributionType, gap §4.8)
ReputationTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' (06 tier
table; 05/06 community rows use 'T4' instead — gap §4.7)
ProposalStatus: 'voting' | 'passed' | 'rejected' | 'expired' |
'withdrawn' (LOWERCASE)
ProposalTargetType: 'PARAMETER' | 'COMMUNITY_CREATION'
GovernanceVoteValue: 'approve' | 'reject' (LOWERCASE — conflicts with
VettingVote casing, gap §4.10)
TransactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'ALLOCATION' | 'RELEASE' |
'DISTRIBUTION'
ReferenceType: 'PAYOUT' | 'EXECUTION'
PoolHealthStatus: 'HEALTHY' (only value documented)
PaymentMethod: 'CARD' | 'ACH' | 'WIRE'
WithdrawalMethodType: 'BANK_ACCOUNT' | 'PAYPAL' | 'CRYPTO'
Withdrawal statuses seen: 'PENDING_VERIFICATION' | 'PENDING_PROCESSING'
| 'PROCESSING' | 'COMPLETED'; deposit: 'PENDING' | 'COMPLETED'
NotificationType (journey tables only): 'EXECUTION_STARTED' |
'EXECUTION_ACQUIRED' | 'EXECUTION_FIRST_SALE' | 'EXECUTION_COMPLETED' |
'PAYOUT_READY' | 'PAYOUT_PENDING' | 'PAYOUT_COMPLETED' | 'EXECUTION_LOSS'

## Domain interfaces (field names EXACT; types per conventions)

### Opportunity
ListRow: { opportunity_id, title, category, status?, submitted_at,
  submitted_by?: { display_name, reputation_tier, signal_score,
  approval_rate }, financials?: { estimated_profit:number,
  estimated_roi:number, capital_needed?, risk_level? },
  vetting_status?: { votes_for, votes_against, votes_needed,
  your_vote: VettingVote|null, expires_at },
  execution?: { status, current_profit:number } }
MineSummary: { total_submitted, approved, rejected, pending,
  total_profit_generated:number, avg_roi:number }
Detail: { opportunity_id, status, title, category,
  calculated?: { estimated_profit:number, estimated_roi:number,
  risk_level, confidence_required },
  validation?: { is_complete, missing_fields:string[], warnings:string[] },
  submitted_at?, vetting?: { status: VettingStatus, auto_checks:
  { duplicate_check, fraud_check, math_validation },
  estimated_review_time }, created_at }
VoteResponse: { vote_id, opportunity_id, vote: VettingVote,
  vetting_status: { votes_for, votes_against, votes_needed,
  status: VettingStatus }, reputation_earned:number }
NOTE: description/details exist only in POST request bodies, never in
responses; no "subtitle" field anywhere (gap §4.4).

### Execution (journey 05)
Contributor: { member_id, amount:string, percentage:number }
Detail: { execution_id, title, opportunity: { id, title },
  image_seed: string,
  status,
  participants: { signal_contributor: {member_id, display_name,
  share:number}|null, access_contributor: same|null, operator:
  {member_id, display_name}|null },
  capital: { allocated:string, spent:string, recovered:string,
  contributors_count:number },
  inventory: { total_items, sold, listed, in_storage, returned },
  financials: { revenue_to_date:string, costs_to_date:string,
  projected_profit:string, projected_roi:number },
  timeline: { started_at, acquisition_completed_at,
  liquidation_started_at, estimated_completion } }
CreateResponse: { execution_id, opportunity_id, status,
  capital: { allocated:string, from_pool:boolean,
  contributors: Contributor[] },
  participants: { signal_contributor:string, operator:string } (plain
  id strings — different shape from detail, gap §4.12),
  timeline: { started_at } }
CompleteResponse: { execution_id, status, financials: { total_cost:
  string, total_revenue:string, gross_profit:string,
  platform_fee:string, net_profit:string, roi:number },
  timeline: { started_at, completed_at, duration_days:number },
  payout_scheduled:boolean, payout_id }

### Payout (journey 06)
ListItem (GET /members/me/payouts): { payout_id, opportunity_title,
  type: PayoutType, amount:string, status: PayoutStatus,
  completed_at }
ListSummary: { total_earned:string, from_capital:string,
  from_signals:string, from_access:string, payouts_count:number }
Distribution: { member_id, type: PayoutType, percentage:number,
  amount:string, status?: PayoutStatus }
CreateResponse: { payout_id, execution_id, status,
  totals: { gross_profit:string, platform_fee:string,
  distributable:string }, distributions_count:number, created_at }
LedgerRow (pool-wide, draft contract for the un-documented GET
/payouts; composed ONLY from documented fields): { payout_id,
  execution_ref, member_id, type, amount:string, share:number,
  status: PayoutStatus, created_at }

### Community (05)
Settings: { open_enrollment, require_kyc_at_join,
  vetter_auto_promotion (all boolean) }
ListRow: { id, name, focus, geographic_scope (vocabulary strings, gap
  §4.5), status: CommunityStatus, founded_at, min_contribution:string,
  settings, pool_capital:string, member_count:number, roi_ytd:number,
  executions_count:number, open_proposals:number }
Detail: ListRow fields + stats: { pool_capital:string,
  available_capital:string, locked_capital:string, reserve_ratio:number,
  member_count:number, member_composition: { capital_providers,
  signal_providers, access_providers }, roi_ytd:number,
  executions_count:number, executions_active:number,
  open_proposals:number }, safety_rails:string[]
MemberRow: { member_id, display_name, contribution_type:
  CommunityContributionType, joined_at, tier:string ('T4'), 
  reputation_score:number }
Parameter: { key, display_name, value:string|null, unit:string|null,
  votable:boolean, provenance: { proposal_id,
  proposer_display_name, approved_at, approval_percent }|null,
  safety_rail?:boolean }
NOTE: NO slug field (gap §4.5); v1 mock uses wireframe slugs as ids.

### Proposal + Vote (06)
Tally: { approve_weighted:number, reject_weighted:number,
  required_weighted_votes:number, approvals_remaining?,
  your_weight_if_eligible:number, has_voted:boolean }
ListRow: { proposal_id, target_type: ProposalTargetType,
  parameter_key, display_title, current_value:string,
  proposed_value:string, rationale, proposer: { member_id,
  display_name, tier }, status: ProposalStatus, tally: Tally,
  expires_at, created_at }
Detail: ListRow + voting_window_hours:number, applied_at:string|null,
  votes: VoteItem[], actions: { action_type, actor_id, occurred_at }[]
VoteItem: { vote_id, voter_id, voter_display_name, voter_tier,
  vote: GovernanceVoteValue, weight:number, comment, voted_at }
VoteResponse: { vote_id, proposal_id, vote: GovernanceVoteValue,
  weight:number, tally: Tally, reputation_earned:number }
RecentVoteRow: { proposal_id, display_title, parameter_key,
  decided_at, approval_percent:number, status: ProposalStatus }
GovernanceParameter: { key, value:string, unit, votable } (no
  provenance — 06 keys disagree with 05, gap §4.9)
SafetyRail: { key, label, rationale }

### Notification (journeys only)
Payload: { type: NotificationType, title, body,
  data?: { payout_id, amount:number, type:string } }
No id/read/created_at/route documented (gap §4.3) — the frontend
mock adds display-only fields for the wireframe page and documents
them in the file header.

### Member (members.md + auth)
Member (GET /members/me): { id (hex ObjectId here), full_name,
  username, email, status: MemberStatus, email_verified:boolean,
  two_factor_enabled:boolean, roles: MemberRole[], kyc_status,
  profile: { first_name, last_name, display_name, phone, country,
  timezone, avatar_url }, settings: { email_notifications,
  push_notifications, newsletter (all boolean) }, created_at,
  updated_at }
AuthMeMember (GET /auth/me): { id (mem_ prefix), email,
  status (UPPER 'ACTIVE'), profile: { first_name, last_name,
  display_name }, roles, kyc_status, two_factor_enabled,
  contribution_types: ContributionTypesAuth[], created_at,
  last_login_at }
LoginMember (login response): { id, email, status, roles, kyc_status,
  two_factor_enabled }
Tokens: { access_token, refresh_token, token_type, expires_in }
LoginResponse: Tokens + member: LoginMember
TwoFactorChallenge: { requires_2fa:true, temp_token, message }
TwoFactorLoginResponse: Tokens
RegisterResponse: { member_id, email, status, message }

### Capital (03)
BalanceInfo: { balances: { available, locked, pending_deposit,
  pending_withdrawal, total (all strings) }, lifetime: { total_deposited,
  total_withdrawn, total_earned }, withdrawal_limits: { min_amount,
  max_single, daily_limit, daily_used, daily_remaining },
  next_payout_estimate: { amount, expected_date (date-only) } }
Transaction: { id, type: TransactionType, amount:string (signed,
  "-1800.00" for ALLOCATION), description, reference: { type:
  ReferenceType, id }, balance_after:string, created_at }
PoolStatus: { totals: { total_capital, available_capital,
  deployed_capital }, health: { status: PoolHealthStatus,
  reserve_ratio:number, deployment_ratio:number }, activity: {
  active_executions:number, contributors_count:number }, performance:
  { avg_roi_30d:number, total_profit_30d:string,
  executions_completed_30d:number }, snapshot_at }
DepositRequest: { amount, payment_method: PaymentMethod,
  idempotency_key }
DepositResponse: { deposit_id, amount, status, payment: { provider,
  client_secret, publishable_key }, fees: { processing_fee,
  net_deposit }, expires_at }
WithdrawalRequest: { amount, withdrawal_method_id, idempotency_key }
WithdrawalResponse: { withdrawal_id, amount, fee, net_amount, status,
  method: { type: WithdrawalMethodType, details }, requires_2fa:boolean,
  estimated_arrival }

## Gaps & disagreements (must-document for the backend pack)

1. No executions API doc; no GET /executions list endpoint documented.
2. No payouts API doc; GET /payouts/{id} your_distribution shape
   differs by role; no member info in payout responses.
3. No notifications API doc at all.
4. GET /opportunities + GET /opportunities/{id} are table-only (no
   response bodies); description/details only in POST requests.
5. No community slug; pool_capital at list top-level vs inside
   detail.stats; focus/geographic_scope vocabularies un-enumerated.
6. Money: ledger strings vs analytics numbers (split kept as-is).
7. Reputation tier: SILVER/BRONZE/... vs 'T4' in community rows.
8. contribution_type casing: UPPER in auth vs lowercase in 05.
9. Governance parameter keys disagree between 06 and 05.
10. Vote casing: governance lowercase vs vetting UPPER.
11. Member id: hex ObjectId in members.md vs mem_ prefix elsewhere.
12. Execution participants: plain id strings (create) vs objects
    (detail).
13. Envelope container key drift: items vs transactions vs
    opportunities vs payouts.
14. expected_date date-only; opportunity status enum split across doc
    sections (EXPIRED).