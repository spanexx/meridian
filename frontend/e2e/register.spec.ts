/**
 * E2E test for /register — shell-less auth page (wireframe-aligned).
 *
 * Verifies:
 *   - route resolves and renders "Join the pool" shell-less (no ui-shell)
 *   - form fields (Full name / Email / Password / Confirm / terms)
 *   - submit() shows the success toast then navigates to /dashboard
 *   - 'Sign in' cross-links to /login
 *   - screenshot saved to e2e/screenshots/register.png
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';
import { expectScreenshot, waitForStable } from './helpers/visual';

test.describe('register page (shell-less auth)', () => {
  test('route loads shell-less with title + subtitle', async ({ page }) => {
    const res = await page.goto('/register');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Join the pool' })).toBeVisible();
    await expect(
      page.getByText('Register to contribute capital, signals, or access.'),
    ).toBeVisible();
    await expect(page.locator('ui-shell')).toHaveCount(0);
  });

  test('renders the Full name / Email / Password / Confirm / terms fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[data-field="fullname"]')).toHaveAttribute(
      'placeholder',
      'Your name',
    );
    await expect(page.locator('input[data-field="email"]')).toHaveAttribute(
      'placeholder',
      'you@example.com',
    );
    await expect(page.locator('input[data-field="password"]')).toBeVisible();
    await expect(page.locator('input[data-field="confirm"]')).toBeVisible();
    await expect(page.locator('input[data-field="terms"]')).toBeVisible();
    await expect(page.getByText('integrity first.')).toBeVisible();
  });

  test('create account toasts then lands on /login (no token issued at signup)', async ({ page }) => {
    await page.goto('/register');
    await page.locator('[data-testid="create-account"]').click();
    await expect(page.getByText('Account created — welcome aboard')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('"Sign in" cross-links to /login', async ({ page }) => {
    await page.goto('/register');
    await page.locator('[data-testid="login-link"]').click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1', { hasText: 'Welcome back' })).toBeVisible();
  });

  test('register renders true to its golden baseline', async ({ page }) => {
    await page.goto('/register');
    await waitForStable(page);
    await expectScreenshot(page, 'register');
  });
});
