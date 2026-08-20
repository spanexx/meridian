/**
 * GovernancePageComponent — per-community governance view.
 *
 * Renders per wireframe/meridian/governance/index.html:
 *   - breadcrumb: ← {communityName} / Governance (matches the
 *     community-members / community-settings breadcrumb pattern)
 *   - header: page title "Governance" + subtitle + Propose change button
 *   - Propose modal (Parameter select, proposed value, rationale, info banner, cancel/submit)
 *   - Active Proposals card (2 proposals with approve/reject tally + Approve/Reject buttons)
 *   - Community-Governed Parameters grid (5 cards: ROI floor, Win-rate target, Reserve target, Single-execution cap, Distribution shares with link to /payouts)
 *   - Sidebar: Safety Rails (5 read-only items) + Recent Votes (4 history rows)
 *
 * Route: /community/:id/governance — proposals and parameters belong
 * to a community, not to the platform. The :id input binds to the
 * community ref and defaults to 'alpha' so the page renders before
 * the route binds. The legacy /governance route stays as an alias
 * pointing to /community/alpha/governance (same pattern as PR #45).
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { GovernancePageComponent, toParameterViewModel, toProposalViewModel, toRecentVotesViewModel, toSafetyRailsViewModel } from './governance.page';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { ApiClient } from '../../../core/api/api-client';
import {
  SEED_GOVERNANCE_PARAMETERS,
  SEED_PROPOSALS,
  SEED_RECENT_VOTES,
  SEED_SAFETY_RAILS,
} from '../../../core/api/mock-seed';

async function renderPage(communityId = 'alpha') {
  const mockClient = {
    governanceProposals: vi.fn().mockResolvedValue({ proposals: SEED_PROPOSALS }),
    governanceParameters: vi.fn().mockResolvedValue({ parameters: SEED_GOVERNANCE_PARAMETERS }),
    governanceSafetyRails: vi.fn().mockResolvedValue({ rails: SEED_SAFETY_RAILS }),
    governanceRecentVotes: vi.fn().mockResolvedValue({ votes: SEED_RECENT_VOTES }),
    governanceVote: vi.fn().mockResolvedValue({
      vote_id: 'vote_x',
      proposal_id: 'prop_001',
      vote: 'approve',
      weight: 1,
      tally: {
        approve_weighted: 8,
        reject_weighted: 2,
        required_weighted_votes: 5,
        approvals_remaining: 0,
        your_weight_if_eligible: 1,
        has_voted: true,
      },
      reputation_earned: 1,
    }),
  } as unknown as ApiClient;
  await TestBed.configureTestingModule({
    imports: [GovernancePageComponent, UiIconComponent],
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient }],
  }).compileComponents();
  const fixture = TestBed.createComponent(GovernancePageComponent);
  fixture.componentRef.setInput('id', communityId);
  fixture.detectChanges();
  // The constructor loads governance data async — settle the microtasks
  // so seeded content is present for the queried DOM (Job E async load).
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
  return fixture;
}

describe('GovernancePageComponent', () => {
  // ─── Header ────────────────────────────────────────────────────────────
  it('renders the page title "Governance"', async () => {
    const f = await renderPage();
    const h1 = (f.nativeElement as HTMLElement).querySelector('h1.page-title');
    expect(h1?.textContent?.trim()).toBe('Governance');
  });

  it('renders subtitle about Community-Governed Parameters + Vetter voting', async () => {
    const f = await renderPage();
    const sub = (f.nativeElement as HTMLElement).querySelector('.page-subtitle');
    expect(sub?.textContent).toContain('Community-Governed Parameters');
    expect(sub?.textContent).toContain('VETTER');
    expect(sub?.textContent).toContain('reputation');
  });

  it('renders a Propose change button that opens the propose modal', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { proposeModalOpen: () => boolean };
    expect(c.proposeModalOpen).toBe(false);
    const root = f.nativeElement as HTMLElement;
    const btn = root.querySelector('[data-action="open-propose-modal"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Propose change');
    btn.click();
    f.detectChanges();
    expect(c.proposeModalOpen).toBe(true);
  });

  // ─── Propose Modal ─────────────────────────────────────────────────────
  it('renders the propose modal with 3 form fields (Parameter, Proposed value, Rationale)', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openProposeModal: () => void };
    c.openProposeModal();
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const modal = root.querySelector('[data-testid="propose-modal"]') as HTMLElement;
    expect(modal).toBeTruthy();
    // ui-modal renders the title in its own header; the form lives inside.
    expect(root.querySelector('.modal-title')?.textContent).toContain('Propose a parameter change');
    const inputs = modal.querySelectorAll('select, input, textarea');
    expect(inputs.length).toBe(3);
  });

  it('propose modal: Parameter select lists 6 options', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openProposeModal: () => void; parameterOptions: () => readonly string[] };
    c.openProposeModal();
    f.detectChanges();
    expect(c.parameterOptions()).toEqual([
      'ROI floor', 'Win-rate target', 'Distribution shares',
      'Reserve ratio target', 'Vetting thresholds', 'Single-execution cap',
    ]);
  });

  it('propose modal info banner mentions safety rails cannot be voted on', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { openProposeModal: () => void };
    c.openProposeModal();
    f.detectChanges();
    const banner = (f.nativeElement as HTMLElement).querySelector('[data-testid="propose-info-banner"]') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Safety rails');
    expect(banner.textContent).toContain('never be voted on');
  });

  it('propose modal: cancel closes without submitting', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      openProposeModal: () => void;
      closeProposeModal: () => void;
      proposeModalOpen: () => boolean;
    };
    c.openProposeModal();
    expect(c.proposeModalOpen).toBe(true);
    c.closeProposeModal();
    expect(c.proposeModalOpen).toBe(false);
  });

  it('propose modal: submitProposal closes modal and stamps lastProposalSummary', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      openProposeModal: () => void;
      setProposeParameter: (v: string) => void;
      setProposeValue: (v: string) => void;
      setProposeRationale: (v: string) => void;
      submitProposal: () => void;
      proposeModalOpen: () => boolean;
      lastProposalSummary: () => string | null;
      proposalsCount: () => number;
    };
    c.openProposeModal();
    c.setProposeParameter('Win-rate target');
    c.setProposeValue('75%');
    c.setProposeRationale('Recent executions justify raising the target.');
    c.submitProposal();
    expect(c.proposeModalOpen).toBe(false);
    expect(c.lastProposalSummary).toBe('Win-rate target → 75%');
    expect(c.proposalsCount).toBe(1);
  });

  // ─── Active Proposals ────────────────────────────────────────────────
  it('renders the Active Proposals section with "2 open" badge', async () => {
    const f = await renderPage();
    const root = f.nativeElement as HTMLElement;
    const section = root.querySelector('[data-testid="active-proposals-section"]') as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.textContent).toContain('Active Proposals');
    expect(section.textContent).toContain('2 open');
    expect(section.textContent).toContain('22 hours');
  });

  it('renders 2 proposal cards each with tally + Approve/Reject buttons', async () => {
    const f = await renderPage();
    const section = (f.nativeElement as HTMLElement).querySelector('[data-testid="active-proposals-section"]') as HTMLElement;
    const proposals = section.querySelectorAll('[data-testid="proposal-card"]');
    expect(proposals.length).toBe(2);
    const approveButtons = section.querySelectorAll('[data-vote-type="approve"]');
    const rejectButtons = section.querySelectorAll('[data-vote-type="reject"]');
    expect(approveButtons.length).toBe(2);
    expect(rejectButtons.length).toBe(2);
  });

  it('first proposal renders "Raise ROI floor to 18%" with tally 7 approve / 2 reject', async () => {
    const f = await renderPage();
    const section = (f.nativeElement as HTMLElement).querySelector('[data-testid="active-proposals-section"]') as HTMLElement;
    const p1 = section.querySelectorAll('[data-testid="proposal-card"]')[0] as HTMLElement;
    expect(p1.textContent).toContain('Raise ROI floor to 18%');
    expect(p1.querySelector('[data-count-approve]')?.textContent).toBe('7');
    expect(p1.querySelector('[data-count-reject]')?.textContent).toBe('2');
  });

  it('second proposal renders "Win-rate target 70% → 75%" with tally 4/3', async () => {
    const f = await renderPage();
    const section = (f.nativeElement as HTMLElement).querySelector('[data-testid="active-proposals-section"]') as HTMLElement;
    const p2 = section.querySelectorAll('[data-testid="proposal-card"]')[1] as HTMLElement;
    expect(p2.textContent).toContain('Win-rate target 70%');
    expect(p2.textContent).toContain('75%');
    expect(p2.querySelector('[data-count-approve]')?.textContent).toBe('4');
    expect(p2.querySelector('[data-count-reject]')?.textContent).toBe('3');
  });

  it('clicking Approve calls the vote API and applies the server tally', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      onVoteApprove: (id: string) => Promise<void>;
      voteCount: (id: string, kind: string) => number;
    };
    const mock = TestBed.inject(ApiClient) as unknown as { governanceVote: ReturnType<typeof vi.fn> };
    expect(c.voteCount('prop_001', 'approve')).toBe(7);
    await c.onVoteApprove('prop_001');
    f.detectChanges();
    // Server truth: the mock resolves a tally of 8/2 for the vote payload.
    expect(mock.governanceVote).toHaveBeenCalledWith('prop_001', { vote: 'approve' });
    expect(c.voteCount('prop_001', 'approve')).toBe(8);
  });

  it('clicking Reject calls the vote API with "reject"', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      onVoteReject: (id: string) => Promise<void>;
      voteCount: (id: string, kind: string) => number;
    };
    const mock = TestBed.inject(ApiClient) as unknown as { governanceVote: ReturnType<typeof vi.fn> };
    mock.governanceVote.mockResolvedValue({
      vote_id: 'vote_y', proposal_id: 'prop_002', vote: 'reject', weight: 1,
      tally: { approve_weighted: 4, reject_weighted: 4, required_weighted_votes: 5, approvals_remaining: 1, your_weight_if_eligible: 1, has_voted: true },
      reputation_earned: 1,
    });
    expect(c.voteCount('prop_002', 'reject')).toBe(3);
    await c.onVoteReject('prop_002');
    f.detectChanges();
    expect(mock.governanceVote).toHaveBeenCalledWith('prop_002', { vote: 'reject' });
    expect(c.voteCount('prop_002', 'reject')).toBe(4);
  });

  // ─── Community-Governed Parameters ────────────────────────────────────
  it('renders Parameters grid with 5 parameter cards', async () => {
    const f = await renderPage();
    const grid = (f.nativeElement as HTMLElement).querySelector('[data-testid="parameters-grid"]') as HTMLElement;
    expect(grid).toBeTruthy();
    const cards = grid.querySelectorAll('[data-testid="parameter-card"]');
    expect(cards.length).toBe(5);
    expect(grid.textContent).toContain('ROI floor');
    expect(grid.textContent).toContain('Win-rate target');
    expect(grid.textContent).toContain('Reserve target');
    expect(grid.textContent).toContain('Single-execution cap');
    expect(grid.textContent).toContain('Distribution shares');
  });

  it('Distribution shares card links to /payouts', async () => {
    const f = await renderPage();
    const grid = (f.nativeElement as HTMLElement).querySelector('[data-testid="parameters-grid"]') as HTMLElement;
    const payoutLink = Array.from(grid.querySelectorAll('a')).find(a =>
      a.textContent?.includes('See payouts'),
    );
    expect(payoutLink).toBeTruthy();
    expect(payoutLink?.getAttribute('href')).toBe('/payouts');
  });

  it('Distribution shares card lists 5 distribution categories', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { distributionShares: () => readonly { name: string; value: string }[] };
    const dists = c.distributionShares();
    expect(dists.length).toBe(5);
    const names = dists.map((d) => d.name);
    expect(names).toContain('Capital');
    expect(names).toContain('Signal');
    expect(names).toContain('Access');
    expect(names).toContain('Ops');
    expect(names).toContain('Platform');
  });

  it('parameters() returns 5 entries with label + currentValue + provenance', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      parameters: () => readonly { label: string; currentValue: string; setDate: string; approvalPct: number }[];
    };
    const params = c.parameters();
    expect(params.length).toBe(5);
    for (const p of params) {
      expect(p.label).toBeTruthy();
      expect(p.currentValue).toBeTruthy();
      expect(p.setDate).toBeTruthy();
      expect(p.approvalPct).toBeGreaterThan(0);
    }
  });

  // ─── Sidebar ──────────────────────────────────────────────────────────
  it('renders Safety Rails sidebar card with 5 items', async () => {
    const f = await renderPage();
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="safety-rails-card"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Safety Rails');
    expect(card.textContent).toContain('Never community-voted');
    const items = card.querySelectorAll('[data-testid="safety-rail-item"]');
    expect(items.length).toBe(5);
    expect(card.textContent).toContain('Reconciliation');
    expect(card.textContent).toContain('No-ponzi');
    expect(card.textContent).toContain('KYC');
  });

  it('renders Recent Votes sidebar card with 4 history entries', async () => {
    const f = await renderPage();
    const card = (f.nativeElement as HTMLElement).querySelector('[data-testid="recent-votes-card"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Recent Votes');
    const entries = card.querySelectorAll('[data-testid="recent-vote-entry"]');
    expect(entries.length).toBe(4);
  });

  it('safetyRails() returns the 5 fixed items', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as { safetyRails: () => readonly string[] };
    const rails = c.safetyRails();
    expect(rails.length).toBe(5);
    expect(rails[0]).toContain('Reconciliation');
    expect(rails[rails.length - 1]).toContain('Technical');
  });

  it('recentVotes() returns 4 history entries with title + date + approvalPct + passed', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      recentVotes: () => readonly { title: string; date: string; approvalPct: number; passed: boolean }[];
    };
    const votes = c.recentVotes();
    expect(votes.length).toBe(4);
    expect(votes.filter((v) => v.passed).length).toBe(3);
    expect(votes.filter((v) => !v.passed).length).toBe(1);
  });

  it('activeProposals() returns 2 proposals with tally +0 votes', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      activeProposals: () => readonly { title: string; approve: number; reject: number }[];
    };
    const props = c.activeProposals();
    expect(props.length).toBe(2);
    expect(props[0].approve).toBe(7);
    expect(props[0].reject).toBe(2);
  });

  // ─── Getter symmetry (paired with the setPropose* setters) ───────────────

  it('getProposeParameter() returns the parameter that was set', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setProposeParameter: (v: string) => void;
      getProposeParameter: () => string;
    };
    c.setProposeParameter('Single-execution cap');
    expect(c.getProposeParameter()).toBe('Single-execution cap');
  });

  it('getProposeValue() returns the value that was set', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setProposeValue: (v: string) => void;
      getProposeValue: () => string;
    };
    c.setProposeValue('7%');
    expect(c.getProposeValue()).toBe('7%');
  });

  it('getProposeRationale() returns the rationale that was set', async () => {
    const f = await renderPage();
    const c = f.componentInstance as unknown as {
      setProposeRationale: (v: string) => void;
      getProposeRationale: () => string;
    };
    c.setProposeRationale('Burn-out risk is increasing.');
    expect(c.getProposeRationale()).toBe('Burn-out risk is increasing.');
  });  // ─── Per-community breadcrumb + input binding ────────────────────────────
  it('renders a breadcrumb "← {communityName} / Governance"', async () => {
    const f = await renderPage();
    const bc = f.nativeElement.querySelector('[data-testid=governance-breadcrumb]') as HTMLElement;
    expect(bc).toBeTruthy();
    const text = bc.textContent ?? '';
    expect(text).toContain('Alpha Syndicate');
    expect(text).toContain('Governance');
    const backLink = bc.querySelector('a') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toBe('/community-detail/alpha');
  });

  it('id defaults to "alpha" so the page renders before the route binds', async () => {
    // renderPage() with no args uses the default 'alpha'. No explicit
    // setInput call — input stays at its field default.
    const f = await renderPage();
    const c = f.componentInstance as unknown as { id: () => string };
    expect(c.id()).toBe('alpha');
  });

  // ─── Canonical → view mappers (Job E; pure + unit-tested) ────────────
  it('toProposalViewModel maps canonical rows into the wireframe view model', () => {
    const rows = toProposalViewModel(SEED_PROPOSALS);
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('prop_001');
    expect(rows[0].title).toBe('Raise ROI floor to 18%');
    expect(rows[0].proposer).toBe('Dana Voss');
    expect(rows[0].proposerTier).toBe('T4');
    expect(rows[0].requiredVotes).toBe(5);
    expect(rows[0].approve).toBe(7);
    expect(rows[0].reject).toBe(2);
    expect(rows[1].title).toBe('Win-rate target 70% → 75%');
    expect(rows[1].approve).toBe(4);
    expect(rows[1].reject).toBe(3);
  });

  it('toParameterViewModel maps canonical parameters + applies presentation provenance', () => {
    const rows = toParameterViewModel(SEED_GOVERNANCE_PARAMETERS);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ label: 'ROI floor', currentValue: '15%', setDate: 'Feb 14', approvalPct: 87 });
    expect(rows[4].label).toBe('Distribution shares');
    expect(rows[4].currentValue).toBe('46/30/12/8/4');
  });

  it('toSafetyRailsViewModel surfaces canonical labels verbatim', () => {
    const rails = toSafetyRailsViewModel(SEED_SAFETY_RAILS);
    expect(rails).toHaveLength(5);
    expect(rails[0]).toContain('Reconciliation');
    expect(rails[rails.length - 1]).toContain('Technical');
  });

  it('toRecentVotesViewModel maps title/date/%/passed from canonical rows', () => {
    const votes = toRecentVotesViewModel(SEED_RECENT_VOTES);
    expect(votes).toHaveLength(4);
    expect(votes[0].title).toBe('ROI floor 15%');
    expect(votes[0].date).toBe('Feb 14');
    expect(votes[0].approvalPct).toBe(87);
    expect(votes[0].passed).toBe(true);
    expect(votes.filter((v) => v.passed).length).toBe(3);
    expect(votes.filter((v) => !v.passed).length).toBe(1);
  });
});
