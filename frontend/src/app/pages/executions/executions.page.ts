/**
 * ExecutionsPageComponent — wireframe-aligned execution board.
 *
 * Per wireframe/meridian/executions/index.html:
 *   - title 'Executions' + 'Active and completed arbitrage operations.'
 *   - Search input + 'Pool' link button in the header
 *   - 4 status tabs with counts (All 16 / Active 3 / Completed 12 / Failed 1)
 *   - 2-column grid of execution cards
 *   - Each card: ref + status badge + title + O-#### subtitle + thumbnail
 *     + Deployed/Recovered/ROI 3-up + progress bar + bottom row
 *     (status line + metadata line)
 *   - 16-row dataset
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
        @for (s of statuses; track s.key) {
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

            <!-- Progress bar -->
            <div class="progress-track mb-2">
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

  /** Status tabs with counts (matches wireframe). */
  readonly statuses = [
    { key: 'all',       label: 'All',       count: 16 },
    { key: 'active',    label: 'Active',    count: 3 },
    { key: 'completed', label: 'Completed', count: 12 },
    { key: 'failed',    label: 'Failed',    count: 1 },
  ] as const;

  /** Filter by status tab. */
  readonly visibleExecutions = computed<Execution[]>(() => {
    const s = this.status();
    if (s === 'all') return this.all;
    return this.all.filter((e) => e.status === s);
  });

  /** 16-row dataset, ordered as the wireframe (active first). */
  readonly all: Execution[] = [
    { ref: 'E-1042', title: 'Limited Edition Sneaker Resale',  relatedOpp: 'O-2037', relatedOppTitle: 'Travis Scott × Nike',   imageSeed: 'sneaker-thumb',  status: 'active',    badge: 'Listed',     badgeVariant: 'warning', deployed: 18500, recovered: 4280,  roi: 12.4,  progress: 37,  statusLine: '3 of 8 sold', metaLine: 'Live · 4d 12h' },
    { ref: 'E-1039', title: 'Vintage Watch Liquidation',        relatedOpp: 'O-2021', relatedOppTitle: 'Estate lot',             imageSeed: 'watch-thumb',    status: 'active',    badge: 'All Sold',   badgeVariant: 'success', deployed: 32000, recovered: 37985, roi: 18.7,  progress: 100, statusLine: '5 of 5 sold', metaLine: 'Payout pending →' },
    { ref: 'E-1036', title: 'Wholesale Electronics',            relatedOpp: 'O-2018', relatedOppTitle: 'Shenzhen bulk',          imageSeed: 'electronics-thumb', status: 'active', badge: 'Acquiring',  badgeVariant: 'info',    deployed: 45000, recovered: 0,     roi: 0,    progress: 25,  statusLine: '0 of 12 units', metaLine: 'ETA 4 days' },
    { ref: 'E-1033', title: 'Designer Furniture Resale',        relatedOpp: 'O-2014', relatedOppTitle: 'Herman Miller · 12 chairs', imageSeed: 'furniture-thumb', status: 'completed', badge: 'Settled', badgeVariant: 'success', deployed: 7800,  recovered: 9240,  roi: 18.5,  progress: 100, statusLine: '12 of 12 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1031', title: 'Vintage Camera Lot',               relatedOpp: 'O-2011', relatedOppTitle: 'Leica M3 · 2 units',     imageSeed: 'camera-thumb',   status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 5400,  recovered: 7620,  roi: 41.0,  progress: 100, statusLine: '2 of 2 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1028', title: 'Vinyl Record Collection',          relatedOpp: 'O-2008', relatedOppTitle: '320 records',            imageSeed: 'vinyl-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 3200,  recovered: 4115,  roi: 28.6,  progress: 100, statusLine: '320 of 320 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1025', title: 'PS5 Bundle Bulk',                  relatedOpp: 'O-2005', relatedOppTitle: '8 bundles',               imageSeed: 'ps5-thumb',      status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 22000, recovered: 25340, roi: 15.2,  progress: 100, statusLine: '8 of 8 bundles sold', metaLine: 'Payout cleared' },
    { ref: 'E-1022', title: 'Bulk Lego Set Resale',             relatedOpp: 'O-2002', relatedOppTitle: 'Retired Star Wars sets',  imageSeed: 'lego-thumb',     status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 8200,  recovered: 11004, roi: 34.2,  progress: 100, statusLine: '6 of 6 lots sold', metaLine: 'Payout cleared' },
    { ref: 'E-1019', title: 'Restaurant Equipment Resale',      relatedOpp: 'O-1998', relatedOppTitle: 'Espresso machine',        imageSeed: 'espresso-thumb', status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 4500,  recovered: 5526,  roi: 22.8,  progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1016', title: 'Yeezy Boost 350 V2 (Bone)',        relatedOpp: 'O-1995', relatedOppTitle: 'Deadstock · size 10',     imageSeed: 'yeezy-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 7600,  recovered: 9272,  roi: 22.0,  progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1013', title: 'Topps 1986 Fleer Jordan #57',      relatedOpp: 'O-1992', relatedOppTitle: 'PSA 9 graded',            imageSeed: 'topps-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 12000, recovered: 13680, roi: 14.0,  progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1010', title: 'Wüsthof Classic 8" chef knife',   relatedOpp: 'O-1989', relatedOppTitle: '3-piece set',             imageSeed: 'knife-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 240,   recovered: 269,   roi: 12.0,  progress: 100, statusLine: '3 of 3 sets sold', metaLine: 'Payout cleared' },
    { ref: 'E-1007', title: 'Gibson Les Paul Studio',           relatedOpp: 'O-1986', relatedOppTitle: '2018 sunburst',           imageSeed: 'gibson-thumb',   status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 2200,  recovered: 2442,  roi: 11.0,  progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1004', title: 'Stone Island Shadow Project',      relatedOpp: 'O-1983', relatedOppTitle: 'FW23 jacket',              imageSeed: 'stone-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 1100,  recovered: 1309,  roi: 19.0,  progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-1001', title: 'Herman Miller Aeron (size B)',     relatedOpp: 'O-1980', relatedOppTitle: 'Refurbished',             imageSeed: 'aeron-thumb',    status: 'completed', badge: 'Settled',    badgeVariant: 'success', deployed: 1800,  recovered: 1872,  roi: 4.0,   progress: 100, statusLine: '1 of 1 sold', metaLine: 'Payout cleared' },
    { ref: 'E-0998', title: 'Eames Lounge Replica (no-auth)',   relatedOpp: 'O-1977', relatedOppTitle: 'No certificate',          imageSeed: 'eames-thumb',    status: 'failed',    badge: 'Defaulted',  badgeVariant: 'danger',  deployed: 1400,  recovered: 280,   roi: -80.0, progress: 0,   statusLine: '2 of 5 buyers refunded', metaLine: 'Loss realised' },
  ];

  formatMoney(n: number): string {
    return `$${n.toLocaleString('en-US')}`;
  }

  formatRoi(n: number): string {
    if (n === 0) return '0.0%';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  }
}
