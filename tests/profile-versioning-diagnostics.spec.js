import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const signedFixture = path.join(root, 'tests', 'fixtures', 'bank-import', 'synthetic-signed.csv');

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.locator('#profileRevisionHistory')).toBeVisible();
  await expect(page.locator('#importDryRunCard')).toBeVisible();
}

async function inspectAndSave(page, name = 'Synthetic revision profile') {
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await expect(page.locator('#importProfileCard')).toBeVisible();
  await page.locator('[data-bank-option="dateOrder"]').selectOption('mdy');
  await page.locator('[data-bank-option="signMode"]').selectOption('bank');
  await page.locator('[data-bank-option="accountLabel"]').fill('Synthetic Card');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await page.locator('#bankImportProfileName').fill(name);
  await page.locator('#saveBankImportProfile').click();
  await expect(page.getByText(new RegExp(`Profile “${name}” is applied`, 'i'))).toBeVisible();
}

test('gates an existing profile update and records only sanitized revision metadata', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  await inspectAndSave(page);

  await page.locator('[data-bank-option="accountLabel"]').fill('Synthetic Card Updated');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await page.locator('#saveBankImportProfile').click();
  await expect(page.locator('#profileRevisionGate')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Destination account label', exact: true })).toBeVisible();
  await expect(page.getByText('[local label changed]').first()).toBeVisible();
  await page.locator('#profileRevisionAck').check();
  await page.locator('#confirmProfileRevision').click();

  const result = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    profiles: JSON.parse(localStorage.getItem('gringottsImportProfiles.v1')),
    revisions: JSON.parse(localStorage.getItem('gringottsImportProfileRevisions.v1'))
  }));
  expect(result.vault).toBe(vaultBefore);
  expect(result.profiles.profiles[0].options.accountLabel).toBe('Synthetic Card Updated');
  expect(result.revisions.revisions).toHaveLength(1);
  expect(result.revisions.revisions[0].source).toBe('local-update');
  expect(JSON.stringify(result.revisions)).not.toMatch(/Synthetic Card Updated|transactions|records|sourceFingerprint/i);
});

test('gates a portable profile replacement before writing metadata', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  await inspectAndSave(page, 'Bundle target profile');
  const bundle = await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('gringottsImportProfiles.v1')).profiles[0];
    return {
      kind: 'gringotts-import-profile-bundle', version: 1, generator: 'Synthetic v119 test',
      exportedAt: '2026-07-10T12:00:00.000Z', profileCount: 1,
      profiles: [{
        name: 'Bundle replacement profile', format: profile.format, schemaId: profile.schemaId,
        schemaLabel: profile.schemaLabel, delimiter: profile.delimiter,
        headerSignature: profile.headerSignature, headerCount: profile.headerCount,
        mapping: { ...profile.mapping, category: '' },
        options: { ...profile.options, accountLabel: 'Synthetic Bundle Card' }
      }]
    };
  });

  await page.locator('#profileBundleFile').setInputFiles({
    name: 'synthetic-profile-bundle.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle))
  });
  await expect(page.locator('#profileBundlePreview')).toBeVisible();
  await page.locator('[data-profile-bundle-action]').selectOption('replace');
  await page.locator('[data-profile-bundle-target]').selectOption({ index: 1 });
  await page.locator('#profileBundleAck').check();
  await page.locator('#commitProfileBundle').click();
  await expect(page.locator('#profileRevisionGate')).toBeVisible();
  await expect(page.getByText(/Portable definition will replace/i)).toBeVisible();
  await page.locator('#profileRevisionAck').check();
  await page.locator('#confirmProfileRevision').click();

  const result = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    revisions: JSON.parse(localStorage.getItem('gringottsImportProfileRevisions.v1')).revisions
  }));
  expect(result.vault).toBe(vaultBefore);
  expect(result.revisions[0].source).toBe('bundle-replace');
});

test('prepares and explicitly downloads a metadata-only import dry run', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await expect(page.locator('#prepareImportDryRun')).toBeEnabled();
  await page.locator('#prepareImportDryRun').click();
  await expect(page.getByText(/Prepared in memory only/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadImportDryRun').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v119_import_dry_run_.*\.json/i);
  const filePath = await download.path();
  const diagnostic = JSON.parse(await fs.readFile(filePath, 'utf8'));
  expect(diagnostic.kind).toBe('gringotts-import-dry-run-diagnostic');
  expect(diagnostic.readiness.transactionWritePerformed).toBe(false);
  const text = JSON.stringify(diagnostic);
  expect(text).not.toMatch(/synthetic-signed\.csv|Synthetic Fuel|bank-new-1|sourceFingerprint|transactions|records|accountLabel/i);
});

test('keeps revision and dry-run surfaces inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await page.locator('#prepareImportDryRun').click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('#importDryRunCard')).toBeVisible();
  await expect(page.locator('#profileRevisionHistory')).toBeVisible();
});
