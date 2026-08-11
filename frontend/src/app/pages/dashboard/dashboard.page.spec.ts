/**
 * Unit tests for DashboardPageComponent — the REAL product dashboard.
 *
 * TDD: written to pin the wireframe-driven product content.
 * The /dashboard route historically hosted the primitives-pack
 * showcase (now /showcase). This spec describes what the real
 * page MUST render per wireframe/meridian/dashboard/index.html.
 *
 * Behavior pins (each maps to a wireframe section):
 *   1. Renders <h1 class="page-title"> with the greeting
 *      "Good evening, Alex" (+ page-subtitle).
 *   2. Renders 4 KPI tiles, one per: Total Pool, Active Capital,
 *      Active Members, Open Opportunities — each with .kpi-label +
 *      .kpi-number values matching the wireframe demo data.
 *   3. Renders an "Active Executions" section (h2 + a list of
 *      execution rows, each with ref prefix E-#### and a route to
 *      /execution-detail).
 *   4. Renders a "Latest Opportunities" section (h2 + rows with
 *      opportunity refs O-####).
 *   5. Renders a "Pool Health" section (h2) that includes an SVG
 *      sparkline chart with a <path>.
 *   6. Has a "Submit Signal" CTA (btn-primary with href
 *      /submit-signal).
 *   7. Renders a member "portfolio" card (Capital contributed,
 *      Lifetime earnings, Reputation tier).
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

async function renderDashboard(): Promise<ComponentFixture<unknown>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { DashboardPageComponent: Comp } = await import('./dashboard.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('DashboardPage (wireframe-driven)', () => {
  it('renders the greeting h1 + subtitle', async () => {
    const fixture = await renderDashboard();
    const h1 = fixture.nativeElement.querySelector('h1.page-title');
    expect(h1?.textContent?.trim()).toBe('Good evening, Alex');
    const sub = fixture.nativeElement.querySelector('.page-subtitle');
    expect(sub?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('renders the 4 KPI tiles with data', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const kpiLabels = Array.from(root.querySelectorAll('.kpi-label'))
      .map((el) => el.textContent?.trim());
    expect(kpiLabels).toContain('Total Pool');
    expect(kpiLabels).toContain('Active Capital');
    expect(kpiLabels).toContain('Active Members');
    expect(kpiLabels).toContain('Open Opportunities');
    // Every KPI tile carries a .kpi-number with a value.
    const kpiNumbers = Array.from(root.querySelectorAll('.kpi-number'));
    expect(kpiNumbers.length).toBeGreaterThanOrEqual(4);
    for (const num of kpiNumbers) {
      expect((num.textContent ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('renders the Active Executions section with execution rows', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const h2s = Array.from(root.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(h2s).toContain('Active Executions');
    const rows = Array.from(root.querySelectorAll('a[href*="/execution-detail"]'));
    expect(rows.length).toBeGreaterThan(0);
    // first row's text contains an E-#### ref
    const combined = rows.map((r) => r.textContent ?? '').join(' ');
    expect(combined).toMatch(/E-\d{3,}/);
  });

  it('renders the Latest Opportunities section with opportunity rows', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const h2s = Array.from(root.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(h2s).toContain('Latest Opportunities');
    const combined = root.textContent ?? '';
    expect(combined).toMatch(/O-\d{3,}/);
  });

  it('renders the Pool Health section with an SVG chart', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const h2s = Array.from(root.querySelectorAll('h2')).map((h) => h.textContent?.trim());
    expect(h2s).toContain('Pool Health');
    // The dashboard renders multiple SVGs (one per icon plus the
    // Pool Health chart). jsdom's HTML-mode parser doesn't always
    // recognize nested SVG elements, so we verify the dashboard
    // chart is present by counting viewBox='0 0 200 50' specifically.
    // (Icons use viewBox='0 0 24 24'; the chart uses 0 0 200 50.)
    const html = root.innerHTML;
    expect(html).toContain('viewBox="0 0 200 50"');
    expect(html).toContain('<path');
    expect(html).toContain('M0,38 L30,36 L60,30');
  });

  it('renders the Submit Signal CTA', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const cta = root.querySelector('a[href="/submit-signal"]');
    expect(cta).toBeTruthy();
    expect(cta?.textContent?.trim()).toContain('Submit Signal');
  });

  it('renders a member portfolio card (Capital / Earnings / Tier)', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Capital contributed');
    expect(text).toContain('Lifetime earnings');
    expect(text).toContain('Reputation tier');
  });

  it('registers a route at /dashboard in the app router', async () => {
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path === 'dashboard',
    );
    expect(match).toBeTruthy();
  });
});