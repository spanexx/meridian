/**
 * Transport seam — the only place that knows how bytes move.
 *
 * ApiClient (core/api/api-client.ts) is the only consumer. Two
 * implementations exist: MockTransport (in-memory, development) and
 * HttpTransport (fetch against the real gateway). The app picks one via
 * environment.useMock in app.config.ts. Swapping transports must never
 * change a page — see docs/features/frontend-data-layer/.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiResponse } from './api-response';

/** Per-request extras: idempotency (mutations) and an override token. */
export interface RequestOptions {
  /** X-Idempotency-Key value — only meaningful for mutations (conventions §Idempotency). */
  idempotencyKey?: string;
  /** Explicit bearer token; defaults to the transport's token provider. */
  token?: string;
}

/** The seam between ApiClient and the wire: returns the full envelope. */
export interface ApiTransport {
  request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>>;
}