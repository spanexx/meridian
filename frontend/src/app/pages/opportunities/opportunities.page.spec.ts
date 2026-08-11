/**
 * Unit tests for OpportunitiesPageComponent.
 *
 * TDD RED phase: written first, designed to fail because the component
 * does not yet exist. When the component is implemented, these tests
 * pin the minimum behavior the page must expose.
 *
 * Behavior pins:
 *   1. Renders a top-level <h1> with the visible title "Opportunities".
 *   2. Renders category filter buttons: All categories + the 5 product
 *      categories (Apparel, Collectibles, Electronics, Equipment,
 *      Furniture).
 *   3. Renders status filter buttons: All + Pending + In Vetting +
 *      Approved + Executing + Rejected.
 *   4. Renders a <table> with columns Ref / Title / Category / Submitted
 *      by / Est. ROI / Capital / Votes / Status.
 *   5. Default selection is the first button in each filter; that
 *      button carries aria-pressed=true.
 *   6. Clicking a non-default category pill sets its aria-pressed to
 *      true and the previously-selected one's to false.
 *   7. Clicking a non-default status pill filters the visible table
 *      rows so the Status column matches the chosen pill.
 *   8. Clicking the "All" status pill restores the full set.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { OpportunitiesPageComponent } from './opportunities.page';

/**
 * Mount the component inside a TestBed that provides the bare minimum
 * of Angular's runtime services.
 */
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

/**
 * Find a button whose first text node exactly equals `label`. Buttons in
 * the status row have a trailing count span — we ignore that by walking
 * only the direct text nodes (not the descendants).
 */
function findPill(buttons: HTMLButtonElement[], label: string): HTMLButtonElement | undefined {
  return buttons.find((b) => {
    // Concat the text of all direct child text nodes only.
    let directText = '';
    for (const node of Array.from(b.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) directText += node.textContent;
    }
    return directText.trim() === label;
  });
}

describe('OpportunitiesPage', () => {
  it('renders the page title "Opportunities"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Opportunities');
  });

  it('renders every category filter pill', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const catSection = root.querySelector('[data-testid="category-filter"]')!;
    const buttons = Array.from(catSection.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.length).toBe(CATEGORIES.length);
    for (const cat of CATEGORIES) {
      expect(findPill(buttons, cat)).toBeTruthy();
    }
  });

  it('renders every status filter pill', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const statSection = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(statSection.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.length).toBe(STATUSES.length);
    for (const status of STATUSES) {
      expect(findPill(buttons, status)).toBeTruthy();
    }
  });

  it('renders a table whose columns match the wireframe spec', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const ths = Array.from(root.querySelectorAll('thead th'));
    const headers = ths.map((t) => t.textContent?.trim() ?? '');
    expect(headers).toEqual(COLUMNS);
  });

  it('marks the active category pill with aria-pressed=true on first paint', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const catSection = root.querySelector('[data-testid="category-filter"]')!;
    const allPill = findPill(
      Array.from(catSection.querySelectorAll('button')) as HTMLButtonElement[],
      'All categories',
    )!;
    expect(allPill.getAttribute('aria-pressed')).toBe('true');
  });

  it('moves aria-pressed when a different category pill is clicked', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const catSection = root.querySelector('[data-testid="category-filter"]')!;
    const buttons = Array.from(catSection.querySelectorAll('button')) as HTMLButtonElement[];
    const apparel = findPill(buttons, 'Apparel');
    expect(apparel).toBeTruthy();
    apparel!.click();
    fixture.detectChanges();
    expect(apparel!.getAttribute('aria-pressed')).toBe('true');
    const all = findPill(buttons, 'All categories')!;
    expect(all.getAttribute('aria-pressed')).toBe('false');
  });

  it('filters table rows by the selected status pill', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const statSection = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(statSection.querySelectorAll('button')) as HTMLButtonElement[];
    const pending = findPill(buttons, 'Pending')!;
    expect(pending).toBeTruthy();
    pending.click();
    fixture.detectChanges();
    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const cells = r.querySelectorAll('td');
      expect(cells[cells.length - 1]?.textContent?.trim()).toBe('Pending');
    }
  });

  it('shows every row when the "All" status pill is selected', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const statSection = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(statSection.querySelectorAll('button')) as HTMLButtonElement[];
    const pending = findPill(buttons, 'Pending')!;
    pending.click();
    fixture.detectChanges();
    const pendingCount = root.querySelectorAll('tbody tr').length;
    const all = findPill(buttons, 'All')!;
    all.click();
    fixture.detectChanges();
    const allCount = root.querySelectorAll('tbody tr').length;
    expect(allCount).toBeGreaterThanOrEqual(pendingCount);
  });

  it('registers a route at /opportunities in the app router', async () => {
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path.startsWith('opportunities'),
    );
    expect(match).toBeTruthy();
  });

  it('countByStatus returns the demo dataset tally per status', async () => {
    const fixture = await renderStandalone();
    const comp = fixture.componentInstance as OpportunitiesPageComponent;
    // The demo dataset contains 3 Pending, 2 In Vetting, 2 Approved,
    // 1 Executing, 2 Rejected entries.
    expect(comp.countByStatus('Pending')).toBe(3);
    expect(comp.countByStatus('In Vetting')).toBe(2);
    expect(comp.countByStatus('Approved')).toBe(2);
    expect(comp.countByStatus('Executing')).toBe(1);
    expect(comp.countByStatus('Rejected')).toBe(2);
    expect(comp.countByStatus('NonExistent')).toBe(0);
  });
});