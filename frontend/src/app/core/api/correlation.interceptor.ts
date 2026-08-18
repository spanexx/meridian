/**
 * Correlation interceptor — attaches X-Request-ID to every request.
 *
 * Functional interceptor (Angular 20 style). Generates a unique request
 * ID using the same format as the legacy HttpTransport (req_<random><timestamp>).
 * Allows per-request override via HTTP_CORRELATION_ID context.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { HTTP_CORRELATION_ID, HTTP_IDEMPOTENCY_KEY } from './http-context';

function generateRequestId(): string {
  return 'req_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const correlationInterceptor: HttpInterceptorFn = (req, next) => {
  const overrideId = req.context.get(HTTP_CORRELATION_ID);
  const requestId = overrideId ?? generateRequestId();
  const idempotencyKey = req.context.get(HTTP_IDEMPOTENCY_KEY);

  let corrReq = req.clone({
    setHeaders: { 'X-Request-ID': requestId },
  });

  // Idempotency key only applies to mutating requests; the transport already
  // guards GET, but we respect whatever context was set.
  if (idempotencyKey) {
    corrReq = corrReq.clone({
      setHeaders: { 'X-Idempotency-Key': idempotencyKey },
    });
  }

  return next(corrReq);
};