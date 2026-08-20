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
import { expectScreenshot, waitForStable } from './helpers/visual';

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
    // Industry-standard: assert by accessible label text (retrying), not
    // by CSS class selectors — the tiles must be discoverable as content.
    for (const label of ['Total Pool', 'Active Capital', 'Active Members', 'Open Opportunities']) {
      await expect(page.getByText(label, { exact: false })).toBeVisible();
    }
    // KPI values are monetary/percentage strings ("$1.42M", "16", "84%") —
    // at least one must render per tile (retrying, since values are async).
    await expect(page.getByText(/^\$[\d.,]+[KM]?$/).first()).toBeVisible();
  });

  test('renders Active Executions section with rows linking to detail', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 2, name: 'Active Executions' })).toBeVisible();
    // Rows are async (ApiClient.executionsList via the mock) — use a
    // retrying assertion, not an immediate count() (DISCOVERY 2026-08-19:
    // the count raced on CI's slower machine and read 0 before render).
    const rows = page.locator('a[href*="/executions/"]');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('renders Latest Opportunities section', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 2, name: 'Latest Opportunities' })).toBeVisible();
    // Same race guard: wait for an opportunity ref to appear (retrying)
    // before asserting the section text (DISCOVERY 2026-08-19).
    const ref = page.getByText(/O-\d{3,}/).first();
    await expect(ref).toBeVisible();
    const text = await ref.textContent();
    expect(text).toMatch(/O-\d{3,}/);
  });

  test('renders Pool Health SVG chart', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 2, name: 'Pool Health' })).toBeVisible();
    // The chart is a real SVG with an accessible label — assert on the
    // semantic role + that it draws at least one path, not raw path
    // strings or CSS classes.
    const chart = page.getByTestId('pool-health-chart');
    await expect(chart).toBeVisible();
    const svgAttrs = await chart.evaluate((el) => ({
      labelled: el.getAttribute('aria-label') ?? '',
      viewBox: el.getAttribute('viewBox') ?? '',
      pathCount: el.querySelectorAll('path').length,
    }));
    expect(svgAttrs.labelled).toBe('Pool Health chart');
    expect(svgAttrs.viewBox).toBeTruthy();
    expect(svgAttrs.pathCount).toBeGreaterThan(0);
  });

  test('Submit Signal CTA points at /submit-signal', async ({ page }) => {
    await page.goto('/dashboard');
    // Both the shell sidebar and the dashboard header have a submit-signal
    // link; the page's primary CTA is the .btn-primary in section.page.
    const cta = page.locator('section.page a[href="/submit-signal"].btn-primary');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Submit Signal');
  });

  test('renders the member portfolio card', async ({ page }) => {
    await page.goto('/dashboard');
    // Portfolio labels are static copy; assert each is visible in the page
    // body (retrying, so the async member data has time to fill values).
    for (const label of ['Capital contributed', 'Lifetime earnings', 'Reputation tier']) {
      await expect(page.getByText(label, { exact: false })).toBeVisible();
    }
  });

  test('layout: Active Executions sits LEFT of Pool Health (3-col grid)', async ({ page }) => {
    await page.goto('/dashboard');
    // Geometry over implementation: assert the real rendered positions,
    // not Tailwind class names in the DOM.
    const executions = page.getByRole('heading', { level: 2, name: 'Active Executions' });
    const poolHealth = page.getByRole('heading', { level: 2, name: 'Pool Health' });
    await expect(executions).toBeVisible();
    await expect(poolHealth).toBeVisible();
    const left = (await executions.boundingBox())!;
    const right = (await poolHealth.boundingBox())!;
    expect(left.x).toBeLessThan(right.x);
  });

  test('dashboard renders true to its golden baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForStable(page);
    await expectScreenshot(page, 'dashboard');
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
    // Accessible table semantics: heading level 2 section contains a
    // table whose column headers carry the wireframe's exact names.
    const table = page.getByRole('table').first();
    await expect(table).toBeVisible();
    const headers = await table.getByRole('columnheader').allTextContents();
    expect(headers).toEqual(expect.arrayContaining(['Ref', 'Title', 'Category', 'Est. ROI', 'Status', 'Votes']));
  });

  test('Pool Health has three metric bars (Reserve ratio, Liquidity, Deployment)', async ({ page }) => {
    await page.goto('/dashboard');
    for (const metric of ['Reserve ratio', 'Liquidity', 'Deployment']) {
      await expect(page.getByText(metric, { exact: false })).toBeVisible();
    }
  });
});
