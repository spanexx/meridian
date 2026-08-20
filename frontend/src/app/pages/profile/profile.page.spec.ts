/**
 * ProfilePageComponent — the signed-in user's own private profile.
 *
 * Renders per wireframe/meridian/profile/index.html:
 *   - breadcrumb (Profile)
 *   - hero: avatar (initials), name + role + tier badge + verified badge,
 *     location + member-since, 3 KPIs (overall / signals / lifetime),
 *     Settings + Sign out buttons
 *   - Reputation card (lg:col-span-2): 4 sub-cards (Signal / Capital /
 *     Access / Community) with score, progress bar, 2 stat rows
 *   - Privileges checklist (4 privileges)
 *   - Payouts side card (capital / signal / access / total)
 *   - Identity side card (email / KYC / 2FA / country)
 *   - Recent Activity table (5 rows: Date / Event / Result / Impact)
 *
 * Route: /profile — no route params (it's the signed-in user's profile).
 * The shell sidebar sets the active route to "profile".
 *
 * @owner   spanexx
 * @reviewed 2026-08-19
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { ProfilePageComponent } from './profile.page';
import { ApiClient } from '../../core/api/api-client';
import { TokenStore } from '../../core/auth/token-store';
import { AuthStore } from '../../core/state/auth.store';
import { SEED_AUTH_ME_MEMBER } from '../../core/api/mock-seed';
import type { AuthMeMember } from '../../core/models';

async function renderPage() {
  const f = TestBed.createComponent(ProfilePageComponent);
  f.detectChanges();
  await f.whenStable();
  // Pack C: the constructor fires loadMe() (fire-and-forget) which
  // populates auth.member(). We re-call + await so the member signal
  // is settled before any textContent assertion runs — otherwise the
  // identity card shows fallback labels (Not started / Not enabled)
  // until the next detectChanges tick.
  const auth = TestBed.inject(AuthStore);
  await auth.loadMe();
  f.detectChanges();
  await f.whenStable();
  return f;
}

async function renderPageWithMember(overrides: Partial<AuthMeMember>) {
  const overridden: AuthMeMember = { ...SEED_AUTH_ME_MEMBER, ...overrides };
  const mockClient = {
    me: vi.fn().mockResolvedValue({ member: overridden, session: { created_at: '', expires_at: '' } }),
  } as unknown as ApiClient;
  // The TestBed.configureTestingModule in beforeEach already configured
  // an ApiClient provider — re-configure to swap the mock.
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProfilePageComponent],
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }, TokenStore],
  }).compileComponents();
  return renderPage();
}

describe('ProfilePageComponent', () => {
  beforeEach(async () => {
    const mockClient = {
      // Pack B: profile reads the session member from AuthStore, which
      // calls /auth/me (real response shape, not the Member record).
      me: vi.fn().mockResolvedValue({ member: SEED_AUTH_ME_MEMBER, session: { created_at: '', expires_at: '' } }),
      // Pack C: signOut() calls AuthStore.logout() which calls
      // ApiClient.logout() — the mock must resolve cleanly.
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }, TokenStore],
    }).compileComponents();
  });

  // ─── Header / hero ─────────────────────────────────────────────────
  it('renders a single Profile label (no self-link, no name suffix)', async () => {
    const f = await renderPage();
    const bc = f.nativeElement.querySelector('[data-testid=profile-breadcrumb]') as HTMLElement;
    expect(bc?.textContent?.trim()).toBe('Profile');
    // No anchor: the page IS the profile; a 'Profile' link would be self-referential.
    expect(bc?.querySelector('a')).toBeNull();
    // No name suffix: the user is on their own page, not navigating to themselves.
    expect(bc?.textContent).not.toContain('Alex Chen');
  });

  it('renders the user name as h1', async () => {
    const f = await renderPage();
    const h1 = (f.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Alex Chen');
  });

  it('shows role + tier badge', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Vetter');
    expect(html).toContain('T3');
  });

  it('shows verified badge', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Verified');
  });

  it('shows location + member since', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('San Francisco, CA');
    expect(html).toContain('March 2024');
  });

  it('renders the 3 KPI tiles', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Overall');
    expect(html).toContain('78');
    expect(html).toContain('Signals');
    expect(html).toContain('8 of 14');
    expect(html).toContain('Lifetime');
    expect(html).toContain('$1,847');
  });

  it('renders the Settings link', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Settings');
    // The link resolves to /settings (routerLink); the link-target
    // audit enforces it points at a registered route.
  });

  it('renders the Sign out button', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Sign out');
  });

  // ─── Reputation ────────────────────────────────────────────────────
  it('renders the reputation sub-cards (Signal / Capital / Access / Community)', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Signal');
    expect(html).toContain('Capital');
    expect(html).toContain('Access');
    expect(html).toContain('Community');
  });

  it('renders the privileges checklist (4 privileges)', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Can vote');
    expect(html).toContain('Can operate');
    expect(html).toContain('Capital share');
    expect(html).toContain('Max signal');
  });

  // ─── Payouts ───────────────────────────────────────────────────────
  it('renders the payouts breakdown (capital / signal / access / total)', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Payouts');
    expect(html).toContain('$1,162.40');
    expect(html).toContain('$482.10');
    expect(html).toContain('$202.73');
    expect(html).toContain('$1,847');
  });

  // ─── Identity ──────────────────────────────────────────────────────
  it('renders the identity card (email / KYC / 2FA / country)', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Identity');
    expect(html).toContain('alex@meridian.com');
    expect(html).toContain('KYC');
    expect(html).toContain('TOTP');
    expect(html).toContain('USA');
  });

  // ─── Recent activity ───────────────────────────────────────────────
  it('renders the recent activity table with 5 rows', async () => {
    const f = await renderPage();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(5);
  });

  it('recent activity events link to opportunity / execution / pool / payouts', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Vote cast on O-2049');
    expect(html).toContain('Signal O-2045 approved');
    expect(html).toContain('E-1042 listed');
    expect(html).toContain('Payout received');
    expect(html).toContain('Capital deposit');
  });

  // ─── Helpers ───────────────────────────────────────────────────────
  it('formatUsd() formats USD with thousands separator', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { formatUsd: (n: number) => string };
    expect(c.formatUsd(0)).toBe('$0.00');
    expect(c.formatUsd(1847.23)).toBe('$1,847.23');
    expect(c.formatUsd(162.40)).toBe('$162.40');
  });

  it('reputationColor() returns a CSS var for each color', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { reputationColor: (s: string) => string };
    expect(c.reputationColor('violet')).toBe('var(--v-400)');
    expect(c.reputationColor('emerald')).toBe('var(--e-400)');
    expect(c.reputationColor('blue')).toBe('var(--b-400)');
    expect(c.reputationColor('amber')).toBe('var(--a-400)');
  });

  it('reputationTint() returns an rgba tint for each color', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { reputationTint: (s: string) => string };
    expect(c.reputationTint('violet')).toContain('201');
    expect(c.reputationTint('emerald')).toContain('16');
    expect(c.reputationTint('blue')).toContain('96');
    expect(c.reputationTint('amber')).toContain('245');
  });

  it('signOut() executes without throwing (no-op until auth wires in)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { signOut: () => void };
    expect(() => c.signOut()).not.toThrow();
  });

  // ─── Pack C: KYC + 2FA read from session member ───────────────────
  it('KYC badge label tracks auth.member().kyc_status (VERIFIED → "Verified")', async () => {
    const f = await renderPage(); // SEED_AUTH_ME_MEMBER has kyc_status: 'VERIFIED'
    const html = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Verified');
  });

  it('KYC badge label changes to "Pending" when kyc_status is PENDING', async () => {
    const f = await renderPageWithMember({ kyc_status: 'PENDING' });
    const c = f.componentInstance as unknown as { kycLabel: () => string };
    expect(c.kycLabel()).toBe('Pending');
  });

  it('KYC badge label changes to "Not started" when kyc_status is NOT_STARTED', async () => {
    const f = await renderPageWithMember({ kyc_status: 'NOT_STARTED' });
    const c = f.componentInstance as unknown as { kycLabel: () => string };
    expect(c.kycLabel()).toBe('Not started');
  });

  it('2FA label is "TOTP" when two_factor_enabled is true', async () => {
    const f = await renderPage(); // SEED_AUTH_ME_MEMBER has two_factor_enabled: true
    const c = f.componentInstance as unknown as { twofaLabel: () => string };
    expect(c.twofaLabel()).toBe('TOTP');
  });

  it('2FA label is "Not enabled" when two_factor_enabled is false', async () => {
    const f = await renderPageWithMember({ two_factor_enabled: false });
    const c = f.componentInstance as unknown as { twofaLabel: () => string };
    expect(c.twofaLabel()).toBe('Not enabled');
  });

  // ─── Pack C: signOut wires through AuthStore + Router ─────────────
  it('signOut() calls AuthStore.logout() and navigates to /', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { signOut: () => Promise<void> | void };
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthStore) as unknown as { logout: ReturnType<typeof vi.fn> };
    const logoutSpy = vi.spyOn(auth, 'logout').mockResolvedValue(undefined);
    await c.signOut();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith(['/']);
  });
});

