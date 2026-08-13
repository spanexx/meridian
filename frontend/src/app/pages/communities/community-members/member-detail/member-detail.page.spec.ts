/**
 * MemberDetailPageComponent — public profile for a single member.
 *
 * Renders per wireframe/meridian/member-detail/index.html:
 *   - breadcrumb (Members > <name>)
 *   - hero: avatar (initials gradient), name + role badge + verified badge,
 *     location + member-since, 3 KPIs (overall / capital / lifetime earned),
 *     Follow button (toggles state, copies share URL on click)
 *   - Reputation card: 4 sub-cards (Signal / Capital / Access / Community),
 *     each with score, progress bar, sub-text
 *   - Contribution card: 4 stat rows (capital deployed / executions funded /
 *     avg share / privileges)
 *   - Access Credentials card: 1 credential row
 *   - Recent Activity table (Date / Event / Result / Impact) with 4 rows
 *
 * Route: /members/:name — defaults to "dana-voss" so the page renders
 * before the route binds (matches the project-wide pattern from
 * community-detail).
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MemberDetailPageComponent } from './member-detail.page';

async function renderPage(communityId: string = 'alpha', memberId: string = 'dana-voss') {
  const f = TestBed.createComponent(MemberDetailPageComponent);
  f.componentRef.setInput('id', communityId);
  f.componentRef.setInput('memberId', memberId);
  f.detectChanges();
  return f;
}

describe('MemberDetailPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberDetailPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });
  // ─── Header / hero ─────────────────────────────────────────────────
  it('renders the breadcrumb Members > <name>', async () => {
    const f = await renderPage('alpha', 'dana-voss');
    const bc = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(bc).toContain('Members');
    expect(bc).toContain('Dana Voss');
  });

  it('renders the member name as h1', async () => {
    const f = await renderPage();
    const h1 = (f.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Dana Voss');
  });

  it('shows role + tier badge', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Capital');
    expect(html).toContain('T4');
  });

  it('shows verified badge', async () => {
    const f = await renderPage();
    const html = (f.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Verified');
  });

  it('shows location + member since', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Düsseldorf');
    expect(text).toContain('DE');
    expect(text).toContain('March 2023');
  });

  it('avatar shows 2 capital initials from the first name parts', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { initials: (n: string) => string };
    expect(c.initials('Dana Voss')).toBe('DV');
    expect(c.initials('Sarah Park')).toBe('SP');
  });

  it('renders the three hero KPIs (overall, capital, lifetime earned)', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Overall');
    expect(text).toContain('92');
    expect(text).toContain('Capital');
    expect(text).toContain('$284,500');
    expect(text).toContain('Lifetime earned');
    expect(text).toContain('+$38,240');
  });

  it('renders a Follow button', async () => {
    const f = await renderPage();
    const btn = (f.nativeElement as HTMLElement).querySelector('[data-testid="follow-button"]');
    expect(btn?.textContent?.toLowerCase()).toContain('follow');
  });

  // ─── Follow state ──────────────────────────────────────────────────
  it('isFollowing() starts false', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { isFollowing: () => boolean };
    expect(c.isFollowing()).toBe(false);
  });

  it('follow() toggles isFollowing() to true; follow() again toggles back', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      isFollowing: () => boolean;
      follow: () => void;
    };
    c.follow();
    expect(c.isFollowing()).toBe(true);
    c.follow();
    expect(c.isFollowing()).toBe(false);
  });

  it('follow() flips the button label between Follow and Following', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { follow: () => void };
    const btn = (f.nativeElement as HTMLElement).querySelector('[data-testid="follow-button"]') as HTMLElement;
    expect(btn.textContent?.toLowerCase()).toContain('follow');
    expect(btn.textContent?.toLowerCase()).not.toContain('following');
    c.follow();
    f.detectChanges();
    expect(btn.textContent?.toLowerCase()).toContain('following');
  });

  it('shareUrl() returns https://meridian.example/members/<slug>', async () => {
    const f = await renderPage('alpha', 'dana-voss');
    const c = f.componentInstance as unknown as { shareUrl: () => string };
    expect(c.shareUrl()).toBe('https://meridian.example/community/alpha/members/dana-voss');
  });

  // ─── Reputation (4 sub-cards) ──────────────────────────────────────
  it('renders the 4 reputation cards with score, progress, sub-text', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Signal');
    expect(text).toContain('Accuracy');
    expect(text).toContain('64');
    expect(text).toContain('Capital');
    expect(text).toContain('Stability');
    expect(text).toContain('97');
    expect(text).toContain('Access');
    expect(text).toContain('Utilization');
    expect(text).toContain('38');
    expect(text).toContain('Community');
    expect(text).toContain('Participation');
    expect(text).toContain('88');
  });

  it('renders 4 progress bars with the right widths', async () => {
    const f = await renderPage();
    const bars = (f.nativeElement as HTMLElement).querySelectorAll('[data-reputation-card] .progress-fill');
    expect(bars.length).toBe(4);
    const widths = Array.from(bars).map((el) => (el as HTMLElement).style.width);
    expect(widths).toEqual(['64%', '97%', '38%', '88%']);
  });

  // ─── Contribution card (sidebar) ───────────────────────────────────
  it('renders the 4 contribution stat rows', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Capital deployed');
    expect(text).toContain('Executions funded');
    expect(text).toContain('Avg share of pool');
    expect(text).toContain('Privileges');
    expect(text).toContain('Vote · Propose · Operate');
  });

  // ─── Access Credentials card ───────────────────────────────────────
  it('renders the Access Credentials card with at least 1 active credential', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Access Credentials');
    expect(text).toContain('Düsseldorf warehouse');
    expect(text).toContain('Active');
  });

  // ─── Recent Activity table ─────────────────────────────────────────
  it('renders a 4-row Recent Activity table with the expected event labels', async () => {
    const f = await renderPage();
    const text = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Recent Activity');
    expect(text).toContain('Capital allocation · E-1042');
    expect(text).toContain('Vote · ROI floor proposal');
    expect(text).toContain('Payout · E-1030');
    expect(text).toContain('Capital deposit');
  });

  it('recent activity table has the 4 expected columns', async () => {
    const f = await renderPage();
    const headers = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="recent-activity-table"] thead th');
    expect(headers.length).toBe(4);
    const labels = Array.from(headers).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['Date', 'Event', 'Result', 'Impact']);
  });

  it('recent activity Event cell links to the related page', async () => {
    const f = await renderPage();
    const links = (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="recent-activity-table"] tbody tr td a');
    expect(links.length).toBeGreaterThan(0);
    // First row links to execution-detail, second to governance, etc.
    const hrefs = Array.from(links).map((el) => el.getAttribute('href') ?? '');
    expect(hrefs.some((h) => h.includes('/executions/E-1042'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/governance'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/payouts'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/pool'))).toBe(true);
  });

  // ─── Data: member() ─────────────────────────────────────────────────
  it('member() returns the data object for the current :id (Dana Voss by default)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      member: () => { name: string; ref: string; role: string; tier: string };
    };
    const m = c.member();
    expect(m.name).toBe('Dana Voss');
    expect(m.ref).toBe('dana-voss');
  });

  it('member() returns a fallback "Unknown contributor" for an unknown slug', async () => {
    const f = await renderPage('alpha', 'nobody-real');
    const c = f.componentInstance as unknown as {
      member: () => { name: string; ref: string };
    };
    expect(c.member().name).toBe('Unknown contributor');
    expect(c.member().ref).toBe('nobody-real');
  });

  // ─── Routing ───────────────────────────────────────────────────────
  it('id defaults to "alpha" and memberId defaults to "dana-voss" so the page renders before the route binds', async () => {
    const f = TestBed.createComponent(MemberDetailPageComponent);
    // no setInput call — inputs stay at their field defaults
    f.detectChanges();
    const c = f.componentInstance as unknown as {
      id: () => string;
      memberId: () => string;
      member: () => { ref: string };
    };
    expect(c.id()).toBe('alpha');
    expect(c.memberId()).toBe('dana-voss');
    expect(c.member().ref).toBe('dana-voss');
  });

  it('breadcrumb links back to /communities (the members list)', async () => {
    const f = await renderPage('alpha', 'dana-voss');
    const bcLink = (f.nativeElement as HTMLElement).querySelector('[data-testid="member-breadcrumb"] a');
    expect(bcLink).toBeTruthy();
    expect(bcLink?.getAttribute('href')).toBe('/community-detail/alpha');
  });

  // ─── Helpers ─────────────────────────────────────────────────────────
  it('reputationColor() returns the right CSS var per color', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { reputationColor: (k: string) => string };
    expect(c.reputationColor('violet')).toBe('var(--v-400)');
    expect(c.reputationColor('emerald')).toBe('var(--e-400)');
    expect(c.reputationColor('blue')).toBe('var(--b-400)');
    expect(c.reputationColor('amber')).toBe('var(--a-400)');
  });

  it('reputationTint() returns the right rgba tint per color', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { reputationTint: (k: string) => string };
    expect(c.reputationTint('violet')).toContain('201');
    expect(c.reputationTint('emerald')).toContain('16');
    expect(c.reputationTint('blue')).toContain('96');
    expect(c.reputationTint('amber')).toContain('245');
  });

  it('formatUsd() formats USD with thousands separator', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { formatUsd: (n: number) => string };
    expect(c.formatUsd(0)).toBe('$0');
    expect(c.formatUsd(1234)).toBe('$1,234');
    expect(c.formatUsd(284500)).toBe('$284,500');
  });

});
