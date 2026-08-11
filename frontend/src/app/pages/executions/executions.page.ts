/**
 * Executions page — a filterable list of arbitrage executions
 * (deals that have started or completed executing).
 *
 * Each execution renders as a <a class="card"> link to its detail
 * page, NOT a table row. The list is filtered by status (All /
 * Active / Completed / Failed). Filter behavior is the same shape
 * as OpportunitiesPage so the user feels continuity.
 *
 * Domain shape (docs/02-data-model.md §Execution):
 *   ref (E-####) · title · relatedOpportunity (O-####) · status ·
 *   currentBadgeLabel (what the badge shows) · imageSeed (deterministic
 *   placeholder URL)
 *
 * Backend wiring is deferred — data is a static demo set here.
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
import { UiBadgeComponent } from '../../ui/badge/badge.component';

interface Execution {
  ref: string;
  title: string;
  relatedOpp: string;
  relatedOppTitle: string;
  status: 'active' | 'completed' | 'failed' | string;
  badge: string;
  // DISCOVERY 2026-08-11: 'error' is intentionally NOT in this union
  // — UiBadgeComponent does not expose that variant today
  // (frontend/src/app/ui/badge/badge.component.ts:3 — UiBadgeVariant
  // = 'neutral' | 'success' | 'warning' | 'info'). Failed
  // executions currently render with 'warning' (amber).
  badgeVariant: 'success' | 'warning' | 'neutral' | 'info';
  imageSeed: string;
}

@Component({
  selector: 'ui-executions-page',
  standalone: true,
  imports: [UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="p-6 lg:p-8 max-w-7xl mx-auto">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Executions</h1>
        <p class="text-sm text-slate-400 mt-1">
          Active and completed deals. Click any card for the execution room.
        </p>
      </header>

      <!-- Status filter (single row, no category in this wireframe) -->
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

      <!-- Execution cards as a responsive grid -->
      <section
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
        data-testid="executions-grid"
      >
        @for (e of visibleExecutions(); track e.ref) {
          <a
            [attr.href]="'/execution-detail/' + e.ref"
            [attr.data-status]="e.status"
            [attr.data-filterable]="true"
            class="card card-hover p-6 block"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs text-slate-500 font-mono">{{ e.ref }}</span>
                  <ui-badge [variant]="e.badgeVariant">{{ e.badge }}</ui-badge>
                </div>
                <div class="text-base font-semibold">{{ e.title }}</div>
                <div class="text-xs text-slate-500 mt-1">
                  {{ e.relatedOpp }} · {{ e.relatedOppTitle }}
                </div>
              </div>
              <img
                [src]="'https://picsum.photos/seed/' + e.imageSeed + '/120/120'"
                alt=""
                class="w-14 h-14 rounded-lg object-cover"
                style="border: 1px solid var(--border-subtle);"
                loading="lazy"
              />
            </div>
          </a>
        }
      </section>
    </main>
  `,
})
export class ExecutionsPageComponent {
  /**
   * Status pills — first entry is the unfiltered "All".
   * 4 entries match the wireframe: All / Active / Completed / Failed.
   */
  readonly statuses = ['All', 'Active', 'Completed', 'Failed'] as const;

  /** Currently selected status (default: 'All'). */
  readonly status = signal<(typeof this.statuses)[number]>('All');

  /**
   * Static demo dataset. 16 entries match the wireframe counts
   * (Active 3 / Completed 12 / Failed 1). Backend wiring deferred.
   */
  private readonly all: Execution[] = [
    // Active (3)
    { ref: 'E-1042', title: 'Limited Edition Sneaker Resale', relatedOpp: 'O-2037', relatedOppTitle: 'Travis Scott × Nike', status: 'active', badge: 'Listed', badgeVariant: 'warning', imageSeed: 'sneaker-thumb' },
    { ref: 'E-1039', title: 'Vintage Watch Liquidation', relatedOpp: 'O-2021', relatedOppTitle: 'Estate lot', status: 'active', badge: 'All Sold', badgeVariant: 'success', imageSeed: 'watch-thumb' },
    { ref: 'E-1036', title: 'Wholesale Electronics', relatedOpp: 'O-2018', relatedOppTitle: 'Shenzhen bulk', status: 'active', badge: 'Acquiring', badgeVariant: 'warning', imageSeed: 'elec-thumb' },
    // Completed (12)
    { ref: 'E-1030', title: 'Vinyl Record Collection', relatedOpp: 'O-1995', relatedOppTitle: 'First pressings', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'vinyl-thumb' },
    { ref: 'E-1028', title: 'Designer Handbag Lot', relatedOpp: 'O-1990', relatedOppTitle: 'Birkin & Kelly', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'bag-thumb' },
    { ref: 'E-1025', title: 'Trading Card Sealed Case', relatedOpp: 'O-1985', relatedOppTitle: 'PSA-graded', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'card-thumb' },
    { ref: 'E-1022', title: 'Gaming Console Lot', relatedOpp: 'O-1980', relatedOppTitle: 'PS5 + Xbox', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'console-thumb' },
    { ref: 'E-1019', title: 'Rare Book Collection', relatedOpp: 'O-1975', relatedOppTitle: 'First editions', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'book-thumb' },
    { ref: 'E-1016', title: 'Camera Equipment', relatedOpp: 'O-1970', relatedOppTitle: 'Leica + Hasselblad', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'camera-thumb' },
    { ref: 'E-1013', title: 'Luxury Fragrance Lot', relatedOpp: 'O-1965', relatedOppTitle: 'Tom Ford + Creed', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'frag-thumb' },
    { ref: 'E-1010', title: 'Vintage Sneaker Drop', relatedOpp: 'O-1960', relatedOppTitle: 'Air Jordan 1 OG', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'jordan-thumb' },
    { ref: 'E-1007', title: 'Designer Furniture', relatedOpp: 'O-1955', relatedOppTitle: 'Knoll + Eames', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'furn-thumb' },
    { ref: 'E-1004', title: 'Luxury Watch Pair', relatedOpp: 'O-1950', relatedOppTitle: 'Rolex + AP', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'rolex-thumb' },
    { ref: 'E-1001', title: 'Limited Art Prints', relatedOpp: 'O-1945', relatedOppTitle: 'Banksy litho set', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'art-thumb' },
    { ref: 'E-0998', title: 'Hi-Fi Audio Pair', relatedOpp: 'O-1940', relatedOppTitle: 'McIntosh + KEF', status: 'completed', badge: 'Completed', badgeVariant: 'success', imageSeed: 'hifi-thumb' },
    // Failed (1)
    // DISCOVERY 2026-08-11: UiBadgeComponent does not expose an 'error'
    // variant (its UiBadgeVariant = 'neutral' | 'success' | 'warning'
    // | 'info'). Mapping "failed" to 'warning' here so the page
    // compiles; the badge color is amber-orange instead of red. A
    // proper fix would extend UiBadgeComponent's variant union — see
    // sessions/decisions.md for tracking.
    { ref: 'E-1024', title: 'Antique Mirror Lot', relatedOpp: 'O-1988', relatedOppTitle: 'Shipping damage', status: 'failed', badge: 'Failed', badgeVariant: 'warning', imageSeed: 'mirror-thumb' },
  ];

  /** Filtered executions according to the status signal. */
  readonly visibleExecutions = computed<Execution[]>(() => {
    const stat = this.status();
    if (stat === 'All') return this.all;
    const key = stat.toLowerCase() as Execution['status'];
    return this.all.filter((e) => e.status === key);
  });

  /** Count of executions in a given status (e.g. "Active 3" pill). */
  countByStatus(target: string): number {
    if (target === 'All') return this.all.length;
    const key = target.toLowerCase();
    return this.all.filter((e) => e.status === key).length;
  }
}
