/**
 * Auth interceptor — attaches Authorization: Bearer <token> from TokenStore,
 * and on 401 transparently refreshes the session and retries the request.
 *
 * Functional interceptor (Angular 20 style) for provideHttpClient(
 * withInterceptors([...]) ). Runs OUTERMOST (first in the list) so it
 * sees the raw 401 before the errorInterceptor maps it to ApiError.
 *
 * Behavior:
 *   1. Skips the Authorization header for `/auth/refresh` and `/auth/login`
 *      — those calls are how we get / refresh a token, and attaching the
 *      (about-to-expire) Bearer would defeat the purpose.
 *   2. Attaches Bearer to every other request when a token is present
 *      (reads TokenStore at request time, so the latest session is used).
 *   3. On a 401 from the server, attempts `AuthStore.refresh()`. A
 *      single in-flight refresh Promise is shared across concurrent 401s
 *      so a burst of failures triggers one round-trip to /auth/refresh.
 *   4. If refresh succeeds, clones the original request with the new
 *      Bearer and re-issues it. If refresh fails, the session is cleared
 *      and the original 401 propagates to the caller — the auth guard
 *      then bounces the user to /login.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { TokenStore } from '../auth/token-store';
import { AuthStore } from '../state/auth.store';
import { HTTP_AUTH_TOKEN } from './http-context';

/**
 * Endpoints that must never carry a Bearer (and must never trigger the
 * 401-refresh dance). BRIDGE 2026-08-21 (audit nice-to-have 7): extended
 * past /auth/refresh + /auth/login to the other token-FREE auth paths —
 * login/2fa completes with the temp_token (no session yet), and register
 * issues no token. /auth/2fa/setup|verify|disable intentionally stay OUT
 * (an enrolled member performs them with a live session → Bearer + refresh
 * on 401 are correct there).
 */
const SKIP_AUTH_PATHS = ['/auth/refresh', '/auth/login', '/auth/login/2fa', '/auth/register'];

/** Single in-flight refresh shared by all concurrent 401s. */
let refreshInFlight: Promise<boolean> | null = null;

function shouldSkipAuth(url: string): boolean {
  return SKIP_AUTH_PATHS.some((p) => url === p || url.endsWith(p));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStore);
  const authStore = inject(AuthStore);

  // 1. Never attach Bearer to the auth endpoints themselves.
  if (shouldSkipAuth(req.url)) {
    return next(req);
  }

  const overrideToken = req.context.get(HTTP_AUTH_TOKEN);
  const token = overrideToken ?? tokenStore.token;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      // Only retry on 401 from a request that DID carry a Bearer (no point
      // refreshing for an unauthenticated probe). Also bail when there is
      // no refresh token to rotate.
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (!tokenStore.refreshToken) {
        return throwError(() => err);
      }

      // 2. Single-flight: coalesce concurrent 401s into one refresh.
      refreshInFlight ??= authStore.refresh().finally(() => {
        refreshInFlight = null;
      });

      return from(refreshInFlight).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            // Refresh failed (AuthStore already cleared the session);
            // propagate the original 401 to the caller.
            return throwError(() => err);
          }
          // 3. Retry the original request with the rotated Bearer.
          const newToken = tokenStore.token;
          if (!newToken) {
            return throwError(() => err);
          }
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(retried);
        }),
      );
    }),
  );
};
