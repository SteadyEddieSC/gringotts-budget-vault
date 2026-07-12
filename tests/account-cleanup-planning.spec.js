import fs from 'node:fs/promises';
import { test, expect, openPrimary } from './helpers/app.js';

async function seedAccountCleanup(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions = vault.transactions.filter((transaction) => !String(transaction.id || '').startsWith('cleanup-checking-'));
    vault.transactions.push(
      { id: 'cleanup-checking-old-1', date: '2026-01-05', name: 'Synthetic Home Expense', amount: 45, type: 'Expense', category: 'Household', account: 'Fictional Family Checking 1234', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'cleanup-checking-old-2', date: '2026-02-05', name: 'Synthetic Home Expense', amount: 55, type: 'Expense', category: 'Household', account: 'Fictional Family Checking 1234', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'cleanup-checking-new-1', date: '2026-03-05', name: 'Synthetic Home Expense', amount: 65, type: 'Expense', category: 'Household', account: 'Fictional Family Chking ••••1234', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'cleanup-checking-new-2', date: '2026-04-05', name: 'Synthetic Home Expense', amount: 75, type: 'Expense', category: 'Household', account: 'Fictional Family Chking ••••1234', owner: 'Test Owner A', reviewed: true, pending: false }
    );
    vault.budgets = { householdAccount: 'Fictional Family Checking 1234' };
    vault.goals = [{ name: 'Synthetic reserve', fundingAccount: 'Fictional Family Checking 1234' }];
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    localStorage.setItem('gringottsRulesIII.preview.v1', JSON.stringify({ rules: [{ id: 'cleanup-rule', scope: 'account', find: 'Fictional Family Checking 1234', to: 'Household', on: true }] }));
    localStorage.setItem('gringottsGuidedPlan.v1', JSON.stringify({ items: [{ id: 'cleanup-plan-item', account: 'Fictional Family Chking ••••1234', status: 'open' }] }));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

async function openCleanup(page) {
  await seedAccountCleanup(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
}

test('inventories masked accounts and surfaces an explainable cleanup candidate', async ({ app }) => {
  const { page } = app;
  await openCleanup(page);
  await expect(page.locator('.account-inventory-table tbody tr')).toHaveCount(4);
  await expect(page.getByRole('cell', { name: 'Fictional Family Checking ••••1234', exact: true })).toBeVisible();
  await expect(page.locator('#accountCleanupCandidate')).toBeVisible();
  await expect(page.getByText(/Why this pair was surfaced/i)).toBeVisible();
  await expect(page.getByText(/Planning only: v122 cannot automatically rename accounts/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Apply|Merge now|Rename now/i })).toHaveCount(0);
});

test('saves only a bounded cleanup decision and leaves the vault unchanged', async ({ app }) => {
  const { page } = app;
  await openCleanup(page);
  const beforeVault = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await page.locator('#accountCleanupDecision').selectOption('investigate');
  await page.locator('#saveAccountCleanupDecision').click();
  const result = await page.evaluate(() => ({ vault: localStorage.getItem('gringottsBudgetVault.latest'), plan: JSON.parse(localStorage.getItem('gringottsAccountCleanupPlan.v1') || '{}') }));
  expect(result.vault).toBe(beforeVault);
  expect(result.plan.decisions[0].decision).toBe('investigate');
  expect(JSON.stringify(result.plan)).not.toMatch(/Fictional Family|transactions|merchant|balance|account_id/i);
});

test('downloads a sanitized cleanup plan and a separate populated backup', async ({ app }) => {
  const { page } = app;
  await openCleanup(page);
  await page.locator('#accountCleanupDecision').selectOption('keep-separate');
  await page.locator('#saveAccountCleanupDecision').click();
  const [planDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadAccountCleanupPlan').click()]);
  expect(planDownload.suggestedFilename()).toMatch(/Gringotts_v122_account_cleanup_plan_.*\.json/i);
  const payload = JSON.parse(await fs.readFile(await planDownload.path(), 'utf8'));
  expect(payload.summary.automaticMergeAvailable).toBe(false);
  expect(payload.dataBoundary.transactionRowsIncluded).toBe(false);
  expect(JSON.stringify(payload)).not.toContain('Fictional Family Checking 1234');
  const [backupDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadAccountCleanupBackup').click()]);
  expect(backupDownload.suggestedFilename()).toMatch(/Gringotts_v122_pre_cleanup_backup_\d+_.*\.json/i);
});

test('retains account cleanup visibility in the v124 41-sheet workbook and roadmap', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for roadmap and workbook release coverage.');
  const { page } = app;
  await openPrimary(page, 'Reports');
  await expect(page.getByText(/41-sheet Vault Workbook/i)).toBeVisible();
  for (const sheet of ['Account Inventory', 'Account Cleanup Plan', 'Recurring Decisions', 'Scenario Comparisons', 'Scenario Assumptions']) {
    await expect(page.getByText(sheet, { exact: true }).last()).toBeVisible();
  }
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#vaultXlsx').click()]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v124_.*\.xlsx/i);
  await openPrimary(page, 'Tools');
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();
});

test('keeps account planning and roadmap inside a narrow phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openCleanup(page);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
