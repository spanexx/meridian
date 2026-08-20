/**
 * Unit tests for RegisterPageComponent — shell-less /register auth page.
 * Per wireframe/meridian/register/index.html. Behavior pins:
 *   - Shell-less layout: top bar (MERIDIAN logo -> /dashboard + theme
 *     toggle) + centered glass card + footer — no app sidebar.
 *   - Card 'Join the pool' + 'Register to contribute capital, signals,
 *     or access.'
 *   - Form fields: Full name, Email, Password, Confirm + terms checkbox
 *   - submit() toasts 'Account created — welcome aboard' then a 900ms
 *     setTimeout navigates to /dashboard
 *   - Login cross-link [routerLink]="['/login']"
 *   - toggleTheme() mirrors the shell and flips documentElement dataset
 *   - Footer: 'MERIDIAN · KYC required for payouts · humans decide, AI
 *     only recommends'
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import type { RegisterPageComponent } from './register.page';
import { ApiClient } from '../../core/api/api-client';

/** Minimal routable content so routerLink hrefs resolve in the test router. */
@Component({ selector: 'stub-route', standalone: true, template: '' })
class StubRouteComponent {}

const AUTH_ROUTES = [
  { path: 'login', component: StubRouteComponent },
  { path: 'register', component: StubRouteComponent },
  { path: 'dashboard', component: StubRouteComponent },
];

async function renderStandalone(): Promise<ComponentFixture<RegisterPageComponent>> {
  const mockClient = {
    register: vi.fn().mockResolvedValue({ member_id: 'm1', email: 'x', status: 'ok', message: 'ok' }),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    providers: [provideRouter(AUTH_ROUTES), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const { RegisterPageComponent: Comp } = await import('./register.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('RegisterPage (wireframe-aligned)', () => {
  beforeEach(() => {
    document.documentElement.dataset['theme'] = 'dark';
  });

  it('renders the shell-less top bar with the MERIDIAN logo link', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="auth-card"]')).toBeTruthy();
    expect(root.textContent).toContain('MERIDIAN');
    expect(root.querySelector('[data-testid="register-theme-toggle"]')).toBeTruthy();
  });

  it('renders "Join the pool" + subtitle', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Join the pool');
    expect(fixture.nativeElement.textContent).toContain(
      'Register to contribute capital, signals, or access.',
    );
  });

  it('renders the Full name / Email / Password / Confirm fields + terms checkbox', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[data-field="fullname"]')).toBeTruthy();
    expect(root.querySelector('input[data-field="email"]')).toBeTruthy();
    expect(root.querySelector('input[data-field="password"]')).toBeTruthy();
    expect(root.querySelector('input[data-field="confirm"]')).toBeTruthy();
    expect(root.querySelector('input[data-field="terms"]')).toBeTruthy();
    expect(
      (root.querySelector('input[data-field="fullname"]') as HTMLInputElement).placeholder,
    ).toBe('Your name');
    expect((root.querySelector('input[data-field="email"]') as HTMLInputElement).placeholder).toBe(
      'you@example.com',
    );
    expect(root.textContent).toContain('integrity first.');
  });

  it('submit() shows the success toast, then a 900ms setTimeout navigates to /login', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.useFakeTimers();
    await c.submit();
    fixture.detectChanges();
    const toast = root.querySelector('ui-toast') as HTMLElement;
    expect(toast.textContent).toContain('Account created — welcome aboard');
    expect(nav).not.toHaveBeenCalled();
    vi.advanceTimersByTime(900);
    // Pack C: registration issues no token → the next step is /login.
    expect(nav).toHaveBeenCalledWith(['/login']);
    vi.useRealTimers();
  });

  it('links to /login via the "Sign in" anchor', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector('[data-testid="login-link"]') as HTMLElement;
    expect(link.textContent).toContain('Sign in');
    // routerLink (array form) resolves to the real /login route.
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('toggleTheme() flips the document theme between dark and light', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('light');
    c.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('renders the footer copy', async () => {
    const fixture = await renderStandalone();
    expect(fixture.nativeElement.textContent).toContain(
      'MERIDIAN · KYC required for payouts · humans decide, AI only recommends',
    );
  });
});
