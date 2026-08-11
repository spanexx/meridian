/**
 * Unit tests for ExecutionsPageComponent.
 *
 * TDD RED: written before implementation. The page renders a status-
 * filterable list of in-flight and completed arbitrage executions,
 * one card per execution (not a table).
 *
 * Behavior pins:
 *   1. Renders a top-level <h1> with the visible title "Executions".
 *   2. Renders a status filter with All / Active / Completed / Failed
 *      buttons; counts ("All 16", "Active 3", etc.) appear in a
 *      trailing span similar to opportunities.
 *   3. Renders one execution card per known execution in the demo
 *      data, each card carrying the ref (E-####) and a primary title.
 *   4. Each card links to /execution-detail/<ref-id> (so E-1042 → /execution-detail/E-1042).
 *   5. The first card's status pill is the default selection ("All");
 *      the All button is initially aria-pressed=true.
 *   6. Clicking a non-default status pill moves aria-pressed to it
 *      and filters visible cards to that status only.
 *   7. Each card has a status badge using UiBadgeComponent (class
 *      `badge-<variant>` matching `active`/`completed`/`failed` → the
 *      theme.css badge-warning / badge-success / badge-error slots).
 *   8. The component is registered on the /executions route in
 *      app.routes.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ExecutionsPageComponent } from './executions.page';

const STATUSES = ['All', 'Active', 'Completed', 'Failed'];

interface CardRef {
  ref: string;
  title: string;
  href: string;
  status: 'active' | 'completed' | 'failed' | string;
}

async function renderStandalone(): Promise<ComponentFixture<ExecutionsPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { ExecutionsPageComponent: Comp } = await import('./executions.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

/**
 * Returns only the direct text nodes of a button (skips spans etc.),
 * so a button rendered as "Active (3)" still matches "Active".
 */
function findButtonByLabel(
  buttons: HTMLButtonElement[],
  label: string,
): HTMLButtonElement | undefined {
  return buttons.find((b) => {
    let direct = '';
    for (const node of Array.from(b.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) direct += node.textContent;
    }
    return direct.trim() === label;
  });
}

function cardsIn(root: HTMLElement): CardRef[] {
  const anchors = Array.from(root.querySelectorAll('a')) as HTMLAnchorElement[];
  const out: CardRef[] = [];
  for (const a of anchors) {
    const ref = a.querySelector('.font-mono')?.textContent?.trim() ?? '';
    const title = a.querySelector('.text-base')?.textContent?.trim() ?? '';
    const statusAttr = a.getAttribute('data-status') ?? '';
    if (ref) out.push({ ref, title, href: a.getAttribute('href') ?? '', status: statusAttr });
  }
  return out;
}

describe('ExecutionsPage', () => {
  it('renders the page title "Executions"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Executions');
  });

  it('renders every status filter pill', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const section = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(section.querySelectorAll('button')) as HTMLButtonElement[];
    for (const status of STATUSES) {
      expect(findButtonByLabel(buttons, status)).toBeTruthy();
    }
  });

  it('marks the default "All" pill aria-pressed=true on first paint', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const section = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(section.querySelectorAll('button')) as HTMLButtonElement[];
    const all = findButtonByLabel(buttons, 'All')!;
    expect(all).toBeTruthy();
    expect(all.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders at least one execution card', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const list = cardsIn(root);
    expect(list.length).toBeGreaterThan(0);
    for (const c of list) {
      expect(c.ref).toMatch(/^E-\d{3,}$/);
      expect(c.title.length).toBeGreaterThan(0);
    }
  });

  it('each card links to /execution-detail/<ref-id>', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const list = cardsIn(root);
    for (const c of list) {
      expect(c.href).toBe(`/execution-detail/${c.ref}`);
    }
  });

  it('clicking a status pill moves aria-pressed and filters visible cards', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const section = root.querySelector('[data-testid="status-filter"]')!;
    const buttons = Array.from(section.querySelectorAll('button')) as HTMLButtonElement[];
    const active = findButtonByLabel(buttons, 'Active')!;
    active.click();
    fixture.detectChanges();
    expect(active.getAttribute('aria-pressed')).toBe('true');
    const all = findButtonByLabel(buttons, 'All')!;
    expect(all.getAttribute('aria-pressed')).toBe('false');
    // After filtering, every visible card must carry data-status="active".
    const visible = cardsIn(root);
    expect(visible.length).toBeGreaterThan(0);
    for (const c of visible) {
      expect(c.status).toBe('active');
    }
  });

  it('every card carries a UiBadge status pill (badge-* class)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const anchors = Array.from(root.querySelectorAll('a')) as HTMLAnchorElement[];
    for (const a of anchors) {
      const badge = a.querySelector('.badge');
      expect(badge).toBeTruthy();
      // Must carry a variant class (badge-success / badge-warning / badge-error etc.)
      const cls = badge!.className;
      expect(cls.split(/\s+/).some((c) => c.startsWith('badge-'))).toBe(true);
    }
  });

  it('registers a route at /executions in the app router', async () => {
    const { routes } = await import('../../app.routes');
    const match = routes.find(
      (r) => typeof r.path === 'string' && r.path.startsWith('executions'),
    );
    expect(match).toBeTruthy();
  });

  it('countByStatus returns the demo dataset tally per status', async () => {
    const fixture = await renderStandalone();
    const comp = fixture.componentInstance as ExecutionsPageComponent;
    // Demo dataset: 16 total · 3 active · 12 completed · 1 failed.
    expect(comp.countByStatus('Active')).toBe(3);
    expect(comp.countByStatus('Completed')).toBe(12);
    expect(comp.countByStatus('Failed')).toBe(1);
    expect(comp.countByStatus('All')).toBe(16);
  });
});
