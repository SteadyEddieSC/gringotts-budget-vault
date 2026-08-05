import fs from 'node:fs/promises';
import { test, expect, openPrimary, waitForApp } from './helpers/app.js';
import { currentReleaseName, currentVersion } from './helpers/release.js';

async function openWorkflowReview(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
}

async function completeDashboardReview(page) {
  const card = page.locator('[data-v129-workflow="dashboard-review"]');
  await card.locator('[data-v129-field="usage"]').selectOption('essential');
  await card.locator('[data-v129-field="friction"]').selectOption('low');
  await card.locator('[data-v129-field="outcome"]').selectOption('successful');
  await card.locator('[data-v129-field="signal"]').selectOption('works-well');
  await card.locator('[data-v129-field="disposition"]').selectOption('keep');
  await card.locator('[data-v129-field="note"]').fill('The opening sequence is clear and useful.');
  await card.locator('[data-v129-field="note"]').blur();
}

function generatedPrivateDetail() {
  return ['Ca','rd end','ing ','43','21',' makes this difficult.'].join('');
}

test('retains v129 workflow evidence as a Tools-only lazy integration under the current release', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText(currentVersion);
  const before = await page.evaluate(() => ({
    evidence:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot()
  }));
  expect(before.evidence).toMatchObject({
    release:'v129', hostRelease:currentVersion, inventoryCount:10, integrationLoaded:false,
    automaticTelemetry:false, financialDataRead:false, persistentStoreAdded:false,
    networkImplementationAdded:false, observerAdded:false, dispatcherOwned:false,
    coordinatorOwned:true, registeredAsRelease:false, primaryDestinations:6, workbookSheets:43
  });
  expect(before.hardening.workflowIntegrationLoaded).toBe(false);
  expect(before.gate.integrationLoaded).toBe(false);
  expect(before.infrastructure).toMatchObject({ release:currentVersion, workflowIntegrationLoaded:false, decisionIntegrationLoaded:false });

  await openPrimary(page, 'Tools');
  const state = await page.evaluate(() => ({
    coordinator:window.GringottsV126.coordinator.snapshot(), ux:window.GringottsV127.snapshot(),
    portable:window.GringottsV128.snapshot(), evidence:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(), gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(), build:window.GringottsCleanRuntime.BUILD,
    primaryDestinations:document.querySelectorAll('[data-tab]').length
  }));
  expect(state.coordinator.observerCount).toBe(1);
  expect(state.coordinator.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.ux.release).toBe('v127');
  expect(state.portable.release).toBe('v128');
  expect(state.evidence).toMatchObject({
    release:'v129', hostRelease:currentVersion, inventoryCount:10, reviewStateCount:0, integrationLoaded:true,
    manualReviewOnly:true, automaticTelemetry:false, financialDataRead:false, persistentStoreAdded:false,
    networkImplementationAdded:false, observerAdded:false, dispatcherOwned:true, coordinatorOwned:true,
    registeredAsRelease:false, standaloneClickListener:false, standaloneRouteReadyListener:false,
    primaryDestinations:6, workbookSheets:43, networkBudgetDelta:0
  });
  expect(state.hardening.release).toBe('v130');
  expect(state.hardening.hostRelease).toBe(currentVersion);
  expect(state.hardening.workflowIntegrationLoaded).toBe(true);
  expect(state.gate.release).toBe('v131');
  expect(state.gate.integrationLoaded).toBe(true);
  expect(state.gate.uiLoaded).toBe(false);
  expect(state.infrastructure).toMatchObject({
    release:currentVersion,
    name:currentReleaseName,
    workflowIntegrationLoaded:true,
    decisionIntegrationLoaded:true
  });
  expect(state.build.version).toBe(currentVersion);
  expect(state.primaryDestinations).toBe(6);
});

test('records structured session-only observations without changing browser storage or issuing a network write', async ({ app }) => {
  const { page } = app;
  await openWorkflowReview(page);
  const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push({ method:request.method(), url:request.url() });
  });
  await completeDashboardReview(page);
  await expect(page.locator('#workflowReviewSummary')).toContainText('1/10');
  const after = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const snapshot = await page.evaluate(() => window.GringottsV129.snapshot());
  expect(after).toEqual(before);
  expect(writes).toEqual([]);
  expect(snapshot.reviewStateCount).toBe(1);
  expect(snapshot.reviewedCount).toBe(1);
  expect(snapshot.completeCount).toBe(1);
  expect(snapshot.dispatcherOwned).toBe(true);
});

test('rejects likely private detail in an optional workflow observation', async ({ app }) => {
  const { page } = app;
  await openWorkflowReview(page);
  const card = page.locator('[data-v129-workflow="dashboard-review"]');
  const note = card.locator('[data-v129-field="note"]');
  await note.fill(generatedPrivateDetail());
  await note.blur();
  await expect(note).toHaveAttribute('aria-invalid','true');
  await expect(card.locator('.v129-note-error')).toContainText(/workflow friction only/i);
  const snapshot = await page.evaluate(() => window.GringottsV129.snapshot());
  expect(snapshot.reviewStateCount).toBe(0);
});

test('downloads a sanitized workflow-level evidence bundle only after explicit review', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium','One browser is sufficient for local download inspection.');
  const { page } = app;
  await openWorkflowReview(page);
  await completeDashboardReview(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{ name:'Download Local Review JSON', exact:true }).click()
  ]);
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Workflow_Review_.*\.json$/);
  const payload = JSON.parse(await fs.readFile(await download.path(),'utf8'));
  expect(payload.kind).toBe('gringotts-workflow-evidence-review');
  expect(payload.release).toBe('v129');
  expect(payload.observations).toHaveLength(1);
  expect(payload.observations[0]).toMatchObject({ workflowId:'dashboard-review', usage:'essential', friction:'low', outcome:'successful', signal:'works-well', disposition:'keep' });
  expect(payload.privacy).toEqual({ manualReviewOnly:true, automaticTelemetry:false, financialDataIncluded:false, persistentStoreUsed:false, remoteTransmission:false });
  expect(JSON.stringify(payload)).not.toMatch(/transaction_id|account_id|merchant_name|gringottsBudgetVault|transactions\s*:/i);
});

test('clears the in-session review on reload', async ({ app }) => {
  const { page } = app;
  await openWorkflowReview(page);
  await completeDashboardReview(page);
  await expect(page.locator('#workflowReviewSummary')).toContainText('1/10');
  await page.reload();
  await waitForApp(page);
  await openWorkflowReview(page);
  await expect(page.locator('[data-v129-workflow="dashboard-review"] [data-v129-field="usage"]')).toHaveValue('unreviewed');
  await expect(page.locator('[data-v129-workflow="dashboard-review"] [data-v129-field="note"]')).toHaveValue('');
  const snapshot = await page.evaluate(() => window.GringottsV129.snapshot());
  expect(snapshot.reviewStateCount).toBe(0);
  expect(snapshot.reviewedCount).toBe(0);
});

test('shows v129 through v131 shipped with the manifest release current in the ten-release roadmap', async ({ app }) => {
  const { page } = app;
  await openPrimary(page,'Tools');
  await page.getByRole('tab',{ name:'Roadmap', exact:true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  for (const version of ['v129', 'v130', 'v131']) {
    await expect(page.locator(`[data-roadmap-version="${version}"]`)).toHaveAttribute('data-roadmap-status','shipped');
  }
  await expect(page.locator(`[data-roadmap-version="${currentVersion}"]`)).toHaveAttribute('data-roadmap-status','current');
  await expect(page.locator(`[data-roadmap-version="${currentVersion}"] .badge`)).toHaveText('Current release');
  await expect(page.getByRole('heading',{ name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
});

test('keeps the workflow review contained on a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openWorkflowReview(page);
  await expect(page.locator('.v129-workflow-card')).toHaveCount(10);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});