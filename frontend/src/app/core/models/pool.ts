/**
 * Pool/capital models — canonical API shapes.
 *
 * Source: docs/apis/03-capital-api.md. Ledger amounts are STRINGS
 * ("15250.75") per 00-api-conventions §Field Conventions; percentages
 * and ratios are numbers. Deposit/withdrawal requests carry the
 * X-Idempotency-Key upstream (conventions §Idempotency).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Transaction kinds (docs/apis/03-capital-api.md §Transaction Types). */
export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ALLOCATION'
  | 'RELEASE'
  | 'DISTRIBUTION';

/** Reference kinds inside a transaction. */
export type ReferenceType = 'PAYOUT' | 'EXECUTION';

/** Payment rails for deposits. */
export type PaymentMethod = 'CARD' | 'ACH' | 'WIRE';

/** Withdrawal method kinds (methods table: BANK_ACCOUNT, PAYPAL, CRYPTO). */
export type WithdrawalMethodType = 'BANK_ACCOUNT' | 'PAYPAL' | 'CRYPTO';

/** Only health value documented so far. */
export type PoolHealthStatus = 'HEALTHY';

/** GET /capital/balance payload. */
export interface BalanceInfo {
  balances: {
    available: string;
    locked: string;
    pending_deposit: string;
    pending_withdrawal: string;
    total: string;
  };
  lifetime: {
    total_deposited: string;
    total_withdrawn: string;
    total_earned: string;
  };
  withdrawal_limits: {
    min_amount: string;
    max_single: string;
    daily_limit: string;
    daily_used: string;
    daily_remaining: string;
  };
  next_payout_estimate: {
    amount: string;
    /** Date-only string ("2026-03-20") per the API doc. */
    expected_date: string;
  };
}

/** One capital transaction — GET /capital/transactions → data.transactions. */
export interface CapitalTransaction {
  id: string;
  type: TransactionType;
  /** Signed two-decimal string ("-1800.00" for ALLOCATION). */
  amount: string;
  description: string;
  reference: { type: ReferenceType; id: string };
  balance_after: string;
  created_at: string;
}

/** GET /capital/pool/status payload (public). */
export interface PoolStatus {
  totals: { total_capital: string; available_capital: string; deployed_capital: string };
  health: { status: PoolHealthStatus; reserve_ratio: number; deployment_ratio: number };
  activity: { active_executions: number; contributors_count: number };
  performance: { avg_roi_30d: number; total_profit_30d: string; executions_completed_30d: number };
  snapshot_at: string;
}

/** POST /capital/deposits request. */
export interface DepositRequest {
  amount: string;
  payment_method: PaymentMethod;
  idempotency_key: string;
}

/** POST /capital/deposits response. */
export interface DepositResponse {
  deposit_id: string;
  amount: string;
  status: string;
  payment: { provider: string; client_secret: string; publishable_key: string };
  fees: { processing_fee: string; net_deposit: string };
  expires_at: string;
}

/** POST /capital/withdrawals request. */
export interface WithdrawalRequest {
  amount: string;
  withdrawal_method_id: string;
  idempotency_key: string;
}

/** POST /capital/withdrawals response. */
export interface WithdrawalResponse {
  withdrawal_id: string;
  amount: string;
  fee: string;
  net_amount: string;
  status: string;
  method: { type: WithdrawalMethodType; details: Record<string, string> };
  requires_2fa: boolean;
  estimated_arrival: string;
}