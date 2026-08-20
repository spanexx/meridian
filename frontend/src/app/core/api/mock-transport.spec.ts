/**
 * MockTransport — ApiTransport over the in-memory MockGateway.
 *
 * Wraps gateway responses in the real envelope ({ success, data, meta }
 * with correlation ids) and applies the configured latency so loading
 * states behave like a network. Errors from the gateway propagate as
 * ApiError. Used in development (environment.useMock) and in every
 * unit spec — the mock IS the test double by design.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiError } from './api-response';
import { MockGateway } from './mock-gateway';
import { MockTransport } from './mock-transport';

describe('mock transport', () => {
  let gateway: MockGateway;
  let transport: MockTransport;

  beforeEach(() => {
    gateway = new MockGateway();
    transport = new MockTransport(gateway);
  });

  it('wraps gateway data in the success envelope with correlation ids', async () => {
    gateway.register('GET', '/pings', () => ({ pong: true }));
    const response = await transport.request<{ pong: boolean }>('GET', '/pings');
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ pong: true });
    expect(response.meta?.request_id).toMatch(/^req_mock_\d+$/);
    expect(response.meta?.timestamp).toBeTruthy();
  });

  it('records every request in the log for observability + tests', async () => {
    gateway.register('POST', '/things', () => ({}));
    await transport.request('POST', '/things', { a: 1 }, { idempotencyKey: 'key-1' });
    expect(transport.requests).toEqual([
      { method: 'POST', path: '/things', idempotencyKey: 'key-1' },
    ]);
  });

  it('propagates gateway ApiErrors to the caller', async () => {
    gateway.register('GET', '/guarded', () => {
      throw new ApiError('KYC_REQUIRED', 'KYC verification is required.', { status: 403 });
    });
    const promise = transport.request('GET', '/guarded');
    await expect(promise).rejects.toMatchObject({
      code: 'KYC_REQUIRED',
      status: 403,
    });
  });

  it('waits the configured latency before resolving', async () => {
    vi.useFakeTimers();
    try {
      gateway.register('GET', '/slow', () => ({ ok: true }));
      const slow = new MockTransport(gateway, 50);
      const promise = slow.request('GET', '/slow');
      let settled = false;
      void promise.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(49);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(settled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});