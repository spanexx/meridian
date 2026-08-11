import { test, expect } from '@playwright/test';

test.describe('ui-table primitive', () => {
  test('table renders with .table-scroll wrapper', async ({ page }) => {
    await page.goto('/dashboard');
    const scroll = page.locator('ui-table .table-scroll').first();
    await expect(scroll).toBeVisible();
    const overflow = await scroll.evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflow).toBe('auto');
  });

  test('rows render with .table-row class', async ({ page }) => {
    await page.goto('/dashboard');
    const rows = page.locator('ui-table .table-row');
    expect(await rows.count()).toBe(3);
    await expect(rows.first()).toContainText('Sneaker Resale');
  });

  test('headers render with proper labels', async ({ page }) => {
    await page.goto('/dashboard');
    const headers = page.locator('ui-table thead th');
    await expect(headers.nth(0)).toHaveText('Asset');
    await expect(headers.nth(1)).toHaveText('ROI');
  });
});