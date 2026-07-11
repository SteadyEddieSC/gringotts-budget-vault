import { test, expect, openPrimary } from './helpers/app.js';

async function openReports(page) {
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
  await expect(page.locator('#reportPreviewPage')).toBeVisible();
}

async function selectReportPage(page, value) {
  await page.locator('#reportPreviewPage').selectOption(value);
}

async function addPriorYearRows(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const prior = vault.transactions.map((transaction, index) => ({
      ...transaction,
      transaction_id: `prior_${transaction.transaction_id || transaction.id || index}`,
      id: `prior_${transaction.id || index}`,
      date: String(transaction.date).replace(/^2026-/, '2025-'),
      amount: Number(transaction.amount) * (Number(transaction.amount) > 0 ? 0.9 : 1.05),
      pending: false,
      reviewed: true
    }));
    vault.transactions = [...vault.transactions, ...prior];
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

test('boots v124 and navigates the complete household report preview', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v124/i);
  await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
  await openReports(page);
  const pages = [
    ['summary', 'Family Financial Report'], ['comparison', 'Year-over-year comparison'],
    ['spending', 'Spending by category'], ['goals', 'Goals and Vault Health'],
    ['planning', 'Month close, forecast, and debt'], ['insights', 'Household insights'],
    ['plan', 'Guided household plan'], ['meeting', 'Family meeting brief']
  ];
  for (const [value, heading] of pages) {
    await selectReportPage(page, value);
    const visiblePage = page.locator('.report-preview-deck > .report-page:not([hidden])');
    await expect(visiblePage.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/41-sheet Vault Workbook/i)).toBeVisible();
  for (const sheet of ['Guided Plan', 'Planning History', 'Import Receipts', 'Receipt Integrity', 'Batch Lineage', 'Account Inventory', 'Account Cleanup Plan', 'Recurring Decisions', 'Recurring Decision History', 'Scenario Comparisons', 'Scenario Assumptions']) {
    await expect(page.getByText(sheet, { exact: true }).last()).toBeVisible();
  }
});

test('saves a custom range and compares equivalent prior-year dates without network writes', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for saved range behavior.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await addPriorYearRows(page);
  await openReports(page);
  await page.locator('#reportPreset').selectOption('custom');
  await page.locator('#reportStart').fill('2026-05-01');
  await page.locator('#reportEnd').fill('2026-07-31');
  await page.locator('#reportComparePrior').check();
  await page.locator('#applyReportRange').click();
  await expect(page.locator('#reportPreset')).toHaveValue('custom');
  await page.locator('#reportPreviewPage').selectOption('comparison');
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(6);
  await expect(page.getByText(/equivalent prior-year range/i).first()).toBeVisible();
  await page.locator('#reportPreviewPage').selectOption('plan');
  await expect(page.locator('.guided-plan-report').getByRole('heading', { name: 'Guided household plan', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recurring-cost decisions', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Household Scenario Discussion', exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsReportRange.v1')));
  expect(saved).toMatchObject({ preset: 'custom', start: '2026-05-01', end: '2026-07-31', comparePriorYear: true });
  expect(writes).toEqual([]);
});

test('resolves year-to-date from the selected report month', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for preset persistence.');
  const { page } = app;
  await openReports(page);
  await page.locator('#reportPreset').selectOption('ytd');
  await page.locator('#applyReportRange').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsReportRange.v1')));
  expect(saved).toMatchObject({ preset: 'ytd', start: '2026-01-01', end: '2026-07-31' });
  await expect(page.locator('#reportStart')).toHaveValue('2026-01-01');
  await expect(page.locator('#reportEnd')).toHaveValue('2026-07-31');
});

test('includes local goal, health, forecast, debt, and guided plan context', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for report context coverage.');
  const { page } = app;
  await page.evaluate(() => {
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({ goals: [{ id: 'goal_report_test', name: 'Synthetic Emergency Fund', type: 'Emergency Fund', target: 5000, current: 1250, monthlyContribution: 25, dueDate: '2026-09-01', notes: 'Fictional Playwright data', archived: false }] }));
    localStorage.setItem('gringottsForecastSettings.v1', JSON.stringify({ asOfDate: '2026-07-01', startingCash: 2000, minimumBuffer: 500, flexibleMonthlySpend: 300, horizonDays: 60 }));
    localStorage.setItem('gringottsDebtPlan.v1', JSON.stringify({ debts: [{ id: 'debt_report_test', name: 'Synthetic Promo Card', balance: 1200, apr: 24, minimumPayment: 40, targetPayment: 150, promoApr: 0, promoEnd: '2026-10-01' }], monthlyExtra: 50 }));
  });
  await openReports(page);
  await page.locator('#reportPreviewPage').selectOption('goals');
  await expect(page.getByText('Synthetic Emergency Fund').first()).toBeVisible();
  await page.locator('#reportPreviewPage').selectOption('planning');
  await expect(page.getByRole('cell', { name: 'Synthetic Promo Card', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Household scenario comparisons', exact: true })).toBeVisible();
});

test('downloads the 41-sheet workbook, guided plan, and range CSV', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for generated-file smoke coverage.');
  const { page } = app;
  await openReports(page);
  const [workbook] = await Promise.all([page.waitForEvent('download'), page.locator('#vaultXlsx').click()]);
  expect(workbook.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v124_2026-07-01_to_2026-07-31_.*\.xlsx/i);
  const [plan] = await Promise.all([page.waitForEvent('download'), page.locator('#planMd').click()]);
  expect(plan.suggestedFilename()).toMatch(/Gringotts_Guided_Household_Plan_v124_2026-07_.*\.md/i);
  const [csv] = await Promise.all([page.waitForEvent('download'), page.locator('#familyCsv').click()]);
  expect(csv.suggestedFilename()).toMatch(/Income_Expenses_Range_2026-07-01_to_2026-07-31_.*\.csv/i);
});

test('uses eight report pages for print and hides screen-only controls', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.range-controls')).toBeHidden();
  await expect(page.locator('.report-preview-toolbar')).toBeHidden();
  await expect(page.locator('.report-page')).toHaveCount(8);
  for (let index = 0; index < 8; index += 1) await expect(page.locator('.report-page').nth(index)).toBeVisible();
  await expect(page.locator('.v123-recurring-report-section').first()).toBeVisible();
  await expect(page.locator('.v124-scenario-report-section').first()).toBeVisible();
});

test('keeps reporting inside every configured viewport', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('#reportPreset')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reportPreviewPage')).toHaveJSProperty('tagName', 'SELECT');
});
