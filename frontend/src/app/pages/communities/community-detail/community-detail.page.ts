/**
 * CommunityDetailPageComponent — per-community deep-dive view.
 *
 * Renders per wireframe/meridian/community-detail/index.html.
 *
 * Backend-readiness pack: the page now consumes the injected
 * ApiClient.communityGet(id) (core/api/api-client.ts) instead of a
 * hardcoded COMMUNITIES const. The dev MockGateway seeds the same
 * wireframe detail (mock-seed.ts SEED_COMMUNITY_DETAILS: alpha) and it
 * is mapped to the wireframe view by the MODULE-LOCAL mapDetail() helper.
 *
 * Fields the canonical CommunityDetail carries (name/status/focus/
 * geographic_scope/founded_at/min_contribution/stats) are mapped live,
 * including derived KPI values + member-composition percentages. The
 * remaining wireframe presentation — the 4 community-governed parameter
 * rows, the 2 recent-execution cards, the About prose, and the 4 safety
 * rails — is wireframe-only UI not yet present in the canonical detail
 * API (parameters/recent-executions are separate endpoints), so it stays
 * as module-local constants.
 *
 * URL convention: dual route (/communities/:id and
 * /community-detail/:id) so callers can pick either pattern.
 *
 * @owner   spanexx
 * @reviewed 2026-08-18
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../../ui/icon/icon.component';
import { ApiClient } from '../../../core/api/api-client';
import { formatApiMoney } from '../../../core/utils/money';
import { type CommunityDetail, type CommunityStatus } from '../../../core/models';

interface CommunityData {
  readonly ref: string;
  readonly name: string;
  readonly status: CommunityStatus;
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** ISO date → { founded: 'March 2024', year: '2024' }. */
const foundedDisplay = (iso: string): { founded: string; year: string } => {
  const d = new Date(iso);
  return { founded: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, year: String(d.getUTCFullYear()) };
};

const STATUS_GRADIENT: Record<CommunityStatus, CommunityData['avatarGradient']> = {
  active: 'violet',
  proposed: 'amber',
  archived: 'blue',
};

/** Wireframe-only About prose (not in the canonical detail API). */
const ABOUT_PARAGRAPH =
  'MERIDIAN Alpha is the founding community, focused on general arbitrage opportunities across multiple categories including electronics, collectibles, and fashion. The community operates globally and welcomes members from all regions.';

/** Wireframe-only governed-parameter rows (detail endpoint does not carry these). */
const GOVERNED_PARAMS: ReadonlyArray<GovernedParam> = [
  { key: 'ROI floor', description: 'Minimum acceptable return', value: '15%', valueClass: 'text-emerald-400', iconName: 'target', iconClass: 'text-emerald-400', iconBg: 'rgba(16,185,129,0.12)', updated: 'Last updated: 2mo ago' },
  { key: 'Win-rate target', description: 'Success rate threshold', value: '75%', valueClass: 'text-violet-400', iconName: 'crosshair', iconClass: 'text-violet-400', iconBg: 'rgba(201,138,66,0.12)', updated: 'Last updated: 1mo ago' },
  { key: 'Distribution shares', description: 'Capital:Signal:Access split', value: '60:25:15', valueClass: 'text-amber-400', iconName: 'pie-chart', iconClass: 'text-amber-400', iconBg: 'rgba(245,158,11,0.12)', updated: 'Last updated: 3mo ago' },
  { key: 'Reserve ratio target', description: 'Safety buffer percentage', value: '18%', valueClass: 'text-blue-400', iconName: 'shield', iconClass: 'text-blue-400', iconBg: 'rgba(96,165,250,0.12)', updated: 'Current: 18.2%' },
];

/** Wireframe-only recent-execution cards (separate executions endpoint). */
const RECENT_EXECUTIONS: ReadonlyArray<RecentExecution> = [
  { ref: 'E-1042', title: 'Limited Edition Sneaker Resale', statusLine: 'Acquired 8 pairs · Listed on StockX, GOAT', iconName: 'package', iconClass: 'text-emerald-400', iconBg: 'rgba(16,185,129,0.12)', roi: '+12.4% ROI', deployed: '$18,500 deployed', progressPct: 37, progressClass: 'progress-fill-emerald', progressLabel: '3 of 8 sold', progressLabelClass: 'text-slate-400' },
  { ref: 'E-1039', title: 'Vintage Watch Liquidation', statusLine: '5 items · all sold', iconName: 'watch', iconClass: 'text-violet-400', iconBg: 'rgba(201,138,66,0.12)', roi: '+18.7% ROI', deployed: '$32,000 deployed', progressPct: 100, progressClass: 'progress-fill-violet', progressLabel: 'Closing', progressLabelClass: 'text-emerald-400' },
];

/** Wireframe-only safety rails (4 in the wireframe; the seed adds a 5th KYC rail). */
const SAFETY_RAILS: ReadonlyArray<string> = [
  'Integrity verification',
  'Reconciliation checks',
  'No-ponzi mechanics',
  'Human control override',
];

const GRADIENT_VAR: Readonly<Record<CommunityData['avatarGradient'], string>> = {
  violet: 'var(--gradient-copper)',
  amber: 'var(--gradient-amber)',
  blue: 'var(--gradient-blue)',
};

/** Map a canonical CommunityDetail (API shape) to the wireframe view model. */
const mapDetail = (d: CommunityDetail): CommunityData => {
  const { founded, year } = foundedDisplay(d.founded_at);
  return {
    ref: d.id,
    name: d.name,
    status: d.status,
    focus: d.focus,
    scope: `${d.geographic_scope} scope`,
    region: d.geographic_scope,
    founded,
    foundedYear: year,
    id: 'C-001', // wireframe display id (canonical id is the route slug, e.g. 'alpha')
    avatarGradient: STATUS_GRADIENT[d.status],
    minContribution: formatApiMoney(d.min_contribution),
    aboutParagraph: ABOUT_PARAGRAPH,
  };
};

/** Build the 4 KPI cards from canonical stats (deltas are wireframe presentation). */
const buildKpis = (d: CommunityDetail): ReadonlyArray<Kpi> => {
  const s = d.stats;
  const completed = s.executions_count - s.executions_active;
  return [
    { key: 'pool', label: 'Total Pool', value: formatApiMoney(s.pool_capital), valueClass: 'text-gradient-emerald', iconName: 'banknote', delta: '+12.4%', deltaClass: 'text-emerald-400', deltaIcon: 'trending-up' },
    { key: 'members', label: 'Members', value: String(s.member_count), valueClass: '', iconName: 'users', delta: '+8', deltaClass: 'text-emerald-400', deltaIcon: 'trending-up' },
    { key: 'roi', label: 'ROI (YTD)', value: `+${s.roi_ytd}%`, valueClass: 'text-gradient-copper', iconName: 'percent', delta: 'Target: 15%', deltaClass: 'text-emerald-400', deltaIcon: 'check-circle' },
    { key: 'executions', label: 'Executions', value: String(s.executions_count), valueClass: '', iconName: 'zap', delta: `${s.executions_active} active · ${completed} completed`, deltaClass: 'text-slate-400', deltaIcon: '' },
  ];
};

/** Build the 3 member-composition segments from canonical counts (pcts derived). */
const buildMemberComposition = (d: CommunityDetail): ReadonlyArray<MemberSegment> => {
  const m = d.stats.member_composition;
  const total = m.capital_providers + m.signal_providers + m.access_providers || 1;
  return [
    { key: 'Capital providers', count: m.capital_providers, pct: Math.round((m.capital_providers / total) * 100), progressClass: 'progress-fill-emerald' },
    { key: 'Signal providers', count: m.signal_providers, pct: Math.round((m.signal_providers / total) * 100), progressClass: 'progress-fill-violet' },
    { key: 'Access providers', count: m.access_providers, pct: Math.round((m.access_providers / total) * 100), progressClass: 'progress-fill-amber' },
  ];
};

@Component({
  selector: 'app-community-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  templateUrl: './community-detail.template.html',
})
export class CommunityDetailPageComponent {
  private readonly client = inject(ApiClient);

  /** Route :id param, set via input binding from the router. */
  @Input() set id(value: string) {
    this._id.set(value);
    this.load();
  }
  private readonly _id = signal<string>('alpha');

  /** True until the first communityGet() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** The raw canonical detail resolved from the route :id. */
  private readonly detailRaw = signal<CommunityDetail | null>(null);

  /** The community resolved from the route :id (canonical → view). */
  private readonly detail = computed<CommunityData | null>(() =>
    this.detailRaw() ? mapDetail(this.detailRaw()!) : null,
  );

  /** Whether the actions dropdown is currently open. */
  readonly actionsOpen = signal<boolean>(false);

  /** Position of the actions menu (computed from trigger button at click time). */
  readonly actionsPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  /** Reference to the actions dropdown trigger button (set via #actionsTrigger). */
  actionsTrigger: HTMLElement | null = null;

  /** Whether the actions menu would extend off the right edge (flips alignment). */
  readonly actionsAlignRight = signal<boolean>(false);

  constructor() {
    this.load();
  }

  /** Load the community via the injected ApiClient and map it to the view. */
  private load(): void {
    this.loading.set(true);
    this.client
      .communityGet(this._id())
      .then((d) => this.detailRaw.set(d ?? null))
      .finally(() => this.loading.set(false));
  }

  /** The community resolved from the route :id. */
  readonly community = computed<CommunityData | null>(() => this.detail());

  /** Public: returns the route :id. */
  communityId(): string {
    return this._id();
  }

  /** Public: returns the loaded community (or null). */
  loadCommunity(_id: string): CommunityData | null {
    return this.detail();
  }

  /** Public: 4 KPI data points (derived from canonical stats). */
  kpis(): ReadonlyArray<Kpi> {
    const d = this.detailRaw();
    return d ? buildKpis(d) : [];
  }

  /** Public: 4 community-governed parameters (wireframe presentation). */
  governedParams(): ReadonlyArray<GovernedParam> {
    return GOVERNED_PARAMS;
  }

  /** Public: 2 most recent executions (wireframe presentation). */
  recentExecutions(): ReadonlyArray<RecentExecution> {
    return RECENT_EXECUTIONS;
  }

  /** Public: 3 member-composition segments (derived from canonical counts). */
  memberComposition(): ReadonlyArray<MemberSegment> {
    const d = this.detailRaw();
    return d ? buildMemberComposition(d) : [];
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
