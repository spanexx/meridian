/**
 * Development environment — mock gateway on.
 *
 * The app currently runs against the in-memory MockGateway (useMock true).
 * When the backend gateway exists, flip useMock to false in this file and
 * point apiUrl at the real service — the transport seam does the rest.
 * See docs/features/frontend-data-layer/PRD-TRD-frontend-data-layer.md.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'ws://localhost:8080/ws',
  stripePublicKey: 'pk_test_xxx',
  useMock: true,
  latencyMs: 120,
};
