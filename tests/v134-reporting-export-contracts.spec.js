import fs from 'node:fs/promises';
import { test, expect, openPrimary } from './helpers/app.js';
import {
  WORKFLOW_INVENTORY,
  buildWorkflowReviewBundle
} from '../src/v129/workflow-evidence.js';

const fixedCreatedAt = '2026-08-05T22:30:00.000Z';

async function downloadedJson(download) {
  const file = await download.path();
  if (!file) throw new Error('The local download did not produce a readable temporary file.');
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function completeReviewBundle() {
  return buildWorkflowReviewBundle(WORKFLOW_INVENTORY.map((workflow) => ({
    workflowId:workflow.id,
    usage:'regular',
    friction:'low',
    outcome:'successful',
    signal:'works-well',
    disposition:'keep'
  })), fixedCreatedAt);
}

async function expectSharedExecutorState(page, storageBefore) {
  const state = await page.evaluate(() => ({
    storage:Object.fromEntries(Object.entries(localStorage)),
    observerCount:window.GringottsV126.coordinator.snapshot().observerCount,
    resources:performance.getEntriesByType('resource').map((entry) => entry.name)
  }));
  expect(state.storage).toEqual(storageBefore);
  expect(state.observerCount).toBe(1);
  expect(state.resources.filter((name) => /\/src\/v134\/local-export\.js/.test(name))).toHaveLength(1);
  expect(state.resources.filter((name) => /\/src\/v134\/export-contracts\.js/.test(name))).toHaveLength(1);
}

test('keeps v134 export code outside startup and dispatches the established Workflow Review JSON', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => ({
    storage:Object.fromEntries(Object.entries(localStorage)),
    observerCount:window.GringottsV126.coordinator.snapshot().observerCount,
    resources:performance.getEntriesByType('resource').map((entry) => entry.name)
  }));
  expect(before.resources.some((name) => /\/src\/v134\/(?:export-contracts|local-export)\.js/.test(name))).toBe(false);

  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Workflow Review', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
  await page.locator('[data-v129-field="usage"]').first().selectOption('regular');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadWorkflowReview').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Workflow_Review_.*\.json$/);
  const payload = await downloadedJson(download);
  expect(payload).toMatchObject({
    kind:'gringotts-workflow-evidence-review',
    release:'v129',
    privacy:{ financialDataIncluded:false, persistentStoreUsed:false, remoteTransmission:false }
  });
  expect(payload.observations).toHaveLength(1);

  const after = await page.evaluate(() => ({
    storage:Object.fromEntries(Object.entries(localStorage)),
    observerCount:window.GringottsV126.coordinator.snapshot().observerCount,
    resources:performance.getEntriesByType('resource').map((entry) => entry.name)
  }));
  expect(after.storage).toEqual(before.storage);
  expect(after.observerCount).toBe(before.observerCount);
  expect(after.resources.some((name) => /\/src\/v134\/local-export\.js/.test(name))).toBe(true);
  expect(after.resources.some((name) => /\/src\/v134\/export-contracts\.js/.test(name))).toBe(true);
});

test('preserves Decision Gate authority and dispatches its record when runtime evidence passes', async ({ app }, testInfo) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();

  const bundle = completeReviewBundle();
  await page.locator('#v131ReviewFile').setInputFiles({
    name:'synthetic-complete-workflow-review.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(bundle))
  });
  await expect.poll(() => page.evaluate(() => window.GringottsV131.snapshot())).toMatchObject({
    reviewLoaded:true,
    completeCount:WORKFLOW_INVENTORY.length
  });
  const gate = await page.evaluate(() => window.GringottsV131.snapshot());

  if (gate.state === 'runtime-blocked') {
    expect(['tablet','mobile-webkit']).toContain(testInfo.project.name);
    const evaluation = await page.evaluate(async () => {
      const runtime = window.GringottsV130.snapshot();
      return window.GringottsV130.evaluate(runtime.current.input);
    });
    expect(evaluation.ok).toBe(false);
    expect(evaluation.failures.length).toBeGreaterThan(0);
    await expect(page.locator('#v131DecisionDisposition')).toBeDisabled();
    await expect(page.locator('#v131DownloadDecision')).toBeDisabled();
    await expectSharedExecutorState(page, storageBefore);
    return;
  }

  expect(gate.state).toBe('decision-ready');
  await page.locator('#v131DecisionDisposition').selectOption('hold');
  await expect.poll(() => page.evaluate(() => window.GringottsV131.snapshot().state)).toBe('hold');
  await expect(page.locator('#v131DownloadDecision')).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#v131DownloadDecision').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/^Gringotts_Decision_Gate_.*\.json$/);
  const record = await downloadedJson(download);
  expect(record).toMatchObject({
    kind:'gringotts-observed-needs-decision',
    release:'v131',
    decision:{ state:'hold' },
    privacy:{ financialDataIncluded:false, persistentStoreUsed:false, remoteTransmission:false, automaticApproval:false }
  });
  expect(record.evidence.completedWorkflows).toBe(WORKFLOW_INVENTORY.length);
  await expectSharedExecutorState(page, storageBefore);
});
