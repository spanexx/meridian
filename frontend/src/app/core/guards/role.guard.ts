/**
 * roleGuard — role-restricted routes.
 *
 * Pack C (2026-08-19): `roleGuard('VETTER', 'OPERATOR')` returns a
 * CanActivateFn that allows navigation only when the signed-in member
 * carries at least one of the required roles (AuthStore.member().roles).
 * A missing member means the profile isn't loaded yet — redirect to
 * /login (the authGuard composes in front of this guard on routes that
 * need both). Members without the required role are redirected to /.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';
import type { MemberRole } from '../models';

export function roleGuard(...roles: MemberRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    const member = auth.member();
    if (!member) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const allowed = member.roles.some((role) => roles.includes(role));
    return allowed ? true : router.createUrlTree(['/']);
  };
}
