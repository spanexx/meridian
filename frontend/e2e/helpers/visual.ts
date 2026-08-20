/**
 * Visual-regression helpers (industry-standard golden-file testing).
 *
 * BRIDGE 2026-08-20: the old "screenshot saved for visual review" tests
 * saved a PNG and asserted nothing — they could never fail, so visual
 * drift shipped to CI undetected. These helpers convert them into real
 * assertions via Playwright's toHaveScreenshot() against committed
 * baselines (golden files).
 *
 * Two stability guarantees make goldens deterministic:
 *   1. Font readiness — webfonts (Google Fonts Inter/Montserrat) load
 *      asynchronously; capturing before `document.fonts.ready` flakes on
 *      the fallback font. Await it explicitly.
 *   2. Pixel tolerance — antialiasing differs subtly across OS/GPU
 *      rasterizers, so every golden asserts with maxDiffPixelRatio (2%)
 *      instead of byte-exact equality.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-20
 */
import { expect, type Page } from '@playwright/test';

/**
 * Wait until the page is visually stable for a golden capture:
 * fonts loaded, network idle, and a short quiet period for async data
 * (no fixed sleeps — fonts.ready + networkidle are the retry sources).
 */
// TEST-COUPLED: exercised end-to-end by every "* renders true to its
// golden baseline" spec (11 call sites) — a unit test would need a real
// browser; the e2e specs are the tests.
export async function waitForStable(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
}

/**
 * Assert the page matches its committed golden baseline.
 *
 * maxDiffPixelRatio 0.02 absorbs cross-rasterizer antialiasing; animations
 * are disabled so marquees/count-ups do not move between frames.
 */
// TEST-COUPLED: exercised end-to-end by every "* renders true to its
// golden baseline" spec (11 call sites) — see waitForStable note.
export async function expectScreenshot(page: Page, name: string): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
    caret: 'hide',
  });
}
