import { test, expect, openPrimary } from './helpers/app.js';

test('downloads the v118 33-sheet Vault Workbook and exposes the annual tracker input', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for generated-file smoke coverage.');
  const { page } = app;
  await openPrimary(page, 'Reports');
  await expect(page.locator('#annualTrackerFile')).toBeAttached();
  await expect(page.getByText(/33-sheet workbook/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#vaultXlsx').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v118_2026-07-01_to_2026-07-31_.*\.xlsx/i);
});

test('blocks an empty restore and preserves the populated vault', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: /Import & Restore/i })).toBeVisible();
  await page.getByRole('button', { name: /Restore full vault/i }).click();

  await page.locator('#restoreFile').setInputFiles({
    name: 'empty-vault.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 'empty-test', transactions: [] }))
  });

  await expect(page.locator('.error-box')).toContainText('zero transactions');
  await expect(page.locator('#restoreVault')).toBeDisabled();

  const count = await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    return vault.transactions.length;
  });
  expect(count).toBe(12);
});

test('downloads a v118 full backup from Tools instead of the header', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for download placement coverage.');
  const { page } = app;
  await expect(page.locator('#topBackup')).toHaveCount(0);
  await openPrimary(page, 'Tools');
  await page.getByRole('button', { name: 'Exports & Backup', exact: true }).click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportBackup').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v118_backup_12_/i);
});
