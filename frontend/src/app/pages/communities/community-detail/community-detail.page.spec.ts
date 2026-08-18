/**
 * RED spec — CommunityDetailPageComponent (wireframe/meridian/community-detail/index.html).
 *
 * Page sections:
 *   - breadcrumb: Communities › <community name>
 *   - header: 16x16 violet gradient avatar + users icon,
 *     title + Active/Proposed/Archived badge inline,
 *     subtitle (focus · scope · Founded YEAR),
 *     3 metadata chips (map-pin / calendar / hash) at small,
 *     share + actions (more-horizontal) buttons floating right
 *   - actions dropdown menu (hidden by default): View governance /
 *     View members / Community settings / Report issue (danger)
 *   - 4 KPI cards (1-col md:2 lg:4): Total Pool / Members /
 *     ROI (YTD) / Executions, each with kpi-label + kpi-number +
 *     delta subline + icon
 *   - main col (lg:col-span-2):
 *       - Community-Governed Parameters card: 4 parameter rows
 *         (ROI floor, Win-rate target, Distribution shares,
 *         Reserve ratio), each with icon avatar + label +
 *         description + value + "last updated" line
 *       - Recent Executions card: 2 execution rows, each with
 *         icon avatar + ref+title + status line, ROI amount +
 *         deployed amount, progress bar + status pill
 *   - sidebar:
 *       - About: paragraph + 4 fact rows (Focus / Region /
 *         Founded / Min contribution)
 *       - Member Composition: 3 progress bars (Capital 42 34% /
 *         Signal 67 54% / Access 15 12%) + "View all members" CTA
 *       - Safety Rails: 4 check-circle items + "Never community-
 *         governed. Fixed by design." subhead
 *
 * Per new-page pack:
 *   - red first
 *   - public method coverage
 *   - responsive probe selectors scoped per section
 *   - no internal [attr.href]
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CommunityDetailPageComponent } from './community-detail.page';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { ApiClient } from '../../../core/api/api-client';
import { SEED_COMMUNITY_DETAILS } from '../../../core/api/mock-seed';

let mockClient: { communityGet: ReturnType<typeof vi.fn> } | null = null;

async function renderPage(id?: string) {
  mockClient = {
    communityGet: vi.fn().mockImplementation((cid: string) =>
      Promise.resolve(SEED_COMMUNITY_DETAILS.find((c) => c.id === cid) ?? null),
    ),
  } as unknown as { communityGet: ReturnType<typeof vi.fn> };
  await TestBed.configureTestingModule({
    imports: [CommunityDetailPageComponent, UiIconComponent],
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient as unknown as ApiClient }],
  }).compileComponents();
  const fixture = TestBed.createComponent(CommunityDetailPageComponent);
  if (id) {
    fixture.componentInstance.id = id;
  }
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('CommunityDetailPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ─────────────────────────────────────────────────────────────────────
  // BREADCRUMB
  // ─────────────────────────────────────────────────────────────────────
  it('renders the breadcrumb (Communities › MERIDIAN Alpha) with routerLink', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const crumb = root.querySelector('[data-testid="community-breadcrumb"]');
    expect(crumb?.textContent).toContain('Communities');
    expect(crumb?.textContent).toContain('MERIDIAN Alpha');
    // Communities link uses routerLink to /communities
    const link = Array.from(crumb?.querySelectorAll('a') ?? []).find((a) =>
      a.textContent?.includes('Communities'),
    );
    expect(link?.getAttribute('href')).toBe('/communities');
  });

  // ─────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────
  it('header: 16x16 violet avatar + users icon + title + Active badge inline', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    expect(header).toBeTruthy();
    const avatar = header.querySelector('div.w-16.h-16.rounded-xl');
    expect(avatar).toBeTruthy();
    expect(avatar?.querySelector('svg[data-icon="users"]')).toBeTruthy();
    const h1 = header.querySelector('h1');
    expect(h1?.textContent).toContain('MERIDIAN Alpha');
    expect(header.textContent).toMatch(/Active/);
    expect(header.querySelector('.badge-success')?.textContent).toContain('Active');
  });

  it('header subtitle: focus · scope · Founded YEAR (one line)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    expect(header.textContent).toContain('General arbitrage');
    expect(header.textContent).toContain('Global scope');
    expect(header.textContent).toContain('Founded 2024');
  });

  it('header metadata chips: location (map-pin), founded (calendar), id (hash) — 3 chips', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    expect(header.querySelector('svg[data-icon="map-pin"]')).toBeTruthy();
    expect(header.querySelector('svg[data-icon="calendar"]')).toBeTruthy();
    expect(header.querySelector('svg[data-icon="hash"]')).toBeTruthy();
    expect(header.textContent).toContain('Global');
    expect(header.textContent).toMatch(/Est\. March 2024/);
    expect(header.textContent).toMatch(/C-001|ID:\s*C-001/);
  });

  it('header metadata chips: each icon+text pair is wrapped in inline-flex items-center (aligned)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    // Each chip pair uses inline-flex + items-center so the icon aligns with the
    // text x-height (the user explicitly flagged "text not aligned with icons").
    const chips = Array.from(
      header.querySelectorAll('span.inline-flex.items-center.gap-1\\.5'),
    );
    expect(chips.length).toBeGreaterThanOrEqual(3);
  });

  it('header action buttons: share + more-horizontal dropdown (no raw href)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    expect(header.querySelector('button[data-copy]')).toBeTruthy();
    expect(header.querySelector('svg[data-icon="share-2"]')).toBeTruthy();
    const dropdown = header.querySelector('button[data-dropdown="actionsMenu"]');
    expect(dropdown).toBeTruthy();
    expect(dropdown?.querySelector('svg[data-icon="more-horizontal"]')).toBeTruthy();
  });

  it('header does NOT duplicate the C-001 ref outside the breadcrumb (id lives in chips row)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    // No standalone font-mono ref span — the id is in a chip line, not duplicated
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

  // ─────────────────────────────────────────────────────────────────────
  // ACTIONS DROPDOWN
  // ─────────────────────────────────────────────────────────────────────
  it('actions dropdown hidden by default; 4 items: View governance / View members / Community settings / Report issue', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const menu = root.querySelector('#actionsMenu');
    expect(menu).toBeTruthy();
    expect(menu?.hasAttribute('hidden')).toBe(true);
    expect(menu?.textContent).toMatch(/View governance/);
    expect(menu?.textContent).toMatch(/View members/);
    expect(menu?.textContent).toMatch(/Community settings/);
    expect(menu?.textContent).toMatch(/Report issue/);
    expect(menu?.querySelector('.menu-danger')).toBeTruthy();
    expect(menu?.querySelector('svg[data-icon="alert-triangle"]')).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4 KPI CARDS
  // ─────────────────────────────────────────────────────────────────────
  it('4 KPI cards: Total Pool / Members / ROI (YTD) / Executions', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const kpis = Array.from(root.querySelectorAll('[data-testid^="kpi-card-"]'));
    expect(kpis.length).toBe(4);
    const labels = kpis.map((k) => k.querySelector('.kpi-label')?.textContent?.trim());
    expect(labels).toEqual(['Total Pool', 'Members', 'ROI (YTD)', 'Executions']);
  });

  it('Total Pool: $1.42M emerald gradient + +12.4% delta', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const k = root.querySelector('[data-testid="kpi-card-pool"]');
    expect(k?.textContent).toMatch(/\$1,423,580|\$1\.42M/);
    expect(k?.querySelector('.text-gradient-emerald')).toBeTruthy();
    expect(k?.textContent).toContain('+12.4%');
    expect(k?.querySelector('svg[data-icon="banknote"]')).toBeTruthy();
    expect(k?.querySelector('svg[data-icon="trending-up"]')).toBeTruthy();
  });

  it('Members: 124 + +8 this month (emerald trending-up)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const k = root.querySelector('[data-testid="kpi-card-members"]');
    expect(k?.textContent).toContain('124');
    expect(k?.textContent).toContain('+8');
    expect(k?.querySelector('svg[data-icon="users"]')).toBeTruthy();
  });

  it('ROI (YTD): +18.4% violet gradient + Target: 15% with check-circle', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const k = root.querySelector('[data-testid="kpi-card-roi"]');
    expect(k?.textContent).toContain('+18.4%');
    expect(k?.querySelector('.text-gradient-copper')).toBeTruthy();
    expect(k?.textContent).toContain('Target: 15%');
    expect(k?.querySelector('svg[data-icon="percent"]')).toBeTruthy();
    expect(k?.querySelector('svg[data-icon="check-circle"]')).toBeTruthy();
  });

  it('Executions: 47 + "3 active · 44 completed" + zap icon', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const k = root.querySelector('[data-testid="kpi-card-executions"]');
    expect(k?.textContent).toContain('47');
    expect(k?.textContent).toMatch(/3 active · 44 completed/);
    expect(k?.querySelector('svg[data-icon="zap"]')).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // COMMUNITY-GOVERNED PARAMETERS CARD
  // ─────────────────────────────────────────────────────────────────────
  it('Community-Governed Parameters: 4 rows with icon + label + value + last-updated', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-governed-params"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toMatch(/Economic targets set by community vote/);
    const rows = Array.from(card?.querySelectorAll('[data-param-row]') ?? []);
    expect(rows.length).toBe(4);
    expect(rows[0].textContent).toContain('ROI floor');
    expect(rows[0].textContent).toContain('15%');
    expect(rows[1].textContent).toContain('Win-rate target');
    expect(rows[1].textContent).toContain('75%');
    expect(rows[2].textContent).toContain('Distribution shares');
    expect(rows[2].textContent).toContain('60:25:15');
    expect(rows[3].textContent).toContain('Reserve ratio target');
    expect(rows[3].textContent).toContain('18%');
  });

  it('View proposals link uses routerLink to /governance', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-governed-params"]');
    const link = Array.from(card?.querySelectorAll('a') ?? []).find((a) =>
      a.textContent?.includes('View proposals'),
    );
    expect(link?.getAttribute('href')).toBe('/governance');
  });

  // ─────────────────────────────────────────────────────────────────────
  // RECENT EXECUTIONS CARD
  // ─────────────────────────────────────────────────────────────────────
  it('Recent Executions: 2 rows (E-1042 + E-1039) each with icon, ref, ROI, progress bar', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-recent-executions"]');
    expect(card).toBeTruthy();
    const rows = Array.from(card?.querySelectorAll('[data-exec-row]') ?? []);
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('E-1042');
    expect(rows[0].textContent).toContain('+12.4% ROI');
    expect(rows[0].querySelector('.progress-fill')).toBeTruthy();
    expect(rows[0].textContent).toContain('3 of 8 sold');
    expect(rows[1].textContent).toContain('E-1039');
    expect(rows[1].textContent).toContain('+18.7% ROI');
    expect(rows[1].textContent).toContain('Closing');
  });

  it('Recent Executions: row link uses routerLink to /executions/:id', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-recent-executions"]');
    const links = Array.from(card?.querySelectorAll('a[data-row-link]') ?? []);
    expect(links.length).toBe(2);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^\/executions\/E-\d+$/);
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // ABOUT SIDEBAR CARD
  // ─────────────────────────────────────────────────────────────────────
  it('About card: paragraph + 4 fact rows (Focus / Region / Founded / Min contribution)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-about"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toMatch(/MERIDIAN Alpha is the founding community/);
    expect(card?.textContent).toContain('General arbitrage');
    expect(card?.textContent).toContain('Global');
    expect(card?.textContent).toContain('March 2024');
    expect(card?.textContent).toMatch(/Min\. contribution/);
    expect(card?.textContent).toContain('$1,000');
  });

  // ─────────────────────────────────────────────────────────────────────
  // MEMBER COMPOSITION SIDEBAR CARD
  // ─────────────────────────────────────────────────────────────────────
  it('Member Composition: 3 progress bars (Capital 42 34% / Signal 67 54% / Access 15 12%) + View all members CTA', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-member-composition"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Capital providers');
    expect(card?.textContent).toContain('42 (34%)');
    expect(card?.textContent).toContain('Signal providers');
    expect(card?.textContent).toContain('67 (54%)');
    expect(card?.textContent).toContain('Access providers');
    expect(card?.textContent).toContain('15 (12%)');
    const cta = card?.querySelector('a');
    expect(cta?.textContent).toMatch(/View all members/);
    expect(cta?.getAttribute('href')).toBe('/community/alpha/members');
  });

  // ─────────────────────────────────────────────────────────────────────
  // SAFETY RAILS SIDEBAR CARD
  // ─────────────────────────────────────────────────────────────────────
  it('Safety Rails: 4 check-circle items (Integrity / Reconciliation / No-ponzi / Human control)', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const card = root.querySelector('[data-testid="card-safety-rails"]');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Never community-governed');
    expect(card?.textContent).toContain('Integrity verification');
    expect(card?.textContent).toContain('Reconciliation checks');
    expect(card?.textContent).toContain('No-ponzi mechanics');
    expect(card?.textContent).toContain('Human control override');
    const checks = card?.querySelectorAll('svg[data-icon="check-circle"]');
    expect(checks?.length).toBe(4);
  });

  // ─────────────────────────────────────────────────────────────────────
  // RESPONSIVE LAYOUT
  // ─────────────────────────────────────────────────────────────────────
  it('main column + sidebar layout uses outer lg:grid-cols-3 with main spanning 2', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const wrappers = Array.from(root.querySelectorAll('.lg\\:grid-cols-3, .grid.lg\\:grid-cols-3'));
    expect(wrappers.length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC METHOD COVERAGE
  // ─────────────────────────────────────────────────────────────────────
  it('communityId() returns the @Input id', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { communityId: () => string };
    expect(c.communityId()).toBe('alpha');
  });

  it('loadCommunity(id) returns the seeded MERIDIAN Alpha data', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      loadCommunity: (id: string) => { name: string; ref: string; status: string } | null;
    };
    const data = c.loadCommunity('alpha');
    expect(data).not.toBeNull();
    expect(data?.name).toBe('MERIDIAN Alpha');
    expect(data?.status).toBe('active');
  });

  it('calls ApiClient.communityGet(id) and shows skeleton while loading', async () => {
    const mc = {
      communityGet: vi.fn().mockResolvedValue(SEED_COMMUNITY_DETAILS[0]),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({
      imports: [CommunityDetailPageComponent, UiIconComponent],
      providers: [provideRouter([]), { provide: ApiClient, useValue: mc }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CommunityDetailPageComponent);
    fixture.componentInstance.id = 'alpha';
    fixture.detectChanges(); // loading = true, skeleton visible, no header
    const pre = fixture.nativeElement as HTMLElement;
    expect(pre.querySelector('[data-testid="skeleton"]')).toBeTruthy();
    expect(pre.querySelector('header')).toBeFalsy();
    expect(mc.communityGet).toHaveBeenCalledWith('alpha');
    await fixture.whenStable();
    fixture.detectChanges();
    const post = fixture.nativeElement as HTMLElement;
    expect(post.querySelector('[data-testid="skeleton"]')).toBeFalsy();
    expect(post.querySelector('header')).toBeTruthy();
  });

  it('kpis() returns 4 KPI data points (label/value/delta)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      kpis: () => { label: string; value: string; delta: string }[];
    };
    const list = c.kpis();
    expect(list.length).toBe(4);
    expect(list[0].label).toBe('Total Pool');
    expect(list[2].label).toBe('ROI (YTD)');
  });

  it('governedParams() returns 4 parameters (key/value/updated)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      governedParams: () => { key: string; value: string }[];
    };
    const list = c.governedParams();
    expect(list.length).toBe(4);
    expect(list.map((p) => p.key)).toEqual([
      'ROI floor',
      'Win-rate target',
      'Distribution shares',
      'Reserve ratio target',
    ]);
  });

  it('recentExecutions() returns 2 executions (ref/title/roi/progress)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      recentExecutions: () => { ref: string; progressPct: number }[];
    };
    const list = c.recentExecutions();
    expect(list.length).toBe(2);
    expect(list[0].ref).toBe('E-1042');
    expect(list[0].progressPct).toBe(37);
  });

  it('memberComposition() returns 3 segments (key/count/pct)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      memberComposition: () => { key: string; count: number; pct: number }[];
    };
    const list = c.memberComposition();
    expect(list.length).toBe(3);
    expect(list[0].key).toBe('Capital providers');
    expect(list[0].count).toBe(42);
    expect(list[0].pct).toBe(34);
  });

  it('toggleActionsMenu() opens and closes the actions dropdown', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { toggleActionsMenu: () => void };
    const root = f.nativeElement as HTMLElement;
    const menu = root.querySelector('#actionsMenu');
    expect(menu?.hasAttribute('hidden')).toBe(true);
    c.toggleActionsMenu();
    f.detectChanges();
    expect(menu?.hasAttribute('hidden')).toBe(false);
    c.toggleActionsMenu();
    f.detectChanges();
    expect(menu?.hasAttribute('hidden')).toBe(true);
  });

  it('shareLink() returns the canonical URL for the current community', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { shareLink: () => string };
    expect(c.shareLink()).toBe('/community/alpha');
  });

  it('gradientAvatar() returns the matching gradient var for the community', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { gradientAvatar: () => string };
    expect(c.gradientAvatar()).toBe('var(--gradient-copper)');
  });

  it('safetyRails() returns 4 non-empty strings (the wireframe Safety Rails list)', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as { safetyRails: () => ReadonlyArray<string> };
    const rails = c.safetyRails();
    expect(rails.length).toBe(4);
    for (const r of rails) {
      expect(typeof r).toBe('string');
      expect(r.length).toBeGreaterThan(0);
    }
  });

  it('closeActionsMenu() sets actionsOpen to false (and is idempotent)', async () => {
    const f = await renderPage('alpha');
    const c = f.componentInstance as unknown as {
      actionsOpen: () => boolean;
      closeActionsMenu: () => void;
    };
    // call close; should set to false (and remain false even after a toggle)
    c.closeActionsMenu();
    expect(c.actionsOpen()).toBe(false);
    // calling again is a no-op (idempotent)
    c.closeActionsMenu();
    expect(c.actionsOpen()).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────
  // LINK AUDIT (regression — every link leads somewhere real)
  // ─────────────────────────────────────────────────────────────────────
  it('every internal link on community-detail resolves to a registered route (no 404s)', async () => {
    const f = await renderPage('alpha');
    const root = f.nativeElement as HTMLElement;
    // The set of paths the Angular router has registered (mirrors app.routes.ts).
    // When a real link points to a path NOT in this set, the page will 404
    // when clicked — this test catches that drift early.
    const KNOWN_ROUTES: ReadonlyArray<string> = [
      '/',
      '/showcase',
      '/dashboard',
      '/opportunities',
      '/opportunities/:ref',
      '/opportunity-detail/:ref',
      '/executions',
      '/executions/:ref',
      '/execution-detail/:ref',
      '/pool',
      '/communities',
      '/communities/:ref',
      '/community-detail/:ref',
      '/community/:ref/members',
      '/community/:ref/settings',
      '/governance',
      '/submit-signal',
      '/profile',
      '/payouts',
      '/members/:name',
    ];
    const PLACEHOLDER_OK = new Set<string>([
      '/governance',
      '/community/alpha/members',
      '/community/alpha/settings',
      '/submit-signal',
      '/profile',
      '/payouts',
      '/members/alex-chen',
    ]);
    const links = Array.from(root.querySelectorAll('a[href^="/"]')) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    const bad: string[] = [];
    for (const a of links) {
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/')) continue;
      // match against routes (with `:ref` as a placeholder match for any segment)
      const matches = KNOWN_ROUTES.some((route) => {
        const re = new RegExp('^' + route.replace(/:[a-z-]+/g, '[^/]+') + '$');
        return re.test(href);
      });
      if (!matches && !PLACEHOLDER_OK.has(href)) {
        bad.push(href);
      }
    }
    expect(bad).toEqual([]);
  });
});
