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
import { formatApiMoney } from '../../core/utils/money';
import {
  SEED_BALANCE,
  SEED_COMMUNITIES,
  SEED_OPPORTUNITIES,
  SEED_AUTH_ME_MEMBER,
  SEED_EXECUTIONS,
  SEED_POOL_STATUS,
} from '../../core/api/mock-seed';

async function renderDashboard(): Promise<ComponentFixture<unknown>> {
  const mockClient = {
    me: vi.fn().mockResolvedValue({ member: SEED_AUTH_ME_MEMBER, session: { created_at: '', expires_at: '' } }),
    opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    executionsList: vi.fn().mockResolvedValue({ executions: SEED_EXECUTIONS }),
    poolStatus: vi.fn().mockResolvedValue(SEED_POOL_STATUS),
    balance: vi.fn().mockResolvedValue(SEED_BALANCE),
    communitiesList: vi.fn().mockResolvedValue({ communities: SEED_COMMUNITIES }),
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

  // Pack B (2026-08-19): the KPI numbers come from ONE source — the
  // seeded ApiClient (PoolStore for pool totals, communitiesList for
  // member count, opportunitiesList for open/awaiting counts). The
  // wireframe's fabricated 12/8 counters are replaced by derivations.
  it('KPI values derive from the seeded ApiClient (one-source)', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('$1,423,580'); // poolStatus().totals.total_capital
    expect(text).toContain('$487,230'); // poolStatus().totals.deployed_capital
    expect(text).toContain('3 executions in flight'); // activity.active_executions
    expect(text).toContain('124'); // communitiesList()[0].member_count
    // opportunitiesList rows: 24 (16 non-terminal, 11 SUBMITTED/VETTING)
    expect(text).toContain('16');
    expect(text).toContain('11 awaiting your vote');
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

  it('Open Opportunities KPI derives the awaiting count from the seed', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    // 11 SUBMITTED/VETTING rows in SEED_OPPORTUNITIES (one-source derivation).
    expect(html).toContain('11 awaiting your vote');
  });

  it('KPI money formatting delegates to formatApiMoney (one-source util)', async () => {
    const fixture = await renderDashboard();
    const root = fixture.nativeElement as HTMLElement;
    // formatApiMoney is the single formatter behind the pool totals;
    // its output is what the KPI tiles render (e.g. grouped thousands).
    expect(root.textContent).toContain(formatApiMoney('1423580.00'));
    expect(root.textContent).toContain(formatApiMoney('487230.00'));
  });

  it('Each Active Execution row carries a status subtitle on the right', async () => {
    const fixture = await renderDashboard();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    // Status subtitles derive from the canonical seed (one source):
    // E-1042 HOLDING → "3 of 8 sold", E-1039 LIQUIDATING → "Closing",
    // E-1036 ACQUIRING → "ETA n days".
    expect(html).toContain('3 of 8 sold');
    expect(html).toContain('Closing');
    expect(html).toContain('ETA');
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
