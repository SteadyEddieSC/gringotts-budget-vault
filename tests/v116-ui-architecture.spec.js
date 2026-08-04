import { test, expect, openPrimary } from './helpers/app.js';

async function visibleCount(locator) {
  let count = 0;
  for (let index = 0; index < await locator.count(); index += 1) if (await locator.nth(index).isVisible()) count += 1;
  return count;
}

test('preserves six primary destinations and browser-local vault state', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v130/i);
  const labels = await page.locator('[data-tab]').allTextContents();
  expect(labels.map((value) => value.trim())).toEqual(['Dashboard', 'Money', 'Calendar', 'Reports', 'Activity', 'Tools']);
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  for (const destination of labels) await openPrimary(page, destination.trim());
  expect(await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'))).toBe(before);
  const state = await page.evaluate(() => ({
    ux: window.GringottsV127.snapshot(),
    foundation: window.GringottsV128.snapshot(),
    evidence: window.GringottsV129.snapshot(),
    hardening: window.GringottsV130.snapshot()
  }));
  expect(state.ux.primaryDestinations).toBe(6);
  expect(state.ux.storageWritesAdded).toBe(false);
  expect(state.foundation.primaryDestinations).toBe(6);
  expect(state.foundation.storageWritesAdded).toBe(false);
  expect(state.foundation.networkImplementationAdded).toBe(false);
  expect(state.evidence.primaryDestinations).toBe(6);
  expect(state.evidence.persistentStoreAdded).toBe(false);
  expect(state.evidence.networkImplementationAdded).toBe(false);
  expect(state.evidence.dispatcherOwned).toBe(true);
  expect(state.hardening.primaryDestinations).toBe(6);
  expect(state.hardening.persistentStoreAdded).toBe(false);
  expect(state.hardening.networkImplementationAdded).toBe(false);
});

test('shows one report preview at a time while preserving the eight inherited print pages', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Reports');
  const select = page.locator('#reportPreviewPage');
  await expect(select.locator('option')).toHaveCount(9);
  expect(await visibleCount(page.locator('.report-preview-deck > .report-page'))).toBe(1);
  await select.selectOption('comparison');
  await expect(page.getByRole('heading', { name: 'Year-over-year comparison', exact: true })).toBeVisible();
  await select.selectOption('close-trends');
  await expect(page.locator('.v125-close-trend-report:not([hidden])')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  expect(await visibleCount(page.locator('.report-preview-deck > .report-page'))).toBe(8);
});

test('keeps trends, scenarios, and recurring decisions separate from cleanup, import, and restore', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name: 'Recurring cost decisions', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household scenario comparison', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Close history & trend explainability', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Apply Scenario|Change Forecast|Apply Trend/i })).toHaveCount(0);

  await openPrimary(page, 'Tools');
  const bankButton = page.getByRole('button', { name: /Import transactions/i });
  const restoreButton = page.getByRole('button', { name: /Restore full vault/i });
  await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
  await restoreButton.click();
  await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();
  await bankButton.click();
  expect(await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'))).toBe(before);
});

test('keeps phone secondary navigation and planning surfaces compact', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Money');
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await openPrimary(page, 'Activity');
  const subnav = page.locator('.activity-subnav');
  expect(await subnav.evaluate((element) => getComputedStyle(element).overflowX)).toMatch(/auto|scroll/);
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scenario discussion', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Close trend conversation', exact: true })).toBeVisible();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
