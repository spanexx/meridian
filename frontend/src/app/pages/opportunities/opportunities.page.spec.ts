/**
 * Unit tests for OpportunitiesPageComponent — wireframe-aligned.
 *
 * Per the wireframe (wireframe/meridian/opportunities/index.html):
 *   - title 'Opportunities' + 'The signal pipeline — 24 active across
 *     all stages.'
 *   - Search input + Category DROPDOWN (not inline pills) + Submit Signal
 *   - Status tabs (single row): All / Pending / In Vetting / Approved /
 *     Executing / Rejected, each with a count
 *   - 9-column table: Ref / Title / Category / Submitted by / Est. ROI /
 *     Capital / Votes / Status / (arrow column)
 *   - 24 total rows in the dataset, 8 per page (3 pages of pagination)
 *   - Vote cells render 'N↑ / N↓' when votes exist, '—' when not
 *   - Capital rendered with thousands separator (e.g. $8,200)
 *   - Est. ROI rendered with leading '+' and emerald color (e.g. +34.2%)
 *   - Category cell shows a neutral badge (uppercase pill)
 *   - Submitted by cell shows an avatar circle + name
 *   - Footer 'Showing 8 of 24' + '1 / 3' pagination
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import type { OpportunitiesPageComponent } from './opportunities.page';
import { toOpportunityViewModel } from './opportunities.page';
import { ApiClient } from '../../core/api/api-client';
import { SEED_OPPORTUNITIES } from '../../core/api/mock-seed';

async function renderStandalone(): Promise<ComponentFixture<OpportunitiesPageComponent>> {
  const mockClient = {
    opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

const CATEGORIES = ['All categories', 'Apparel', 'Collectibles', 'Electronics', 'Equipment', 'Furniture'];
const STATUSES = ['All', 'Pending', 'In Vetting', 'Approved', 'Executing', 'Rejected'];
const COLUMNS = ['Ref', 'Title', 'Category', 'Submitted by', 'Est. ROI', 'Capital', 'Votes', 'Status'];

describe('OpportunitiesPage (wireframe-aligned)', () => {
  it('renders the page title "Opportunities"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Opportunities');
  });

  it('subtitle mentions "signal pipeline — 24 active across all stages"', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('signal pipeline');
    expect(root.textContent).toContain('24 active');
  });

  it('renders a search input', async () => {
    const fixture = await renderStandalone();
    const input = fixture.nativeElement.querySelector('input[type="search"]');
    expect(input).toBeTruthy();
  });

  it('exposes Category as a DROPDOWN (button + menu), not an inline pill row', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    // No inline category pills
    const inlineCatRow = root.querySelector('[data-testid="category-filter"]');
    expect(inlineCatRow).toBeFalsy();
    // Dropdown trigger button + hidden menu
    const trigger = root.querySelector('[data-dropdown="catMenu"]');
    const menu = root.querySelector('#catMenu');
    expect(trigger).toBeTruthy();
    expect(menu).toBeTruthy();
  });

  it('Category dropdown menu contains All categories + the 5 product categories', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const menu = root.querySelector('#catMenu');
    const items = menu?.querySelectorAll('[data-filter-category]');
    expect(items?.length).toBe(CATEGORIES.length);
  });

  it('renders every status filter tab with a count', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelector('[data-testid="status-filter"]');
    const buttons = Array.from(tabs?.querySelectorAll('button') ?? []);
    expect(buttons.length).toBe(STATUSES.length);
    for (const stat of STATUSES) {
      const match = buttons.find((b) => b.textContent?.includes(stat));
      expect(match, `missing status tab: ${stat}`).toBeTruthy();
    }
  });

  // ─── onStatusChange (TDD coverage) ────────────────────────────
  it('onStatusChange(event) updates the status signal and resets the page', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    // move to page 2 first so we can prove the reset
    c.status.set('pending');
    c.page.set(2);
    fixture.detectChanges();
    const fakeSelect = { value: 'vetting' } as unknown as HTMLSelectElement;
    c.onStatusChange({ target: fakeSelect } as unknown as Event);
    expect(c.status()).toBe('vetting');
    expect(c.page()).toBe(1);
  });

  it('default status tab is "All" with aria-selected=true', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const allBtn = Array.from(root.querySelectorAll('[data-testid="status-filter"] button'))
      .find((b) => b.textContent?.startsWith('All')) as HTMLElement | undefined;
    expect(allBtn?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders a mobile status dropdown with every tab option + count', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector('[data-testid="status-select"]') as HTMLSelectElement | null;
    expect(select).toBeTruthy();
    expect(select?.options.length).toBe(STATUSES.length);
    for (const stat of STATUSES) {
      const opt = Array.from(select?.options ?? []).find((o) => o.textContent?.includes(stat));
      expect(opt, `missing dropdown option: ${stat}`).toBeTruthy();
    }
  });

  it('mobile dropdown mirrors the active status and filters on change', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector('[data-testid="status-select"]') as HTMLSelectElement;
    // default: All → 8 rows (page 1)
    expect(select.value).toBe('all');
    // switch to Pending via the dropdown
    select.value = 'pending';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.getAttribute('data-status')).toBe('pending');
    }
    const pendingTab = Array.from(root.querySelectorAll('[data-testid="status-filter"] button'))
      .find((b) => b.textContent?.startsWith('Pending')) as HTMLElement;
    expect(pendingTab?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders a table with 9 columns including an arrow column', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const headers = Array.from(root.querySelectorAll('thead th'))
      .map((h) => h.textContent?.trim());
    // 8 named columns + 1 empty (arrow)
    expect(headers.length).toBe(COLUMNS.length + 1);
    for (const col of COLUMNS) {
      expect(headers).toContain(col);
    }
  });

  it('opportunity detail row links use routerLink for in-app navigation (no full page reload)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    // Ref + Title columns both navigate to /opportunities/:ref
    // (the Submitter column links to /members/:name, which is a different route)
    const detailLinks = Array.from(root.querySelectorAll('tbody a[href*="/opportunities/"]')) as HTMLAnchorElement[];
    expect(detailLinks.length).toBeGreaterThan(0);
    for (const a of detailLinks) {
      const href = a.getAttribute('href') ?? '';
      // routerLink renders /opportunities/O-#### (matches the route we registered)
      expect(href).toMatch(/^\/opportunities\/[A-Z0-9-]+$/);
    }
  });

  it('table renders 8 rows by default (one page)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(8);
  });

  it('underlying dataset has 24 rows (3 pages of 8)', async () => {
    const fixture = await renderStandalone();
    const comp = fixture.componentInstance;
    expect(comp.all().length).toBe(24);
  });

  it('Est. ROI cells render with leading "+" and emerald color class', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const roiCells = root.querySelectorAll('tbody td .text-emerald-400');
    expect(roiCells.length).toBeGreaterThan(0);
    const text = Array.from(roiCells).some((c) => c.textContent?.startsWith('+'));
    expect(text).toBe(true);
  });

  it('Capital cells render with thousands separator (e.g. $8,200)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toMatch(/\$\d{1,3},\d{3}/);
  });

  it('Vote cells render "N↑ / N↓" with emerald/rose colors when votes exist', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const html = root.innerHTML;
    expect(html).toMatch(/class="text-emerald-400"[^>]*>\d+↑/);
    expect(html).toMatch(/class="text-rose-400"[^>]*>\d+↓/);
  });

  it('Vote cells render "—" when no votes yet', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('—');
  });

  it('Submitted-by cells show a circular avatar with initials', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const avatars = root.querySelectorAll('tbody td .avatar');
    expect(avatars.length).toBeGreaterThan(0);
    const first = avatars[0] as HTMLElement;
    expect(first.textContent?.trim().length).toBeGreaterThan(0);
    // gradient background
    const style = first.getAttribute('style') || '';
    expect(style).toMatch(/gradient/);
  });

  it('Category cells show a neutral badge (uppercase pill)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const catBadges = root.querySelectorAll('tbody td .badge-neutral, tbody td .badge');
    expect(catBadges.length).toBeGreaterThan(0);
  });

  it('Status cells show colored badges (warning/info/success/violet)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const statusBadges = root.querySelectorAll('tbody td .badge-warning, tbody td .badge-info, tbody td .badge-success, tbody td .badge-violet, tbody td .badge-danger');
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('Last column carries an arrow-right icon link to the detail page', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const html = root.innerHTML;
    expect(html).toMatch(/<i[^>]*data-lucide="arrow-right"|arrow-right/);
  });

  it('footer renders "Showing N of 24" + pagination "1 / 3"', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const footer = root.querySelector('[data-testid="pagination"]');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('Showing');
    expect(footer?.textContent).toContain('of 24');
    expect(footer?.textContent).toContain('1 / 3');
  });

  it('clicking the next-page button shows rows 9–16', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const next = root.querySelector('[data-page-next]') as HTMLButtonElement;
    expect(next).toBeTruthy();
    next.click();
    fixture.detectChanges();
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(8);
    // The first row should NOT be O-2051 anymore (now O-2058 or so)
    const firstRef = rows[0]?.querySelector('span.font-mono')?.textContent?.trim();
    expect(firstRef).not.toBe('O-2051');
  });

  it('clicking the prev-page button from page 2 returns to page 1', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const next = root.querySelector('[data-page-next]') as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    const prev = root.querySelector('[data-page-prev]') as HTMLButtonElement;
    prev.click();
    fixture.detectChanges();
    const rows = root.querySelectorAll('tbody tr');
    const firstRef = rows[0]?.querySelector('span.font-mono')?.textContent?.trim();
    expect(firstRef).toBe('O-2051');
  });

  it('clicking a non-default status tab filters the visible rows', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll('[data-testid="status-filter"] button');
    const vetting = Array.from(tabs).find((b) => b.textContent?.startsWith('In Vetting')) as HTMLButtonElement;
    expect(vetting).toBeTruthy();
    vetting.click();
    fixture.detectChanges();
    // All visible rows should have status=vetting
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const status = row.getAttribute('data-status');
      expect(status).toBe('vetting');
    }
  });

  // ─── format helpers (unit) ─────────────────────────────────────────────
  // Re-mount a fresh component so we have access to componentInstance for
  // method-level assertions.
  it('formatCapital() renders with thousands separator', async () => {
    const mockClient = {
      opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }] }).compileComponents();
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatCapital(8200)).toBe('$8,200');
    expect(c.formatCapital(22000)).toBe('$22,000');
    expect(c.formatCapital(900)).toBe('$900');
  });

  it('formatRoi() renders "+X.X%" with one decimal', async () => {
    const mockClient = {
      opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }] }).compileComponents();
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatRoi(34.2)).toBe('+34.2%');
    expect(c.formatRoi(9)).toBe('+9.0%');
  });

  it('categoryLabel() capitalizes the category slug', async () => {
    const mockClient = {
      opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }] }).compileComponents();
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.categoryLabel('apparel')).toBe('Apparel');
    expect(c.categoryLabel('collectibles')).toBe('Collectibles');
  });

  it('statusLabel() returns the wireframe label for each status', async () => {
    const mockClient = {
      opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }] }).compileComponents();
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.statusLabel('pending')).toBe('Pending');
    expect(c.statusLabel('vetting')).toBe('In Vetting');
    expect(c.statusLabel('approved')).toBe('Approved');
    expect(c.statusLabel('executing')).toBe('Executing');
    expect(c.statusLabel('rejected')).toBe('Rejected');
  });

  it('statusVariant() maps each status to a badge color variant', async () => {
    const mockClient = {
      opportunitiesList: vi.fn().mockResolvedValue({ opportunities: SEED_OPPORTUNITIES }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }] }).compileComponents();
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.statusVariant('pending')).toBe('info');
    expect(c.statusVariant('vetting')).toBe('warning');
    expect(c.statusVariant('approved')).toBe('success');
    expect(c.statusVariant('executing')).toBe('violet');
    expect(c.statusVariant('rejected')).toBe('danger');
  });

  it('the active status tab carries CSS class "active" (matches theme.css)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const allBtn = root.querySelector('[data-testid="status-filter"] button') as HTMLElement;
    expect(allBtn.classList.contains('active')).toBe(true);
  });
});
describe('toOpportunityViewModel (canonical row → view mapper)', () => {
  const rows = toOpportunityViewModel(SEED_OPPORTUNITIES);

  it('maps every canonical row without dropping refs (24 rows)', () => {
    expect(rows).toHaveLength(24);
    expect(rows.map((o) => o.ref)).toEqual(SEED_OPPORTUNITIES.map((r) => r.opportunity_id));
  });

  it('maps title / estRoi / capital from canonical financials', () => {
    const lego = rows.find((o) => o.ref === 'O-2051')!;
    expect(lego.title).toBe('Bulk Lego Set Resale');
    expect(lego.estRoi).toBe(34.2);
    expect(lego.capital).toBe(8200);
    const espresso = rows.find((o) => o.ref === 'O-1963')!;
    expect(espresso.estRoi).toBe(25.0);
    expect(espresso.capital).toBe(6800);
  });

  it('maps status: SUBMITTED→pending, VETTING→vetting, APPROVED→approved, EXECUTED→executing, REJECTED→rejected', () => {
    const byRef = (ref: string) => rows.find((o) => o.ref === ref)!.status;
    expect(byRef('O-2048')).toBe('pending');   // SUBMITTED
    expect(byRef('O-2051')).toBe('vetting');   // VETTING
    expect(byRef('O-2045')).toBe('approved');  // APPROVED
    expect(byRef('O-2037')).toBe('executing'); // EXECUTED
    expect(byRef('O-2031')).toBe('rejected');  // REJECTED
    // live status counts from the seeded rows (7/5/2/6/4 across the 5 statuses)
    expect(rows.filter((o) => o.status === 'pending').length).toBe(7);
    expect(rows.filter((o) => o.status === 'vetting').length).toBe(4);
    expect(rows.filter((o) => o.status === 'approved').length).toBe(5);
    expect(rows.filter((o) => o.status === 'executing').length).toBe(2);
    expect(rows.filter((o) => o.status === 'rejected').length).toBe(6);
  });

  it('maps votes from vetting_status; null when no vetting block (renders "—")', () => {
    const vetting = rows.find((o) => o.ref === 'O-2051')!;
    expect(vetting.votesUp).toBe(4);
    expect(vetting.votesDown).toBe(0);
    const pending = rows.find((o) => o.ref === 'O-2048')!;
    expect(pending.votesUp).toBeNull();
    expect(pending.votesDown).toBeNull();
  });

  it('maps submitter name from submitted_by.display_name + initials/gradient', () => {
    const o = rows.find((r) => r.ref === 'O-2051')!;
    expect(o.submitter.name).toBe('Sarah Park');
    expect(o.submitter.initials).toBe('SP');
    expect(o.submitter.gradient).toContain('gradient-copper');
  });

  it('supplies the wireframe-only subtitle and product category from presentation', () => {
    const o = rows.find((r) => r.ref === 'O-2045')!;
    expect(o.subtitle).toBe('First pressings · 320 records');
    expect(o.category).toBe('collectibles');
  });
});

describe('OpportunitiesPage pagination slicing (from live rows)', () => {
  it('slices 24 rows into 3 pages of 8 (All tab)', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    expect(c.all().length).toBe(24);
    expect(c.totalPages()).toBe(3);
    expect(c.pagedRows()).toHaveLength(8);
    expect(c.pagedRows().map((o) => o.ref)[0]).toBe('O-2051');
  });

  it('page 2 starts at the 9th canonical row', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.page.set(2);
    fixture.detectChanges();
    const refs = c.pagedRows().map((o) => o.ref);
    expect(refs).toHaveLength(8);
    expect(refs[0]).toBe('O-2031');
  });
});
