/**
 * HttpTransport unit tests — fetch fake only, no real network.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpTransport, newRequestId } from './http-transport';
import { ApiError, ApiResponse } from './api-response';
import { RequestOptions, ApiTransport } from './api-transport';

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

describe('HttpTransport', () => {
  const baseUrl = 'https://api.example.com';

  const makeFetcher = (responses: Array<{ status: number; ok: boolean; body: unknown }>) => {
    let idx = 0;
    const captured: CapturedRequest[] = [];
    const fetcher = async (url: string, init: RequestInit) => {
      captured.push({ url, init });
      const r = responses[idx++];
      return {
        status: r.status,
        ok: r.ok,
        json: async () => r.body,
      } as Response;
    };
    return { fetcher, captured };
  };

  const makeTransport = (
    fetcher: typeof fetch,
    getToken: () => string | null = () => 'test-token',
  ) => new HttpTransport(baseUrl, getToken, fetcher);

  it('sends method + URL + JSON body + content-type', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: { foo: 'bar' } } }]);
    const transport = makeTransport(fetcher);
    await transport.request('POST', '/test', { hello: 'world' });

    expect(captured.length).toBe(1);
    expect(captured[0].url).toBe('https://api.example.com/test');
    expect(captured[0].init.method).toBe('POST');
    expect(captured[0].init.headers).toEqual(
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(captured[0].init.body).toBe(JSON.stringify({ hello: 'world' }));
  });

  it('adds Authorization from the token provider', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: null } }]);
    const transport = makeTransport(fetcher, () => 'my-token');
    await transport.request('GET', '/test');

    expect(captured[0].init.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer my-token' }),
    );
  });

  it('no Authorization when provider returns null', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: null } }]);
    const transport = makeTransport(fetcher, () => null);
    await transport.request('GET', '/test');

    const headers = captured[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('adds X-Request-ID starting with req_', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: null } }]);
    const transport = makeTransport(fetcher);
    await transport.request('GET', '/test');

    const headers = captured[0].init.headers as Record<string, string>;
    expect(headers['X-Request-ID']).toBeDefined();
    expect(headers['X-Request-ID']?.startsWith('req_')).toBe(true);
  });

  it('adds X-Idempotency-Key on POST when provided', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: null } }]);
    const transport = makeTransport(fetcher);
    await transport.request('POST', '/test', { a: 1 }, { idempotencyKey: 'idem-123' });

    const headers = captured[0].init.headers as Record<string, string>;
    expect(headers['X-Idempotency-Key']).toBe('idem-123');
  });

  it('does NOT add X-Idempotency-Key on GET', async () => {
    const { fetcher, captured } = makeFetcher([{ status: 200, ok: true, body: { success: true, data: null } }]);
    const transport = makeTransport(fetcher);
    await transport.request('GET', '/test', undefined, { idempotencyKey: 'idem-123' });

    const headers = captured[0].init.headers as Record<string, string>;
    expect(headers['X-Idempotency-Key']).toBeUndefined();
  });

  it('unwraps and returns the envelope on 200', async () => {
    const envelope: ApiResponse<{ x: number }> = { success: true, data: { x: 42 }, meta: { request_id: 'req_abc' } };
    const { fetcher } = makeFetcher([{ status: 200, ok: true, body: envelope }]);
    const transport = makeTransport(fetcher);
    const result = await transport.request('GET', '/test');
    expect(result).toEqual(envelope);
  });

  it('204 returns success with undefined data', async () => {
    const { fetcher } = makeFetcher([{ status: 204, ok: true, body: {} }]);
    const transport = makeTransport(fetcher);
    const result = await transport.request('DELETE', '/test');
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('401 with body code AUTH_TOKEN_EXPIRED rejects ApiError code AUTH_TOKEN_EXPIRED', async () => {
    const { fetcher } = makeFetcher([{
      status: 401,
      ok: false,
      body: { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token expired' } },
    }]);
    const transport = makeTransport(fetcher);

    await expect(transport.request('GET', '/test')).rejects.toMatchObject({
      code: 'AUTH_TOKEN_EXPIRED',
      message: 'Token expired',
    });
  });

  it('422 without body code -> ApiError code VALIDATION_ERROR via status map', async () => {
    const { fetcher } = makeFetcher([{
      status: 422,
      ok: false,
      body: { success: false, error: { message: 'Invalid input' } },
    }]);
    const transport = makeTransport(fetcher);

    await expect(transport.request('POST', '/test', {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('fetcher rejection -> ApiError SERVICE_UNAVAILABLE', async () => {
    const fetcher = async () => { throw new Error('network down'); };
    const transport = makeTransport(fetcher);

    await expect(transport.request('GET', '/test')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The server could not be reached. Please try again.',
    });
  });

  it('newRequestId returns ids starting with req_ and unique across calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = newRequestId();
      expect(id.startsWith('req_')).toBe(true);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });
});