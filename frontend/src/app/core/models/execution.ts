/**
 * Execution models — canonical API shapes.
 *
 * Source: docs/journeys/05-execution-flow.md — there is NO
 * docs/apis/execution API doc yet (extraction gap §4.1); the backend
 * pack must document it. Capital/spent/recovered are typed STRING per
 * 00 conventions even though the journey renders numbers (gap §4.6).
 * Note the participants shape conflict between the create response
 * (plain id strings) and the detail response (objects) — gap §4.12.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Execution lifecycle per the journey flow diagram. */
export type ExecutionStatus =
  | 'FUNDING'
  | 'ACQUIRING'
  | 'HOLDING'
  | 'LIQUIDATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/** Inventory item lifecycle. */
export type InventoryStatus = 'IN_STORAGE' | 'LISTED' | 'SOLD';

/** One capital contributor of an execution. */
export interface ExecutionContributor {
  member_id: string;
  amount: string;
  percentage: number;
}

/** Participants of an execution (detail view). */
export interface ExecutionParticipants {
  signal_contributor: { member_id: string; display_name: string; share: number } | null;
  access_contributor: { member_id: string; display_name: string; share: number } | null;
  operator: { member_id: string; display_name: string } | null;
}

/** GET /executions/{id} detail (journey 05). */
export interface ExecutionDetail {
  execution_id: string;
  opportunity: { id: string; title: string };
  status: ExecutionStatus;
  participants: ExecutionParticipants;
  capital: {
    allocated: string;
    spent: string;
    recovered: string;
    contributors_count: number;
  };
  inventory: { total_items: number; sold: number; listed: number; in_storage: number; returned: number };
  financials: {
    revenue_to_date: string;
    costs_to_date: string;
    projected_profit: string;
    projected_roi: number;
  };
  timeline: {
    started_at: string;
    acquisition_completed_at: string;
    liquidation_started_at: string;
    estimated_completion: string;
  };
}

/** POST /executions 201 response. */
export interface ExecutionCreateResponse {
  execution_id: string;
  opportunity_id: string;
  status: ExecutionStatus;
  capital: { allocated: string; from_pool: boolean; contributors: ExecutionContributor[] };
  participants: { signal_contributor: string; operator: string };
  timeline: { started_at: string };
}

/** POST /executions/{id}/complete response. */
export interface ExecutionCompleteResponse {
  execution_id: string;
  status: ExecutionStatus;
  financials: {
    total_cost: string;
    total_revenue: string;
    gross_profit: string;
    platform_fee: string;
    net_profit: string;
    roi: number;
  };
  timeline: { started_at: string; completed_at: string; duration_days: number };
  payout_scheduled: boolean;
  payout_id: string;
}