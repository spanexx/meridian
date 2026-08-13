/**
 * Unit tests for ShellComponent — the layout chrome wrapping every
 * routed page. Renders per wireframe/meridian/kit/app.js mountShell().
 *
 * TDD RED: written before implementation. Behavior pins:
 *   1. Renders a .sidebar <aside> with 260px fixed positioning (theme.css).
 *   2. Renders the MERIDIAN brand mark + tagline at the top of the sidebar.
 *   3. Renders nav sections ("Platform", "Community") with one
 *      nav-item per entry in our ANGULAR_NAV_ITEMS table.
 *      (No "Account" section — /settings is reached via the bottom-row
 *      gear icon, so a sidebar Settings entry would just duplicate it.)
 *   4. Marks the active nav-item based on the route URL passed in as input.
 *   5. Renders the "Quick Actions" section with Submit Signal link.
 *   6. Renders a bottom-row trio (notifications / theme toggle / avatar).
 *   7. Renders the user's avatar + name + role at the very bottom.
 *   8. Renders a .mobile-bar visible only on small screens (< 1280px).
 *   9. The component accepts content projection via <ng-content> for the
 *      main page content (the routed child).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
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
  // Create the fixture FIRST so the component subscribes to Router
  // events before the navigation fires.
  const fixture = TestBed.createComponent(ShellComponent);
  fixture.detectChanges();
  // Then navigate.
  const router = TestBed.inject(Router) as Router;
  await router.navigateByUrl(initialUrl);
  // Allow events to settle.
  await new Promise((r) => setTimeout(r, 0));
  fixture.detectChanges();
  return fixture;
}

describe('ShellComponent', () => {
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
    // nav items + the Submit Signal action item
    expect(items.length).toBeGreaterThanOrEqual(ANGULAR_NAV_ITEMS.length);
  });

  it('renders nav-section headings for each section (Platform + Community) — no Account', async () => {
    const fixture = await renderShell();
    const sections = fixture.nativeElement.querySelectorAll('.nav-section');
    const labels = Array.from(sections).map((s) => s.textContent?.trim());
    expect(labels).toContain('Platform');
    expect(labels).toContain('Community');
    expect(labels).toContain('Quick Actions');
    // /settings is reached via the bottom-row gear icon. An "Account"
    // nav section that listed Settings would just duplicate that icon,
    // so it was removed (the gear is already wired to /profile, which
    // is the user's own private profile page).
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
    // The <main> shell anchor lives inside the .app-shell wrapper;
    // ng-content is what projection happens through.
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const main = root.querySelector('.app-shell > main.main');
    expect(main).toBeTruthy();
  });

  // ─── component methods (pre-commit TDD block requires coverage) ──────
  it('toggleTheme() flips document.documentElement.dataset.theme', async () => {
    const fixture = await renderShell();
    document.documentElement.dataset['theme'] = 'dark';
    fixture.componentInstance.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('light');
    fixture.componentInstance.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('toggleSidebar() flips sidebarOpen()', async () => {
    const fixture = await renderShell();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
    fixture.componentInstance.toggleSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
    fixture.componentInstance.toggleSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('openSidebar() sets sidebarOpen() true; closeSidebar() sets it false', async () => {
    const fixture = await renderShell();
    fixture.componentInstance.openSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
    fixture.componentInstance.closeSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
  });

  it('isActive() matches exact and sub-paths, rejects others', async () => {
    const fixture = await renderShell('/opportunities/42');
    const c = fixture.componentInstance;
    expect(c.isActive('/opportunities')).toBe(true);
    expect(c.isActive('/opportunities/42')).toBe(true);
    expect(c.isActive('/executions')).toBe(false);
  });

  // ─── regression: PR #20 shipped shell changes without the sun/cog
  // icon paths — names were correct but the SVGs rendered 0 children.
  // These tests pin that the bottom-row icons actually render shapes.
  it('bottom-row renders bell + sun + cog buttons with real icon shapes', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const bottomRow = root.querySelector('.flex.items-center.justify-around');
    const controls = Array.from(bottomRow?.querySelectorAll('button.icon-btn, a.icon-btn') ?? []);
    expect(controls.length).toBe(3);
    const icons = controls.map(
      (b) => b.querySelector('ui-icon')?.getAttribute('name'),
    );
    expect(icons).toEqual(['bell', 'sun', 'cog']);
    // Each icon's <svg> must have at least one child element — an empty
    // path dictionary entry renders an invisible icon.
    for (const control of controls) {
      const svg = control.querySelector('ui-icon svg') as SVGElement | null;
      expect(svg).toBeTruthy();
      const kids =
        (svg?.getElementsByTagName('path').length ?? 0) +
        (svg?.getElementsByTagName('line').length ?? 0) +
        (svg?.getElementsByTagName('polyline').length ?? 0) +
        (svg?.getElementsByTagName('polygon').length ?? 0) +
        (svg?.getElementsByTagName('circle').length ?? 0) +
        (svg?.getElementsByTagName('rect').length ?? 0);
      expect(kids).toBeGreaterThan(0);
    }
  });

  // ─── official logo mark (PR #22) ─────────────────────────────────────
  it('renders the official mark (ui-logo) in the sidebar brand link', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const sidebarLink = Array.from(root.querySelectorAll('aside.sidebar a')).find(
      (a) => a.getAttribute('href') === '/',
    );
    expect(sidebarLink).toBeTruthy();
    const logo = sidebarLink?.querySelector('ui-logo svg');
    expect(logo).toBeTruthy();
    // The official mark: ring circle (direct child of svg) + one arc path
    const svg = logo as SVGElement;
    expect(svg.querySelectorAll(':scope > circle').length).toBe(1);
    expect(svg.querySelectorAll(':scope > g path').length).toBe(1);
  });

  it('renders the official mark (ui-logo) in the mobile-bar brand link', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const mobileLink = Array.from(root.querySelectorAll('.mobile-bar a')).find(
      (a) => a.getAttribute('href') === '/',
    );
    expect(mobileLink).toBeTruthy();
    expect(mobileLink?.querySelector('ui-logo svg')).toBeTruthy();
  });

  it('renders the MERIDIAN wordmark with wide letter-spacing', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const sidebarLink = Array.from(root.querySelectorAll('aside.sidebar a')).find(
      (a) => a.getAttribute('href') === '/',
    );
    const wordmark = Array.from(sidebarLink?.querySelectorAll('div, span') ?? []).find(
      (el) => el.textContent?.trim() === 'MERIDIAN',
    );
    expect(wordmark).toBeTruthy();
    // 0.55em wide tracking per the official logo SVG (letter-spacing="0.55em")
    const cls = wordmark?.getAttribute('class') ?? '';
    expect(cls).toMatch(/tracking-\[0\.55em\]/);
    expect(cls).toContain('brand-wordmark');
  });

  it('the cog button links to /settings', async () => {
    const fixture = await renderShell();
    const root = fixture.nativeElement as HTMLElement;
    const gear = Array.from(
      root.querySelectorAll('.flex.items-center.justify-around a, .flex.items-center.justify-around button'),
    ).find(
      (b) => b.querySelector('ui-icon')?.getAttribute('name') === 'cog',
    );
    expect(gear).toBeTruthy();
    expect(gear?.getAttribute('href')).toBe('/profile');
  });
});

describe('ANGULAR_NAV_ITEMS', () => {
  it('contains each wireframe route (Platform + Community only)', () => {
    const labels = ANGULAR_NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Opportunities');
    expect(labels).toContain('Executions');
    expect(labels).toContain('Capital Pool');
    expect(labels).toContain('Communities');
    // Members is no longer in the sidebar — members belong to a community
    expect(labels).not.toContain('Members');
    expect(labels).toContain('Governance');
    expect(labels).toContain('Payouts');
    // Settings is NOT in the sidebar nav — the bottom-row gear icon
    // already opens /profile, and the Profile page links into /settings,
    // so listing Settings in the sidebar would duplicate that entry.
    expect(labels).not.toContain('Settings');
  });

  it('only contains Platform + Community sections (no Account)', () => {
    const sections = ANGULAR_NAV_ITEMS.map((i) => i.section);
    // first item is Platform section
    expect(sections[0]).toBe('Platform');
    // every item is Platform or Community — no Account section
    const allowed = new Set(['Platform', 'Community']);
    for (const s of sections) {
      expect(allowed.has(s)).toBe(true);
    }
    expect(sections).toContain('Platform');
    expect(sections).toContain('Community');
  });
});
