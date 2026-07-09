import { test, expect, openPrimary } from './helpers/app.js';

test('settles report label normalization without a recursive mutation loop', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for deterministic observer stability.');
  const { page } = app;
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: '30-sheet Vault Workbook', exact: true })).toBeVisible();

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

  expect(mutationCount, 'The v113 label observer must settle instead of rewriting identical text forever.').toBe(0);
});
