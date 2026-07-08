import { test, expect } from '@playwright/test';
import { openPrimary, seedVault } from './helpers/app.js';

const liveURL = process.env.LIVE_BASE_URL;

test.describe('@live Cloudflare deployment', () => {
  test.skip(!liveURL, 'LIVE_BASE_URL is required for the deployment smoke test.');

  test('boots the deployed app and opens every primary destination', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seedVault(page);
    await page.goto(liveURL, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.version-text')).toContainText(/^v108/);
    await expect(page.getByRole('heading', { name: /Gringotts could not start/i })).toHaveCount(0);

    const destinations = [
      ['Dashboard', /Vault Dashboard/i],
      ['Money', /Bills, Recurring & Budgets/i],
      ['Calendar', /Calendar & Cash Flow/i],
      ['Reports', /Reports Center/i],
      ['Activity', /Ledger/i],
      ['Tools', /Import \/ Restore/i]
    ];

    for (const [name, heading] of destinations) {
      await openPrimary(page, name);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    }

    expect(errors, 'Deployed page errors').toEqual([]);
  });
});
