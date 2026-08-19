/**
 * Unit tests for PoolPageComponent — Capital Pool page.
 *
 * Renders per wireframe/meridian/pool/index.html: same layout,
 * same data, refined to be more minimal:
 *   - header: "Capital Pool" + subtitle + Snapshot/Withdraw/Deposit
 *   - KPI row: 4 cards (Total Available / Total Locked / Reserve /
 *     Pending)
 *   - chart card (lg:col-span-2): Pool · 90 days, 7d/90d/1y tabs,
 *     3-series SVG area chart + legend
 *   - reserve-ratio card: gauge + 18.2% + Healthy
 *   - health-metrics card: 4 progress bars
 *   - top-contributors table (lg:col-span-2): 5 members,
 *     Member/Tier/Tenure/Balance/Share
 *   - deposit + withdraw modals open/close from the header buttons
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { PoolPageComponent, CONTRIBUTORS } from './pool.page';
import { ApiClient } from '../../core/api/api-client';
import { SEED_BALANCE, SEED_POOL_STATUS } from '../../core/api/mock-seed';

async function renderPool(): Promise<ComponentFixture<PoolPageComponent>> {
  const mockClient = {
    poolStatus: vi.fn().mockResolvedValue(SEED_POOL_STATUS),
    balance: vi.fn().mockResolvedValue(SEED_BALANCE),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const { PoolPageComponent: Comp } = await import('./pool.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('PoolPageComponent', () => {
  // ─── header ────────────────────────────────────────────────────────────
  it('renders the page title + subtitle', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    const h1 = root.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Capital Pool');
    expect(root.textContent).toContain(
      'Pool health, reserve ratio, liquidity, and member contributions.',
    );
  });

  it('renders Snapshot / Withdraw / Deposit header buttons', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    const btns = Array.from(root.querySelectorAll('button')).filter((b) =>
      /Snapshot|Withdraw|Deposit/.test(b.textContent ?? ''),
    );
    expect(btns.length).toBeGreaterThanOrEqual(3);
    const texts = btns.map((b) => b.textContent?.trim() ?? '');
    expect(texts.some((t) => t.includes('Snapshot'))).toBe(true);
    expect(texts.some((t) => t.includes('Withdraw'))).toBe(true);
    expect(texts.some((t) => t.includes('Deposit'))).toBe(true);
    // Deposit is the primary action
    const deposit = btns.find((b) => b.textContent?.includes('Deposit'));
    expect(deposit?.classList.contains('btn-primary')).toBe(true);
  });

  // ─── KPI row ───────────────────────────────────────────────────────────
  it('renders the 4 KPI cards from the injected ApiClient (one-source)', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    const cards = Array.from(root.querySelectorAll('.kpi-label'));
    const labels = cards.map((c) => c.textContent?.trim());
    expect(labels).toEqual(['Total Available', 'Total Locked', 'Reserve', 'Pending']);
    // Values come from ApiClient.poolStatus() (mock SEED_POOL_STATUS) and are
    // formatted via formatApiMoney (wireframe "$936,350" style), not hardcoded.
    expect(root.textContent).toContain('$936,350');
    expect(root.textContent).toContain('$487,230');
    expect(root.textContent).toContain('$1,423,580');
    expect(root.textContent).toContain('$42,100');
    expect(root.textContent).toContain('+2.4% week');
    expect(root.textContent).toContain(`${SEED_POOL_STATUS.health.reserve_ratio}% of pool`);
  });

  // ─── chart card ────────────────────────────────────────────────────────
  it('renders the pool chart card with 7d/90d/1y tabs (90d active)', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Pool ·');
    const tabs = Array.from(root.querySelectorAll('.tab'));
    const labels = tabs.map((t) => t.textContent?.trim());
    expect(labels).toEqual(['7d', '90d', '1y']);
    expect(tabs[1]?.classList.contains('active')).toBe(true);
  });

  it('renders a 3-series SVG area chart (available/locked/reserve)', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    // jsdom cannot match camelCase SVG attrs in selectors — probe by aria-label
    const svg = root.querySelector('svg[aria-label="Pool chart"]');
    expect(svg).toBeTruthy();
    // 3 filled areas + 3 stroked lines (one pair per series)
    expect(svg?.querySelectorAll('path[fill^="url(#"]').length).toBe(3);
    expect(svg?.querySelectorAll('path[fill="none"]').length).toBe(3);
    // legend
    expect(root.textContent).toContain('Available');
    expect(root.textContent).toContain('Locked');
    expect(root.textContent).toContain('Reserve');
  });

  it('switching the chart tab changes the active tab', async () => {
    const fixture = await renderPool();
    fixture.detectChanges();
    const tabs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tab'));
    (tabs[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(tabs[1].classList.contains('active')).toBe(false);
  });

  // ─── reserve ratio card ────────────────────────────────────────────────
  it('renders the reserve-ratio gauge card with 18.2% Healthy', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Reserve Ratio');
    expect(root.textContent).toContain('Healthy ≥ 12%');
    const gauge = root.querySelector('svg[aria-label="Reserve ratio gauge"]');
    expect(gauge).toBeTruthy();
    expect(root.textContent).toContain('18.2%');
    expect(root.textContent).toContain('Healthy');
  });

  // ─── component methods (TDD coverage) ────────────────────────────
  it('chartLabel() reflects the active chart range', async () => {
    const fixture = await renderPool();
    const c = fixture.componentInstance;
    expect(c.chartLabel()).toBe('90 days');
    c.chartRange.set('7d');
    expect(c.chartLabel()).toBe('7 days');
    c.chartRange.set('1y');
    expect(c.chartLabel()).toBe('1 year');
  });

  // ─── health metrics ────────────────────────────────────────────────────
  it('renders the 4 health-metric progress bars with values', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Health Metrics');
    for (const label of ['Reserve ratio', 'Liquidity', 'Deployment', 'Pending withdrawals']) {
      expect(root.textContent).toContain(label);
    }
    expect(root.textContent).toContain('18.2%');
    expect(root.textContent).toContain('62.4%');
    expect(root.textContent).toContain('34.2%');
    expect(root.textContent).toContain('$8,400');
    const fills = root.querySelectorAll('.progress-fill');
    expect(fills.length).toBeGreaterThanOrEqual(4);
  });

  // ─── chart path helpers (unit) ─────────────────────────────
  it('builds a closed area path from the series line + baseline', async () => {
    const fixture = await renderPool();
    const c = fixture.componentInstance;
    const series = c.chartSeries();
    expect(series.length).toBe(3);
    for (const s of series) {
      // area = line path closed over the chart baseline (600x220 box)
      expect(s.area.startsWith('M')).toBe(true);
      expect(s.area.endsWith('L600,220 L0,220 Z')).toBe(true);
      expect(s.line).toBeTruthy();
      expect(s.gradient).toMatch(/^(avail|locked|reserve)$/);
    }
  });

  it('chart series keys map to the three pool series', async () => {
    const fixture = await renderPool();
    const c = fixture.componentInstance;
    const keys = c.chartSeries().map((s) => s.name);
    expect(keys).toEqual(['available', 'locked', 'reserve']);
  });

  // ─── contributors table ────────────────────────────────────────────────
  it('renders the top contributors table with all 5 wireframe members', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Top Capital Contributors');
    for (const c of CONTRIBUTORS) {
      expect(root.textContent).toContain(c.name);
      expect(root.textContent).toContain(c.balance);
    }
    const headers = Array.from(root.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toContain('Member');
    expect(headers).toContain('Tier');
    expect(headers).toContain('Balance');
    expect(headers).toContain('Share');
  });

  it('renders the "All members" link to /community/alpha/members', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    const link = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('All members'),
    );
    expect(link?.getAttribute('href')).toBe('/community/alpha/members');
  });

  // ─── modals ────────────────────────────────────────────────────────────
  it('deposit + withdraw modals are hidden by default', async () => {
    const fixture = await renderPool();
    const root = fixture.nativeElement as HTMLElement;
    const deposit = root.querySelector('[data-testid="deposit-modal"]') as HTMLElement;
    const withdraw = root.querySelector('[data-testid="withdraw-modal"]') as HTMLElement;
    expect(deposit?.hidden).toBe(true);
    expect(withdraw?.hidden).toBe(true);
  });

  it('clicking Deposit opens the deposit modal; close button hides it', async () => {
    const fixture = await renderPool();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const openBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Deposit'),
    );
    (openBtn as HTMLButtonElement).click();
    fixture.detectChanges();
    const modal = root.querySelector('[data-testid="deposit-modal"]') as HTMLElement;
    expect(modal?.hidden).toBe(false);
    expect(modal?.textContent).toContain('Deposit capital');
    // close via the Cancel button
    const cancel = Array.from(modal.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cancel'),
    );
    (cancel as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(modal.hidden).toBe(true);
  });

  it('clicking Withdraw opens the withdraw modal', async () => {
    const fixture = await renderPool();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const openBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Withdraw'),
    );
    (openBtn as HTMLButtonElement).click();
    fixture.detectChanges();
    const modal = root.querySelector('[data-testid="withdraw-modal"]') as HTMLElement;
    expect(modal?.hidden).toBe(false);
    expect(modal?.textContent).toContain('Request withdrawal');
  });

  it('withdraw modal shows the MEMBER available balance from ApiClient.balance()', async () => {
    const fixture = await renderPool();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const openBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Withdraw'),
    );
    (openBtn as HTMLButtonElement).click();
    fixture.detectChanges();
    const modal = root.querySelector('[data-testid="withdraw-modal"]') as HTMLElement;
    // Member-level balance (SEED_BALANCE.balances.available), formatted —
    // NOT the pool totals (one-source: balance() is the member edge).
    expect(modal?.textContent).toContain('Available balance $12,500.00.');
  });

  it('memberUrl() slugifies member names to the canonical /community/alpha/members/<slug>', async () => {
    const f = await renderPool();
    const c = f.componentInstance as unknown as { memberUrl: (n: string) => string };
    expect(c.memberUrl('Dana Voss')).toBe('/community/alpha/members/dana-voss');
    expect(c.memberUrl('Tomás Alves')).toBe('/community/alpha/members/tomas-alves');
  });
});

describe('CONTRIBUTORS', () => {
  it('has exactly the 5 wireframe contributors with share %', () => {
    expect(CONTRIBUTORS.length).toBe(5);
    const shares = CONTRIBUTORS.map((c) => c.share);
    expect(shares).toEqual([20.0, 13.9, 10.0, 6.8, 5.5]);
  });
});
