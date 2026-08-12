/**
 * E2E test for /pool — Capital Pool page.
 *
 * Verifies the wireframe layout: header actions, KPI row, chart with
 * range tabs, reserve gauge, health metrics, contributors table, and
 * the deposit/withdraw modals.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { expect, test } from '@playwright/test';

test.describe('Capital Pool page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pool');
  });

  test('renders the header with title, subtitle and action buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Capital Pool' })).toBeVisible();
    await expect(page.getByText('Pool health, reserve ratio, liquidity, and member contributions.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Snapshot/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Withdraw/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deposit/ })).toBeVisible();
  });

  test('renders the 4 KPI cards with wireframe values', async ({ page }) => {
    const kpi = page.getByTestId('kpi-row');
    await expect(kpi.getByText('Total Available')).toBeVisible();
    await expect(page.getByText('$1,423,580')).toBeVisible();
    await expect(kpi.getByText('Total Locked')).toBeVisible();
    await expect(page.getByText('$487,230')).toBeVisible();
    await expect(kpi.getByText('Reserve', { exact: true })).toBeVisible();
    await expect(page.getByText('$258,952')).toBeVisible();
    await expect(kpi.getByText('Pending', { exact: true })).toBeVisible();
    await expect(page.getByText('$42,100')).toBeVisible();
  });

  test('chart card renders with 90d active and switches ranges', async ({ page }) => {
    const chart = page.locator('section').filter({ hasText: 'Pool ·' });
    await expect(page.getByText('Pool · 90 days')).toBeVisible();
    const tabs = page.locator('button.tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(1)).toHaveClass(/active/);
    await tabs.nth(0).click();
    await expect(page.getByText('Pool · 7 days')).toBeVisible();
    await expect(tabs.nth(0)).toHaveClass(/active/);
    // legend (scoped to the chart card)
    await expect(chart.getByText('Available', { exact: true })).toBeVisible();
    await expect(chart.getByText('Locked', { exact: true })).toBeVisible();
    await expect(chart.getByText('Reserve', { exact: true })).toBeVisible();
  });

  test('reserve ratio gauge card shows 18.2% Healthy', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reserve Ratio' })).toBeVisible();
    await expect(page.getByText('Healthy ≥ 12%')).toBeVisible();
    await expect(page.locator('svg[aria-label="Reserve ratio gauge"]')).toBeVisible();
    await expect(page.getByText('18.2%').first()).toBeVisible();
    await expect(page.getByText('Healthy', { exact: true })).toBeVisible();
  });

  test('health metrics shows 4 bars with values', async ({ page }) => {
    for (const label of ['Reserve ratio', 'Liquidity', 'Deployment', 'Pending withdrawals']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('62.4%')).toBeVisible();
    await expect(page.getByText('34.2%')).toBeVisible();
    await expect(page.getByText('$8,400')).toBeVisible();
    await expect(page.getByText('In band 20–40% · Cap 50%')).toBeVisible();
  });

  test('contributors table lists the 5 wireframe members', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Top Capital Contributors' })).toBeVisible();
    for (const name of ['Dana Voss', 'Ravi Kumar', 'Lena Moreau', 'Tomás Alves', 'Yuki Nakamura']) {
      await expect(page.getByText(name)).toBeVisible();
    }
    await expect(page.getByText('$284,500')).toBeVisible();
    await expect(page.getByText('20%')).toBeVisible();
    await expect(page.getByRole('link', { name: /All members/ })).toBeVisible();
  });

  test('deposit modal opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: /Deposit/ }).first().click();
    await expect(page.getByText('Deposit capital')).toBeVisible();
    await expect(page.getByText('Funds become available immediately.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Deposit capital')).toBeHidden();
  });

  test('withdraw modal opens with balance and rails', async ({ page }) => {
    await page.getByRole('button', { name: /Withdraw/ }).click();
    await expect(page.getByText('Request withdrawal')).toBeVisible();
    await expect(page.getByText('Available balance $12,500.00.')).toBeVisible();
    await expect(page.locator('select').locator('option', { hasText: 'Bank transfer · •••• 4821' })).toHaveCount(1);
  });
});
