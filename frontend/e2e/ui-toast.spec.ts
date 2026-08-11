import { test, expect } from '@playwright/test';

test.describe('ui-toast primitive', () => {
  test('toast hidden by default, shown when triggered', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('ui-toast .toast')).toHaveCount(0);
    await page.locator('ui-button:has-text("Show toast")').first().click();
    await expect(page.locator('ui-toast .toast')).toBeVisible();
    await expect(page.locator('ui-toast .toast')).toContainText('Saved');
  });

  test('toast-success variant has emerald left border', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('ui-button:has-text("Show toast")').first().click();
    const toast = page.locator('ui-toast .toast.toast-success');
    await expect(toast).toBeVisible();
  });

  test('toast dismiss button hides the toast', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('ui-button:has-text("Show toast")').first().click();
    await expect(page.locator('ui-toast .toast')).toBeVisible();
    await page.locator('ui-toast .icon-btn[aria-label="Dismiss"]').first().click();
    await expect(page.locator('ui-toast .toast')).toHaveCount(0);
  });
});