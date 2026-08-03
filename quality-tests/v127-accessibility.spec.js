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

test('axe scans v127 action hierarchy and status feedback', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v127 action coverage runs once.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('button', { name: 'Download 43-sheet Workbook', exact: true })).toHaveAttribute('data-action-intent', 'export');
  await expect(page.locator('#v127Status')).toHaveAttribute('role', 'status');
  await scan(page, 'Reports — v127 Action Hierarchy');
  await expectNoBrowserErrors(errors);
});

test('axe scans the ten-release v127 roadmap on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v127 roadmap coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  await expect(page.getByRole('heading', { name: 'v127–v136 Reliability Roadmap', exact: true })).toBeVisible();
  await scan(page, 'Mobile Tools — v127 Roadmap');
  await expectNoBrowserErrors(errors);
});
