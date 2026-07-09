import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.join(root, 'tests', 'fixtures', 'bank-import', name);

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Bank Export Import / Restore', exact: true })).toBeVisible();
}

test('inspects and maps a signed CSV without writing the vault', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic-signed.csv'));

  await expect(page.getByText('CSV / delimited text', { exact: true })).toBeVisible();
  await expect(page.getByText(/Generic signed-amount CSV/i)).toBeVisible();
  await expect(page.getByText(/Choose how signed amounts should be interpreted/i)).toBeVisible();
  await expect(page.getByText(/Ambiguous date 07\/10\/2026/i)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Fictional fuel purchase, test only', exact: true })).toBeVisible();

  await page.locator('[data-bank-option="dateOrder"]').selectOption('mdy');
  await page.locator('[data-bank-option="signMode"]').selectOption('bank');
  await page.locator('[data-bank-option="accountLabel"]').fill('Test Credit Card');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');

  await expect(page.getByText(/3 valid/i)).toBeVisible();
  const fuelRow = page.getByRole('row', { name: /Synthetic Fuel/i }).last();
  await expect(fuelRow).toContainText('$45.67');
  await expect(fuelRow).toContainText('Expense');
  const refundRow = page.getByRole('row', { name: /Synthetic Refund/i }).last();
  await expect(refundRow).toContainText('-$12.34');
  await expect(refundRow).toContainText('Pending');

  const after = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  expect(after).toBe(before);
  await expect(page.evaluate(() => localStorage.getItem('gringottsImportHistory.v1'))).resolves.toBeNull();
});

test('reconciles duplicates, requires backup, and verifies missing-only CSV writes', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for guarded transaction writes.');
  const { page } = app;
  const networkWrites = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) networkWrites.push(`${request.method()} ${request.url()}`);
  });
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic-signed.csv'));
  await page.locator('[data-bank-option="dateOrder"]').selectOption('mdy');
  await page.locator('[data-bank-option="signMode"]').selectOption('bank');
  await page.locator('[data-bank-option="accountLabel"]').fill('Test Credit Card');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await page.locator('#prepareBankDuplicateReview').click();

  await expect(page.getByText(/1 skipped automatically/i)).toBeVisible();
  await expect(page.getByText(/2 new/i)).toBeVisible();
  await expect(page.locator('#commitBankImport')).toBeDisabled();

  const [backup] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#prepareBankImportBackup').click()
  ]);
  expect(backup.suggestedFilename()).toMatch(/Gringotts_v115_pre_import_12_.*\.json/i);

  await page.locator('#bankImportAck').check();
  await expect(page.locator('#commitBankImport')).toBeEnabled();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();
  await expect(page.getByText(/Import verified: 2 new transactions added/i)).toBeVisible();

  const result = await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const history = JSON.parse(localStorage.getItem('gringottsImportHistory.v1'));
    return {
      count: vault.transactions.length,
      fuel: vault.transactions.find((row) => row.source_transaction_id === 'bank-new-1'),
      refund: vault.transactions.find((row) => row.source_transaction_id === 'bank-new-2'),
      receipt: history.imports[0],
      receiptJson: JSON.stringify(history.imports[0])
    };
  });
  expect(result.count).toBe(14);
  expect(result.fuel).toMatchObject({ amount: 45.67, category: 'Other', account: 'Test Credit Card', reviewed: false, review_required: true });
  expect(result.refund).toMatchObject({ amount: -12.34, pending: true, type: 'Income' });
  expect(result.receipt).toMatchObject({
    format: 'delimited',
    detectedSchema: 'Generic signed-amount CSV',
    insertedCount: 2,
    skippedCount: 1,
    destinationBeforeCount: 12,
    destinationAfterCount: 14,
    verificationResult: 'verified'
  });
  expect(result.receipt.mappingSummary).toContain('date:Date');
  expect(result.receiptJson).not.toContain('transactions');
  expect(result.receiptJson).not.toContain('Synthetic Fuel');
  expect(networkWrites).toEqual([]);
});

test('parses QFX locally, masks account identifiers, and finds stable-ID duplicates', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for source-format details.');
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic.qfx'));

  await expect(page.getByText('QFX', { exact: true })).toBeVisible();
  await expect(page.getByText(/QFX STMTTRN/i)).toBeVisible();
  await expect(page.getByText(/Imported account •1234/i).first()).toBeVisible();
  await expect(page.getByText('TESTACCOUNT1234')).toHaveCount(0);
  const rebate = page.getByRole('row', { name: /Synthetic Rebate/i }).last();
  await expect(rebate).toContainText('-$25.00');

  await page.locator('#prepareBankDuplicateReview').click();
  await expect(page.getByText(/1 skipped automatically/i)).toBeVisible();
  await expect(page.getByText(/2 new/i)).toBeVisible();
  await expect(page.getByText(/matching stable transaction ID/i)).toBeVisible();
});

test('normalizes separate debit and credit columns and only uses source category explicitly', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for mapping option coverage.');
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic-debit-credit.csv'));
  await expect(page.locator('[data-bank-option="signMode"]')).toBeDisabled();
  await page.locator('[data-bank-option="accountMode"]').selectOption('mapped-masked');
  await page.locator('[data-bank-option="useSourceCategory"]').check();

  const hardware = page.getByRole('row', { name: /Synthetic Hardware/i }).last();
  await expect(hardware).toContainText('$75.25');
  await expect(hardware).toContainText('Household');
  await expect(hardware).toContainText('Imported account •1234');
  const payroll = page.getByRole('row', { name: /Synthetic Payroll/i }).last();
  await expect(payroll).toContainText('-$2,500.00');
  await expect(payroll).toContainText('Income');
});

test('blocks unsupported files, oversized inputs, and preserves full restore safeguards', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles({
    name: 'statement.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF synthetic test only')
  });
  await expect(page.locator('.error-box').first()).toContainText(/not a supported transaction-export format/i);

  await page.locator('#bankImportFile').setInputFiles({
    name: 'oversized.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 65)
  });
  await expect(page.locator('.error-box').first()).toContainText(/5 MB local safety limit/i);

  await page.locator('#restoreFile').setInputFiles({
    name: 'empty-vault.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 'empty-test', transactions: [] }))
  });
  await expect(page.locator('.error-box').last()).toContainText(/zero transactions/i);
  await expect(page.locator('#restoreVault')).toBeDisabled();
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length);
  expect(count).toBe(12);
});

test('keeps bank mapping and preview surfaces inside every configured viewport', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic-signed.csv'));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('.bank-mapping-grid')).toBeVisible();
  await expect(page.locator('.bank-source-table')).toBeVisible();
});
