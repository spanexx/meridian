/**
 * Payout models — canonical API shapes.
 *
 * Sources: docs/journeys/06-payout-distribution.md (GET /payouts/{id},
 * GET /members/me/payouts — no docs/apis file exists; extraction gap
 * §4.2) and docs/02-data-model.md payout conventions. Amounts STRING,
 * percentages numbers. The pool-wide ledger row (PayoutLedgerRow) is
 * the wireframe payouts-page shape composed from documented fields —
 * the backend pack must document the pool-wide GET /payouts endpoint.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Distribution kinds (journey 06). */
export type PayoutType = 'CAPITAL' | 'SIGNAL' | 'ACCESS' | 'OPERATIONS';

/** Payout lifecycle (distribution status uses the same pair). */
export type PayoutStatus = 'PENDING' | 'COMPLETED';

/** GET /members/me/payouts row. */
export interface PayoutListItem {
  payout_id: string;
  opportunity_title: string;
  type: PayoutType;
  amount: string;
  status: PayoutStatus;
  completed_at: string;
}

/** GET /members/me/payouts summary block. */
export interface PayoutListSummary {
  total_earned: string;
  from_capital: string;
  from_signals: string;
  from_access: string;
  payouts_count: number;
}

/** One distribution inside a payout (request + DB doc). */
export interface PayoutDistribution {
  member_id: string;
  type: PayoutType;
  percentage: number;
  amount: string;
  status?: PayoutStatus;
}

/** POST /payouts 201 response (internal/system). */
export interface PayoutCreateResponse {
  payout_id: string;
  execution_id: string;
  status: PayoutStatus;
  totals: { gross_profit: string; platform_fee: string; distributable: string };
  distributions_count: number;
  created_at: string;
}

/**
 * Pool-wide payout ledger row — the wireframe payouts-page shape.
 *
 * Composed ONLY from documented fields (payout_id/type/amount/status
 * per PayoutListItem; percentage per PayoutDistribution; member_id per
 * PayoutDistribution; execution refs per CONTEXT.md §Ref formats). The
 * pool-wide GET /payouts endpoint itself is un-documented: the backend
 * pack adds docs/apis/07-payouts-api.md and this shape is the contract.
 */
export interface PayoutLedgerRow {
  payout_id: string;
  execution_ref: string;
  member_id: string;
  type: PayoutType;
  amount: string;
  share: number;
  status: PayoutStatus;
  created_at: string;
}