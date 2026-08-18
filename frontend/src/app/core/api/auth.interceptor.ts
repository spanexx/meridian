/**
 * Auth interceptor — attaches Authorization: Bearer <token> from TokenStore.
 *
 * Functional interceptor (Angular 20 style) for provideHttpClient(
 * withInterceptors([...]) ). Reads the current token from TokenStore at
 * request time so it always reflects the latest session. Skips when no
 * token is present. Allows per-request override via context token.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStore } from '../auth/token-store';
import { HTTP_AUTH_TOKEN } from './http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStore);
  const overrideToken = req.context.get(HTTP_AUTH_TOKEN);
  const token = overrideToken ?? tokenStore.token;

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};