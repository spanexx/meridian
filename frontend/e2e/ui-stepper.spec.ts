/**
 * E2E coverage for the stepper primitive — verifies that the
 * primitive renders correctly under the theme.css tokens it depends on.
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import { test, expect } from '@playwright/test';

test.describe('ui-stepper primitive', () => {
  test('stepper renders all steps with correct numbering', async ({ page }) => {
    await page.goto('/showcase');
    const stepper = page.locator('ui-stepper .stepper').first();
    await expect(stepper).toBeVisible();
    const steps = stepper.locator('.step');
    expect(await steps.count()).toBe(5);
    await expect(steps.nth(0).locator('.step-num')).toHaveText('1');
    await expect(steps.nth(4).locator('.step-num')).toHaveText('5');
  });

  test('active step has .active class', async ({ page }) => {
    await page.goto('/showcase');
    const active = page.locator('ui-stepper .step.active').first();
    await expect(active).toBeVisible();
    await expect(active).toContainText('Voted');
  });

  test('done steps have .done class', async ({ page }) => {
    await page.goto('/showcase');
    const done = page.locator('ui-stepper .step.done');
    expect(await done.count()).toBe(2);
  });

  test('dividers separate steps', async ({ page }) => {
    await page.goto('/showcase');
    const dividers = page.locator('ui-stepper .step-divider');
    expect(await dividers.count()).toBe(4); // n-1 dividers
  });
});