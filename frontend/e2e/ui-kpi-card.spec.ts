/**
 * E2E coverage for the kpi-card primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-kpi-card primitive', () => {
  test('kpi-label is uppercase with letter-spacing', async ({ page }) => {
    await page.goto('/showcase');
    const label = page.locator('ui-kpi-card .kpi-label').first();
    await expect(label).toBeVisible();
    const style = await label.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.textTransform, tracking: cs.letterSpacing, weight: cs.fontWeight };
    });
    expect(style.transform).toBe('uppercase');
    expect(parseFloat(style.tracking)).toBeGreaterThan(0);
    expect(parseInt(style.weight)).toBeGreaterThanOrEqual(600);
  });

  test('kpi-number has weight 300 and tabular numerals', async ({ page }) => {
    await page.goto('/showcase');
    const num = page.locator('ui-kpi-card .kpi-number').first();
    await expect(num).toBeVisible();
    const style = await num.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { weight: cs.fontWeight, numeric: cs.fontVariantNumeric };
    });
    expect(style.weight).toBe('300');
    expect(style.numeric).toContain('tabular-nums');
  });

  test('gradient variant applies text-gradient-emerald background-clip', async ({ page }) => {
    await page.goto('/showcase');
    const num = page.locator('ui-kpi-card .kpi-number.text-gradient-emerald').first();
    await expect(num).toBeVisible();
    const clip = await num.evaluate((el) => getComputedStyle(el).webkitBackgroundClip);
    expect(clip).toBe('text');
  });
});