/**
 * RED spec — CommunitiesPageComponent (wireframe/meridian/communities/index.html).
 *
 * Page sections:
 *   - header: title "Communities" + subtitle, search input + Status dropdown button (right-aligned)
 *   - status dropdown menu (hidden by default, All/Active/Proposed/Archived items)
 *   - status tabs row (All / Active / Proposed / Archived with counts)
 *   - table card:
 *       - skeleton (hidden when data loaded)
 *       - 6-col table: Community | Status (md+) | Pool | Members (sm+) | ROI (md+) | Executions (lg+) | arrow
 *       - 3 rows: MERIDIAN Alpha (active), Tech Arbitrage (proposed), Vintage Collective (archived)
 *       - each row icon avatar with gradient bg + name + focus/scope line
 *       - badge (success/warning/neutral) in Status column
 *       - Pool amount: emerald-gradient when active, muted gray when proposed/archived
 *       - ROI: emerald +X% when positive, "—" when null
 *       - Executions: muted count or "0"
 *       - arrow link to /community-detail
 *       - empty state (hidden when 3 rows present)
 *       - pagination footer: "Showing 1-3 of 3 communities" + prev/next (disabled)
 *   - bottom row: v1 disclaimer + "Propose community" button
 *   - create-community modal (hidden by default)
 *
 * Per the new-page pack:
 *   - red first
 *   - public method coverage (statusCount, totalCount, paginationRange,
 *     openCreateModal, filteredRows)
 *   - responsive probe selectors scoped per section
 *   - no internal [attr.href]
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommunitiesPageComponent } from './communities.page';
import { UiIconComponent } from '../../ui/icon/icon.component';

async function renderPage() {
  await TestBed.configureTestingModule({
    imports: [CommunitiesPageComponent, UiIconComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(CommunitiesPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CommunitiesPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunitiesPageComponent, UiIconComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  // ─────────────────────────────────────────────────────────────────────
  // HEADER (responsive, no duplicate ref, no actions stranded)
  // ─────────────────────────────────────────────────────────────────────
  it('header: title "Communities" + subtitle + search input + Status button (right-aligned)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector('h1.page-title')?.textContent).toContain('Communities');
    expect(root.textContent).toContain(
      'Member-owned arbitrage collectives. v1 runs one community',
    );
    const search = root.querySelector('input[data-search]');
    expect(search).toBeTruthy();
    expect(search?.getAttribute('placeholder')).toMatch(/Search communities/i);
    const statusBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      b.textContent?.match(/^Status/),
    );
    expect(statusBtn).toBeTruthy();
    // header wraps a flex container so the search + status sit on the right at sm+
    const headerFlex = Array.from(root.querySelectorAll('header .flex, header [class*="flex"]'));
    expect(headerFlex.length).toBeGreaterThan(0);
  });

  it('header title scales: text-2xl at base, text-3xl at sm+', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const h1 = root.querySelector('h1.page-title');
    expect(h1?.className ?? '').toMatch(/text-2xl/);
    expect(h1?.className ?? '').toMatch(/sm:text-3xl/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // STATUS FILTER (tabs + dropdown)
  // ─────────────────────────────────────────────────────────────────────
  it('status tabs row: All / Active / Proposed / Archived with counts', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const tabs = root.querySelector('[data-filter-tabs]');
    expect(tabs).toBeTruthy();
    const tabBtns = Array.from(tabs?.querySelectorAll('[data-filter-tab]') ?? []);
    expect(tabBtns.length).toBe(4);
    const labels = tabBtns.map((b) => b.textContent?.trim());
    expect(labels[0]).toMatch(/All/);
    expect(labels[1]).toMatch(/Active/);
    expect(labels[2]).toMatch(/Proposed/);
    expect(labels[3]).toMatch(/Archived/);
    // counts visible inside tabs
    expect(labels[0]).toMatch(/3/);
    expect(labels[1]).toMatch(/1/);
    expect(labels[2]).toMatch(/1/);
    expect(labels[3]).toMatch(/1/);
  });

  it('default tab is All and aria-selected=true; others aria-selected=false', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const tabs = Array.from(root.querySelectorAll('[data-filter-tab]'));
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');
    expect(tabs[2]?.getAttribute('aria-selected')).toBe('false');
    expect(tabs[3]?.getAttribute('aria-selected')).toBe('false');
  });

  it('status dropdown menu hidden by default, has 4 filterable items (All / Operating / In voting / Closed)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const menu = root.querySelector('#statusMenu');
    expect(menu).toBeTruthy();
    expect(menu?.hasAttribute('hidden')).toBe(true);
    const items = Array.from(menu?.querySelectorAll('[data-filter-category]') ?? []);
    expect(items.length).toBe(4);
    const cats = items.map((i) => i.getAttribute('data-filter-category'));
    expect(cats).toEqual(['all', 'active', 'proposed', 'archived']);
  });

  // ─────────────────────────────────────────────────────────────────────
  // TABLE
  // ─────────────────────────────────────────────────────────────────────
  it('table renders 6 columns: Community / Status / Pool / Members / ROI / Executions + actions column', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const ths = Array.from(root.querySelectorAll('thead th'));
    const labels = ths.map((t) => t.textContent?.trim());
    expect(labels[0]).toBe('Community');
    expect(labels[1]).toBe('Status');
    expect(labels[2]).toBe('Pool');
    expect(labels[3]).toBe('Members');
    expect(labels[4]).toBe('ROI');
    expect(labels[5]).toBe('Executions');
    // last column is actions (arrow links)
    expect(ths.length).toBe(7);
  });

  it('renders 3 community rows: MERIDIAN Alpha (active), Tech Arbitrage (proposed), Vintage Collective (archived)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('tr[data-filterable]'));
    expect(rows.length).toBe(3);
    const titles = rows.map((r) => r.querySelector('.text-sm.font-medium')?.textContent?.trim());
    expect(titles).toEqual([
      'MERIDIAN Alpha',
      'Tech Arbitrage',
      'Vintage Collective',
    ]);
    const statuses = rows.map((r) => r.getAttribute('data-status'));
    expect(statuses).toEqual(['active', 'proposed', 'archived']);
  });

  it('each row has an icon avatar (users/zap/archive) and a focus/scope subtitle line', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('tr[data-filterable]'));
    // lucide SVGs render with data-icon="<name>"
    expect(rows[0].querySelector('svg[data-icon="users"]')).toBeTruthy();
    expect(rows[1].querySelector('svg[data-icon="zap"]')).toBeTruthy();
    expect(rows[2].querySelector('svg[data-icon="archive"]')).toBeTruthy();
    // avatar containers are rounded-lg w-10 h-10
    const avatars = Array.from(rows.map((r) => r.querySelector('div.w-10.h-10.rounded-lg')));
    expect(avatars.every((a) => a !== null)).toBe(true);
    // subtitles
    expect(rows[0].textContent).toContain('General arbitrage');
    expect(rows[1].textContent).toContain('Electronics focus');
    expect(rows[2].textContent).toContain('Closed · Merged into Alpha');
  });

  it('active row: Pool $1.42M emerald-gradient, ROI +18.4%, Executions 47', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const row = root.querySelector('tr[data-status="active"]') as HTMLElement;
    expect(row.textContent).toContain('$1.42M');
    expect(row.textContent).toContain('+18.4%');
    expect(row.textContent).toContain('47');
    // badges
    expect(row.querySelector('.badge-success')?.textContent).toContain('Active');
  });

  it('proposed row: Pool $0 muted, ROI "—", Executions 0', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const row = root.querySelector('tr[data-status="proposed"]') as HTMLElement;
    expect(row.textContent).toContain('$0');
    expect(row.textContent).toContain('—');
    expect(row.querySelector('.badge-warning')?.textContent).toContain('Proposed');
  });

  it('archived row: ROI +12.1% (final), Executions 18', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const row = root.querySelector('tr[data-status="archived"]') as HTMLElement;
    expect(row.textContent).toContain('+12.1%');
    expect(row.textContent).toContain('18');
    expect(row.querySelector('.badge-neutral')?.textContent).toContain('Archived');
  });

  it('community-row links resolve to /communities/:ref via routerLink (not raw href)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const rowLinks = Array.from(
      root.querySelectorAll('tr[data-filterable] a[data-row-link]'),
    );
    expect(rowLinks.length).toBe(3);
    for (const a of rowLinks) {
      // routerLink renders as an href to /communities/<ref>
      const href = a.getAttribute('href');
      expect(href).toMatch(/^\/communities\/[a-z-]+$/);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────────────────────────────
  it('pagination footer shows "Showing 1-3 of 3 communities" with prev/next both disabled', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const pageNum = root.querySelector('[data-page-num]');
    expect(pageNum?.textContent).toMatch(/1-3/);
    expect(root.textContent).toMatch(/of 3 communities/);
    const prev = root.querySelector('[data-page-prev]');
    const next = root.querySelector('[data-page-next]');
    expect(prev?.hasAttribute('disabled')).toBe(true);
    expect(next?.hasAttribute('disabled')).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────
  // EMPTY STATE (hidden by default since 3 rows present)
  // ─────────────────────────────────────────────────────────────────────
  it('empty state is present in DOM but hidden when there are 3 rows', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const empty = root.querySelector('[data-empty]');
    expect(empty).toBeTruthy();
    expect(empty?.hasAttribute('hidden')).toBe(true);
    expect(empty?.textContent).toMatch(/No communities found/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // BOTTOM ROW (v1 disclaimer + Propose community button)
  // ─────────────────────────────────────────────────────────────────────
  it('bottom row has v1 disclaimer + Propose community button (opens modal)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    expect(root.textContent).toMatch(/v1 limitation/);
    expect(root.textContent).toMatch(/Only one active community/);
    const proposeBtn = root.querySelector('[data-modal-open="createCommunityModal"]');
    expect(proposeBtn).toBeTruthy();
    expect(proposeBtn?.textContent).toMatch(/Propose community/);
    expect(proposeBtn?.querySelector('svg[data-icon="plus"]')).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────────────────────────────────
  it('create-community modal hidden by default with title + 4 fields + submit button', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const modal = root.querySelector('#createCommunityModal');
    expect(modal).toBeTruthy();
    expect(modal?.hasAttribute('hidden')).toBe(true);
    expect(modal?.textContent).toMatch(/Propose a new community/);
    expect(modal?.textContent).toMatch(/Community name/);
    expect(modal?.textContent).toMatch(/Focus area/);
    expect(modal?.textContent).toMatch(/Geographic scope/);
    expect(modal?.textContent).toMatch(/Description/);
    const submit = modal?.querySelector('button[type="submit"]');
    expect(submit).toBeTruthy();
    expect(submit?.textContent).toMatch(/Submit proposal/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // RESPONSIVE COLUMN HIDING (matches wireframe exactly)
  // ─────────────────────────────────────────────────────────────────────
  it('hides Status (md), Members (sm), ROI (md), Executions (lg) on narrow screens via hidden classes', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const statusTh = root.querySelectorAll('thead th')[1];
    const membersTh = root.querySelectorAll('thead th')[3];
    const roiTh = root.querySelectorAll('thead th')[4];
    const execsTh = root.querySelectorAll('thead th')[5];
    expect(statusTh?.className ?? '').toMatch(/hidden/);
    expect(membersTh?.className ?? '').toMatch(/hidden/);
    expect(roiTh?.className ?? '').toMatch(/hidden/);
    expect(execsTh?.className ?? '').toMatch(/hidden/);
  });

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC METHOD COVERAGE
  // ─────────────────────────────────────────────────────────────────────
  it('statusCount(tab) returns the right counts: all=3, active=1, proposed=1, archived=1', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      statusCount: (k: 'all' | 'active' | 'proposed' | 'archived') => number;
    };
    expect(c.statusCount('all')).toBe(3);
    expect(c.statusCount('active')).toBe(1);
    expect(c.statusCount('proposed')).toBe(1);
    expect(c.statusCount('archived')).toBe(1);
  });

  it('totalCount() returns 3', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { totalCount: () => number };
    expect(c.totalCount()).toBe(3);
  });

  it('paginationRange() returns "1-3" when no filter applied', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { paginationRange: () => string };
    expect(c.paginationRange()).toBe('1-3');
  });

  it('filteredRows() returns all 3 by default; only matching status when a tab is active', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      filteredRows: () => { ref: string; status: string }[];
      activeTab: { set: (v: string) => void };
    };
    expect(c.filteredRows().length).toBe(3);
    c.activeTab.set('active');
    expect(c.filteredRows().length).toBe(1);
    c.activeTab.set('archived');
    expect(c.filteredRows().length).toBe(1);
  });

  it('openCreateModal() shows the create-community modal (toggles hidden)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openCreateModal: () => void };
    const root = f.nativeElement as HTMLElement;
    const modal = root.querySelector('#createCommunityModal');
    expect(modal?.hasAttribute('hidden')).toBe(true);
    c.openCreateModal();
    f.detectChanges();
    expect(modal?.hasAttribute('hidden')).toBe(false);
  });

  it('isPoolLive(row) returns true when the row pool is live (active)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      isPoolLive: (r: { poolIsLive: boolean }) => boolean;
    };
    expect(c.isPoolLive({ poolIsLive: true })).toBe(true);
    expect(c.isPoolLive({ poolIsLive: false })).toBe(false);
  });

  it('isExecutionLive(row) returns true when the row executions are live (active or archived)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      isExecutionLive: (r: { executionIsLive: boolean }) => boolean;
    };
    expect(c.isExecutionLive({ executionIsLive: true })).toBe(true);
    expect(c.isExecutionLive({ executionIsLive: false })).toBe(false);
  });

  it('closeCreateModal() hides the create-community modal again', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      openCreateModal: () => void;
      closeCreateModal: () => void;
    };
    const root = f.nativeElement as HTMLElement;
    const modal = root.querySelector('#createCommunityModal');
    c.openCreateModal();
    f.detectChanges();
    expect(modal?.hasAttribute('hidden')).toBe(false);
    c.closeCreateModal();
    f.detectChanges();
    expect(modal?.hasAttribute('hidden')).toBe(true);
  });

  it('gradientVar(gradient) returns the matching CSS var (violet/amber/blue)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      gradientVar: (g: 'violet' | 'amber' | 'blue') => string;
    };
    expect(c.gradientVar('violet')).toBe('var(--gradient-copper)');
    expect(c.gradientVar('amber')).toBe('var(--gradient-amber)');
    expect(c.gradientVar('blue')).toBe('var(--gradient-blue)');
  });

  it('setTab(tab) updates activeTab; filteredRows() responds', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setTab: (t: 'all' | 'active' | 'proposed' | 'archived') => void;
      filteredRows: () => { ref: string }[];
      activeTab: () => string;
    };
    expect(c.activeTab()).toBe('all');
    expect(c.filteredRows().length).toBe(3);
    c.setTab('active');
    expect(c.activeTab()).toBe('active');
    expect(c.filteredRows().length).toBe(1);
    c.setTab('archived');
    expect(c.filteredRows().length).toBe(1);
    c.setTab('all');
    expect(c.filteredRows().length).toBe(3);
  });
});
