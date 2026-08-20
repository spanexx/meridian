/**
 * authGuard — protects authenticated routes.
 *
 * Pack C (2026-08-19): a route passes when a live session exists
 * (AuthStore.isAuthenticated() — token present + not expired). On entry
 * it fires a background loadMe() so the shell/profile read a warm member
 * while staying non-blocking. Unauthenticated navigation is redirected to
 * /login with the original URL preserved as ?returnUrl so the user lands
 * back where they were after signing in.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    // Fire-and-forget member warm-up (never blocks navigation).
    void auth.loadMe();
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
