/**
 * Community models — canonical API shapes.
 *
 * Source: docs/apis/05-community-api.md. Note: communities have NO
 * `slug` field in any documented response (gap §4.5); the v1 mock uses
 * the wireframe slugs ("alpha") as ids so existing routes keep working
 * — the real gateway will serve comm_*-prefixed ids and pages bind the
 * route param verbatim, so nothing breaks. focus/geographic_scope are
 * vocabulary enums not enumerated in the docs (typed string).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Community lifecycle — lowercase per 05. */
export type CommunityStatus = 'active' | 'proposed' | 'archived';

/** Membership contribution kinds — lowercase per 05. */
export type CommunityContributionType = 'capital' | 'signal' | 'access' | 'operator' | 'admin';

/** Community enrollment settings. */
export interface CommunitySettings {
  open_enrollment: boolean;
  require_kyc_at_join: boolean;
  vetter_auto_promotion: boolean;
}

/** GET /communities list row (pool_capital at top level). */
export interface CommunityListRow {
  id: string;
  name: string;
  focus: string;
  geographic_scope: string;
  status: CommunityStatus;
  founded_at: string;
  /** "1000.00" — string per 00 conventions. */
  min_contribution: string;
  settings: CommunitySettings;
  pool_capital: string;
  member_count: number;
  roi_ytd: number;
  executions_count: number;
  open_proposals: number;
}

/** GET /communities/{id} detail (pool_capital inside stats). */
export interface CommunityDetail {
  id: string;
  name: string;
  focus: string;
  geographic_scope: string;
  status: CommunityStatus;
  founded_at: string;
  min_contribution: string;
  settings: CommunitySettings;
  stats: {
    pool_capital: string;
    available_capital: string;
    locked_capital: string;
    reserve_ratio: number;
    member_count: number;
    member_composition: {
      capital_providers: number;
      signal_providers: number;
      access_providers: number;
    };
    roi_ytd: number;
    executions_count: number;
    executions_active: number;
    open_proposals: number;
  };
  safety_rails: string[];
}

/** GET /communities/{id}/members row. */
export interface CommunityMemberRow {
  member_id: string;
  display_name: string;
  contribution_type: CommunityContributionType;
  joined_at: string;
  /** Tier vocabulary conflicts: "T4" here vs BRONZE/SILVER in 04/06 (gap §4.7). */
  tier: string;
  reputation_score: number;
}

/** One Community-Governed Parameter with provenance (GET /communities/{id}/parameters). */
export interface CommunityParameter {
  key: string;
  display_name: string;
  value: string | null;
  unit: string | null;
  votable: boolean;
  provenance: {
    proposal_id: string;
    proposer_display_name: string;
    approved_at: string;
    approval_percent: number;
  } | null;
  safety_rail?: boolean;
}