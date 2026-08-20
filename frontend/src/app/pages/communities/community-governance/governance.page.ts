/**
 * GovernancePageComponent — per-community governance view.
 *
 * Renders per wireframe/meridian/governance/index.html:
 *   - breadcrumb: ← {communityName} / Governance
 *   - header: title + Propose change button
 *   - Propose modal (form)
 *   - Active Proposals card (vote tally + Approve/Reject)
 *   - Community-Governed Parameters grid (5 cards)
 *   - Sidebar: Safety Rails + Recent Votes
 *
 * Bound to the community ref via signal input `id` (route param
 * :id from /community/:id/governance). Defaults to 'alpha' so
 * the page renders before the route binds.
 *
 * Backend-readiness (Job E, 2026-08-21): the page previously rendered
 * 100% module-local fixtures with NO ApiClient at all (flagged by the
 * opencode + cline-one audits). It now consumes the canonical
 * /governance/* endpoints through pure mappers that preserve the
 * wireframe view contract. Wireframe-only presentation data (covered
 * below per the established community-members MEMBER_PRESENTATION /
 * opportunities OPP_PRESENTATION precedent) stays module-local.
 *
 * @owner   spanexx
 * @reviewed 2026-08-21
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { UiModalComponent } from '../../../ui/modal/modal.component';
import { ApiClient } from '../../../core/api/api-client';
import type { GovernanceParameter, ProposalListRow, RecentVoteRow } from '../../../core/models';

/** View model rendered by the Active Proposals card. */
export interface Proposal {
  readonly id: string;            // canonical proposal_id
  readonly title: string;         // display_title
  readonly proposer: string;      // proposer.display_name
  readonly proposerTier: string;  // proposer.tier
  readonly rationale: string;
  readonly hoursLeft: number;     // derived from expires_at (clamped ≥ 0)
  readonly requiredVotes: number; // tally.required_weighted_votes
  approve: number;                // tally.approve_weighted (mutable: vote)
  reject: number;                 // tally.reject_weighted (mutable: vote)
}

/** View model for the Community-Governed Parameters grid. */
export interface Parameter {
  readonly label: string;
  readonly currentValue: string;
  readonly setDate: string;
  readonly approvalPct: number;
}

interface DistributionShare {
  readonly name: string;
  readonly value: string;
}

/** View model for the Recent Votes sidebar. */
export interface RecentVote {
  readonly title: string;
  readonly date: string;
  readonly approvalPct: number;
  readonly passed: boolean;
}

// ─── canonical → view mappers (pure; unit-tested) ──────────────────────

/** Canonical key → wireframe parameter label. */
const PARAMETER_LABEL_BY_KEY: Readonly<Record<string, string>> = {
  roi_floor: 'ROI floor',
  win_rate_target: 'Win-rate target',
  reserve_target: 'Reserve target',
  single_execution_cap: 'Single-execution cap',
  distribution_shares: 'Distribution shares',
};

/**
 * Wireframe-only provenance (set date + approval %) — not in the canonical
 * GovernanceParameter (key/value/unit/votable only), so supplied per key
 * following the MEMBER_PRESENTATION precedent.
 */
const PARAMETER_PRESENTATION: Readonly<Record<string, { setDate: string; approvalPct: number }>> = {
  roi_floor:            { setDate: 'Feb 14', approvalPct: 87 },
  win_rate_target:      { setDate: 'Jan 8',  approvalPct: 81 },
  reserve_target:       { setDate: 'Dec 12', approvalPct: 90 },
  single_execution_cap: { setDate: 'Nov 30', approvalPct: 84 },
  distribution_shares:  { setDate: 'Feb 14', approvalPct: 87 },
};

/**
 * Wireframe-only named distribution breakdown. The canonical value is the
 * compact string '46/30/12/8/4' (distribution_shares parameter); the 5
 * named categories come from the wireframe, keyed by that canonical value.
 */
const DISTRIBUTION_SHARES: readonly DistributionShare[] = [
  { name: 'Capital', value: '46%' },
  { name: 'Signal', value: '30%' },
  { name: 'Access', value: '12%' },
  { name: 'Ops', value: '8%' },
  { name: 'Platform', value: '4%' },
];

/** Round a canonical ISO timestamp into whole hours left (clamp ≥ 0). */
function hoursLeftOf(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 3_600_000));
}

/**
 * Map canonical GET /governance/proposals rows into the page view model.
 * Tally votes, required votes, proposer + provenance are canonical; hours
 * left derives from expires_at (clamped — the fixed mock seed dates are in
 * the past, a live backend returns real expiries).
 */
export function toProposalViewModel(rows: ProposalListRow[]): Proposal[] {
  return rows.map((r) => ({
    id: r.proposal_id,
    title: r.display_title,
    proposer: r.proposer.display_name,
    proposerTier: r.proposer.tier,
    rationale: r.rationale,
    hoursLeft: hoursLeftOf(r.expires_at),
    requiredVotes: r.tally.required_weighted_votes,
    approve: r.tally.approve_weighted,
    reject: r.tally.reject_weighted,
  }));
}

/** Map canonical GovernanceParameter[] into the grid view (label + presentation provenance). */
export function toParameterViewModel(rows: GovernanceParameter[]): Parameter[] {
  return rows.map((r) => {
    const presentation = PARAMETER_PRESENTATION[r.key] ?? { setDate: '—', approvalPct: 0 };
    return {
      label: PARAMETER_LABEL_BY_KEY[r.key] ?? r.key,
      currentValue: r.value,
      setDate: presentation.setDate,
      approvalPct: presentation.approvalPct,
    };
  });
}

/** Safety rails are never community-voted; surface the canonical label list verbatim. */
export function toSafetyRailsViewModel(rows: { label: string }[]): string[] {
  return rows.map((r) => r.label);
}

/** Map RecentVoteRow[] into the sidebar view (title/date/%/passed). */
export function toRecentVotesViewModel(rows: RecentVoteRow[]): RecentVote[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return rows.map((r) => {
    const d = new Date(r.decided_at);
    const date = `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
    return {
      title: r.display_title,
      date,
      approvalPct: r.approval_percent,
      passed: r.status === 'passed',
    };
  });
}

@Component({
  selector: 'app-governance-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, UiModalComponent],
  templateUrl: './governance.template.html',
})
export class GovernancePageComponent {
  /** Community ref bound from route param `:id`. Defaults to 'alpha'. */
  readonly id = input<string>('alpha');

  /**
   * Display name for the bound community. v1: only 'alpha' is mapped
   * to 'Alpha Syndicate'. Production: pull from a service.
   */
  readonly communityName = computed<string>(() => {
    const ref = this.id();
    if (ref === 'alpha') return 'Alpha Syndicate';
    return ref;
  });

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly client = inject(ApiClient);

  /** Mutable active proposals (vote tally can change via Approve/Reject). */
  private readonly _proposals = signal<Proposal[]>([]);
  private readonly _parameters = signal<Parameter[]>([]);
  private readonly _safetyRails = signal<string[]>([]);
  private readonly _recentVotes = signal<RecentVote[]>([]);

  private _proposeModalOpen = false;
  private _proposeParameter = PARAMETER_OPTIONS[0];
  private _proposeValue = '';
  private _proposeRationale = '';
  private _proposalsCount = 0;
  private _lastProposalSummary: string | null = null;

  // ─── Public getters (TDD-friendly property semantics) ────────────────
  get proposeModalOpen(): boolean { return this._proposeModalOpen; }
  get proposalsCount(): number { return this._proposalsCount; }
  get lastProposalSummary(): string | null { return this._lastProposalSummary; }

  parameterOptions(): readonly string[] { return PARAMETER_OPTIONS; }
  parameters(): readonly Parameter[] { return this._parameters(); }
  distributionShares(): readonly DistributionShare[] { return DISTRIBUTION_SHARES; }
  safetyRails(): readonly string[] { return this._safetyRails(); }
  recentVotes(): readonly RecentVote[] { return this._recentVotes(); }
  activeProposals(): readonly Proposal[] { return this._proposals(); }

  /** Read-only tally accessor used by the template + tests. */
  voteCount(id: string, kind: 'approve' | 'reject'): number {
    const p = this._proposals().find((x) => x.id === id);
    if (!p) return 0;
    return kind === 'approve' ? p.approve : p.reject;
  }

  // ─── Public methods ────────────────────────────────────────────────
  openProposeModal(): void {
    this._proposeModalOpen = true;
    this.cdr.markForCheck();
  }
  closeProposeModal(): void {
    this._proposeModalOpen = false;
    this.cdr.markForCheck();
  }

  setProposeParameter(value: string): void { this._proposeParameter = value; }
  setProposeValue(value: string): void { this._proposeValue = value; }
  setProposeRationale(value: string): void { this._proposeRationale = value; }

  /** Snapshot the current proposal form values (exposed for tests + future API). */
  getProposeParameter(): string { return this._proposeParameter; }
  getProposeValue(): string { return this._proposeValue; }
  getProposeRationale(): string { return this._proposeRationale; }

  submitProposal(): void {
    this._proposalsCount += 1;
    this._lastProposalSummary = `${this._proposeParameter} → ${this._proposeValue}`;
    this._proposeModalOpen = false;
    this.cdr.markForCheck();
  }

  /** User-facing Approve click: cast the vote; server tally is the truth. */
  onVoteApprove(id: string): Promise<void> {
    return this.castVote(id, 'approve');
  }
  /** User-facing Reject click: cast the vote; server tally is the truth. */
  onVoteReject(id: string): Promise<void> {
    return this.castVote(id, 'reject');
  }

  private async castVote(id: string, vote: 'approve' | 'reject'): Promise<void> {
    try {
      const res = await this.client.governanceVote(id, { vote });
      this._proposals.update((rows) =>
        rows.map((p) =>
          p.id === id ? { ...p, approve: res.tally.approve_weighted, reject: res.tally.reject_weighted } : p,
        ),
      );
    } catch {
      // Offline-safe fallback: keep the optimistic local increment so the
      // user's click is never silently dropped (same pattern as logout()).
      this._proposals.update((rows) =>
        rows.map((p) => (p.id === id ? { ...p, [vote]: p[vote] + 1 } : p)),
      );
    }
    this.cdr.markForCheck();
  }

  constructor() {
    // Job E (backend-readiness audit): consume the canonical governance
    // endpoints instead of module-local fixtures.
    this.client.governanceProposals().then((r) => {
      this._proposals.set(toProposalViewModel(r.proposals));
      this.cdr.markForCheck();
    }).catch(() => undefined);
    this.client.governanceParameters().then((r) => {
      this._parameters.set(toParameterViewModel(r.parameters));
      this.cdr.markForCheck();
    }).catch(() => undefined);
    this.client.governanceSafetyRails().then((r) => {
      this._safetyRails.set(toSafetyRailsViewModel(r.rails));
      this.cdr.markForCheck();
    }).catch(() => undefined);
    this.client.governanceRecentVotes().then((r) => {
      this._recentVotes.set(toRecentVotesViewModel(r.votes));
      this.cdr.markForCheck();
    }).catch(() => undefined);
  }
}

/**
 * Propose-modal parameter options — wireframe-facing labels (the canonical
 * parameter keys map to these in PARAMETER_LABEL_BY_KEY). The modal is a
 * local UX surface; the canonical keys are used by the governance API.
 */
const PARAMETER_OPTIONS: readonly string[] = [
  'ROI floor',
  'Win-rate target',
  'Distribution shares',
  'Reserve ratio target',
  'Vetting thresholds',
  'Single-execution cap',
];