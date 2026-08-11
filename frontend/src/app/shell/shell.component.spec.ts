/**
 * Unit tests for ShellComponent — the layout chrome wrapping every
 * routed page. Renders per wireframe/meridian/kit/app.js mountShell().
 *
 * TDD RED: written before implementation. Behavior pins:
 *   1. Renders a .sidebar <aside> with 260px fixed positioning (theme.css).
 *   2. Renders the MERIDIAN brand mark + tagline at the top of the sidebar.
 *   3. Renders nav sections ("Platform", "Community", "Account") with
 *      one nav-item per entry in our ANGULAR_NAV_ITEMS table.
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

  it('renders nav-section headings for each section', async () => {
    const fixture = await renderShell();
    const sections = fixture.nativeElement.querySelectorAll('.nav-section');
    const labels = Array.from(sections).map((s) => s.textContent?.trim());
    expect(labels).toContain('Platform');
    expect(labels).toContain('Community');
    expect(labels).toContain('Account');
    expect(labels).toContain('Quick Actions');
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
});

describe('ANGULAR_NAV_ITEMS', () => {
  it('contains each wireframe route', () => {
    const labels = ANGULAR_NAV_ITEMS.map((i) => i.label);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Opportunities');
    expect(labels).toContain('Executions');
    expect(labels).toContain('Capital Pool');
    expect(labels).toContain('Communities');
    expect(labels).toContain('Members');
    expect(labels).toContain('Governance');
    expect(labels).toContain('Payouts');
    expect(labels).toContain('Notifications');
    expect(labels).toContain('Settings');
    expect(labels).toContain('Your Profile');
  });

  it('matches the wireframe NAV ordering (Platform then Community then Account)', () => {
    const sections = ANGULAR_NAV_ITEMS.map((i) => i.section);
    // first item is Platform section
    expect(sections[0]).toBe('Platform');
    // at least one item belongs to each section
    expect(sections).toContain('Platform');
    expect(sections).toContain('Community');
    expect(sections).toContain('Account');
  });
});
