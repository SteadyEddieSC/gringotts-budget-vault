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

async function openWorkflowReview(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Workflow Review', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household Workflow Evidence Review', exact: true })).toBeVisible();
}

test('axe scans the v129 workflow evidence review on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v129 workflow review coverage runs once.');
  const errors = await bootQualityPage(page);
  await openWorkflowReview(page);
  await expect(page.locator('.v129-workflow-card')).toHaveCount(10);
  await expect(page.locator('#workflowReviewSummary')).toHaveAttribute('aria-live', 'polite');
  await scan(page, 'Tools — v129 Workflow Evidence Review');
  await expectNoBrowserErrors(errors);
});

test('axe scans the v129 workflow evidence review on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v129 workflow review coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openWorkflowReview(page);
  await expect(page.locator('.v129-workflow-card')).toHaveCount(10);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await scan(page, 'Mobile Tools — v129 Workflow Evidence Review');
  await expectNoBrowserErrors(errors);
});
