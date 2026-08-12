/**
 * GovernancePageComponent — community governance (proposals, votes, parameters).
 *
 * Renders per wireframe/meridian/governance/index.html.
 * Sections:
 *   - header: title + Propose change button
 *   - Propose modal (form)
 *   - Active Proposals card (vote tally + Approve/Reject)
 *   - Community-Governed Parameters grid (5 cards)
 *   - Sidebar: Safety Rails + Recent Votes
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { UiModalComponent } from '../../ui/modal/modal.component';

interface Proposal {
  readonly id: number;
  readonly title: string;
  readonly proposer: string;
  readonly proposerTier: string;
  readonly rationale: string;
  readonly hoursLeft: number;
  readonly requiredVotes: number;
  approve: number;
  reject: number;
}

interface Parameter {
  readonly label: string;
  readonly currentValue: string;
  readonly setDate: string;
  readonly approvalPct: number;
}

interface DistributionShare {
  readonly name: string;
  readonly value: string;
}

interface RecentVote {
  readonly title: string;
  readonly date: string;
  readonly approvalPct: number;
  readonly passed: boolean;
}

const PARAMETER_OPTIONS: ReadonlyArray<string> = [
  'ROI floor',
  'Win-rate target',
  'Distribution shares',
  'Reserve ratio target',
  'Vetting thresholds',
  'Single-execution cap',
];

const PARAMETERS: ReadonlyArray<Parameter> = [
  { label: 'ROI floor', currentValue: '15%', setDate: 'Feb 14', approvalPct: 87 },
  { label: 'Win-rate target', currentValue: '70%', setDate: 'Jan 8', approvalPct: 81 },
  { label: 'Reserve target', currentValue: '12%', setDate: 'Dec 12', approvalPct: 90 },
  { label: 'Single-execution cap', currentValue: '$50k', setDate: 'Nov 30', approvalPct: 84 },
];

const DISTRIBUTION_SHARES: ReadonlyArray<DistributionShare> = [
  { name: 'Capital', value: '46%' },
  { name: 'Signal', value: '30%' },
  { name: 'Access', value: '12%' },
  { name: 'Ops', value: '8%' },
  { name: 'Platform', value: '4%' },
];

const SAFETY_RAILS: ReadonlyArray<string> = [
  'Reconciliation & audit trail',
  'No-ponzi · no unearned returns',
  'KYC & identity rules',
  'Human control over money & reputation',
  'Technical architecture (kernel/engines/providers)',
];

const RECENT_VOTES: ReadonlyArray<RecentVote> = [
  { title: 'ROI floor 15%', date: 'Feb 14', approvalPct: 87, passed: true },
  { title: 'Vetting timeout 48h', date: 'Jan 22', approvalPct: 76, passed: true },
  { title: 'Deployment cap 50%', date: 'Jan 8', approvalPct: 72, passed: true },
  { title: 'Reserve floor 15%', date: 'Dec 3', approvalPct: 41, passed: false },
];

@Component({
  selector: 'app-governance-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, UiModalComponent],
  templateUrl: './governance.template.html',
})
export class GovernancePageComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  // Mutable active proposals (vote tally can change via Approve/Reject).
  private readonly _proposals: Proposal[] = [
    {
      id: 0,
      title: 'Raise ROI floor to 18%',
      proposer: 'Dana Voss',
      proposerTier: 'T4',
      rationale: 'Market conditions support a higher floor.',
      hoursLeft: 22,
      requiredVotes: 5,
      approve: 7,
      reject: 2,
    },
    {
      id: 1,
      title: 'Win-rate target 70% → 75%',
      proposer: 'Ravi Kumar',
      proposerTier: 'T4',
      rationale: 'Recent execution quality supports a tighter target.',
      hoursLeft: 22,
      requiredVotes: 5,
      approve: 4,
      reject: 3,
    },
  ];

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

  parameterOptions(): ReadonlyArray<string> { return PARAMETER_OPTIONS; }
  parameters(): ReadonlyArray<Parameter> {
    return [
      ...PARAMETERS,
      {
        label: 'Distribution shares',
        currentValue: '46/30/12/8/4',
        setDate: 'Feb 14',
        approvalPct: 87,
      },
    ];
  }
  distributionShares(): ReadonlyArray<DistributionShare> { return DISTRIBUTION_SHARES; }
  safetyRails(): ReadonlyArray<string> { return SAFETY_RAILS; }
  recentVotes(): ReadonlyArray<RecentVote> { return RECENT_VOTES; }
  activeProposals(): ReadonlyArray<Proposal> { return this._proposals; }

  /** Read-only tally accessor used by the template + tests. */
  voteCount(id: number, kind: 'approve' | 'reject'): number {
    const p = this._proposals.find((x) => x.id === id);
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

  /** User-facing Approve click on a proposal: increments tally. */
  onVoteApprove(id: number): void {
    const p = this._proposals.find((x) => x.id === id);
    if (p) p.approve += 1;
    this.cdr.markForCheck();
  }
  onVoteReject(id: number): void {
    const p = this._proposals.find((x) => x.id === id);
    if (p) p.reject += 1;
    this.cdr.markForCheck();
  }
}
