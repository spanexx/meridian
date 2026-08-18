/**
 * PayoutsPageComponent — wireframe-aligned payout ledger, API-driven.
 *
 * Per wireframe/meridian/payouts/index.html. Behavior pins:
 *   - title 'Payouts' + the community-governed split subtitle
 *   - Search input + Type DROPDOWN (All types / Capital / Signal /
 *     Access) that single-selects a contribution-type filter
 *   - 3 status tabs with counts: All (48) / Pending (3) / Paid (45)
 *   - 3 KPI cards (raw markup — do not use UiKpiCard here)
 *   - Split Formula card with 5 cells + a Governance link
 *   - 7-column table, 48-row ledger paginated 8 per page (6 pages)
 *   - Footer 'Showing N of 48' + prev/next + empty state + a loading
 *     skeleton while the first payload is in flight
 *
 * Data layer (Step 6 of the frontend data-layer plan): the page consumes
 * the canonical pool-wide ledger through the injected
 * ApiClient.payoutsList() (core/api/api-client.ts) instead of the deleted
 * hardcoded payouts.data.ts. The canonical rows are mapped to the
 * wireframe view by the MODULE-LOCAL helpers below.
 *
 * DISCOVERY 2026-08-18 (canonical → wireframe mapping): the canonical
 * ledger uses UPPER_SNAKE status/type enums, string money and ISO dates
 * while the wireframe renders lowercase badges ('pending'/'paid',
 * 'capital'/'signal'/'access'), '+$X,XXX.XX' money and an 'est. ' date
 * prefix for pending rows. The mapping lives in viewRow()/statusKey()/
 * typeKey(). See core/api/mock-seed.ts (SEED_PAYOUTS) and
 * core/utils/money.ts + core/utils/dates.ts.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient } from '../../core/api/api-client';
import type { PayoutLedgerRow } from '../../core/models';
import { formatApiMoney } from '../../core/utils/money';
import { formatIsoDate } from '../../core/utils/dates';
import { UiIconComponent } from '../../ui/icon/icon.component';

/** Wireframe avatar display keyed by canonical member_id (seed mock-seed.ts). */
const MEMBER_DISPLAY: Record<string, { name: string; initials: string; gradient: string }> = {
  mem_dv: { name: 'Dana Voss', initials: 'DV', gradient: 'var(--gradient-violet)' },
  mem_mr: { name: 'Mike Rivera', initials: 'MR', gradient: 'var(--gradient-amber)' },
  mem_jt: { name: 'Jules Tan', initials: 'JT', gradient: 'var(--gradient-blue)' },
  mem_rk: { name: 'Ravi Kumar', initials: 'RK', gradient: 'var(--gradient-emerald)' },
  mem_sp: { name: 'Sarah Park', initials: 'SP', gradient: 'var(--gradient-violet)' },
};

/** Wireframe view types (lowercased canonical enums — see file header). */
type ViewType = 'capital' | 'signal' | 'access';
type ViewStatus = 'pending' | 'paid';

interface ViewRow {
  ref: string;
  member: { initials: string; name: string; gradient: string };
  type: ViewType;
  amount: string; // API money string, formatted only at display time
  share: number;
  status: ViewStatus;
  date: string;
}

const statusKey = (s: PayoutLedgerRow['status']): ViewStatus =>
  s === 'PENDING' ? 'pending' : 'paid';

const typeKey = (t: PayoutLedgerRow['type']): ViewType =>
  t === 'CAPITAL' ? 'capital' : t === 'SIGNAL' ? 'signal' : 'access';

const viewRow = (row: PayoutLedgerRow): ViewRow => ({
  ref: row.execution_ref,
  member: MEMBER_DISPLAY[row.member_id],
  type: typeKey(row.type),
  amount: row.amount, // kept as the API string ("2340.80")
  share: row.share,
  status: statusKey(row.status),
  date: (row.status === 'PENDING' ? 'est. ' : '') + formatIsoDate(row.created_at),
});

@Component({
  selector: 'app-payouts-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  template: `
    <section class="page">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="page-title">Payouts</h1>
          <p class="page-subtitle">
            Profit distribution across the pool — the split formula is community-governed.
          </p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            class="input w-full sm:w-56"
            type="search"
            placeholder="Search payouts…"
            data-testid="search"
            [value]="search()"
            (input)="onSearchChange($event)"
          />
          <div class="relative">
            <button
              type="button"
              class="btn btn-secondary"
              data-dropdown="payMenu"
              aria-label="Type"
              (click)="toggleTypeMenu()"
            >
              <ui-icon name="filter" [size]="16"></ui-icon>Type
            </button>
            @if (typeOpen()) {
              <div class="fixed inset-0 z-40" data-click-away (click)="closeTypeMenu()"></div>
            }
            <div class="menu" id="payMenu" [hidden]="!typeOpen()">
              <div class="menu-head">Contribution type</div>
              @for (t of types; track t.key) {
                <button
                  type="button"
                  class="menu-item"
                  [class.active]="type() === t.key"
                  [attr.data-filter-category]="t.key"
                  (click)="selectType(t.key)"
                >
                  <ui-icon [name]="t.icon" [size]="16"></ui-icon>{{ t.label }}
                </button>
              }
            </div>
          </div>
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
            (click)="setStatus(s.key)"
          >
            {{ s.label }} <span class="text-slate-500">{{ s.count }}</span>
          </button>
        }
      </div>

      <!-- KPI row (raw markup, mirrors pool page) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="kpi-row">
        <div class="card p-5">
          <div class="kpi-label mb-2">Distributed YTD</div>
          <div class="kpi-number text-gradient-emerald">$84,290</div>
          <div class="text-xs text-slate-500 mt-2">12 executions closed</div>
        </div>
        <div class="card p-5">
          <div class="kpi-label mb-2">Pending</div>
          <!-- DISCOVERY 2026-08-17: keep text-gradient-violet here; the Angular
          theme maps the violet token to copper (renamed 2026-08-13, see
          sessions/decisions.md). The key 'violet' is retained semantically. -->
          <div class="kpi-number text-gradient-violet">$5,982</div>
          <div class="text-xs text-slate-500 mt-2">E-1039 closing this week</div>
        </div>
        <div class="card p-5">
          <div class="kpi-label mb-2">Avg. execution ROI</div>
          <div class="kpi-number">+21.4%</div>
          <div class="text-xs text-emerald-400 mt-2">Above community floor of 15%</div>
        </div>
      </section>

      <!-- Distribution formula -->
      <section class="card p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold">Split Formula</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Set by Governance Vote · Feb 14 · 87% approval
            </p>
          </div>
          <a
            class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            [routerLink]="['/community/alpha/governance']"
            >Governance<ui-icon name="arrow-right" [size]="12"></ui-icon
          ></a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="card p-3 text-center" data-testid="split-cell">
            <div class="text-lg font-semibold text-gradient-emerald">46%</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Capital</div>
          </div>
          <div class="card p-3 text-center" data-testid="split-cell">
            <div class="text-lg font-semibold text-gradient-violet">30%</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Signal</div>
          </div>
          <div class="card p-3 text-center" data-testid="split-cell">
            <div class="text-lg font-semibold text-gradient-blue">12%</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Access</div>
          </div>
          <div class="card p-3 text-center" data-testid="split-cell">
            <div class="text-lg font-semibold text-amber-400">8%</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Operations</div>
          </div>
          <div class="card p-3 text-center" data-testid="split-cell">
            <div class="text-lg font-semibold">4%</div>
            <div class="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Platform</div>
          </div>
        </div>
      </section>

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        @if (pagedRows().length === 0 && !loading()) {
          <div class="empty" data-testid="empty">
            <ui-icon name="circle-dollar-sign" [size]="40" class="mx-auto"></ui-icon>
            <p class="text-sm font-medium text-slate-400 mb-1">No payouts match</p>
            <p class="text-xs">Try a different status, type, or search term.</p>
          </div>
        } @else {
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th class="hidden md:table-cell">Execution</th>
                  <th>Member</th>
                  <th class="hidden sm:table-cell">Type</th>
                  <th>Amount</th>
                  <th class="hidden lg:table-cell">Share</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                @if (loading()) {
                  <!-- DISCOVERY 2026-08-18: loading skeleton row until the
                  first payoutsList() payload resolves (Step 6 rewire). -->
                  <tr data-testid="skeleton">
                    <td class="hidden md:table-cell"><span class="text-slate-600">Loading payouts…</span></td>
                    <td><span class="text-slate-600">Loading…</span></td>
                    <td class="hidden sm:table-cell"><span class="text-slate-600">Loading…</span></td>
                    <td><span class="text-slate-600">Loading…</span></td>
                    <td class="hidden lg:table-cell"><span class="text-slate-600">Loading…</span></td>
                    <td><span class="text-slate-600">Loading…</span></td>
                    <td class="hidden md:table-cell"><span class="text-slate-600">Loading…</span></td>
                  </tr>
                } @else {
                  @for (p of pagedRows(); track $index) {
                  <tr
                    class="table-row"
                    [attr.data-category]="p.type"
                    [attr.data-status]="p.status"
                    data-filterable
                  >
                    <td class="hidden md:table-cell">
                      <a
                        class="font-mono text-xs text-slate-500"
                        [routerLink]="['/executions', p.ref]"
                        >{{ p.ref }}</a
                      >
                    </td>
                    <td>
                      <a class="flex items-center gap-2" [routerLink]="[memberUrl(p.member.name)]">
                        <div class="avatar" [style.background]="p.member.gradient">
                          {{ p.member.initials }}
                        </div>
                        <span class="text-sm truncate min-w-0">{{ p.member.name }}</span>
                      </a>
                    </td>
                    <td class="hidden sm:table-cell">
                      <span class="badge badge-neutral">{{ typeLabel(p.type) }}</span>
                    </td>
                    <td>
                      <span class="text-sm font-semibold text-emerald-400">{{
                        formatAmount(p.amount)
                      }}</span>
                    </td>
                    <td class="hidden lg:table-cell">
                      <span class="text-xs text-slate-400">{{ p.share }}%</span>
                    </td>
                    <td>
                      <span class="badge" [class]="'badge-' + statusVariant(p.status)">{{
                        statusLabel(p.status)
                      }}</span>
                    </td>
                    <td class="hidden md:table-cell">
                      <span class="text-xs text-slate-500">{{ p.date }}</span>
                    </td>
                  </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          @if (!loading()) {
            <!-- Footer / pagination -->
            <div
              class="flex items-center justify-between px-5 py-3 text-xs text-slate-500"
              data-testid="pagination"
            >
              <span>Showing {{ pagedRows().length }} of {{ total() }}</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-ghost text-xs px-2 py-1"
                  data-page-prev
                  [disabled]="page() === 1"
                  (click)="prev()"
                >
                  <ui-icon name="chevron-left" [size]="12"></ui-icon>
                </button>
                <span data-page-num>{{ page() }} / {{ totalPages() }}</span>
                <button
                  type="button"
                  class="btn btn-ghost text-xs px-2 py-1"
                  data-page-next
                  [disabled]="page() === totalPages()"
                  (click)="next()"
                >
                  <ui-icon name="chevron-right" [size]="12"></ui-icon>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [],
})
export class PayoutsPageComponent {
  /** True until the first payoutsList() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** Raw canonical ledger rows from the injected ApiClient. */
  readonly source = signal<PayoutLedgerRow[]>([]);

  /** Total rows in the ledger (the "of N" in the pagination footer). */
  readonly total = computed(() => this.source().length);

  /** Page size for the table; matches wireframe (8 rows / page). */
  readonly pageSize = 8;

  /** Currently active filters (signals back the template). */
  readonly search = signal('');
  readonly type = signal<'all' | ViewType>('all');
  readonly typeOpen = signal(false);
  readonly status = signal<'all' | ViewStatus>('all');
  readonly page = signal(1);

  /** The 4 type-dropdown items (first is the default active). */
  readonly types: ReadonlyArray<{ key: 'all' | ViewType; label: string; icon: string }> = [
    { key: 'all', label: 'All types', icon: 'layout-grid' },
    { key: 'capital', label: 'Capital', icon: 'banknote' },
    { key: 'signal', label: 'Signal', icon: 'lightbulb' },
    { key: 'access', label: 'Access', icon: 'key' },
  ];

  /** Canonical ledger rows mapped to the wireframe view (see viewRow()). */
  readonly rows = computed(() => this.source().map(viewRow));

  /** The 3 status tabs with counts derived from the loaded ledger (48/3/45). */
  readonly statuses = computed(() => {
    const s = this.source();
    return [
      { key: 'all' as const, label: 'All', count: s.length },
      {
        key: 'pending' as const,
        label: 'Pending',
        count: s.filter((r) => statusKey(r.status) === 'pending').length,
      },
      {
        key: 'paid' as const,
        label: 'Paid',
        count: s.filter((r) => statusKey(r.status) === 'paid').length,
      },
    ];
  });

  /** Filter rows by search + type + status. */
  readonly filtered = computed<ViewRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const t = this.type();
    const s = this.status();
    return this.rows().filter((p) => {
      if (s !== 'all' && p.status !== s) return false;
      if (t !== 'all' && p.type !== t) return false;
      if (q && !p.member.name.toLowerCase().includes(q) && !p.ref.toLowerCase().includes(q))
        return false;
      return true;
    });
  });

  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  constructor(private readonly client: ApiClient) {
    this.client
      .payoutsList()
      .then((r) => this.source.set(r.payouts))
      .finally(() => this.loading.set(false));
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
    this.page.set(1);
  }

  toggleTypeMenu(): void {
    this.typeOpen.update((v) => !v);
  }

  closeTypeMenu(): void {
    this.typeOpen.set(false);
  }

  selectType(t: 'all' | ViewType): void {
    this.type.set(t);
    this.typeOpen.set(false);
    this.page.set(1);
  }

  setStatus(s: 'all' | ViewStatus): void {
    this.status.set(s);
    this.page.set(1);
  }

  prev(): void {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  next(): void {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }

  /** Format an API money string as "+$X,XXX.XX" (wireframe style). */
  formatAmount(amount: string): string {
    return formatApiMoney(amount, 'always');
  }

  typeLabel(t: ViewType): string {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  statusLabel(s: ViewStatus): string {
    return s === 'paid' ? 'Paid' : 'Pending';
  }

  statusVariant(s: ViewStatus): 'success' | 'warning' {
    return s === 'paid' ? 'success' : 'warning';
  }

  /** Slug-ify a member name into the URL-safe form (mirrors community-members). */
  slugForName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /** Default-community member route (global-page precedent). */
  memberUrl(name: string): string {
    return `/community/alpha/members/${this.slugForName(name)}`;
  }
}
