import { test, expect, openPrimary } from './helpers/app.js';
import {
  currentBootResourcePattern,
  currentBootSpecifier,
  currentPackageVersion,
  currentRelease,
  currentReleaseName,
  currentTitle,
  currentVersion,
  directionalRoadmapCount,
  shippedRoadmapCount
} from './helpers/release.js';

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

test('boots from the authoritative manifest and keeps specialist code outside startup', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(currentTitle);
  await expect(page.locator('.version-text')).toHaveText(currentVersion);

  const state = await page.evaluate(() => ({
    build:window.GringottsCleanRuntime.BUILD,
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    workflow:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    decision:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    resources:performance.getEntriesByType('resource').map((entry) => entry.name),
    primaryDestinations:document.querySelectorAll('[data-tab]').length
  }));

  expect(state.build).toMatchObject({
    version:currentVersion,
    name:currentReleaseName,
    runtime:currentRelease.runtimeLabel,
    cacheBust:currentRelease.cacheBust
  });
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.lifecycle.releases.map((release) => release.id)).toEqual(['v126', currentVersion]);
  expect(state.resources.find((name) => currentBootResourcePattern.test(name))).toBeTruthy();
  expect(state.resources.some((name) => /\/src\/release-manifest\.js$/.test(name))).toBe(true);
  expect(state.resources.some((name) => /\/src\/v129\/integration\.js/.test(name))).toBe(false);
  expect(state.resources.some((name) => /\/src\/v131\/integration\.js/.test(name))).toBe(false);
  expect(state.infrastructure).toMatchObject({
    release:currentVersion,
    name:currentReleaseName,
    manifestVersion:currentVersion,
    packageVersion:currentPackageVersion,
    bootSpecifier:currentBootSpecifier,
    currentTitle,
    centralizedReleaseManifest:true,
    centralizedVersionAssertions:true,
    versionlessShellTitles:true,
    decisionIntegrationLoaded:false,
    workflowIntegrationLoaded:false,
    diagnosticsLoaded:false,
    startupLight:true,
    financialDataRead:false,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false,
    primaryDestinations:6,
    toolsSections:6,
    workbookSheets:43
  });
  expect(state.workflow).toMatchObject({ release:'v129', hostRelease:currentVersion, integrationLoaded:false });
  expect(state.hardening).toMatchObject({ release:'v130', hostRelease:currentVersion, workflowIntegrationLoaded:false, diagnosticsLoaded:false });
  expect(state.decision).toMatchObject({ release:'v131', hostRelease:currentVersion, integrationLoaded:false, automaticApproval:false });
  expect(state.primaryDestinations).toBe(6);
});

test('derives the roadmap current status from the manifest host release', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Roadmap', exact:true }).click();

  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  await expect(page.getByText('Shipped', { exact:true })).toHaveCount(shippedRoadmapCount);
  await expect(page.getByText('Current release', { exact:true })).toHaveCount(1);
  await expect(page.getByText('Directional', { exact:true })).toHaveCount(directionalRoadmapCount);
  await expect(page.locator(`[data-roadmap-version="${currentVersion}"]`)).toHaveAttribute('data-roadmap-status', 'current');
  await expect(page.locator(`[data-roadmap-version="${currentVersion}"] .badge`)).toHaveText('Current release');
  await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();

  const build = await page.evaluate(() => window.GringottsCleanRuntime.BUILD);
  expect(build).toMatchObject({
    version:currentVersion,
    name:currentReleaseName,
    runtime:currentRelease.runtimeLabel,
    cacheBust:currentRelease.cacheBust
  });
});

test('retains Workflow Review, Decision Gate, and Diagnostics without changing release identity', async ({ app }) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await openPrimary(page, 'Tools');

  await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();

  await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
  await expect(page.getByText(/evidence-incomplete/i)).toBeVisible();

  await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  await expectCoordinatorSettled(page);

  const state = await page.evaluate(() => ({
    title:document.title,
    version:document.querySelector('.version-text')?.textContent,
    build:window.GringottsCleanRuntime.BUILD,
    workflow:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(),
    decision:window.GringottsV131.snapshot(),
    infrastructure:window.GringottsV132.snapshot(),
    lifecycle:window.GringottsV126.coordinator.snapshot(),
    storage:Object.fromEntries(Object.entries(localStorage))
  }));

  expect(state.title).toBe(currentTitle);
  expect(state.version).toBe(currentVersion);
  expect(state.build).toMatchObject({ version:currentVersion, name:currentReleaseName, cacheBust:currentRelease.cacheBust });
  expect(state.workflow).toMatchObject({ release:'v129', hostRelease:currentVersion, integrationLoaded:true, dispatcherOwned:true });
  expect(state.hardening).toMatchObject({ release:'v130', hostRelease:currentVersion, workflowIntegrationLoaded:true, diagnosticsLoaded:true });
  expect(state.decision).toMatchObject({ release:'v131', integrationLoaded:true, automaticApproval:false });
  expect(state.infrastructure).toMatchObject({
    release:currentVersion,
    workflowIntegrationLoaded:true,
    decisionIntegrationLoaded:true,
    diagnosticsLoaded:true
  });
  expect(state.lifecycle.observerCount).toBe(1);
  expect(state.storage).toEqual(storageBefore);
});

test('keeps v132 infrastructure within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width:390, height:844 });
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
