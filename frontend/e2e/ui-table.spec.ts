/**
 * E2E coverage for the table primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-table primitive', () => {
  test('table renders with .table-scroll wrapper', async ({ page }) => {
    await page.goto('/showcase');
    const scroll = page.locator('ui-table .table-scroll').first();
    await expect(scroll).toBeVisible();
    const overflow = await scroll.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
  });

  test('rows render with .table-row class', async ({ page }) => {
    await page.goto('/showcase');
    const rows = page.locator('ui-table .table-row');
    expect(await rows.count()).toBe(3);
    await expect(rows.first()).toContainText('Sneaker Resale');
  });

  test('headers render with proper labels', async ({ page }) => {
    await page.goto('/showcase');
    const headers = page.locator('ui-table thead th');
    await expect(headers.nth(0)).toHaveText('Asset');
    await expect(headers.nth(1)).toHaveText('ROI');
  });
});