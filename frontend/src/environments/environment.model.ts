/**
 * Environment shape contract — both dev and prod environments must satisfy it.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
export interface Environment {
  /** True when the bundle is built for production. */
  production: boolean;
  /** Base URL of the gateway API (docs/apis/00-api-conventions.md §Base URL). */
  apiUrl: string;
  /** WebSocket URL for live channels (pool, execution, member, opportunity). */
  wsUrl: string;
  /** Stripe publishable key for the deposit flow (docs/journeys/02). */
  stripePublicKey: string;
  /**
   * True → the app boots against the in-memory MockGateway instead of the
   * real gateway. Flip to false the day the backend exists; no page code
   * changes. See docs/features/frontend-data-layer/.
   */
  useMock: boolean;
  /** Simulated network latency (ms) used by MockTransport. */
  latencyMs: number;
}
