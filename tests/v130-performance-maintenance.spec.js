import { test, expect, openPrimary } from './helpers/app.js';
import {
  currentBootResourcePattern,
  currentRelease,
  currentReleaseName,
  currentVersion
} from './helpers/release.js';

async function openWorkflowReview(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
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
    ready:true, sameCycle:true, samePasses:true, sameCallbacks:true
  });
}

test('retains strict v130 budgets while the current release keeps workflow, diagnostics, and decision code outside startup', async ({ app }) => {
  const { page } = app;
  const state = await page.evaluate(() => ({
    build:window.GringottsCleanRuntime.BUILD,
    runtime:window.GringottsV126.coordinator.snapshot(),
    actions:window.GringottsV126.dispatcher.snapshot(),
    workflow:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    gate:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    resources:performance.getEntriesByType('resource').map((entry) => entry.name),
    primaryDestinations:document.querySelectorAll('[data-tab]').length
  }));
  expect(state.build.version).toBe(currentVersion);
  expect(state.build.name).toBe(currentReleaseName);
  expect(state.build.runtime).toBe(currentRelease.runtimeLabel);
  expect(state.resources.some((name) => currentBootResourcePattern.test(name))).toBe(true);
  expect(state.runtime.observerCount).toBe(1);
  expect(state.runtime.releases.map((release) => release.id)).toEqual(['v126', currentVersion]);
  expect(state.actions.handlers.click.map((handler) => handler.name)).not.toContain('v129-workflow-review-route');
  expect(state.actions.handlers.click.map((handler) => handler.name)).not.toContain('v131-decision-gate-route');
  expect(state.workflow).toMatchObject({
    integrationLoaded:false, dispatcherOwned:false, coordinatorOwned:true,
    registeredAsRelease:false, standaloneClickListener:false, standaloneRouteReadyListener:false,
    hostRelease:currentVersion
  });
  expect(state.hardening).toMatchObject({
    release:'v130', hostRelease:currentVersion, featureFreeze:true, memoryOnlyHistory:true, financialDataRead:false,
    persistentStoreAdded:false, networkImplementationAdded:false, observerAdded:false,
    serviceWorkerAdded:false, primaryDestinations:6, workbookSheets:43,
    activeBootImportsV129:false, workflowIntegrationLazy:true, workflowIntegrationLoaded:false,
    diagnosticsLazy:true, diagnosticsLoaded:false, v129CompatibilityBootRetained:true
  });
  expect(state.hardening.budgets).toMatchObject({
    routeReadyMs:750, enhancementMs:300, maxEnhancementPasses:3,
    maxObserverCallbacksPerRoute:12, maxRegisteredActions:40,
    maxNetworkRequests:45, maxScriptBytes:500000, maxWorkbookSheets:43,
    maxRuntimeObservers:1, maxPrimaryDestinations:6, maxSessionSamples:12
  });
  expect(state.hardening.startupResources.networkRequests).toBeLessThanOrEqual(45);
  expect(state.hardening.startupResources.scriptBytes).toBeLessThanOrEqual(500000);
  expect(state.gate).toMatchObject({
    release:'v131', hostRelease:currentVersion, integrationLoaded:false, uiLoaded:false,
    automaticApproval:false, integrationLazy:true, uiLazy:true
  });
  expect(state.infrastructure).toMatchObject({
    release:currentVersion, centralizedReleaseManifest:true, centralizedVersionAssertions:true,
    workflowIntegrationLoaded:false, decisionIntegrationLoaded:false, diagnosticsLoaded:false,
    activeBootImportsV131:false, activeBootImportsV130:false, activeBootImportsV129:false, startupLight:true
  });
  expect(state.primaryDestinations).toBe(6);
});

test('keeps Workflow Review responsive and dispatcher-owned across repeated route changes under the current release', async ({ app }) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await openWorkflowReview(page);
  const field = page.locator('[data-v129-workflow="dashboard-review"] [data-v129-field="usage"]');
  await field.selectOption('regular');
  await expect(field).toHaveValue('regular');
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
    await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
    await openPrimary(page, 'Dashboard');
    await openWorkflowReview(page);
    await expect(page.locator('.v129-workflow-card')).toHaveCount(10);
  }
  await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
  await expectCoordinatorSettled(page);
  const state = await page.evaluate(() => ({
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    actions:window.GringottsV126.dispatcher.snapshot(),
    workflow:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    storage:Object.fromEntries(Object.entries(localStorage))
  }));
  expect(state.lifecycle.status).toBe('ready');
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.lifecycle.enhancementPasses).toBeLessThanOrEqual(3);
  expect(state.lifecycle.observerCallbacks).toBeLessThanOrEqual(12);
  expect(state.actions.registered).toBeLessThanOrEqual(40);
  expect(state.actions.handlers.click.map((handler) => handler.name)).toContain('v129-workflow-review-route');
  expect(state.actions.handlers.change.map((handler) => handler.name)).toContain('v129-workflow-review-fields');
  expect(state.actions.handlers.click.map((handler) => handler.name)).toContain('v129-workflow-review-actions');
  expect(state.workflow).toMatchObject({ integrationLoaded:true, dispatcherOwned:true, coordinatorOwned:true, registeredAsRelease:false, hostRelease:currentVersion });
  expect(state.hardening.workflowIntegrationLoaded).toBe(true);
  expect(state.hardening.historyCount).toBeGreaterThan(0);
  expect(state.hardening.historyCount).toBeLessThanOrEqual(12);
  expect(state.infrastructure.workflowIntegrationLoaded).toBe(true);
  expect(state.storage).toEqual(storageBefore);
});

test('renders bounded session-only v130 performance evidence in existing Diagnostics under the current release', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  await expect(page.getByText(/Session-only runtime evidence/i)).toBeVisible();
  await expect(page.getByText(/Route ready/)).toBeVisible();
  await expect(page.getByText(/Enhancement/).first()).toBeVisible();
  await expect(page.getByText(/Observer callbacks/)).toBeVisible();
  await expect(page.getByText(/Session samples/)).toBeVisible();
  await expectCoordinatorSettled(page);
  const snapshot = await page.evaluate(() => ({
    hardening:window.GringottsV130.snapshot(),
    infrastructure:window.GringottsV132.snapshot()
  }));
  expect(snapshot.hardening.diagnosticsLoaded).toBe(true);
  expect(snapshot.hardening.historyCount).toBeLessThanOrEqual(snapshot.hardening.historyCap);
  expect(snapshot.hardening.current.input.runtimeObservers).toBe(1);
  expect(snapshot.hardening.current.input.primaryDestinations).toBe(6);
  expect(snapshot.hardening.current.input.workbookSheets).toBe(43);
  expect(snapshot.hardening.current.input.dispatcherOwned).toBe(true);
  expect(snapshot.hardening.current.input.coordinatorOwned).toBe(true);
  expect(snapshot.hardening.current.evaluation?.ok).toBe(true);
  expect(snapshot.infrastructure.diagnosticsLoaded).toBe(true);
});

test('keeps retained v130 diagnostics within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});