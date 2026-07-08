import { expect } from '@playwright/test';
import { openPrimary, seedVault, waitForApp } from '../tests/helpers/app.js';

export { openPrimary };

export async function bootQualityPage(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  await seedVault(page);
  await page.goto('/?quality=1');
  await waitForApp(page);
  return errors;
}

export async function expectNoBrowserErrors(errors) {
  expect(errors, 'Quality browser console and page errors').toEqual([]);
}

export function safeArtifactName(value) {
  return String(value || 'surface').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
