import { test, expect } from '@playwright/test';

test.describe('ui-sparkline primitive', () => {
  test('sparkline SVG renders a path', async ({ page }) => {
    await page.goto('/dashboard');
    const svg = page.locator('ui-sparkline svg').first();
    await expect(svg).toBeVisible();
    const path = svg.locator('path');
    await expect(path).toHaveCount(1);
    const d = await path.getAttribute('d');
    expect(d).toMatch(/^M[\d.]+,/);
  });

  test('sparkline width and height attrs are applied', async ({ page }) => {
    await page.goto('/dashboard');
    const svg = page.locator('ui-sparkline svg').first();
    await expect(svg).toHaveAttribute('width', '320');
    await expect(svg).toHaveAttribute('height', '40');
  });
});