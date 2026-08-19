/**
 * Auth interceptor unit tests (vitest).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpRequest, HttpHandlerFn, HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { TokenStore } from '../auth/token-store';
import { HTTP_AUTH_TOKEN } from './http-context';

describe('authInterceptor', () => {
  let tokenStore: TokenStore;
  let next: HttpHandlerFn;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenStore],
    });
    tokenStore = TestBed.inject(TokenStore);
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

  it('adds Authorization header when token exists', () => {
    tokenStore.set('test-token');
    const req = new HttpRequest('GET', '/api/test');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));
    const calledReq = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('does not add Authorization when token is null', () => {
    tokenStore.clear();
    const req = new HttpRequest('GET', '/api/test');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const calledReq = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.has('Authorization')).toBeFalsy();
  });

  it('uses context token override when provided', () => {
    tokenStore.set('store-token');
    const context = new HttpContext().set(HTTP_AUTH_TOKEN, 'override-token');
    const req = new HttpRequest('GET', '/api/test', { context });

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const calledReq = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.get('Authorization')).toBe('Bearer override-token');
  });
});
