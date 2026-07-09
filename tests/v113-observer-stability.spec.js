import { test, expect, openPrimary } from './helpers/app.js';

test('settles the v114 Reports Center without a recursive mutation loop', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for deterministic render stability.');
  const { page } = app;
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: '32-sheet Vault Workbook', exact: true })).toBeVisible();
  await expect(page.locator('.guided-plan-report').getByRole('heading', { name: 'Guided household plan', exact: true })).toBeVisible();

  const mutationCount = await page.evaluate(() => new Promise((resolve) => {
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

  expect(mutationCount, 'The Reports Center must settle instead of continuously rewriting identical content.').toBe(0);
});
