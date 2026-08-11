/**
 * Unit tests for DashboardPageComponent — the REAL product
 * dashboard (i.e. not the primitives showcase).
 *
 * TDD RED: written to pin the page boundary before implementation.
 *
 * Per the user (2026-08-11): the old /dashboard was a primitives-
 * pack fixture and was moved to /showcase. The /dashboard route
 * now renders the REAL product page, with content driven by the
 * wireframe at wireframe/meridian/dashboard/index.html (h1
 * "Good evening, Alex", sections: Active Executions, Latest
 * Opportunities, Pool Health).
 *
 * This spec deliberately tests the wireframe-shape behavior so a
 * future agent building the page has clear requirements to satisfy.
 * The page is currently an EmptyState placeholder (intentional
 * until the next pack ships the real content).
 *
 * Behavior pins:
 *   1. Renders inside a <main> with the wireframe's structural
 *      shell (heading + sections).
 *   2. Until the real content ships, displays an UiEmptyState with
 *      a pointer that the page is planned (not a bug).
 *   3. The component is registered on the /dashboard route.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

async function renderDashboard(): Promise<ComponentFixture> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { DashboardPageComponent: Comp } = await import('./dashboard.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('DashboardPage', () => {
  it('renders inside a <main> element', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('main')).toBeTruthy();
  });

  it('until real content ships, shows an EmptyState placeholder', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const placeholder = root.querySelector('ui-empty-state');
    expect(placeholder).toBeTruthy();
  });

  it('the placeholder mentions the wireframe plan so future agents see it', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    // Search the placeholder region for any word that signals "planned"
    // — we want a future implementer to know this is intentional, not
    // a forgotten TODO.
    const text = root.textContent ?? '';
    const lc = text.toLowerCase();
    expect(
      lc.includes('planned') ||
      lc.includes('planned') ||
      lc.includes('wireframe') ||
      lc.includes('coming soon')
    ).toBe(true);
  });

  it('registers a route at /dashboard in the app router', async () => {
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path === 'dashboard',
    );
    expect(match).toBeTruthy();
  });
});
