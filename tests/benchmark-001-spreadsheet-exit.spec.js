import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary, syntheticVault, waitForApp } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'tests', 'fixtures', 'benchmark-001', 'spreadsheet-exit', 'transactions.csv');

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.locator('#bankImportFile')).toBeAttached();
}

async function prepareSpreadsheetImport(page) {
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture);
  await expect(page.getByText(/Format: CSV \/ delimited text/i)).toBeVisible();
  await page.locator('[data-bank-option="signMode"]').selectOption('vault');
  await page.locator('[data-bank-option="accountLabel"]').fill('Test Checking');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await page.locator('[data-bank-option="useSourceCategory"]').check();
  await page.locator('#prepareBankDuplicateReview').click();
  await expect(page.getByText(/1 skipped automatically/i)).toBeVisible();
  await expect(page.getByText(/2 new/i).first()).toBeVisible();
}

async function commitSpreadsheetImport(page) {
  const [backup] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#prepareBankImportBackup').click()
  ]);
  expect(backup.suggestedFilename()).toMatch(/Gringotts_v115_pre_import_12_.*\.json/i);
  await page.locator('#bankImportAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();
  await expect(page.getByText(/Verified result: 2 inserted, 1 skipped, 14 destination rows/i)).toBeVisible();
  return backup;
}

async function restorePreImportBackup(page, backup) {
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  await openImport(page);
  await page.getByRole('button', { name: /Restore full vault/i }).click();
  await page.locator('#restoreFile').setInputFiles(backupPath);
  await expect(page.getByText(/Transactions:\s*12/i)).toBeVisible();
  await expect(page.locator('#restoreAck')).toBeEnabled();
  await page.locator('#restoreAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#restoreVault').click();
  await page.waitForTimeout(800);
  await expect(page.locator('.version-text')).toBeVisible();
}

test('spreadsheet-exit CSV uses guarded missing-only import and explicit backup restore rollback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for guarded spreadsheet-exit writes.');
  await page.goto('/?playwright=1');
  await page.evaluate(({ vault }) => {
    localStorage.clear();
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    localStorage.setItem('gringottsCleanMonth.v1', '2026-07');
  }, { vault: syntheticVault });
  await page.reload();
  await waitForApp(page);
  const networkWrites = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) networkWrites.push(`${request.method()} ${request.url()}`);
  });

  await prepareSpreadsheetImport(page);
  const backup = await commitSpreadsheetImport(page);

  let state = await page.evaluate(() => ({
    vault: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')),
    history: JSON.parse(localStorage.getItem('gringottsImportHistory.v1'))
  }));
  expect(state.vault.transactions).toHaveLength(14);
  expect(state.vault.transactions.some((row) => row.source_transaction_id === 'sheet-exit-new-1')).toBe(true);
  expect(state.vault.transactions.some((row) => row.source_transaction_id === 'sheet-exit-new-2')).toBe(true);
  expect(state.history.imports[0]).toMatchObject({
    insertedCount: 2,
    skippedCount: 1,
    destinationBeforeCount: 12,
    destinationAfterCount: 14,
    verificationResult: 'verified'
  });

  await restorePreImportBackup(page, backup);
  state = await page.evaluate(() => ({
    vault: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')),
    history: JSON.parse(localStorage.getItem('gringottsImportHistory.v1'))
  }));
  expect(state.vault.transactions).toHaveLength(12);
  expect(state.vault.transactions.some((row) => row.source_transaction_id === 'sheet-exit-new-1')).toBe(false);
  expect(state.vault.transactions.some((row) => row.source_transaction_id === 'sheet-exit-new-2')).toBe(false);
  expect(state.history.imports[0]).toMatchObject({ insertedCount: 2, skippedCount: 1, verificationResult: 'verified' });
  expect(networkWrites).toEqual([]);
});

test('spreadsheet-exit replay becomes a verified no-change import instead of duplicating rows', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for deterministic replay coverage.');
  const { page } = app;
  await prepareSpreadsheetImport(page);
  await commitSpreadsheetImport(page);

  await expect(page.getByText(/3 skipped automatically/i)).toBeVisible();
  await expect(page.getByText(/0 new/i).first()).toBeVisible();
  await expect(page.locator('#prepareBankImportBackup')).toBeDisabled();
  await page.locator('#bankImportAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();

  const state = await page.evaluate(() => ({
    vault: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')),
    history: JSON.parse(localStorage.getItem('gringottsImportHistory.v1'))
  }));
  expect(state.vault.transactions).toHaveLength(14);
  expect(state.history.imports[0]).toMatchObject({ insertedCount: 0, skippedCount: 3, verificationResult: 'verified-no-change' });
  expect(state.history.imports[1]).toMatchObject({ insertedCount: 2, skippedCount: 1, verificationResult: 'verified' });
});

test('spreadsheet-exit mapping and safety controls remain usable at phone width', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture);
  await page.locator('[data-bank-option="signMode"]').selectOption('vault');
  await expect(page.locator('.bank-mapping-grid')).toBeVisible();
  await expect(page.locator('.bank-source-table')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
