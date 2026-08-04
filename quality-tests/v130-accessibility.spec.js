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

async function openDiagnostics(page) {
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Performance & maintenance budgets', exact: true })).toBeVisible();
}

test('axe scans v130 performance diagnostics on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v130 diagnostics coverage runs once.');
  const errors = await bootQualityPage(page);
  await openDiagnostics(page);
  await expect(page.locator('[data-v130-performance-card]')).toHaveCount(1);
  await scan(page, 'Tools — v130 Performance & Maintenance');
  await expectNoBrowserErrors(errors);
});

test('axe scans v130 performance diagnostics on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v130 diagnostics coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openDiagnostics(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await scan(page, 'Mobile Tools — v130 Performance & Maintenance');
  await expectNoBrowserErrors(errors);
});
