/**
 * E2E test for /notifications — wireframe-aligned.
 *
 * Verifies:
 *   - the route resolves with title + subtitle
 *   - 8 notification rows render (3 unread with pulse dots)
 *   - Unread tab filters to 3 rows
 *   - Mark all read clears the unread dots and Unread count
 *   - Preferences modal opens with 4 switches; Save shows the toast
 *   - full-page screenshot for visual review
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';
import { expectScreenshot, waitForStable } from './helpers/visual';
import { seedSession } from './helpers/auth';

test.describe('notifications page (wireframe-aligned)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('route loads and renders the title + subtitle', async ({ page }) => {
    const res = await page.goto('/notifications');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Notifications' })).toBeVisible();
    await expect(page.getByText('derived from the event stream')).toBeVisible();
  });

  test('renders 8 rows, 3 unread with pulse dots', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('[data-notif-item]')).toHaveCount(8);
    await expect(page.locator('[data-unread-dot]')).toHaveCount(3);
    await expect(page.locator('[data-notif-item]').first()).toContainText('O-2051');
  });

  test('Unread tab filters to the 3 unread rows', async ({ page }) => {
    await page.goto('/notifications');
    await page.locator('[data-filter-tab="unread"]').click();
    await expect(page.locator('[data-notif-item]')).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(page.locator('[data-notif-item]').nth(i)).toHaveAttribute('data-read', 'false');
    }
  });

  test('Mark all read clears dots and drives Unread count to 0', async ({ page }) => {
    await page.goto('/notifications');
    // List is async (ApiClient via the mock): wait for it to render
    // before clicking, or mark-all-read acts on an empty list
    // (DISCOVERY 2026-08-19 pattern; flaked 2026-08-20 on a cold run).
    await expect(page.locator('[data-notif-item]')).toHaveCount(8);
    await page.locator('[data-mark-read]').click();
    await expect(page.locator('[data-unread-dot]')).toHaveCount(0);
    await expect(page.locator('[data-filter-tab="unread"]')).toContainText('0');
    await expect(page.locator('[data-filter-tab="all"]')).toContainText('8');
  });

  test('Preferences modal opens, Save closes it with a toast', async ({ page }) => {
    await page.goto('/notifications');
    await page.getByRole('button', { name: 'Preferences' }).click();
    const modal = page.locator('[data-testid="prefs-modal"]');
    await expect(modal).toBeVisible();
    // The ui-switch primitive exposes role="switch": assert the four
    // toggles by accessible role, not the .switch class.
    await expect(modal.getByRole('switch')).toHaveCount(4);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Notification preferences saved')).toBeVisible();
    await expect(modal).toBeHidden();
  });

  test('notifications renders true to its golden baseline', async ({ page }) => {
    await page.goto('/notifications');
    await waitForStable(page);
    await expectScreenshot(page, 'notifications');
  });
});
