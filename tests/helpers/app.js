import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test as base } from '@playwright/test';
import {
  currentRelease,
  currentReleaseName,
  currentVersion
} from './release.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'synthetic-vault.json');
export const syntheticVault = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

const primaryHeadings = {
  Dashboard: /Vault Dashboard/i,
  Money: /Bills, Recurring & Budgets/i,
  Calendar: /Calendar & Cash Flow/i,
  Reports: /^Reports$/i,
  Activity: /Ledger/i,
  Tools: /Import & Restore/i
};

const enhancedPrimaryDestinations = new Set(['Money', 'Reports', 'Activity', 'Tools']);

export async function seedVault(page, month = '2026-07') {
  await page.addInitScript(({ vault, selectedMonth }) => {
    localStorage.clear();
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    localStorage.setItem('gringottsCleanMonth.v1', selectedMonth);
  }, { vault: syntheticVault, selectedMonth: month });
}

export async function waitForApp(page) {
  await expect(page.locator('.version-text')).toHaveText(currentVersion);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Gringotts could not start/i })).toHaveCount(0);
  await expect.poll(
    () => page.evaluate(({ version, name }) => (
      window.GringottsV126?.coordinator?.status === 'ready'
      && window.GringottsV127?.release === 'v127'
      && window.GringottsV128?.release === 'v128'
      && window.GringottsV129?.release === 'v129'
      && window.GringottsV130?.release === 'v130'
      && window.GringottsV131?.release === 'v131'
      && window.GringottsV132?.release === version
      && window.GringottsV132?.name === name
    ), { version:currentVersion, name:currentReleaseName }),
    {
      timeout:15000,
      message:`${currentVersion} ${currentReleaseName}, retained v131 decision gate, v130 runtime evidence, v129 workflow review, v128 foundation, v127 UX policy, and v126 route readiness should finish before tests continue`
    }
  ).toBe(true);
  await expect.poll(
    () => page.evaluate(() => window.GringottsV132?.snapshot?.()?.manifestVersion),
    { timeout:5000, message:'the active runtime should publish the authoritative release manifest version' }
  ).toBe(currentRelease.version);
}

async function waitForRouteEnhancements(page, expectedRoute) {
  await expect.poll(
    () => page.evaluate((route) => {
      const snapshot = window.GringottsV126?.coordinator?.snapshot?.();
      return snapshot?.status === 'ready' && snapshot?.route === route;
    }, expectedRoute),
    { timeout:15000, message:`v126 ${expectedRoute} route enhancements should finish before route interactions continue` }
  ).toBe(true);
}

export async function openPrimary(page, name) {
  const heading = primaryHeadings[name];
  if (!heading) throw new Error(`Unknown primary destination: ${name}`);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const button = page.getByRole('button', { name, exact:true });
    if (!(await button.isVisible())) {
      await page.getByRole('button', { name:/Menu/i }).click();
      await expect(button).toBeVisible({ timeout:2500 });
    }
    try {
      await button.click({ timeout:3000 });
      if (name === 'Tools') {
        await expect(page.getByRole('tablist', { name:'Tools sections', exact:true })).toBeVisible({ timeout:12000 });
      } else {
        await expect(page.getByRole('heading', { name:heading }).first()).toBeVisible({ timeout:12000 });
      }
      if (enhancedPrimaryDestinations.has(name)) await waitForRouteEnhancements(page, name.toLowerCase());
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
