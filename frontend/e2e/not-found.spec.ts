/**
 * E2E test for the wildcard 404 page.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';

test.describe('not-found page (wildcard)', () => {
  test('unknown URLs render the 404 page', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-real-page');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Page not found' })).toBeVisible();
    await expect(page.getByText('404')).toBeVisible();
  });

  test('the 404 page links back to the landing', async ({ page }) => {
    await page.goto('/definitely-not-a-real-page');
    await page.getByRole('link', { name: 'Back to the landing' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
