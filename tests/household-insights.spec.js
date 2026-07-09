import { test, expect, openPrimary } from './helpers/app.js';

async function addInsightFixtureRows(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const rows = [
      { id: 'insight-repair-may', date: '2026-05-12', merchant: 'Synthetic Home Repair', name: 'Synthetic Home Repair', amount: 40, type: 'Expense', category: 'Home Repair', account: 'Test Checking', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'insight-repair-jun', date: '2026-06-12', merchant: 'Synthetic Home Repair', name: 'Synthetic Home Repair', amount: 42, type: 'Expense', category: 'Home Repair', account: 'Test Checking', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'insight-repair-jul', date: '2026-07-12', merchant: 'Synthetic Home Repair', name: 'Synthetic Home Repair', amount: 180, type: 'Expense', category: 'Home Repair', account: 'Test Checking', owner: 'Test Owner A', reviewed: true, pending: false },
      { id: 'insight-first-seen-jul', date: '2026-07-18', merchant: 'Synthetic Appliance Store', name: 'Synthetic Appliance Store', amount: 400, type: 'Expense', category: 'Household', account: 'Test Credit Card', owner: 'Test Owner B', reviewed: true, pending: false },
      { id: 'insight-pending-jul', date: '2026-07-20', merchant: 'Pending Giant Purchase', name: 'Pending Giant Purchase', amount: 900, type: 'Expense', category: 'Household', account: 'Test Credit Card', owner: 'Test Owner B', reviewed: true, pending: true }
    ];
    vault.transactions.push(...rows);
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

async function openInsights(page) {
  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Insights', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household Insights', exact: true })).toBeVisible();
}

test('explains merchant, category, first-seen, and recurring-cost signals', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for deterministic insight calculations.');
  const { page } = app;
  await addInsightFixtureRows(page);
  await openInsights(page);

  await expect(page.getByText(/Synthetic Home Repair is above its prior typical amount/i)).toBeVisible();
  await expect(page.getByText(/Home Repair spending increased/i)).toBeVisible();
  await expect(page.getByText(/Synthetic Appliance Store is a large first-seen merchant/i)).toBeVisible();
  const streamFlixRow = page.getByRole('row', { name: /StreamFlix/i });
  await expect(streamFlixRow).toBeVisible();
  await expect(streamFlixRow.getByText(/Latest charge is 2\.00 above the prior charge/i)).toBeVisible();
  await expect(page.getByText(/median of earlier normalized-merchant charges/i).first()).toBeVisible();
  await expect(page.getByText(/immediately preceding period of equal length/i).first()).toBeVisible();

  const repairCard = page.locator('.insight-card').filter({ hasText: 'Synthetic Home Repair is above its prior typical amount' });
  await repairCard.getByText(/Source transactions/i).click();
  await expect(repairCard.getByRole('cell', { name: 'Synthetic Home Repair', exact: true }).first()).toBeVisible();
});

test('excludes pending charges from anomaly comparisons and performs no writes', async ({ app }) => {
  const { page } = app;
  await addInsightFixtureRows(page);
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)])));
  const networkWrites = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) networkWrites.push(`${request.method()} ${request.url()}`);
  });

  await openInsights(page);
  await expect(page.getByText(/Pending rows excluded from comparisons: 2/i)).toBeVisible();
  await expect(page.getByText('Pending Giant Purchase')).toHaveCount(0);

  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)])));
  expect(after).toEqual(before);
  expect(networkWrites).toEqual([]);
});

test('feeds insights into v114 reports, the 32-sheet workbook, and the meeting pack', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for generated-file insight coverage.');
  const { page } = app;
  await addInsightFixtureRows(page);
  await openPrimary(page, 'Reports');

  await expect(page.getByRole('heading', { name: 'Household insights', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guided household plan', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Family meeting brief', exact: true })).toBeVisible();
  await expect(page.getByText(/Synthetic Home Repair is above its prior typical amount/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: '32-sheet Vault Workbook', exact: true })).toBeVisible();
  await expect(page.getByText('Household Insights', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Recurring Opportunities', { exact: true }).last()).toBeVisible();

  const [workbook] = await Promise.all([page.waitForEvent('download'), page.locator('#vaultXlsx').click()]);
  expect(workbook.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v114_2026-07-01_to_2026-07-31_.*\.xlsx/i);

  const [meeting] = await Promise.all([page.waitForEvent('download'), page.locator('#meetingMd').click()]);
  expect(meeting.suggestedFilename()).toMatch(/Gringotts_Family_Meeting_Pack_v114_2026-07-01_to_2026-07-31_.*\.md/i);
});

test('keeps the Insights activity surface within every configured viewport', async ({ app }) => {
  const { page } = app;
  await addInsightFixtureRows(page);
  await openInsights(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('.insight-evidence').first()).toBeVisible();
});
