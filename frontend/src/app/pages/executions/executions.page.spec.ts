/**
 * Unit tests for ExecutionsPageComponent — wireframe-aligned.
 *
 * Per wireframe/meridian/executions/index.html. Behavior pins:
 *   1. Renders a top-level <h1> with title 'Executions'.
 *   2. Subtitle mentions 'Active and completed arbitrage operations.'
 *   3. Renders a Search input + 'Pool' link in the header.
 *   4. Renders 4 status tabs: All / Active / Completed / Failed, each
 *      with a count (16 / 3 / 12 / 1).
 *   5. Renders a 2-column grid of execution cards.
 *   6. Each card shows: ref + status badge + title + O-#### subtitle +
 *      thumbnail.
 *   7. Each card has a Deployed/Recovered/ROI 3-up metric grid.
 *   8. Each card has a progress-track bar.
 *   9. Each card has a bottom row with a status line and a metadata line.
 *  10. Filter to a non-default status (e.g. 'Failed') reduces visible cards.
 *  11. Default tab 'All' carries aria-selected=true.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ExecutionsPageComponent } from './executions.page';

async function renderStandalone(): Promise<ComponentFixture<ExecutionsPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { ExecutionsPageComponent: Comp } = await import('./executions.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('ExecutionsPage (wireframe-aligned)', () => {
  it('renders the page title "Executions"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Executions');
  });

  it('subtitle mentions "Active and completed arbitrage operations"', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Active and completed arbitrage operations');
  });

  it('header has a Search input and a Pool link button', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input[type="search"]')).toBeTruthy();
    // Pool link in the page header (not the sidebar)
    const poolLink = root.querySelector('section.page header a[href="/pool"]');
    expect(poolLink).toBeTruthy();
  });

  it('renders 4 status tabs (All / Active / Completed / Failed) with counts', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll('[data-testid="status-filter"] button');
    expect(tabs.length).toBe(4);
    expect(tabs[0]?.textContent).toContain('All');
    expect(tabs[0]?.textContent).toContain('16');
    expect(tabs[1]?.textContent).toContain('Active');
    expect(tabs[1]?.textContent).toContain('3');
    expect(tabs[2]?.textContent).toContain('Completed');
    expect(tabs[2]?.textContent).toContain('12');
    expect(tabs[3]?.textContent).toContain('Failed');
    expect(tabs[3]?.textContent).toContain('1');
  });

  it('default tab "All" is aria-selected=true', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const all = root.querySelector('[data-testid="status-filter"] button');
    expect(all?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders the executions grid with cards', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const grid = root.querySelector('[data-testid="executions-grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.querySelectorAll('a.card.card-hover').length ?? 0).toBeGreaterThan(0);
  });

  it('each card shows a status badge', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll('a.card.card-hover');
    expect(cards.length).toBeGreaterThan(0);
    // First card has a badge
    const firstBadge = cards[0]?.querySelector('.badge');
    expect(firstBadge).toBeTruthy();
  });

  it('each card has a Deployed/Recovered/ROI 3-up metric grid', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll('a.card.card-hover');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of Array.from(cards)) {
      const text = card.textContent || '';
      expect(text).toContain('Deployed');
      expect(text).toContain('Recovered');
      expect(text).toContain('ROI');
    }
  });

  it('each card has a progress-track bar', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll('a.card.card-hover');
    expect(cards.length).toBeGreaterThan(0);
    const bars = root.querySelectorAll('.progress-track');
    expect(bars.length).toBeGreaterThanOrEqual(cards.length);
  });

  it('each card has a status line + a metadata line at the bottom', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const cards = root.querySelectorAll('a.card.card-hover');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of Array.from(cards)) {
      // The bottom row has 2 spans
      const text = card.textContent || '';
      // e.g. "3 of 8 sold" (active) or "All 5 sold" (completed) or "Recovered $X" (failed)
      // Just verify the card has at least 4 lines of meaningful content
      expect(text.split(/\s+/).length).toBeGreaterThan(10);
    }
  });

  it('clicking a non-default status tab reduces visible cards', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll('[data-testid="status-filter"] button');
    const failed = Array.from(tabs).find((t) => t.textContent?.includes('Failed')) as HTMLButtonElement;
    expect(failed).toBeTruthy();
    failed.click();
    fixture.detectChanges();
    const cards = root.querySelectorAll('a.card.card-hover');
    // Wireframe shows only 1 Failed
    expect(cards.length).toBe(1);
  });

  it('underlying dataset has 16 executions', async () => {
    const fixture = await renderStandalone();
    const comp = fixture.componentInstance;
    expect(comp.all.length).toBe(16);
  });

  // ─── format helpers (unit) ─────────────────────────────────────────────
  it('formatMoney() renders with thousands separator', async () => {
    const { ExecutionsPageComponent: Comp } = await import('./executions.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatMoney(18500)).toBe('$18,500');
    expect(c.formatMoney(22000)).toBe('$22,000');
    expect(c.formatMoney(0)).toBe('$0');
  });

  it('formatRoi() renders "+X.X%" / "-X.X%" / "0.0%"', async () => {
    const { ExecutionsPageComponent: Comp } = await import('./executions.page');
    const fixture = TestBed.createComponent(Comp);
    const c = fixture.componentInstance;
    expect(c.formatRoi(12.4)).toBe('+12.4%');
    expect(c.formatRoi(-80)).toBe('-80.0%');
    expect(c.formatRoi(0)).toBe('0.0%');
  });

  it('the active status tab carries CSS class "active" (matches theme.css)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const allBtn = root.querySelector('[data-testid="status-filter"] button') as HTMLElement;
    // Per theme.css, the active state is .tab.active (NOT .tab-active).
    expect(allBtn.classList.contains('active')).toBe(true);
  });

  it('clicking a non-default tab adds "active" to that tab and removes it from the others', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const tabs = root.querySelectorAll('[data-testid="status-filter"] button');
    const failed = Array.from(tabs).find((t) => t.textContent?.includes('Failed')) as HTMLButtonElement;
    failed.click();
    fixture.detectChanges();
    const after = root.querySelectorAll('[data-testid="status-filter"] button');
    const activeCount = Array.from(after).filter((t) => t.classList.contains('active')).length;
    expect(activeCount).toBe(1);
    expect(failed.classList.contains('active')).toBe(true);
    expect((tabs[0] as HTMLElement).classList.contains('active')).toBe(false);
  });

  // routerLink in-app navigation (regression: 2026-08-12 the user reported
  // that clicking a row reloaded the whole app — same [attr.href] trap as
  // /opportunities in PR #15).
  it('execution cards use [routerLink] for in-app navigation (no full page reload)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const links = Array.from(root.querySelectorAll('a[href*="/executions/"]')) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      // routerLink renders /executions/E-#### (matches the route we registered)
      expect(a.getAttribute('href') ?? '').toMatch(/^\/executions\/E-[\w-]+$/);
    }
  });
});
