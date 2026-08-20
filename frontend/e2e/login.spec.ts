/**
 * E2E test for /login — shell-less auth page (wireframe-aligned).
 *
 * Verifies:
 *   - route resolves and renders "Welcome back" shell-less (no ui-shell)
 *   - demo credentials prefilled (alex@meridian.com / demo-password)
 *   - forgot() shows the reset toast
 *   - submit() shows the success toast then navigates to /dashboard
 *   - 'Create an account' cross-links to /register
 *   - screenshot saved to e2e/screenshots/login.png
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';
import { expectScreenshot, waitForStable } from './helpers/visual';

test.describe('login page (shell-less auth)', () => {
  test('route loads shell-less with title + tagline', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Collective Arbitrage')).toBeVisible();
    await expect(page.getByText('Sign in to your MERIDIAN account.')).toBeVisible();
    await expect(page.locator('ui-shell')).toHaveCount(0);
  });

  test('prefills the wireframe demo credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[data-field="email"]')).toHaveValue('alex@meridian.com');
    await expect(page.locator('input[data-field="password"]')).toHaveValue('demo-password');
  });

  test('forgot password shows the reset toast', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="forgot"]').click();
    await expect(page.getByText('Reset link sent to alex@meridian.com')).toBeVisible();
  });

  test('sign in toasts then navigates to /dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="sign-in"]').click();
    await expect(page.getByText('Signed in — welcome back')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('"Create an account" cross-links to /register', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="register-link"]').click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1', { hasText: 'Join the pool' })).toBeVisible();
  });

  test('login renders true to its golden baseline', async ({ page }) => {
    await page.goto('/login');
    await waitForStable(page);
    await expectScreenshot(page, 'login');
  });
});
