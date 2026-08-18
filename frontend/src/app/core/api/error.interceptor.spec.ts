/**
 * Error interceptor unit tests (vitest).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { TokenStore } from '../auth/token-store';
import { ApiError } from './api-response';
import { HTTP_SKIP_ERROR_HANDLING } from './http-context';

describe('errorInterceptor', () => {
  let tokenStore: TokenStore;
  let next: HttpHandlerFn;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenStore],
    });
    tokenStore = TestBed.inject(TokenStore);
    next = vi.fn();
  });

  function run(req: HttpRequest<unknown>): Promise<unknown> {
    return TestBed.runInInjectionContext(() =>
      firstValueFrom(errorInterceptor(req, next) as ReturnType<typeof errorInterceptor>),
    );
  }

  it('passes through successful responses', async () => {
    const mockResponse = { status: 200, body: { success: true, data: { foo: 'bar' } } };
    next = vi.fn().mockReturnValue(of(mockResponse));
    const req = new HttpRequest('GET', '/api/test');

    const res = await run(req);
    expect(res).toBe(mockResponse);
  });

  it('maps 401 to ApiError with AUTH_TOKEN_INVALID and clears token', async () => {
    tokenStore.set('existing-token');
    const errorResponse = new HttpErrorResponse({
      status: 401,
      error: { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token expired' } },
    });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('GET', '/api/test');

    await expect(run(req)).rejects.toBeInstanceOf(ApiError);
    await expect(run(req)).rejects.toMatchObject({ code: 'AUTH_TOKEN_EXPIRED' });
    expect(tokenStore.token).toBeNull();
  });

  it('maps 401 without body code to AUTH_TOKEN_INVALID via status map', async () => {
    tokenStore.set('existing-token');
    const errorResponse = new HttpErrorResponse({
      status: 401,
      error: { success: false, error: { message: 'Unauthorized' } },
    });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('GET', '/api/test');

    await expect(run(req)).rejects.toMatchObject({ code: 'AUTH_TOKEN_INVALID' });
    expect(tokenStore.token).toBeNull();
  });

  it('maps 422 to VALIDATION_ERROR via status map', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 422,
      error: { success: false, error: { message: 'Invalid input' } },
    });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('POST', '/api/test');

    await expect(run(req)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('maps 404 to NOT_FOUND', async () => {
    const errorResponse = new HttpErrorResponse({ status: 404, error: {} });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('GET', '/api/test');

    await expect(run(req)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('maps unknown status to SERVICE_UNAVAILABLE', async () => {
    const errorResponse = new HttpErrorResponse({ status: 500, error: {} });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('GET', '/api/test');

    await expect(run(req)).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  it('skips error handling when HTTP_SKIP_ERROR_HANDLING context is true', async () => {
    const errorResponse = new HttpErrorResponse({ status: 401, error: {} });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const context = new HttpContext().set(HTTP_SKIP_ERROR_HANDLING, true);
    const req = new HttpRequest('GET', '/api/test', { context });

    await expect(run(req)).rejects.toBe(errorResponse);
  });

  it('includes status and details in ApiError options', async () => {
    const errorResponse = new HttpErrorResponse({
      status: 409,
      error: { success: false, error: { code: 'CONFLICT', message: 'Conflict', details: { field: 'email' } } },
    });
    next = vi.fn().mockReturnValue(throwError(() => errorResponse));
    const req = new HttpRequest('POST', '/api/test');

    await expect(run(req)).rejects.toMatchObject({ code: 'CONFLICT', status: 409, details: { field: 'email' } });
  });
});
