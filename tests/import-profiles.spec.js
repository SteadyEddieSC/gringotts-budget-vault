import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const signedFixture = path.join(root, 'tests', 'fixtures', 'bank-import', 'synthetic-signed.csv');

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
}

async function inspectSignedCsv(page) {
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await expect(page.locator('#importProfileCard')).toBeVisible();
  await page.locator('[data-bank-option="dateOrder"]').selectOption('mdy');
  await page.locator('[data-bank-option="signMode"]').selectOption('bank');
  await page.locator('[data-bank-option="accountLabel"]').fill('Synthetic Household Card');
  await page.locator('[data-bank-option="accountLabel"]').press('Tab');
  await expect(page.locator('.field-validation')).toHaveCount(11);
  await expect(page.locator('[data-bank-option="accountLabel"]')).toHaveValue('Synthetic Household Card');
}

async function saveProfile(page, name = 'Synthetic signed CSV profile') {
  await page.locator('#bankImportProfileName').fill(name);
  await page.locator('#saveBankImportProfile').click();
  await expect(page.getByText(new RegExp(`Profile “${name}” is applied`, 'i'))).toBeVisible();
}

test('saves a metadata-only mapping profile without changing the vault', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  await inspectSignedCsv(page);
  await saveProfile(page);

  const result = await page.evaluate(() => {
    const raw = localStorage.getItem('gringottsImportProfiles.v1');
    return { raw, parsed: JSON.parse(raw), vault: localStorage.getItem('gringottsBudgetVault.latest') };
  });
  expect(result.vault).toBe(before);
  expect(result.parsed.profiles).toHaveLength(1);
  expect(result.parsed.profiles[0]).toMatchObject({
    name: 'Synthetic signed CSV profile',
    format: 'delimited',
    schemaId: 'generic-signed',
    mapping: { date: 'Date', description: 'Description', amount: 'Amount', status: 'Status', id: 'Reference', memo: 'Memo' },
    options: { dateOrder: 'mdy', signMode: 'bank', accountLabel: 'Synthetic Household Card', accountMode: 'label', useSourceCategory: false }
  });
  expect(result.parsed.profiles[0].headerSignature).toMatch(/^fnv1a-[0-9a-f]{8}$/);
  expect(result.raw).not.toMatch(/transactions|records|directTransactions|sourceFingerprint|synthetic-signed\.csv|Synthetic Fuel|bank-new-1/);
  await expect(page.locator('[data-bank-mapping="date"]').locator('xpath=..').getByText(/sampled dates validate/i)).toBeVisible();
  await expect(page.locator('[data-bank-mapping="amount"]').locator('xpath=..').getByText(/sampled values are numeric/i)).toBeVisible();
});

test('automatically applies the only exact-compatible profile after a cleared session', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for local profile persistence coverage.');
  const { page } = app;
  await openImport(page);
  await inspectSignedCsv(page);
  await saveProfile(page, 'Exact household card');

  await page.locator('#resetBankImport').click();
  await expect(page.locator('#importProfileCard')).toHaveCount(0);
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await expect(page.getByText(/Profile “Exact household card” is applied/i)).toBeVisible();
  await expect(page.locator('[data-bank-option="dateOrder"]')).toHaveValue('mdy');
  await expect(page.locator('[data-bank-option="signMode"]')).toHaveValue('bank');
  await expect(page.locator('[data-bank-option="accountLabel"]')).toHaveValue('Synthetic Household Card');
  await expect(page.locator('[data-bank-mapping="date"]').locator('xpath=..').getByText(/Remembered from “Exact household card”/i)).toBeVisible();
});

test('does not apply a profile when the ordered header signature changes', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for compatibility behavior.');
  const { page } = app;
  await openImport(page);
  await inspectSignedCsv(page);
  await saveProfile(page, 'Original header order');
  await page.locator('#resetBankImport').click();

  await page.locator('#bankImportFile').setInputFiles({
    name: 'reordered.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Description,Date,Amount,Status,Reference,Memo\nSynthetic Fuel,07/20/2026,-45.67,Posted,bank-new-1,Fictional row')
  });
  await expect(page.locator('#bankImportProfileSelect')).toHaveValue('');
  await expect(page.locator('#bankImportProfileSelect option')).toHaveCount(1);
  await expect(page.getByText(/No profile was applied because compatibility is exact-only/i)).toBeVisible();
  await expect(page.getByText(/ordered header signature changed/i)).toBeVisible();
});

test('requires an explicit choice when multiple exact-compatible profiles exist', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for profile conflict behavior.');
  const { page } = app;
  await openImport(page);
  await inspectSignedCsv(page);
  await saveProfile(page, 'First exact profile');
  await page.locator('#newBankImportProfile').click();
  await page.locator('#bankImportProfileName').fill('Second exact profile');
  await page.locator('#saveBankImportProfile').click();
  await page.locator('#resetBankImport').click();
  await page.locator('#bankImportFile').setInputFiles(signedFixture);

  await expect(page.getByText(/More than one exact-compatible profile exists/i)).toBeVisible();
  await expect(page.locator('#bankImportProfileSelect option')).toHaveCount(3);
  await expect(page.locator('[data-bank-option="dateOrder"]')).toHaveValue('auto');
  await expect(page.locator('[data-bank-option="signMode"]')).toHaveValue('');
});

test('deletes a selected profile without changing transactions', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for verified profile deletion.');
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  await inspectSignedCsv(page);
  await saveProfile(page, 'Delete this profile');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#deleteBankImportProfile').click();

  const result = await page.evaluate(() => ({
    profiles: JSON.parse(localStorage.getItem('gringottsImportProfiles.v1')).profiles,
    vault: localStorage.getItem('gringottsBudgetVault.latest')
  }));
  expect(result.profiles).toEqual([]);
  expect(result.vault).toBe(before);
});

test('keeps profile controls and validation inside the phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openImport(page);
  await page.locator('#bankImportFile').setInputFiles(signedFixture);
  await expect(page.locator('#importProfileCard')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('#saveBankImportProfile')).toBeVisible();
  await expect(page.locator('.field-validation').first()).toBeVisible();
});
