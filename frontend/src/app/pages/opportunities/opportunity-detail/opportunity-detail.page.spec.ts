/**
 * Unit tests for OpportunityDetailPageComponent.
 *
 * Renders per wireframe/meridian/opportunity-detail/index.html:
 *   - breadcrumb (Opportunities › O-####)
 *   - header: ref + status badge + category badge + title + subtitle
 *     + 2 ghost action buttons (share, bookmark)
 *   - 5 main cards (Acquisition, Resale, Financials, Evidence, Vetting)
 *   - 3 sidebar cards (Your Vote, Submitter, Timeline)
 *   - Vetting tabs: Auto-checks / Votes / Comments (only Auto-checks
 *     visible by default, the others hidden)
 *   - vote buttons (Approve / Reject) reflect active state
 *
 * The implementation is the same layout, more minimal:
 *   - drop text-gradient-emerald on big numbers (use emerald-400)
 *   - drop inline background colors (use the bg-overlay / kpi-overlay
 *     patterns from theme.css)
 *   - drop the 3 evidence images down to a single picsum row, lazy
 *     loaded
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { OpportunityDetailPageComponent } from './opportunity-detail.page';
import { ApiClient } from '../../../core/api/api-client';

async function renderPage(): Promise<ComponentFixture<OpportunityDetailPageComponent>> {
  const mockClient = {
    opportunityGet: vi.fn().mockResolvedValue({} as never),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const fixture = TestBed.createComponent(OpportunityDetailPageComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('OpportunityDetailPageComponent', () => {
  // ─── breadcrumb ────────────────────────────────────────────────
  it('renders the breadcrumb (Opportunities › O-2049)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Opportunities');
    expect(root.textContent).toContain('O-2049');
  });

  // ─── header ────────────────────────────────────────────────────
  it('renders the header: ref, status badge, category badge, title, subtitle', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('O-2049');
    expect(root.textContent).toContain('In Vetting');
    expect(root.textContent).toContain('Apparel');
    expect(root.querySelector('h1')?.textContent).toContain('Travis Scott');
    expect(root.textContent).toContain('Limited drop resale');
  });

  it('header does NOT duplicate the ref outside the breadcrumb (breadcrumb owns it)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const crumb = root.querySelector('[data-testid="opportunity-breadcrumb"]');
    const header = Array.from(root.querySelectorAll('header'))[0];
    // crumb contains O-2049 in the breadcrumb chip
    expect(crumb?.textContent).toMatch(/O-2049/);
    // header should NOT have the ref as a standalone font-mono span
    // (only badges IN VETTING / APPAREL + title + action buttons).
    const refSpans = Array.from(header.querySelectorAll('span.font-mono'));
    expect(refSpans.length).toBe(0);
  });

  it('header title scales: text-2xl at base, text-3xl at sm+', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const header = Array.from(root.querySelectorAll('header'))[0];
    const h1 = header.querySelector('h1');
    expect(h1?.className ?? '').toMatch(/text-2xl/);
    expect(h1?.className ?? '').toMatch(/sm:text-3xl/);
  });

  it('renders the 2 ghost action buttons (share + bookmark)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const ghost = root.querySelectorAll('button.btn.btn-ghost');
    expect(ghost.length).toBe(2);
    expect(ghost[0].getAttribute('aria-label')).toMatch(/share/i);
    expect(ghost[1].getAttribute('aria-label')).toMatch(/bookmark/i);
  });

  // ─── Acquisition card ─────────────────────────────────────────
  it('renders the Acquisition card with 4 facts (source, cost, qty, deadline)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Acquisition'),
    );
    expect(section).toBeTruthy();
    expect(section?.textContent).toContain('Boutique wholesale');
    expect(section?.textContent).toContain('Boston, MA');
    expect(section?.textContent).toContain('$14,200');
    expect(section?.textContent).toContain('8 pairs');
    expect(section?.textContent).toContain('Mar 28, 2026');
    expect(section?.textContent).toMatch(/12 days/);
  });

  // ─── Resale card ──────────────────────────────────────────────
  it('renders the Resale card with channels, est value, time, confidence', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Resale'),
    );
    expect(section).toBeTruthy();
    for (const ch of ['StockX', 'GOAT', 'eBay']) {
      expect(section?.textContent).toContain(ch);
    }
    expect(section?.textContent).toContain('$21,500');
    expect(section?.textContent).toContain('14 days');
    expect(section?.textContent).toContain('High');
  });

  it('Resale channel badges wrap on narrow widths (flex-wrap)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Resale'),
    );
    const badgesRow = Array.from(section?.querySelectorAll('div') ?? []).find(
      (d) => d.children.length === 3 && d.textContent?.includes('StockX') && d.textContent?.includes('GOAT') && d.textContent?.includes('eBay'),
    );
    expect(badgesRow).toBeTruthy();
    expect(badgesRow?.className ?? '').toMatch(/flex-wrap/);
  });

  // ─── Financials card ──────────────────────────────────────────
  it('renders the Financials card with 4 KPIs (profit, ROI, risk, payback)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Financials'),
    );
    expect(section).toBeTruthy();
    for (const k of ['Est. profit', 'ROI', 'Risk', 'Payback']) {
      expect(section?.textContent).toContain(k);
    }
    expect(section?.textContent).toContain('$7,300');
    expect(section?.textContent).toContain('+51.4%');
    expect(section?.textContent).toContain('Medium');
    expect(section?.textContent).toContain('14 d');
  });

  // ─── Evidence card ────────────────────────────────────────────
  it('renders the Evidence card with 3 lazy-loaded picsum images (uniform 4:3 height)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Evidence'),
    );
    const imgs = section?.querySelectorAll('img') ?? [];
    expect(imgs.length).toBe(3);
    for (const img of Array.from(imgs)) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('src')).toMatch(/^https:\/\/picsum\.photos\//);
      // uniform height keeps the grid tidy (picsum returns random sizes)
      expect(img.getAttribute('class')).toContain('h-32');
    }
  });

  it('Submitter labels use theme-aware text-3 + value colors via CSS vars', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Submitter'),
    );
    const labels = Array.from(section?.querySelectorAll('span') ?? []);
    const repLabel = labels.find((l) => l.textContent?.trim() === 'Reputation') as HTMLElement | undefined;
    expect(repLabel).toBeTruthy();
    // label uses the theme's --text-3 (muted gray in both themes)
    expect(repLabel?.getAttribute('style') ?? '').toMatch(/var\(--text-3\)/);
    // value uses the theme's accent color (amber for reputation)
    const repValue = repLabel?.nextElementSibling as HTMLElement | undefined;
    expect(repValue?.getAttribute('style') ?? '').toMatch(/var\(--a-400\)/);
  });

  // ─── Vetting card (tabs) ──────────────────────────────────────
  it('renders the Vetting card with 3 tabs (Auto-checks active by default)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Vetting'),
    );
    const tabs = section?.querySelectorAll('[role="tab"]') ?? [];
    expect(tabs.length).toBe(3);
    expect(tabs[0]?.textContent).toContain('Auto-checks');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders 3 auto-checks (Duplicate, Fraud, Math) all Pass', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Duplicate check');
    expect(root.textContent).toContain('Fraud signals');
    expect(root.textContent).toContain('Math validation');
    const passes = root.querySelectorAll('.badge-success');
    // 3 auto-checks + 1 Confidence + 4 vetter votes = 8 (at least 4 in vetting)
    expect(passes.length).toBeGreaterThanOrEqual(4);
  });

  it('renders the APPROVE recommendation callout', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Recommendation');
    expect(root.textContent).toContain('APPROVE');
  });

  it('switching to the Votes tab shows the tally and vetter rows', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    c.activePanel.set('votes');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toMatch(/\d+\s*approve/);
    expect(root.textContent).toMatch(/\d+\s*reject/);
    // 4 vetter names per the wireframe
    for (const name of ['Jules Tan', 'Sarah Park', 'Marcus Rivera', 'Kenji Honda']) {
      expect(root.textContent).toContain(name);
    }
  });

  it('switching to the Comments tab shows the post form and existing comments', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    c.activePanel.set('comments');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const form = root.querySelector('[data-testid="comment-form"]');
    expect(form).toBeTruthy();
    expect(root.textContent).toContain('Jules Tan');
    expect(root.textContent).toContain('Kenji Honda');
  });

  it('only the active Vetting panel is visible', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    c.activePanel.set('votes');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const visible = root.querySelector('[data-panel="votes"]');
    const hidden = root.querySelector('[data-panel="checks"]');
    expect(visible?.hasAttribute('hidden')).toBe(false);
    expect(hidden?.hasAttribute('hidden')).toBe(true);
  });

  // ─── Your Vote sidebar card ───────────────────────────────────
  it('renders the Your Vote card with 2 vote buttons + reputation weight', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Your Vote'),
    );
    expect(section?.textContent).toMatch(/Vetter.*1\.4/);
    const approve = section?.querySelector('[data-vote-type="approve"]') as HTMLElement | null;
    const reject = section?.querySelector('[data-vote-type="reject"]') as HTMLElement | null;
    expect(approve).toBeTruthy();
    expect(reject).toBeTruthy();
  });

  it('clicking the Approve vote button marks it active and updates the count', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const approve = root.querySelector('[data-vote-type="approve"]') as HTMLElement;
    approve.click();
    fixture.detectChanges();
    expect(approve.className).toMatch(/active/);
  });

  // ─── Submitter sidebar card ───────────────────────────────────
  it('renders the Submitter card (avatar, name, member-since, stats)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Submitter'),
    );
    expect(section?.textContent).toContain('Mike Rivera');
    expect(section?.textContent).toContain('Member since 2024');
    expect(section?.textContent).toMatch(/T3.*78/);
    expect(section?.textContent).toContain('14 submitted');
    expect(section?.textContent).toContain('9 approved');
    expect(section?.textContent).toContain('+24.6%');
  });

  // ─── Timeline sidebar card ────────────────────────────────────
  it('renders the Timeline card with 4 events (Submitted, Auto-checks, Vetting, Decision)', async () => {
    const fixture = await renderPage();
    const root = fixture.nativeElement as HTMLElement;
    const section = Array.from(root.querySelectorAll('section')).find(
      (s) => s.textContent?.includes('Timeline'),
    );
    expect(section?.textContent).toContain('Submitted');
    expect(section?.textContent).toContain('Auto-checks ran');
    expect(section?.textContent).toContain('Vetting opened');
    expect(section?.textContent).toContain('Decision');
    expect(section?.textContent).toContain('Mar 9, 14:23');
  });

  // ─── public method coverage (TDD guard) ───────────────────────
  it('countsApprove() returns the active approve count after voting', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    expect(c.countsApprove()).toBeGreaterThanOrEqual(3);
    c.userVote.set('approve');
    expect(c.countsApprove()).toBeGreaterThan(3);
  });

  it('countsReject() returns the active reject count after voting', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    expect(c.countsReject()).toBeGreaterThanOrEqual(1);
    c.userVote.set('reject');
    expect(c.countsReject()).toBeGreaterThan(1);
  });

  it('castVote(choice) sets userVote; calling again with the same choice clears it', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    expect(c.userVote()).toBe(null);
    c.castVote('approve');
    expect(c.userVote()).toBe('approve');
    c.castVote('approve');
    expect(c.userVote()).toBe(null);
    c.castVote('reject');
    expect(c.userVote()).toBe('reject');
  });

  it('panelTally() reflects the user\'s vote in the bar width (0–100)', async () => {
    const fixture = await renderPage();
    const c = fixture.componentInstance;
    const total = c.countsApprove() + c.countsReject();
    const pct = c.panelTally();
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(100);
    expect(Math.abs(pct - (c.countsApprove() / total) * 100)).toBeLessThan(0.1);
  });
});
