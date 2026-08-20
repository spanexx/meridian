/**
 * Auth journey spec — the industry-standard cross-page flow test.
 *
 * BRIDGE 2026-08-20: before this file, auth was only covered page-by-page
 * (login.spec, register.spec), and no e2e walked a user through the whole
 * lifecycle. A journey test proves the pieces compose: sign up → land on
 * /login → sign in → protected /dashboard renders → sign out → landing.
 *
 * The mock gateway's /auth/login always returns a token pair for the
 * seeded demo credentials (mock-seed.ts), so the positive path is fully
 * exercised end-to-end. The 2FA challenge step itself is covered at unit
 * level (login.page.spec) because the mock never issues a challenge.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-20
 */
import { test, expect } from '@playwright/test';

test.describe('auth journey (register → login → dashboard → sign out)', () => {
  test('a new member completes signup, signs in, and reaches the dashboard', async ({ page }) => {
    // 1. Sign up (no session yet).
    await page.goto('/register');
    await expect(page.locator('h1', { hasText: 'Join the pool' })).toBeVisible();
    await page.locator('[data-testid="create-account"]').click();
    await expect(page.getByText('Account created — welcome aboard')).toBeVisible();

    // 2. Signup issues no token → the app lands on /login (Pack C).
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1', { hasText: 'Welcome back' })).toBeVisible();

    // 3. Sign in with the seeded demo credentials.
    await page.locator('[data-testid="sign-in"]').click();
    await expect(page.getByText('Signed in — welcome back')).toBeVisible();

    // 4. The protected dashboard renders with the authenticated greeting.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex/ })).toBeVisible();

    // 5. Sessions persist across navigation (still authenticated on /pool).
    await page.goto('/pool');
    await expect(page.locator('h1.page-title', { hasText: 'Capital Pool' })).toBeVisible();
  });

  test('signing out clears the session and returns to the landing page', async ({ page }) => {
    // Sign in through the real flow (NOT addInitScript — init scripts
    // re-run on every navigation and would re-seed the session after
    // logout, defeating this test).
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/); // protected route bounces
    await page.locator('[data-testid="sign-in"]').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/profile');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    // After logout the landing page shows (no shell, no session).
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('ui-shell')).toHaveCount(0);

    // The session is gone: a protected route now redirects to /login.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1', { hasText: 'Welcome back' })).toBeVisible();
  });
});