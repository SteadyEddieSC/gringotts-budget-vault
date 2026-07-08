import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test as base } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'synthetic-vault.json');
export const syntheticVault = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

export async function seedVault(page, month = '2026-07') {
  await page.addInitScript(({ vault, selectedMonth }) => {
    localStorage.clear();
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    localStorage.setItem('gringottsCleanMonth.v1', selectedMonth);
  }, { vault: syntheticVault, selectedMonth: month });
}

export async function waitForApp(page) {
  await expect(page.locator('.version-text')).toContainText(/^v110/);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Gringotts could not start/i })).toHaveCount(0);
}

export async function openPrimary(page, name) {
  const button = page.getByRole('button', { name, exact: true });
  if (!(await button.isVisible())) {
    await page.getByRole('button', { name: /Menu/i }).click();
    await expect(button).toBeVisible();
  }
  await button.click();
}

export const test = base.extend({
  app: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    await seedVault(page);
    await page.goto('/?playwright=1');
    await waitForApp(page);
    await use({ page, errors });
    expect(errors, 'Browser console and page errors').toEqual([]);
  }
});

export { expect };
