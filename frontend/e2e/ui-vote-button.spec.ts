/**
 * E2E coverage for the vote-button primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-vote-button primitive', () => {
  test('vote-btn renders with base class', async ({ page }) => {
    await page.goto('/showcase');
    const approve = page.locator('ui-vote-button button.vote-btn').first();
    await expect(approve).toBeVisible();
  });

  test('approve button gets .active.approve when set', async ({ page }) => {
    await page.goto('/showcase');
    const approve = page.locator('ui-vote-button button.vote-btn').first();
    await approve.click();
    await expect(approve).toHaveClass(/active/);
    await expect(approve).toHaveClass(/approve/);
  });

  test('reject button has .reject class', async ({ page }) => {
    await page.goto('/showcase');
    const reject = page.locator('ui-vote-button button.vote-btn.reject');
    await expect(reject.first()).toBeVisible();
  });
});