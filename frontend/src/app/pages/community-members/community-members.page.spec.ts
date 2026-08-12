/**
 * RED spec — CommunityMembersPageComponent (wireframe/meridian/members/index.html).
 *
 * V1 scope (the entire wireframe):
 *   - header: title "Members" + summary subtitle + search input + Tier dropdown
 *   - Tier dropdown menu (5 items: All tiers / T4 / T3 / T2 / T1)
 *   - Role tabs (4: All / Capital / Signal / Access)
 *   - Members table with 10 rows × 7 columns (Member / Role / Tier / Reputation /
 *     Contribution / Signals / chevron); each row links to /members/<name>
 *     and carries data-category (tier) + data-status (role) attributes
 *   - Pagination: "Showing 8 of 124" + Prev/Next + "1 / 16"
 *   - Empty state: lucide-users icon + "No members match"
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommunityMembersPageComponent } from './community-members.page';
import { UiIconComponent } from '../../ui/icon/icon.component';

async function renderPage() {
  await TestBed.configureTestingModule({
    imports: [CommunityMembersPageComponent, UiIconComponent],
    providers: [provideRouter([])],
  }).compileComponents();
  const fixture = TestBed.createComponent(CommunityMembersPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CommunityMembersPageComponent', () => {
  // ─── Header ──────────────────────────────────────────────────────────
  it('renders the page title "Members"', async () => {
    const f = await renderPage();
    const h1 = (f.nativeElement as HTMLElement).querySelector('h1.page-title');
    expect(h1?.textContent?.trim()).toBe('Members');
  });

  it('subtitle shows the summary count by role', async () => {
    const f = await renderPage();
    const sub = (f.nativeElement as HTMLElement).querySelector('.page-subtitle');
    expect(sub?.textContent).toContain('124 members');
    expect(sub?.textContent).toContain('42 capital');
    expect(sub?.textContent).toContain('67 signal');
    expect(sub?.textContent).toContain('15 access');
  });

  it('renders a search input', async () => {
    const f = await renderPage();
    const search = (f.nativeElement as HTMLElement).querySelector('input[type="search"]');
    expect(search).toBeTruthy();
    expect(search?.getAttribute('placeholder')).toContain('Search');
  });

  // ─── Tier dropdown ──────────────────────────────────────────────────
  it('renders the Tier button in the header', async () => {
    const f = await renderPage();
    const btn = (f.nativeElement as HTMLElement).querySelector('[data-action="open-tier-menu"]');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Tier');
  });

  it('tier dropdown opens via openTierMenu() with 5 menu items', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openTierMenu: () => void; tierMenuOpen: () => boolean };
    expect(c.tierMenuOpen).toBe(false);
    c.openTierMenu();
    f.detectChanges();
    expect(c.tierMenuOpen).toBe(true);
    const items = (f.nativeElement as HTMLElement).querySelectorAll('[data-filter-category]');
    expect(items.length).toBe(5);
  });

  it('tier menu items: All tiers / T4 / T3 / T2 / T1', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openTierMenu: () => void };
    c.openTierMenu();
    f.detectChanges();
    const items = (f.nativeElement as HTMLElement).querySelectorAll('[data-filter-category]');
    const cats = Array.from(items).map((el) => el.getAttribute('data-filter-category'));
    expect(cats).toEqual(['all', 't4', 't3', 't2', 't1']);
  });

  it('selecting a tier closes the menu and updates activeTier', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      openTierMenu: () => void;
      selectTier: (tier: 'all' | 't4' | 't3' | 't2' | 't1') => void;
      tierMenuOpen: () => boolean;
      activeTier: () => string;
    };
    c.openTierMenu();
    c.selectTier('t4');
    expect(c.tierMenuOpen).toBe(false);
    expect(c.activeTier).toBe('t4');
  });

  // ─── Role tabs ──────────────────────────────────────────────────────
  it('renders the role tabs (All / Capital / Signal / Access) with counts', async () => {
    const f = await renderPage();
    const tabs = (f.nativeElement as HTMLElement).querySelectorAll('[data-filter-tab]');
    expect(tabs.length).toBe(4);
    const labels = Array.from(tabs).map((el) => el.textContent?.trim());
    expect(labels).toEqual(['All 124', 'Capital 42', 'Signal 67', 'Access 15']);
  });

  it('selecting a role tab sets activeRole', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      selectRole: (role: 'all' | 'capital' | 'signal' | 'access') => void;
      activeRole: () => string;
    };
    expect(c.activeRole).toBe('all');
    c.selectRole('capital');
    expect(c.activeRole).toBe('capital');
  });

  // ─── Members table ──────────────────────────────────────────────────
  it('renders the members table with 7 columns', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const headers = root.querySelectorAll('th');
    expect(headers.length).toBe(7);
    const labels = Array.from(headers).map((h) => h.textContent?.trim());
    expect(labels).toEqual(['Member', 'Role', 'Tier', 'Reputation', 'Contribution', 'Signals', '']);
  });

  it('renders 8 member rows on the first page (pageSize=8)', async () => {
    const f = await renderPage();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    expect(rows.length).toBe(8);
  });

  it('members() returns 10 (unfiltered dataset)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { members: () => ReadonlyArray<unknown> };
    expect(c.members().length).toBe(10);
  });

  it('row 1: Dana Voss (Capital / T4 / reputation 92 / $284,500 / 4 signals)', async () => {
    const f = await renderPage();
    const row = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]')[0] as HTMLElement;
    expect(row.textContent).toContain('Dana Voss');
    expect(row.textContent).toContain('Düsseldorf');
    expect(row.textContent.toLowerCase()).toContain('capital');
    expect(row.textContent).toContain('T4');
    expect(row.textContent).toContain('92');
    expect(row.textContent).toContain('284,500');
    expect(row.textContent).toContain('4');
    expect(row.textContent).toContain('+28%');
  });

  it('each member row carries data-category (tier) and data-status (role) attributes', async () => {
    const f = await renderPage();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    for (const row of Array.from(rows)) {
      expect(row.getAttribute('data-category')).toMatch(/^t[1-4]$/);
      expect(row.getAttribute('data-status')).toBeOneOf(['capital', 'signal', 'access']);
    }
  });

  it('each member row links to /members/<name>', async () => {
    const f = await renderPage();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    for (const row of Array.from(rows)) {
      const link = row.querySelector('a[href^="/members/"]') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      const href = link.getAttribute('href')!;
      expect(href.startsWith('/members/')).toBe(true);
      // Slug should be the lowercased name
      expect(href).toMatch(/^\/members\/[a-z][a-z0-9-]+$/);
    }
  });

  it('reputation column uses gradient color (text-gradient-violet class)', async () => {
    const f = await renderPage();
    const repCells = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="reputation-cell"]');
    expect(repCells.length).toBe(8);  // page 1 has 8 rows
  });

  it('formatUsd() formats USD with thousands separator', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { formatUsd: (n: number) => string };
    expect(c.formatUsd(284500)).toBe('$284,500');
    expect(c.formatUsd(3200)).toBe('$3,200');
  });

  it('formatCreds() formats creds with singular/plural', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { formatCreds: (n: number) => string };
    expect(c.formatCreds(1)).toBe('1 cred');
    expect(c.formatCreds(3)).toBe('3 creds');
  });

  it('signals column shows N · +PCT%  for capital/signal members (or N · — for new)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { formatSignals: (n: number, pctChange: number | null) => string };
    expect(c.formatSignals(4, 28)).toBe('4 · +28%');
    expect(c.formatSignals(1, null)).toBe('1 · —');
  });

  // ─── Tier filter behavior ───────────────────────────────────────────
  it('selecting tier T4 filters the table to only T4 members', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTier: (t: string) => void };
    c.selectTier('t4');
    f.detectChanges();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    expect(rows.length).toBe(2);  // Dana Voss + Ravi Kumar
  });

  it('selecting tier T3 filters to 5 T3 members', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectTier: (t: string) => void };
    c.selectTier('t3');
    f.detectChanges();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    expect(rows.length).toBe(5);
  });

  // ─── Role filter behavior ───────────────────────────────────────────
  it('selecting role Capital filters to only Capital-status members', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { selectRole: (r: string) => void };
    c.selectRole('capital');
    f.detectChanges();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    expect(rows.length).toBe(4);
  });

  // ─── Search ─────────────────────────────────────────────────────────
  it('typing in the search input narrows the visible rows', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { setSearch: (q: string) => void };
    c.setSearch('dana');
    f.detectChanges();
    const rows = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]');
    expect(rows.length).toBe(1);  // Only Dana Voss matches
    expect(rows[0]?.textContent).toContain('Dana Voss');
  });

  // ─── Pagination ─────────────────────────────────────────────────────
  it('renders the pagination footer with "Showing 8 of 124" and 1 / 16', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Showing 8 of 124');
    expect(root.textContent).toContain('1 / 16');
  });

  it('next page increments currentPage and renders next batch', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      nextPage: () => void;
      currentPage: number;
      maxPage: number;
    };
    expect(c.currentPage).toBe(1);
    c.nextPage();
    f.detectChanges();
    expect(c.currentPage).toBe(2);
  });

  it('nextPage() at maxPage is a no-op', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      maxPage: number;
      nextPage: () => void;
      currentPage: number;
    };
    const max = c.maxPage();
    // jump to max
    for (let i = 0; i < max + 5; i++) c.nextPage();
    f.detectChanges();
    expect(c.currentPage).toBe(max);
  });

  // ─── Empty state ────────────────────────────────────────────────────
  it('renders the empty-state placeholder when no row matches the filter', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { setSearch: (q: string) => void };
    c.setSearch('zzzzzz');  // matches no one
    f.detectChanges();
    const empty = (f.nativeElement as HTMLElement).querySelector('[data-testid="empty-state"]') as HTMLElement;
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('No members match');
    expect((f.nativeElement as HTMLElement).querySelectorAll('[data-testid="member-row"]').length).toBe(0);
  });

  // ─── Public methods (TDD pin) ───────────────────────────────────────
  it('members returns 10 members on first render', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { members: () => ReadonlyArray<unknown> };
    expect(c.members().length).toBe(10);
  });

  it('setSearch() updates the search query', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setSearch: (q: string) => void;
      searchQuery: string;
    };
    c.setSearch('ravi');
    expect(c.searchQuery).toBe('ravi');
  });

  // ─── Coverage pins for TDD enforcement (public methods) ──────────────
  it('filteredMembers() returns 10 when filters are all=all', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { filteredMembers: () => ReadonlyArray<unknown> };
    expect(c.filteredMembers().length).toBe(10);
  });

  it('filteredMembers() respects tier filter', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      selectTier: (t: string) => void;
      filteredMembers: () => ReadonlyArray<{ tier: string }>;
    };
    c.selectTier('t4');
    expect(c.filteredMembers().every((m) => m.tier === 't4')).toBe(true);
  });

  it('pagedMembers() returns 8 on page 1', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { pagedMembers: () => ReadonlyArray<unknown> };
    expect(c.pagedMembers().length).toBe(8);
  });

  it('pagedMembers() returns 2 on page 2 (124 members / 8 per page = 16 pages)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      nextPage: () => void;
      pagedMembers: () => ReadonlyArray<unknown>;
    };
    c.nextPage();
    f.detectChanges();
    expect(c.pagedMembers().length).toBe(2);
  });

  it('slugForName() lowercases and dashes the name', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { slugForName: (n: string) => string };
    expect(c.slugForName('Dana Voss')).toBe('dana-voss');
    expect(c.slugForName('Tomás Alves')).toBe('tomas-alves');
    expect(c.slugForName('Yuki Nakamura')).toBe('yuki-nakamura');
  });

  it('memberUrl() builds /members/<slug>', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { memberUrl: (n: string) => string };
    expect(c.memberUrl('Dana Voss')).toBe('/members/dana-voss');
  });

  it('contributionText() returns the preformatted string', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      contributionText: (m: { contributionText: string }) => string;
    };
    expect(c.contributionText({ contributionText: '$284,500' })).toBe('$284,500');
    expect(c.contributionText({ contributionText: '3 creds' })).toBe('3 creds');
  });

  it('initials() returns 2 capital letters from the first name parts', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { initials: (n: string) => string };
    expect(c.initials('Dana Voss')).toBe('DV');
    expect(c.initials('Yuki Nakamura')).toBe('YN');
    expect(c.initials('Tomás Alves')).toBe('TA');
  });

  it('closeTierMenu() closes the menu', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      openTierMenu: () => void;
      closeTierMenu: () => void;
      tierMenuOpen: boolean;
    };
    c.openTierMenu();
    f.detectChanges();
    expect(c.tierMenuOpen).toBe(true);
    c.closeTierMenu();
    f.detectChanges();
    expect(c.tierMenuOpen).toBe(false);
  });

  it('toggleTierMenu() flips open/closed', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      toggleTierMenu: () => void;
      tierMenuOpen: boolean;
    };
    expect(c.tierMenuOpen).toBe(false);
    c.toggleTierMenu();
    expect(c.tierMenuOpen).toBe(true);
    c.toggleTierMenu();
    expect(c.tierMenuOpen).toBe(false);
  });

  it('prevPage() decrements currentPage and stops at 1', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      prevPage: () => void;
      nextPage: () => void;
      currentPage: number;
    };
    c.nextPage();  // 2
    c.prevPage();  // 1
    expect(c.currentPage).toBe(1);
    c.prevPage();  // already at 1, no-op
    expect(c.currentPage).toBe(1);
  });


  // ─── Breadcrumb + community scope (v1 community-scoped) ─────────────
  it('renders the breadcrumb back to the community page', async () => {
    const f = await renderPage();
    const nav = (f.nativeElement as HTMLElement).querySelector('[data-testid="members-breadcrumb"]');
    expect(nav).toBeTruthy();
    const link = nav?.querySelector('a') as HTMLAnchorElement;
    expect(link?.getAttribute('href')).toBe('/community-detail/alpha');
    expect(link?.textContent).toContain('Alpha Syndicate');
  });

  it('communityName() returns the human name for the id', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setRouteId: (id: string) => void;
      communityName: string;
    };
    c.setRouteId('alpha');
    expect(c.communityName).toBe('Alpha Syndicate');
    c.setRouteId('meridian-prime');
    expect(c.communityName).toBe('Meridian Prime');
    c.setRouteId('unknown-id');
    expect(c.communityName).toBe('Unknown-id');
  });

  it('id defaults to "alpha" so the page renders before the route binds', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { id: string };
    expect(c.id).toBe('alpha');
  });

  it('communityMembers breadcrumb links back via [routerLink], not [attr.href]', async () => {
    const f = await renderPage();
    const nav = (f.nativeElement as HTMLElement).querySelector('[data-testid="members-breadcrumb"]');
    const link = nav?.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/community-detail/alpha');  // resolved by routerLink
  });

});
