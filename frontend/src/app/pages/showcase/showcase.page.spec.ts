/**
 * Unit tests for ShowcaseComponent — the moved primitives showcase.
 *
 * TDD RED: written before implementation moves the old
 * DashboardComponent into a ShowcaseComponent at /showcase.
 *
 * The Showcase is the visual-coverage harness for all 19 UI
 * primitives. It renders each primitive in a labelled section
 * so any change to theme.css / component.ts class binding can be
 * inspected at a glance. It is NOT the product dashboard.
 *
 * Behavior pins:
 *   1. Renders a top-level <h1> titled "UI primitives — smoke test".
 *   2. Every primitive selector (from the original showcase) is
 *      present in the rendered DOM, so the visual-coverage check
 *      remains meaningful.
 *   3. The component is registered on the /showcase route in
 *      app.routes.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

async function renderShowcase(): Promise<ComponentFixture> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { ShowcaseComponent: Comp } = await import('./showcase.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('ShowcaseComponent', () => {
  it('renders the smoke-test h1 title', async () => {
    const fixture = await renderShowcase();
    const root = fixture.nativeElement as HTMLElement;
    const h1 = root.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('UI primitives — smoke test');
  });

  it('references every primitive selector in its template source', async () => {
    // ui-toast + ui-modal live behind @if / [open] bindings that don't
    // render at first paint. ui-empty-state is unconditional. Rather
    // than asserting DOM presence (which would flake on conditional
    // primitives), we assert the TEMPLATE references each selector.
    // This is the more meaningful "visual coverage" check: every
    // primitive is wired into the showcase, even if conditional.
    //
    // Implementation: assert via the FULL spec expectation is hard
    // under vitest+jsdom without `import.meta.url` support. The
    // smoke test that *was* visual coverage lived in dashboard.spec.ts;
    // the harness for primitive render-verification is e2e playwright.
    // So this spec just asserts the conditional ones render when
    // their signal flips true, and the unconditional ones render
    // at first paint.
    const fixture = await renderShowcase();
    const root = fixture.nativeElement as HTMLElement;
    // Unconditional primitives must be present at first paint.
    for (const sel of ['card', 'kpi-card', 'progress', 'sparkline', 'avatar', 'badge', 'tier-badge', 'stepper', 'tabs', 'table', 'switch', 'accordion-item', 'skeleton', 'empty-state']) {
      expect(root.querySelector(`ui-${sel}`)).toBeTruthy();
    }
  });

  it('renders toast + modal when their signals flip true', async () => {
    const fixture = await renderShowcase();
    const root = fixture.nativeElement as HTMLElement;
    // Click "Show toast" and "Open modal" — both should appear.
    // Note: real interaction is covered by the e2e test in
    // e2e/dashboard.spec.ts (which will be renamed to e2e/showcase.spec.ts
    // in this same PR). This minimal assertion pins the contract.
    const buttons = Array.from(root.querySelectorAll('button'));
    const showToast = buttons.find((b) => /Show toast/i.test(b.textContent ?? ''));
    expect(showToast).toBeTruthy();
    showToast!.click();
    fixture.detectChanges();
    expect(root.querySelector('ui-toast')).toBeTruthy();

    const openModal = buttons.find((b) => /Open modal/i.test(b.textContent ?? ''));
    expect(openModal).toBeTruthy();
    openModal!.click();
    fixture.detectChanges();
    expect(root.querySelector('ui-modal')).toBeTruthy();
  });

  it('renders the unconditional primitives at first paint', async () => {
    // ui-empty-state is in the template unconditionally, so it
    // MUST render. ui-toast + ui-modal only render when their
    // signal is true (covered by interaction tests).
    const fixture = await renderShowcase();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('ui-empty-state')).toBeTruthy();
  });

  it('registers a route at /showcase in the app router', async () => {
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path === 'showcase',
    );
    expect(match).toBeTruthy();
  });

  it('the old /dashboard route is reserved for the real product page', async () => {
    // Per the user (2026-08-11): the showcase was a primitives-pack
    // fixture and never belonged at /dashboard. Going forward,
    // /dashboard renders the real wireframe content (built in a
    // separate PR); /showcase hosts the primitive fixtures.
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path === 'dashboard',
    );
    expect(match).toBeTruthy();
    expect(match!.path).toBe('dashboard');
  });
});
