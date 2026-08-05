import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { bootQualityPage, expectNoBrowserErrors, openPrimary } from './helpers.js';

const blockingImpacts = new Set(['critical', 'serious']);

async function scan(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  const blocking = results.violations.filter((violation) => blockingImpacts.has(violation.impact));
  expect(blocking, `${label} serious or critical axe violations`).toEqual([]);
}

async function openDecisionGate(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Decision Gate', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Observed Needs Decision Gate', exact:true })).toBeVisible();
}

test('axe scans the closed v131 Decision Gate on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v131 Decision Gate coverage runs once.');
  const errors = await bootQualityPage(page);
  await openDecisionGate(page);
  await expect(page.locator('[data-v131-decision-gate="true"]')).toHaveCount(1);
  await expect(page.locator('#v131DecisionDisposition')).toBeDisabled();
  await expect(page.locator('#v131DownloadDecision')).toBeDisabled();
  await expect(page.locator('label', { hasText:'Disposition' })).toBeVisible();
  await expect(page.locator('label', { hasText:'Workflow-only rationale' })).toBeVisible();
  await scan(page, 'Tools — v131 Observed Needs Decision Gate');
  await expectNoBrowserErrors(errors);
});

test('axe scans the closed v131 Decision Gate on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v131 Decision Gate coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openDecisionGate(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  const actionHeights = await page.locator('.v131-gate-actions .btn').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(actionHeights.every((height) => height >= 44)).toBe(true);
  await scan(page, 'Mobile Tools — v131 Observed Needs Decision Gate');
  await expectNoBrowserErrors(errors);
});
