/**
 * E2E test for /opportunities/:id — Opportunity Detail.
 *
 * Verifies the wireframe layout: breadcrumb, header (ref + status +
 * category badges + title + 2 ghost buttons), 5 main cards
 * (Acquisition, Resale, Financials, Evidence, Vetting) and
 * 3 sidebar cards (Your Vote, Submitter, Timeline), with the
 * Vetting tabs behaving as a tri-state panel.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { expect, test } from '@playwright/test';
import { seedSession } from './helpers/auth';
import { expectScreenshot, waitForStable } from './helpers/visual';

test.describe('opportunity detail page (wireframe-aligned)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  test('route loads and renders the breadcrumb + title', async ({ page }) => {
    const res = await page.goto('/opportunities/O-2049');
    expect(res?.status()).toBeLessThan(400);
    const breadcrumb = page.getByTestId('opportunity-breadcrumb');
    await expect(breadcrumb.getByText('Opportunities', { exact: true })).toBeVisible();
    await expect(breadcrumb.getByText('O-2049')).toBeVisible();
    await expect(page.locator('h1', { hasText: 'Travis Scott' })).toBeVisible();
  });

  test('header carries status + category badges + 2 ghost buttons (ref lives in breadcrumb)', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    // breadcrumb owns the ref "O-2049"
    const crumb = page.locator('[data-testid="opportunity-breadcrumb"]');
    await expect(crumb.getByText('O-2049')).toBeVisible();
    // header carries the badges (no duplicate ref)
    const header = page.locator('header').first();
    await expect(header.getByText('In Vetting')).toBeVisible();
    await expect(header.getByText('Apparel')).toBeVisible();
    // header should NOT have a font-mono ref span
    await expect(header.locator('span.font-mono')).toHaveCount(0);
    // action buttons still present
    await expect(page.locator('button[aria-label="Share link"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Bookmark"]')).toBeVisible();
  });

  test('Acquisition card lists source, cost, qty, deadline', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Acquisition' });
    await expect(section.getByText('Boutique wholesale')).toBeVisible();
    await expect(section.getByText('Boston, MA')).toBeVisible();
    await expect(section.getByText('$14,200')).toBeVisible();
    await expect(section.getByText('8 pairs')).toBeVisible();
    await expect(section.getByText('Mar 28, 2026')).toBeVisible();
    await expect(section.getByText('12 days')).toBeVisible();
  });

  test('Resale card lists channels, est value, time, confidence', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Resale' });
    for (const ch of ['StockX', 'GOAT', 'eBay']) {
      await expect(section.getByText(ch)).toBeVisible();
    }
    await expect(section.getByText('$21,500')).toBeVisible();
    await expect(section.getByText('14 days')).toBeVisible();
    await expect(section.getByText('High')).toBeVisible();
  });

  test('Financials card lists 4 KPIs (profit, ROI, risk, payback)', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Financials' });
    for (const k of ['Est. profit', 'ROI', 'Risk', 'Payback']) {
      await expect(section.getByText(k)).toBeVisible();
    }
    await expect(section.getByText('$7,300')).toBeVisible();
    await expect(section.getByText('+51.4%')).toBeVisible();
    await expect(section.getByText('Medium')).toBeVisible();
    await expect(section.getByText('14 d')).toBeVisible();
  });

  test('Evidence card renders 3 lazy-loaded picsum images', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Evidence' });
    const imgs = section.locator('img');
    await expect(imgs).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const src = await imgs.nth(i).getAttribute('src');
      expect(src).toMatch(/^https:\/\/picsum\.photos\//);
      expect(await imgs.nth(i).getAttribute('loading')).toBe('lazy');
    }
  });

  test('Vetting tabs swap panels (Auto-checks → Votes → Comments)', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const checks = page.locator('[data-panel="checks"]');
    const votes = page.locator('[data-panel="votes"]');
    const comments = page.locator('[data-panel="comments"]');
    // Auto-checks active by default
    await expect(page.getByRole('tab', { name: 'Auto-checks' })).toHaveAttribute('aria-selected', 'true');
    await expect(checks).toBeVisible();
    await expect(checks.getByText('Duplicate check')).toBeVisible();
    await expect(checks.getByText(/APPROVE —/)).toBeVisible();
    // Switch to Votes
    await page.getByRole('tab', { name: 'Votes' }).click();
    await expect(votes).toBeVisible();
    await expect(votes.getByText('Jules Tan')).toBeVisible();
    await expect(votes.getByText('Kenji Honda')).toBeVisible();
    // Switch to Comments
    await page.getByRole('tab', { name: 'Comments' }).click();
    await expect(comments).toBeVisible();
    await expect(page.locator('[data-testid="comment-form"]')).toBeVisible();
  });

  test('Your Vote sidebar carries the 2 vote buttons + reputation weight', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Your Vote' });
    await expect(section).toContainText('1.4');
    await expect(section.locator('[data-vote-type="approve"]')).toBeVisible();
    await expect(section.locator('[data-vote-type="reject"]')).toBeVisible();
  });

  test('clicking Approve marks the button active', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const approve = page.locator('[data-vote-type="approve"]');
    await approve.click();
    await expect(approve).toHaveClass(/active/);
  });

  test('Submitter sidebar lists the member + stats', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Submitter' });
    await expect(section.getByText('Mike Rivera')).toBeVisible();
    await expect(section.getByText('Member since 2024')).toBeVisible();
    await expect(section.getByText('14 submitted')).toBeVisible();
    await expect(section.getByText('9 approved')).toBeVisible();
    await expect(section.getByText('+24.6%')).toBeVisible();
  });

  test('Timeline sidebar lists 4 events', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    const section = page.locator('section').filter({ hasText: 'Timeline' });
    for (const e of ['Submitted', 'Auto-checks ran', 'Vetting opened', 'Decision']) {
      await expect(section.getByText(e)).toBeVisible();
    }
  });

  test('mobile: page renders at 375 without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/opportunities/O-2049');
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollW).toBeLessThanOrEqual(375);
  });

  test('opportunity-detail renders true to its golden baseline', async ({ page }) => {
    await page.goto('/opportunities/O-2049');
    await waitForStable(page);
    await expectScreenshot(page, 'opportunity-detail');
  });
});
