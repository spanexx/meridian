/**
 * Unit tests for ShellComponent — the layout chrome wrapping every
 * routed page. Renders per wireframe/meridian/kit/app.js mountShell()
 * with these per-direction subtractions:
 *
 *   - The "Account" section (Notifications + Settings nav items) is
 *     intentionally removed (PR #20). The bell icon in the bottom
 *     row covers notifications; the new settings gear icon covers
 *     settings. The Account section was duplicating destinations.
 *   - The 3rd bottom-row icon (originally a user dropdown trigger)
 *     was removed and replaced with a settings gear that links
 *     directly to /settings (per the user 2026-08-12). The avatar
 *     row below already handles /profile.
 *
 * Resulting nav structure: Platform + Community + Quick Actions.
 * Resulting bottom row: bell + sun + settings gear + avatar row
 * that links to /profile.
 *
 * Behavior pins:
 *   1. Renders a .sidebar <aside> with 260px fixed positioning.
 *   2. Renders the MERIDIAN brand mark + tagline at the top.
 *   3. Renders nav sections: Platform + Community + Quick Actions.
 *      Does NOT render an "Account" section.
 *   4. Marks the active nav-item based on the route URL.
 *   5. Renders the "Submit Signal" quick-action link.
 *   6. Renders a bottom-row with bell + sun + settings gear.
 *   7. Renders the user's avatar + name + role at the very bottom,
 *      linking to /profile.
 *   8. Renders a .mobile-bar visible only on small screens (< 1280px).
 *   9. The mobile-bar toggle button opens the sidebar when clicked.
 *  10. The bottom-row avatar+name row links to /profile.
 *  11. No nav item labeled "Settings" or "Notifications" exists.
 *  12. No dropdown menus (notifications or avatar) are rendered.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ShellComponent, ANGULAR_NAV_ITEMS } from './shell.component';

async function renderShell(initialUrl = '/'): Promise<ComponentFixture<ShellComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([
      { path: '**', component: ShellComponent },
    ])],
  }).compileComponents();
  const fixture = TestBed.createComponent(ShellComponent);
  const router = TestBed.inject(Router) as Router;
  await router.navigateByUrl(initialUrl);
  fixture.detectChanges();
  await new Promise((r) => setTimeout(r, 0));
  fixture.detectChanges();
  return fixture;
}

describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([
        { path: '**', component: ShellComponent },
      ])],
    }).compileComponents();
  });

  it('renders an <aside class="sidebar">', async () => {
    const fixture = await renderShell();
    const sidebar = fixture.nativeElement.querySelector('aside.sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('renders the MERIDIAN brand mark + tagline', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('MERIDIAN');
    expect(root.textContent).toContain('Collective Arbitrage');
  });

  it('renders every configured nav item as a .nav-item', async () => {
    const fixture = await renderShell();
    const items = fixture.nativeElement.querySelectorAll('.nav-item');
    expect(items.length).toBeGreaterThanOrEqual(ANGULAR_NAV_ITEMS.length);
  });

  it('renders nav-section headings: Platform + Community + Quick Actions (NO Account)', async () => {
    const fixture = await renderShell();
    const sections = fixture.nativeElement.querySelectorAll('.nav-section');
    const labels = Array.from(sections).map((s) => s.textContent?.trim());
    expect(labels).toContain('Platform');
    expect(labels).toContain('Community');
    expect(labels).toContain('Quick Actions');
    expect(labels).not.toContain('Account');
  });

  it('marks the active nav-item based on current route', async () => {
    const fixture = await renderShell('/opportunities');
    const active = fixture.nativeElement.querySelector('.nav-item.active');
    expect(active?.getAttribute('data-nav')).toBe('/opportunities');
  });

  it('renders the "Submit Signal" quick-action link', async () => {
    const fixture = await renderShell();
    const submit = Array.from(fixture.nativeElement.querySelectorAll('a')).find(
      (a) => a.textContent?.includes('Submit Signal'),
    );
    expect(submit).toBeTruthy();
    expect(submit?.getAttribute('href')).toBe('/submit-signal');
  });

  it('renders the user avatar + name in the bottom-row', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Alex Chen');
    expect(root.textContent).toContain('Vetter');
  });

  it('renders a .mobile-bar toggle', async () => {
    const fixture = await renderShell();
    const mobile = fixture.nativeElement.querySelector('.mobile-bar');
    expect(mobile).toBeTruthy();
    expect(mobile?.querySelector('[data-sidebar-toggle]')).toBeTruthy();
  });

  it('renders a <main class="main"> inside .app-shell', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const main = root.querySelector('.app-shell > main.main');
    expect(main).toBeTruthy();
  });

  // ─── mobile sidebar toggle ─────────────────────────────────────────────
  it('starts with sidebarOpen=false (mobile sidebar hidden)', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('toggles sidebarOpen when openSidebar() is called', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.componentInstance.openSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
    fixture.componentInstance.closeSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('clicking the mobile-bar [data-sidebar-toggle] button toggles sidebarOpen', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('[data-sidebar-toggle]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('clicking the sidebar backdrop closes the mobile sidebar', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.componentInstance.openSidebar();
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('[data-sidebar-backdrop]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('the sidebar carries the "open" class when sidebarOpen() is true', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.componentInstance.openSidebar();
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('aside.sidebar');
    expect(aside?.classList.contains('open')).toBe(true);
  });

  // ─── de-duplicated nav structure (PR #20) ─────────────────────────────
  it('no nav item labeled "Settings" or "Notifications" exists', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const navItems = Array.from(root.querySelectorAll('a.nav-item'));
    const labels = navItems.map((a) => a.textContent?.trim() ?? '');
    expect(labels.some((l) => l === 'Settings')).toBe(false);
    expect(labels.some((l) => l === 'Notifications')).toBe(false);
  });

  it('bottom-row has bell + sun + settings gear (no user dropdown)', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const bottomRow = root.querySelector('.flex.items-center.justify-around');
    // The settings gear is an <a> with .icon-btn class, not a <button>.
    const buttons = bottomRow?.querySelectorAll('button.icon-btn, a.icon-btn') ?? [];
    expect(buttons.length).toBe(3);
    const icons = Array.from(buttons).map((b) => b.querySelector('ui-icon')?.getAttribute('name'));
    expect(icons).toContain('bell');
    expect(icons).toContain('sun');
    expect(icons).toContain('settings');
    expect(icons).not.toContain('user');
  });

  it('the settings gear in the bottom-row links to /settings', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const bottomRow = root.querySelector('.flex.items-center.justify-around');
    const buttons = Array.from(bottomRow?.querySelectorAll('a, button') ?? []);
    // The settings gear should be wrapped in an <a routerLink="/settings">
    const settingsLink = buttons.find(
      (b) => b.querySelector('ui-icon')?.getAttribute('name') === 'settings',
    );
    expect(settingsLink).toBeTruthy();
    // Allow either <a href="/settings"> or button with [routerLink]
    const href = settingsLink?.getAttribute('href');
    const nav = settingsLink?.getAttribute('data-nav');
    expect(href === '/settings' || nav === '/settings').toBe(true);
  });

  it('the bottom-row avatar+name row links to /profile', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const avatarRow = Array.from(root.querySelectorAll('a')).find(
      (a) => a.textContent?.includes('Alex Chen'),
    );
    expect(avatarRow?.getAttribute('href')).toBe('/profile');
  });

  it('no notifications or avatar dropdown menus are rendered', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="avatar-menu"]')).toBeFalsy();
    expect(root.querySelector('[data-testid="notif-menu"]')).toBeFalsy();
  });
});

describe('ANGULAR_NAV_ITEMS', () => {
  it('contains the wireframe route items (Platform + Community only — no Account)', () => {
    const labels = ANGULAR_NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Opportunities');
    expect(labels).toContain('Executions');
    expect(labels).toContain('Capital Pool');
    expect(labels).toContain('Communities');
    expect(labels).toContain('Members');
    expect(labels).toContain('Governance');
    expect(labels).toContain('Payouts');
    // Account section items removed
    expect(labels).not.toContain('Notifications');
    expect(labels).not.toContain('Settings');
    expect(labels).not.toContain('Your Profile');
  });

  it('matches the wireframe NAV ordering (Platform then Community)', () => {
    const sections = ANGULAR_NAV_ITEMS.map((i) => i.section);
    expect(sections[0]).toBe('Platform');
    expect(sections).toContain('Platform');
    expect(sections).toContain('Community');
    expect(sections).not.toContain('Account');
  });
});
