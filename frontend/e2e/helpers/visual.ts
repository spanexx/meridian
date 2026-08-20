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
 * Assert Inter + Montserrat genuinely loaded (not silently failed).
 *
 * BRIDGE 2026-08-21 (font debugging): document.fonts.ready resolves even
 * when every @font-face request failed — the browser then renders the
 * fallback stack, which is EXACTLY the cross-environment drift class that
 * broke golden comparisons on CI (5% on every page). This fails fast with
 * the failing font URLs instead of a pixel diff.
 */
// TEST-COUPLED: exercised end-to-end by every "* renders true to its
// golden baseline" spec (11 call sites) — see waitForStable note.
export async function expectFontsLoaded(page: Page): Promise<void> {
  const state = await page.evaluate(async () => {
    // Force-load BOTH fonts regardless of page usage (fonts.check only
    // reports fonts actually rendered on the page — Montserrat only
    // appears in the brand wordmark, so check() is false on most pages).
    // load() fetches the woff2 and resolves when ready; failures reject.
    let interOk = false;
    let montserratOk = false;
    try {
      await document.fonts.load('16px Inter');
      interOk = document.fonts.check('16px Inter');
    } catch {
      interOk = false;
    }
    try {
      await document.fonts.load('16px Montserrat');
      montserratOk = document.fonts.check('16px Montserrat');
    } catch {
      montserratOk = false;
    }
    const failures = performance
      .getEntriesByType('resource')
      .filter((r) => /woff2?$/.test(r.name))
      .filter((r) => (r as PerformanceResourceTiming).responseStatus >= 400)
      .map((r) => r.name);
    return { inter: interOk, montserrat: montserratOk, failures };
  });
  expect(state.failures, `font fetch failures: ${state.failures.join(', ') || 'none'}`).toHaveLength(0);
  expect(state.inter, 'Inter did not load — fallback font would drift goldens').toBe(true);
  expect(state.montserrat, 'Montserrat did not load — fallback font would drift goldens').toBe(true);
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
  await expectFontsLoaded(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
    caret: 'hide',
  });
}
