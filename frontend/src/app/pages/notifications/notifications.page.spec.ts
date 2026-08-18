/**
 * Unit tests for NotificationsPageComponent — wireframe-aligned, now API-driven.
 *
 * The page consumes the injected ApiClient.notificationsList() (core/api/api-client.ts);
 * the test provides a mock ApiClient returning SEED_NOTIFICATIONS so the rendered output
 * is byte-equivalent to the wireframe. Data arrives asynchronously, so every
 * row-reading test awaits fixture.whenStable().
 *
 * Per wireframe/meridian/notifications/index.html: title/subtitle, Mark all read +
 * Preferences actions, Preferences modal (raw markup) with 4 switch rows + Cancel/Save,
 * tabs All(8)/Unread(3), 8 rows (3 unread) with data-read + pulse dots, and the empty
 * state after Mark all read + Unread.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import type { NotificationsPageComponent } from './notifications.page';
import { NOTIFICATIONS } from './notifications.page';
import { ApiClient } from '../../core/api/api-client';
import { SEED_NOTIFICATIONS } from '../../core/api/mock-seed';

let mockClient: { notificationsList: ReturnType<typeof vi.fn> } | null = null;

async function renderStandalone(): Promise<ComponentFixture<NotificationsPageComponent>> {
  mockClient = {
    notificationsList: vi.fn().mockResolvedValue({ notifications: SEED_NOTIFICATIONS }),
  } as unknown as { notificationsList: ReturnType<typeof vi.fn> };
  await TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApiClient, useValue: mockClient as unknown as ApiClient }],
  }).compileComponents();
  const { NotificationsPageComponent: Comp } = await import('./notifications.page');
  const fixture = TestBed.createComponent(Comp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('NotificationsPage (wireframe-aligned, API-driven)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the page title "Notifications"', async () => {
    const fixture = await renderStandalone();
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Notifications');
  });

  it('renders the wireframe subtitle', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Everything happening across the pool');
    expect(root.textContent).toContain('derived from the event stream');
  });

  it('renders Mark all read + Preferences header actions', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const mark = root.querySelector('[data-mark-read]');
    expect(mark?.textContent).toContain('Mark all read');
    expect(root.querySelector('.btn.btn-primary')).toBeTruthy();
    expect(root.textContent).toContain('Preferences');
  });

  it('renders 8 notification rows with 3 unread (data-read) + All/Unread counts', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('[data-notif-item]'));
    expect(rows.length).toBe(8);
    const unread = rows.filter((r) => r.getAttribute('data-read') === 'false');
    expect(unread.length).toBe(3);
    expect(root.querySelector('[data-filter-tab="all"]')?.textContent).toContain('8');
    expect(root.querySelector('[data-filter-tab="unread"]')?.textContent).toContain('3');
  });

  it('first unread row ports the O-2051 title/caption verbatim + pulse dot', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    const first = root.querySelector('[data-notif-item]') as HTMLElement;
    expect(first.textContent).toContain('O-2051 needs 1 more vote to approve');
    expect(first.textContent).toContain(
      'Vetting closes in 18h — the Bulk Lego Set Resale is 4/5 weighted votes.',
    );
    expect(first.querySelector('[data-unread-dot]')).toBeTruthy();
  });

  it('setTab("unread") filters to the 3 unread rows with aria-selected', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const unreadTab = root.querySelector('[data-filter-tab="unread"]') as HTMLButtonElement;
    unreadTab.click();
    fixture.detectChanges();
    expect(c.tab()).toBe('unread');
    expect(Array.from(root.querySelectorAll('[data-notif-item]')).length).toBe(3);
    expect(unreadTab.getAttribute('aria-selected')).toBe('true');
    for (const r of Array.from(root.querySelectorAll('[data-notif-item]'))) {
      expect(r.getAttribute('data-read')).toBe('false');
    }
  });

  it('setTab("all") restores all 8 rows', async () => {
    const fixture = await renderStandalone();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-filter-tab="unread"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (root.querySelector('[data-filter-tab="all"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(Array.from(root.querySelectorAll('[data-notif-item]')).length).toBe(8);
  });

  it('markAllRead() sets every row read, removes pulse dots, Unread -> 0', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.markAllRead();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll('[data-notif-item]'));
    expect(rows.length).toBe(8);
    for (const r of rows) {
      expect(r.getAttribute('data-read')).toBe('true');
      expect(r.querySelector('[data-unread-dot]')).toBeNull();
    }
    expect(root.querySelector('[data-filter-tab="unread"]')?.textContent).toContain('0');
    expect(root.querySelector('[data-filter-tab="all"]')?.textContent).toContain('8');
  });

  it('shows the empty state after markAllRead + Unread tab', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.markAllRead();
    c.setTab('unread');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const empty = root.querySelector('[data-empty]') as HTMLElement | null;
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain("You're all caught up");
    expect(empty?.textContent).toContain('No notifications in this view.');
    expect(Array.from(root.querySelectorAll('[data-notif-item]')).length).toBe(0);
  });

  it('openPrefs() shows the preferences modal with 4 switches all aria-checked=true', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const modal = root.querySelector('[data-testid="prefs-modal"]') as HTMLElement;
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain('Notification preferences');
    expect(modal?.textContent).toContain('Choose what reaches you.');
    const switches = Array.from(modal?.querySelectorAll('.switch') ?? []);
    expect(switches.length).toBe(4);
    for (const s of switches) {
      expect(s.getAttribute('aria-checked')).toBe('true');
    }
  });

  it('preferences modal rows match the wireframe labels/descriptions', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const modal = fixture.nativeElement as HTMLElement;
    const text = modal.textContent ?? '';
    expect(text).toContain('Voting reminders');
    expect(text).toContain('When a signal needs your vote');
    expect(text).toContain('Execution updates');
    expect(text).toContain('Pool health alerts');
    expect(text).toContain('Payouts');
    expect(text).toContain('Distribution confirmations');
  });

  it('togglePref(i) flips that switch aria-checked', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const modal = fixture.nativeElement as HTMLElement;
    const sw = modal.querySelectorAll('.switch')[0] as HTMLButtonElement;
    expect(sw.getAttribute('aria-checked')).toBe('true');
    sw.click();
    fixture.detectChanges();
    expect(c.switches()[0]).toBe(false);
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });

  it('closePrefs() via the close icon hides the modal', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="prefs-modal"] .icon-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(c.prefsOpen()).toBe(false);
    expect(
      (root.querySelector('[data-testid="prefs-modal"]') as HTMLElement).getAttribute('hidden'),
    ).not.toBeNull();
  });

  it('Cancel button closes the modal (closePrefs())', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(root.querySelectorAll('[data-testid="prefs-modal"] .btn'));
    const cancel = buttons.find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement;
    cancel.click();
    fixture.detectChanges();
    expect(c.prefsOpen()).toBe(false);
  });

  it('savePrefs() closes the modal and shows the "Notification preferences saved" toast', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.openPrefs();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('#savePrefsBtn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(c.prefsOpen()).toBe(false);
    expect(c.toast()?.message).toBe('Notification preferences saved');
    expect(root.textContent).toContain('Notification preferences saved');
  });

  it('dismissToast() clears the toast', async () => {
    const fixture = await renderStandalone();
    const c = fixture.componentInstance;
    c.savePrefs();
    fixture.detectChanges();
    expect(c.toast()).not.toBeNull();
    c.dismissToast();
    fixture.detectChanges();
    expect(c.toast()).toBeNull();
  });

  it('NOTIFICATIONS totals 8 with the wireframe link targets', async () => {
    expect(NOTIFICATIONS.length).toBe(8);
    const byTitle = (t: string) => NOTIFICATIONS.find((n) => n.title.startsWith(t));
    expect(byTitle('O-2051')?.link).toEqual(['/opportunities', 'O-2051']);
    expect(byTitle('E-1042')?.link).toEqual(['/executions', 'E-1042']);
    expect(byTitle('Reserve ratio')?.link).toEqual(['/pool']);
    expect(byTitle('Payout preview')?.link).toEqual(['/payouts']);
    expect(byTitle('New proposal')?.link).toEqual(['/community', 'alpha', 'governance']);
    expect(byTitle('Reputation milestone')?.link).toEqual(['/profile']);
    expect(byTitle('Pool snapshot')?.link).toEqual(['/pool']);
    expect(byTitle('Daily reconciliation')?.link).toEqual(['/executions', 'E-1042']);
  });

  it('calls ApiClient.notificationsList() once and shows skeleton while loading', async () => {
    const mc = {
      notificationsList: vi.fn().mockResolvedValue({ notifications: SEED_NOTIFICATIONS }),
    } as unknown as ApiClient;
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ApiClient, useValue: mc }],
    }).compileComponents();
    const { NotificationsPageComponent: Comp } = await import('./notifications.page');
    const fixture = TestBed.createComponent(Comp);
    fixture.detectChanges(); // loading = true, skeleton visible, no rows
    const pre = fixture.nativeElement as HTMLElement;
    expect(pre.querySelector('[data-testid="skeleton"]')).toBeTruthy();
    expect(pre.querySelector('[data-notif-item]')).toBeFalsy();
    expect(mc.notificationsList).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    fixture.detectChanges();
    const post = fixture.nativeElement as HTMLElement;
    expect(post.querySelector('[data-testid="skeleton"]')).toBeFalsy();
    expect(post.querySelectorAll('[data-notif-item]').length).toBe(8);
  });
});
