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
import { ApiResponse } from './api-response';
import { ApiTransport, RequestOptions } from './api-transport';
import { MockGateway } from './mock-gateway';

/** One recorded request — the transport's observability log. */
export interface MockRequestRecord {
  method: string;
  path: string;
  idempotencyKey?: string;
}

export class MockTransport implements ApiTransport {
  /** Every request the transport has served, in order. */
  readonly requests: MockRequestRecord[] = [];

  constructor(
    private readonly gateway: MockGateway,
    private readonly latencyMs = 0,
  ) {}

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    this.requests.push({ method, path, idempotencyKey: options?.idempotencyKey });
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
    const data = await this.gateway.handle(method, path, body);
    return {
      success: true,
      data: data as T,
      meta: {
        request_id: `req_mock_${this.requests.length}`,
        timestamp: new Date().toISOString(),
      },
    };
  }
}