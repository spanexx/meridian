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
 * Demo data is hardcoded per the wireframe. Backend wiring is a later
 * pack.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

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

@Component({
  selector: 'app-opportunities-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <i class="w-4 h-4" data-lucide="filter"></i>Category
            </button>
            <a class="btn btn-primary" href="/submit-signal">
              <i class="w-4 h-4" data-lucide="plus"></i>Submit Signal
            </a>
          </div>
        </div>
      </header>

      <!-- Category dropdown menu (hidden until opened by the dropdown trigger) -->
      <div class="menu" id="catMenu" hidden>
        <div class="menu-head">Category</div>
        <button class="menu-item active" data-filter-category="all">
          <i class="w-4 h-4" data-lucide="layout-grid"></i>All categories
        </button>
        <button class="menu-item" data-filter-category="apparel">
          <i class="w-4 h-4" data-lucide="shirt"></i>Apparel
        </button>
        <button class="menu-item" data-filter-category="collectibles">
          <i class="w-4 h-4" data-lucide="package"></i>Collectibles
        </button>
        <button class="menu-item" data-filter-category="electronics">
          <i class="w-4 h-4" data-lucide="cpu"></i>Electronics
        </button>
        <button class="menu-item" data-filter-category="equipment">
          <i class="w-4 h-4" data-lucide="wrench"></i>Equipment
        </button>
        <button class="menu-item" data-filter-category="furniture">
          <i class="w-4 h-4" data-lucide="armchair"></i>Furniture
        </button>
      </div>

      <!-- Status tabs (one row, desktop) -->
      <div class="tabs mb-6 hidden sm:flex" data-testid="status-filter">
        @for (s of statuses; track s.key) {
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
        @for (s of statuses; track s.key) {
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
                <tr class="table-row" [attr.data-category]="opp.category" [attr.data-status]="opp.status" data-filterable>
                  <td class="hidden md:table-cell">
                    <a [attr.href]="'/opportunity-detail/' + opp.ref">
                      <span class="text-xs text-slate-500 font-mono">{{ opp.ref }}</span>
                    </a>
                  </td>
                  <td>
                    <a [attr.href]="'/opportunity-detail/' + opp.ref">
                      <div class="font-medium">{{ opp.title }}</div>
                      <div class="text-xs text-slate-500 mt-0.5">{{ opp.subtitle }}</div>
                    </a>
                  </td>
                  <td class="hidden md:table-cell">
                    <span class="badge badge-neutral">{{ categoryLabel(opp.category) }}</span>
                  </td>
                  <td class="hidden lg:table-cell">
                    <a class="flex items-center gap-2" [attr.href]="'/member-detail/' + opp.submitter.name">
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
                    <a [attr.href]="'/opportunity-detail/' + opp.ref">
                      <i class="w-4 h-4 text-slate-500" data-lucide="arrow-right"></i>
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
            Showing <span data-showing-start>{{ ((page() - 1) * pageSize) + 1 }}</span>–<span data-showing-end>{{ Math.min(page() * pageSize, all.length) }}</span> of {{ all.length }}
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

  /** The 6 status tabs with their counts (matches wireframe counts). */
  readonly statuses = [
    { key: 'all',       label: 'All',         count: 24 },
    { key: 'pending',   label: 'Pending',     count: 8 },
    { key: 'vetting',   label: 'In Vetting',  count: 5 },
    { key: 'approved',  label: 'Approved',    count: 3 },
    { key: 'executing', label: 'Executing',   count: 2 },
    { key: 'rejected',  label: 'Rejected',    count: 6 },
  ] as const;

  /** Filter rows by the active status tab. */
  readonly filtered = computed<Opportunity[]>(() => {
    const s = this.status();
    if (s === 'all') return this.all;
    return this.all.filter((o) => o.status === s);
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  /** The slice of `filtered()` for the current page. */
  readonly pagedRows = computed<Opportunity[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /** Full 24-row dataset, ordered as the wireframe. */
  readonly all: Opportunity[] = [
    { ref: 'O-2051', title: 'Bulk Lego Set Resale',           subtitle: 'Retired Star Wars sets · 6 lots',                 category: 'collectibles', submitter: { initials: 'SP', name: 'Sarah Park',     gradient: 'var(--gradient-violet)' }, estRoi: 34.2, capital: 8200,  votesUp: 4,  votesDown: 0, status: 'vetting' },
    { ref: 'O-2050', title: 'Restaurant Equipment Resale',    subtitle: 'Commercial espresso machine · local close',     category: 'equipment',    submitter: { initials: 'MR', name: 'Marcus Rivera',  gradient: 'var(--gradient-emerald)' }, estRoi: 22.8, capital: 4500,  votesUp: 2,  votesDown: 1, status: 'vetting' },
    { ref: 'O-2049', title: 'Travis Scott × Nike Sneakers',   subtitle: 'Limited drop · Wholesale from boutique',         category: 'apparel',      submitter: { initials: 'MR', name: 'Mike Rivera',    gradient: 'var(--gradient-emerald)' }, estRoi: 51.4, capital: 14200, votesUp: 3,  votesDown: 1, status: 'vetting' },
    { ref: 'O-2048', title: 'Designer Furniture Resale',      subtitle: 'Herman Miller · 12 chairs from office clearance', category: 'furniture',    submitter: { initials: 'JT', name: 'Jules Tan',      gradient: 'var(--gradient-violet)' }, estRoi: 18.5, capital: 7800,  votesUp: null, votesDown: null, status: 'pending' },
    { ref: 'O-2047', title: 'Vintage Camera Lot',             subtitle: 'Leica M3 · 2 units from estate',                 category: 'collectibles', submitter: { initials: 'KH', name: 'Kenji Honda',    gradient: 'var(--gradient-emerald)' }, estRoi: 41.0, capital: 5400,  votesUp: null, votesDown: null, status: 'pending' },
    { ref: 'O-2045', title: 'Vinyl Record Collection',        subtitle: 'First pressings · 320 records',                  category: 'collectibles', submitter: { initials: 'AC', name: 'Alex Chen',      gradient: 'var(--gradient-violet)' }, estRoi: 28.6, capital: 3200,  votesUp: 5,  votesDown: 0, status: 'approved' },
    { ref: 'O-2043', title: 'PS5 Bundle Bulk',                subtitle: '8 bundles · wholesale',                          category: 'electronics',  submitter: { initials: 'SP', name: 'Sarah Park',     gradient: 'var(--gradient-violet)' }, estRoi: 15.2, capital: 22000, votesUp: 4,  votesDown: 1, status: 'approved' },
    { ref: 'O-2037', title: 'Travis Scott × Nike (E-1042)',   subtitle: '8 pairs · listed on StockX, GOAT',              category: 'apparel',      submitter: { initials: 'MR', name: 'Mike Rivera',    gradient: 'var(--gradient-emerald)' }, estRoi: 51.4, capital: 18500, votesUp: 3,  votesDown: 0, status: 'executing' },
    { ref: 'O-2031', title: 'Eames Lounge Replica (no-auth)', subtitle: 'Forged lounge · no certificate',                category: 'furniture',    submitter: { initials: 'KT', name: 'Kenji Tanaka',   gradient: 'var(--gradient-violet)' }, estRoi: 6.0,  capital: 1400,  votesUp: 1,  votesDown: 6, status: 'rejected' },
    { ref: 'O-2028', title: 'Pokemon Base Set Booster Box',   subtitle: 'Sealed · 12 boxes',                              category: 'collectibles', submitter: { initials: 'LB', name: 'Lucia Bianchi',  gradient: 'var(--gradient-emerald)' }, estRoi: 31.0, capital: 9500,  votesUp: 6,  votesDown: 7, status: 'executing' },
    { ref: 'O-2025', title: 'Gibson Les Paul Studio',         subtitle: '2018 sunburst · hard case included',             category: 'electronics',  submitter: { initials: 'DO', name: 'Daria Olsen',    gradient: 'var(--gradient-violet)' }, estRoi: 11.0, capital: 2200,  votesUp: 3,  votesDown: 3, status: 'vetting' },
    { ref: 'O-2022', title: 'Herman Miller Aeron (size B)',   subtitle: 'Refurbished · 5-year warranty',                  category: 'furniture',    submitter: { initials: 'PA', name: 'Pavel Afolabi',  gradient: 'var(--gradient-emerald)' }, estRoi: 4.0,  capital: 1800,  votesUp: 2,  votesDown: 6, status: 'pending' },
    { ref: 'O-2019', title: 'Stone Island Shadow Project',    subtitle: 'Jacket · FW23',                                  category: 'apparel',      submitter: { initials: 'IK', name: 'Ivan Kovalev',   gradient: 'var(--gradient-violet)' }, estRoi: 19.0, capital: 1100,  votesUp: 4,  votesDown: 4, status: 'approved' },
    { ref: 'O-2014', title: 'Yeezy Boost 350 V2 (Bone)',      subtitle: 'Deadstock · size 10',                            category: 'apparel',      submitter: { initials: 'SP', name: 'Sarah Park',     gradient: 'var(--gradient-violet)' }, estRoi: 22.0, capital: 7600,  votesUp: 5,  votesDown: 5, status: 'rejected' },
    { ref: 'O-2011', title: 'Topps 1986 Fleer Jordan #57',    subtitle: 'PSA 9 graded',                                   category: 'collectibles', submitter: { initials: 'MN', name: 'Mai Nguyen',     gradient: 'var(--gradient-emerald)' }, estRoi: 14.0, capital: 12000, votesUp: 7,  votesDown: 9, status: 'pending' },
    { ref: 'O-2008', title: 'Wüsthof Classic 8" chef knife', subtitle: '3-piece set',                                    category: 'equipment',    submitter: { initials: 'RM', name: 'Rolf Müller',    gradient: 'var(--gradient-violet)' }, estRoi: 12.0, capital: 240,   votesUp: 4,  votesDown: 4, status: 'pending' },
    { ref: 'O-2005', title: 'Vintage Sony Walkman D-250',     subtitle: 'New belts · working',                            category: 'electronics',  submitter: { initials: 'AF', name: 'Ana Fernandez',  gradient: 'var(--gradient-emerald)' }, estRoi: 9.0,  capital: 900,   votesUp: 2,  votesDown: 5, status: 'rejected' },
    { ref: 'O-2002', title: 'Nike Air Max 1 × 5 lots',        subtitle: 'OG colorways · deadstock',                       category: 'apparel',      submitter: { initials: 'JA', name: 'Jay Adekunle',   gradient: 'var(--gradient-violet)' }, estRoi: 18.0, capital: 4200,  votesUp: 3,  votesDown: 4, status: 'pending' },
    { ref: 'O-1996', title: 'Antique Pocket Watch',           subtitle: '1908 Elgin · working',                           category: 'collectibles', submitter: { initials: 'KH', name: 'Kenji Honda',    gradient: 'var(--gradient-emerald)' }, estRoi: 8.0,  capital: 320,   votesUp: 1,  votesDown: 1, status: 'rejected' },
    { ref: 'O-1991', title: 'Herman Miller Embody',           subtitle: 'Graphite · size C',                              category: 'furniture',    submitter: { initials: 'PA', name: 'Pavel Afolabi',  gradient: 'var(--gradient-emerald)' }, estRoi: 5.0,  capital: 1500,  votesUp: 2,  votesDown: 3, status: 'rejected' },
    { ref: 'O-1984', title: 'Roland TR-08 Rhythm Composer',   subtitle: 'Boutique · original box',                         category: 'electronics',  submitter: { initials: 'DO', name: 'Daria Olsen',    gradient: 'var(--gradient-violet)' }, estRoi: 7.0,  capital: 480,   votesUp: 3,  votesDown: 2, status: 'pending' },
    { ref: 'O-1977', title: 'Bottega Veneta Cassette Bag',    subtitle: 'Intrecciato · used',                             category: 'apparel',      submitter: { initials: 'LB', name: 'Lucia Bianchi',  gradient: 'var(--gradient-emerald)' }, estRoi: 16.0, capital: 2400,  votesUp: 4,  votesDown: 2, status: 'approved' },
    { ref: 'O-1970', title: "Kaws 'OriginalFake' Companion",  subtitle: '2002 · opened display',                          category: 'collectibles', submitter: { initials: 'IK', name: 'Ivan Kovalev',   gradient: 'var(--gradient-violet)' }, estRoi: 13.0, capital: 1800,  votesUp: 5,  votesDown: 4, status: 'rejected' },
    { ref: 'O-1963', title: 'Professional Espresso Machine',  subtitle: 'La Marzocco Linea Mini',                         category: 'equipment',    submitter: { initials: 'RM', name: 'Rolf Müller',    gradient: 'var(--gradient-violet)' }, estRoi: 25.0, capital: 6800,  votesUp: 6,  votesDown: 1, status: 'approved' },
  ];

  /** Public helper to expose Math in the template (safe). */
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
}
