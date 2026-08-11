/**
 * E2E test for the /dashboard route — the REAL product dashboard.
 *
 * Verifies the route resolves, the wireframe-driven sections render
 * (greeting, 4 KPI tiles, Active Executions, Latest Opportunities,
 * Pool Health SVG), the Submit Signal CTA points at /submit-signal,
 * and a full-page screenshot is saved for visual review.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('dashboard page (wireframe-driven)', () => {
  test('route loads and renders the greeting', async ({ page }) => {
    const res = await page.goto('/dashboard');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1.page-title', { hasText: 'Good evening, Alex' })).toBeVisible();
  });

  test('renders the 4 KPI tiles with labels + values', async ({ page }) => {
    await page.goto('/dashboard');
    for (const label of ['Total Pool', 'Active Capital', 'Active Members', 'Open Opportunities']) {
      await expect(page.locator('.kpi-label', { hasText: label })).toBeVisible();
    }
    const numbers = await page.locator('.kpi-number').count();
    expect(numbers).toBeGreaterThanOrEqual(4);
  });

  test('renders Active Executions section with rows linking to detail', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2', { hasText: 'Active Executions' })).toBeVisible();
    const rows = page.locator('a[href*="/execution-detail/"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('renders Latest Opportunities section', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2', { hasText: 'Latest Opportunities' })).toBeVisible();
    const text = await page.locator('main').innerText();
    expect(text).toMatch(/O-\d{3,}/);
  });

  test('renders Pool Health SVG chart', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2', { hasText: 'Pool Health' })).toBeVisible();
    await expect(page.locator('main svg path').first()).toBeVisible();
  });

  test('Submit Signal CTA points at /submit-signal', async ({ page }) => {
    await page.goto('/dashboard');
    const cta = page.locator('a[href="/submit-signal"]');
    await expect(cta).toBeVisible();
  });

  test('renders the member portfolio card', async ({ page }) => {
    await page.goto('/dashboard');
    const main = await page.locator('main').innerText();
    expect(main).toContain('Capital contributed');
    expect(main).toContain('Lifetime earnings');
    expect(main).toContain('Reputation tier');
  });

  test('dashboard screenshot saved for visual review', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: true });
  });
});
