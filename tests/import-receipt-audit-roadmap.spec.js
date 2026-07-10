import fs from 'node:fs/promises';
import { test, expect, openPrimary, waitForApp } from './helpers/app.js';

async function seedReceipts(page) {
  await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const after = vault.transactions.length;
    const receipts = [
      {
        importId: 'import_v120_verified', timestamp: '2026-07-10T12:00:00.000Z',
        sourceFilename: 'SECRET-household-card.csv', sourceFingerprint: 'SECRET-FINGERPRINT-123456789',
        source: 'Synthetic card activity', format: 'delimited', detectedSchema: 'Card activity export',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 1, transactionCount: 6,
        earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 2, fuzzyCandidates: 1,
        insertedCount: 2, skippedCount: 4, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: after - 2, destinationAfterCount: after, verificationResult: 'verified'
      },
      {
        importId: 'import_v120_no_change', timestamp: '2026-07-10T13:00:00.000Z',
        sourceFilename: 'SECRET-no-change.csv', sourceFingerprint: 'SECRET-NO-CHANGE-FINGERPRINT',
        source: 'Synthetic deposit ledger', format: 'delimited', detectedSchema: 'Deposit and withdrawal ledger',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; debit:Withdrawal; credit:Deposit',
        signMode: 'separate', dateOrder: 'mdy', warningCount: 0, transactionCount: 4,
        earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 4, fuzzyCandidates: 0,
        insertedCount: 0, skippedCount: 4, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: after, destinationAfterCount: after, verificationResult: 'verified-no-change'
      }
    ];
    localStorage.setItem('gringottsImportHistory.v1', JSON.stringify({ imports: receipts, updatedAt: '2026-07-10T13:00:00.000Z' }));
  });
}

async function openImportWithReceipts(page) {
  await seedReceipts(page);
  await page.reload();
  await waitForApp(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import receipt audit', exact: true })).toBeVisible();
}

test('audits retained receipts without changing the vault', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImportWithReceipts(page);

  await expect(page.locator('.receipt-audit-table tbody tr')).toHaveCount(2);
  await expect(page.getByText('Verified', { exact: true }).first()).toBeVisible();
  await page.locator('[data-receipt-audit-select="import_v120_verified"]').click();
  await expect(page.locator('#importReceiptAuditDetail')).toBeVisible();
  await expect(page.getByText(/Gringotts_v115_pre_import_/i)).toBeVisible();
  await expect(page.getByText(/No automatic rollback/i)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Destination count arithmetic', exact: true })).toBeVisible();

  const vaultAfter = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  expect(vaultAfter).toBe(vaultBefore);
});

test('downloads a sanitized receipt audit and opens only the separate restore task', async ({ app }) => {
  const { page } = app;
  await openImportWithReceipts(page);
  await page.locator('[data-receipt-audit-select="import_v120_verified"]').click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadReceiptAudit').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v120_import_receipt_audit_.*\.json/i);
  const payload = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(payload.kind).toBe('gringotts-import-receipt-audit');
  expect(payload.rollback).toMatchObject({
    automaticRollbackAvailable: false,
    destructiveActionPerformed: false,
    restoreDestination: 'gringottsBudgetVault.latest'
  });
  expect(payload.dataBoundary).toMatchObject({
    transactionRowsIncluded: false,
    sourceFileNameIncluded: false,
    sourceFingerprintIncluded: false,
    destinationStorageKeyIncluded: false,
    accountIdentifiersIncluded: false,
    merchantNamesIncluded: false,
    vaultContentsIncluded: false
  });
  const text = JSON.stringify(payload);
  expect(text).not.toMatch(/SECRET-household-card|SECRET-FINGERPRINT|SECRET MERCHANT|"transactions"\s*:|"records"\s*:|"rows"\s*:/i);

  await page.locator('#openReceiptRestore').click();
  await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();
  await expect(page.locator('#restoreVault')).toBeDisabled();
});

test('shows a detailed seven-release roadmap horizon', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Roadmap', exact: true })).toBeVisible();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v120 — Import Receipt Audit/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v126 — Data Portability/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Planned capabilities', exact: true })).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Depends on', exact: true })).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Safety boundaries', exact: true })).toHaveCount(7);
  await expect(page.getByText(/Later releases are a planning horizon/i)).toBeVisible();
});

test('keeps receipt audit and roadmap notes inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openImportWithReceipts(page);
  await page.locator('[data-receipt-audit-select="import_v120_verified"]').click();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);

  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
