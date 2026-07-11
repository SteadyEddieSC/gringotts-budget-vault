import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => path.join(root, 'tests', 'fixtures', 'bank-import', name);

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
}

async function seedTimeline(page) {
  await page.evaluate(() => {
    const receipts = [
      {
        importId: 'batch-receipt-3', timestamp: '2026-07-03T12:00:00.000Z',
        sourceFilename: 'SECRET-third.csv', sourceFingerprint: 'SECRET-repeat-fingerprint',
        source: 'Synthetic ledger', format: 'delimited', detectedSchema: 'Synthetic ledger',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 0, transactionCount: 4,
        earliestDate: '2026-07-01', latestDate: '2026-07-31', exactDuplicates: 4, fuzzyCandidates: 0,
        insertedCount: 0, skippedCount: 4, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: 18, destinationAfterCount: 18, verificationResult: 'verified-no-change'
      },
      {
        importId: 'batch-receipt-2', timestamp: '2026-07-02T12:00:00.000Z',
        sourceFilename: 'SECRET-second.csv', sourceFingerprint: 'SECRET-repeat-fingerprint',
        source: 'Synthetic card activity', format: 'delimited', detectedSchema: 'Card activity export',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 1, transactionCount: 4,
        earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 1, fuzzyCandidates: 1,
        insertedCount: 2, skippedCount: 2, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: 16, destinationAfterCount: 18, verificationResult: 'verified'
      },
      {
        importId: 'batch-receipt-1', timestamp: '2026-07-01T12:00:00.000Z',
        sourceFilename: 'SECRET-first.csv', sourceFingerprint: 'SECRET-first-fingerprint',
        source: 'Synthetic signed ledger', format: 'delimited', detectedSchema: 'Generic signed-amount CSV',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 0, transactionCount: 6,
        earliestDate: '2026-05-01', latestDate: '2026-05-31', exactDuplicates: 2, fuzzyCandidates: 0,
        insertedCount: 4, skippedCount: 2, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: 12, destinationAfterCount: 16, verificationResult: 'verified'
      }
    ];
    localStorage.setItem('gringottsImportHistory.v1', JSON.stringify({ imports: receipts, updatedAt: '2026-07-03T12:00:01.000Z' }));
    localStorage.setItem('gringottsImportBatchIndex.v1', JSON.stringify({
      version: 1,
      updatedAt: '2026-07-02T12:00:01.000Z',
      links: [{
        linkId: 'batch-link-2', receiptImportId: 'batch-receipt-2',
        linkedAt: '2026-07-02T12:00:01.000Z', dryRunSignature: 'fnv1a-1234abcd',
        dryRunCreatedAt: '2026-07-02T11:55:00.000Z', sourceFormat: 'delimited',
        schemaId: 'card-activity', schemaLabel: 'Card activity export', normalizedRowCount: 4,
        wouldInsert: 2, wouldSkip: 2, validationErrorCount: 0, validationWarningCount: 1,
        transactionWriteReady: true, verifiedCounts: true,
        dataBoundary: {
          transactionRowsIncluded: false, sourceFileNameIncluded: false,
          sourceFingerprintIncluded: false, destinationStorageKeyIncluded: false,
          accountIdentifiersIncluded: false, merchantNamesIncluded: false,
          vaultContentsIncluded: false
        }
      }]
    }));
  });
}

test('links an explicit current dry run to the verified receipt without changing writer safeguards', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for guarded write and metadata linkage.');
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(fixture('synthetic-signed.csv'));
  await page.locator('[data-bank-option="dateOrder"]').selectOption('mdy');
  await page.locator('[data-bank-option="signMode"]').selectOption('bank');
  await page.locator('[data-bank-option="accountLabel"]').fill('Test Credit Card');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await page.locator('#prepareBankDuplicateReview').click();

  const [backup] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#prepareBankImportBackup').click()
  ]);
  expect(backup.suggestedFilename()).toMatch(/Gringotts_v115_pre_import_12_.*\.json/i);
  await page.locator('#bankImportAck').check();
  await expect(page.locator('#commitBankImport')).toBeEnabled();

  await page.locator('#prepareImportDryRun').click();
  await expect(page.getByText(/Prepared in memory only/i)).toBeVisible();
  await expect(page.locator('#commitBankImport')).toBeEnabled();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();
  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('gringottsImportBatchIndex.v1') || '{"links":[]}');
    return value.links?.length || 0;
  })).toBe(1);

  const result = await page.evaluate(() => ({
    vaultCount: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    index: JSON.parse(localStorage.getItem('gringottsImportBatchIndex.v1')),
    receipt: JSON.parse(localStorage.getItem('gringottsImportHistory.v1')).imports[0]
  }));
  expect(result.vaultCount).toBe(14);
  expect(result.receipt).toMatchObject({
    transactionCount: 3,
    insertedCount: 2,
    skippedCount: 1,
    destinationBeforeCount: 12,
    destinationAfterCount: 14,
    verificationResult: 'verified'
  });
  expect(result.index.links[0]).toMatchObject({
    receiptImportId: result.receipt.importId,
    normalizedRowCount: 3,
    wouldInsert: 2,
    wouldSkip: 1,
    transactionWriteReady: true,
    verifiedCounts: true
  });
  const indexText = JSON.stringify(result.index);
  expect(indexText).not.toMatch(/synthetic-signed|Test Credit Card|Fictional fuel/i);
  expect(indexText).not.toMatch(/"sourceFilename"\s*:|"sourceFingerprint"\s*:|"selectedDestinationVault"\s*:|"transactions"\s*:|"records"\s*:|"rows"\s*:/i);

  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
  await expect(page.locator('.receipt-timeline-table').getByText('Linked · ready', { exact: true })).toBeVisible();
  await expect(page.getByText(/A metadata-only dry run reconciles to this receipt/i)).toBeVisible();
});

test('filters retained batches and explains continuity and repeated source use', async ({ app }) => {
  const { page } = app;
  await seedTimeline(page);
  await openImport(page);

  await expect(page.locator('.receipt-timeline-table tbody tr')).toHaveCount(3);
  await expect(page.getByText(/Showing 3 of 3 retained batches/i)).toBeVisible();
  await page.locator('[data-v121-filter="result"]').selectOption('no-change');
  await expect(page.locator('.receipt-timeline-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.receipt-timeline-table').getByRole('cell', { name: /No change 0 inserted · 4 skipped/i })).toBeVisible();

  await page.locator('#clearReceiptTimelineFilters').click();
  await page.locator('[data-v121-filter="dryRun"]').selectOption('linked');
  await expect(page.locator('.receipt-timeline-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.receipt-timeline-table').getByText('Linked · ready', { exact: true })).toBeVisible();

  await page.locator('#clearReceiptTimelineFilters').click();
  await page.locator('[data-v121-filter-query]').fill('SECRET-third.csv');
  await expect(page.locator('.receipt-timeline-table tbody tr')).toHaveCount(1);
  await page.locator('[data-v121-batch-select]').click();
  await expect(page.getByText(/Repeated local source detected: Yes/i)).toBeVisible();
  await expect(page.getByText(/same local source fingerprint appears/i)).toBeVisible();
});

test('downloads sanitized full and selected timeline packages', async ({ app }) => {
  const { page } = app;
  await seedTimeline(page);
  await openImport(page);

  const [fullDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadReceiptTimeline').click()
  ]);
  expect(fullDownload.suggestedFilename()).toMatch(/Gringotts_v121_import_receipt_timeline_.*\.json/i);
  const fullPayload = JSON.parse(await fs.readFile(await fullDownload.path(), 'utf8'));
  expect(fullPayload.kind).toBe('gringotts-import-receipt-timeline');
  expect(fullPayload.batches).toHaveLength(3);

  await page.locator('[data-v121-batch-select]').first().click();
  const [selectedDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadSelectedReceiptBatch').click()
  ]);
  expect(selectedDownload.suggestedFilename()).toMatch(/Gringotts_v121_import_batch_.*\.json/i);
  const selectedPayload = JSON.parse(await fs.readFile(await selectedDownload.path(), 'utf8'));
  expect(selectedPayload.batches).toHaveLength(1);
  for (const payload of [fullPayload, selectedPayload]) {
    expect(payload.dataBoundary).toMatchObject({
      transactionRowsIncluded: false,
      sourceFileNameIncluded: false,
      sourceFingerprintIncluded: false,
      destinationStorageKeyIncluded: false,
      accountIdentifiersIncluded: false,
      merchantNamesIncluded: false,
      vaultContentsIncluded: false
    });
    expect(JSON.stringify(payload)).not.toMatch(/SECRET-first|SECRET-second|SECRET-third|SECRET-repeat|SECRET MERCHANT|gringottsBudgetVault\.latest|"transactions"\s*:|"records"\s*:|"rows"\s*:/i);
  }
});

test('shows the detailed v122 through v128 roadmap horizon while retaining v121 lineage', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v122 — Account Cleanup/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v128 — Household Data Quality/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delivered capabilities', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Planned capabilities', exact: true })).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Depends on', exact: true })).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Safety boundaries', exact: true })).toHaveCount(7);
});

test('downloads the v122 37-sheet workbook with retained receipt lineage sheets', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for workbook smoke coverage.');
  const { page } = app;
  await seedTimeline(page);
  await openPrimary(page, 'Reports');
  await expect(page.getByText(/37-sheet Vault Workbook/i)).toBeVisible();
  await expect(page.getByText('Receipt Integrity', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Batch Lineage', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Account Inventory', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Account Cleanup Plan', { exact: true }).last()).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#vaultXlsx').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v122_.*\.xlsx/i);
});

test('keeps timeline filters, details, account planning, and roadmap inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await seedTimeline(page);
  await openImport(page);
  await page.locator('[data-v121-batch-select]').first().click();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
