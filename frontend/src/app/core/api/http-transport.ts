/**
 * HttpTransport — fetch-based ApiTransport implementation.
 *
 * This is the production transport used when environment.useMock is false.
 * It wraps the native fetch API and applies the gateway wire conventions
 * (envelope shape, error codes, correlation headers) so ApiClient never
 * sees raw HTTP.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 *
 * DISCOVERY 2026-08-18: this fetch-based transport replaces the
 * HttpClient-based approach described in docs/frontend/00-frontend-overview.md.
 * That doc is rewritten in the maintainability pack.
 */
import { ApiResponse, ApiError, isApiEnvelope } from './api-response';
import { ApiTransport, RequestOptions } from './api-transport';

const STATUS_CODE_MAP: Record<number, string> = {
  401: 'AUTH_TOKEN_INVALID',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
};

export function newRequestId(): string {
  return 'req_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class HttpTransport implements ApiTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => string | null = () => null,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.baseUrl + path;
    const requestId = newRequestId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    };

    const token = options?.token ?? this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options?.idempotencyKey && method !== 'GET') {
      headers['X-Idempotency-Key'] = options.idempotencyKey;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await this.fetcher(url, fetchOptions);
    } catch {
      throw new ApiError('SERVICE_UNAVAILABLE', 'The server could not be reached. Please try again.', {});
    }

    if (response.status === 204) {
      return { success: true, data: undefined as T };
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorBody = payload as { error?: { code?: string; message?: string; details?: unknown } };
      const code = errorBody.error?.code ?? STATUS_CODE_MAP[response.status] ?? 'SERVICE_UNAVAILABLE';
      const message = errorBody.error?.message ?? `Request failed (${response.status})`;
      throw new ApiError(code, message, { status: response.status, details: errorBody.error?.details });
    }

    if (!isApiEnvelope(payload)) {
      throw new ApiError('INVALID_RESPONSE', 'Malformed response from server.', {});
    }

    return payload as ApiResponse<T>;
  }
}