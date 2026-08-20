/**
 * authGuard + roleGuard unit tests (vitest).
 *
 * Uses TestBed.runInInjectionContext to evaluate the CanActivateFn,
 * mirroring how the Angular router invokes them. Router.createUrlTree
 * is exercised through a real Router (provideRouter([])).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthStore } from '../state/auth.store';

function routeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('authGuard', () => {
  function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { isAuthenticated: () => authenticated, loadMe: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
  }

  it('allows navigation when a live session exists', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, routeState('/dashboard')),
    );
    expect(result).toBe(true);
  });

  it('fires loadMe() on authenticated entry (warm member)', () => {
    setup(true);
    const auth = TestBed.inject(AuthStore) as unknown as { loadMe: ReturnType<typeof vi.fn> };
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, routeState('/pool')));
    expect(auth.loadMe).toHaveBeenCalledTimes(1);
  });

  it('redirects to /login with returnUrl when unauthenticated', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, routeState('/pool')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('login');
    expect((result as UrlTree).toString()).toContain('returnUrl');
  });
});

describe('roleGuard', () => {
  function setup(member: { roles: string[] } | null) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: { member: () => member } }],
    });
  }

  it('allows when the member carries a required role', () => {
    setup({ roles: ['MEMBER', 'VETTER'] });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('VETTER', 'OPERATOR')({} as ActivatedRouteSnapshot, routeState('/community/alpha/governance')),
    );
    expect(result).toBe(true);
  });

  it('redirects to / when the member lacks the required role', () => {
    setup({ roles: ['MEMBER'] });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('VETTER', 'OPERATOR')({} as ActivatedRouteSnapshot, routeState('/community/alpha/governance')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('redirects to /login when the member is not loaded', () => {
    setup(null);
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('VETTER')({} as ActivatedRouteSnapshot, routeState('/community/alpha/governance')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('login');
  });
});
