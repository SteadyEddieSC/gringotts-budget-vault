import fs from 'node:fs/promises';
import { test, expect, openPrimary } from './helpers/app.js';

async function seedReceipts(page) {
  await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const after = vault.transactions.length;
    const receipts = [
      { importId: 'import_v121_verified', timestamp: '2026-07-10T12:00:00.000Z', sourceFilename: 'SECRET-household-card.csv', sourceFingerprint: 'SECRET-FINGERPRINT-123456789', source: 'Synthetic card activity', format: 'delimited', detectedSchema: 'Card activity export', schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount', signMode: 'bank', dateOrder: 'mdy', warningCount: 1, transactionCount: 6, earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 2, fuzzyCandidates: 1, insertedCount: 2, skippedCount: 4, selectedDestinationVault: 'gringottsBudgetVault.latest', destinationBeforeCount: after - 2, destinationAfterCount: after, verificationResult: 'verified' },
      { importId: 'import_v121_no_change', timestamp: '2026-07-10T13:00:00.000Z', sourceFilename: 'SECRET-no-change.csv', sourceFingerprint: 'SECRET-NO-CHANGE-FINGERPRINT', source: 'Synthetic deposit ledger', format: 'delimited', detectedSchema: 'Deposit and withdrawal ledger', schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; debit:Withdrawal; credit:Deposit', signMode: 'separate', dateOrder: 'mdy', warningCount: 0, transactionCount: 4, earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 4, fuzzyCandidates: 0, insertedCount: 0, skippedCount: 4, selectedDestinationVault: 'gringottsBudgetVault.latest', destinationBeforeCount: after, destinationAfterCount: after, verificationResult: 'verified-no-change' }
    ];
    localStorage.setItem('gringottsImportHistory.v1', JSON.stringify({ imports: receipts, updatedAt: '2026-07-10T13:00:00.000Z' }));
  });
}

async function openImportWithReceipts(page) {
  await seedReceipts(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
}

test('preserves receipt arithmetic and manual rollback guidance without changing the vault', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImportWithReceipts(page);
  await expect(page.locator('.receipt-timeline-table tbody tr')).toHaveCount(2);
  await page.locator('[data-v121-batch-select]').last().click();
  await expect(page.locator('#receiptTimelineDetail')).toBeVisible();
  await expect(page.locator('.receipt-lineage-rollback .summary-box')).toContainText('Gringotts_v115_pre_import_');
  await expect(page.getByText(/No automatic rollback/i)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'))).toBe(vaultBefore);
});

test('downloads a sanitized selected batch and opens only the separate restore task', async ({ app }) => {
  const { page } = app;
  await openImportWithReceipts(page);
  await page.locator('[data-v121-batch-select]').last().click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#downloadSelectedReceiptBatch').click()]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v121_import_batch_.*\.json/i);
  const payload = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(payload.kind).toBe('gringotts-import-receipt-timeline');
  expect(payload.batches).toHaveLength(1);
  expect(payload.dataBoundary.transactionRowsIncluded).toBe(false);
  expect(JSON.stringify(payload)).not.toMatch(/SECRET-household-card|SECRET-FINGERPRINT|SECRET MERCHANT|"transactions"\s*:|"records"\s*:|"rows"\s*:/i);
  await page.locator('#openReceiptTimelineRestore').click();
  await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();
});

test('shows the detailed v124 through v130 roadmap horizon', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delivered capabilities', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Planned capabilities', exact: true })).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Depends on', exact: true })).toHaveCount(7);
  await expect(page.getByRole('heading', { name: 'Safety boundaries', exact: true })).toHaveCount(7);
  await expect(page.getByText(/v125 is the strongest next commitment/i)).toBeVisible();
});

test('keeps timeline and roadmap notes inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openImportWithReceipts(page);
  await page.locator('[data-v121-batch-select]').first().click();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.getByRole('button', { name: 'Roadmap', exact: true }).click();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
