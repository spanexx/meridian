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
import type { OpportunitiesPageComponent } from './opportunities.page';

async function renderStandalone(): Promise<ComponentFixture<OpportunitiesPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
  const fixture = TestBed.createComponent(Comp);
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

  it('default status tab is "All" with aria-selected=true', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const allBtn = Array.from(root.querySelectorAll('[data-testid="status-filter"] button'))
      .find((b) => b.textContent?.startsWith('All')) as HTMLElement | undefined;
    expect(allBtn?.getAttribute('aria-selected')).toBe('true');
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

  it('table renders 8 rows by default (one page)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');
    expect(rows.length).toBe(8);
  });

  it('underlying dataset has 24 rows (3 pages of 8)', async () => {
    const fixture = await renderStandalone();
    const comp = fixture.componentInstance;
    expect(comp.all.length).toBe(24);
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
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatCapital(8200)).toBe('$8,200');
    expect(c.formatCapital(22000)).toBe('$22,000');
    expect(c.formatCapital(900)).toBe('$900');
  });

  it('formatRoi() renders "+X.X%" with one decimal', async () => {
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatRoi(34.2)).toBe('+34.2%');
    expect(c.formatRoi(9)).toBe('+9.0%');
  });

  it('categoryLabel() capitalizes the category slug', async () => {
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.categoryLabel('apparel')).toBe('Apparel');
    expect(c.categoryLabel('collectibles')).toBe('Collectibles');
  });

  it('statusLabel() returns the wireframe label for each status', async () => {
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
    const { OpportunitiesPageComponent: Comp } = await import('./opportunities.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.statusVariant('pending')).toBe('info');
    expect(c.statusVariant('vetting')).toBe('warning');
    expect(c.statusVariant('approved')).toBe('success');
    expect(c.statusVariant('executing')).toBe('violet');
    expect(c.statusVariant('rejected')).toBe('danger');
  });
});
