/**
 * HttpTransport — HttpClient-based ApiTransport implementation.
 *
 * Production transport used when environment.useMock is false. Wraps
 * Angular's HttpClient and applies the gateway wire conventions
 * (envelope shape, error codes, correlation headers) so ApiClient never
 * sees raw HTTP. The interceptors (auth, correlation, error) handle
 * cross-cutting concerns; this class focuses on the request/response
 * envelope contract.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 *
 * DISCOVERY 2026-08-18: migrated from fetch-based to HttpClient-based
 * to follow Angular 20 idiomatic patterns. The interceptors now handle
 * auth, correlation IDs, and error mapping that were previously inline.
 * Pointer: gateway wire conventions in docs/apis/00-api-conventions.md
 * (§Response Format, §Error Format); design rationale tracked in
 * sessions/decisions.md.
 */
import { Injectable, Inject, InjectionToken } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiResponse, ApiError, isApiEnvelope } from './api-response';
import { ApiTransport, RequestOptions } from './api-transport';
import { HTTP_AUTH_TOKEN, HTTP_IDEMPOTENCY_KEY } from './http-context';

/** InjectionToken carrying the API base URL for the HttpClient-backed transport. */
export const HTTP_BASE_URL = new InjectionToken<string>('HTTP_BASE_URL');

@Injectable()
export class HttpTransport implements ApiTransport {
  // DISCOVERY 2026-08-19: constructor injection is INTENTIONAL here, not
  // a prefer-inject violation. buildTransport() in app.config.ts constructs
  // `new HttpTransport(http, baseUrl)` (a DI factory), and the http-transport
  // spec resolves it via TestBed — both modes must keep working. The two
  // deps (HttpClient, HTTP_BASE_URL) are explicit on purpose: this class is
  // the transport boundary and must stay directly instantiable.
  constructor(
    private readonly http: HttpClient, // eslint-disable-line @angular-eslint/prefer-inject
    @Inject(HTTP_BASE_URL) private readonly baseUrl: string, // eslint-disable-line @angular-eslint/prefer-inject
  ) {}

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.baseUrl + path;

    let context = new HttpContext();
    if (options?.token) {
      context = context.set(HTTP_AUTH_TOKEN, options.token);
    }
    if (options?.idempotencyKey && method !== 'GET') {
      context = context.set(HTTP_IDEMPOTENCY_KEY, options.idempotencyKey);
    }

    try {
      // http.request<T> returns the response BODY (the envelope) on success.
      // The errorInterceptor converts non-2xx HttpErrorResponse into ApiError
      // upstream, so this path only handles success payloads. A 204 has a null
      // body, which we normalize to { data: undefined }.
      const payload = await firstValueFrom(
        this.http.request<ApiResponse<T>>(method, url, {
          body: body ?? undefined,
          context,
          responseType: 'json',
        }),
      );

      if (payload === null || payload === undefined) {
        return { success: true, data: undefined as T };
      }

      if (!isApiEnvelope(payload)) {
        throw new ApiError('INVALID_RESPONSE', 'Malformed response from server.', {});
      }

      return payload as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('SERVICE_UNAVAILABLE', 'The server could not be reached. Please try again.', {});
    }
  }
}