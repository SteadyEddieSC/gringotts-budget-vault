import { test, expect, openPrimary } from './helpers/app.js';

test('exposes one coordinator, one dispatcher, and one owned observer under startup-light v131', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText('v131');
  const state = await page.evaluate(() => ({
    lifecycle:window.GringottsV126.coordinator.snapshot(), actions:window.GringottsV126.dispatcher.snapshot(),
    build:window.GringottsCleanRuntime.BUILD, ux:window.GringottsV127.snapshot(),
    foundation:window.GringottsV128.snapshot(), evidence:window.GringottsV129.snapshot(), hardening:window.GringottsV130.snapshot(), gate:window.GringottsV131.snapshot()
  }));
  expect(state.lifecycle.status).toBe('ready');
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.lifecycle.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.lifecycle.actionOwner).toBe('v126-action-dispatcher');
  expect(state.actions.installed).toBe(true);
  expect(state.build.version).toBe('v131');
  expect(state.build.runtime).toContain('v126 coordinator/dispatcher');
  expect(state.build.runtime).toContain('v128 UX/typed foundation');
  expect(state.build.runtime).toContain('lazy v129 workflow review');
  expect(state.build.runtime).toContain('retained v130 runtime budgets');
  expect(state.build.runtime).toContain('lazy v131 decision gate');
  expect(state.ux.observerAdded).toBe(false);
  expect(state.foundation.observerAdded).toBe(false);
  expect(state.foundation.networkImplementationAdded).toBe(false);
  expect(state.evidence).toMatchObject({ integrationLoaded:false, observerAdded:false, persistentStoreAdded:false, dispatcherOwned:false, coordinatorOwned:true });
  expect(state.hardening).toMatchObject({ observerAdded:false, persistentStoreAdded:false, memoryOnlyHistory:true, workflowIntegrationLazy:true, diagnosticsLazy:true });
  expect(state.gate).toMatchObject({ release:'v131', integrationLoaded:false, automaticApproval:false, startupLight:true });
});

test('loads inherited route layers once while keeping Tools specialists lazy', async ({ app }) => {
  const { page } = app;
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page,'Money');
  await expect(page.getByRole('heading',{ name:'Recurring cost decisions', exact:true })).toHaveCount(1);
  await page.getByRole('tab',{ name:'Close & Forecast', exact:true }).click();
  await expect(page.getByRole('heading',{ name:'Household scenario comparison', exact:true })).toHaveCount(1);
  await expect(page.getByRole('heading',{ name:'Close history & trend explainability', exact:true })).toHaveCount(1);
  await openPrimary(page,'Reports');
  await expect(page.locator('#reportPreviewPage option')).toHaveCount(9);
  await expect(page.getByRole('button',{ name:'Download 43-sheet Workbook', exact:true })).toBeVisible();
  await expect(page.locator('.v126-workbook-cap-note')).toHaveText(/no workbook sheet was added/i);
  const runtime = await page.evaluate(() => ({ lifecycle:window.GringottsV126.coordinator.snapshot(), hardening:window.GringottsV130.snapshot(), gate:window.GringottsV131.snapshot() }));
  expect(runtime.lifecycle.releaseCount).toBe(7);
  expect(runtime.lifecycle.releases.map((release) => release.id)).toEqual(['v118','v119','v120','v121','v125','v126','v131']);
  expect(runtime.lifecycle.observerCount).toBe(1);
  expect(runtime.hardening.workflowIntegrationLoaded).toBe(false);
  expect(runtime.hardening.diagnosticsLoaded).toBe(false);
  expect(runtime.gate.integrationLoaded).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'))).toBe(vaultBefore);
});

test('routes specialist downloads through v126 ownership without a network write', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium','One browser is sufficient for download ownership.');
  const { page } = app;
  const writes = [];
  page.on('request',(request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await openPrimary(page,'Reports');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{ name:'Download 43-sheet Workbook', exact:true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Budget_Vault_v126_/);
  const actions = await page.evaluate(() => window.GringottsV126.dispatcher.snapshot());
  expect(actions.lastAction).toBe('click:v126-current-downloads');
  expect(writes).toEqual([]);
});

test('shows non-destructive runtime diagnostics, retained v130 budgets, and storage recovery contracts', async ({ app }) => {
  const { page } = app;
  await openPrimary(page,'Tools');
  await page.getByRole('tab',{ name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading',{ name:'Runtime ownership & recovery', exact:true })).toBeVisible();
  await expect(page.getByRole('heading',{ name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  await expect(page.getByText(/Owned observers/).first()).toBeVisible();
  await expect(page.getByText(/18 browser-local domains are inventoried/i)).toBeVisible();
  await expect(page.getByRole('button',{ name:'Retry Route Enhancements', exact:true })).toBeVisible();
  await expect(page.getByRole('link',{ name:'Open Stable v105 Rescue', exact:true })).toHaveAttribute('href',/rescue-v105\.html/);
  const diagnostics = await page.evaluate(() => ({ v126:window.GringottsV126.diagnostics(), v129:window.GringottsV129.snapshot(), v130:window.GringottsV130.snapshot(), v131:window.GringottsV131.snapshot() }));
  expect(diagnostics.v126.storage.transactionCopyDomains).toEqual(['gringottsBudgetVault.latest']);
  expect(diagnostics.v126.runtimeConsolidation.oneObserverOwned).toBe(true);
  expect(diagnostics.v126.runtimeConsolidation.timeoutReadinessAvailable).toBe(false);
  expect(diagnostics.v126.release.workbookSheets).toBe(43);
  expect(diagnostics.v129).toMatchObject({ integrationLoaded:true, dispatcherOwned:true, registeredAsRelease:false });
  expect(diagnostics.v130.memoryOnlyHistory).toBe(true);
  expect(diagnostics.v130.diagnosticsLoaded).toBe(true);
  expect(diagnostics.v130.historyCount).toBeLessThanOrEqual(12);
  expect(diagnostics.v130.workbookSheets).toBe(43);
  expect(diagnostics.v131).toMatchObject({ release:'v131', integrationLoaded:true, automaticApproval:false });
});

test('keeps reliability surfaces within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openPrimary(page,'Tools');
  await page.getByRole('tab',{ name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading',{ name:'Runtime ownership & recovery', exact:true })).toBeVisible();
  await expect(page.getByRole('heading',{ name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});