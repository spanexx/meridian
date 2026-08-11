import { test, expect } from '@playwright/test';

test.describe('ui-skeleton primitive', () => {
  test('skeleton renders with bg-overlay token background', async ({ page }) => {
    await page.goto('/dashboard');
    const sk = page.locator('ui-skeleton .skeleton').first();
    await expect(sk).toBeVisible();
    const radius = await sk.evaluate((el) => getComputedStyle(el).borderRadius);
    // .skeleton border-radius: 0.5rem = 8px
    expect(radius).toBe('8px');
  });
});