/**
 * E2E coverage for the accordion primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-accordion primitive', () => {
  test('accordion items render with toggle buttons', async ({ page }) => {
    await page.goto('/showcase');
    const items = page.locator('ui-accordion-item');
    expect(await items.count()).toBe(2);
    await expect(items.first().locator('.accordion-toggle')).toBeVisible();
  });

  test('clicking toggle opens the body', async ({ page }) => {
    await page.goto('/showcase');
    const item = page.locator('ui-accordion-item').first();
    await expect(item.locator('.accordion-body')).toHaveCount(0);
    await item.locator('.accordion-toggle').first().click();
    await expect(item.locator('.accordion-body')).toBeVisible();
    await expect(item.locator('.accordion-body')).toContainText('124 members');
  });

  test('chevron rotates when open', async ({ page }) => {
    await page.goto('/showcase');
    const item = page.locator('ui-accordion-item').first();
    const chevron = item.locator('.accordion-chevron');
    await expect(chevron).toBeVisible();
    await item.locator('.accordion-toggle').first().click();
    await expect(chevron).toHaveClass(/open/);
  });
});