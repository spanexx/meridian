/**
 * ExecutionsPageComponent — wireframe-aligned execution board.
 *
 * Per wireframe/meridian/executions/index.html:
 *   - title 'Executions' + 'Active and completed arbitrage operations.'
 *   - Search input + 'Pool' link button in the header
 *   - 4 status tabs with counts derived LIVE from the loaded rows
 *   - 2-column grid of execution cards
 *   - Each card: ref + status badge + title + O-#### subtitle + thumbnail
 *     + Deployed/Recovered/ROI 3-up + progress bar + bottom row
 *     (status line + metadata line)
 *
 * Backend-readiness (Job C): the constructor consumes GET /executions and
 * maps ExecutionDetail[] rows through toExecutionViewModel() (pure, unit-
 * tested) into the Execution view model the template renders. There is no
 * module-local dataset.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient } from '../../core/api/api-client';
import { parseApiMoney } from '../../core/utils/money';
import type { ExecutionDetail, ExecutionStatus } from '../../core/models';

interface Execution {
  ref: string;
  title: string;
  relatedOpp: string;
  relatedOppTitle: string;
  imageSeed: string;
  status: 'active' | 'completed' | 'failed';
  badge: string;
  badgeVariant: 'warning' | 'success' | 'info' | 'danger';
  deployed: number;
  recovered: number;
  roi: number;            // positive or negative percentage
  progress: number;       // 0..100
  statusLine: string;     // e.g. '3 of 8 sold'
  metaLine: string;       // e.g. 'Live · 4d 12h'
}

// ─── canonical ExecutionDetail → Execution view mapper (pure; unit-tested) ───

/** Badge text + tone per canonical lifecycle status (reproduces the wireframe). */
const BADGE_BY_STATUS: Record<ExecutionStatus, { label: string; badgeVariant: Execution['badgeVariant'] }> = {
  FUNDING:     { label: 'Listed',    badgeVariant: 'warning' },
  ACQUIRING:   { label: 'Acquiring', badgeVariant: 'info' },
  HOLDING:     { label: 'Listed',    badgeVariant: 'warning' },
  LIQUIDATING: { label: 'All Sold',  badgeVariant: 'success' },
  COMPLETED:   { label: 'Settled',   badgeVariant: 'success' },
  FAILED:      { label: 'Defaulted', badgeVariant: 'danger' },
  CANCELLED:   { label: 'Listed',    badgeVariant: 'warning' },
};

/** COMPLETED → 'completed', FAILED → 'failed', every other lifecycle → 'active'. */
function statusOf(s: ExecutionStatus): Execution['status'] {
  return s === 'COMPLETED' ? 'completed' : s === 'FAILED' ? 'failed' : 'active';
}

/** sold/total * 100, or 0 for failed, 100 for completed. */
function progressOf(d: ExecutionDetail): number {
  if (d.status === 'COMPLETED') return 100;
  if (d.status === 'FAILED') return 0;
  const total = d.inventory.total_items;
  return total > 0 ? Math.round((d.inventory.sold / total) * 100) : 0;
}

/** e.g. '3 of 8 sold' / '0 of 12 units' / failed '2 of 5 buyers refunded'. */
function statusLineOf(d: ExecutionDetail): string {
  const sold = d.inventory.sold;
  const total = d.inventory.total_items;
  if (d.status === 'FAILED') return `${sold} of ${total} buyers refunded`;
  if (sold === 0 && total > 0) return `${sold} of ${total} units`;
  return `${sold} of ${total} sold`;
}

/** e.g. 'Payout cleared' / 'Loss realised' / 'Live · 4d 12h' / 'ETA 4 days'. */
function metaLineOf(d: ExecutionDetail): string {
  if (d.status === 'FAILED') return 'Loss realised';
  if (d.status === 'COMPLETED') return 'Payout cleared';
  if (d.status === 'LIQUIDATING') return 'Payout pending →';
  if (d.status === 'ACQUIRING') {
    const days = Math.max(1, Math.round((new Date(d.timeline.estimated_completion).getTime() - Date.now()) / 86_400_000));
    return `ETA ${days} days`;
  }
  // HOLDING (and unnamed lifecycle states): 'Live · {d}d {h}h' from the planned flight.
  const windowMs = Math.max(0, new Date(d.timeline.estimated_completion).getTime() - new Date(d.timeline.started_at).getTime());
  const totalHours = windowMs / 3_600_000;
  const days = Math.floor(totalHours / 24);
  const hours = Math.min(23, Math.round(totalHours % 24));
  return `Live · ${days}d ${hours}h`;
}

function toExecution(d: ExecutionDetail): Execution {
  return {
    ref: d.execution_id,
    title: d.title,
    relatedOpp: d.opportunity.id,
    relatedOppTitle: d.opportunity.title,
    imageSeed: d.image_seed,
    status: statusOf(d.status),
    badge: BADGE_BY_STATUS[d.status].label,
    badgeVariant: BADGE_BY_STATUS[d.status].badgeVariant,
    deployed: parseApiMoney(d.capital.allocated),
    recovered: parseApiMoney(d.capital.recovered),
    roi: d.financials.projected_roi,
    progress: progressOf(d),
    statusLine: statusLineOf(d),
    metaLine: metaLineOf(d),
  };
}

/**
 * Map canonical GET /executions rows (ExecutionDetail[]) into the page view
 * model. Pure + unit-tested in executions.page.spec.ts.
 */
export function toExecutionViewModel(details: ExecutionDetail[]): Execution[] {
  return details.map(toExecution);
}

@Component({
  selector: 'app-executions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="page-title">Executions</h1>
          <p class="page-subtitle">Active and completed arbitrage operations.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="search" class="input w-full sm:w-56" placeholder="Search executions…">
          <a [routerLink]="['/pool']" class="btn btn-secondary">
            <span>Pool</span>
          </a>
        </div>
      </header>

      <!-- Status tabs -->
      <div class="tabs mb-6" data-testid="status-filter">
        @for (s of statuses(); track s.key) {
          <button
            type="button"
            class="tab"
            [class.active]="status() === s.key"
            [attr.aria-selected]="status() === s.key"
            [attr.data-filter-tab]="s.key"
            (click)="status.set(s.key)"
          >{{ s.label }} <span class="text-slate-500">{{ s.count }}</span></button>
        }
      </div>

      <!-- Cards grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
        data-testid="executions-grid"
      >
        @for (e of visibleExecutions(); track e.ref) {
          <a
            [routerLink]="['/executions', e.ref]"
            class="card card-hover p-6 block"
            data-filterable
            [attr.data-status]="e.status"
          >
            <!-- Top: ref + badge + title + subtitle + thumbnail -->
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-slate-500 font-mono">{{ e.ref }}</span>
                  <span class="badge" [class]="'badge-' + e.badgeVariant">{{ e.badge }}</span>
                </div>
                <div class="text-base font-semibold">{{ e.title }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ e.relatedOpp }} · {{ e.relatedOppTitle }}</div>
              </div>
              <img
                [src]="'https://picsum.photos/seed/' + e.imageSeed + '/120/120'"
                alt=""
                class="w-14 h-14 rounded-lg object-cover"
                style="border: 1px solid var(--border-subtle);"
                loading="lazy"
              />
            </div>

            <!-- 3-up Deployed / Recovered / ROI -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <div class="kpi-label">Deployed</div>
                <div class="text-sm font-semibold">{{ formatMoney(e.deployed) }}</div>
              </div>
              <div>
                <div class="kpi-label">Recovered</div>
                <div class="text-sm font-semibold" [class.text-emerald-400]="e.recovered > 0 && e.status !== 'failed'" [class.text-rose-400]="e.status === 'failed'">
                  {{ formatMoney(e.recovered) }}
                </div>
              </div>
              <div>
                <div class="kpi-label">ROI</div>
                <div class="text-sm font-semibold"
                     [class.text-emerald-400]="e.roi > 0"
                     [class.text-rose-400]="e.roi < 0"
                     [class.text-slate-300]="e.roi === 0">{{ formatRoi(e.roi) }}</div>
              </div>
            </div>

            <!-- Progress bar (ARIA: progressbar + value for screen readers)
                 BRIDGE 2026-08-20: added role/aria-valuenow so e2e can
                 assert progress semantics, not the .progress-track class. -->
            <div
              class="progress-track mb-2"
              role="progressbar"
              [attr.aria-label]="e.ref + ' progress'"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="progressPct(e.progress)"
            >
              <div class="progress-fill" [class]="'progress-fill-' + e.badgeVariant" [style.width.%]="e.progress"></div>
            </div>

            <!-- Bottom row: status line + meta line -->
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>{{ e.statusLine }}</span>
              <span>{{ e.metaLine }}</span>
            </div>
          </a>
        }
      </div>
    </section>
  `,
  styles: [],
})
export class ExecutionsPageComponent {
  /** Status tab currently selected. */
  readonly status = signal<'all' | Execution['status']>('all');

  /** Status tabs with counts from the LIVE rows (All = length; the rest by status). */
  readonly statuses = computed<readonly { key: 'all' | Execution['status']; label: string; count: number }[]>(() => {
    const rows = this.all();
    let active = 0;
    let completed = 0;
    let failed = 0;
    for (const r of rows) {
      if (r.status === 'active') active += 1;
      else if (r.status === 'completed') completed += 1;
      else failed += 1;
    }
    return [
      { key: 'all', label: 'All', count: rows.length },
      { key: 'active', label: 'Active', count: active },
      { key: 'completed', label: 'Completed', count: completed },
      { key: 'failed', label: 'Failed', count: failed },
    ];
  });

  /** Filter by status tab. */
  readonly visibleExecutions = computed<Execution[]>(() => {
    const s = this.status();
    const rows = this.all();
    if (s === 'all') return rows;
    return rows.filter((e) => e.status === s);
  });

  /** Live Execution rows — canonicalized from the GET /executions seed. */
  readonly all = signal<Execution[]>([]);

  formatMoney(n: number): string {
    return `$${n.toLocaleString('en-US')}`;
  }

  formatRoi(n: number): string {
    if (n === 0) return '0.0%';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  }

  /** Round a progress 0..100 value for aria-valuenow (templates can't call Math). */
  progressPct(n: number): number {
    return Math.round(n);
  }

  private readonly client = inject(ApiClient);

  constructor() {
    // Job C (backend-readiness audit): consume the canonical endpoint.
    this.client
      .executionsList()
      .then((r) => this.all.set(toExecutionViewModel(r.executions)))
      .catch(() => undefined);
  }
}
