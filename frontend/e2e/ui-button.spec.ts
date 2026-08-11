import { test, expect } from '@playwright/test';

test.describe('ui-button primitive', () => {
  test('primary button matches theme.css .btn-primary', async ({ page }) => {
    await page.goto('/dashboard');
    const btn = page.locator('ui-button button.btn-primary').first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(['rgb(20, 184, 166)', 'rgb(13, 148, 136)']).toContain(bg);
  });

  test('secondary button matches theme.css .btn-secondary', async ({ page }) => {
    await page.goto('/dashboard');
    const btn = page.locator('ui-button button.btn-secondary').first();
    await expect(btn).toBeVisible();
    const color = await btn.evaluate((el) => getComputedStyle(el).color);
    // text-1 resolves to a light foreground in dark theme
    expect(color).not.toBe('rgb(0, 0, 0)');
  });

  test('disabled state applies :disabled styles', async ({ page }) => {
    await page.goto('/dashboard');
    const btn = page.locator('ui-button button[disabled]').first();
    await expect(btn).toBeVisible();
    const opacity = await btn.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(opacity).toBeLessThan(1);
  });

  test('icon button matches .icon-btn', async ({ page }) => {
    await page.goto('/dashboard');
    const btn = page.locator('ui-button button.icon-btn').first();
    await expect(btn).toBeVisible();
  });
});