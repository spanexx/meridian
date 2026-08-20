/**
 * Production environment — real gateway, mock off.
 *
 * Swapped in by angular.json fileReplacements for the production build
 * (src/environments/environment.ts → environment.prod.ts).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.meridian.com/api/v1',
  wsUrl: 'wss://api.meridian.com/ws',
  stripePublicKey: 'pk_live_xxx',
  useMock: false,
  latencyMs: 0,
};
