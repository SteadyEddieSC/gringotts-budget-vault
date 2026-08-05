import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { bootQualityPage, expectNoBrowserErrors, openPrimary } from './helpers.js';
import { currentReleaseName, currentTitle, currentVersion } from '../tests/helpers/release.js';

const blockingImpacts = new Set(['critical', 'serious']);

async function scan(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  const blocking = results.violations.filter((violation) => blockingImpacts.has(violation.impact));
  expect(blocking, `${label} serious or critical axe violations`).toEqual([]);
}

test('axe scans the manifest-driven v132 roadmap on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v132 infrastructure coverage runs once.');
  const errors = await bootQualityPage(page);
  await expect(page).toHaveTitle(currentTitle);
  await expect(page.locator('.version-text')).toHaveText(currentVersion);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Roadmap', exact:true }).click();
  await expect(page.getByRole('heading', { name:`${currentVersion} — ${currentReleaseName}`, exact:true })).toBeVisible();
  await scan(page, 'Tools — manifest-driven v132 roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans retained diagnostics under v132 on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone v132 infrastructure coverage runs in the mobile project.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name:'Diagnostics', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Performance & maintenance budgets', exact:true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await scan(page, 'Mobile Tools — retained diagnostics under v132');
  await expectNoBrowserErrors(errors);
});
