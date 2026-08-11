import { test, expect } from '@playwright/test';

test.describe('ui-modal primitive', () => {
  test('modal does not render in DOM when closed', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('ui-modal .modal-overlay')).toHaveCount(0);
  });

  test('modal opens and shows overlay + modal chrome', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('ui-button:has-text("Open modal")').first().click();
    const overlay = page.locator('ui-modal .modal-overlay');
    await expect(overlay).toBeVisible();
    const modal = page.locator('ui-modal .modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Confirm action');
  });

  test('modal close button emits close event', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('ui-button:has-text("Open modal")').first().click();
    await expect(page.locator('ui-modal .modal-overlay')).toBeVisible();
    await page.locator('ui-modal .icon-btn[aria-label="Close"]').first().click();
    await expect(page.locator('ui-modal .modal-overlay')).toHaveCount(0);
  });
});