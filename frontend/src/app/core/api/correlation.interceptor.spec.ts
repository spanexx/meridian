/**
 * Correlation interceptor unit tests (vitest).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpRequest, HttpHandlerFn, HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { correlationInterceptor } from './correlation.interceptor';
import { HTTP_CORRELATION_ID, HTTP_IDEMPOTENCY_KEY } from './http-context';

describe('correlationInterceptor', () => {
  let next: HttpHandlerFn;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    next = vi.fn().mockImplementation((_req) => {
      return {
        pipe() { return this; },
        subscribe(observer: { next: (v: unknown) => void }) {
          observer.next({ status: 200, body: { success: true, data: null } });
          return { unsubscribe: () => { /* noop */ } };
        },
      };
    });
  });

  function lastReq(): HttpRequest<unknown> {
    return (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as HttpRequest<unknown>;
  }

  it('adds X-Request-ID header', () => {
    const req = new HttpRequest('GET', '/api/test');
    correlationInterceptor(req, next);

    const requestId = lastReq().headers.get('X-Request-ID');
    expect(requestId).toBeDefined();
    expect(requestId?.startsWith('req_')).toBeTruthy();
  });

  it('adds X-Idempotency-Key from idempotency context', () => {
    const context = new HttpContext().set(HTTP_IDEMPOTENCY_KEY, 'idem-123');
    const req = new HttpRequest('POST', '/api/test', null, { context });
    correlationInterceptor(req, next);

    expect(lastReq().headers.get('X-Idempotency-Key')).toBe('idem-123');
  });

  it('uses context correlation ID override when provided', () => {
    const context = new HttpContext().set(HTTP_CORRELATION_ID, 'custom-correlation-id');
    const req = new HttpRequest('GET', '/api/test', { context });
    correlationInterceptor(req, next);

    expect(lastReq().headers.get('X-Request-ID')).toBe('custom-correlation-id');
  });

  it('generates unique IDs across requests', () => {
    const req1 = new HttpRequest('GET', '/api/test1');
    const req2 = new HttpRequest('GET', '/api/test2');
    correlationInterceptor(req1, next);
    correlationInterceptor(req2, next);

    const calls = (next as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const id1 = (calls[0][0] as HttpRequest<unknown>).headers.get('X-Request-ID');
    const id2 = (calls[1][0] as HttpRequest<unknown>).headers.get('X-Request-ID');
    expect(id1).not.toBe(id2);
  });
});
