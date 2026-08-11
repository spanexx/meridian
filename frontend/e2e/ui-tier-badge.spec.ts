import { test, expect } from '@playwright/test';

test.describe('ui-tier-badge primitive', () => {
  test('tier=observer renders badge-neutral', async ({ page }) => {
    await page.goto('/dashboard');
    const tier = page.locator('ui-tier-badge[data-tier="observer"]').first();
    await expect(tier).toBeVisible();
    const text = await tier.locator('.badge').first().textContent();
    expect(text?.trim()).toBe('Observer');
  });

  test('tier=founder renders badge-premium', async ({ page }) => {
    await page.goto('/dashboard');
    const tier = page.locator('ui-tier-badge[data-tier="founder"]').first();
    await expect(tier).toBeVisible();
    const inner = tier.locator('.badge-premium');
    await expect(inner).toHaveCount(1);
  });

  test('tier=vetted renders badge-success', async ({ page }) => {
    await page.goto('/dashboard');
    const tier = page.locator('ui-tier-badge[data-tier="vetted"]').first();
    await expect(tier).toBeVisible();
    const inner = tier.locator('.badge-success');
    await expect(inner).toHaveCount(1);
  });
});