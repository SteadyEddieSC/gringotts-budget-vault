import { test, expect, openPrimary } from './helpers/app.js';

async function visibleCount(locator) {
  let count = 0;
  for (let index = 0; index < await locator.count(); index += 1) {
    if (await locator.nth(index).isVisible()) count += 1;
  }
  return count;
}

test('preserves six primary destinations and browser-local vault state', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v117/i);
  const labels = await page.locator('[data-tab]').allTextContents();
  expect(labels.map((value) => value.trim())).toEqual(['Dashboard', 'Money', 'Calendar', 'Reports', 'Activity', 'Tools']);
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  for (const destination of labels) await openPrimary(page, destination.trim());
  const after = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  expect(after).toBe(before);
});

test('shows one report preview page on screen while preserving all eight print pages', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Reports');
  const select = page.locator('#reportPreviewPage');
  await expect(select).toBeVisible();
  await expect(select.locator('option')).toHaveCount(8);
  await expect(page.locator('#reportPreviewStatus')).toContainText('Page 1 of 8');
  expect(await visibleCount(page.locator('.report-preview-deck > .report-page'))).toBe(1);
  await expect(page.getByRole('heading', { name: 'Family Financial Report', exact: true })).toBeVisible();

  await select.selectOption('comparison');
  await expect(page.getByRole('heading', { name: 'Year-over-year comparison', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Family Financial Report', exact: true })).toBeHidden();
  await page.locator('[data-report-preview-next]').click();
  await expect(page.getByRole('heading', { name: 'Spending by category', exact: true })).toBeVisible();
  await page.locator('[data-report-preview-previous]').click();
  await expect(page.getByRole('heading', { name: 'Year-over-year comparison', exact: true })).toBeVisible();

  await page.emulateMedia({ media: 'print' });
  expect(await visibleCount(page.locator('.report-preview-deck > .report-page'))).toBe(8);
});

test('separates incremental import from full vault restore without changing data', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page, 'Tools');

  const bankButton = page.getByRole('button', { name: /Import transactions/i });
  const restoreButton = page.getByRole('button', { name: /Restore full vault/i });
  await expect(bankButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-import-task-panel="bank"]')).toBeVisible();
  await expect(page.locator('[data-import-task-panel="restore"]')).toBeHidden();
  await expect(page.locator('.bank-import-progress li')).toHaveCount(3);

  await restoreButton.click();
  await expect(restoreButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-import-task-panel="bank"]')).toBeHidden();
  await expect(page.locator('[data-import-task-panel="restore"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();
  await expect(page.locator('#restoreFile')).toBeAttached();

  await bankButton.click();
  await expect(page.locator('[data-import-task-panel="bank"]')).toBeVisible();
  const after = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  expect(after).toBe(before);
});

test('keeps phone secondary navigation compact and prevents page overflow', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Activity');
  const subnav = page.locator('.activity-subnav');
  await expect(subnav).toBeVisible();
  expect(await subnav.evaluate((element) => getComputedStyle(element).overflowX)).toMatch(/auto|scroll/);
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guided Household Plan', exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
