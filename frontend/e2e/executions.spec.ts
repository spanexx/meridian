/**
 * E2E test for /executions — wireframe-aligned (post #15).
 *
 * Verifies:
 *   - the route resolves with the correct title + subtitle
 *   - Search input + 'Pool' link in the header
 *   - 4 status tabs render with counts (16/3/12/1)
 *   - default tab 'All' is aria-selected=true
 *   - cards have status badge + 3-up Deployed/Recovered/ROI grid + progress bar
 *   - clicking 'Failed' shows exactly 1 card
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('executions page (wireframe-aligned)', () => {
  test('route loads and renders the title + subtitle', async ({ page }) => {
    const res = await page.goto('/executions');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Executions' })).toBeVisible();
    await expect(page.getByText('Active and completed arbitrage operations')).toBeVisible();
  });

  test('header has a Search input and a Pool link', async ({ page }) => {
    await page.goto('/executions');
    await expect(page.locator('section.page header input[type="search"]')).toBeVisible();
    await expect(page.locator('section.page header a[href="/pool"]')).toBeVisible();
  });

  test('renders 4 status tabs with counts', async ({ page }) => {
    await page.goto('/executions');
    const tabs = page.locator('[data-testid="status-filter"] button');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('All');
    await expect(tabs.nth(0)).toContainText('16');
    await expect(tabs.nth(1)).toContainText('Active');
    await expect(tabs.nth(1)).toContainText('3');
    await expect(tabs.nth(2)).toContainText('Completed');
    await expect(tabs.nth(2)).toContainText('12');
    await expect(tabs.nth(3)).toContainText('Failed');
    await expect(tabs.nth(3)).toContainText('1');
  });

  test('default tab "All" is aria-selected=true', async ({ page }) => {
    await page.goto('/executions');
    const all = page.locator('[data-testid="status-filter"] button').nth(0);
    await expect(all).toHaveAttribute('aria-selected', 'true');
  });

  test('cards have a status badge + Deployed/Recovered/ROI grid + progress bar', async ({ page }) => {
    await page.goto('/executions');
    const cards = page.locator('a.card.card-hover');
    expect(await cards.count()).toBeGreaterThan(0);
    const first = cards.first();
    await expect(first.locator('.badge').first()).toBeVisible();
    await expect(first.locator('.kpi-label', { hasText: 'Deployed' }).first()).toBeVisible();
    await expect(first.locator('.kpi-label', { hasText: 'Recovered' }).first()).toBeVisible();
    await expect(first.locator('.kpi-label', { hasText: 'ROI' }).first()).toBeVisible();
    await expect(first.locator('.progress-track').first()).toBeVisible();
  });

  test('clicking "Failed" filters to exactly 1 card', async ({ page }) => {
    await page.goto('/executions');
    const tabs = page.locator('[data-testid="status-filter"] button');
    const failed = tabs.nth(3);
    await failed.click();
    await expect(page.locator('a.card.card-hover')).toHaveCount(1);
  });

  test('executions page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/executions');
    await page.screenshot({ path: 'e2e/screenshots/executions.png', fullPage: true });
  });
});
