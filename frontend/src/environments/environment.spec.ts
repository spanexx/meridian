/**
 * Environment contracts — dev/prod must satisfy the Environment shape.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { environment } from './environment';
import { environment as prodEnvironment } from './environment.prod';

describe('environment', () => {
  it('dev targets the local gateway with the mock on', () => {
    expect(environment.production).toBe(false);
    expect(environment.apiUrl).toBe('http://localhost:8080/api/v1');
    expect(environment.useMock).toBe(true);
  });

  it('dev has a positive simulated latency for realistic loading states', () => {
    expect(environment.latencyMs).toBeGreaterThan(0);
  });

  it('dev carries the ws + stripe keys the flows need', () => {
    expect(environment.wsUrl).toMatch(/^ws:\/\//);
    expect(environment.stripePublicKey).toMatch(/^pk_/);
  });

  it('prod targets the hosted gateway with the mock off', () => {
    expect(prodEnvironment.production).toBe(true);
    expect(prodEnvironment.apiUrl).toBe('https://api.meridian.com/api/v1');
    expect(prodEnvironment.useMock).toBe(false);
  });

  it('prod ws url is wss and stripe key is live', () => {
    expect(prodEnvironment.wsUrl).toMatch(/^wss:\/\//);
    expect(prodEnvironment.stripePublicKey).toMatch(/^pk_live_/);
  });

  it('both environments satisfy the same shape contract', () => {
    const keys = ['production', 'apiUrl', 'wsUrl', 'stripePublicKey', 'useMock', 'latencyMs'] as const;
    for (const key of keys) {
      expect(key in environment).toBe(true);
      expect(key in prodEnvironment).toBe(true);
    }
  });
});
