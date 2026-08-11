/**
 * E2E coverage for the badge primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-badge primitive', () => {
  test('badge-success uses emerald color token', async ({ page }) => {
    await page.goto('/showcase');
    const badge = page.locator('ui-badge .badge-success').first();
    await expect(badge).toBeVisible();
    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    // var(--e-400) = #34d399 = rgb(52, 211, 153)
    expect(color).toBe('rgb(52, 211, 153)');
  });

  test('badge-premium uses violet gradient', async ({ page }) => {
    await page.goto('/showcase');
    const badge = page.locator('ui-badge .badge-premium').first();
    await expect(badge).toBeVisible();
    // Check the rendered background color (badge-premium uses background: var(--gradient-violet) which resolves to #a86a2d)
    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(168, 106, 45)');
  });

  test('badge-warning uses amber', async ({ page }) => {
    await page.goto('/showcase');
    const badge = page.locator('ui-badge .badge-warning').first();
    await expect(badge).toBeVisible();
    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    // var(--a-400) = #fbbf24 = rgb(251, 191, 36)
    expect(color).toBe('rgb(251, 191, 36)');
  });
});