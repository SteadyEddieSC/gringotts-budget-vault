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

    await expect(page.locator('.version-text')).toContainText(/^v124/);
    await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
    await expect(page.getByRole('heading', { name: /Gringotts could not start/i })).toHaveCount(0);

    const destinations = [
      ['Dashboard', /Vault Dashboard/i], ['Money', /Bills, Recurring & Budgets/i],
      ['Calendar', /Calendar & Cash Flow/i], ['Reports', /^Reports$/i],
      ['Activity', /Ledger/i], ['Tools', /Import & Restore/i]
    ];
    for (const [name, heading] of destinations) {
      await openPrimary(page, name);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    }

    await openPrimary(page, 'Money');
    await expect(page.getByRole('heading', { name: 'Recurring cost decisions', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close & Forecast', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Household scenario comparison', exact: true })).toBeVisible();
    await expect(page.getByText(/There is no Apply Scenario action/i)).toBeVisible();

    await openPrimary(page, 'Tools');
    await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
    await expect(page.locator('#profilePortabilityCard')).toBeVisible();
    await expect(page.locator('#profileRevisionHistory')).toBeVisible();
    await expect(page.locator('#importDryRunCard')).toBeVisible();
    await expect(page.locator('#profileBundleFile')).toBeAttached();
    await expect(page.locator('#bankImportFile')).toBeAttached();
    await page.locator('#bankImportFile').setInputFiles({
      name: 'live-profile-smoke.csv', mimeType: 'text/csv',
      buffer: Buffer.from('Date,Description,Amount,Status,Reference,Memo\n07/10/2026,Synthetic Smoke,-10.00,Posted,live-smoke-1,Fictional deployment row')
    });
    await expect(page.locator('#importProfileCard')).toBeVisible();
    await expect(page.locator('.field-validation')).toHaveCount(11);
    await expect(page.locator('#prepareImportDryRun')).toBeEnabled();
    await page.getByRole('button', { name: /Restore full vault/i }).click();
    await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();

    await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
    await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();

    await openPrimary(page, 'Activity');
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Guided Household Plan', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recurring-cost follow-up', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scenario discussion', exact: true })).toBeVisible();

    await openPrimary(page, 'Reports');
    await expect(page.getByRole('heading', { name: '41-sheet Vault Workbook', exact: true })).toBeVisible();
    for (const sheet of ['Import Receipts', 'Receipt Integrity', 'Batch Lineage', 'Account Inventory', 'Account Cleanup Plan', 'Recurring Decisions', 'Recurring Decision History', 'Scenario Comparisons', 'Scenario Assumptions']) {
      await expect(page.getByText(sheet, { exact: true }).last()).toBeVisible();
    }
    await expect(page.locator('#reportPreset')).toBeVisible();
    expect(errors, 'Deployed page errors').toEqual([]);
  });
});
