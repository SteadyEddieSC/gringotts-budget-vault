import { test, expect, openPrimary } from './helpers/app.js';

test('Review Queue uses native selects and performs a verified backup-first edit', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Activity');
  await page.getByRole('button', { name: 'Review Queue', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Review Queue' })).toBeVisible();
  await expect(page.locator('#reviewCategory')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reviewOwner')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reviewAccount')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reviewCategory')).toBeDisabled();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Enable Safe Editing' }).click()
  ]);
  expect(download.suggestedFilename()).toMatch(/pre_review_backup/i);
  await expect(page.locator('#reviewCategory')).toBeEnabled();

  await page.locator('#reviewCategory').selectOption({ label: 'Groceries' });
  await page.locator('#reviewOwner').selectOption({ label: 'Test Owner A' });
  await page.locator('#reviewAccount').selectOption({ label: 'Test Checking' });
  await page.locator('#reviewNotes').fill('Reviewed by Playwright');
  await page.getByRole('button', { name: 'Save & Mark Reviewed' }).click();

  const transaction = await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    return vault.transactions.find((row) => row.id === 'jul-review-1');
  });
  expect(transaction.category).toBe('Groceries');
  expect(transaction.reviewed).toBe(true);
  expect(transaction.notes).toBe('Reviewed by Playwright');
});

test('creates a goal, records a contribution, and saves an explicit health snapshot', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Money');
  await page.getByRole('button', { name: 'Goals & Health', exact: true }).click();

  await page.locator('#goalName').fill('Playwright Emergency Fund');
  await page.locator('#goalType').selectOption({ label: 'Emergency Fund' });
  await page.locator('#goalTarget').fill('1000');
  await page.locator('#goalCurrent').fill('100');
  await page.locator('#goalMonthly').fill('50');
  await page.getByRole('button', { name: 'Add Goal' }).click();

  await expect(page.getByRole('heading', { name: 'Playwright Emergency Fund' })).toBeVisible();
  const contribution = page.locator('[data-goal-contribution-input]').first();
  await contribution.fill('25');
  await page.locator('[data-goal-contribute]').first().click();
  await expect(page.getByText('$125.00 funded')).toBeVisible();

  await page.getByRole('button', { name: 'Save Snapshot' }).click();
  const saved = await page.evaluate(() => ({
    goals: JSON.parse(localStorage.getItem('gringottsGoals.v1')),
    health: JSON.parse(localStorage.getItem('gringottsVaultHealthHistory.v1'))
  }));
  expect(saved.goals.goals[0].current).toBe(125);
  expect(saved.health.snapshots.length).toBe(1);
  expect(saved.health.snapshots[0].month).toBe('2026-07');
});
