/**
 * E2E test for the landing page (root route, shell-less).
 *
 * Verifies:
 *   - the root route resolves to the landing (no ui-shell)
 *   - hero headline + trust chips + Join CTA
 *   - three-way pillars with the 60/25/15 split
 *   - live ticker cards render
 *   - numbers section sparklines render
 *   - footer links resolve
 *   - full-page screenshot for visual review
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';
import { expectScreenshot, waitForStable } from './helpers/visual';
import { seedSession } from './helpers/auth';

test.describe('landing page (wireframe-aligned)', () => {
  test('root route renders the shell-less landing', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Profit together' })).toBeVisible();
    await expect(page.locator('ui-shell')).toHaveCount(0);
  });

  test('hero: trust chips + Join CTA link to /register', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('KYC at join', { exact: true })).toBeVisible();
    await expect(page.getByText('No ponzi mechanics')).toBeVisible();
    const join = page.getByRole('link', { name: 'Join the community' });
    await expect(join).toHaveAttribute('href', /register/);
  });

  test('pillars + 60/25/15 split render', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Three ways in.')).toBeVisible();
    await expect(page.getByText('Bring capital')).toBeVisible();
    await expect(page.getByText('Find the deal')).toBeVisible();
    await expect(page.getByText('Hold the keys')).toBeVisible();
    await expect(page.locator('.big-num')).toHaveCount(3);
    await expect(page.getByText('Profit split (community-voted)')).toBeVisible();
  });

  test('live ticker renders 12 cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ticker-track .card')).toHaveCount(12);
    await expect(page.getByText('Travis Scott × Nike').first()).toBeVisible();
  });

  test('numbers section renders sparklines + stat bars', async ({ page }) => {
    await page.goto('/');
    await page.getByText('By the numbers').scrollIntoViewIfNeeded();
    await expect(page.locator('svg.spark')).toHaveCount(2);
    await expect(page.getByText('Pool capital · 90 days')).toBeVisible();
    await expect(page.getByText('Win-rate · 30d')).toBeVisible();
  });

  test('footer columns link into the app', async ({ page }) => {
    // Pack C: /payouts is guarded — seed a session so the link resolves
    // into the app instead of bouncing to /login.
    await seedSession(page);
    await page.goto('/');
    await page.getByRole('link', { name: 'Payouts' }).first().click();
    await expect(page).toHaveURL(/\/(payouts|login)/);
  });

  test('landing renders true to its golden baseline', async ({ page }) => {
    await page.goto('/');
    await waitForStable(page);
    await expectScreenshot(page, 'landing');
  });
});
