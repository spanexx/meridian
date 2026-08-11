import { test, expect } from '@playwright/test';

test.describe('ui-avatar primitive', () => {
  test('avatar-sm renders at 24px', async ({ page }) => {
    await page.goto('/dashboard');
    const av = page.locator('ui-avatar .avatar.avatar-sm').first();
    await expect(av).toBeVisible();
    const size = await av.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { w: parseFloat(cs.width), h: parseFloat(cs.height) };
    });
    expect(size.w).toBeCloseTo(24, 0);
    expect(size.h).toBeCloseTo(24, 0);
  });

  test('avatar-xl renders at 72px', async ({ page }) => {
    await page.goto('/dashboard');
    const av = page.locator('ui-avatar .avatar.avatar-xl').first();
    await expect(av).toBeVisible();
    const size = await av.evaluate((el) => parseFloat(getComputedStyle(el).width));
    expect(size).toBeCloseTo(72, 0);
  });

  test('avatar shows initials when name provided', async ({ page }) => {
    await page.goto('/dashboard');
    const av = page.locator('ui-avatar').first();
    await expect(av).toContainText('AP');
  });
});