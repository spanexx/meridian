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
 *
 * Data layer (backend-readiness pack): the page consumes the injected
 * ApiClient.notificationsList() (core/api/api-client.ts) instead of the
 * former hardcoded NOTIFICATIONS const. The canonical NotificationItem
 * (core/models) is mapped to the wireframe view by the MODULE-LOCAL
 * toViewRow() helper. The dev MockGateway seeds the same 8 wireframe
 * rows (mock-seed.ts SEED_NOTIFICATIONS), so rendering is byte-equivalent
 * to the prior fixture.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { ApiClient } from '../../core/api/api-client';
import type { NotificationItem as CanonicalNotification } from '../../core/models';

/** One notification row in the wireframe view shape. */
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

/** Wireframe icon + accent per canonical NotificationType. */
const STYLE_BY_TYPE: Record<string, { icon: string; bg: string; color: string; dot: string }> = {
  EXECUTION_STARTED: { icon: 'vote', bg: 'rgba(201,138,66,0.12)', color: 'text-violet-400', dot: 'bg-violet-400' },
  EXECUTION_ACQUIRED: { icon: 'package', bg: 'rgba(96,165,250,0.12)', color: 'text-blue-400', dot: 'bg-blue-400' },
  EXECUTION_FIRST_SALE: { icon: 'package', bg: 'rgba(16,185,129,0.12)', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  EXECUTION_COMPLETED: { icon: 'check-circle-2', bg: 'rgba(16,185,129,0.12)', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  PAYOUT_READY: { icon: 'circle-dollar-sign', bg: 'rgba(201,138,66,0.12)', color: 'text-violet-400', dot: 'bg-violet-400' },
  PAYOUT_PENDING: { icon: 'circle-dollar-sign', bg: 'rgba(201,138,66,0.12)', color: 'text-violet-400', dot: 'bg-violet-400' },
  PAYOUT_COMPLETED: { icon: 'circle-dollar-sign', bg: 'rgba(201,138,66,0.12)', color: 'text-violet-400', dot: 'bg-violet-400' },
  EXECUTION_LOSS: { icon: 'alert-triangle', bg: 'rgba(245,158,11,0.12)', color: 'text-amber-400', dot: 'bg-amber-400' },
};

const FALLBACK_STYLE = { icon: 'bell', bg: 'rgba(96,165,250,0.12)', color: 'text-blue-400', dot: 'bg-blue-400' };

/** '/opportunities/O-2051' -> ['/opportunities','O-2051']; '/pool' -> ['/pool']. */
const routeToLink = (route: string | null): string[] => {
  if (!route) return ['/'];
  const segs = route.split('/').filter(Boolean);
  return segs.map((s, i) => (i === 0 ? `/${s}` : s));
};

/** Map a canonical NotificationItem (API shape) to the wireframe view row. */
const toViewRow = (n: CanonicalNotification): NotificationItem => {
  const style = STYLE_BY_TYPE[n.type] ?? FALLBACK_STYLE;
  const time = (() => {
    const diffMs = Date.now() - new Date(n.created_at).getTime();
    const min = Math.round(diffMs / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  })();
  return {
    id: n.id,
    title: n.title,
    time,
    caption: n.body,
    icon: style.icon,
    bg: style.bg,
    color: style.color,
    dot: style.dot,
    link: routeToLink(n.route),
    read: n.read,
  };
};

/** The wireframe rows are produced by toViewRow() from the injected
 * ApiClient.notificationsList() payload (mock-seed SEED_NOTIFICATIONS in
 * dev, HttpTransport in prod) — single source, no page-level fixture. */

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiToastComponent, UiIconComponent],
  templateUrl: './notifications.template.html',
})
export class NotificationsPageComponent {
  /** True until the first notificationsList() payload resolves (drives the skeleton). */
  readonly loading = signal(true);

  /** Rows from the injected ApiClient (canonical) mapped to the wireframe view. */
  readonly items = signal<NotificationItem[]>([]);

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

  private readonly client = inject(ApiClient);

  constructor() {
    this.client
      .notificationsList()
      .then((r) => this.items.set(r.notifications.map(toViewRow)))
      .finally(() => this.loading.set(false));
  }

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
