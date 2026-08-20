/**
 * Governance models — canonical API shapes for proposals, votes, parameters, and safety rails.
 *
 * Source: docs/features/frontend-data-layer/api-models-reference.md (Proposal + Vote section).
 * These types mirror the backend's governance API contracts exactly; any change requires
 * updating the reference doc first. Used by governance feature components, services, and
 * the MockGateway seed data.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Proposal lifecycle status — lowercase per governance API (gap §4.10). */
export type ProposalStatus = 'voting' | 'passed' | 'rejected' | 'expired' | 'withdrawn';

/** What the proposal targets — uppercase per governance API. */
export type ProposalTargetType = 'PARAMETER' | 'COMMUNITY_CREATION';

/** Vote choice for governance — lowercase, distinct from VettingVote (gap §4.10). */
export type GovernanceVoteValue = 'approve' | 'reject';

/** Weighted vote tally returned on proposals and vote responses. */
export interface ProposalTally {
  approve_weighted: number;
  reject_weighted: number;
  required_weighted_votes: number;
  approvals_remaining?: number;
  your_weight_if_eligible: number;
  has_voted: boolean;
}

/** Single row in the proposals list (GET /governance/proposals). */
export interface ProposalListRow {
  proposal_id: string;
  target_type: ProposalTargetType;
  parameter_key: string;
  display_title: string;
  current_value: string;
  proposed_value: string;
  rationale: string;
  proposer: {
    member_id: string;
    display_name: string;
    tier: string;
  };
  status: ProposalStatus;
  tally: ProposalTally;
  expires_at: string;
  created_at: string;
}

/** Full proposal detail (GET /governance/proposals/{id}). */
export interface ProposalDetail extends ProposalListRow {
  voting_window_hours: number;
  applied_at: string | null;
  votes: ProposalVoteItem[];
  actions: { action_type: string; actor_id: string; occurred_at: string }[];
}

/** Individual vote record on a proposal. */
export interface ProposalVoteItem {
  vote_id: string;
  voter_id: string;
  voter_display_name: string;
  voter_tier: string;
  vote: GovernanceVoteValue;
  weight: number;
  comment: string;
  voted_at: string;
}

/** Response after casting a vote (POST /governance/proposals/{id}/vote). */
export interface ProposalVoteResponse {
  vote_id: string;
  proposal_id: string;
  vote: GovernanceVoteValue;
  weight: number;
  tally: ProposalTally;
  reputation_earned: number;
}

/** Row in the recent votes list (GET /governance/recent-votes). */
export interface RecentVoteRow {
  proposal_id: string;
  display_title: string;
  parameter_key: string;
  decided_at: string;
  approval_percent: number;
  status: ProposalStatus;
}

/** Governance parameter definition (GET /governance/parameters). */
export interface GovernanceParameter {
  key: string;
  value: string;
  unit: string;
  votable: boolean;
}

/** Safety rail definition (GET /governance/safety-rails). */
export interface SafetyRail {
  key: string;
  label: string;
  rationale: string;
}