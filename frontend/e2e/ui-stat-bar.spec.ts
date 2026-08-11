import { test, expect } from '@playwright/test';

test.describe('ui-stat-bar primitive', () => {
  test('stat-bar fill width matches value (62%)', async ({ page }) => {
    await page.goto('/dashboard');
    const fills = page.locator('ui-stat-bar .progress-fill');
    expect(await fills.count()).toBe(3);
    const first = fills.first();
    const style = await first.getAttribute('style');
    expect(style).toContain('62');
  });

  test('stat-bar fill color matches variant (violet)', async ({ page }) => {
    await page.goto('/dashboard');
    const fill = page.locator('ui-stat-bar .progress-fill-violet').first();
    await expect(fill).toBeVisible();
    // progress-fill-violet uses background: var(--gradient-violet) which resolves to a solid color
    const bg = await fill.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(168, 106, 45)');
  });
});