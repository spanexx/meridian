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
 *      /executions/:ref).
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
import { vi } from 'vitest';
import { ApiClient } from '../../core/api/api-client';
import { SEED_OPPORTUNITIES, SEED_MEMBER } from '../../core/api/mock-seed';

async function renderDashboard(): Promise<ComponentFixture<unknown>> {
  const mockClient = {
    me: vi.fn().mockResolvedValue(SEED_MEMBER),
    opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const { DashboardPageComponent: Comp } = await import('./dashboard.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  await fixture.whenStable();
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
    const rows = Array.from(root.querySelectorAll('a[href*="/executions/"]'));
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
  // ─── Layout rework tests (per wireframe 3-col grid) ─────────────────
  it('uses a 3-column grid below the KPI row', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const grid = root.querySelector('section.page > div.grid');
    expect(grid).toBeTruthy();
    expect(grid?.className).toMatch(/lg:grid-cols-3/);
  });

  it('left column spans 2 of the 3 grid columns', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const left = root.querySelector('section.page > div.grid > div.lg\\:col-span-2');
    expect(left).toBeTruthy();
  });

  it('places Active Executions inside the left column', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const left = root.querySelector('section.page > div.grid > div.lg\\:col-span-2');
    expect(left?.textContent).toContain('Active Executions');
  });

  it('places Latest Opportunities inside the left column', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const left = root.querySelector('section.page > div.grid > div.lg\\:col-span-2');
    expect(left?.textContent).toContain('Latest Opportunities');
  });

  it('places Pool Health inside the right column (not left)', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const right = root.querySelector('section.page > div.grid > div:not(.lg\\:col-span-2)');
    expect(right?.textContent).toContain('Pool Health');
  });

  it('places Your Portfolio inside the right column', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const right = root.querySelector('section.page > div.grid > div:not(.lg\\:col-span-2)');
    expect(right?.textContent).toContain('Your Portfolio');
  });

  // ─── Content fixes vs wireframe ───────────────────────────────────────
  it('Active Members KPI says "+8 this week" not "new this month"', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    // The wireframe renders '+8' and 'this week' in two spans, so
    // collapse whitespace when asserting.
    const text = root.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('+8 this week');
    expect(text).not.toContain('new this month');
  });

  it('Open Opportunities KPI says "8 awaiting your vote"', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('8 awaiting your vote');
  });

  it('Each Active Execution row carries a status subtitle on the right', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    // Per wireframe: "3 of 8 sold", "Closing", "ETA 4 days"
    expect(html).toContain('3 of 8 sold');
    expect(html).toContain('Closing');
    expect(html).toContain('ETA 4 days');
  });

  it('Active Executions use multi-color progress bars (emerald / violet / blue)', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    // 3 rows, each with a different progress-fill color class
    expect(html).toMatch(/progress-fill-emerald/);
    expect(html).toMatch(/progress-fill-violet/);
    expect(html).toMatch(/progress-fill-blue/);
  });

  it('Pool Health renders three metrics: Reserve ratio, Liquidity, Deployment', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Reserve ratio');
    expect(root.textContent).toContain('Liquidity');
    expect(root.textContent).toContain('Deployment');
  });

  it('Pool Health sparkline has separate SVG paths per period (7d/30d/90d)', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('data-chart-set="7d"');
    expect(html).toContain('data-chart-set="30d"');
    expect(html).toContain('data-chart-set="90d"');
  });

  it('Latest Opportunities renders a TABLE (thead + tbody), not just cards', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const left = root.querySelector('section.page > div.grid > div.lg\\:col-span-2');
    const table = left?.querySelector('table');
    expect(table).toBeTruthy();
    expect(table?.querySelector('thead tr')).toBeTruthy();
    expect(table?.querySelector('tbody tr')).toBeTruthy();
  });

  it('Latest Opportunities table has columns: Ref / Title / Category / Est. ROI / Status / Votes', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const headers = Array.from(root.querySelectorAll('section.page thead th')).map(
      (h) => h.textContent?.trim(),
    );
    expect(headers).toContain('Ref');
    expect(headers).toContain('Title');
    expect(headers).toContain('Category');
    expect(headers).toContain('Est. ROI');
    expect(headers).toContain('Status');
    expect(headers).toContain('Votes');
  });
});
