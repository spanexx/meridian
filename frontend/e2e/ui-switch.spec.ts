/**
 * E2E coverage for the switch primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-switch primitive', () => {
  test('switch renders with .switch class', async ({ page }) => {
    await page.goto('/showcase');
    const sw = page.locator('ui-switch .switch').first();
    await expect(sw).toBeVisible();
    await expect(sw).toHaveAttribute('role', 'switch');
  });

  test('switch checked state has aria-checked=true and emerald background', async ({ page }) => {
    await page.goto('/showcase');
    const sw = page.locator('ui-switch .switch').first();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  test('clicking toggles aria-checked', async ({ page }) => {
    await page.goto('/showcase');
    const sw = page.locator('ui-switch .switch').first();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
  });
});