import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, openPrimary, waitForApp } from './helpers/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const restoreFixture = path.join(root, 'tests', 'fixtures', 'benchmark-001', 'generated', 'gringotts-vault-restore.json');

test('restores the synthetic benchmark vault into an empty isolated browser profile', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/?benchmark-001=first-restore');
  await waitForApp(page);
  await openPrimary(page, 'Tools');

  await page.getByRole('button', { name: /Restore full vault/i }).click();
  await page.locator('#restoreFile').setInputFiles(restoreFixture);
  await expect(page.getByText(/Transactions: 183/i)).toBeVisible();
  await expect(page.getByText(/Current best vault: none/i)).toBeVisible();
  await expect(page.getByText(/understand it will replace the destination vault/i)).toBeVisible();
  await expect(page.locator('#restoreAck')).toBeEnabled();
  await page.locator('#restoreAck').check();
  await expect(page.locator('#restoreVault')).toBeEnabled();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#restoreVault').click();
  await expect.poll(() => page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest') || 'null');
    return { count: vault?.transactions?.length || 0, storageKey: vault?.storageKey || null };
  })).toEqual({ count: 183, storageKey: 'gringottsBudgetVault.latest' });
  await page.screenshot({ path: test.info().outputPath('first-restore.png'), fullPage: true });
});
