/**
 * Opportunities page — lists open arbitrage opportunities submitted by
 * members, filterable by category and vetting status. Backed by the
 * Opportunity domain shape described in docs/02-data-model.md:
 *   ref (O-####) · title · category · submittedBy · estRoi ·
 *   capitalRequested · votes (for/against) · status (pending|in_vetting|
 *   approved|executing|rejected|done)
 *
 * Page renders:
 *   - top heading "Opportunities"
 *   - category filter pill row (native <button> with aria-pressed —
 *     aria-pressed is a toggle-button semantic that doesn't belong on
 *     the generic UiButtonComponent, so we use raw markup here)
 *   - status filter pill row (same pattern)
 *   - a UiTable listing all opportunities that match the current filters
 *
 * Reactive state is kept in signals: a category signal + a status signal.
 * Both default to "All"/"All categories" so the page renders the full
 * table on first paint.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { UiTableComponent, type UiTableColumn } from '../../ui/table/table.component';

interface Opportunity {
  ref: string;
  title: string;
  category: string;
  submittedBy: string;
  estRoi: number;
  capital: number;
  votes: { for: number; against: number };
  status: 'pending' | 'in_vetting' | 'approved' | 'executing' | 'rejected' | 'done';
}

interface OpportunityRow {
  ref: string;
  title: string;
  category: string;
  submittedBy: string;
  estRoi: string;
  capital: string;
  votes: string;
  status: string;
}

@Component({
  selector: 'ui-opportunities-page',
  standalone: true,
  imports: [UiTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="p-6 lg:p-8 max-w-7xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Opportunities</h1>
        <p class="text-sm text-slate-400 mt-1">
          Live deal flow for vetting. Click a row to open the deal room.
        </p>
      </header>

      <!-- Category filter -->
      <section class="mb-4" data-testid="category-filter">
        <div class="flex flex-wrap items-center gap-2">
          @for (cat of categories; track cat) {
            <button
              type="button"
              class="btn rounded-full px-3 py-1 text-xs"
              [class.btn-primary]="category() === cat"
              [class.btn-secondary]="category() !== cat"
              [attr.aria-pressed]="category() === cat"
              (click)="category.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>
      </section>

      <!-- Status filter -->
      <section class="mb-4" data-testid="status-filter">
        <div class="flex flex-wrap items-center gap-2">
          @for (st of statuses; track st) {
            <button
              type="button"
              class="btn rounded-full px-3 py-1 text-xs"
              [class.btn-primary]="status() === st"
              [class.btn-secondary]="status() !== st"
              [attr.aria-pressed]="status() === st"
              (click)="status.set(st)"
            >
              {{ st }}
              @if (st !== 'All') {
                <span class="ml-1 text-[10px] opacity-70">
                  ({{ countByStatus(st) }})
                </span>
              }
            </button>
          }
        </div>
      </section>

      <!-- Listing table -->
      <section>
        <ui-table [columns]="columns" [rows]="visibleRows()" />
      </section>
    </main>
  `,
})
export class OpportunitiesPageComponent {
  /** Category filter — first entry is the unfiltered "All categories". */
  readonly categories = [
    'All categories',
    'Apparel',
    'Collectibles',
    'Electronics',
    'Equipment',
    'Furniture',
  ] as const;

  /** Status filter — first entry is the unfiltered "All". */
  readonly statuses = [
    'All',
    'Pending',
    'In Vetting',
    'Approved',
    'Executing',
    'Rejected',
  ] as const;

  /** Visible column headers in order (matches the wireframe spec). */
  readonly columns: UiTableColumn<OpportunityRow>[] = [
    { key: 'ref', label: 'Ref' },
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'submittedBy', label: 'Submitted by' },
    { key: 'estRoi', label: 'Est. ROI', align: 'right' },
    { key: 'capital', label: 'Capital', align: 'right' },
    { key: 'votes', label: 'Votes', align: 'right' },
    { key: 'status', label: 'Status' },
  ];

  /** Currently selected category filter (default: 'All categories'). */
  readonly category = signal<(typeof this.categories)[number]>('All categories');

  /** Currently selected status filter (default: 'All'). */
  readonly status = signal<(typeof this.statuses)[number]>('All');

  /** Static demo dataset — backend wiring deferred to a later pack. */
  private readonly allOpportunities: Opportunity[] = [
    { ref: 'O-2051', title: 'Nike Air Max 1 × 5 lots', category: 'Apparel', submittedBy: 'j.adekunle', estRoi: 18, capital: 4200, votes: { for: 3, against: 1 }, status: 'pending' },
    { ref: 'O-2048', title: 'Yeezy Boost 350 V2 (Bone)', category: 'Apparel', submittedBy: 's.park', estRoi: 22, capital: 7600, votes: { for: 5, against: 0 }, status: 'in_vetting' },
    { ref: 'O-2044', title: 'Topps 1986 Fleer Jordan #57 PSA 9', category: 'Collectibles', submittedBy: 'm.nguyen', estRoi: 14, capital: 12000, votes: { for: 7, against: 2 }, status: 'approved' },
    { ref: 'O-2039', title: 'Vintage Sony Walkman D-250', category: 'Electronics', submittedBy: 'a.fernandez', estRoi: 9, capital: 900, votes: { for: 2, against: 3 }, status: 'rejected' },
    { ref: 'O-2036', title: 'Wüsthof Classic 8" chef knife', category: 'Equipment', submittedBy: 'r.müller', estRoi: 12, capital: 240, votes: { for: 4, against: 0 }, status: 'pending' },
    { ref: 'O-2031', title: 'Eames Lounge replica (no-auth)', category: 'Furniture', submittedBy: 'k.tanaka', estRoi: 6, capital: 1400, votes: { for: 1, against: 5 }, status: 'rejected' },
    { ref: 'O-2028', title: 'Pokemon Base Set Booster Box', category: 'Collectibles', submittedBy: 'l.bianchi', estRoi: 31, capital: 9500, votes: { for: 6, against: 1 }, status: 'executing' },
    { ref: 'O-2025', title: 'Gibson Les Paul Studio', category: 'Electronics', submittedBy: 'd.olsen', estRoi: 11, capital: 2200, votes: { for: 3, against: 0 }, status: 'in_vetting' },
    { ref: 'O-2022', title: 'Herman Miller Aeron (size B)', category: 'Furniture', submittedBy: 'p.afolabi', estRoi: 4, capital: 1800, votes: { for: 2, against: 4 }, status: 'pending' },
    { ref: 'O-2019', title: 'Stone Island Shadow Project jacket', category: 'Apparel', submittedBy: 'i.kovalev', estRoi: 19, capital: 1100, votes: { for: 4, against: 0 }, status: 'approved' },
  ];

  /** Categories applied first; then status. */
  readonly visibleRows = computed<OpportunityRow[]>(() => {
    const cat = this.category();
    const stat = this.status();
    return this.allOpportunities
      .filter((o) => cat === 'All categories' || o.category === cat)
      .filter((o) => stat === 'All' || this.statusLabel(o.status) === stat)
      .map<OpportunityRow>((o) => ({
        ref: o.ref,
        title: o.title,
        category: o.category,
        submittedBy: o.submittedBy,
        estRoi: `${o.estRoi.toFixed(1)}%`,
        capital: this.formatCurrency(o.capital),
        votes: `${o.votes.for}/${o.votes.for + o.votes.against}`,
        status: this.statusLabel(o.status),
      }));
  });

  /** Map internal kebab-case status to the human label used by pills. */
  private statusLabel(s: Opportunity['status']): string {
    return ({
      pending: 'Pending',
      in_vetting: 'In Vetting',
      approved: 'Approved',
      executing: 'Executing',
      rejected: 'Rejected',
      done: 'Rejected',
    } as const)[s];
  }

  /**
   * Count of opportunities in a given status (for the "Pending 8" pills).
   *
   * Covered by unit test "countByStatus returns the demo dataset
   * tally per status" in opportunities.page.spec.ts.
   */
  countByStatus(target: string): number {
    return this.allOpportunities.filter(
      (o) => this.statusLabel(o.status) === target,
    ).length;
  }

  /** Tiny money formatter — keeps numbers compact. */
  private formatCurrency(n: number): string {
    if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `$${n}`;
  }
}