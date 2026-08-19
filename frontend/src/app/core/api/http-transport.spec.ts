/**
 * HttpTransport unit tests — HttpTestingController only, no real network.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTransport } from './http-transport';
import { ApiResponse } from './api-response';
import { RequestOptions } from './api-transport';
import { TokenStore } from '../auth/token-store';
import { authInterceptor } from './auth.interceptor';
import { correlationInterceptor } from './correlation.interceptor';
import { errorInterceptor } from './error.interceptor';
import { HTTP_BASE_URL } from './http-transport';

describe('HttpTransport', () => {
  let transport: HttpTransport;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, correlationInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        HttpTransport,
        TokenStore,
        { provide: HTTP_BASE_URL, useValue: baseUrl },
      ],
    });

    transport = TestBed.inject(HttpTransport);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends method + URL + JSON body', async () => {
    const envelope: ApiResponse<{ foo: string }> = { success: true, data: { foo: 'bar' }, meta: { request_id: 'req_1' } };
    const promise = transport.request('POST', '/test', { hello: 'world' });

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ hello: 'world' });
    req.flush(envelope);

    const result = await promise;
    expect(result).toEqual(envelope);
  });

  it('includes X-Request-ID via correlation interceptor', async () => {
    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.get('X-Request-ID')).toBeTruthy();
    const requestId = req.request.headers.get('X-Request-ID');
    expect(requestId?.startsWith('req_')).toBeTruthy();
    req.flush(envelope);

    await promise;
  });

  it('includes Authorization via auth interceptor when token exists', async () => {
    const tokenStore = TestBed.inject(TokenStore);
    tokenStore.set('test-token');

    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(envelope);

    await promise;
  });

  it('omits Authorization when token is null', async () => {
    const tokenStore = TestBed.inject(TokenStore);
    tokenStore.clear();

    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
    req.flush(envelope);

    await promise;
  });

  it('uses context token override when provided', async () => {
    const tokenStore = TestBed.inject(TokenStore);
    tokenStore.set('store-token');

    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const options: RequestOptions = { token: 'override-token' };
    const promise = transport.request('GET', '/test', undefined, options);

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer override-token');
    req.flush(envelope);

    await promise;
  });

  it('unwraps and returns the envelope on 200', async () => {
    const envelope: ApiResponse<{ x: number }> = { success: true, data: { x: 42 }, meta: { request_id: 'req_abc' } };
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush(envelope);

    const result = await promise;
    expect(result).toEqual(envelope);
  });

  it('204 returns success with undefined data', async () => {
    const promise = transport.request('DELETE', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush(null, { status: 204, statusText: 'No Content' });

    const result = await promise;
    expect(result).toEqual({ success: true, data: undefined });
  });

  it('error interceptor maps 401 to ApiError and clears token', async () => {
    const tokenStore = TestBed.inject(TokenStore);
    tokenStore.set('existing-token');

    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush(
      { success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token expired' } },
      { status: 401, statusText: 'Unauthorized' }
    );

    await expect(promise).rejects.toMatchObject({ code: 'AUTH_TOKEN_EXPIRED', message: 'Token expired' });
    expect(tokenStore.token).toBeNull();
  });

  it('error interceptor maps 422 to VALIDATION_ERROR via status map', async () => {
    const promise = transport.request('POST', '/test', {});

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush(
      { success: false, error: { message: 'Invalid input' } },
      { status: 422, statusText: 'Unprocessable Entity' }
    );

    await expect(promise).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('error interceptor maps 404 to NOT_FOUND', async () => {
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('network error maps to SERVICE_UNAVAILABLE', async () => {
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.error(new ErrorEvent('Network error'));

    await expect(promise).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE', message: 'The server could not be reached. Please try again.' });
  });

  it('invalid envelope throws INVALID_RESPONSE', async () => {
    const promise = transport.request('GET', '/test');

    const req = httpMock.expectOne(baseUrl + '/test');
    req.flush({ not: 'an envelope' });

    await expect(promise).rejects.toMatchObject({ code: 'INVALID_RESPONSE', message: 'Malformed response from server.' });
  });

  it('uses idempotency key as X-Idempotency-Key header on mutations', async () => {
    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const options: RequestOptions = { idempotencyKey: 'idem-123' };
    const promise = transport.request('POST', '/test', { a: 1 }, options);

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.get('X-Idempotency-Key')).toBe('idem-123');
    req.flush(envelope);

    await promise;
  });

  it('does NOT add X-Idempotency-Key on GET', async () => {
    const envelope: ApiResponse<null> = { success: true, data: null, meta: { request_id: 'req_1' } };
    const options: RequestOptions = { idempotencyKey: 'idem-123' };
    const promise = transport.request('GET', '/test', undefined, options);

    const req = httpMock.expectOne(baseUrl + '/test');
    expect(req.request.headers.has('X-Idempotency-Key')).toBeFalsy();
    req.flush(envelope);

    await promise;
  });
});