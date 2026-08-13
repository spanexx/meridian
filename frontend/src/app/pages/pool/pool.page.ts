/**
 * PoolPageComponent — Capital Pool page.
 *
 * Renders per wireframe/meridian/pool/index.html: same layout and
 * data, refined to be more minimal:
 *   - header + Snapshot/Withdraw/Deposit actions
 *   - 4 KPI cards
 *   - pool chart (3 series, 7d/90d/1y tabs) + reserve-ratio gauge
 *   - health metrics + top contributors table
 *
 * The chart paths are generated from data arrays via a smooth
 * (catmull-rom -> bezier) interpolation, so the SVG stays clean
 * and the series remain editable data.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

/** Top capital contributors (wireframe data). */
export const CONTRIBUTORS = [
  { initials: 'DV', name: 'Dana Voss', tier: 'Capital · T4', premium: true, tenure: '2y 4m', balance: '$284,500', share: 20.0, fill: 90 },
  { initials: 'RK', name: 'Ravi Kumar', tier: 'Capital · T4', premium: true, tenure: '1y 11m', balance: '$198,200', share: 13.9, fill: 63 },
  { initials: 'LM', name: 'Lena Moreau', tier: 'Capital · T3', premium: false, tenure: '1y 2m', balance: '$142,000', share: 10.0, fill: 45 },
  { initials: 'TA', name: 'Tomás Alves', tier: 'Capital · T3', premium: false, tenure: '9m', balance: '$96,500', share: 6.8, fill: 31 },
  { initials: 'YN', name: 'Yuki Nakamura', tier: 'Capital · T3', premium: false, tenure: '7m', balance: '$78,300', share: 5.5, fill: 25 },
] as const;

/** Pool history series: available / locked / reserve (0-100 scale). */
const SERIES: Record<SeriesKey, { available: number[]; locked: number[]; reserve: number[] }> = {
  '7d': {
    available: [64, 63, 65, 64, 66, 65, 67],
    locked: [48, 49, 48, 50, 49, 50, 51],
    reserve: [20, 20, 21, 20, 21, 21, 22],
  },
  '90d': {
    available: [58, 60, 62, 63, 65, 66, 68, 69, 71, 72, 73, 74],
    locked: [40, 41, 43, 42, 44, 45, 46, 47, 46, 48, 49, 50],
    reserve: [15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21],
  },
  '1y': {
    available: [40, 44, 42, 48, 50, 54, 52, 58, 60, 64, 66, 70],
    locked: [25, 27, 30, 29, 33, 34, 36, 38, 40, 42, 45, 47],
    reserve: [10, 11, 12, 13, 13, 14, 15, 16, 17, 17, 18, 19],
  },
};

type SeriesKey = '7d' | '90d' | '1y';

/** Catmull-Rom → cubic bezier smooth path through the points. */
function smoothPath(points: number[]): string {
  const n = points.length;
  if (n < 2) return '';
  const step = 600 / (n - 1);
  const pts = points.map((v, i) => ({ x: i * step, y: 220 - (v / 100) * 190 - 20 }));
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

@Component({
  selector: 'ui-pool-page',
  standalone: true,
  imports: [RouterLink, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="page-title">Capital Pool</h1>
        <p class="page-subtitle">Pool health, reserve ratio, liquidity, and member contributions.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="btn btn-secondary">
          <ui-icon name="camera" [size]="16"></ui-icon>Snapshot
        </button>
        <button type="button" class="btn btn-secondary" (click)="withdrawOpen.set(true)">
          <ui-icon name="arrow-down-to-line" [size]="16"></ui-icon>Withdraw
        </button>
        <button type="button" class="btn btn-primary" (click)="depositOpen.set(true)">
          <ui-icon name="plus" [size]="16"></ui-icon>Deposit
        </button>
      </div>
    </header>

    <!-- Deposit modal -->
    <div class="modal-overlay" [hidden]="!depositOpen()" data-testid="deposit-modal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2 class="modal-title">Deposit capital</h2>
            <p class="text-xs text-slate-500 mt-1">Funds become available immediately.</p>
          </div>
          <button type="button" class="icon-btn" (click)="depositOpen.set(false)" aria-label="Close">
            <ui-icon name="x" [size]="16"></ui-icon>
          </button>
        </div>
        <form class="space-y-4" (submit)="depositOpen.set(false)">
          <div>
            <label>Amount (USD)</label>
            <input class="input" min="1" placeholder="0.00" required type="number" />
          </div>
          <div>
            <label>Rail</label>
            <select class="input">
              <option>Stripe · bank transfer</option>
              <option>PayPal</option>
              <option>USDC (crypto)</option>
            </select>
          </div>
          <div class="card p-4 text-xs text-slate-500" style="background: rgba(96,165,250,0.04); border-color: rgba(96,165,250,0.2);">
            <div class="flex items-start gap-2">
              <ui-icon name="info" class="text-blue-400 mt-0.5" [size]="16"></ui-icon>
              <div>Deposits are tracked transactionally — every dollar accounted for in the daily reconciliation.</div>
            </div>
          </div>
          <div class="flex gap-3 justify-end">
            <button type="button" class="btn btn-ghost" (click)="depositOpen.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary"><ui-icon name="plus" [size]="16"></ui-icon>Deposit</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Withdraw modal -->
    <div class="modal-overlay" [hidden]="!withdrawOpen()" data-testid="withdraw-modal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2 class="modal-title">Request withdrawal</h2>
            <p class="text-xs text-slate-500 mt-1">Available balance $12,500.00.</p>
          </div>
          <button type="button" class="icon-btn" (click)="withdrawOpen.set(false)" aria-label="Close">
            <ui-icon name="x" [size]="16"></ui-icon>
          </button>
        </div>
        <form class="space-y-4" (submit)="withdrawOpen.set(false)">
          <div>
            <label>Amount (USD)</label>
            <input class="input" min="1" placeholder="0.00" required type="number" />
          </div>
          <div>
            <label>Method</label>
            <select class="input">
              <option>Bank transfer · •••• 4821</option>
              <option>PayPal · alex@meridian.com</option>
              <option>USDC · 0x8f2a…9c1e</option>
            </select>
          </div>
          <div class="card p-4 text-xs text-slate-500" style="background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.2);">
            <div class="flex items-start gap-2">
              <ui-icon name="info" class="text-amber-400 mt-0.5" [size]="16"></ui-icon>
              <div>Withdrawals settle in 1–2 business days. Locked capital (in executions) is unavailable until released.</div>
            </div>
          </div>
          <div class="flex gap-3 justify-end">
            <button type="button" class="btn btn-ghost" (click)="withdrawOpen.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary"><ui-icon name="arrow-down-to-line" [size]="16"></ui-icon>Request</button>
          </div>
        </form>
      </div>
    </div>

    <!-- KPI row -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="kpi-row">
      <div class="card p-5">
        <div class="kpi-label mb-2">Total Available</div>
        <div class="kpi-number text-gradient-emerald">$1,423,580</div>
        <div class="text-xs text-emerald-400 mt-2">+2.4% week</div>
      </div>
      <div class="card p-5">
        <div class="kpi-label mb-2">Total Locked</div>
        <div class="kpi-number">$487,230</div>
        <div class="text-xs text-slate-500 mt-2">3 executions</div>
      </div>
      <div class="card p-5">
        <div class="kpi-label mb-2">Reserve</div>
        <div class="kpi-number">$258,952</div>
        <div class="text-xs text-amber-400 mt-2">18.2% of pool</div>
      </div>
      <div class="card p-5">
        <div class="kpi-label mb-2">Pending</div>
        <div class="kpi-number">$42,100</div>
        <div class="text-xs text-slate-500 mt-2">Deposits + withdrawals</div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Chart -->
      <section class="card p-6 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold">Pool · <span>{{ chartLabel() }}</span></h2>
            <p class="text-xs text-slate-500 mt-0.5">Available, deployed, and reserve</p>
          </div>
          <div class="tabs" role="tablist">
            @for (range of CHART_RANGES; track range) {
              <button
                type="button"
                class="tab text-xs py-1 px-2"
                [class.active]="chartRange() === range"
                (click)="chartRange.set(range)"
                role="tab"
                [attr.aria-selected]="chartRange() === range"
              >
                {{ range }}
              </button>
            }
          </div>
        </div>
        <svg class="w-full" preserveAspectRatio="none" viewBox="0 0 600 220" role="img" aria-label="Pool chart">
          <defs>
            <linearGradient id="avail" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"></stop>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0"></stop>
            </linearGradient>
            <linearGradient id="locked" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#c98a42" stop-opacity="0.3"></stop>
              <stop offset="100%" stop-color="#c98a42" stop-opacity="0"></stop>
            </linearGradient>
            <linearGradient id="reserve" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"></stop>
              <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"></stop>
            </linearGradient>
          </defs>
          <line stroke="var(--border-subtle)" stroke-dasharray="2 4" stroke-width="1" x1="0" x2="600" y1="55" y2="55"></line>
          <line stroke="var(--border-subtle)" stroke-dasharray="2 4" stroke-width="1" x1="0" x2="600" y1="110" y2="110"></line>
          <line stroke="var(--border-subtle)" stroke-dasharray="2 4" stroke-width="1" x1="0" x2="600" y1="165" y2="165"></line>
          @for (s of chartSeries(); track s.name) {
            <path [attr.d]="s.area" [attr.fill]="'url(#' + s.gradient + ')'"></path>
            <path [attr.d]="s.line" fill="none" [attr.stroke]="s.color" stroke-width="2"></path>
          }
          <text fill="var(--text-3)" font-family="Inter" font-size="9" x="0" y="215">Dec 9</text>
          <text fill="var(--text-3)" font-family="Inter" font-size="9" text-anchor="middle" x="270" y="215">Feb 9</text>
          <text fill="var(--text-3)" font-family="Inter" font-size="9" text-anchor="end" x="600" y="215">Mar 9</text>
        </svg>
        <div class="mt-4 flex items-center gap-6 text-xs">
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background: var(--e-500);"></span><span class="text-slate-400">Available</span></div>
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background: var(--v-400);"></span><span class="text-slate-400">Locked</span></div>
          <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full" style="background: var(--a-400);"></span><span class="text-slate-400">Reserve</span></div>
        </div>
      </section>

      <!-- Reserve ratio -->
      <section class="card p-6">
        <h2 class="text-base font-semibold mb-2">Reserve Ratio</h2>
        <p class="text-xs text-slate-500 mb-6">Healthy ≥ 12% · Warn &lt; 10% · Critical &lt; 5%</p>
        <div class="flex items-center justify-center">
          <svg class="w-full max-w-[200px]" viewBox="0 0 200 110" role="img" aria-label="Reserve ratio gauge">
            <defs>
              <linearGradient id="gauge" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stop-color="var(--r-500)"></stop>
                <stop offset="50%" stop-color="var(--a-500)"></stop>
                <stop offset="100%" stop-color="var(--e-500)"></stop>
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--bg-overlay)" stroke-linecap="round" stroke-width="14"></path>
            <path d="M 20 100 A 80 80 0 0 1 165 50" fill="none" stroke="url(#gauge)" stroke-linecap="round" stroke-width="14"></path>
            <line stroke="var(--text-1)" stroke-width="2" x1="100" x2="100" y1="20" y2="32"></line>
          </svg>
        </div>
        <div class="text-center -mt-2">
          <div class="text-4xl font-light text-gradient-emerald">18.2%</div>
          <div class="text-xs text-slate-500 mt-1">Healthy</div>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Health metrics -->
      <section class="card p-6">
        <h2 class="text-base font-semibold mb-4">Health Metrics</h2>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-xs text-slate-400">Reserve ratio</span>
              <span class="text-sm font-semibold text-emerald-400">18.2%</span>
            </div>
            <div class="progress-track"><div class="progress-fill progress-fill-emerald" style="width: 72%;"></div></div>
          </div>
          <div>
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-xs text-slate-400">Liquidity</span>
              <span class="text-sm font-semibold">62.4%</span>
            </div>
            <div class="progress-track"><div class="progress-fill progress-fill-violet" style="width: 62%;"></div></div>
          </div>
          <div>
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-xs text-slate-400">Deployment</span>
              <span class="text-sm font-semibold">34.2%</span>
            </div>
            <div class="progress-track"><div class="progress-fill progress-fill-blue" style="width: 34%;"></div></div>
            <div class="text-[10px] text-slate-500 mt-1.5">In band 20–40% · Cap 50%</div>
          </div>
          <div>
            <div class="flex justify-between items-baseline mb-2">
              <span class="text-xs text-slate-400">Pending withdrawals</span>
              <span class="text-sm font-semibold">$8,400</span>
            </div>
            <div class="progress-track"><div class="progress-fill progress-fill-amber" style="width: 6%;"></div></div>
          </div>
        </div>
      </section>

      <!-- Top contributors -->
      <section class="card p-6 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold">Top Capital Contributors</h2>
          <a class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1" routerLink="/community/alpha/members">
            All members<ui-icon name="arrow-right" [size]="12"></ui-icon>
          </a>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th class="hidden sm:table-cell">Tier</th>
                <th class="hidden md:table-cell">Tenure</th>
                <th>Balance</th>
                <th class="hidden xl:table-cell">Share</th>
                <th class="hidden xl:table-cell"></th>
              </tr>
            </thead>
            <tbody>
              @for (c of CONTRIBUTORS; track c.name) {
                <tr class="table-row">
                  <td>
                    <a class="flex items-center gap-2" [routerLink]="[memberUrl(c.name)]">
                      <div class="avatar" style="background: var(--gradient-copper);">{{ c.initials }}</div>
                      <span class="text-sm truncate min-w-0">{{ c.name }}</span>
                    </a>
                  </td>
                  <td class="hidden sm:table-cell">
                    <span class="badge" [class.badge-premium]="c.premium" [class.badge-info]="!c.premium">{{ c.tier }}</span>
                  </td>
                  <td class="hidden md:table-cell"><span class="text-xs text-slate-400">{{ c.tenure }}</span></td>
                  <td><span class="text-sm font-semibold">{{ c.balance }}</span></td>
                  <td class="hidden xl:table-cell"><span class="text-xs text-slate-300">{{ c.share }}%</span></td>
                  <td class="hidden xl:table-cell"><div class="w-24 progress-track"><div class="progress-fill progress-fill-violet" style="width: {{ c.fill }}%;"></div></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
})
export class PoolPageComponent {
  readonly CONTRIBUTORS = CONTRIBUTORS;
  readonly CHART_RANGES = ['7d', '90d', '1y'] as const;

  /** Active chart range tab. */
  readonly chartRange = signal<SeriesKey>('90d');

  /** Deposit modal open state. */
  readonly depositOpen = signal(false);

  /** Withdraw modal open state. */
  readonly withdrawOpen = signal(false);

  /** Label for the chart heading ("90 days"). */
  chartLabel(): string {
    return this.chartRange() === '7d' ? '7 days' : this.chartRange() === '1y' ? '1 year' : '90 days';
  }

  /** Series paths for the active range. */
  chartSeries(): Array<{ name: string; gradient: string; color: string; area: string; line: string }> {
    const data = SERIES[this.chartRange()];
    const build = (key: 'available' | 'locked' | 'reserve', gradient: string, color: string) => {
      const line = smoothPath(data[key]);
      const area = `${line} L600,220 L0,220 Z`;
      return { name: key, gradient, color, area, line };
    };
    return [
      build('available', 'avail', '#10b981'),
      build('locked', 'locked', '#c98a42'),
      build('reserve', 'reserve', '#f59e0b'),
    ];
  }

  /**
   * Slug-ify a member name for the /members/:name URL.
   * Mirrors the helper in community-members.page.ts so the links match.
   */
  memberUrl(name: string): string {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `/members/${slug}`;
  }

}
