/**
 * ExecutionDetailPageComponent — per-execution operational view.
 *
 * Renders per wireframe/meridian/execution-detail/index.html:
 *   - breadcrumb (Executions > E-####)
 *   - header: ref + Listed badge + Apparel badge + title +
 *     "From O-#### - <opportunity title>" link to
 *     /opportunities/:id + operator + duration + 2 ghost action
 *     buttons (share-2, download/Export)
 *   - Timeline card (5-step circle: Approved/Funded/Acquired/
 *     Listed/Sold with progress bar + 4-stage label)
 *   - Main col:
 *       - Capital (3 inner cards: Allocated/Spent/Recovered)
 *       - Inventory (8 size cards in 4-col grid with picsum thumbs)
 *       - Event Log (9 append-only events with timestamps + badges)
 *   - Sidebar:
 *       - Payout Preview (glass, Net profit + 5-row Distribution)
 *       - Participants (3 members with avatars)
 *
 * More minimal than the wireframe: drops text-gradient-emerald
 * (uses a plain emerald-400 on the big numbers), drops the inline
 * glow-shadow on the listed step (uses the existing amber token
 * via the .progress-fill-amber class), and unified the kpi-number
 * clamp across the project.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface TimelineStep {
  readonly label: string;
  readonly date: string;
  readonly state: 'done' | 'current' | 'pending';
}

interface InventoryItem {
  readonly size: string;
  readonly channel: 'StockX' | 'GOAT' | 'eBay';
  readonly status: 'Listed' | 'Sold';
  readonly price: number;
  readonly seed: string;
}

interface EventLog {
  readonly timestamp: string;
  readonly code: string;
  readonly text: string;
  readonly variant: 'info' | 'success' | 'warning';
}

interface Participant {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly gradient: string;
  readonly url: string;
}

interface DistributionRow {
  readonly label: string;
  readonly amount: number;
  readonly pct: number;
}

@Component({
  selector: 'app-execution-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, DecimalPipe],
  templateUrl: './execution-detail.template.html',
})
export class ExecutionDetailPageComponent {
  /** Route :id param — wires the page to whatever execution is requested. */
  @Input() id: string = 'E-1042';

  // ─── header refs (so header reads the current id) ──────────────
  readonly executionRef = computed<string>(() => this.id);

  readonly sourceOpportunity = {
    ref: 'O-2037',
    title: 'Travis Scott × Nike',
  };

  readonly operator = 'Marcus Rivera';
  readonly flightDuration = '4 days 12 hours';

  // ─── Timeline ───────────────────────────────────────────────────
  readonly steps: readonly TimelineStep[] = [
    { label: 'Approved', date: 'Mar 5', state: 'done' },
    { label: 'Funded', date: 'Mar 6', state: 'done' },
    { label: 'Acquired', date: 'Mar 8', state: 'done' },
    { label: 'Listed', date: 'Mar 9', state: 'current' },
    { label: 'Sold', date: '~Mar 19', state: 'pending' },
  ];

  readonly currentStepIndex = computed<number>(
    () => this.steps.findIndex((s) => s.state === 'current'),
  );

  /**
   * 0-100 fill for the timeline progress bar.
   * The wireframe lands at 60% — between Acquired (60%) and Listed (80%),
   * so we use the floor of (currentIndex / 4) * 100 + a small lead-in
   * that pins the value at 60 for the default execution.
   */
  readonly timelineProgress = computed<number>(() => {
    const idx = this.currentStepIndex();
    if (idx < 0) return 0;
    // 60% lands between step 3 (Acquired, complete) and step 4 (Listed, current)
    const widths = [0, 20, 40, 60, 80, 100];
    return widths[idx] ?? 0;
  });

  // ─── Capital ────────────────────────────────────────────────────
  readonly capital = {
    allocated: 18500,
    allocatedNote: 'From 42 capital contributors',
    spent: 18200,
    spentNote: '8 pairs @ $2,275',
    recovered: 4280,
    recoveredNote: '3 of 8 sold',
  };

  // ─── Inventory ──────────────────────────────────────────────────
  readonly inventory: readonly InventoryItem[] = [
    { size: 'US 9', channel: 'StockX', status: 'Listed', price: 2850, seed: 'sneaker-a' },
    { size: 'US 9.5', channel: 'GOAT', status: 'Listed', price: 2900, seed: 'sneaker-b' },
    { size: 'US 10', channel: 'eBay', status: 'Sold', price: 2620, seed: 'sneaker-c' },
    { size: 'US 10', channel: 'StockX', status: 'Sold', price: 2780, seed: 'sneaker-d' },
    { size: 'US 10.5', channel: 'GOAT', status: 'Sold', price: 2880, seed: 'sneaker-e' },
    { size: 'US 11', channel: 'eBay', status: 'Listed', price: 2800, seed: 'sneaker-f' },
    { size: 'US 11.5', channel: 'StockX', status: 'Listed', price: 2750, seed: 'sneaker-g' },
    { size: 'US 12', channel: 'GOAT', status: 'Listed', price: 2700, seed: 'sneaker-h' },
  ];

  /** Sort by Sold-before-Listed, then by size ascending — used by template. */
  readonly inventoryGrouped = computed<readonly InventoryItem[]>(() => {
    const order: Record<InventoryItem['status'], number> = { Sold: 0, Listed: 1 };
    return [...this.inventory].sort((a, b) => {
      const s = order[a.status] - order[b.status];
      if (s !== 0) return s;
      return parseFloat(a.size) - parseFloat(b.size);
    });
  });

  // ─── Event log ──────────────────────────────────────────────────
  readonly eventLog: readonly EventLog[] = [
    { timestamp: 'Mar 9 14:22', code: 'execution.item_listed', text: 'Size US 12 · GOAT', variant: 'info' },
    { timestamp: 'Mar 9 14:18', code: 'execution.item_sold', text: 'Size US 10.5 · GOAT · $2,880', variant: 'success' },
    { timestamp: 'Mar 9 11:42', code: 'execution.item_listed', text: 'Size US 11.5 · StockX', variant: 'info' },
    { timestamp: 'Mar 9 09:14', code: 'execution.item_listed', text: 'Size US 11 · eBay', variant: 'info' },
    { timestamp: 'Mar 8 18:33', code: 'execution.item_sold', text: 'Size US 10 · StockX · $2,780', variant: 'success' },
    { timestamp: 'Mar 8 16:02', code: 'execution.item_sold', text: 'Size US 10 · eBay · $2,620', variant: 'success' },
    { timestamp: 'Mar 8 10:15', code: 'execution.acquired', text: 'All 8 pairs received · inspected', variant: 'warning' },
    { timestamp: 'Mar 6 09:00', code: 'money.allocated', text: '$18,500 from 42 capital accounts', variant: 'info' },
    { timestamp: 'Mar 5 17:32', code: 'opportunity.approved', text: 'Vetting closed · 3/3 approve', variant: 'success' },
  ];

  // ─── Payout preview ────────────────────────────────────────────
  readonly payout = {
    gross: 22475,
    costs: 18200,
    fee: -214,
    net: 4061,
  };

  readonly distribution = signal<readonly DistributionRow[]>([
    { label: 'Capital', amount: 1867, pct: 46 },
    { label: 'Signal', amount: 1218, pct: 30 },
    { label: 'Access', amount: 487, pct: 12 },
    { label: 'Operations', amount: 325, pct: 8 },
    { label: 'Platform', amount: 164, pct: 4 },
  ]);

  // ─── Participants ───────────────────────────────────────────────
  readonly participants: readonly Participant[] = [
    {
      initials: 'MR',
      name: 'Mike Rivera',
      role: 'Signal contributor',
      gradient: 'var(--gradient-amber)',
      url: '/members/Mike%20Rivera',
    },
    {
      initials: 'SP',
      name: 'Sarah Park',
      role: 'Access contributor · Boston',
      gradient: 'var(--gradient-blue)',
      url: '/members/Sarah%20Park',
    },
    {
      initials: 'AC',
      name: 'Alex Chen',
      role: 'Operator',
      gradient: 'var(--gradient-violet)',
      url: '/profile',
    },
  ];

  // ─── public helpers ─────────────────────────────────────────────
  shareLink(): string {
    return `https://meridian.example/executions/${this.executionRef()}`;
  }

  currentStepLabel(): string {
    const step = this.steps[this.currentStepIndex()];
    return step?.label ?? '';
  }

  netProfitColor(): string {
    return this.payout.net >= 0 ? 'var(--e-400)' : 'var(--r-400)';
  }
}
