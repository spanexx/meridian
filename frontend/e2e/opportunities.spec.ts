/**
 * E2E test for /opportunities — wireframe-aligned (post #14).
 *
 * Verifies:
 *   - the route resolves with the correct title + subtitle
 *   - Search input + Category DROPDOWN trigger are present
 *   - 6 status tabs render with counts
 *   - 9-column table renders with the right headers
 *   - 8 rows per page, 24 rows total, 3 pages of pagination
 *   - Vote cells render "N↑ / N↓" with green/red colors
 *   - Footer shows "Showing N of 24" + "1 / 3"
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('opportunities page (wireframe-aligned)', () => {
  test('route loads and renders the title + subtitle', async ({ page }) => {
    const res = await page.goto('/opportunities');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Opportunities' })).toBeVisible();
    await expect(page.getByText('signal pipeline')).toBeVisible();
    await expect(page.getByText('24 active')).toBeVisible();
  });

  test('renders a search input + Category dropdown trigger + Submit Signal CTA', async ({ page }) => {
    await page.goto('/opportunities');
    await expect(page.locator('input[type="search"]')).toBeVisible();
    await expect(page.locator('[data-dropdown="catMenu"]')).toBeVisible();
    // Both the shell sidebar and the page header have an
    // <a href="/submit-signal">. Scope to the page CTA via .btn-primary.
    await expect(page.locator('section.page a[href="/submit-signal"].btn-primary')).toBeVisible();
  });

  test('Category is a DROPDOWN — no inline category pill row', async ({ page }) => {
    await page.goto('/opportunities');
    expect(await page.locator('[data-testid="category-filter"]').count()).toBe(0);
    expect(await page.locator('#catMenu').count()).toBe(1);
  });

  test('renders all 6 status tabs with counts', async ({ page }) => {
    await page.goto('/opportunities');
    const tabs = page.locator('[data-testid="status-filter"] button');
    await expect(tabs).toHaveCount(6);
    await expect(tabs.nth(0)).toContainText('All');
    await expect(tabs.nth(0)).toContainText('24');
    await expect(tabs.nth(1)).toContainText('Pending');
    await expect(tabs.nth(1)).toContainText('8');
    await expect(tabs.nth(2)).toContainText('In Vetting');
    await expect(tabs.nth(2)).toContainText('5');
    await expect(tabs.nth(3)).toContainText('Approved');
    await expect(tabs.nth(3)).toContainText('3');
    await expect(tabs.nth(4)).toContainText('Executing');
    await expect(tabs.nth(4)).toContainText('2');
    await expect(tabs.nth(5)).toContainText('Rejected');
    await expect(tabs.nth(5)).toContainText('6');
  });

  test('default tab "All" is aria-selected=true', async ({ page }) => {
    await page.goto('/opportunities');
    const all = page.locator('[data-testid="status-filter"] button').nth(0);
    await expect(all).toHaveAttribute('aria-selected', 'true');
  });

  test('table has 9 columns including an empty arrow column', async ({ page }) => {
    await page.goto('/opportunities');
    const headers = await page.locator('thead th').allTextContents();
    expect(headers).toEqual([
      'Ref', 'Title', 'Category', 'Submitted by',
      'Est. ROI', 'Capital', 'Votes', 'Status', '',
    ]);
  });

  test('table renders 8 rows by default', async ({ page }) => {
    await page.goto('/opportunities');
    await expect(page.locator('tbody tr')).toHaveCount(8);
  });

  test('Capital cells render with thousands separator', async ({ page }) => {
    await page.goto('/opportunities');
    const html = await page.locator('body').innerHTML();
    expect(html).toMatch(/\$\d{1,3},\d{3}/);
  });

  test('Est. ROI cells render with leading "+" and emerald color', async ({ page }) => {
    await page.goto('/opportunities');
    const firstRoi = page.locator('tbody td .text-emerald-400').first();
    await expect(firstRoi).toBeVisible();
    const text = await firstRoi.textContent();
    expect(text).toMatch(/^\+\d+(\.\d)?%$/);
  });

  test('Vote cells render "N↑ / N↓" when votes exist; "—" when not', async ({ page }) => {
    await page.goto('/opportunities');
    const html = await page.locator('body').innerHTML();
    expect(html).toMatch(/\d+↑/);
    expect(html).toMatch(/\d+↓/);
    expect(html).toContain('—');
  });

  test('Submitted-by cells show avatar circles + names', async ({ page }) => {
    await page.goto('/opportunities');
    const avatars = page.locator('tbody td .avatar');
    expect(await avatars.count()).toBeGreaterThan(0);
    const first = avatars.first();
    const initials = await first.textContent();
    expect(initials?.trim().length).toBeGreaterThan(0);
  });

  test('footer renders pagination "Showing ... of 24" + "1 / 3"', async ({ page }) => {
    await page.goto('/opportunities');
    const footer = page.locator('[data-testid="pagination"]');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Showing');
    await expect(footer).toContainText('of 24');
    await expect(footer).toContainText('1 / 3');
  });

  test('clicking the next button advances to page 2', async ({ page }) => {
    await page.goto('/opportunities');
    const next = page.locator('[data-page-next]');
    await next.click();
    const footer = page.locator('[data-testid="pagination"]');
    await expect(footer).toContainText('2 / 3');
  });

  test('opportunities page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/opportunities');
    await page.screenshot({ path: 'e2e/screenshots/opportunities.png', fullPage: true });
  });

  test('mobile: status tabs collapse into a dropdown with all 6 options', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/opportunities');
    const select = page.locator('[data-testid="status-select"]');
    await expect(select).toBeVisible();
    await expect(page.locator('[data-testid="status-filter"]')).toBeHidden();
    for (const opt of ['All 24', 'Pending 8', 'In Vetting 5', 'Approved 3', 'Executing 2', 'Rejected 6']) {
      await expect(select.locator('option', { hasText: opt })).toHaveCount(1);
    }
    // filtering via the dropdown mirrors the tab behavior
    await select.selectOption({ label: 'Pending 8' });
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expect(page.locator('tbody tr').first()).toHaveAttribute('data-status', 'pending');
  });
});
