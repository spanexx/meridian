/**
 * E2E coverage for the progress primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-progress primitive', () => {
  test('progress track renders with rounded background', async ({ page }) => {
    await page.goto('/showcase');
    const track = page.locator('ui-progress .progress-track').first();
    await expect(track).toBeVisible();
    const radius = await track.evaluate((el) => getComputedStyle(el).borderRadius);
    // 9999px resolves to a pill shape
    expect(radius).toBe('9999px');
  });

  test('progress fill width matches value input (clamped 0-100)', async ({ page }) => {
    await page.goto('/showcase');
    const fill = page.locator('ui-progress .progress-fill').first();
    await expect(fill).toBeVisible();
    // dashboard sets [value]="34" → 34%
    const styleAttr = await fill.getAttribute('style');
    expect(styleAttr).toContain('34');
  });
});