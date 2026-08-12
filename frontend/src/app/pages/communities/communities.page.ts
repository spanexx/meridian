/**
 * CommunitiesPageComponent — the Communities listing page.
 *
 * Renders per wireframe/meridian/communities/index.html:
 *   - header: title + subtitle + search input + Status dropdown button
 *   - status tabs row (All / Active / Proposed / Archived with counts)
 *   - table card: 6-col wireframe table with 3 community rows
 *     (avatar with gradient bg + icon, name + focus/scope,
 *      status badge, pool amount, members count, ROI, executions)
 *   - pagination footer (Showing 1-3 of 3, prev/next disabled at small N)
 *   - bottom row: v1 disclaimer + "Propose community" CTA
 *   - create-community modal (hidden by default)
 *
 * v1 limitation is part of the design: only one active community
 * (MERIDIAN Alpha). The governance model supports multiple; the
 * UI surfaces the v1 constraint as a footer disclaimer.
 *
 * Members intentionally do NOT live here — they belong to a community
 * and are surfaced under /community/:id (sub-page of the parent).
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface CommunityRow {
  readonly ref: string;
  readonly name: string;
  readonly focus: string;
  readonly scope: string;
  readonly status: 'active' | 'proposed' | 'archived';
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

const ROWS: ReadonlyArray<CommunityRow> = [
  {
    ref: 'alpha',
    name: 'MERIDIAN Alpha',
    focus: 'General arbitrage',
    scope: 'Global',
    status: 'active',
    iconName: 'users',
    avatarGradient: 'violet',
    poolUsd: 1420000,
    poolLabel: '$1.42M',
    poolIsLive: true,
    memberCount: 124,
    roiLabel: '+18.4%',
    roiIsPositive: true,
    executionCount: 47,
    executionIsLive: true,
  },
  {
    ref: 'tech-arbitrage',
    name: 'Tech Arbitrage',
    focus: 'Electronics focus',
    scope: 'Asia-Pacific',
    status: 'proposed',
    iconName: 'zap',
    avatarGradient: 'amber',
    poolUsd: 0,
    poolLabel: '$0',
    poolIsLive: false,
    memberCount: 23,
    roiLabel: '—',
    roiIsPositive: null,
    executionCount: 0,
    executionIsLive: false,
  },
  {
    ref: 'vintage-collective',
    name: 'Vintage Collective',
    focus: 'Closed',
    scope: 'Merged into Alpha',
    status: 'archived',
    iconName: 'archive',
    avatarGradient: 'blue',
    poolUsd: 0,
    poolLabel: '$0',
    poolIsLive: false,
    memberCount: 0,
    roiLabel: '+12.1%',
    roiIsPositive: true,
    executionCount: 18,
    executionIsLive: true,
  },
];

const GRADIENT_VAR: Readonly<Record<CommunityRow['avatarGradient'], string>> = {
  violet: 'var(--gradient-violet)',
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
  /** All seed rows — used to derive everything else. */
  private readonly allRows = signal<ReadonlyArray<CommunityRow>>(ROWS);

  /** Currently active filter tab ('all' / 'active' / 'proposed' / 'archived'). */
  readonly activeTab = signal<'all' | 'active' | 'proposed' | 'archived'>('all');

  /** Modal open state. */
  readonly createModalOpen = signal<boolean>(false);

  /** Rows after applying the active tab filter. */
  readonly filteredRows = computed<ReadonlyArray<CommunityRow>>(() => {
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

  /** Human-readable pagination range like "1-3". */
  paginationRange(): string {
    const n = this.filteredRows().length;
    if (n === 0) return '0-0';
    return `1-${n}`;
  }

  /** Whether prev/next pagination buttons are disabled (single-page list). */
  private paginationDisabled(): boolean {
    return this.filteredRows().length <= 3;
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
