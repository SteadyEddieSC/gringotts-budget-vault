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
  await expect(page.locator('.version-text')).toContainText(/^v124/);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Gringotts could not start/i })).toHaveCount(0);
}

export async function openPrimary(page, name) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const button = page.getByRole('button', { name, exact: true });
    if (!(await button.isVisible())) {
      await page.getByRole('button', { name: /Menu/i }).click();
      await expect(button).toBeVisible({ timeout: 2500 });
    }
    try {
      await button.click({ timeout: 3000 });
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'page', { timeout: 12000 });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function enableActionRoleCompatibility(page) {
  const nativeGetByRole = page.getByRole.bind(page);
  page.getByRole = (role, options = {}) => {
    const locator = nativeGetByRole(role, options);
    if (role !== 'button') return locator;
    return locator.or(nativeGetByRole('tab', options));
  };
}

export const test = base.extend({
  app: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    enableActionRoleCompatibility(page);
    await seedVault(page);
    await page.goto('/?playwright=1');
    await waitForApp(page);
    await use({ page, errors });
    expect(errors, 'Browser console and page errors').toEqual([]);
  }
});

export { expect };
