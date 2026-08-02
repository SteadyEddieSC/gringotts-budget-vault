import { test, expect, openPrimary } from './helpers/app.js';

async function seedCloseHistory(page) {
  await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions.push(
      { id: 'v125-may-income', date: '2026-05-01', name: 'Synthetic Income', amount: -5200, type: 'Income', category: 'Income', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-may-housing', date: '2026-05-03', name: 'Synthetic Housing', amount: 1400, type: 'Expense', category: 'Housing', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-may-variable', date: '2026-05-08', name: 'Synthetic Variable', amount: 600, type: 'Expense', category: 'Shopping', account: 'Synthetic Card', reviewed: true, pending: false },
      { id: 'v125-may-transfer', date: '2026-05-10', name: 'Synthetic Transfer', amount: 900, type: 'Transfer', category: 'Transfer', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-jun-income', date: '2026-06-01', name: 'Synthetic Income', amount: -5400, type: 'Income', category: 'Income', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-jun-housing', date: '2026-06-03', name: 'Synthetic Housing', amount: 1400, type: 'Expense', category: 'Housing', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-jun-variable', date: '2026-06-08', name: 'Synthetic Variable', amount: 300, type: 'Expense', category: 'Shopping', account: 'Synthetic Card', reviewed: true, pending: false },
      { id: 'v125-jun-transfer', date: '2026-06-10', name: 'Synthetic Transfer', amount: -500, type: 'Transfer', category: 'Transfer', account: 'Synthetic Checking', reviewed: true, pending: false },
      { id: 'v125-jun-pending', date: '2026-06-28', name: 'Synthetic Pending', amount: 1000, type: 'Expense', category: 'Shopping', account: 'Synthetic Card', reviewed: true, pending: true }
    );
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    localStorage.setItem('gringottsMonthClose.v1', JSON.stringify({
      months: {
        '2026-05': { events: [{ type: 'close', timestamp: '2026-06-02T00:00:00Z', snapshot: { transactionCount: 4, metrics: { income: 5200, spend: 2000, transfers: 900, net: 3200, pending: 0, review: 0 }, categories: [{ category: 'Housing', amount: 1400 }, { category: 'Shopping', amount: 600 }], accounts: [{ earliest: '2026-05-01', latest: '2026-05-10' }, { earliest: '2026-05-08', latest: '2026-05-08' }] } }] },
        '2026-06': { events: [{ type: 'close', timestamp: '2026-07-02T00:00:00Z', snapshot: { transactionCount: 4, metrics: { income: 5400, spend: 1700, transfers: 500, net: 3700, pending: 0, review: 0 }, categories: [{ category: 'Housing', amount: 1400 }, { category: 'Shopping', amount: 300 }], accounts: [{ earliest: '2026-06-01', latest: '2026-06-10' }, { earliest: '2026-06-08', latest: '2026-06-08' }] } }] }
      }
    }));
    localStorage.setItem('gringottsCleanMonth.v1', '2026-06');
  });
}

test('explains a closed month with transfer-neutral aggregate drivers', async ({ app }) => {
  const { page } = app;
  await seedCloseHistory(page);
  await page.reload();
  await expect(page.locator('.version-text')).toContainText(/^v126/);
  await openPrimary(page, 'Money');
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Close history & trend explainability', exact: true })).toBeVisible();
  await expect(page.locator('.close-driver-table')).toBeVisible();
  await expect(page.locator('.close-trend-card')).toContainText('Transfers excluded');
  await expect(page.locator('.close-trend-card')).toContainText(/pending excluded/i);
  await expect(page.locator('.close-trend-card')).not.toContainText('Synthetic Income');
  await expect(page.locator('.close-trend-card')).not.toContainText('Synthetic Checking');
});

test('changes review month without writing to the vault', async ({ app }) => {
  const { page } = app;
  await seedCloseHistory(page);
  await page.reload();
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page, 'Money');
  await page.getByRole('tab', { name: 'Close & Forecast', exact: true }).click();
  await page.locator('#closeTrendMonth').selectOption('2026-05');
  await expect(page.locator('#closeTrendMonth')).toHaveValue('2026-05');
  const after = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  expect(after).toBe(before);
});

test('keeps the close-trend report hidden until selected and contained on phone', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Reports');
  const trendReport = page.locator('.v125-close-trend-report');
  await expect(trendReport).toBeHidden();
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator('#reportPreviewPage').selectOption('close-trends');
  await expect(trendReport).toBeVisible();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
