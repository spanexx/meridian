/**
 * DashboardPageComponent — the REAL product dashboard.
 *
 * Per the user (2026-08-11): the previous /dashboard route hosted a
 * primitives-pack fixture which moved to /showcase. This page is the
 * wireframe-driven product dashboard from
 * wireframe/meridian/dashboard/index.html.
 *
 * Layout (per wireframe section 4 onwards, after the KPI row):
 *   - Outer grid: grid-cols-1 lg:grid-cols-3 gap-6
 *   - Left column (lg:col-span-2 space-y-6):
 *       Active Executions (3 rows with status text + multi-color bars)
 *       Latest Opportunities (table with 6 columns)
 *   - Right column (space-y-6):
 *       Pool Health (3 stat bars + sparkline per period)
 *       Your Portfolio (capital / earnings / tier)
 *
 * Demo data is hardcoded per the wireframe; backend wiring is a later
 * pack.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiBadgeComponent } from '../../ui/badge/badge.component';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface ExecutionRow {
  ref: string;
  title: string;
  detail: string;
  roi: string;          // '+12.4% ROI' or status text like 'In transit'
  deployed: string;
  statusText: string;   // right-side caption: '3 of 8 sold' / 'Closing' / 'ETA 4 days'
  statusTone: 'emerald' | 'violet' | 'blue' | 'amber';
  progress: number;
  iconBg: string;       // CSS background for the icon square
  iconColor: string;    // CSS text color for the icon
  icon: string;
}

interface OpportunityRow {
  ref: string;
  title: string;
  category: string;
  roi: string;
  status: 'In Vetting' | 'Pending' | 'Approved';
  votesUp: number | null;
  votesDown: number | null;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [UiBadgeComponent, UiIconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <section class="page">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="page-title">Good evening, Alex</h1>
          <p class="page-subtitle">Here's what's moving across the pool today.</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-ghost" ariaLabel="Share">
            <ui-icon name="share-2"></ui-icon>
          </button>
          <button class="btn btn-secondary" ariaLabel="Period">
            <ui-icon name="filter"></ui-icon>
            <span class="ml-2">Period</span>
          </button>
          <a class="btn btn-primary" [routerLink]="['/submit-signal']">
            <ui-icon name="plus"></ui-icon>
            <span class="ml-2">Submit Signal</span>
          </a>
        </div>
      </header>

      <!-- KPI Row — 4 tiles (wireframe section 1) -->
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Total Pool</div>
            <ui-icon name="banknote" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number text-gradient-emerald">$1,423,580</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-emerald-400 flex items-center gap-1">
              <ui-icon name="trending-up"></ui-icon>+2.4%
            </span>
            <span class="text-slate-500">vs last week</span>
          </div>
        </div>

        <a class="card card-hover p-5 block" [routerLink]="['/executions']">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Active Capital</div>
            <ui-icon name="zap" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">$487,230</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-slate-400">3 executions in flight</span>
          </div>
          <div class="progress-track mt-3"><div class="progress-fill progress-fill-emerald" style="width: 34%;"></div></div>
        </a>

        <a class="card card-hover p-5 block" [routerLink]="['/community/alpha/members']">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Active Members</div>
            <ui-icon name="users" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">124</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-emerald-400 flex items-center gap-1">
              <ui-icon name="trending-up"></ui-icon>+8
            </span>
            <span class="text-slate-500">this week</span>
          </div>
        </a>

        <a class="card card-hover p-5 block" [routerLink]="['/opportunities']">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Open Opportunities</div>
            <ui-icon name="lightbulb" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">12</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-amber-300 flex items-center gap-1">
              <ui-icon name="vote"></ui-icon>8 awaiting your vote
            </span>
          </div>
        </a>
      </section>

      <!-- Wireframe section 4+ — two-column body grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Left column: Active Executions + Latest Opportunities -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Active Executions -->
          <section class="card p-6">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 class="text-base font-semibold">Active Executions</h2>
                <p class="text-xs text-slate-500 mt-0.5">Live operations with deployed capital</p>
              </div>
              <a class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1" [routerLink]="['/executions']">
                View all<ui-icon name="arrow-right"></ui-icon>
              </a>
            </div>
            <div class="space-y-3">
              @for (ex of executions; track ex.ref) {
                <a class="block card card-hover p-4" [routerLink]="['/executions', ex.ref]">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg flex items-center justify-center" [style.background]="ex.iconBg">
                        <ui-icon [name]="ex.icon" [style.color]="ex.iconColor"></ui-icon>
                      </div>
                      <div>
                        <div class="text-sm font-medium">{{ ex.ref }} · {{ ex.title }}</div>
                        <div class="text-xs text-slate-500">{{ ex.detail }}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-semibold" [class.text-emerald-400]="ex.statusTone === 'emerald'"
                           [class.text-violet-400]="ex.statusTone === 'violet'"
                           [class.text-blue-400]="ex.statusTone === 'blue'"
                           [class.text-amber-300]="ex.statusTone === 'amber'">{{ ex.roi }}</div>
                      <div class="text-xs text-slate-500">{{ ex.deployed }} deployed</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="progress-track flex-1">
                      <div [class]="'progress-fill progress-fill-' + ex.statusTone" [style.width.%]="ex.progress"></div>
                    </div>
                    <span class="text-xs whitespace-nowrap"
                          [class.text-emerald-400]="ex.statusTone === 'emerald'"
                          [class.text-slate-400]="ex.statusTone !== 'emerald'">{{ ex.statusText }}</span>
                  </div>
                </a>
              }
            </div>
          </section>

          <!-- Latest Opportunities — table per wireframe -->
          <section class="card p-6">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 class="text-base font-semibold">Latest Opportunities</h2>
                <p class="text-xs text-slate-500 mt-0.5">Signals awaiting vetting</p>
              </div>
              <a class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1" [routerLink]="['/opportunities']">
                View all<ui-icon name="arrow-right"></ui-icon>
              </a>
            </div>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th class="hidden md:table-cell">Ref</th>
                    <th>Title</th>
                    <th class="hidden md:table-cell">Category</th>
                    <th class="hidden sm:table-cell">Est. ROI</th>
                    <th>Status</th>
                    <th class="hidden lg:table-cell">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (opp of opportunities; track opp.ref) {
                    <tr class="table-row">
                      <td class="hidden md:table-cell">
                        <a [routerLink]="['/opportunities', opp.ref]">
                          <span class="text-xs text-slate-500 font-mono">{{ opp.ref }}</span>
                        </a>
                      </td>
                      <td>
                        <a class="font-medium" [routerLink]="['/opportunities', opp.ref]">{{ opp.title }}</a>
                      </td>
                      <td class="hidden md:table-cell"><span class="text-xs text-slate-400">{{ opp.category }}</span></td>
                      <td class="hidden sm:table-cell"><span class="text-emerald-400 font-medium">{{ opp.roi }}</span></td>
                      <td>
                        @if (opp.status === 'In Vetting') {
                          <ui-badge variant="warning">{{ opp.status }}</ui-badge>
                        } @else if (opp.status === 'Pending') {
                          <ui-badge variant="info">{{ opp.status }}</ui-badge>
                        } @else {
                          <ui-badge variant="success">{{ opp.status }}</ui-badge>
                        }
                      </td>
                      <td class="hidden lg:table-cell">
                        @if (opp.votesUp !== null && opp.votesDown !== null) {
                          <div class="flex items-center gap-2 text-xs">
                            <span class="text-emerald-400">{{ opp.votesUp }}↑</span>
                            <span class="text-slate-500">/</span>
                            <span class="text-rose-400">{{ opp.votesDown }}↓</span>
                          </div>
                        } @else {
                          <div class="flex items-center gap-2 text-xs text-slate-500">—</div>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Right column: Pool Health + Your Portfolio -->
        <div class="space-y-6">

          <!-- Pool Health — 3 metric bars + sparkline -->
          <section class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold">Pool Health</h2>
              <ui-badge variant="success">Healthy</ui-badge>
            </div>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between items-baseline mb-2">
                  <span class="text-xs text-slate-400">Reserve ratio</span>
                  <span class="text-sm font-semibold text-emerald-400">18.2%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill progress-fill-emerald" style="width: 72%;"></div>
                </div>
                <div class="text-[10px] text-slate-500 mt-1.5">Target 12% · Warn &lt;10% · Critical &lt;5%</div>
              </div>
              <div>
                <div class="flex justify-between items-baseline mb-2">
                  <span class="text-xs text-slate-400">Liquidity</span>
                  <span class="text-sm font-semibold">62.4%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill progress-fill-violet" style="width: 62%;"></div>
                </div>
                <div class="text-[10px] text-slate-500 mt-1.5">Healthy ≥50% · Warn &lt;30%</div>
              </div>
              <div>
                <div class="flex justify-between items-baseline mb-2">
                  <span class="text-xs text-slate-400">Deployment</span>
                  <span class="text-sm font-semibold">34.2%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill progress-fill-blue" style="width: 34%;"></div>
                </div>
                <div class="text-[10px] text-slate-500 mt-1.5">Band 20–40% · Cap 50%</div>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t" style="border-color: var(--border-subtle);">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs text-slate-400">Pool · <span data-chart-label>{{ period() }}</span></span>
                <span class="text-xs text-emerald-400">+2.4%</span>
              </div>
              <svg viewBox="0 0 200 50" class="w-full h-12" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"></stop>
                    <stop offset="100%" stop-color="#10b981" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <g [attr.data-chart-set]="'7d'" [attr.hidden]="period() !== '7d' ? '' : null">
                  <path d="M0,38 L30,36 L60,30 L90,33 L120,24 L150,20 L180,16 L200,12 L200,50 L0,50 Z" fill="url(#spark)"></path>
                  <path d="M0,38 L30,36 L60,30 L90,33 L120,24 L150,20 L180,16 L200,12" fill="none" stroke="#10b981" stroke-width="1.5"></path>
                </g>
                <g [attr.data-chart-set]="'30d'" [attr.hidden]="period() !== '30d' ? '' : null">
                  <path d="M0,40 L20,35 L40,38 L60,30 L80,32 L100,22 L120,26 L140,18 L160,20 L180,12 L200,15 L200,50 L0,50 Z" fill="url(#spark)"></path>
                  <path d="M0,40 L20,35 L40,38 L60,30 L80,32 L100,22 L120,26 L140,18 L160,20 L180,12 L200,15" fill="none" stroke="#10b981" stroke-width="1.5"></path>
                </g>
                <g [attr.data-chart-set]="'90d'" [attr.hidden]="period() !== '90d' ? '' : null">
                  <path d="M0,45 L15,40 L30,42 L45,36 L60,38 L75,30 L90,33 L105,26 L120,28 L135,20 L150,24 L165,16 L180,18 L200,10 L200,50 L0,50 Z" fill="url(#spark)"></path>
                  <path d="M0,45 L15,40 L30,42 L45,36 L60,38 L75,30 L90,33 L105,26 L120,28 L135,20 L150,24 L165,16 L180,18 L200,10" fill="none" stroke="#10b981" stroke-width="1.5"></path>
                </g>
              </svg>
              <div class="flex items-center justify-center gap-1 text-xs mt-3">
                @for (p of periods; track p.id) {
                  <button
                    type="button"
                    class="btn rounded-full px-2 py-0.5 text-[10px]"
                    [class.btn-primary]="period() === p.id"
                    [class.btn-secondary]="period() !== p.id"
                    [attr.aria-pressed]="period() === p.id"
                    (click)="period.set(p.id)"
                  >{{ p.label }}</button>
                }
              </div>
            </div>
          </section>

          <!-- Your Portfolio -->
          <section class="card p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="avatar" style="width: 2.5rem; height: 2.5rem; background: var(--gradient-copper);">AC</div>
              <div>
                <div class="text-sm font-semibold">Your Portfolio</div>
                <div class="text-xs text-slate-500">Alex Chen</div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-slate-400">Capital contributed</span>
                <span class="text-sm font-semibold">$12,500.00</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-slate-400">Lifetime earnings</span>
                <span class="text-sm font-semibold text-emerald-400">+$1,847.23</span>
              </div>
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-slate-400">Reputation tier</span>
                <ui-badge variant="premium">Vetter · T3</ui-badge>
              </div>
            </div>
            <div class="mt-5 pt-4 border-t" style="border-color: var(--border-subtle);">
              <div class="grid grid-cols-2 gap-3 text-center">
                <a [routerLink]="['/profile']">
                  <div class="text-lg font-semibold text-gradient-emerald">8</div>
                  <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Signals</div>
                </a>
                <a [routerLink]="['/governance']">
                  <div class="text-lg font-semibold text-gradient-copper">14</div>
                  <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Votes Cast</div>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class DashboardPageComponent {
  /** Period toggle for the Pool Health chart (7d / 30d / 90d). */
  readonly period = signal<'7d' | '30d' | '90d'>('30d');
  readonly periods = [
    { id: '7d' as const, label: '7d' },
    { id: '30d' as const, label: '30d' },
    { id: '90d' as const, label: '90d' },
  ];

  readonly executions: ExecutionRow[] = [
    { ref: 'E-1042', title: 'Limited Edition Sneaker Resale', detail: 'Acquired 8 pairs · Listed on StockX, GOAT', roi: '+12.4% ROI', deployed: '$18,500', statusText: '3 of 8 sold', statusTone: 'emerald', progress: 37, iconBg: 'rgba(16,185,129,0.12)', iconColor: '#34d399', icon: 'package' },
    { ref: 'E-1039', title: 'Vintage Watch Liquidation', detail: '5 items · all sold', roi: '+18.7% ROI', deployed: '$32,000', statusText: 'Closing', statusTone: 'violet', progress: 100, iconBg: 'rgba(201,138,66,0.12)', iconColor: '#a78bfa', icon: 'watch' },
    { ref: 'E-1036', title: 'Wholesale Electronics', detail: 'Acquiring 12 units from Shenzhen', roi: 'In transit', deployed: '$45,000', statusText: 'ETA 4 days', statusTone: 'blue', progress: 25, iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60a5fa', icon: 'cpu' },
  ];

  readonly opportunities: OpportunityRow[] = [
    { ref: 'O-2051', title: 'Bulk Lego Set Resale',          category: 'Collectibles', roi: '+34.2%', status: 'In Vetting', votesUp: 4,  votesDown: 0 },
    { ref: 'O-2050', title: 'Restaurant Equipment Resale',   category: 'Equipment',    roi: '+22.8%', status: 'In Vetting', votesUp: 2,  votesDown: 1 },
    { ref: 'O-2049', title: 'Travis Scott × Nike Sneakers',  category: 'Apparel',      roi: '+51.4%', status: 'In Vetting', votesUp: 3,  votesDown: 1 },
    { ref: 'O-2048', title: 'Designer Furniture Resale',     category: 'Furniture',    roi: '+18.5%', status: 'Pending',    votesUp: null, votesDown: null },
    { ref: 'O-2047', title: 'Vintage Camera Lot',            category: 'Collectibles', roi: '+41.0%', status: 'Pending',    votesUp: null, votesDown: null },
  ];
}
