/**
 * OpportunitiesPageComponent — wireframe-aligned signal pipeline.
 *
 * Per wireframe/meridian/opportunities/index.html. Behavior pins:
 *   - title + 'The signal pipeline — 24 active across all stages.'
 *   - Search input + Category DROPDOWN trigger + Submit Signal CTA
 *   - 6 status tabs with counts: All / Pending / In Vetting / Approved /
 *     Executing / Rejected
 *   - 9-column table: Ref / Title / Category / Submitted by / Est. ROI /
 *     Capital / Votes / Status / (arrow)
 *   - 24-row dataset, paginated 8 per page (3 pages)
 *   - Footer 'Showing N of 24' + prev/next pagination
 *
 * Backend-readiness (Job D): the constructor consumes GET /opportunities and
 * maps (OpportunityListRow[]) through toOpportunityViewModel() (pure,
 * unit-tested) into the Opportunity view model the template renders. The
 * canonical rows seed statuses, ROI, capital, votes, and submitter names;
 * product category / subtitle / avatar initials+gradient are wireframe-only
 * presentation fields (mitigated per community-members MEMBER_PRESENTATION
 * pattern — see models/opportunity.ts §4.4 gap). There is no module-local
 * dataset.
 *
 * @owner   spanexx
 * @reviewed 2026-08-21
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { ApiClient } from '../../core/api/api-client';
import type { OpportunityListRow, OpportunityStatus } from '../../core/models';

interface Submitter {
  initials: string;
  name: string;
  gradient: string;     // CSS background for the avatar circle
}

interface Opportunity {
  ref: string;
  title: string;
  subtitle: string;
  category: 'apparel' | 'collectibles' | 'electronics' | 'equipment' | 'furniture';
  submitter: Submitter;
  estRoi: number;       // positive percentage; rendered as +34.2%
  capital: number;      // rendered with thousands separator ($8,200)
  votesUp: number | null;
  votesDown: number | null;
  status: 'pending' | 'vetting' | 'approved' | 'executing' | 'rejected';
}

const STATUS_LABELS: Record<Opportunity['status'], string> = {
  pending: 'Pending',
  vetting: 'In Vetting',
  approved: 'Approved',
  executing: 'Executing',
  rejected: 'Rejected',
};

const STATUS_VARIANT: Record<Opportunity['status'], 'warning' | 'info' | 'success' | 'violet' | 'danger'> = {
  pending: 'info',
  vetting: 'warning',
  approved: 'success',
  executing: 'violet',
  rejected: 'danger',
};

// ─── canonical OpportunityListRow → page view mapper (pure; unit-tested) ───

/** Canonical lifecycle status → wireframe view status. */
const STATUS_TO_VIEW: Record<OpportunityStatus, Opportunity['status']> = {
  DRAFT: 'pending',
  SUBMITTED: 'pending',
  VETTING: 'vetting',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executing',
  EXPIRED: 'rejected',
};

/**
 * Wireframe-only presentation fields that the canonical list row does not
 * carry (models/opportunity.ts §4.4 gap, mirroring community-members.page.ts
 * MEMBER_PRESENTATION):
 *   - product category  — the canonical CATEGORY map (mock-seed.ts) folds
 *     every product category into RETAIL_ARBITRAGE, so apparel/collectibles/
 *     electronics/equipment/furniture are not derivable from the row; and
 *   - subtitle           — no canonical field exists (UI subtitle came from
 *     the POST description until the detail endpoint is documented).
 * Both are supplied module-locally keyed by opportunity_id so the canonical
 * mapping still produces the wireframe-faithful render.
 */
const OPP_PRESENTATION: Readonly<Record<string, { subtitle: string; category: Opportunity['category'] }>> = {
  'O-2051': { subtitle: 'Retired Star Wars sets · 6 lots', category: 'collectibles' },
  'O-2050': { subtitle: 'Commercial espresso machine · local close', category: 'equipment' },
  'O-2049': { subtitle: 'Limited drop · Wholesale from boutique', category: 'apparel' },
  'O-2048': { subtitle: 'Herman Miller · 12 chairs from office clearance', category: 'furniture' },
  'O-2047': { subtitle: 'Leica M3 · 2 units from estate', category: 'collectibles' },
  'O-2045': { subtitle: 'First pressings · 320 records', category: 'collectibles' },
  'O-2043': { subtitle: '8 bundles · wholesale', category: 'electronics' },
  'O-2037': { subtitle: '8 pairs · listed on StockX, GOAT', category: 'apparel' },
  'O-2031': { subtitle: 'Forged lounge · no certificate', category: 'furniture' },
  'O-2028': { subtitle: 'Sealed · 12 boxes', category: 'collectibles' },
  'O-2025': { subtitle: '2018 sunburst · case included', category: 'electronics' },
  'O-2022': { subtitle: 'Refurbished · 5-year warranty', category: 'furniture' },
  'O-2019': { subtitle: 'Jacket · FW23', category: 'apparel' },
  'O-2014': { subtitle: 'Deadstock · size 10', category: 'apparel' },
  'O-2011': { subtitle: 'PSA 9 graded', category: 'collectibles' },
  'O-2008': { subtitle: '3-piece set', category: 'equipment' },
  'O-2005': { subtitle: 'New belts · working', category: 'electronics' },
  'O-2002': { subtitle: 'OG colorways · deadstock', category: 'apparel' },
  'O-1996': { subtitle: '1908 Elgin · working', category: 'collectibles' },
  'O-1991': { subtitle: 'Graphite · size C', category: 'furniture' },
  'O-1984': { subtitle: 'Boutique · original box', category: 'electronics' },
  'O-1977': { subtitle: 'Intrecciato · used', category: 'apparel' },
  'O-1970': { subtitle: '2002 · opened display', category: 'collectibles' },
  'O-1963': { subtitle: 'La Marzocco Linea Mini', category: 'equipment' },
};

/** Avatar initials + gradient keyed by submitter display name (wireframe-only). */
const SUBMITTER_PRESENTATION: Readonly<Record<string, { initials: string; gradient: string }>> = {
  'Sarah Park': { initials: 'SP', gradient: 'var(--gradient-copper)' },
  'Marcus Rivera': { initials: 'MR', gradient: 'var(--gradient-emerald)' },
  'Mike Rivera': { initials: 'MR', gradient: 'var(--gradient-emerald)' },
  'Jules Tan': { initials: 'JT', gradient: 'var(--gradient-copper)' },
  'Kenji Honda': { initials: 'KH', gradient: 'var(--gradient-emerald)' },
  'Alex Chen': { initials: 'AC', gradient: 'var(--gradient-copper)' },
  'Kenji Tanaka': { initials: 'KT', gradient: 'var(--gradient-copper)' },
  'Lucia Bianchi': { initials: 'LB', gradient: 'var(--gradient-emerald)' },
  'Daria Olsen': { initials: 'DO', gradient: 'var(--gradient-copper)' },
  'Pavel Afolabi': { initials: 'PA', gradient: 'var(--gradient-emerald)' },
  'Ivan Kovalev': { initials: 'IK', gradient: 'var(--gradient-copper)' },
  'Mai Nguyen': { initials: 'MN', gradient: 'var(--gradient-emerald)' },
  'Rolf Müller': { initials: 'RM', gradient: 'var(--gradient-copper)' },
  'Ana Fernandez': { initials: 'AF', gradient: 'var(--gradient-emerald)' },
  'Jay Adekunle': { initials: 'JA', gradient: 'var(--gradient-copper)' },
};

const DEFAULT_GRADIENT = 'var(--gradient-copper)';

/** Map one canonical GET /opportunities row into the view model. */
function toOpportunity(r: OpportunityListRow): Opportunity {
  const pres = OPP_PRESENTATION[r.opportunity_id];
  const sub = SUBMITTER_PRESENTATION[r.submitted_by?.display_name ?? ''];
  const voting = r.vetting_status;
  return {
    ref: r.opportunity_id,
    title: r.title,
    subtitle: pres?.subtitle ?? '',
    category: pres?.category ?? 'apparel',
    submitter: {
      initials: sub?.initials ?? '',
      name: r.submitted_by?.display_name ?? '',
      gradient: sub?.gradient ?? DEFAULT_GRADIENT,
    },
    estRoi: r.financials?.estimated_roi ?? 0,
    capital: r.financials?.capital_needed ?? 0,
    // Preserve null (renders "—") when no vetting block — matches the
    // wireframe's no-vote rows (O-2048, O-2047) and the unit/e2e pins.
    votesUp: voting ? voting.votes_for : null,
    votesDown: voting ? voting.votes_against : null,
    status: r.status ? STATUS_TO_VIEW[r.status] : 'pending',
  };
}

/**
 * Map canonical GET /opportunities rows (OpportunityListRow[]) into the page
 * view model. Pure + unit-tested in opportunities.page.spec.ts.
 */
export function toOpportunityViewModel(rows: OpportunityListRow[]): Opportunity[] {
  return rows.map(toOpportunity);
}

@Component({
  selector: 'app-opportunities-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  template: `
    <section class="page">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="page-title">Opportunities</h1>
          <p class="page-subtitle">The signal pipeline — 24 active across all stages.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            class="input w-full sm:w-56"
            type="search"
            placeholder="Search signals…"
            data-testid="search"
          />
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              class="btn btn-secondary"
              data-dropdown="catMenu"
              aria-label="Category"
            >
              <ui-icon name="filter" [size]="16"></ui-icon>Category
            </button>
            <a class="btn btn-primary" [routerLink]="['/submit-signal']">
              <ui-icon name="plus" [size]="16"></ui-icon>Submit Signal
            </a>
          </div>
        </div>
      </header>

      <!-- Category dropdown menu (hidden until opened by the dropdown trigger) -->
      <div class="menu" id="catMenu" hidden>
        <div class="menu-head">Category</div>
        <button class="menu-item active" data-filter-category="all">
          <ui-icon name="layout-grid" [size]="16"></ui-icon>All categories
        </button>
        <button class="menu-item" data-filter-category="apparel">
          <ui-icon name="shirt" [size]="16"></ui-icon>Apparel
        </button>
        <button class="menu-item" data-filter-category="collectibles">
          <ui-icon name="package" [size]="16"></ui-icon>Collectibles
        </button>
        <button class="menu-item" data-filter-category="electronics">
          <ui-icon name="cpu" [size]="16"></ui-icon>Electronics
        </button>
        <button class="menu-item" data-filter-category="equipment">
          <ui-icon name="wrench" [size]="16"></ui-icon>Equipment
        </button>
        <button class="menu-item" data-filter-category="furniture">
          <ui-icon name="armchair" [size]="16"></ui-icon>Furniture
        </button>
      </div>

      <!-- Status tabs (one row, desktop) -->
      <div class="tabs mb-6 hidden sm:flex" data-testid="status-filter">
        @for (s of statuses(); track s.key) {
          <button
            type="button"
            [attr.aria-selected]="status() === s.key"
            [class.active]="status() === s.key"
            class="tab"
            [attr.data-filter-tab]="s.key"
            (click)="status.set(s.key)"
          >{{ s.label }} <span class="text-slate-500">{{ s.count }}</span></button>
        }
      </div>

      <!-- Status filter dropdown (mobile, mirrors the tabs) -->
      <select
        class="input w-full mb-6 sm:hidden"
        data-testid="status-select"
        [attr.aria-label]="'Filter by status'"
        [value]="status()"
        (change)="onStatusChange($event)"
      >
        @for (s of statuses(); track s.key) {
          <option [attr.value]="s.key">{{ s.label }} {{ s.count }}</option>
        }
      </select>

      <!-- Table -->
      <div class="card p-0 overflow-hidden">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th class="hidden md:table-cell">Ref</th>
                <th>Title</th>
                <th class="hidden md:table-cell">Category</th>
                <th class="hidden lg:table-cell">Submitted by</th>
                <th class="hidden sm:table-cell">Est. ROI</th>
                <th class="hidden lg:table-cell">Capital</th>
                <th class="hidden lg:table-cell">Votes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (opp of pagedRows(); track opp.ref) {
                <tr
                  class="table-row"
                  [attr.data-category]="opp.category"
                  [attr.data-status]="opp.status"
                  data-filterable
                >
                  <td class="hidden md:table-cell">
                    <a [routerLink]="['/opportunities', opp.ref]">
                      <span class="text-xs text-slate-500 font-mono">{{ opp.ref }}</span>
                    </a>
                  </td>
                  <td>
                    <a [routerLink]="['/opportunities', opp.ref]">
                      <div class="font-medium">{{ opp.title }}</div>
                      <div class="text-xs text-slate-500 mt-0.5">{{ opp.subtitle }}</div>
                    </a>
                  </td>
                  <td class="hidden md:table-cell">
                    <span class="badge badge-neutral">{{ categoryLabel(opp.category) }}</span>
                  </td>
                  <td class="hidden lg:table-cell">
                    <a [routerLink]="['/community', 'alpha', 'members', opp.submitter.name]" class="flex items-center gap-2">
                      <div class="avatar" [style.background]="opp.submitter.gradient">{{ opp.submitter.initials }}</div>
                      <span class="text-xs truncate min-w-0">{{ opp.submitter.name }}</span>
                    </a>
                  </td>
                  <td class="hidden sm:table-cell">
                    <span class="text-emerald-400 font-semibold">{{ formatRoi(opp.estRoi) }}</span>
                  </td>
                  <td class="hidden lg:table-cell">
                    <span class="text-xs text-slate-300">{{ formatCapital(opp.capital) }}</span>
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
                  <td>
                    <span class="badge" [class]="'badge-' + statusVariant(opp.status)">{{ statusLabel(opp.status) }}</span>
                  </td>
                  <td>
                    <a [routerLink]="['/opportunities', opp.ref]">
                      <ui-icon name="arrow-right" [size]="16" class="text-slate-500"></ui-icon>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Footer / pagination -->
        <div class="flex items-center justify-between p-4 border-t" style="border-color: var(--border-subtle);" data-testid="pagination">
          <span class="text-xs text-slate-500">
            Showing <span data-showing-start>{{ ((page() - 1) * pageSize) + 1 }}</span>–<span data-showing-end>{{ Math.min(page() * pageSize, all().length) }}</span> of {{ all().length }}
          </span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost text-xs px-2 py-1"
              data-page-prev
              [disabled]="page() === 1"
              (click)="prev()"
            >‹</button>
            <span data-page-num>{{ page() }} / {{ totalPages() }}</span>
            <button
              type="button"
              class="btn btn-ghost text-xs px-2 py-1"
              data-page-next
              [disabled]="page() === totalPages()"
              (click)="next()"
            >›</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class OpportunitiesPageComponent {
  /** Page size for the table; matches wireframe (8 rows / page). */
  readonly pageSize = 8;

  /** Currently selected status tab. */
  readonly status = signal<'all' | Opportunity['status']>('all');
  readonly page = signal(1);

  /** Mobile dropdown: mirror a tab selection into the status signal. */
  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | Opportunity['status'];
    this.status.set(value);
    this.page.set(1);
  }

  /** The 6 status tabs + counts derived LIVE from the loaded rows. */
  readonly statuses = computed<readonly { key: 'all' | Opportunity['status']; label: string; count: number }[]>(() => {
    const rows = this.all();
    const count = (s: Opportunity['status']) => rows.filter((o) => o.status === s).length;
    return [
      { key: 'all', label: 'All', count: rows.length },
      { key: 'pending', label: 'Pending', count: count('pending') },
      { key: 'vetting', label: 'In Vetting', count: count('vetting') },
      { key: 'approved', label: 'Approved', count: count('approved') },
      { key: 'executing', label: 'Executing', count: count('executing') },
      { key: 'rejected', label: 'Rejected', count: count('rejected') },
    ];
  });

  /** Filter rows by the active status tab. */
  readonly filtered = computed<Opportunity[]>(() => {
    const s = this.status();
    if (s === 'all') return this.all();
    return this.all().filter((o) => o.status === s);
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  /** The slice of `filtered()` for the current page. */
  readonly pagedRows = computed<Opportunity[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /** Live Opportunity rows — canonicalized from the GET /opportunities seed. */
  readonly all = signal<Opportunity[]>([]);

  readonly Math = Math;

  /** Format the capital with thousands separator (12345 → "$12,345"). */
  formatCapital(n: number): string {
    return `$${n.toLocaleString('en-US')}`;
  }

  /** Format ROI as "+X.X%" (always positive per the wireframe data). */
  formatRoi(n: number): string {
    return `+${n.toFixed(1)}%`;
  }

  /** Capitalize the category label for the badge. */
  categoryLabel(c: Opportunity['category']): string {
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  statusLabel(s: Opportunity['status']): string {
    return STATUS_LABELS[s];
  }

  statusVariant(s: Opportunity['status']): 'warning' | 'info' | 'success' | 'violet' | 'danger' {
    return STATUS_VARIANT[s];
  }

  prev(): void {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  next(): void {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }

  private readonly client = inject(ApiClient);

  constructor() {
    // Job D (backend-readiness audit): consume the canonical endpoint.
    // The 24-row wireframe dataset lives in SEED_OPPORTUNITIES (mock-seed);
    // map each canonical row into the view model and feed the signal so the
    // template renders live data (status tabs + pagination derive from rows).
    this.client
      .opportunitiesList()
      .then((r) => this.all.set(toOpportunityViewModel(r.opportunities)))
      .catch(() => undefined);
  }
}
