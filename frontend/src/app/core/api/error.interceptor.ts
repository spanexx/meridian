/**
 * Error interceptor — central HTTP error handling.
 *
 * Functional interceptor (Angular 20 style). Maps non-2xx responses to
 * ApiError with stable codes (matching the legacy HttpTransport behavior).
 * On 401, clears the TokenStore (auth pack owns refresh logic; this
 * interceptor only clears + throws). Allows per-request skip via
 * HTTP_SKIP_ERROR_HANDLING context.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenStore } from '../auth/token-store';
import { ApiError } from './api-response';
import { HTTP_SKIP_ERROR_HANDLING } from './http-context';

const STATUS_CODE_MAP: Record<number, string> = {
  401: 'AUTH_TOKEN_INVALID',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
};

function isApiErrorBody(body: unknown): body is { error?: { code?: string; message?: string; details?: unknown } } {
  return typeof body === 'object' && body !== null && 'error' in (body as Record<string, unknown>);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const skipHandling = req.context.get(HTTP_SKIP_ERROR_HANDLING);
  if (skipHandling) {
    return next(req);
  }

  const tokenStore = inject(TokenStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => new ApiError('SERVICE_UNAVAILABLE', 'An unexpected error occurred.', {}));
      }

      const status = error.status;
      const body = error.error;

      // 401: clear token (auth pack handles refresh/re-login)
      if (status === 401) {
        tokenStore.clear();
      }

      let code: string;
      let message: string;
      let details: unknown;

      if (isApiErrorBody(body) && body.error) {
        code = body.error.code ?? STATUS_CODE_MAP[status] ?? 'SERVICE_UNAVAILABLE';
        message = body.error.message ?? `Request failed (${status})`;
        details = body.error.details;
      } else if (status === 0) {
        // Network failure / CORS / offline — no status, no body.
        code = 'SERVICE_UNAVAILABLE';
        message = 'The server could not be reached. Please try again.';
        details = body;
      } else {
        code = STATUS_CODE_MAP[status] ?? 'SERVICE_UNAVAILABLE';
        message = error.message ?? `Request failed (${status})`;
        details = body;
      }

      return throwError(() => new ApiError(code, message, { status, details }));
    })
  );
};