/**
 * DashboardPageComponent — the REAL product dashboard.
 *
 * Per the user (2026-08-11): the previous /dashboard route hosted a
 * primitives-pack fixture which moved to /showcase. This page is the
 * wireframe-driven product dashboard from
 * wireframe/meridian/dashboard/index.html.
 *
 * STATUS (2026-08-11): the visual layout currently matches the
 * wireframe section-by-section. The wireframe still assumes a
 * sidebar shell that wraps every page; the sidebar is intentionally
 * deferred to a follow-up pack per user direction ("style the
 * dashboard to match the wireframe first; build the sidebar later").
 *
 * Sections (each maps to a wireframe anchor):
 *   - greeting header: h1 'Good evening, Alex' + page-subtitle + share/period/Submit
 *   - 4 KPI tiles (Total Pool, Active Capital, Active Members, Open Opportunities)
 *   - Active Executions rows (E-####) with progress bars
 *   - Latest Opportunities rows (O-####)
 *   - Pool Health section with SVG sparkline chart
 *   - member portfolio card
 *
 * Demo data is hardcoded per the wireframe; backend wiring for live
 * pool/member/execution data is a later pack.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCardComponent } from '../../ui/card/card.component';
import { UiBadgeComponent } from '../../ui/badge/badge.component';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { UiProgressComponent } from '../../ui/progress/progress.component';

interface ExecutionRow {
  ref: string;
  title: string;
  detail: string;
  roi: string;
  deployed: string;
  progress: number;
  icon: string;
}

interface OpportunityRow {
  ref: string;
  title: string;
  category: string;
  roi: string;
  status: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    UiCardComponent,
    UiBadgeComponent,
    UiIconComponent,
    UiProgressComponent,
  ],
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
          <a class="btn btn-primary" href="/submit-signal">
            <ui-icon name="plus"></ui-icon>
            <span class="ml-2">Submit Signal</span>
          </a>
        </div>
      </header>

      <!-- KPI Row — 4 tiles, full-width 4-column grid (wireframe section 1) -->
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

        <a class="card card-hover p-5 block" href="/executions">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Active Capital</div>
            <ui-icon name="zap" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">$487,230</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-slate-400">3 executions in flight</span>
          </div>
          <ui-progress [value]="34" variant="emerald" />
        </a>

        <a class="card card-hover p-5 block" href="/members">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Active Members</div>
            <ui-icon name="users" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">124</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-emerald-400 flex items-center gap-1">
              <ui-icon name="trending-up"></ui-icon>+8
            </span>
            <span class="text-slate-500">new this month</span>
          </div>
        </a>

        <a class="card card-hover p-5 block" href="/opportunities">
          <div class="flex items-center justify-between mb-3">
            <div class="kpi-label">Open Opportunities</div>
            <ui-icon name="lightbulb" class="text-slate-500"></ui-icon>
          </div>
          <div class="kpi-number">12</div>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <span class="text-slate-400 flex items-center gap-1">
              <ui-icon name="clock" ariaLabel="Pending"></ui-icon>4 pending approval
            </span>
          </div>
        </a>
      </section>

      <!-- Active Executions (wireframe section 2) -->
      <section class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold">Active Executions</h2>
            <p class="text-xs text-slate-500 mt-0.5">Live operations with deployed capital</p>
          </div>
          <a class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1" href="/executions">
            View all<ui-icon name="arrow-right"></ui-icon>
          </a>
        </div>
        <div class="space-y-3">
          @for (ex of executions; track ex.ref) {
            <a class="block card card-hover p-4" [attr.href]="'/execution-detail/' + ex.ref">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: rgba(16,185,129,0.12);">
                    <ui-icon [name]="ex.icon" class="text-emerald-400"></ui-icon>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ ex.ref }} · {{ ex.title }}</div>
                    <div class="text-xs text-slate-500">{{ ex.detail }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-emerald-400">{{ ex.roi }} ROI</div>
                  <div class="text-xs text-slate-500">{{ ex.deployed }} deployed</div>
                </div>
              </div>
              <ui-progress [value]="ex.progress" variant="emerald" />
            </a>
          }
        </div>
      </section>

      <!-- Pool Health (wireframe section 3) — SVG sparkline + period toggle -->
      <section class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold">Pool Health</h2>
            <p class="text-xs text-slate-500 mt-0.5">Deployed capital vs expected returns</p>
          </div>
          <div class="flex items-center gap-1 text-xs">
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
        <svg viewBox="0 0 200 50" class="w-full h-12" preserveAspectRatio="none">
          <defs>
            <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"></stop>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0"></stop>
            </linearGradient>
          </defs>
          <path
            d="M0,38 L30,36 L60,30 L90,33 L120,24 L150,20 L180,16 L200,12 L200,50 L0,50 Z"
            fill="url(#spark)"
          ></path>
          <path
            d="M0,38 L30,36 L60,30 L90,33 L120,24 L150,20 L180,16 L200,12"
            fill="none"
            stroke="#10b981"
            stroke-width="1.5"
          ></path>
        </svg>
        <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t" style="border-color: var(--border-subtle);">
          <div>
            <div class="text-xs text-slate-500">Reserve ratio</div>
            <div class="text-lg font-semibold">18.2%</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">Active deals</div>
            <div class="text-lg font-semibold">3 / 12</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">Avg hold time</div>
            <div class="text-lg font-semibold">14 days</div>
          </div>
        </div>
      </section>

      <!-- Latest Opportunities (wireframe section 4) -->
      <section class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold">Latest Opportunities</h2>
            <p class="text-xs text-slate-500 mt-0.5">Newest submissions in the pipe</p>
          </div>
          <a class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1" href="/opportunities">
            View all<ui-icon name="arrow-right"></ui-icon>
          </a>
        </div>
        <div class="space-y-2">
          @for (opp of opportunities; track opp.ref) {
            <a class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition" [attr.href]="'/opportunity-detail/' + opp.ref">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background: rgba(168,107,45,0.12);">
                  <ui-icon [name]="opp.icon" class="text-amber-300"></ui-icon>
                </div>
                <div>
                  <div class="text-xs font-medium">{{ opp.ref }} · {{ opp.title }}</div>
                  <div class="text-xs text-slate-500">{{ opp.category }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-semibold text-emerald-400">{{ opp.roi }} ROI</div>
                <div class="text-xs text-slate-500">{{ opp.status }}</div>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- Your Portfolio (wireframe section 5) -->
      <section class="card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold" style="background: var(--c-800);">
            AC
          </div>
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
            <a href="/profile">
              <div class="text-lg font-semibold text-gradient-emerald">8</div>
              <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Signals</div>
            </a>
            <a href="/governance">
              <div class="text-lg font-semibold text-gradient-violet">14</div>
              <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Votes Cast</div>
            </a>
          </div>
        </div>
      </section>
    </section>
  `,
  // No :host override — let the global `.main .main { margin-left: 260px; padding: 2rem 2.5rem; }`
  // from theme.css apply directly, including the sidebar reservation. Once the
  // sidebar shell ships (deferred), this layout becomes naturally placed inside it.
  styles: [],
})
export class DashboardPageComponent {
  /** Period toggle for the Pool Health chart (static demo). */
  readonly period = signal<'7d' | '30d' | '90d'>('30d');
  readonly periods = [
    { id: '7d' as const, label: '7d' },
    { id: '30d' as const, label: '30d' },
    { id: '90d' as const, label: '90d' },
  ];

  readonly executions: ExecutionRow[] = [
    { ref: 'E-1042', title: 'Limited Edition Sneaker Resale', detail: 'Acquired 8 pairs · Listed on StockX, GOAT', roi: '+12.4%', deployed: '$18,500', progress: 74, icon: 'package' },
    { ref: 'E-1039', title: 'Vintage Watch Liquidation', detail: '5 items · all sold', roi: '+8.1%', deployed: '$32,000', progress: 100, icon: 'watch' },
    { ref: 'E-1036', title: 'Wholesale Electronics', detail: 'Acquiring 12 units from Shenzhen', roi: '+3.9%', deployed: '$45,000', progress: 41, icon: 'cpu' },
  ];

  readonly opportunities: OpportunityRow[] = [
    { ref: 'O-2051', title: 'Nike Air Max 1 × 5 lots', category: 'Apparel', roi: '+18.0%', status: 'Pending', icon: 'lightbulb' },
    { ref: 'O-2048', title: 'Yeezy Boost 350 V2 (Bone)', category: 'Apparel', roi: '+22.0%', status: 'In Vetting', icon: 'package' },
    { ref: 'O-2044', title: 'Topps 1986 Fleer Jordan #57 PSA 9', category: 'Collectibles', roi: '+14.0%', status: 'Approved', icon: 'package' },
  ];
}
