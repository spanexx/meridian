import { test, expect } from '@playwright/test';

test.describe('ui-empty-state primitive', () => {
  test('empty-state renders .empty class with centered layout', async ({ page }) => {
    await page.goto('/dashboard');
    const empty = page.locator('ui-empty-state .empty').first();
    await expect(empty).toBeVisible();
    const style = await empty.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { textAlign: cs.textAlign, paddingTop: cs.paddingTop };
    });
    expect(style.textAlign).toBe('center');
    expect(parseFloat(style.paddingTop)).toBeGreaterThan(0);
  });

  test('empty-state shows title and message', async ({ page }) => {
    await page.goto('/dashboard');
    const empty = page.locator('ui-empty-state').first();
    await expect(empty).toContainText('Nothing here yet');
    await expect(empty).toContainText('new opportunities land');
  });
});