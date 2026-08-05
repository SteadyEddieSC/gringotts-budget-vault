import { test, expect } from '@playwright/test';
import { openPrimary, seedVault } from './helpers/app.js';
import {
  currentPackageVersion,
  currentReleaseName,
  currentTitle,
  currentVersion,
  directionalRoadmapCount,
  shippedRoadmapCount
} from './helpers/release.js';

const liveURL = process.env.LIVE_BASE_URL;

test.describe('@live Cloudflare deployment', () => {
  test.skip(!liveURL, 'LIVE_BASE_URL is required for the deployment smoke test.');

  test('boots the deployed app, serves hardened headers, and opens every primary destination', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await seedVault(page);
    const response = await page.goto(liveURL, { waitUntil:'domcontentloaded' });
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

    await expect(page).toHaveTitle(currentTitle);
    await expect(page.locator('.version-text')).toHaveText(currentVersion);
    await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
    await expect(page.getByRole('heading', { name:/Gringotts could not start/i })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.GringottsV126?.coordinator?.status)).toBe('ready');
    await expect.poll(() => page.evaluate(() => window.GringottsV127?.release)).toBe('v127');
    await expect.poll(() => page.evaluate(() => window.GringottsV128?.release)).toBe('v128');
    await expect.poll(() => page.evaluate(() => window.GringottsV129?.release)).toBe('v129');
    await expect.poll(() => page.evaluate(() => window.GringottsV130?.release)).toBe('v130');
    await expect.poll(() => page.evaluate(() => window.GringottsV131?.release)).toBe('v131');
    await expect.poll(() => page.evaluate(() => window.GringottsV132?.release)).toBe(currentVersion);

    const destinations = [
      ['Dashboard', /Vault Dashboard/i], ['Money', /Bills, Recurring & Budgets/i],
      ['Calendar', /Calendar & Cash Flow/i], ['Reports', /^Reports$/i],
      ['Activity', /Ledger/i], ['Tools', /Import & Restore/i]
    ];
    for (const [name, heading] of destinations) {
      await openPrimary(page, name);
      await expect(page.getByRole('heading', { name:heading }).first()).toBeVisible();
    }

    await openPrimary(page, 'Money');
    await expect(page.getByRole('heading', { name:'Recurring cost decisions', exact:true })).toBeVisible();
    await page.getByRole('tab', { name:'Close & Forecast', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Household scenario comparison', exact:true })).toBeVisible();
    await expect(page.getByText(/There is no Apply Scenario action/i)).toBeVisible();
    await expect(page.getByRole('heading', { name:'Close history & trend explainability', exact:true })).toBeVisible();
    await expect(page.getByText(/Pending rows are excluded/i).last()).toBeVisible();

    await openPrimary(page, 'Tools');
    await expect(page.getByRole('heading', { name:'Account cleanup & merge planning', exact:true })).toBeVisible();
    await expect(page.getByRole('heading', { name:'Import batch timeline', exact:true })).toBeVisible();
    await expect(page.locator('#profilePortabilityCard')).toBeVisible();
    await expect(page.locator('#profileRevisionHistory')).toBeVisible();
    await expect(page.locator('#importDryRunCard')).toBeVisible();
    await expect(page.locator('#profileBundleFile')).toBeAttached();
    await expect(page.locator('#bankImportFile')).toBeAttached();
    await page.locator('#bankImportFile').setInputFiles({
      name:'live-profile-smoke.csv', mimeType:'text/csv',
      buffer:Buffer.from('Date,Description,Amount,Status,Reference,Memo\n07/10/2026,Synthetic Smoke,-10.00,Posted,live-smoke-1,Fictional deployment row')
    });
    await expect(page.locator('#importProfileCard')).toBeVisible();
    await expect(page.locator('.field-validation')).toHaveCount(11);
    await expect(page.locator('#prepareImportDryRun')).toBeEnabled();
    await page.getByRole('button', { name:/Restore full vault/i }).click();
    await expect(page.getByRole('heading', { name:'Full vault restore', exact:true })).toBeVisible();

    await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
    await expect(page.locator('.v129-workflow-card')).toHaveCount(10);
    const workflowState = await page.evaluate(() => window.GringottsV129.snapshot());
    expect(workflowState).toMatchObject({
      hostRelease:currentVersion, reviewStateCount:0, automaticTelemetry:false, financialDataRead:false,
      persistentStoreAdded:false, lazyController:true, dispatcherOwned:true, coordinatorOwned:true
    });

    await openPrimary(page, 'Tools');
    await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
    await expect(page.getByText(/evidence-incomplete/i)).toBeVisible();
    await expect(page.locator('#v131DownloadDecision')).toBeDisabled();

    await openPrimary(page, 'Tools');
    await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
    await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
    await expect(page.getByRole('heading', { name:/v127 — UX Polish & Simplification/i })).toBeVisible();
    await expect(page.getByRole('heading', { name:/v128 — TypeScript & Portable Vault Foundation/i })).toBeVisible();
    await expect(page.getByRole('heading', { name:/v129 — Household Workflow Evidence Review/i })).toBeVisible();
    await expect(page.getByRole('heading', { name:/v130 — Performance & Maintenance Hardening/i })).toBeVisible();
    await expect(page.getByRole('heading', { name:/v131 — Observed Needs Decision Gate/i })).toBeVisible();
    await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
    await expect(page.getByText('Shipped', { exact:true })).toHaveCount(shippedRoadmapCount);
    await expect(page.getByText('Current release', { exact:true })).toHaveCount(1);
    await expect(page.getByText('Directional', { exact:true })).toHaveCount(directionalRoadmapCount);
    await expect(page.locator('[data-roadmap-version="v131"]')).toHaveAttribute('data-roadmap-status', 'shipped');
    await expect(page.locator(`[data-roadmap-version="${currentVersion}"]`)).toHaveAttribute('data-roadmap-status', 'current');
    await expect(page.getByRole('heading', { name:/v136 — Architecture Baseline & Next-Horizon Decision/i })).toBeVisible();

    await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Runtime ownership & recovery', exact:true })).toBeVisible();
    await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
    const state = await page.evaluate(() => ({
      lifecycle:window.GringottsV126.coordinator.snapshot(),
      ux:window.GringottsV127.snapshot(),
      foundation:window.GringottsV128.snapshot(),
      evidence:window.GringottsV129.snapshot(),
      hardening:window.GringottsV130.snapshot(),
      gate:window.GringottsV131.snapshot(),
      infrastructure:window.GringottsV132.snapshot(),
      build:window.GringottsCleanRuntime.BUILD
    }));
    expect(state.lifecycle.observerCount).toBe(1);
    expect(state.ux.observerAdded).toBe(false);
    expect(state.ux.storageWritesAdded).toBe(false);
    expect(state.foundation.networkImplementationAdded).toBe(false);
    expect(state.foundation.cloudAdaptersEnabled).toBe(false);
    expect(state.evidence.networkImplementationAdded).toBe(false);
    expect(state.evidence.persistentStoreAdded).toBe(false);
    expect(state.evidence.dispatcherOwned).toBe(true);
    expect(state.hardening.networkImplementationAdded).toBe(false);
    expect(state.hardening.persistentStoreAdded).toBe(false);
    expect(state.hardening.memoryOnlyHistory).toBe(true);
    expect(state.gate).toMatchObject({
      release:'v131',
      automaticApproval:false,
      persistentStoreAdded:false,
      financialDataRead:false,
      primaryDestinations:6,
      toolsSections:6
    });
    expect(state.infrastructure).toMatchObject({
      release:currentVersion,
      name:currentReleaseName,
      packageVersion:currentPackageVersion,
      centralizedReleaseManifest:true,
      centralizedVersionAssertions:true,
      workflowIntegrationLoaded:true,
      decisionIntegrationLoaded:true,
      diagnosticsLoaded:true,
      persistentStoreAdded:false,
      financialDataRead:false,
      primaryDestinations:6,
      workbookSheets:43
    });
    expect(state.build).toMatchObject({ version:currentVersion, name:currentReleaseName });

    await openPrimary(page, 'Activity');
    await page.getByRole('tab', { name:'Plan', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Guided Household Plan', exact:true })).toBeVisible();
    await expect(page.getByRole('heading', { name:'Recurring-cost follow-up', exact:true })).toBeVisible();
    await expect(page.getByRole('heading', { name:'Scenario discussion', exact:true })).toBeVisible();
    await expect(page.getByRole('heading', { name:'Close trend conversation', exact:true })).toBeVisible();

    await openPrimary(page, 'Reports');
    await expect(page.getByRole('heading', { name:'43-sheet Vault Workbook', exact:true })).toBeVisible();
    for (const sheet of ['Import Receipts','Receipt Integrity','Batch Lineage','Account Inventory','Account Cleanup Plan','Recurring Decisions','Recurring Decision History','Scenario Comparisons','Scenario Assumptions','Close Trends','Close Drivers']) {
      await expect(page.getByText(sheet, { exact:true }).last()).toBeVisible();
    }
    await expect(page.locator('#reportPreset')).toBeVisible();
    expect(errors, 'Deployed page errors').toEqual([]);
  });
});