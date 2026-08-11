import { test, expect } from '@playwright/test';

test.describe('ui-tabs primitive', () => {
  test('tabs render with .tabs wrapper', async ({ page }) => {
    await page.goto('/dashboard');
    const tabs = page.locator('ui-tabs .tabs').first();
    await expect(tabs).toBeVisible();
    const tabBtns = tabs.locator('.tab');
    expect(await tabBtns.count()).toBe(3);
  });

  test('active tab has .active class and aria-selected=true', async ({ page }) => {
    await page.goto('/dashboard');
    const active = page.locator('ui-tabs .tab.active').first();
    await expect(active).toBeVisible();
    await expect(active).toHaveText('Pool');
    await expect(active).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking a tab emits select event', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('ui-tabs .tab:has-text("Risk")').first().click();
    const active = page.locator('ui-tabs .tab.active');
    await expect(active).toHaveText('Risk');
  });
});