import { test, expect } from '@playwright/test';
import { openPrimary, seedVault } from './helpers/app.js';

const liveURL = process.env.LIVE_BASE_URL;

test.describe('@live Cloudflare deployment', () => {
  test.skip(!liveURL, 'LIVE_BASE_URL is required for the deployment smoke test.');

  test('boots the deployed app, serves hardened headers, and opens every primary destination', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seedVault(page);
    const response = await page.goto(liveURL, { waitUntil: 'domcontentloaded' });
    expect(response, 'Cloudflare should return a document response').not.toBeNull();

    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("connect-src 'self'");
    expect(headers['content-security-policy']).toContain("worker-src 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-origin');

    await expect(page.locator('.version-text')).toContainText(/^v111/);
    await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
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

    await openPrimary(page, 'Reports');
    await expect(page.getByRole('heading', { name: 'Family Financial Report' })).toBeVisible();
    await expect(page.locator('#reportPreset')).toBeVisible();

    expect(errors, 'Deployed page errors').toEqual([]);
  });
});
