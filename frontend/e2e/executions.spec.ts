/**
 * E2E test for the /executions page.
 *
 * Verifies the route resolves, the page renders structurally with the
 * wireframe's status filter and the executions grid, the status filter
 * actually changes the rendered state, and saves a full-page
 * screenshot for human inspection.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

const STATUSES = ['All', 'Active', 'Completed', 'Failed'];

test.describe('executions page', () => {
  test('route loads and renders the title', async ({ page }) => {
    const res = await page.goto('/executions');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Executions' })).toBeVisible();
  });

  test('renders every status filter pill', async ({ page }) => {
    await page.goto('/executions');
    const section = page.locator('[data-testid="status-filter"]');
    for (const status of STATUSES) {
      await expect(
        section.locator(`button:text-is("${status}")`).first(),
      ).toBeVisible();
    }
  });

  test('marks the default "All" pill aria-pressed=true on first paint', async ({ page }) => {
    await page.goto('/executions');
    const section = page.locator('[data-testid="status-filter"]');
    const all = section.locator('button:text-is("All")').first();
    await expect(all).toHaveAttribute('aria-pressed', 'true');
  });

  test('renders at least one execution card', async ({ page }) => {
    await page.goto('/executions');
    const anchors = page.locator('a.card[data-filterable]');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each card links to /execution-detail/<ref-id>', async ({ page }) => {
    await page.goto('/executions');
    const anchors = page.locator('a.card[data-filterable]');
    const count = await anchors.count();
    for (let i = 0; i < count; i++) {
      const a = anchors.nth(i);
      const href = await a.getAttribute('href');
      const ref = (await a.locator('.font-mono').first().innerText()).trim();
      expect(href).toBe(`/execution-detail/${ref}`);
    }
  });

  test('clicking a status pill moves aria-pressed and filters cards', async ({ page }) => {
    await page.goto('/executions');
    const section = page.locator('[data-testid="status-filter"]');
    const active = section.locator('button:text-is("Active")').first();
    await active.click();
    await expect(active).toHaveAttribute('aria-pressed', 'true');
    const all = section.locator('button:text-is("All")').first();
    await expect(all).toHaveAttribute('aria-pressed', 'false');
    // Every visible card must carry data-status="active".
    const anchors = page.locator('a.card[data-status]');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect(await anchors.nth(i).getAttribute('data-status')).toBe('active');
    }
  });

  test('every card carries a UiBadge status pill', async ({ page }) => {
    await page.goto('/executions');
    const anchors = page.locator('a.card[data-filterable]');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const badge = anchors.nth(i).locator('.badge').first();
      await expect(badge).toBeVisible();
      const cls = (await badge.getAttribute('class')) ?? '';
      const hasVariant = cls.split(/\s+/).some((c) => c.startsWith('badge-'));
      expect(hasVariant).toBe(true);
    }
  });

  test('executions page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/executions');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/executions.png',
      fullPage: true,
    });
  });
});
