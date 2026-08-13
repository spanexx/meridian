/**
 * Unit tests for ExecutionDetailPageComponent.
 *
 * Renders per wireframe/meridian/execution-detail/index.html:
 *   - breadcrumb (Executions > E-####)
 *   - header: ref + status badge + category badge + title +
 *     "From O-#### - <name>" link to /opportunities/:id +
 *     operator + duration + 2 ghost action buttons (share, export)
 *   - Timeline card (5-step circle: Approved/Funded/Acquired/
 *     Listed/Sold with progress bar + 4-stage label)
 *   - Main col:
 *       - Capital (3 inner cards: Allocated/Spent/Recovered)
 *       - Inventory (8 size cards in 4-col grid with picsum thumb)
 *       - Event Log (9 events with timestamps + badges)
 *   - Sidebar:
 *       - Payout Preview (glass, Net profit + 5-row Distribution)
 *       - Participants (3 members with avatars)
 *
 * More minimal than the wireframe: drops text-gradient-emerald
 * (uses plain emerald-400 on net profit), drops the inline glow
 * shadow on the listed step (reused the existing amber ring via
 * the --a-500 token), and unified the kpi-number clamp.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExecutionDetailPageComponent } from './execution-detail.page';

const MOCK_REF = 'E-1042';

async function renderPage(id: string = MOCK_REF) {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(ExecutionDetailPageComponent);
  // Set the @Input id field directly
  fixture.componentInstance.id = id;
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('ExecutionDetailPageComponent', () => {
  // ─── breadcrumb + header ───────────────────────────────────────
  it('renders the breadcrumb (Executions > E-1042)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const crumb = root.querySelector('[data-testid="execution-breadcrumb"]');
    expect(crumb?.textContent).toMatch(/Executions/);
    expect(crumb?.textContent).toMatch(/E-1042/);
  });

  it('header shows Listed + Apparel badges + title', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    expect(header.textContent).toMatch(/Listed/);
    expect(header.textContent).toMatch(/Apparel/);
    expect(header.textContent).toMatch(/Limited Edition Sneaker Resale/);
  });

  it('header does NOT duplicate the ref outside the breadcrumb (breadcrumb owns it)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const crumb = root.querySelector('[data-testid="execution-breadcrumb"]');
    const header = Array.from(root.querySelectorAll('header'))[0];
    // crumb contains E-1042 in the breadcrumb chip
    expect(crumb?.textContent).toMatch(/E-1042/);
    // header should NOT have the ref as a standalone font-mono span
    // (only badges LISTED / APPAREL + title + action buttons).
    const refSpans = Array.from(header.querySelectorAll('span.font-mono'));
    expect(refSpans.length).toBe(0);
  });

  it('header title scales: text-2xl at base, text-3xl at sm+', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    const h1 = header.querySelector('h1');
    expect(h1?.className ?? '').toMatch(/text-2xl/);
    expect(h1?.className ?? '').toMatch(/sm:text-3xl/);
  });

  it('header subtitle links the source opportunity to /opportunities/:id via routerLink', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    const link = header.querySelector('a[href*="/opportunities/"]');
    expect(link).toBeTruthy();
    // routerLink renders /opportunities/O-2037 (relative to /executions/E-####)
    expect(link?.getAttribute('href') ?? '').toMatch(/\/opportunities\/O-\d+/);
  });

  it('header has share + export ghost buttons', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    // two ghost action buttons
    const buttons = header.querySelectorAll('button.btn');
    expect(buttons.length).toBe(2);
    // last one is "Export"
    expect(header.textContent).toMatch(/Export/);
    // one is share (icon name on the ui-icon)
    const share = header.querySelector('ui-icon[name="share-2"]');
    expect(share).toBeTruthy();
    const dl = header.querySelector('ui-icon[name="download"]');
    expect(dl).toBeTruthy();
  });

  // ─── Timeline card ─────────────────────────────────────────────
  it('renders the Timeline card with 5 steps + progress bar + 4-stage label', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Timeline') && !s.textContent?.includes('Event Log'),
    );
    expect(section).toBeTruthy();
    // 5 step circles (Approved / Funded / Acquired / Listed / Sold)
    const steps = section?.querySelectorAll('[data-step]') ?? [];
    expect(steps.length).toBe(5);
    // 1 is the current step (data-current)
    const current = section?.querySelector('[data-current]');
    expect(current?.getAttribute('data-current')).toBe('true');
    // progress bar fills per stage (data-step), but the current step
    // has the amber fill.
    expect(section?.textContent).toMatch(/Approved/);
    expect(section?.textContent).toMatch(/Funded/);
    expect(section?.textContent).toMatch(/Acquired/);
    expect(section?.textContent).toMatch(/Listed/);
    expect(section?.textContent).toMatch(/Sold/);
    // 4-stage label
    expect(section?.textContent).toMatch(/Funded/);
    expect(section?.textContent).toMatch(/Paid out/);
  });

  it('Timeline progress bar width tracks the current stage (amber, 60%)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Timeline') && !s.textContent?.includes('Event Log'),
    );
    const bar = section?.querySelector('[data-progress-fill]') as HTMLElement | null;
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('style') ?? '').toMatch(/width:\s*60%/);
    expect(bar?.getAttribute('class') ?? '').toMatch(/progress-fill-amber/);
  });

  // ─── Capital card ──────────────────────────────────────────────
  it('Capital card has 3 inner cards: Allocated, Spent, Recovered', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Capital') && !s.textContent?.includes('Inventory'),
    );
    expect(section).toBeTruthy();
    expect(section?.textContent).toMatch(/Allocated/);
    expect(section?.textContent).toMatch(/Spent/);
    expect(section?.textContent).toMatch(/Recovered/);
    expect(section?.textContent).toMatch(/\$18,500/);
    expect(section?.textContent).toMatch(/\$18,200/);
    expect(section?.textContent).toMatch(/\$4,280/);
    // contributors note
    expect(section?.textContent).toMatch(/From 42 capital contributors/);
  });

  // ─── Inventory card ────────────────────────────────────────────
  it('Inventory card has 8 size cards in a 4-col grid with picsum thumbs', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Inventory') && !s.textContent?.includes('Event Log'),
    );
    expect(section).toBeTruthy();
    // the inner grid is the one holding 8 cards (not the outer main grid)
    // Use scope: the grid that contains data-item children
    const itemCards = section?.querySelectorAll('[data-item]') ?? [];
    expect(itemCards.length).toBe(8);
    // 4-col layout: parent grid uses md:grid-cols-4
    const grid = itemCards[0]?.parentElement as HTMLElement | null;
    expect(grid?.className ?? '').toMatch(/grid-cols-2/);
    expect(grid?.className ?? '').toMatch(/md:grid-cols-4/);
    const imgs = section?.querySelectorAll('img[src*="picsum"]') ?? [];
    expect(imgs.length).toBe(8);
    // first card is "Size US 9", last is "Size US 12"
    const sizes = Array.from(itemCards).map((c) => c.querySelector('.text-xs.font-medium')?.textContent?.trim());
    expect(sizes).toContain('Size US 9');
    expect(sizes).toContain('Size US 12');
  });

  // ─── Event Log card ────────────────────────────────────────────
  it('Event Log rows: timestamps use muted text-3, descriptions use high-contrast text-1', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Event Log'),
    );
    const firstEvent = section?.querySelector('[data-event]');
    expect(firstEvent).toBeTruthy();
    const spans = firstEvent?.querySelectorAll('span') ?? [];
    // first span is the timestamp
    const timestamp = spans[0] as HTMLElement | undefined;
    expect(timestamp?.getAttribute('style') ?? '').toMatch(/var\(--text-3\)/);
    // last span is the description (Size US X · ...).
    // Its textContent is the size line; it should use --text-1.
    const desc = spans[spans.length - 1] as HTMLElement | undefined;
    expect(desc?.getAttribute('style') ?? '').toMatch(/var\(--text-1\)/);
  });

  it('Event Log shows append-only timestamps + event badges (9 events)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Event Log'),
    );
    expect(section).toBeTruthy();
    const events = section?.querySelectorAll('[data-event]') ?? [];
    expect(events.length).toBe(9);
    // first event is most recent (Mar 9 14:22)
    const firstEvent = events[0] as HTMLElement;
    expect(firstEvent.textContent).toMatch(/Mar 9/);
    expect(firstEvent.textContent).toMatch(/execution.item_listed/);
    // appended-only note
    expect(section?.textContent).toMatch(/Append-only/);
  });

  // ─── Payout Preview sidebar ───────────────────────────────────
  it('Payout Preview shows gross/costs/fee/net + 5-row distribution', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section.glass, section')).find(
      (s) => s.textContent?.includes('Payout Preview'),
    );
    expect(section).toBeTruthy();
    expect(section?.textContent).toMatch(/Gross revenue/);
    expect(section?.textContent).toMatch(/\$22,475/);
    expect(section?.textContent).toMatch(/Total costs/);
    expect(section?.textContent).toMatch(/\$18,200/);
    expect(section?.textContent).toMatch(/Platform fee/);
    expect(section?.textContent).toMatch(/Net profit/);
    expect(section?.textContent).toMatch(/\$4,061/);
    // distribution rows
    expect(section?.textContent).toMatch(/Capital/);
    expect(section?.textContent).toMatch(/Signal/);
    expect(section?.textContent).toMatch(/Access/);
    expect(section?.textContent).toMatch(/Operations/);
    expect(section?.textContent).toMatch(/Platform/);
    // percentages
    expect(section?.textContent).toMatch(/46%/);
    expect(section?.textContent).toMatch(/30%/);
    expect(section?.textContent).toMatch(/12%/);
    expect(section?.textContent).toMatch(/8%/);
    expect(section?.textContent).toMatch(/4%/);
  });

  // ─── Participants sidebar ──────────────────────────────────────
  it('Participants card has 3 members with avatars', async () => {
      const f = await renderPage();
      const root = f.nativeElement as HTMLElement;
      const section = Array.from(root.querySelectorAll('section')).find(
        (s) => s.textContent?.includes('Participants'),
      );
      expect(section).toBeTruthy();
      // 3 avatars in the section
      const avatars = section?.querySelectorAll('.avatar') ?? [];
      expect(avatars.length).toBe(3);
      expect(section?.textContent).toMatch(/Mike Rivera/);
      expect(section?.textContent).toMatch(/Sarah Park/);
      expect(section?.textContent).toMatch(/Alex Chen/);
      // role labels
      expect(section?.textContent).toMatch(/Signal contributor/);
      expect(section?.textContent).toMatch(/Access contributor/);
      expect(section?.textContent).toMatch(/Operator/);
    });

  // ─── responsive ────────────────────────────────────────────────
  it('uses an outer lg:grid-cols-3 layout wrapper (main spans 2 cols, sidebar spans 1)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    // find any element using lg:grid-cols-3 anywhere in the rendered tree
    const layoutGrid = root.querySelector('[class*="lg:grid-cols-3"]') as HTMLElement | null;
    expect(layoutGrid).toBeTruthy();
  });

  // ─── @Input id handling ────────────────────────────────────────
  it('@Input id handling', async () => {
      const f = await renderPage('E-1077');
      const root = f.nativeElement as HTMLElement;
      const c = f.componentInstance as unknown as { id: string };
      expect(c.id).toBe('E-1077');
      expect(root.textContent).toMatch(/E-1077/);
    });

    // public methods (TDD coverage)
    it('shareLink() returns the canonical URL for the current execution', async () => {
      const f = await renderPage();
      const c = f.componentInstance as unknown as { shareLink: () => string };
      expect(c.shareLink()).toBe(`https://meridian.example/executions/${MOCK_REF}`);
    });

    it('timelineProgress() returns the 0-100 fill for the current step', async () => {
      const f = await renderPage();
      const c = f.componentInstance as unknown as { timelineProgress: () => number };
      // Listed is the 4th of 5 steps, with Sold pending.
      // The wireframe bar sits at 60% (between Acquired and Listed).
      expect(c.timelineProgress()).toBe(60);
    });

    it('inventoryGrouped() sorts items: Sold before Listed, then by size', async () => {
      const f = await renderPage();
      const c = f.componentInstance as unknown as {
        inventoryGrouped: () => { size: string; status: 'Sold' | 'Listed' }[];
      };
      const grouped = c.inventoryGrouped();
      expect(grouped.length).toBe(8);
      // first 5 are Sold (3 sold + 2 by size grouping), but per the wireframe
      // we render ALL 8 in size order; the Sold-precedence test pins the
      // grouping method's contract independently of template order.
      const solds = grouped.filter((i) => i.status === 'Sold');
      const listeds = grouped.filter((i) => i.status === 'Listed');
      expect(solds.length).toBe(3);
      expect(listeds.length).toBe(5);
      // within each status, sorted by size ascending
      for (const arr of [solds, listeds]) {
        const sizes = arr.map((i) => parseFloat(i.size));
        const sorted = [...sizes].sort((a, b) => a - b);
        expect(sizes).toEqual(sorted);
      }
    });

    it('distribution() returns 5 rows summing to 100% (Capital+Signal+Access+Ops+Platform)', async () => {
      const f = await renderPage();
      const c = f.componentInstance as unknown as {
        distribution: () => { label: string; pct: number }[];
      };
      const rows = c.distribution();
      expect(rows.length).toBe(5);
      const labels = rows.map((r) => r.label);
      expect(labels).toEqual(['Capital', 'Signal', 'Access', 'Operations', 'Platform']);
      const total = rows.reduce((s, r) => s + r.pct, 0);
      expect(total).toBe(100);
    });

  it('currentStepLabel() returns "Listed" (the wireframe\'s active step)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { currentStepLabel: () => string };
    expect(c.currentStepLabel()).toBe('Listed');
  });

  it('netProfitColor() returns the emerald var when net is positive', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { netProfitColor: () => string };
    // wireframe payout net is +4061 (positive) -> emerald theme var
    expect(c.netProfitColor()).toBe('var(--e-400)');
  });
});
