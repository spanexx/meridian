/**
 * E2E test for /payouts — wireframe-aligned (payouts pack).
 *
 * Verifies:
 *   - the route resolves with the correct title + subtitle
 *   - 3 KPI cards render (raw markup, mirrors the pool page)
 *   - Split Formula card with a Governance link
 *   - 7-column table with 8 rows per page (48 total)
 *   - Pagination footer "Showing 8 of 48" + "1 / 6"
 *   - Status tab filter (Paid) filters rows by data-status
 *   - Search input filters rows by member name
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';
import { seedSession } from './helpers/auth';

test.describe('payouts page (wireframe-aligned)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('route loads and renders the title + subtitle', async ({ page }) => {
    const res = await page.goto('/payouts');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Payouts' })).toBeVisible();
    await expect(page.getByText('Profit distribution across the pool')).toBeVisible();
  });

  test('renders a search input + Type dropdown trigger', async ({ page }) => {
    await page.goto('/payouts');
    await expect(page.locator('input[type="search"]')).toBeVisible();
    await expect(page.locator('[data-dropdown="payMenu"]')).toBeVisible();
  });

  test('renders 3 KPI cards with the wireframe labels', async ({ page }) => {
    await page.goto('/payouts');
    const kpi = page.locator('[data-testid="kpi-row"] .card');
    await expect(kpi).toHaveCount(3);
    await expect(kpi.nth(0)).toContainText('Distributed YTD');
    await expect(kpi.nth(1)).toContainText('Pending');
    await expect(kpi.nth(2)).toContainText('Avg. execution ROI');
  });

  test('renders the Split Formula card with 5 cells + Governance link', async ({ page }) => {
    await page.goto('/payouts');
    await expect(page.getByRole('heading', { name: 'Split Formula' })).toBeVisible();
    await expect(page.locator('[data-testid="split-cell"]')).toHaveCount(5);
    await expect(page.locator('a[href="/community/alpha/governance"]')).toBeVisible();
  });

  test('table renders 8 rows by default with first row E-1039 / Dana Voss', async ({ page }) => {
    await page.goto('/payouts');
    await expect(page.locator('tbody tr')).toHaveCount(8);
    const first = page.locator('tbody tr').first();
    await expect(first).toContainText('E-1039');
    await expect(first).toContainText('Dana Voss');
  });

  test('footer renders pagination "Showing 8 of 48" + "1 / 6"', async ({ page }) => {
    await page.goto('/payouts');
    const footer = page.locator('[data-testid="pagination"]');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Showing 8 of 48');
    await expect(footer).toContainText('1 / 6');
  });

  test('clicking the Paid status tab filters every row to data-status="paid"', async ({ page }) => {
    await page.goto('/payouts');
    await page.locator('[data-filter-tab="paid"]').click();
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toHaveAttribute('data-status', 'paid');
    }
  });

  test('typing "jules" into search filters every row to Jules Tan', async ({ page }) => {
    await page.goto('/payouts');
    await page.fill('input[type="search"]', 'jules');
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('Jules Tan');
    }
  });

  test('payouts page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/payouts');
    await page.screenshot({ path: 'e2e/screenshots/payouts.png', fullPage: true });
  });
});
