/**
 * Unit tests for PayoutsPageComponent — wireframe-aligned, now API-driven.
 *
 * The page consumes the canonical pool-wide ledger through the injected
 * ApiClient.payoutsList() (core/api/api-client.ts); the test provides a
 * mock ApiClient returning SEED_PAYOUTS so the rendered output is
 * byte-identical to the wireframe (and to the e2e target). Data arrives
 * asynchronously, so every row-reading test awaits fixture.whenStable().
 *
 * Per wireframe/meridian/payouts/index.html:
 *   - title 'Payouts' + 'Profit distribution across the pool — the
 *     split formula is community-governed.'
 *   - Search input + Type DROPDOWN (All types / Capital / Signal /
 *     Access) that filters rows by contribution type
 *   - Status tabs (single row): All (48) / Pending (3) / Paid (45)
 *   - 3 KPI cards with exact labels + values
 *   - Split Formula card with 5 cells + a Governance link
 *   - 7-column table whose first 7 rows match the wireframe exactly
 *   - 48 rows total in the ledger, 8 per page (6 pages)
 *   - Footer 'Showing 8 of 48' + '1 / 6' pagination
 *   - Empty state when filters match zero rows
 *   - Loading skeleton while the first payload is in flight
 *
 * DISCOVERY 2026-08-18: the page was rewired from hardcoded payouts.data
 * to the injected ApiClient (Step 6, see docs/features/frontend-data-layer/
 * IMPL-frontend-data-layer.md Step 6). The mock is provided via TestBed so
 * the test never needs the real transport; async data means tests must
 * await whenStable() before asserting on rows/counts.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import type { PayoutsPageComponent } from './payouts.page';
import { ApiClient } from '../../core/api/api-client';
import { SEED_PAYOUTS } from '../../core/api/mock-seed';

let mockClient: { payoutsList: ReturnType<typeof vi.fn> } | null = null;

async function renderStandalone(): Promise<ComponentFixture<PayoutsPageComponent>> {
  mockClient = {
    payoutsList: vi.fn().mockResolvedValue({ payouts: SEED_PAYOUTS }),
  } as unknown as { payoutsList: ReturnType<typeof vi.fn> };
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient as unknown as ApiClient }],
  }).compileComponents();
  const { PayoutsPageComponent: Comp } = await import('./payouts.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

const TYPES = ['All types', 'Capital', 'Signal', 'Access'];
const STATUSES = ['All', 'Pending', 'Paid'];
const COLUMNS = ['Execution', 'Member', 'Type', 'Amount', 'Share', 'Status', 'Date'];

describe('PayoutsPage (wireframe-aligned, API-driven)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the page title "Payouts"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Payouts');
  });

  it('subtitle mentions "Profit distribution across the pool"', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Profit distribution');
    expect(root.textContent).toContain('split formula is community-governed');
  });

  it('renders a search input', async () => {
    const fixture = await renderStandalone();
    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('search input filters rows by member name case-insensitively', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'jules';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.textContent).toContain('Jules Tan');
    }
  });

  it('type dropdown trigger + menu are present (mirrors opportunities page)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector('[data-dropdown="payMenu"]');
    const menu = root.querySelector('#payMenu');
    expect(trigger).toBeTruthy();
    expect(menu).toBeTruthy();
  });

  it('Type dropdown menu contains All types + the 3 contribution types', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const items = Array.from(root.querySelectorAll('#payMenu [data-filter-category]') ?? []);
    expect(items.length).toBe(TYPES.length);
    for (const t of TYPES) {
      expect(items.some((i) => i.textContent?.includes(t))).toBe(true);
    }
  });

  it('toggleTypeMenu() opens the menu; closeTypeMenu() closes it', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const menu = fixture.nativeElement.querySelector('#payMenu') as HTMLElement;
    expect(menu.hidden).toBe(true);
    c.toggleTypeMenu();
    fixture.detectChanges();
    expect(menu.hidden).toBe(false);
    c.closeTypeMenu();
    fixture.detectChanges();
    expect(menu.hidden).toBe(true);
  });

  it('selectType() filters rows by contribution type and sets the active item', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.selectType('signal');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.getAttribute('data-category')).toBe('signal');
    }
    const active = root.querySelector('#payMenu .menu-item.active') as HTMLElement | null;
    expect(active?.textContent).toContain('Signal');
  });

  it('renders 3 status tabs with counts 48 / 3 / 45', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(root.querySelectorAll('[data-testid="status-filter"] button'));
    expect(tabs.length).toBe(3);
    const [all, pending, paid] = tabs;
    expect(all?.textContent).toContain('All');
    expect(all?.textContent).toContain('48');
    expect(pending?.textContent).toContain('Pending');
    expect(pending?.textContent).toContain('3');
    expect(paid?.textContent).toContain('Paid');
    expect(paid?.textContent).toContain('45');
  });

  it('default status tab is "All" with aria-selected=true', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const allBtn = Array.from(root.querySelectorAll('[data-testid="status-filter"] button')).find(
      (b) => (b.textContent ?? '').trimStart().startsWith('All'),
    ) as HTMLElement | undefined;
    expect(allBtn?.getAttribute('aria-selected')).toBe('true');
  });

  it('setStatus() filters rows by status and drives the count', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.setStatus('paid');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(8); // 45 paid rows → still 8 rows on page 1
    for (const row of rows) {
      expect(row.getAttribute('data-status')).toBe('paid');
    }
  });

  it('renders 3 KPI cards with exact labels and values', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';
    expect(text).toContain('Distributed YTD');
    expect(text).toContain('$84,290');
    expect(text).toContain('12 executions closed');
    expect(text).toContain('$5,982');
    expect(text).toContain('E-1039 closing this week');
    expect(text).toContain('Avg. execution ROI');
    expect(text).toContain('+21.4%');
    expect(text).toContain('Above community floor of 15%');
  });

  it('Split Formula card shows 5 cells with exact percents + labels', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const cells = root.querySelectorAll('[data-testid="split-cell"]');
    expect(cells.length).toBe(5);
    const expected = [
      { pct: '46%', label: 'Capital' },
      { pct: '30%', label: 'Signal' },
      { pct: '12%', label: 'Access' },
      { pct: '8%', label: 'Operations' },
      { pct: '4%', label: 'Platform' },
    ];
    const cellTexts = Array.from(cells).map((c) =>
      (c.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    for (const { pct, label } of expected) {
      expect(cellTexts.some((t) => t.includes(pct) && t.includes(label))).toBe(true);
    }
  });

  it('Split Formula card links Governance to /community/alpha/governance', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const governance = root.querySelector(
      'a[href="/community/alpha/governance"]',
    ) as HTMLAnchorElement | null;
    expect(governance).toBeTruthy();
  });

  it('table has the 7 wireframe columns in wireframe order', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const headers = Array.from(root.querySelectorAll('thead th')).map((h) => h.textContent?.trim());
    for (let i = 0; i < COLUMNS.length; i++) {
      expect(headers[i]).toBe(COLUMNS[i]);
    }
  });

  it('table renders 8 rows by default (one page)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('tbody tr').length).toBe(8);
  });

  it('first 7 rows match the wireframe exactly (order + values)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    const expected = [
      ['E-1039', 'DV', 'Capital', '+$2,340.80', '46%', 'Pending', 'est. Mar 18'],
      ['E-1039', 'MR', 'Signal', '+$1,526.61', '30%', 'Pending', 'est. Mar 18'],
      ['E-1039', 'JT', 'Access', '+$610.64', '12%', 'Pending', 'est. Mar 18'],
      ['E-1030', 'DV', 'Capital', '+$1,890.20', '46%', 'Paid', 'Mar 4'],
      ['E-1030', 'MR', 'Signal', '+$1,232.74', '30%', 'Paid', 'Mar 4'],
      ['E-1030', 'JT', 'Access', '+$493.10', '12%', 'Paid', 'Mar 4'],
      ['E-1028', 'RK', 'Capital', '+$1,204.55', '46%', 'Paid', 'Feb 21'],
    ];
    expected.forEach((vals, i) => {
      const rowText = (rows[i]?.textContent ?? '').replace(/\s+/g, ' ');
      for (const v of vals) {
        expect(rowText).toContain(v);
      }
    });
  });

  it('member rows link to /community/alpha/members/<slug-of-name>', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const memberLinks = Array.from(
      root.querySelectorAll('tbody a[href*="/community/alpha/members/"]'),
    ) as HTMLAnchorElement[];
    expect(memberLinks.length).toBeGreaterThan(0);
    for (const a of memberLinks) {
      expect(a.getAttribute('href')).toMatch(/^\/community\/alpha\/members\/[a-z0-9-]+$/);
    }
  });

  it('execution rows link to /executions/E-####', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const execLinks = Array.from(
      root.querySelectorAll('tbody a[href*="/executions/"]'),
    ) as HTMLAnchorElement[];
    expect(execLinks.length).toBeGreaterThan(0);
    for (const a of execLinks) {
      expect(a.getAttribute('href')).toMatch(/^\/executions\/E-\d+$/);
    }
  });

  it('pagination shows "Showing 8 of 48" and "1 / 6"', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const footer = root.querySelector('[data-testid="pagination"]') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('Showing 8 of 48');
    expect(footer.textContent).toContain('1 / 6');
  });

  it('prev is disabled on page 1; next is enabled', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const prev = root.querySelector('[data-page-prev]') as HTMLButtonElement;
    const next = root.querySelector('[data-page-next]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it('next() advances to page 2; prev() returns to page 1', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.next();
    fixture.detectChanges();
    expect((root.querySelector('[data-page-num]') as HTMLElement).textContent).toContain('2 / 6');
    expect((root.querySelector('[data-page-prev]') as HTMLButtonElement).disabled).toBe(false);
    c.prev();
    fixture.detectChanges();
    expect((root.querySelector('[data-page-num]') as HTMLElement).textContent).toContain('1 / 6');
  });

  it('last page: next is disabled', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.page.set(6);
    fixture.detectChanges();
    expect((root.querySelector('[data-page-next]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders the empty state when no rows match', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    c.search.set('zzz-no-match');
    fixture.detectChanges();
    const empty = root.querySelector('[data-testid="empty"]') as HTMLElement | null;
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain('No payouts match');
    expect(empty?.textContent).toContain('Try a different status, type, or search term.');
  });

  it('onSearchChange(event) updates the search signal and resets the page', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.page.set(3);
    c.onSearchChange({ target: { value: 'ravi' } } as unknown as Event);
    expect(c.search()).toBe('ravi');
    expect(c.page()).toBe(1);
  });

  // ─── format helpers (unit) + dataset contract ────────────────────
  it('SEED_PAYOUTS totals 48 rows with 3 pending + 45 paid', async () => {
    expect(SEED_PAYOUTS.length).toBe(48);
    expect(SEED_PAYOUTS.filter((p) => p.status === 'PENDING').length).toBe(3);
    expect(SEED_PAYOUTS.filter((p) => p.status === 'COMPLETED').length).toBe(45);
  });

  it('formatAmount() renders "+$X,XXX.XX" with thousands separator from an API money string', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.formatAmount('2340.80')).toBe('+$2,340.80');
    expect(c.formatAmount('1890.20')).toBe('+$1,890.20');
    expect(c.formatAmount('1232.00')).toBe('+$1,232.00');
  });

  it('typeLabel()/statusLabel() return the wireframe badges', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.typeLabel('capital')).toBe('Capital');
    expect(c.typeLabel('signal')).toBe('Signal');
    expect(c.typeLabel('access')).toBe('Access');
    expect(c.statusLabel('pending')).toBe('Pending');
    expect(c.statusLabel('paid')).toBe('Paid');
  });

  it('statusVariant() maps paid→success and pending→warning', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.statusVariant('paid')).toBe('success');
    expect(c.statusVariant('pending')).toBe('warning');
  });

  it('slugForName()/memberUrl() produce the default-community member route', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.slugForName('Dana Voss')).toBe('dana-voss');
    expect(c.memberUrl('Jules Tan')).toBe('/community/alpha/members/jules-tan');
  });

  // ─── Step 6: loading → loaded transition + ApiClient contract ──────
  it('calls ApiClient.payoutsList() once, shows skeleton while loading, then 8 rows', async () => {
    const mc = {
      payoutsList: vi.fn().mockResolvedValue({ payouts: SEED_PAYOUTS }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ApiClient, useValue: mc }],
    }).compileComponents();
    const { PayoutsPageComponent: Comp } = await import('./payouts.page');
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges(); // loading = true, skeleton visible, no rows
    const pre = fixture.nativeElement as HTMLElement;
    expect(pre.querySelector('[data-testid="skeleton"]')).toBeTruthy();
    // Only the skeleton row is present; no data rows yet.
    expect(pre.querySelector('tbody .table-row')).toBeFalsy();
    expect(mc.payoutsList).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    fixture.detectChanges();
    const post = fixture.nativeElement as HTMLElement;
    expect(post.querySelector('[data-testid="skeleton"]')).toBeFalsy();
    expect(post.querySelectorAll('tbody .table-row').length).toBe(8);
  });
});
