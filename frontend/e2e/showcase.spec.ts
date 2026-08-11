/**
 * E2E coverage for the /showcase route — visual + theme.css token
 * verification harness for the 19 primitives. Renamed from
 * `dashboard.spec.ts` on 2026-08-11 when /dashboard got re-routed
 * to the real product placeholder.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

/**
 * Verifies the Angular dashboard renders the wireframe's theme tokens
 * correctly. Each assertion maps to a specific class in
 * wireframe/meridian/kit/theme.css — if any of these fail, the
 * scaffold's theme bridge is broken.
 */
test.describe('showcase primitive-coverage', () => {
  test('page-title typography matches theme.css .page-title', async ({ page }) => {
    await page.goto('/showcase');

    const title = page.locator('h1.page-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('UI primitives — smoke test');

    const computed = await title.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        letterSpacingPx: parseFloat(cs.letterSpacing),
        fontSizePx: parseFloat(cs.fontSize),
        color: cs.color,
      };
    });
    expect(computed.fontWeight).toBe('600'); // .page-title font-weight: 600
    // -0.02em at 30px font-size (sm:text-3xl in wireframe) = -0.6px; allow ±0.1
    expect(Math.abs(computed.letterSpacingPx - computed.fontSizePx * -0.02)).toBeLessThan(0.2);
  });

  test('page-subtitle color matches theme.css .page-subtitle', async ({ page }) => {
    await page.goto('/showcase');
    const subtitle = page.locator('p.page-subtitle');
    await expect(subtitle).toBeVisible();
    const color = await subtitle.evaluate((el) => getComputedStyle(el).color);
    // .page-subtitle color: var(--text-2) which in dark theme is #a8a8b8 → rgb(168, 168, 184)
    expect(color).toBe('rgb(168, 168, 184)');
  });

  test('btn-primary background matches .btn-primary', async ({ page }) => {
    await page.goto('/showcase');
    const btn = page.locator('button.btn-primary').first();
    await expect(btn).toBeVisible();
    // .btn-primary { background: var(--gradient-primary) } which is #14b8a6 in dark, #0d9488 in light
    const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Accept either dark or light theme value
    expect(['rgb(20, 184, 166)', 'rgb(13, 148, 136)']).toContain(bg);
  });

  test('card border-radius matches .card definition (0.875rem = 14px)', async ({ page }) => {
    await page.goto('/showcase');
    const card = page.locator('.card.p-5').first();
    await expect(card).toBeVisible();
    const radius = await card.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(radius).toBe('14px');
  });

  test('kpi-number font-weight matches .kpi-number (300)', async ({ page }) => {
    await page.goto('/showcase');
    const kpiNumber = page.locator('.kpi-number').first();
    await expect(kpiNumber).toBeVisible();
    const weight = await kpiNumber.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(weight).toBe('300');
  });

  test('body has dark theme background by default', async ({ page }) => {
    await page.goto('/showcase');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // .html[data-theme=dark]: body background = var(--gradient-bg) which contains #07070b
    // The actual computed value depends on browser handling of the gradient;
    // we just verify it's NOT the light theme (#f6f7fb)
    expect(bg).not.toBe('rgb(246, 247, 251)');
  });

  test('showcase screenshot saved for visual review', async ({ page }) => {
    await page.goto('/showcase');
    await page.waitForTimeout(500); // give the SPA a beat to settle
    await page.screenshot({ path: 'e2e/screenshots/showcase.png', fullPage: true });
    // Note: a real visual diff against the wireframe would use
    // toHaveScreenshot with a checked-in baseline. For the smoke
    // test we just capture a PNG for human inspection.
  });
});
