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
import { seedSession } from './helpers/auth';

test.describe('dashboard page (wireframe-driven)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

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
    const rows = page.locator('a[href*="/executions/"]');
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
    // The dashboard now lives inside <ui-shell>, so 'main' matches
    // twice (shell's <main class="main"> and the page's <main>).
    // Scope to the Pool Health section by its section heading.
    const html = await page.locator('body').innerHTML();
    expect(html).toContain('viewBox="0 0 200 50"');
    expect(html).toContain('M0,38 L30,36 L60,30');
  });

  test('Submit Signal CTA points at /submit-signal', async ({ page }) => {
    await page.goto('/dashboard');
    // Both the shell sidebar and the dashboard header have an
    // <a href="/submit-signal">. Scope to the page's primary CTA
    // (which carries the .btn-primary class).
    const cta = page.locator('section.page a[href="/submit-signal"].btn-primary');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Submit Signal');
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


  test('layout: 3-column body grid below KPI row (Active Executions left, Pool Health right)', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.locator('body').innerHTML();
    expect(html).toMatch(/lg:grid-cols-3/);
    expect(html).toContain('lg:col-span-2');
  });

  test('Active Executions rows show status text on the right (3 of 8 sold / Closing / ETA 4 days)', async ({ page }) => {
    await page.goto('/dashboard');
    // Rows are async (ApiClient.executionsList via the mock) — use
    // retrying assertions instead of an immediate innerHTML read
    // (DISCOVERY 2026-08-19: the innerHTML race passed pre-rewire when
    // the list was hardcoded; one-source rows load after the seed).
    await expect(page.getByText('3 of 8 sold')).toBeVisible();
    await expect(page.getByText('Closing', { exact: true })).toBeVisible();
    await expect(page.getByText('ETA 4 days')).toBeVisible();
  });

  test('Latest Opportunities renders a TABLE not cards', async ({ page }) => {
    await page.goto('/dashboard');
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();
    const headers = await table.first().locator('thead th').allTextContents();
    expect(headers).toEqual(expect.arrayContaining(['Ref', 'Title', 'Category', 'Est. ROI', 'Status', 'Votes']));
  });

  test('Pool Health has three metric bars (Reserve ratio, Liquidity, Deployment)', async ({ page }) => {
    await page.goto('/dashboard');
    const html = await page.locator('body').innerHTML();
    expect(html).toContain('Reserve ratio');
    expect(html).toContain('Liquidity');
    expect(html).toContain('Deployment');
  });
});
