import { test, expect } from '@playwright/test';

test.describe('ui-card primitive', () => {
  test('card border-radius matches .card (14px)', async ({ page }) => {
    await page.goto('/dashboard');
    const card = page.locator('ui-card .card').first();
    await expect(card).toBeVisible();
    const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(radius).toBe('14px');
  });

  test('card-hover variant applies :hover transition', async ({ page }) => {
    await page.goto('/dashboard');
    const card = page.locator('ui-card .card.card-hover').first();
    await expect(card).toBeVisible();
    const transition = await card.evaluate((el) => getComputedStyle(el).transitionProperty);
    // .card-hover uses `transition: all 200ms` — verify transition-duration > 0
    expect(transition).toBeTruthy();
    const duration = await card.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).not.toBe('0s');
  });
});