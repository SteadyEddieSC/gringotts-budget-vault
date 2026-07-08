import { test, expect } from '@playwright/test';
import { bootQualityPage, expectNoBrowserErrors, openPrimary } from './helpers.js';

async function settleVisualState(page) {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

test('desktop dashboard visual baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Desktop baseline belongs to the desktop quality project.');
  const errors = await bootQualityPage(page);
  await settleVisualState(page);
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.005
  });
  await expectNoBrowserErrors(errors);
});

test('phone reports visual baseline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone baseline belongs to the mobile quality project.');
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Reports');
  await settleVisualState(page);
  await expect(page).toHaveScreenshot('reports-phone.png', {
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.008,
    mask: [page.locator('.report-quality-line span:last-child')]
  });
  await expectNoBrowserErrors(errors);
});
