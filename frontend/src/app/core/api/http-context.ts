/**
 * HttpContext tokens for per-request overrides.
 *
 * Functional interceptors use these to allow callers to customize
 * behavior per-request (e.g., skip auth, provide custom token,
 * custom correlation id).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpContextToken } from '@angular/common/http';

/** Override the Authorization token for a single request. */
export const HTTP_AUTH_TOKEN = new HttpContextToken<string | null>(() => null);

/** Override the X-Request-ID for a single request. */
export const HTTP_CORRELATION_ID = new HttpContextToken<string | null>(() => null);

/** Override the X-Idempotency-Key for a single (mutating) request. */
export const HTTP_IDEMPOTENCY_KEY = new HttpContextToken<string | null>(() => null);

/** Skip the error interceptor's default handling for a single request. */
export const HTTP_SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);