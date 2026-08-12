/**
 * CommunityDetailPageComponent — per-community deep-dive view.
 *
 * Renders per wireframe/meridian/community-detail/index.html:
 *   - breadcrumb (Communities › <community name>)
 *   - header: 16x16 violet gradient avatar + users icon,
 *     title + Active/Proposed/Archived badge inline,
 *     subtitle (focus · scope · Founded YEAR),
 *     3 metadata chips (map-pin / calendar / hash),
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
 *       - Member Composition: 3 progress bars (Capital/Signal/
 *         Access) + "View all members" CTA
 *       - Safety Rails: 4 check-circle items + "Never community-
 *         governed. Fixed by design." subhead
 *
 * URL convention: dual route (/communities/:id and
 * /community-detail/:id) so callers can pick either pattern.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface CommunityData {
  readonly ref: string;
  readonly name: string;
  readonly status: 'active' | 'proposed' | 'archived';
  readonly focus: string;
  readonly scope: string;
  readonly region: string;
  readonly founded: string;
  readonly foundedYear: string;
  readonly id: string;
  readonly avatarGradient: 'violet' | 'amber' | 'blue';
  readonly minContribution: string;
  readonly aboutParagraph: string;
}

interface Kpi {
  readonly key: 'pool' | 'members' | 'roi' | 'executions';
  readonly label: string;
  readonly value: string;
  readonly valueClass: string;
  readonly iconName: string;
  readonly delta: string;
  readonly deltaClass: string;
  readonly deltaIcon: string;
}

interface GovernedParam {
  readonly key: string;
  readonly description: string;
  readonly value: string;
  readonly valueClass: string;
  readonly iconName: string;
  readonly iconClass: string;
  readonly iconBg: string;
  readonly updated: string;
}

interface RecentExecution {
  readonly ref: string;
  readonly title: string;
  readonly statusLine: string;
  readonly iconName: string;
  readonly iconClass: string;
  readonly iconBg: string;
  readonly roi: string;
  readonly deployed: string;
  readonly progressPct: number;
  readonly progressClass: string;
  readonly progressLabel: string;
  readonly progressLabelClass: string;
}

interface MemberSegment {
  readonly key: string;
  readonly count: number;
  readonly pct: number;
  readonly progressClass: string;
}

const COMMUNITIES: ReadonlyArray<CommunityData> = [
  {
    ref: 'alpha',
    name: 'MERIDIAN Alpha',
    status: 'active',
    focus: 'General arbitrage',
    scope: 'Global scope',
    region: 'Global',
    founded: 'March 2024',
    foundedYear: '2024',
    id: 'C-001',
    avatarGradient: 'violet',
    minContribution: '$1,000',
    aboutParagraph:
      'MERIDIAN Alpha is the founding community, focused on general arbitrage opportunities across multiple categories including electronics, collectibles, and fashion. The community operates globally and welcomes members from all regions.',
  },
];

const KPIS: ReadonlyArray<Kpi> = [
  {
    key: 'pool',
    label: 'Total Pool',
    value: '$1,423,580',
    valueClass: 'text-gradient-emerald',
    iconName: 'banknote',
    delta: '+12.4%',
    deltaClass: 'text-emerald-400',
    deltaIcon: 'trending-up',
  },
  {
    key: 'members',
    label: 'Members',
    value: '124',
    valueClass: '',
    iconName: 'users',
    delta: '+8',
    deltaClass: 'text-emerald-400',
    deltaIcon: 'trending-up',
  },
  {
    key: 'roi',
    label: 'ROI (YTD)',
    value: '+18.4%',
    valueClass: 'text-gradient-violet',
    iconName: 'percent',
    delta: 'Target: 15%',
    deltaClass: 'text-emerald-400',
    deltaIcon: 'check-circle',
  },
  {
    key: 'executions',
    label: 'Executions',
    value: '47',
    valueClass: '',
    iconName: 'zap',
    delta: '3 active · 44 completed',
    deltaClass: 'text-slate-400',
    deltaIcon: '',
  },
];

const GOVERNED_PARAMS: ReadonlyArray<GovernedParam> = [
  {
    key: 'ROI floor',
    description: 'Minimum acceptable return',
    value: '15%',
    valueClass: 'text-emerald-400',
    iconName: 'target',
    iconClass: 'text-emerald-400',
    iconBg: 'rgba(16,185,129,0.12)',
    updated: 'Last updated: 2mo ago',
  },
  {
    key: 'Win-rate target',
    description: 'Success rate threshold',
    value: '75%',
    valueClass: 'text-violet-400',
    iconName: 'crosshair',
    iconClass: 'text-violet-400',
    iconBg: 'rgba(201,138,66,0.12)',
    updated: 'Last updated: 1mo ago',
  },
  {
    key: 'Distribution shares',
    description: 'Capital:Signal:Access split',
    value: '60:25:15',
    valueClass: 'text-amber-400',
    iconName: 'pie-chart',
    iconClass: 'text-amber-400',
    iconBg: 'rgba(245,158,11,0.12)',
    updated: 'Last updated: 3mo ago',
  },
  {
    key: 'Reserve ratio target',
    description: 'Safety buffer percentage',
    value: '18%',
    valueClass: 'text-blue-400',
    iconName: 'shield',
    iconClass: 'text-blue-400',
    iconBg: 'rgba(96,165,250,0.12)',
    updated: 'Current: 18.2%',
  },
];

const RECENT_EXECUTIONS: ReadonlyArray<RecentExecution> = [
  {
    ref: 'E-1042',
    title: 'Limited Edition Sneaker Resale',
    statusLine: 'Acquired 8 pairs · Listed on StockX, GOAT',
    iconName: 'package',
    iconClass: 'text-emerald-400',
    iconBg: 'rgba(16,185,129,0.12)',
    roi: '+12.4% ROI',
    deployed: '$18,500 deployed',
    progressPct: 37,
    progressClass: 'progress-fill-emerald',
    progressLabel: '3 of 8 sold',
    progressLabelClass: 'text-slate-400',
  },
  {
    ref: 'E-1039',
    title: 'Vintage Watch Liquidation',
    statusLine: '5 items · all sold',
    iconName: 'watch',
    iconClass: 'text-violet-400',
    iconBg: 'rgba(201,138,66,0.12)',
    roi: '+18.7% ROI',
    deployed: '$32,000 deployed',
    progressPct: 100,
    progressClass: 'progress-fill-violet',
    progressLabel: 'Closing',
    progressLabelClass: 'text-emerald-400',
  },
];

const MEMBER_COMPOSITION: ReadonlyArray<MemberSegment> = [
  { key: 'Capital providers', count: 42, pct: 34, progressClass: 'progress-fill-emerald' },
  { key: 'Signal providers', count: 67, pct: 54, progressClass: 'progress-fill-violet' },
  { key: 'Access providers', count: 15, pct: 12, progressClass: 'progress-fill-amber' },
];

const SAFETY_RAILS: ReadonlyArray<string> = [
  'Integrity verification',
  'Reconciliation checks',
  'No-ponzi mechanics',
  'Human control override',
];

const GRADIENT_VAR: Readonly<Record<CommunityData['avatarGradient'], string>> = {
  violet: 'var(--gradient-violet)',
  amber: 'var(--gradient-amber)',
  blue: 'var(--gradient-blue)',
};

@Component({
  selector: 'app-community-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, DecimalPipe],
  templateUrl: './community-detail.template.html',
})
export class CommunityDetailPageComponent {
  /** Route :id param, set via input binding from the router. */
  @Input() set id(value: string) {
    this._id.set(value);
  }
  private readonly _id = signal<string>('alpha');

  /** Whether the actions dropdown is currently open. */
  readonly actionsOpen = signal<boolean>(false);

  /** Position of the actions menu (computed from trigger button at click time). */
  readonly actionsPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  /** Reference to the actions dropdown trigger button (set via #actionsTrigger). */
  actionsTrigger: HTMLElement | null = null;

  /** Whether the actions menu would extend off the right edge (flips alignment). */
  readonly actionsAlignRight = signal<boolean>(false);

  /** The community resolved from the route :id. */
  readonly community = computed<CommunityData | null>(() =>
    this.loadCommunity(this._id()),
  );

  /** Public: returns the route :id. */
  communityId(): string {
    return this._id();
  }

  /** Public: load community data by id; returns null if unknown. */
  loadCommunity(id: string): CommunityData | null {
    return COMMUNITIES.find((c) => c.ref === id) ?? null;
  }

  /** Public: 4 KPI data points for the template. */
  kpis(): ReadonlyArray<Kpi> {
    return KPIS;
  }

  /** Public: 4 community-governed parameters. */
  governedParams(): ReadonlyArray<GovernedParam> {
    return GOVERNED_PARAMS;
  }

  /** Public: 2 most recent executions. */
  recentExecutions(): ReadonlyArray<RecentExecution> {
    return RECENT_EXECUTIONS;
  }

  /** Public: 3 member-composition segments. */
  memberComposition(): ReadonlyArray<MemberSegment> {
    return MEMBER_COMPOSITION;
  }

  /** Public: 4 safety rails (never community-governed). */
  safetyRails(): ReadonlyArray<string> {
    return SAFETY_RAILS;
  }

  /** Public: toggle the actions dropdown. */
  toggleActionsMenu(event?: MouseEvent): void {
    const trigger = (event?.currentTarget as HTMLElement) ?? this.actionsTrigger;
    if (!this.actionsOpen() && trigger) {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 260; // matches .menu min-width
      const vw = window.innerWidth;
      // Anchor: bottom-left of trigger, with right-edge flip if it would overflow
      const flip = rect.right + menuWidth + 8 > vw;
      this.actionsAlignRight.set(flip);
      this.actionsPos.set({
        top: rect.bottom + 6,
        left: flip ? rect.right - menuWidth : rect.left,
      });
    }
    this.actionsOpen.update((v) => !v);
  }

  /** Public: close the actions dropdown. */
  closeActionsMenu(): void {
    this.actionsOpen.set(false);
  }

  /** Public: canonical share URL for the current community. */
  shareLink(): string {
    return `/community/${this._id()}`;
  }

  /** Public: gradient CSS var for the current community's avatar. */
  gradientAvatar(): string {
    return GRADIENT_VAR[this.community()?.avatarGradient ?? 'violet'];
  }
}
