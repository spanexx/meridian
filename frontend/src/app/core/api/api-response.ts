/**
 * API envelope + error types — the gateway wire format.
 *
 * Every gateway response is { success, data, meta } and every error is
 * { success:false, error:{ code, message, details }, meta } per
 * docs/apis/00-api-conventions.md §Response Format. ApiError carries
 * the code + status so the UI can map codes via utils/errors.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

/** Pagination metadata — page-based or cursor-based (conventions §Pagination). */
export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
  has_prev?: boolean;
  cursor?: string;
  next_cursor?: string;
  has_more?: boolean;
}

/** Response metadata: correlation + pagination. */
export interface ApiMeta {
  request_id?: string;
  timestamp?: string;
  pagination?: PaginationMeta;
}

/** The success envelope every gateway endpoint returns. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

/** The error body shape inside a failed response. */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** Options attached to ApiError for the error surface. */
export interface ApiErrorOptions {
  status?: number;
  details?: unknown;
  meta?: ApiMeta;
}

/** A gateway failure: stable `code` for errorMessage(), optional HTTP status. */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly meta?: ApiMeta;

  constructor(code: string, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.meta = options.meta;
  }
}

/** True when a parsed body looks like the success envelope. */
export function isApiEnvelope(body: unknown): body is ApiResponse<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { success?: unknown }).success === true &&
    'data' in (body as Record<string, unknown>)
  );
}