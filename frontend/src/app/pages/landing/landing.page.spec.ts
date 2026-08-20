/**
 * Unit tests for LandingPageComponent — wireframe-aligned marketing page.
 *
 * Per wireframe/meridian/landing/index.html. Pins: hero (nav + headline +
 * trust chips + Join/Sign-in CTAs), terminal card, hero stat strip,
 * Three-ways-in pillars with the 60/25/15 split, live ticker cards,
 * By-the-numbers cards (sparklines, win-rate bars, members bar), process
 * flow nodes, five principles, testimonials, CTA, footer. The page renders
 * WITHOUT the app shell (root route is shell-less).
 *
 * Note: entrance animations (IntersectionObserver reveal, count-up,
 * scroll-progress, sticky-head stuck state) are deliberately NOT ported —
 * content is statically visible (same end state). Theme toggle IS ported.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { LandingPageComponent } from './landing.page';

async function renderStandalone(): Promise<ComponentFixture<LandingPageComponent>> {
  await TestBed.configureTestingModule({
    providers: [provideRouter([])],
  }).compileComponents();
  const { LandingPageComponent: Comp } = await import('./landing.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  return fixture;
}

describe('LandingPage (wireframe-aligned)', () => {
  it('renders the brand nav: MERIDIAN wordmark + Collective Arbitrage', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('MERIDIAN');
    expect(root.textContent).toContain('Collective Arbitrage');
  });

  it('renders the hero headline "Profit together" / "real arbitrage."', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Profit together');
    expect(root.textContent).toContain('real arbitrage.');
  });

  it('renders the live badge + hero copy verbatim', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Live · 3 executions settling now');
    expect(root.textContent).toContain('Pool capital, signals, and access');
    expect(root.textContent).toContain('No recruitment dependency.');
  });

  it('hero CTAs: Join the community -> /register, See it live -> #live', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const join = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Join the community'),
    ) as HTMLAnchorElement | null;
    expect(join?.getAttribute('href')).toContain('/register');
    const live = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('See it live'),
    ) as HTMLAnchorElement | null;
    expect(live?.getAttribute('href')).toBe('#live');
  });

  it('trust chips + nav Sign in link are present', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('KYC at join');
    expect(root.textContent).toContain('Audited event log');
    expect(root.textContent).toContain('No ponzi mechanics');
    expect(root.textContent).toContain('AI assists · humans decide');
    expect(root.textContent).toContain('Sign in');
  });

  it('toggleTheme() flips the document theme (dark <-> light)', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    document.documentElement.dataset['theme'] = 'dark';
    c.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('light');
    c.toggleTheme();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('terminal card renders meridian.live + live feed lines verbatim', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('meridian.live');
    expect(root.textContent).toContain('Live feed');
    expect(root.textContent).toContain('signal O-2051 submitted by @lin');
    expect(root.textContent).toContain('auto-checks 3/3 PASS');
    expect(root.textContent).toContain('execution E-1048');
    expect(root.textContent).toContain('estimated payout $29,366');
    expect(root.textContent).toContain('streaming · 47 ops today');
  });

  it('mini KPI cards: Today +1.24% / Win-rate 82% / Avg. ROI +14.7%', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('+1.24%');
    expect(root.textContent).toContain('82%');
    expect(root.textContent).toContain('+14.7%');
  });

  it('hero stat strip: $1.42M / 124 / +18.4% / 47', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Pool capital');
    expect(root.textContent).toContain('$1.42M');
    expect(root.textContent).toContain('Members');
    expect(root.textContent).toContain('124');
    expect(root.textContent).toContain('YTD ROI');
    expect(root.textContent).toContain('+18.4%');
    expect(root.textContent).toContain('Executions settled');
    expect(root.textContent).toContain('47');
  });

  it('How section: three pillar cards with verbatim copy', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('How members participate');
    expect(root.textContent).toContain('Three ways in.');
    expect(root.textContent).toContain('One pool.');
    expect(root.textContent).toContain('Bring capital');
    expect(root.textContent).toContain('Min. contribution');
    expect(root.textContent).toContain('$1,000');
    expect(root.textContent).toContain('Find the deal');
    expect(root.textContent).toContain('@lin · 14 wins');
    expect(root.textContent).toContain('Hold the keys');
    expect(root.textContent).toContain('15 members');
  });

  it('distribution bar: 60% Capital / 25% Signal / 15% Access', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Profit split (community-voted)');
    for (const t of ['60%', 'Capital', '25%', 'Signal', '15%', 'Access']) {
      expect(root.textContent).toContain(t);
    }
  });

  it('Live section: 12 ticker cards (6 unique + aria-hidden duplicate set)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Opportunities in flight');
    const cards = Array.from(root.querySelectorAll('.ticker-track .card'));
    expect(cards.length).toBe(12);
    const hidden = cards.filter((c) => c.getAttribute('aria-hidden') === 'true');
    expect(hidden.length).toBe(6);
    for (const t of [
      'O-2049',
      'Travis Scott × Nike',
      '+22.4%',
      'E-1048',
      '$24,800',
      '+18.7%',
      'O-2050',
      '+11.2%',
      'E-1042',
      '+12.4%',
      'O-2051',
      '+9.6%',
    ]) {
      expect(root.textContent).toContain(t);
    }
  });

  it('Numbers section: pool capital card with sparkline + Healthy badge', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('By the numbers');
    expect(root.textContent).toContain('Real activity,');
    expect(root.textContent).toContain('Daily reconciliation: BALANCED');
    expect(root.textContent).toContain('Reserve ratio: 18.2% (target 18%)');
    expect(root.textContent).toContain('Liquidity: 62% (healthy)');
    expect(root.textContent).toContain('Pool capital · 90 days');
    expect(root.querySelector('svg.spark path[d*="L200,8"]')).toBeTruthy();
    expect(root.textContent).toContain('Healthy');
  });

  it('Numbers section: win-rate bars (82/11/7) and Avg. ROI sparkline', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Win-rate · 30d');
    expect(root.textContent).toContain('target 75%');
    for (const t of ['Profitable', '82%', 'Break-even', '11%', 'Loss', '7%']) {
      expect(root.textContent).toContain(t);
    }
    expect(root.textContent).toContain('Avg. execution ROI');
    expect(root.querySelector('svg.spark path[d*="L120,8"]')).toBeTruthy();
  });

  it('Numbers section: members-by-type bar (34/54/12 + 42/67/15)', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Members by contribution type');
    for (const t of ['Capital · 42', 'Signals · 67', 'Access · 15']) {
      expect(root.textContent).toContain(t);
    }
  });

  it('Flow section: 5 nodes + connectors + mobile cards', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('The process');
    expect(root.textContent).toContain('fully auditable.');
    const nodes = Array.from(root.querySelectorAll('.flow-node'));
    expect(nodes.length).toBe(5);
    for (const t of ['Signal', 'Auto-checks', 'Vetting', 'Execution', 'Payout']) {
      expect(root.textContent).toContain(t);
    }
    expect(root.querySelectorAll('.connector').length).toBe(4);
    expect(root.textContent).toContain('Reputation-weighted vote');
  });

  it('Principles section: five numbered principles', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('What we believe');
    expect(root.textContent).toContain('Five principles.');
    for (const t of [
      'Real value creation',
      'Meritocratic reputation',
      'Radical transparency',
      'No recruitment dependency',
      'AI assists, humans decide',
    ]) {
      expect(root.textContent).toContain(t);
    }
  });

  it('Testimonials: three quote cards with members', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Why members stay');
    for (const t of [
      'Sofia R.',
      'Marcus K.',
      'Amelia T.',
      '14 signals',
      'Access provider',
      'proposer',
    ]) {
      expect(root.textContent).toContain(t);
    }
  });

  it('CTA section: create account + view live opportunities CTAs', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Your capital. Your signal.');
    expect(root.textContent).toContain('Create your account');
    expect(root.textContent).toContain('View live opportunities');
    const create = Array.from(root.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Create your account'),
    ) as HTMLAnchorElement | null;
    expect(create?.getAttribute('href')).toContain('/register');
  });

  it('footer: copyright + Product/Community/Account columns', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('© 2026 MERIDIAN · member-owned cooperative');
    for (const t of [
      'Opportunities',
      'Executions',
      'Pool',
      'Payouts',
      'Governance',
      'Submit signal',
      'Sign in',
      'Create account',
    ]) {
      expect(root.textContent).toContain(t);
    }
  });

  it('does NOT render the ui-shell (shell-less root page)', async () => {
    const fixture = await renderStandalone();
    expect(fixture.nativeElement.querySelector('ui-shell')).toBeNull();
  });
});
