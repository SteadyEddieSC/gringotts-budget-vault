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

test('axe scans close history trend explainability', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v125 close-trend coverage runs once.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Money');
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Close history & trend explainability', exact: true })).toBeVisible();
  await scan(page, 'Money — Close History & Trend Explainability');
  await expectNoBrowserErrors(errors);
});

test('axe keeps the inherited close-trend report accessible on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v125 report coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Reports');
  await page.locator('#reportPreviewPage').selectOption('close-trends');
  await expect(page.locator('.v125-close-trend-report:not([hidden])')).toBeVisible();
  await scan(page, 'Mobile Reports — v125 Close Trends');
  await expectNoBrowserErrors(errors);
});
