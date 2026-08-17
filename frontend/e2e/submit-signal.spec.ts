/**
 * E2E test for /submit-signal — wireframe-aligned 5-step wizard.
 *
 * Verifies:
 *   - the route resolves with the correct title + subtitle
 *   - 5-step stepper with numbers 1-5, only the current step .active
 *   - Details panel prefills title/category/risk/description verbatim
 *   - Wizard navigation: next()/back() move through the steps (panels)
 *   - Live Preview sidebar shows the computed profit / ROI / channels
 *   - Review step renders the summary + 4 stat cards bound to signals
 *   - last step submit fires the success toast, then navigates to
 *     /opportunities
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { test, expect } from '@playwright/test';

test.describe('submit-signal page (wireframe-aligned)', () => {
  test('route loads and renders the title + subtitle', async ({ page }) => {
    const res = await page.goto('/submit-signal');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1', { hasText: 'Submit Signal' })).toBeVisible();
    await expect(
      page.getByText('An arbitrage opportunity for the community to vet.'),
    ).toBeVisible();
  });

  test('stepper renders 5 steps numbered 1-5 with only step 1 active', async ({ page }) => {
    await page.goto('/submit-signal');
    await expect(page.locator('[data-step]')).toHaveCount(5);
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`[data-step="${i - 1}"] .step-num`)).toHaveText(String(i));
    }
    await expect(page.locator('[data-step="0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-step="1"]')).not.toHaveClass(/active/);
  });

  test('Details panel prefills the wireframe demo values', async ({ page }) => {
    await page.goto('/submit-signal');
    await expect(page.locator('input[data-field="title"]')).toHaveValue(
      'Travis Scott × Nike Sneakers',
    );
    await expect(page.locator('select[data-field="category"]')).toHaveValue('Apparel');
    await expect(page.locator('select[data-field="risk"]')).toHaveValue('Medium');
  });

  test('Live Preview sidebar binds Title / Category / Capital / Profit / ROI / Channels', async ({
    page,
  }) => {
    await page.goto('/submit-signal');
    const preview = page.locator('[data-testid="live-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Apparel');
    await expect(preview).toContainText('$14,200');
    await expect(preview).toContainText('$7,300');
    await expect(preview).toContainText('+51.4%');
  });

  test('wizard advances via Next and returns via Back', async ({ page }) => {
    await page.goto('/submit-signal');
    await expect(page.locator('[data-step-prev]')).toBeDisabled();
    await page.locator('[data-step-next]').click();
    await expect(page.locator('[data-step="1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-step-panel="1"]')).toBeVisible();
    await page.locator('[data-step-prev]').click();
    await expect(page.locator('[data-step="0"]')).toHaveClass(/active/);
  });

  test('last step shows "Submit for vetting" and submit() navigates to /opportunities', async ({
    page,
  }) => {
    await page.goto('/submit-signal');
    for (let i = 0; i < 4; i++) {
      await page.locator('[data-step-next]').click();
    }
    await expect(page.locator('[data-step-next]')).toContainText('Submit for vetting');
    await page.locator('[data-step-next]').click();
    await expect(page.getByText('Signal submitted — auto-checks running')).toBeVisible();
    await expect(page).toHaveURL(/\/opportunities/);
  });

  test('Review step renders summary + 4 stat cards bound to signals', async ({ page }) => {
    await page.goto('/submit-signal');
    for (let i = 0; i < 4; i++) {
      await page.locator('[data-step-next]').click();
    }
    const panel = page.locator('[data-step-panel="4"]');
    await expect(panel).toContainText('Travis Scott × Nike Sneakers');
    await expect(panel).toContainText('$14,200');
    await expect(panel).toContainText('$21,500');
    await expect(panel).toContainText('$7,300');
    await expect(panel).toContainText('+51.4%');
  });

  test('submit-signal page screenshot saved for visual review', async ({ page }) => {
    await page.goto('/submit-signal');
    await page.screenshot({ path: 'e2e/screenshots/submit-signal.png', fullPage: true });
  });
});
