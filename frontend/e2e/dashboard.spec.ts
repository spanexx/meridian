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
    const rows = page.locator('a[href*="/executions/"]');
    expect(await rows.count()).toBeGreaterThan(0);
    const firstHref = await rows.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/executions\/E-\d+$/);
  });

  test('renders Latest Opportunities section with rows linking to detail', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2', { hasText: 'Latest Opportunities' })).toBeVisible();
    const rows = page.locator('a[href*="/opportunities/"]');
    expect(await rows.count()).toBeGreaterThan(0);
    const firstHref = await rows.first().getAttribute('href');
    expect(firstHref).toMatch(/^\/opportunities\/O-\d+$/);
  });

  test('renders Pool Health section with an SVG sparkline', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2', { hasText: 'Pool Health' })).toBeVisible();
    const svg = page.locator('h2:has-text("Pool Health") ~ * svg, h2:has-text("Pool Health")').first().locator('xpath=..').locator('svg').first();
    expect(await svg.count()).toBeGreaterThan(0);
  });

  test('Submit Signal CTA links to /submit-signal', async ({ page }) => {
    await page.goto('/dashboard');
    const cta = page.locator('a[href="/submit-signal"]');
    expect(await cta.count()).toBeGreaterThan(0);
  });

  test('renders a member portfolio card with stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Capital contributed').first()).toBeVisible();
    await expect(page.locator('text=Lifetime earnings').first()).toBeVisible();
  });

  test('full-page screenshot matches the wireframe layout', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 5000,
      fullPage: true,
    });
  });
});
