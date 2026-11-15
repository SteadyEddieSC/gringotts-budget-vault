import { test, expect, openPrimary } from './helpers/app.js';

test('BENCHMARK-001 monthly category budget is explicit local planning state and does not mutate the vault', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for benchmark planning-state evidence.');
  const { page } = app;
  const networkWrites = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) networkWrites.push(`${request.method()} ${request.url()}`);
  });

  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name: 'Add or update a category budget', exact: true })).toBeVisible();
  await page.locator('#budgetCategory').fill('Groceries');
  await page.locator('#budgetAmount').fill('625');
  await page.locator('#saveBudget').click();
  await expect(page.locator('#toast')).toContainText(/Budget saved/i);

  const state = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    budgets: JSON.parse(localStorage.getItem('gringottsBudgets.v1') || 'null')
  }));
  expect(state.vault).toBe(vaultBefore);
  expect(state.budgets.categories.Groceries).toBe(625);
  await expect(page.locator('.budget-table')).toContainText('Groceries');
  await expect(page.locator('.budget-table')).toContainText('$625.00');
  expect(networkWrites).toEqual([]);
});

test('BENCHMARK-001 monthly budget surface remains contained at phone width', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Money');
  await expect(page.locator('#budgetCategory')).toBeVisible();
  await expect(page.locator('#budgetAmount')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
