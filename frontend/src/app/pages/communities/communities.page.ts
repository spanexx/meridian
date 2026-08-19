/**
 * CommunitiesPageComponent — the Communities listing page.
 *
 * Renders per wireframe/meridian/communities/index.html:
 *   - header: title + subtitle + search input + Status dropdown button
 *   - status tabs row (All / Active / Proposed / Archived with counts)
 *   - table card: 6-col wireframe table with community rows
 *     (avatar with gradient bg + icon, name + focus/scope,
 *      status badge, pool amount, members count, ROI, executions)
 *   - pagination footer (Showing 1-N of N, prev/next disabled at small N)
 *   - bottom row: v1 disclaimer + "Propose community" CTA
 *   - create-community modal (hidden by default)
 *
 * Backend-readiness pack: the page now consumes the injected
 * ApiClient.communitiesList() (core/api/api-client.ts) instead of a
 * hardcoded ROWS const. The dev MockGateway seeds the same wireframe
 * rows (mock-seed.ts SEED_COMMUNITIES: 'alpha' active, 'helia'
 * proposed), which are mapped to the wireframe view by the MODULE-LOCAL
 * toRow() helper. The earlier 'Vintage Collective' archived row was a
 * page-only fixture not present in the canonical seed, so it no longer
 * renders.
 *
 * v1 limitation is part of the design: only one active community
 * (MERIDIAN Alpha). The governance model supports multiple; the
 * UI surfaces the v1 constraint as a footer disclaimer.
 *
 * Members intentionally do NOT live here — they belong to a community
 * and are surfaced under /community/:id (sub-page of the parent).
 *
 * @owner   spanexx
 * @reviewed 2026-08-18
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { ApiClient } from '../../core/api/api-client';
import { parseApiMoney } from '../../core/utils/money';
import {
  type CommunityListRow,
  type CommunityStatus,
} from '../../core/models';

interface CommunityRow {
  readonly ref: string;
  readonly name: string;
  readonly focus: string;
  readonly scope: string;
  readonly status: CommunityStatus;
  readonly iconName: 'users' | 'zap' | 'archive';
  readonly avatarGradient: 'violet' | 'amber' | 'blue';
  readonly poolUsd: number;
  readonly poolLabel: string;
  readonly poolIsLive: boolean;
  readonly memberCount: number | null;
  readonly roiLabel: string;
  readonly roiIsPositive: boolean | null;
  readonly executionCount: number | null;
  readonly executionIsLive: boolean;
}

const STATUS_ICON: Record<CommunityStatus, CommunityRow['iconName']> = {
  active: 'users',
  proposed: 'zap',
  archived: 'archive',
};

const STATUS_GRADIENT: Record<CommunityStatus, CommunityRow['avatarGradient']> = {
  active: 'violet',
  proposed: 'amber',
  archived: 'blue',
};

/** Abbreviate an API money string for the Pool cell (e.g. '1423580.00' → '$1.42M'). */
const toPoolLabel = (poolCapital: string): string => {
  const n = parseApiMoney(poolCapital);
  if (n === 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

/** Map a canonical CommunityListRow (API shape) to the wireframe view row. */
const toRow = (c: CommunityListRow): CommunityRow => {
  const status = c.status;
  return {
    ref: c.id,
    name: c.name,
    focus: c.focus,
    scope: c.geographic_scope,
    status,
    iconName: STATUS_ICON[status],
    avatarGradient: STATUS_GRADIENT[status],
    poolUsd: parseApiMoney(c.pool_capital),
    poolLabel: toPoolLabel(c.pool_capital),
    poolIsLive: status === 'active',
    memberCount: c.member_count,
    roiLabel: c.roi_ytd > 0 ? `+${c.roi_ytd}%` : '—',
    roiIsPositive: c.roi_ytd > 0 ? true : null,
    executionCount: c.executions_count,
    executionIsLive: status !== 'proposed',
  };
};

const GRADIENT_VAR: Readonly<Record<CommunityRow['avatarGradient'], string>> = {
  violet: 'var(--gradient-copper)',
  amber: 'var(--gradient-amber)',
  blue: 'var(--gradient-blue)',
};

@Component({
  selector: 'app-communities-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, DecimalPipe],
  templateUrl: './communities.template.html',
})
export class CommunitiesPageComponent {
  private readonly client = inject(ApiClient);

  /** True until the first communitiesList() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** All community rows — sourced from the injected ApiClient. */
  private readonly allRows = signal<readonly CommunityRow[]>([]);

  /** Currently active filter tab ('all' / 'active' / 'proposed' / 'archived'). */
  readonly activeTab = signal<'all' | 'active' | 'proposed' | 'archived'>('all');

  /** Modal open state. */
  readonly createModalOpen = signal<boolean>(false);

  constructor() {
    this.client
      .communitiesList()
      .then((r) => this.allRows.set(r.communities.map(toRow)))
      .finally(() => this.loading.set(false));
  }

  /** Rows after applying the active tab filter. */
  readonly filteredRows = computed<readonly CommunityRow[]>(() => {
    const t = this.activeTab();
    if (t === 'all') return this.allRows();
    return this.allRows().filter((r) => r.status === t);
  });

  /** Total number of communities regardless of filter. */
  totalCount(): number {
    return this.allRows().length;
  }

  /** Number of communities in a given status bucket (drives tab counts). */
  statusCount(key: 'all' | 'active' | 'proposed' | 'archived'): number {
    if (key === 'all') return this.totalCount();
    return this.allRows().filter((r) => r.status === key).length;
  }

  /** Human-readable pagination range like "1-2". */
  paginationRange(): string {
    const n = this.filteredRows().length;
    if (n === 0) return '0-0';
    return `1-${n}`;
  }

  /** Set the active tab. Public so spec + template can drive it. */
  setTab(tab: 'all' | 'active' | 'proposed' | 'archived'): void {
    this.activeTab.set(tab);
  }

  /** Open the create-community modal. */
  openCreateModal(): void {
    this.createModalOpen.set(true);
  }

  /** Close the create-community modal. */
  closeCreateModal(): void {
    this.createModalOpen.set(false);
  }

  /** Resolve an avatar gradient to its CSS var. */
  gradientVar(g: CommunityRow['avatarGradient']): string {
    return GRADIENT_VAR[g];
  }

  /** True when a row's Pool cell should use the emerald-gradient emphasis. */
  isPoolLive(row: CommunityRow): boolean {
    return row.poolIsLive;
  }

  /** True when a row's Executions cell should be rendered (vs. muted "0"). */
  isExecutionLive(row: CommunityRow): boolean {
    return row.executionIsLive;
  }
}
