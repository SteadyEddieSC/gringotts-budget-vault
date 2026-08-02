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

test('axe scans retained v126 runtime ownership and recovery diagnostics', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v126 runtime coverage runs once.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Runtime ownership & recovery', exact: true })).toBeVisible();
  await scan(page, 'Tools — Runtime Ownership & Recovery');
  await expectNoBrowserErrors(errors);
});

test('axe scans the extended reliability roadmap on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone roadmap coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  await scan(page, 'Mobile Tools — Reliability Roadmap');
  await expectNoBrowserErrors(errors);
});
