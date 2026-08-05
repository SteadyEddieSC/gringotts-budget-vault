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
  'calendar-cash-flow',
  'transaction-review',
  'insights-guided-plan',
  'reports-exports',
  'import-restore-diagnostics'
];

function completeReviewBundle() {
  const observations = workflowIds.map((workflowId, index) => ({
    workflowId,
    usage:index === 0 ? 'essential' : 'regular',
    friction:index === 1 ? 'high' : 'low',
    outcome:index === 2 ? 'unclear' : 'successful',
    signal:index === 2 ? 'unmet-need' : 'works-well',
    disposition:index === 1 ? 'simplify' : 'keep',
    ...(index === 1 ? { note:'The weekly sequence repeats guidance and should be simplified.' } : {})
  }));
  return {
    kind:'gringotts-workflow-evidence-review',
    version:1,
    release:'v129',
    inventoryVersion:1,
    createdAt:'2026-08-05T02:00:00.000Z',
    privacy:{
      manualReviewOnly:true,
      automaticTelemetry:false,
      financialDataIncluded:false,
      persistentStoreUsed:false,
      remoteTransmission:false
    },
    observations,
    summary:{
      inventoryCount:10,
      reviewedCount:10,
      completeCount:10,
      highFrictionWorkflowIds:['bills-paydays'],
      consolidationCandidateIds:[],
      unmetNeedWorkflowIds:['recurring-decisions'],
      keepCandidateIds:[
        'dashboard-review',
        'month-close',
        'forecast-debt-scenarios',
        'calendar-cash-flow',
        'transaction-review',
        'insights-guided-plan',
        'reports-exports',
        'import-restore-diagnostics'
      ],
      recommendedNextAction:'Prioritize the recorded high-friction workflows in v130 performance and maintenance hardening.'
    }
  };
}

async function openDecisionGate(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
}

async function importReview(page, bundle = completeReviewBundle()) {
  await page.locator('#v131ReviewFile').setInputFiles({
    name:'Gringotts_Workflow_Review_complete.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(bundle))
  });
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
    activeBootImportsV131:false,
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

  await expect(page.getByText(/evidence-incomplete/i)).toBeVisible();
  await expect(page.getByText('0/10', { exact:true })).toBeVisible();
  await expect(page.locator('#v131DecisionDisposition')).toBeDisabled();
  await expect(page.locator('#v131DownloadDecision')).toBeDisabled();
  await expect(page.locator('#v131CopyDecision')).toBeDisabled();

  const snapshot = await page.evaluate(() => ({
    gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    storage:Object.fromEntries(Object.entries(localStorage)),
    actions:window.GringottsV126.dispatcher.snapshot()
  }));
  expect(snapshot.gate).toMatchObject({
    release:'v131',
    integrationLoaded:true,
    uiLoaded:true,
    reviewLoaded:false,
    state:'evidence-incomplete',
    disposition:'unselected',
    memoryOnly:true,
    automaticApproval:false
  });
  expect(snapshot.infrastructure.decisionIntegrationLoaded).toBe(true);
  expect(snapshot.actions.handlers.click.map((handler) => handler.name)).toContain('v131-decision-gate-route');
  expect(snapshot.actions.handlers.change.map((handler) => handler.name)).toContain('v131-decision-gate-fields');
  expect(snapshot.actions.handlers.click.map((handler) => handler.name)).toContain('v131-decision-gate-actions');
  expect(snapshot.actions.registered).toBeLessThanOrEqual(40);
  expect(snapshot.storage).toEqual(storageBefore);
});

test('imports complete evidence and exports a manual candidate-proposal record without approval', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Decision-record file inspection runs once in Chromium.');
  const { page } = app;
  await openDecisionGate(page);
  await importReview(page);

  await expect(page.getByText(/decision-ready/i)).toBeVisible();
  await expect(page.getByText('10/10', { exact:true })).toBeVisible();
  await expect(page.getByText('Passed', { exact:true })).toBeVisible();
  await expect(page.locator('#v131DecisionDisposition')).toBeEnabled();

  await page.locator('#v131DecisionRationale').fill('Write one bounded proposal for the unclear workflow outcome.');
  await page.locator('#v131DecisionDisposition').selectOption('candidate-proposal');
  await expect(page.getByText('candidate-proposal', { exact:true })).toBeVisible();
  await expect(page.getByText(/not approved or implemented by v131/i)).toBeVisible();
  await expect(page.locator('#v131DownloadDecision')).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#v131DownloadDecision').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Decision_Gate_.*\.json$/);
  const path = await download.path();
  const record = JSON.parse(fs.readFileSync(path, 'utf8'));
  expect(record).toMatchObject({
    kind:'gringotts-observed-needs-decision',
    version:1,
    release:'v131',
    featureFreeze:true,
    decision:{ state:'candidate-proposal' },
    privacy:{
      manualDecisionOnly:true,
      financialDataIncluded:false,
      persistentStoreUsed:false,
      automaticTelemetry:false,
      remoteTransmission:false,
      automaticApproval:false
    }
  });
  expect(record.evidence.observations).toBeUndefined();
  expect(record.evidence.completedWorkflows).toBe(10);
  expect(record.evidence.runtimePassed).toBe(true);

  const snapshot = await page.evaluate(() => window.GringottsV131.snapshot());
  expect(snapshot).toMatchObject({
    reviewLoaded:true,
    completeCount:10,
    inventoryCount:10,
    state:'candidate-proposal',
    disposition:'candidate-proposal',
    memoryOnly:true,
    automaticApproval:false
  });
});

test('rejects weakened privacy declarations and risky decision rationale', async ({ app }) => {
  const { page } = app;
  await openDecisionGate(page);
  const weakened = completeReviewBundle();
  weakened.privacy.financialDataIncluded = true;
  await importReview(page, weakened);
  await expect(page.locator('#v131DecisionError')).toContainText(/privacy declaration/i);
  await expect(page.getByText(/evidence-incomplete/i)).toBeVisible();

  const rationaleError = await page.evaluate(async () => {
    const module = await import('/src/v131/decision-contracts.js');
    try {
      module.sanitizeDecisionRationale('Card ending 1234 should be changed.');
      return '';
    } catch (error) {
      return error.message;
    }
  });
  expect(rationaleError).toMatch(/financial, account, card, transaction/i);
  await expect(page.locator('#v131DecisionDisposition')).toBeDisabled();
});

test('settles repeated Decision Gate, Roadmap, and primary route transitions', async ({ app }) => {
  const { page } = app;
  for (let index = 0; index < 3; index += 1) {
    await openDecisionGate(page);
    await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
    await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
    await expect(page.locator('[data-roadmap-version="v131"]')).toHaveAttribute('data-roadmap-status', 'shipped');
    await openPrimary(page, 'Dashboard');
  }
  await openDecisionGate(page);
  await expectCoordinatorSettled(page);
  const snapshot = await page.evaluate(() => ({
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    actions:window.GringottsV126.dispatcher.snapshot(),
    gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot()
  }));
  expect(snapshot.lifecycle.status).toBe('ready');
  expect(snapshot.lifecycle.observerCount).toBe(1);
  expect(snapshot.lifecycle.enhancementPasses).toBeLessThanOrEqual(3);
  expect(snapshot.lifecycle.observerCallbacks).toBeLessThanOrEqual(12);
  expect(snapshot.actions.registered).toBeLessThanOrEqual(40);
  expect(snapshot.gate.integrationLoaded).toBe(true);
  expect(snapshot.infrastructure.decisionIntegrationLoaded).toBe(true);
});

test('keeps the Decision Gate within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openDecisionGate(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  const actionHeights = await page.locator('.v131-gate-actions .btn').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(actionHeights.every((height) => height >= 44)).toBe(true);
});