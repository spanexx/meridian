/**
 * E2E test for the /opportunities page.
 *
 * Verifies the route resolves, the page renders structurally with the
 * wireframe's filter pills and the data table, the category/status
 * filters actually change the rendered state, and saves a full-page
 * screenshot for human inspection.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

const CATEGORIES = ['All categories', 'Apparel', 'Collectibles', 'Electronics', 'Equipment', 'Furniture'];
const STATUSES = ['All', 'Pending', 'In Vetting', 'Approved', 'Executing', 'Rejected'];
const COLUMNS = ['Ref', 'Title', 'Category', 'Submitted by', 'Est. ROI', 'Capital', 'Votes', 'Status'];

test.describe('opportunities page', () => {
  test('route loads and renders the title', async ({ page }) => {
    const res = await page.goto('/opportunities');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Opportunities' })).toBeVisible();
  });

  test('renders every category filter pill', async ({ page }) => {
    await page.goto('/opportunities');
    const catSection = page.locator('[data-testid="category-filter"]');
    for (const cat of CATEGORIES) {
      await expect(catSection.getByRole('button', { name: cat, exact: true })).toBeVisible();
    }
  });

  test('renders every status filter pill', async ({ page }) => {
    await page.goto('/opportunities');
    const statSection = page.locator('[data-testid="status-filter"]');
    for (const status of STATUSES) {
      // Match buttons whose first direct text node equals `status` exactly.
      // The status pills render "Pending (3)" etc.; we want to skip the
      // trailing count span, hence the :text-is() pseudo-class.
      await expect(statSection.locator(`button:text-is("${status}")`).first()).toBeVisible();
    }
  });

  test('table columns match the wireframe spec', async ({ page }) => {
    await page.goto('/opportunities');
    const headers = await page.locator('thead th').allTextContents();
    expect(headers.map((h) => h.trim())).toEqual(COLUMNS);
  });

  test('clicking a non-default category pill moves aria-pressed', async ({ page }) => {
    await page.goto('/opportunities');
    const catSection = page.locator('[data-testid="category-filter"]');
    const apparel = catSection.getByRole('button', { name: 'Apparel', exact: true });
    await apparel.click();
    await expect(apparel).toHaveAttribute('aria-pressed', 'true');
    const all = catSection.getByRole('button', { name: 'All categories', exact: true });
    await expect(all).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking a status pill filters the table to that status', async ({ page }) => {
    await page.goto('/opportunities');
    const statSection = page.locator('[data-testid="status-filter"]');
    await statSection.locator('button:text-is("Pending")').first().click();
    const statusCells = await page.locator('tbody tr td:last-child').allTextContents();
    expect(statusCells.length).toBeGreaterThan(0);
    for (const cell of statusCells) {
      expect(cell.trim()).toBe('Pending');
    }
  });

  test('opportunities page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/opportunities');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/opportunities.png',
      fullPage: true,
    });
  });
});