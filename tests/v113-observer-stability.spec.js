import { test, expect, openPrimary } from './helpers/app.js';

async function settledMutationCount(page) {
  return page.evaluate(() => new Promise((resolve) => {
    const main = document.getElementById('main');
    let count = 0;
    const observer = new MutationObserver((records) => {
      count += records.filter((record) => record.type === 'childList').length;
    });
    observer.observe(main, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(count);
    }, 300);
  }));
}

test('settles the v117 Reports architecture without a recursive mutation loop', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for deterministic render stability.');
  const { page } = app;
  await openPrimary(page, 'Reports');
  await expect(page.locator('#reportPreviewPage')).toBeVisible();
  await expect(page.getByRole('heading', { name: '33-sheet Vault Workbook', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Family Financial Report', exact: true })).toBeVisible();
  expect(await settledMutationCount(page), 'The Reports page must settle instead of continuously rewriting identical content.').toBe(0);

  await page.locator('#reportPreviewPage').selectOption('plan');
  await expect(page.locator('.guided-plan-report').getByRole('heading', { name: 'Guided household plan', exact: true })).toBeVisible();
  expect(await settledMutationCount(page), 'Changing the report preview must settle after the explicit selection.').toBe(0);
});

test('settles import, restore, profiles, and field validation without a recursive mutation loop', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for deterministic render stability.');
  const { page } = app;
  await openPrimary(page, 'Tools');
  await expect(page.locator('.v116-task-switcher')).toBeVisible();
  expect(await settledMutationCount(page)).toBe(0);

  await page.locator('#bankImportFile').setInputFiles({
    name: 'observer-profile.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Date,Description,Amount,Status,Reference,Memo\n07/10/2026,Synthetic Fuel,-45.67,Posted,observer-1,Fictional row')
  });
  await expect(page.locator('#importProfileCard')).toBeVisible();
  await expect(page.locator('.field-validation')).toHaveCount(11);
  expect(await settledMutationCount(page), 'The profile and validation enhancement must settle after insertion.').toBe(0);

  await page.getByRole('button', { name: /Restore full vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Full vault restore', exact: true })).toBeVisible();
  expect(await settledMutationCount(page)).toBe(0);
});
