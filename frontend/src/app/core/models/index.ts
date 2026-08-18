/**
 * Models barrel — the single import point for canonical API shapes.
 *
 * Explicit re-exports (not `export *`) so name collisions like
 * NotificationPrefs (defined in member.ts, re-exported by
 * notification.ts) stay unambiguous. Pages, stores, and the MockGateway
 * all import from './models'. Source of truth for field names:
 * docs/features/frontend-data-layer/api-models-reference.md.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
export * from './member';
export * from './pool';
export * from './opportunity';
export * from './execution';
export * from './payout';
export * from './community';
export * from './governance';
export * from './notification';
export type { NotificationPrefs } from './member';