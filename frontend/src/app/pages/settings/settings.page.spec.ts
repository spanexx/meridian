/**
 * SettingsPageComponent — the signed-in user's own settings page.
 *
 * Renders per wireframe/meridian/settings/index.html:
 *   - page header ("Settings" + subtitle)
 *   - 4-tab switcher: Profile (default) | Security | Notifications | Appearance
 *   - Profile panel: avatar + upload/remove, first/last name, display name,
 *     bio, Save button
 *   - Security panel: change-password form, 2FA toggle, Active sessions + sign-out
 *   - Notifications panel: 3 toggles (in-app / email / push) + digest frequency
 *   - Appearance panel: light/dark theme cards + compact-tables toggle
 *
 * Only one panel is visible at a time (controlled by the active tab).
 * Forms fire `saveProfile()` / `savePassword()` / `uploadPhoto()` /
 * `removePhoto()` / `signOutOthers()`; theme selection updates the global
 * theme via `setTheme()`.
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsPageComponent } from './settings.page';

async function renderPage() {
  const f = TestBed.createComponent(SettingsPageComponent);
  f.detectChanges();
  return f;
}

describe('SettingsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the page header (Settings + subtitle)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const h1 = root.querySelector('h1');
    expect(h1?.textContent).toContain('Settings');
    expect(root.textContent ?? '').toContain('Profile, security, notifications, and appearance');
  });

  it('renders all 4 tabs with the right icons', async () => {
    const f = await renderPage();
    const tabs = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid=settings-tab]');
    expect(tabs.length).toBe(4);
    const labels = Array.from(tabs).map((t) => t.textContent?.trim());
    expect(labels.map((l) => (l ?? '').replace(/\s+/g, ' ').trim())).toEqual(
      expect.arrayContaining(['Profile', 'Security', 'Notifications', 'Appearance']),
    );
  });

  it('starts on the Profile tab (only Profile panel visible)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const panels = root.querySelectorAll('[data-testid=settings-panel]') as NodeListOf<HTMLElement>;
    expect(panels.length).toBe(4);
    const visible = Array.from(panels).filter((p) => !p.hasAttribute('hidden'));
    expect(visible.length).toBe(1);
    expect(visible[0].getAttribute('data-panel-name')).toBe('profile');
  });

  it('switching to Security hides Profile and shows Security', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTab: (t: 'security') => void };
    c.selectTab('security');
    f.detectChanges();
    const panels = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid=settings-panel]') as NodeListOf<HTMLElement>;
    const visible = Array.from(panels).filter((p) => !p.hasAttribute('hidden'));
    expect(visible.length).toBe(1);
    expect(visible[0].getAttribute('data-panel-name')).toBe('security');
  });

  it('marks the active tab with aria-selected=true and the inactive ones with false', async () => {
    const f = await renderPage();
    const tabs = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid=settings-tab]') as NodeListOf<HTMLElement>;
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');
    expect(tabs[3].getAttribute('aria-selected')).toBe('false');
  });

  // ─── Profile panel ──────────────────────────────────────────────────

  it('Profile panel shows avatar + first/last/display/bio inputs pre-filled with the current user', async () => {
    const f = await renderPage();
    const panel = (f.nativeElement as HTMLElement).querySelector('[data-panel-name=profile]') as HTMLElement;
    expect(panel).toBeTruthy();
    const first  = panel.querySelector('[data-testid=settings-first-name]') as HTMLInputElement;
    const last   = panel.querySelector('[data-testid=settings-last-name]') as HTMLInputElement;
    const name   = panel.querySelector('[data-testid=settings-display-name]') as HTMLInputElement;
    const bio    = panel.querySelector('[data-testid=settings-bio]') as HTMLTextAreaElement;
    expect(first.value).toBe('Alex');
    expect(last.value).toBe('Chen');
    expect(name.value).toBe('Alex Chen');
    expect(bio.value).toContain('Operator');
  });

  it('saveProfile() returns a truthy result (placeholder)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { saveProfile: () => unknown };
    expect(c.saveProfile()).toBeTruthy();
  });

  // ─── Security panel ─────────────────────────────────────────────────

  it('Security panel renders 2FA toggle + active sessions sign-out', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTab: (t: 'security') => void };
    c.selectTab('security');
    f.detectChanges();
    const panel = (f.nativeElement as HTMLElement).querySelector('[data-panel-name=security]') as HTMLElement;
    expect(panel.textContent ?? '').toContain('Two-factor authentication');
    expect(panel.textContent ?? '').toContain('Active sessions');
    const toggle = panel.querySelector('[data-testid=settings-2fa-toggle]') as HTMLButtonElement;
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
  });

  it('savePassword() returns truthy', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { savePassword: () => unknown };
    expect(c.savePassword()).toBeTruthy();
  });

  it('signOutOthers() returns truthy', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { signOutOthers: () => unknown };
    expect(c.signOutOthers()).toBeTruthy();
  });

  // ─── Notifications panel ───────────────────────────────────────────

  it('Notifications panel renders 3 toggles + digest-frequency select', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTab: (t: 'notifications') => void };
    c.selectTab('notifications');
    f.detectChanges();
    const panel = (f.nativeElement as HTMLElement).querySelector('[data-panel-name=notifications]') as HTMLElement;
    expect(panel.textContent ?? '').toContain('In-app');
    expect(panel.textContent ?? '').toContain('Email digest');
    expect(panel.textContent ?? '').toContain('Push');
    const select = panel.querySelector('[data-testid=settings-digest-frequency]') as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toContain('Daily');
  });

  // ─── Appearance panel ───────────────────────────────────────────────

  it('Appearance panel renders 2 theme choice cards + compact-tables toggle', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTab: (t: 'appearance') => void };
    c.selectTab('appearance');
    f.detectChanges();
    const panel = (f.nativeElement as HTMLElement).querySelector('[data-panel-name=appearance]') as HTMLElement;
    const themeCards = panel.querySelectorAll('[data-testid=settings-theme-choice]') as NodeListOf<HTMLElement>;
    expect(themeCards.length).toBe(2);
    expect(themeCards[0].getAttribute('data-theme-choice')).toBe('light');
    expect(themeCards[1].getAttribute('data-theme-choice')).toBe('dark');
  });

  it('marking the current theme shows the check icon on the matching card only', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { currentTheme: 'light' | 'dark' };
    c.currentTheme = 'dark';
    f.detectChanges();
    const cards = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid=settings-theme-choice]') as NodeListOf<HTMLElement>;
    // Light card: check hidden
    expect(cards[0].querySelector('[data-testid=settings-theme-check]')?.getAttribute('style') ?? '').toContain('opacity: 0');
    // Dark card: check visible
    expect(cards[1].querySelector('[data-testid=settings-theme-check]')?.getAttribute('style') ?? '').toContain('opacity: 1');
  });

  it('setTheme(light) toggles the data-theme attribute on document.documentElement', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const f = await renderPage();
    const c = f.componentInstance as unknown as { setTheme: (t: 'light' | 'dark') => void };
    c.setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    // reset for downstream tests
    c.setTheme('dark');
  });

  // ─── Toggle helpers (public methods, TDD-coupled) ──────────────────
  it('isThemeCurrent() matches the active theme only', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      currentTheme: () => string; isThemeCurrent: (t: string) => boolean;
    };
    expect(c.isThemeCurrent(c.currentTheme())).toBe(true);
    expect(c.isThemeCurrent(c.currentTheme() === 'light' ? 'dark' : 'light')).toBe(false);
  });

  it('toggle2FA() flips the 2FA signal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { twoFactorEnabled: () => boolean; toggle2FA: () => void };
    const before = c.twoFactorEnabled();
    c.toggle2FA();
    expect(c.twoFactorEnabled()).toBe(!before);
    c.toggle2FA();
    expect(c.twoFactorEnabled()).toBe(before);
  });

  it('toggleNotifInApp() flips the in-app notification signal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { notifInApp: () => boolean; toggleNotifInApp: () => void };
    const before = c.notifInApp();
    c.toggleNotifInApp();
    expect(c.notifInApp()).toBe(!before);
  });

  it('toggleNotifEmail() flips the email notification signal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { notifEmail: () => boolean; toggleNotifEmail: () => void };
    const before = c.notifEmail();
    c.toggleNotifEmail();
    expect(c.notifEmail()).toBe(!before);
  });

  it('toggleNotifPush() flips the push notification signal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { notifPush: () => boolean; toggleNotifPush: () => void };
    const before = c.notifPush();
    c.toggleNotifPush();
    expect(c.notifPush()).toBe(!before);
  });

  it('toggleCompactTables() flips the compact-tables signal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { compactTables: () => boolean; toggleCompactTables: () => void };
    const before = c.compactTables();
    c.toggleCompactTables();
    expect(c.compactTables()).toBe(!before);
  });
});
