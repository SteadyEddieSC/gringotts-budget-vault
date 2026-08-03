import { test, expect, openPrimary } from './helpers/app.js';

test('exposes one coordinator, one dispatcher, and one owned observer under v128', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText('v128');
  const state = await page.evaluate(() => ({
    lifecycle: window.GringottsV126.coordinator.snapshot(),
    actions: window.GringottsV126.dispatcher.snapshot(),
    build: window.GringottsCleanRuntime.BUILD,
    ux: window.GringottsV127.snapshot(),
    foundation: window.GringottsV128.snapshot()
  }));
  expect(state.lifecycle.status).toBe('ready');
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.lifecycle.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.lifecycle.actionOwner).toBe('v126-action-dispatcher');
  expect(state.actions.installed).toBe(true);
  expect(state.build.version).toBe('v128');
  expect(state.build.runtime).toContain('one v126 route coordinator');
  expect(state.build.runtime).toContain('v127 interaction policy');
  expect(state.build.runtime).toContain('v128 typed portable-vault foundation');
  expect(state.ux.observerAdded).toBe(false);
  expect(state.foundation.observerAdded).toBe(false);
  expect(state.foundation.networkImplementationAdded).toBe(false);
});

test('loads the inherited route layers once and preserves v125 household surfaces', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name: 'Recurring cost decisions', exact: true })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household scenario comparison', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Close history & trend explainability', exact: true })).toHaveCount(1);
  await openPrimary(page, 'Reports');
  await expect(page.locator('#reportPreviewPage option')).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Download 43-sheet Workbook', exact: true })).toBeVisible();
  await expect(page.locator('.v126-workbook-cap-note')).toHaveText(/no workbook sheet was added/i);
  const runtime = await page.evaluate(() => window.GringottsV126.coordinator.snapshot());
  expect(runtime.releaseCount).toBe(6);
  expect(runtime.releases.map((release) => release.id)).toEqual(['v118', 'v119', 'v120', 'v121', 'v125', 'v126']);
  expect(runtime.observerCount).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'))).toBe(vaultBefore);
});

test('routes specialist downloads through v126 ownership without a network write', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for download ownership.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url());
  });
  await openPrimary(page, 'Reports');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download 43-sheet Workbook', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Budget_Vault_v126_/);
  const actions = await page.evaluate(() => window.GringottsV126.dispatcher.snapshot());
  expect(actions.lastAction).toBe('click:v126-current-downloads');
  expect(writes).toEqual([]);
});

test('shows non-destructive runtime diagnostics and storage recovery contracts', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Runtime ownership & recovery', exact: true })).toBeVisible();
  await expect(page.getByText('Owned observers', { exact: true })).toBeVisible();
  await expect(page.getByText(/18 browser-local domains are inventoried/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry Route Enhancements', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Stable v105 Rescue', exact: true })).toHaveAttribute('href', /rescue-v105\.html/);
  const diagnostics = await page.evaluate(() => window.GringottsV126.diagnostics());
  expect(diagnostics.storage.transactionCopyDomains).toEqual(['gringottsBudgetVault.latest']);
  expect(diagnostics.runtimeConsolidation.oneObserverOwned).toBe(true);
  expect(diagnostics.runtimeConsolidation.timeoutReadinessAvailable).toBe(false);
  expect(diagnostics.release.workbookSheets).toBe(43);
});

test('keeps reliability surfaces within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Runtime ownership & recovery', exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
