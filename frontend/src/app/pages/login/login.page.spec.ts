/**
 * Unit tests for LoginPageComponent — shell-less /login auth page.
 * Per wireframe/meridian/login/index.html. Behavior pins:
 *   - Shell-less layout: top bar (MERIDIAN logo -> /dashboard + theme
 *     toggle) + centered glass card + footer — no app sidebar.
 *   - Card 'Welcome back' + 'Sign in to your MERIDIAN account.'
 *   - Demo credentials prefilled (alex@meridian.com / demo-password)
 *   - forgot() toasts 'Reset link sent to alex@meridian.com'
 *   - submit() toasts 'Signed in — welcome back' then a 900ms
 *     setTimeout navigates to /dashboard
 *   - passkey() / twoFA() toast 'Passkey requested' / '2FA code sent by email'
 *   - Register cross-link [routerLink]="['/register']"
 *   - toggleTheme() mirrors the shell and flips documentElement dataset
 *   - Footer copy
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import type { LoginPageComponent } from './login.page';

/** Minimal routable content so routerLink hrefs resolve in the test router. */
@Component({ selector: 'stub-route', standalone: true, template: '' })
class StubRouteComponent {}

const AUTH_ROUTES = [
  { path: 'login', component: StubRouteComponent },
  { path: 'register', component: StubRouteComponent },
  { path: 'dashboard', component: StubRouteComponent },
];

async function renderStandalone(): Promise<ComponentFixture<LoginPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter(AUTH_ROUTES)],
  }).compileComponents();
  const { LoginPageComponent: Comp } = await import('./login.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('LoginPage (wireframe-aligned)', () => {
  beforeEach(() => {
    document.documentElement.dataset['theme'] = 'dark';
  });

  it('renders the shell-less top bar with the MERIDIAN wordmark + tagline', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="auth-card"]');
    expect(card).toBeTruthy();
    expect(root.textContent).toContain('MERIDIAN');
    expect(root.textContent).toContain('Collective Arbitrage');
    expect(root.querySelector('[data-testid="login-theme-toggle"]')).toBeTruthy();
  });

  it('renders "Welcome back" and "Sign in to your MERIDIAN account."', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Welcome back');
    expect(fixture.nativeElement.textContent).toContain('Sign in to your MERIDIAN account.');
  });

  it('prefills the wireframe demo credentials + hint', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect((root.querySelector('input[data-field="email"]') as HTMLInputElement).value).toBe(
      'alex@meridian.com',
    );
    expect((root.querySelector('input[data-field="password"]') as HTMLInputElement).value).toBe(
      'demo-password',
    );
    expect(root.textContent).toContain('Demo: any credentials work.');
  });

  it('forgot() toasts "Reset link sent to alex@meridian.com"', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="forgot"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const toast = root.querySelector('ui-toast') as HTMLElement;
    expect(toast.textContent).toContain('Reset link sent to alex@meridian.com');
    expect(c.toast()?.message).toBe('Reset link sent to alex@meridian.com');
  });

  it('links to /register via the "Create an account" anchor', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const link = root.querySelector('[data-testid="register-link"]') as HTMLElement;
    expect(link.textContent).toContain('Create an account');
    // routerLink (array form) resolves to the real /register route.
    expect(link.getAttribute('href')).toBe('/register');
  });

  it('submit() shows the success toast, then a 900ms setTimeout navigates to /dashboard', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.useFakeTimers();
    c.submit();
    fixture.detectChanges();
    const toast = root.querySelector('ui-toast') as HTMLElement;
    expect(toast.textContent).toContain('Signed in — welcome back');
    expect(nav).not.toHaveBeenCalled();
    vi.advanceTimersByTime(900);
    expect(nav).toHaveBeenCalledWith(['/dashboard']);
    vi.useRealTimers();
  });

  it('passkey() shows the "Passkey requested" toast', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="passkey"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(c.toast()?.message).toBe('Passkey requested');
  });

  it('twoFA() shows the "2FA code sent by email" toast', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.twoFA();
    fixture.detectChanges();
    expect(c.toast()?.message).toBe('2FA code sent by email');
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
      'MERIDIAN · member-owned · every execution reconstructable from the event stream',
    );
  });
});
