import fs from 'node:fs';
import { test, expect, openPrimary } from './helpers/app.js';
import {
  currentBootResourcePattern,
  currentRelease,
  currentReleaseName,
  currentVersion
} from './helpers/release.js';

const workflowIds = [
  'dashboard-review',
  'bills-paydays',
  'recurring-decisions',
  'month-close',
  'forecast-debt-scenarios',
  'reports-exports',
  'import-receipt-review',
  'profile-management',
  'recovery-restore',
  'mobile-keyboard-use'
];

function completedReviewBundle() {
  const observations = Object.fromEntries(workflowIds.map((workflowId, index) => [workflowId, {
    workflowId,
    usage:index % 3 === 0 ? 'regular' : 'occasional',
    outcome:index === 2 ? 'unclear' : 'completed',
    friction:index === 1 ? 'avoidable' : index === 3 ? 'repeated' : 'none',
    consolidation:index === 4 ? 'overlap' : 'keep',
    unmetNeed:index === 5 ? 'yes' : 'no',
    note:'Synthetic workflow observation only.'
  }]));
  return {
    kind:'gringotts-household-workflow-review',
    version:1,
    inventoryVersion:'v129-household-workflows-1',
    createdAt:'2026-01-01T00:00:00.000Z',
    privacy:{ financialDataIncluded:false, localOnly:true, automaticTelemetry:false },
    summary:{ inventoryCount:10, reviewedCount:10, completeCount:10 },
    observations
  };
}

async function openDecisionGate(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
  await expect.poll(
    () => page.evaluate(() => {
      const gate = window.GringottsV131?.snapshot?.();
      const actions = window.GringottsV126?.dispatcher?.snapshot?.();
      return gate?.integrationLoaded === true
        && gate?.uiLoaded === true
        && actions?.handlers?.change?.some((handler) => handler.name === 'v131-decision-gate-fields') === true;
    }),
    { timeout:10000, message:'Decision Gate file handling should be registered before evidence is selected' }
  ).toBe(true);
}

async function importReview(page, bundle = completedReviewBundle()) {
  await page.locator('#v131ReviewFile').setInputFiles({
    name:'synthetic-workflow-review.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(bundle))
  });
  await expect(page.getByText(/Workflow Review imported/i)).toBeVisible();
}

async function waitForGateState(page, state) {
  await expect.poll(
    () => page.evaluate(() => window.GringottsV131.snapshot().state),
    { timeout:10000, message:`Decision Gate should reach ${state}` }
  ).toBe(state);
}

async function expectCoordinatorSettled(page) {
  await expect.poll(async () => {
    const first = await page.evaluate(() => window.GringottsV126.coordinator.snapshot());
    await page.waitForTimeout(120);
    const second = await page.evaluate(() => window.GringottsV126.coordinator.snapshot());
    return {
      ready:first.status === 'ready' && second.status === 'ready',
      sameCycle:first.cycle === second.cycle,
      samePasses:first.enhancementPasses === second.enhancementPasses,
      sameCallbacks:first.observerCallbacks === second.observerCallbacks
    };
  }, { timeout:10000, message:'the current route should stop producing enhancement or observer work' }).toEqual({
    ready:true,
    sameCycle:true,
    samePasses:true,
    sameCallbacks:true
  });
}

test('retains the v131 Decision Gate integration outside startup under the current release', async ({ app }) => {
  const { page } = app;
  const state = await page.evaluate(() => ({
    build:window.GringottsCleanRuntime.BUILD,
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    actions:window.GringottsV126.dispatcher.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    resources:performance.getEntriesByType('resource').map((entry) => entry.name),
    decisionResources:performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /\/src\/v131\//.test(name)),
    primaryDestinations:document.querySelectorAll('[data-tab]').length
  }));

  expect(state.build).toMatchObject({
    version:currentVersion,
    name:currentReleaseName,
    runtime:currentRelease.runtimeLabel,
    cacheBust:currentRelease.cacheBust
  });
  expect(state.resources.some((name) => currentBootResourcePattern.test(name))).toBe(true);
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.lifecycle.releases.map((release) => release.id)).toEqual(['v126', currentVersion]);
  expect(state.actions.handlers.click.map((handler) => handler.name)).not.toContain('v131-decision-gate-route');
  expect(state.gate).toMatchObject({
    release:'v131',
    hostRelease:currentVersion,
    featureFreeze:true,
    integrationLoaded:false,
    uiLoaded:false,
    manualDecisionOnly:true,
    automaticApproval:false,
    financialDataRead:false,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false,
    integrationLazy:true,
    uiLazy:true,
    primaryDestinations:6,
    toolsSections:6,
    workbookSheets:43
  });
  expect(state.hardening).toMatchObject({
    release:'v130',
    hostRelease:currentVersion,
    memoryOnlyHistory:true,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false
  });
  expect(state.infrastructure).toMatchObject({
    release:currentVersion,
    decisionIntegrationLoaded:false,
    startupLight:true
  });
  expect(state.hardening.startupResources.networkRequests).toBeLessThanOrEqual(45);
  expect(state.hardening.startupResources.scriptBytes).toBeLessThanOrEqual(500000);
  expect(state.decisionResources).toEqual([]);
  expect(state.primaryDestinations).toBe(6);
});

test('keeps the gate closed without a complete imported workflow review', async ({ app }) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await openDecisionGate(page);
  const snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot.state).toBe('evidence-incomplete');
  expect(snapshot.disposition).toBe('unselected');
  expect(snapshot.automaticApproval).toBe(false);
  expect(snapshot.memoryOnly).toBe(true);
  expect(snapshot.financialDataRead).toBe(false);
  expect(snapshot.persistentStoreAdded).toBe(false);
  expect(snapshot.networkImplementationAdded).toBe(false);
  await expect(page.getByText(/evidence-incomplete/i)).toBeVisible();
  const storageAfter = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  expect(storageAfter).toEqual(storageBefore);
});

test('validates imported workflow evidence and reaches decision-ready only with healthy runtime evidence', async ({ app }) => {
  const { page } = app;
  await openDecisionGate(page);
  await importReview(page);
  await waitForGateState(page, 'decision-ready');
  const snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot).toMatchObject({
    reviewLoaded:true,
    completeCount:10,
    inventoryCount:10,
    state:'decision-ready',
    disposition:'unselected',
    automaticApproval:false,
    manualDecisionOnly:true
  });
  expect(snapshot.runtimeEvidence?.ok).toBe(true);
  expect(snapshot.runtimeEvidence?.input?.runtimeObservers).toBe(1);
  expect(snapshot.runtimeEvidence?.input?.primaryDestinations).toBe(6);
  expect(snapshot.runtimeEvidence?.input?.workbookSheets).toBe(43);
  expect(snapshot.runtimeEvidence?.input?.networkRequests).toBeLessThanOrEqual(45);
  expect(snapshot.runtimeEvidence?.input?.scriptBytes).toBeLessThanOrEqual(500000);
});

test('records a manual feature-freeze hold without approval or automatic action', async ({ app }) => {
  const { page } = app;
  await openDecisionGate(page);
  await importReview(page);
  await waitForGateState(page, 'decision-ready');
  await page.locator('#v131Disposition').selectOption('hold');
  await page.locator('#v131Rationale').fill('Synthetic workflow evidence supports keeping the feature freeze in place.');
  await page.getByRole('button', { name:'Record Decision', exact:true }).click();
  await expect(page.getByText(/Decision recorded locally/i)).toBeVisible();
  const snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot.disposition).toBe('hold');
  expect(snapshot.automaticApproval).toBe(false);
  expect(snapshot.candidateProposalAllowed).toBe(false);
});

test('permits only one later candidate proposal and rejects likely financial rationale', async ({ app }) => {
  const { page } = app;
  await openDecisionGate(page);
  await importReview(page);
  await waitForGateState(page, 'decision-ready');
  await page.locator('#v131Disposition').selectOption('candidate-proposal');
  await page.locator('#v131Rationale').fill('The review shows one repeated unmet workflow need suitable for a later narrow proposal.');
  await page.getByRole('button', { name:'Record Decision', exact:true }).click();
  await expect(page.getByText(/Decision recorded locally/i)).toBeVisible();
  let snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot.disposition).toBe('candidate-proposal');
  expect(snapshot.candidateProposalAllowed).toBe(true);
  expect(snapshot.automaticApproval).toBe(false);

  await page.locator('#v131Rationale').fill('My card balance is $999 and merchant Example Store needs work.');
  await page.getByRole('button', { name:'Record Decision', exact:true }).click();
  await expect(page.getByText(/Rationale appears to contain financial or contact details/i)).toBeVisible();
  snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot.disposition).toBe('candidate-proposal');
});

test('exports a privacy-filtered local decision record with no raw observations or financial rows', async ({ app }) => {
  const { page } = app;
  await openDecisionGate(page);
  await importReview(page);
  await waitForGateState(page, 'decision-ready');
  await page.locator('#v131Disposition').selectOption('maintenance-only');
  await page.locator('#v131Rationale').fill('Synthetic repeated friction supports maintenance-only consolidation work.');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name:'Download Decision Record', exact:true }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  const record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  expect(record).toMatchObject({
    kind:'gringotts-observed-needs-decision',
    version:1,
    featureFreeze:true,
    automaticApproval:false,
    financialDataIncluded:false,
    persistentStoreUsed:false,
    remoteTransmission:false,
    disposition:'maintenance-only'
  });
  expect(record.workflowEvidence).toMatchObject({ inventoryCount:10, reviewedCount:10, completeCount:10 });
  expect(record).not.toHaveProperty('observations');
  expect(JSON.stringify(record)).not.toMatch(/amount|balance|merchant|account|transaction/i);
});

test('keeps repeated Decision Gate, Workflow Review, Roadmap, and Diagnostics routes settled and local', async ({ app }) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await openDecisionGate(page);
  await importReview(page);
  await waitForGateState(page, 'decision-ready');
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
    await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
    await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
    await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
    await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
    await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
  }
  await expectCoordinatorSettled(page);
  const snapshot = await page.evaluate(() => ({
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    actions:window.GringottsV126.dispatcher.snapshot(),
    decision:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    storage:Object.fromEntries(Object.entries(localStorage))
  }));
  expect(snapshot.lifecycle.observerCount).toBe(1);
  expect(snapshot.lifecycle.enhancementPasses).toBeLessThanOrEqual(3);
  expect(snapshot.lifecycle.observerCallbacks).toBeLessThanOrEqual(12);
  expect(snapshot.actions.registered).toBeLessThanOrEqual(40);
  expect(snapshot.decision.integrationLoaded).toBe(true);
  expect(snapshot.infrastructure.decisionIntegrationLoaded).toBe(true);
  expect(snapshot.storage).toEqual(storageBefore);
});

test('keeps the retained v131 Decision Gate within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openDecisionGate(page);
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});