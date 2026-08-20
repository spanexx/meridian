/**
 * Auth interceptor unit tests (vitest).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { HttpErrorResponse, HttpRequest, HttpResponse, HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { TokenStore } from '../auth/token-store';
import { AuthStore } from '../state/auth.store';
import { ApiClient } from './api-client';
import { API_TRANSPORT } from './api-transport';
import { HTTP_AUTH_TOKEN } from './http-context';

describe('authInterceptor', () => {
  let tokenStore: TokenStore;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TokenStore,
        AuthStore,
        // AuthStore injects ApiClient which injects API_TRANSPORT.
        // A no-op transport is enough for the header tests; the refresh
        // tests override ApiClient with a mock below.
        { provide: API_TRANSPORT, useValue: { request: vi.fn() } },
      ],
    });
    tokenStore = TestBed.inject(TokenStore);
    next = vi.fn();
  });

  /** Run the interceptor under TestBed, return the first emitted value (or throw). */
  function run(req: HttpRequest<unknown>): Promise<unknown> {
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(authInterceptor(req, next) as ReturnType<typeof authInterceptor>),
    );
  }

  // ─── Existing: Authorization header ──────────────────────────────
  it('adds Authorization header when token exists', async () => {
    tokenStore.set('test-token');
    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);
    const calledReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('does not add Authorization when token is null', async () => {
    tokenStore.clear();
    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);
    const calledReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.has('Authorization')).toBeFalsy();
  });

  it('uses context token override when provided', async () => {
    tokenStore.set('store-token');
    const context = new HttpContext().set(HTTP_AUTH_TOKEN, 'override-token');
    const req = new HttpRequest('GET', '/api/test', { context });
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);
    const calledReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.get('Authorization')).toBe('Bearer override-token');
  });

  // ─── Pack C B6: 401 → refresh retry ──────────────────────────────
  it('does not attach Authorization on /auth/refresh requests', async () => {
    tokenStore.set('test-token');
    const req = new HttpRequest('POST', '/auth/refresh', { refresh_token: 'r' });
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);
    const calledReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.has('Authorization')).toBeFalsy();
  });

  it('does not attach Authorization on /auth/login requests', async () => {
    tokenStore.set('test-token');
    const req = new HttpRequest('POST', '/auth/login', { email: 'a@b', password: 'x' });
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);
    const calledReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(calledReq.headers.has('Authorization')).toBeFalsy();
  });

  it('on 401, calls AuthStore.refresh and retries the request with the new token', async () => {
    // Setup: an existing session with a refresh token, and a mock
    // ApiClient whose refresh() succeeds (rotates to new-token).
    // Reconfigure TestBed to also provide ApiClient (the default
    // beforeEach only provides TokenStore).
    const mockAuthClient = {
      refresh: vi.fn().mockResolvedValue({ access_token: 'rotated-token', refresh_token: 'rotated-refresh' }),
    } as unknown as ApiClient;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TokenStore,
        { provide: ApiClient, useValue: mockAuthClient },
        { provide: API_TRANSPORT, useValue: { request: vi.fn() } },
      ],
    });
    const authStore = TestBed.inject(AuthStore);
    tokenStore = TestBed.inject(TokenStore);
    tokenStore.setSession({ access_token: 'old-token', refresh_token: 'old-refresh' });

    // First call: 401. Second call (after refresh): 200.
    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce(() => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/test' })));
    next.mockImplementationOnce((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200, url: r.url })));

    await run(req);

    expect(mockAuthClient.refresh).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
    // The retried request must carry the new (rotated) Bearer.
    const retriedReq = next.mock.calls[1][0] as HttpRequest<unknown>;
    expect(retriedReq.headers.get('Authorization')).toBe('Bearer rotated-token');
    // And the local TokenStore is now the rotated session.
    expect(tokenStore.token).toBe('rotated-token');
    // The local AuthStore has a live (non-expired) session.
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('on 401 + refresh failure, clears the session and propagates the 401', async () => {
    // Setup: a session, but refresh() rejects.
    const mockAuthClient = {
      refresh: vi.fn().mockRejectedValue(new Error('refresh failed')),
    } as unknown as ApiClient;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TokenStore,
        { provide: ApiClient, useValue: mockAuthClient },
        { provide: API_TRANSPORT, useValue: { request: vi.fn() } },
      ],
    });
    tokenStore = TestBed.inject(TokenStore);
    tokenStore.setSession({ access_token: 'old-token', refresh_token: 'old-refresh' });

    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce(() => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/test' })));

    // The 401 must propagate to the caller.
    let caught: unknown;
    try {
      await run(req);
    } catch (e) {
      caught = e;
    }
    expect((caught as { status?: number } | undefined)?.status).toBe(401);

    // No retry was attempted.
    expect(next).toHaveBeenCalledTimes(1);
    // Session is cleared so the guard bounces the user to /login.
    expect(tokenStore.hasToken()).toBe(false);
  });

  it('does not retry on a non-401 error', async () => {
    tokenStore.set('test-token');
    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce(() => throwError(() => new HttpErrorResponse({ status: 500, url: '/api/test' })));

    let caught: unknown;
    try {
      await run(req);
    } catch (e) {
      caught = e;
    }
    expect((caught as { status?: number } | undefined)?.status).toBe(500);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not retry on a 401 if there is no refresh token', async () => {
    tokenStore.set('test-token'); // access token, but no refresh token
    const req = new HttpRequest('GET', '/api/test');
    next.mockImplementationOnce(() => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/test' })));

    let caught: unknown;
    try {
      await run(req);
    } catch (e) {
      caught = e;
    }
    expect((caught as { status?: number } | undefined)?.status).toBe(401);

    // No retry.
    expect(next).toHaveBeenCalledTimes(1);
  });
});
