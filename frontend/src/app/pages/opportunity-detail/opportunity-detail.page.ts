/**
 * OpportunityDetailPageComponent — per-opportunity view.
 *
 * Renders per wireframe/meridian/opportunity-detail/index.html:
 *   - breadcrumb (Opportunities › O-####)
 *   - header: ref + status badge + category badge + title + subtitle
 *     + 2 ghost action buttons (share, bookmark)
 *   - 5 main cards (Acquisition, Resale, Financials, Evidence, Vetting)
 *   - 3 sidebar cards (Your Vote, Submitter, Timeline)
 *   - Vetting tabs: Auto-checks / Votes / Comments (only Auto-checks
 *     visible by default, the others hidden)
 *
 * More minimal than the wireframe: drops the text-gradient-emerald
 * on the big numbers (uses a plain emerald-400 + .kpi-number),
 * drops the inline background colors on the auto-check rows
 * (uses the existing bg-overlay / bg-card patterns), and
 * collapses the comment vote into a single line.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

type VettingPanel = 'checks' | 'votes' | 'comments';
type UserVote = 'approve' | 'reject' | null;

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [RouterLink, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-slate-500 mb-4" data-testid="opportunity-breadcrumb">
      <a routerLink="/opportunities" class="hover:text-slate-300">Opportunities</a>
      <ui-icon name="chevron-right"></ui-icon>
      <span class="text-slate-300">O-2049</span>
    </div>

    <!-- header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs text-slate-500 font-mono">O-2049</span>
          <span class="badge badge-warning">In Vetting</span>
          <span class="badge badge-neutral">Apparel</span>
        </div>
        <h1 class="page-title text-3xl">Travis Scott × Nike Sneakers</h1>
        <p class="page-subtitle max-w-2xl mt-2">
          Limited drop resale — wholesale acquisition from boutique, 8 pairs, 14-day
          liquidation via StockX, GOAT, eBay.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="btn btn-ghost" aria-label="Share link">
          <ui-icon name="share-2"></ui-icon>
        </button>
        <button type="button" class="btn btn-ghost" aria-label="Bookmark">
          <ui-icon name="bookmark"></ui-icon>
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- main column -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Acquisition -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Acquisition</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <div class="kpi-label mb-1.5">Source</div>
              <div class="text-sm">Boutique wholesale</div>
              <div class="text-xs text-slate-500 mt-0.5">Boston, MA</div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Estimated cost</div>
              <div class="text-sm font-semibold">$14,200</div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Quantity</div>
              <div class="text-sm font-semibold">8 pairs</div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Deadline</div>
              <div class="text-sm">Mar 28, 2026</div>
              <div class="text-xs text-amber-400 mt-0.5">12 days</div>
            </div>
          </div>
        </section>

        <!-- Resale -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Resale</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div>
              <div class="kpi-label mb-1.5">Channels</div>
              <div class="flex flex-wrap gap-1.5 mt-1">
                <span class="badge badge-info">StockX</span>
                <span class="badge badge-info">GOAT</span>
                <span class="badge badge-info">eBay</span>
              </div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Est. value</div>
              <div class="text-sm font-semibold text-emerald-400">$21,500</div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Time to liquidate</div>
              <div class="text-sm">14 days</div>
            </div>
            <div>
              <div class="kpi-label mb-1.5">Confidence</div>
              <span class="badge badge-success">High</span>
            </div>
          </div>
        </section>

        <!-- Financials -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Financials</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
            <div class="card p-4">
              <div class="kpi-label mb-1.5">Est. profit</div>
              <div class="kpi-number text-emerald-400">$7,300</div>
            </div>
            <div class="card p-4">
              <div class="kpi-label mb-1.5">ROI</div>
              <div class="kpi-number text-emerald-400">+51.4%</div>
            </div>
            <div class="card p-4">
              <div class="kpi-label mb-1.5">Risk</div>
              <div class="kpi-number text-amber-400">Medium</div>
            </div>
            <div class="card p-4">
              <div class="kpi-label mb-1.5">Payback</div>
              <div class="kpi-number">14 d</div>
            </div>
          </div>
        </section>

        <!-- Evidence -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Evidence</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (seed of evidenceSeeds; track seed) {
              <img
                [attr.src]="'https://picsum.photos/seed/' + seed + '/400/300'"
                [attr.alt]="'Evidence ' + seed"
                class="rounded-lg border object-cover w-full h-32"
                style="border-color: var(--border-subtle);"
                loading="lazy"
              />
            }
          </div>
        </section>

        <!-- Vetting -->
        <section class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold">Vetting</h2>
            <span class="text-xs text-slate-500">2 of 3 votes needed</span>
          </div>

          <div class="tabs mb-6" role="tablist">
            @for (p of panels; track p.key) {
              <button
                type="button"
                role="tab"
                class="tab"
                [class.active]="activePanel() === p.key"
                [attr.aria-selected]="activePanel() === p.key"
                (click)="activePanel.set(p.key)"
              >{{ p.label }}</button>
            }
          </div>

          <!-- Auto-checks -->
          <div [attr.data-panel]="'checks'" [hidden]="activePanel() !== 'checks'">
            <div class="space-y-2">
              @for (c of autoChecks; track c.label) {
                <div class="flex items-center justify-between p-3 rounded-lg" style="background: var(--bg-overlay);">
                  <div class="flex items-center gap-3">
                    <ui-icon name="check-circle-2" className="text-emerald-400"></ui-icon>
                    <span class="text-sm">{{ c.label }}</span>
                  </div>
                  <span class="badge badge-success">Pass</span>
                </div>
              }
            </div>
            <div class="mt-4 p-3 rounded-lg flex items-start gap-3" style="background: var(--bg-overlay); border: 1px solid var(--border-subtle);">
              <ui-icon name="sparkles" className="text-emerald-400"></ui-icon>
              <div>
                <div class="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Recommendation</div>
                <div class="text-sm mt-0.5">APPROVE — Limited drop, comparable sales show 45–55% margin over 14 days. Boutique wholesale on file.</div>
              </div>
            </div>
          </div>

          <!-- Votes -->
          <div [attr.data-panel]="'votes'" [hidden]="activePanel() !== 'votes'">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-sm">
                  <span class="text-emerald-400 font-semibold">{{ countsApprove() }}</span>
                  <span class="text-slate-500">approve</span>
                  <span class="mx-2 text-slate-600">·</span>
                  <span class="text-rose-400 font-semibold">{{ countsReject() }}</span>
                  <span class="text-slate-500">reject</span>
                </div>
                <span class="text-xs text-slate-500">2 of 3 needed · 18h remaining</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill progress-fill-emerald" [style.width.%]="panelTally()"></div>
              </div>
              <div class="space-y-2 mt-3">
                @for (v of vetterVotes; track v.name) {
                  <div class="flex items-center gap-3 p-3 rounded-lg" style="background: var(--bg-overlay);">
                    <div class="avatar" [style.background]="v.gradient">{{ v.initials }}</div>
                    <div class="flex-1">
                      <div class="text-sm"><span class="font-medium">{{ v.name }}</span> <span class="text-xs text-slate-500">· Vetter T{{ v.tier }}</span></div>
                      <div class="text-xs text-slate-500 mt-0.5">"{{ v.quote }}"</div>
                    </div>
                    <span class="badge" [class.badge-success]="v.choice === 'approve'" [class.badge-danger]="v.choice === 'reject'">
                      {{ v.choice === 'approve' ? 'Approve' : 'Reject' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div [attr.data-panel]="'comments'" [hidden]="activePanel() !== 'comments'">
            <div class="space-y-2 mb-4">
              @for (cm of comments; track cm.author) {
                <div class="flex items-start gap-3 p-3 rounded-lg" style="background: var(--bg-overlay);">
                  <div class="avatar" [style.background]="cm.gradient">{{ cm.initials }}</div>
                  <div class="flex-1">
                    <div class="text-sm"><span class="font-medium">{{ cm.author }}</span> <span class="text-xs text-slate-500">· Vetter T{{ cm.tier }} · {{ cm.ago }}</span></div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ cm.body }}</div>
                  </div>
                </div>
              }
            </div>
            <form data-testid="comment-form" class="flex gap-3" (submit)="$event.preventDefault()">
              <textarea
                class="input"
                rows="2"
                placeholder="Add a comment for the community…"
                required
              ></textarea>
              <button type="submit" class="btn btn-primary self-start">
                <ui-icon name="send"></ui-icon>Post
              </button>
            </form>
          </div>
        </section>
      </div>

      <!-- sidebar -->
      <div class="space-y-6">
        <!-- Your Vote -->
        <section class="glass p-6">
          <h2 class="text-base font-semibold mb-4">Your Vote</h2>
          <div class="text-xs text-slate-500 mb-4">As a Vetter, your vote is reputation-weighted × 1.4.</div>
          <div class="flex gap-3">
            <button
              type="button"
              class="vote-btn flex-1"
              data-vote-type="approve"
              [class.active]="userVote() === 'approve'"
              (click)="castVote('approve')"
            >
              <ui-icon name="thumbs-up"></ui-icon>Approve
            </button>
            <button
              type="button"
              class="vote-btn flex-1"
              data-vote-type="reject"
              [class.active]="userVote() === 'reject'"
              (click)="castVote('reject')"
            >
              <ui-icon name="thumbs-down"></ui-icon>Reject
            </button>
          </div>
        </section>

        <!-- Submitter -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Submitter</h2>
          <a routerLink="/members" class="flex items-center gap-3 mb-4">
            <div class="avatar" style="width: 2.5rem; height: 2.5rem; background: var(--gradient-amber);">MR</div>
            <div>
              <div class="text-sm font-medium" style="color: var(--text-1);">Mike Rivera</div>
              <div class="text-xs mt-0.5" style="color: var(--text-2);">Member since 2024</div>
            </div>
          </a>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between"><span style="color: var(--text-3);">Reputation</span><span style="color: var(--a-400);">● T3 · 78</span></div>
            <div class="flex justify-between"><span style="color: var(--text-3);">Signals</span><span style="color: var(--text-2);">14 submitted · 9 approved</span></div>
            <div class="flex justify-between"><span style="color: var(--text-3);">Avg. ROI</span><span style="color: var(--e-400);">+24.6%</span></div>
          </div>
        </section>

        <!-- Timeline -->
        <section class="card p-6">
          <h2 class="text-base font-semibold mb-4">Timeline</h2>
          <div class="space-y-4">
            @for (t of timeline; track t.label) {
              <div class="flex gap-3" [class.opacity-50]="t.future">
                <div class="w-1.5 h-1.5 rounded-full mt-1.5" [style.background]="t.dot"></div>
                <div>
                  <div class="text-sm">{{ t.label }}</div>
                  <div class="text-xs text-slate-500">{{ t.meta }}</div>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class OpportunityDetailPageComponent {
  /** Vetting tab currently visible. */
  readonly activePanel = signal<VettingPanel>('checks');

  /** The user's current vote (null = not voted). */
  readonly userVote = signal<UserVote>(null);

  /** Currently active vote count (after the user's vote). */
  readonly countsApprove = computed<number>(() => 3 + (this.userVote() === 'approve' ? 1 : 0));
  readonly countsReject = computed<number>(() => 1 + (this.userVote() === 'reject' ? 1 : 0));

  /** Tally percentage (approve / total), used by the progress bar. */
  readonly panelTally = computed<number>(() => {
    const total = this.countsApprove() + this.countsReject();
    return total === 0 ? 0 : (this.countsApprove() / total) * 100;
  });

  /** Vetting tab list (rendered as the .tabs row). */
  readonly panels: ReadonlyArray<{ key: VettingPanel; label: string }> = [
    { key: 'checks',   label: 'Auto-checks' },
    { key: 'votes',    label: 'Votes' },
    { key: 'comments', label: 'Comments' },
  ];

  /** Picsum seeds for the Evidence thumbnails. */
  readonly evidenceSeeds = ['sneaker1', 'sneaker2', 'sneaker3'];

  /** Auto-checks panel rows. */
  readonly autoChecks: ReadonlyArray<{ label: string }> = [
    { label: 'Duplicate check' },
    { label: 'Fraud signals' },
    { label: 'Math validation (ROI vs. comps)' },
  ];

  /** Vetter votes (Votes panel). */
  readonly vetterVotes: ReadonlyArray<{
    name: string; initials: string; gradient: string; tier: number; quote: string; choice: 'approve' | 'reject';
  }> = [
    { name: 'Jules Tan',     initials: 'JT', gradient: 'var(--gradient-blue)',   tier: 4, quote: 'Checked StockX — last 30 days sales match ROI. Approval.',  choice: 'approve' },
    { name: 'Sarah Park',    initials: 'SP', gradient: 'var(--gradient-violet)', tier: 3, quote: 'Boutique verified. Shipping window OK.',                   choice: 'approve' },
    { name: 'Marcus Rivera', initials: 'MR', gradient: 'var(--gradient-emerald)', tier: 3, quote: 'Boutique reputable. Approve.',                              choice: 'approve' },
    { name: 'Kenji Honda',   initials: 'KH', gradient: 'var(--gradient-amber)',  tier: 2, quote: 'Margin too tight. Boutique markup too high.',               choice: 'reject'  },
  ];

  /** Comments panel rows. */
  readonly comments: ReadonlyArray<{
    author: string; initials: string; gradient: string; tier: number; ago: string; body: string;
  }> = [
    { author: 'Jules Tan',   initials: 'JT', gradient: 'var(--gradient-blue)',  tier: 4, ago: '4h ago', body: 'Anyone else see the 12 sales on StockX in the last 30 days? Solid volume for the size run.' },
    { author: 'Kenji Honda', initials: 'KH', gradient: 'var(--gradient-amber)', tier: 2, ago: '2h ago', body: 'The boutique confirmed the wholesale price? That\'s 12% over last drop.' },
  ];

  /** Timeline events (sidebar). */
  readonly timeline: ReadonlyArray<{ label: string; meta: string; dot: string; future: boolean }> = [
    { label: 'Submitted',       meta: 'Mar 9, 14:23',                          dot: 'var(--e-500)',       future: false },
    { label: 'Auto-checks ran', meta: 'Mar 9, 14:24 · Recommendation: APPROVE', dot: 'var(--v-400)',       future: false },
    { label: 'Vetting opened',  meta: 'Mar 9, 14:25 · 18h remaining',           dot: 'var(--a-400)',       future: false },
    { label: 'Decision',        meta: 'Pending',                                dot: 'var(--border-strong)', future: true  },
  ];

  /** Cast the user's vote; clicking the same button again clears it. */
  castVote(choice: 'approve' | 'reject'): void {
    this.userVote.update((v) => (v === choice ? null : choice));
  }
}
