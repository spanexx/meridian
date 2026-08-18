/**
 * Opportunity models — canonical API shapes.
 *
 * Source: docs/apis/04-opportunity-api.md. Financials stay NUMBERS here
 * (estimated_profit, estimated_roi) exactly as the API doc renders them
 * — the strings-vs-numbers split is "ledger strings vs analytics
 * numbers" (extraction gap §4.6). No "subtitle" field exists in any
 * response; the UI's subtitle comes from the POST request's description
 * until the detail endpoint is documented (gap §4.4).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** All documented opportunity categories. */
export type OpportunityCategory =
  | 'RETAIL_ARBITRAGE'
  | 'LIQUIDATION'
  | 'VEHICLE'
  | 'REAL_ESTATE'
  | 'DIGITAL'
  | 'COMMODITY'
  | 'EVENT';

/** Status flow incl. EXPIRED from the flow diagram (gap §4.14). */
export type OpportunityStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VETTING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'EXPIRED';

/** Vetting votes — UPPER_SNAKE (distinct from governance's lowercase pairs). */
export type VettingVote = 'APPROVE' | 'REJECT';

/** Vetting progress states. */
export type VettingStatus = 'PENDING' | 'IN_PROGRESS';

/** Documented rejection reasons. */
export type RejectionReason =
  | 'EXPIRED'
  | 'DUPLICATE'
  | 'INVALID_SOURCE'
  | 'UNREALISTIC_ROI'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_EVIDENCE'
  | 'FRAUD_SUSPECTED';

/** Confidence levels in submissions and votes. */
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';

/** Evidence upload kinds. */
export type EvidenceType = 'SCREENSHOT' | 'LINK' | 'DOCUMENT' | 'VIDEO';

/** Submitter summary inside queue/mine rows. */
export interface OpportunitySubmitter {
  display_name: string;
  reputation_tier: string;
  signal_score: number;
  approval_rate: number;
}

/** Financial block of a list row. */
export interface OpportunityFinancials {
  estimated_profit: number;
  estimated_roi: number;
  capital_needed?: number;
  risk_level?: string;
}

/** Vetting block of a queue row. */
export interface OpportunityVettingStatus {
  votes_for: number;
  votes_against: number;
  votes_needed: number;
  your_vote: VettingVote | null;
  expires_at: string;
}

/** Execution block of a mine row. */
export interface OpportunityExecutionRef {
  status: string;
  current_profit: number;
}

/** List row — shared by /vetting/queue and /opportunities/mine. */
export interface OpportunityListRow {
  opportunity_id: string;
  title: string;
  category: OpportunityCategory;
  status?: OpportunityStatus;
  submitted_at: string;
  submitted_by?: OpportunitySubmitter;
  financials?: OpportunityFinancials;
  vetting_status?: OpportunityVettingStatus;
  execution?: OpportunityExecutionRef;
}

/** /opportunities/mine summary block. */
export interface OpportunityMineSummary {
  total_submitted: number;
  approved: number;
  rejected: number;
  pending: number;
  total_profit_generated: number;
  avg_roi: number;
}

/** POST /opportunities + submit response composite (detail view until GET /{id} is documented). */
export interface OpportunityDetail {
  opportunity_id: string;
  status: OpportunityStatus;
  title: string;
  category: OpportunityCategory;
  calculated?: {
    estimated_profit: number;
    estimated_roi: number;
    risk_level: string;
    confidence_required: string;
  };
  validation?: { is_complete: boolean; missing_fields: string[]; warnings: string[] };
  submitted_at?: string;
  vetting?: {
    status: VettingStatus;
    auto_checks: { duplicate_check: string; fraud_check: string; math_validation: string };
    estimated_review_time: string;
  };
  created_at: string;
}

/** POST /opportunities/{id}/vote response. */
export interface VettingVoteResponse {
  vote_id: string;
  opportunity_id: string;
  vote: VettingVote;
  vetting_status: {
    votes_for: number;
    votes_against: number;
    votes_needed: number;
    status: VettingStatus;
  };
  reputation_earned: number;
}