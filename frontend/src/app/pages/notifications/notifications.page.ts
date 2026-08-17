/**
 * NotificationsPageComponent — wireframe-aligned notifications feed.
 *
 * Per wireframe/meridian/notifications/index.html. Behavior pins:
 *   - title 'Notifications' + subtitle 'Everything happening across the
 *     pool — derived from the event stream.'
 *   - 'Mark all read' + 'Preferences' header actions
 *   - Preferences modal (raw .modal-overlay/.modal markup mirrors the
 *     wireframe 1:1 — the ui-modal primitive's overlay-click/head only
 *     partially match, so raw markup is the fidelity choice, pool
 *     precedent) with 4 switch rows, Cancel and Save (Save closes +
 *     in-page toast via the ui-toast primitive)
 *   - Filter tabs All (8) / Unread (3) with aria-selected + live counts
 *   - 8 notification rows (3 unread) with data-read + pulse dots; rows
 *     filtered by tab; empty state when a filter yields 0 rows
 *   - Skeleton dropped (opportunities precedent — demo pages do not
 *     simulate load; 8 rows ≤ page size 10 so no pagination either)
 *
 * Demo data is hardcoded per the wireframe (NOTIFICATIONS below).
 * Backend wiring is a later pack.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';

/** One notification row, ported verbatim from the wireframe. */
export interface NotificationItem {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly caption: string;
  readonly icon: string;
  readonly bg: string;
  readonly color: string;
  readonly dot: string;
  readonly link: string[];
  read: boolean;
}

interface ToastState {
  readonly title: string;
  readonly message: string;
  readonly variant: UiToastVariant;
}

/** The 8 wireframe rows (3 unread). `read` is mutable page state. */
export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'O-2051 needs 1 more vote to approve',
    time: '2m ago',
    caption: 'Vetting closes in 18h — the Bulk Lego Set Resale is 4/5 weighted votes.',
    icon: 'vote',
    bg: 'rgba(201,138,66,0.12)',
    color: 'text-violet-400',
    dot: 'bg-violet-400',
    link: ['/opportunities', 'O-2051'],
    read: false,
  },
  {
    id: 'n2',
    title: 'E-1042 · Size 10.5 sold on GOAT',
    time: '1h ago',
    caption: '$2,880 recovered — 3 of 8 items sold, ROI tracking at +12.4%.',
    icon: 'package',
    bg: 'rgba(16,185,129,0.12)',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    link: ['/executions', 'E-1042'],
    read: false,
  },
  {
    id: 'n3',
    title: 'Reserve ratio steady at 18.2%',
    time: '3h ago',
    caption: 'Above the 12% community target. No action needed.',
    icon: 'banknote',
    bg: 'rgba(245,158,11,0.12)',
    color: 'text-amber-400',
    dot: 'bg-amber-400',
    link: ['/pool'],
    read: false,
  },
  {
    id: 'n4',
    title: 'Payout preview updated for E-1039',
    time: '5h ago',
    caption: 'Projected net profit $5,982 · distribution pending vote outcome.',
    icon: 'circle-dollar-sign',
    bg: 'rgba(201,138,66,0.12)',
    color: 'text-violet-400',
    dot: 'bg-violet-400',
    link: ['/payouts'],
    read: true,
  },
  {
    id: 'n5',
    title: 'New proposal: ROI floor → 18%',
    time: '8h ago',
    caption: 'Dana Voss proposed raising the ROI floor. Vote closes in 22h.',
    icon: 'vote',
    bg: 'rgba(96,165,250,0.12)',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    link: ['/community/alpha/governance'],
    read: true,
  },
  {
    id: 'n6',
    title: 'Daily reconciliation: BALANCED',
    time: 'Yesterday',
    caption: 'Every dollar accounted for. Audit trail intact.',
    icon: 'check-circle-2',
    bg: 'rgba(16,185,129,0.12)',
    color: 'text-emerald-400',
    dot: 'bg-emerald-400',
    link: ['/executions', 'E-1042'],
    read: true,
  },
  {
    id: 'n7',
    title: 'Reputation milestone: Tier 3 reached',
    time: '2 days ago',
    caption: 'Vetting weight now ×1.4. Keep it up.',
    icon: 'award',
    bg: 'rgba(201,138,66,0.12)',
    color: 'text-violet-400',
    dot: 'bg-violet-400',
    link: ['/profile'],
    read: true,
  },
  {
    id: 'n8',
    title: 'Pool snapshot available',
    time: '3 days ago',
    caption: 'The weekly pool.snapshot_taken report is ready to export.',
    icon: 'download',
    bg: 'rgba(96,165,250,0.12)',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    link: ['/pool'],
    read: true,
  },
];

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiToastComponent],
  templateUrl: './notifications.template.html',
})
export class NotificationsPageComponent {
  /** Mutable copy of the rows — `read` is page state, the rest is static. */
  readonly items = signal(NOTIFICATIONS.map((n) => ({ ...n })));

  /** Active filter tab. */
  readonly tab = signal<'all' | 'unread'>('all');

  /** Preferences modal open state (raw .modal-overlay markup, pool precedent). */
  readonly prefsOpen = signal(false);

  /** The 4 preference switches (aria-checked state). */
  readonly switches = signal([true, true, true, true]);

  /** In-page toast via the ui-toast primitive (submit-signal precedent). */
  readonly toast = signal<ToastState | null>(null);

  /** The 4 preference rows, verbatim from the wireframe modal. */
  readonly prefs = [
    { label: 'Voting reminders', desc: 'When a signal needs your vote' },
    { label: 'Execution updates', desc: 'Sales, listings, funding milestones' },
    { label: 'Pool health alerts', desc: 'Reserve & liquidity threshold crossings' },
    { label: 'Payouts', desc: 'Distribution confirmations' },
  ];

  /** Filter tabs with live counts (All stays 8; Unread tracks read state). */
  readonly tabs = [
    { key: 'all' as const, label: 'All', count: () => this.items().length },
    { key: 'unread' as const, label: 'Unread', count: () => this.unreadCount() },
  ];

  /** Rows visible under the active tab. */
  readonly filtered = computed(() => {
    const t = this.tab();
    return this.items().filter((n) => t === 'all' || !n.read);
  });

  /** Number of unread rows (drives the Unread tab count). */
  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);

  setTab(t: 'all' | 'unread'): void {
    this.tab.set(t);
  }

  /** Marks every row read; pulse dots disappear and Unread count -> 0. */
  markAllRead(): void {
    this.items.update((arr) => arr.map((n) => ({ ...n, read: true })));
  }

  openPrefs(): void {
    this.prefsOpen.set(true);
  }

  closePrefs(): void {
    this.prefsOpen.set(false);
  }

  /** Flips one preference switch (aria-checked mirrors the signal). */
  togglePref(i: number): void {
    this.switches.update((arr) => arr.map((v, idx) => (idx === i ? !v : v)));
  }

  /** Saves preferences: closes the modal and confirms with a toast. */
  savePrefs(): void {
    this.prefsOpen.set(false);
    this.toast.set({ title: '', message: 'Notification preferences saved', variant: 'success' });
  }

  dismissToast(): void {
    this.toast.set(null);
  }
}
