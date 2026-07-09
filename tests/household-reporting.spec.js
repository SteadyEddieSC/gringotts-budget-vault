import { test, expect, openPrimary } from './helpers/app.js';

async function openReports(page) {
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: 'Reports Center' })).toBeVisible();
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

test('boots v114 and renders the complete guided household report preview', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v114/i);
  await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
  await openReports(page);
  for (const heading of ['Family Financial Report', 'Year-over-year comparison', 'Goals and Vault Health', 'Month close, forecast, and debt', 'Household insights', 'Guided household plan', 'Family meeting brief']) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/32 sheets/i)).toBeVisible();
  await expect(page.getByText('Guided Plan', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Planning History', { exact: true }).last()).toBeVisible();
});

test('saves a custom range and compares equivalent prior-year dates without network writes', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for saved range behavior.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await addPriorYearRows(page);
  await openReports(page);

  await page.locator('#reportPreset').selectOption('custom');
  await expect(page.locator('#reportStart')).toBeEnabled();
  await expect(page.locator('#reportEnd')).toBeEnabled();
  await page.locator('#reportStart').fill('2026-05-01');
  await page.locator('#reportEnd').fill('2026-07-31');
  await page.locator('#reportComparePrior').check();
  await page.locator('#applyReportRange').click();

  await expect(page.locator('#reportPreset')).toHaveValue('custom');
  await expect(page.locator('#reportStart')).toHaveValue('2026-05-01');
  await expect(page.locator('#reportEnd')).toHaveValue('2026-07-31');
  await expect(page.locator('.comparison-table tbody tr')).toHaveCount(6);
  await expect(page.getByText(/equivalent prior-year range/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Guided household plan', exact: true })).toBeVisible();

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
  await expect(page.locator('#reportStart')).toBeDisabled();
  await expect(page.locator('#reportEnd')).toBeDisabled();
});

test('includes local goal, health, forecast, debt, and guided plan context', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for report context coverage.');
  const { page } = app;
  await page.evaluate(() => {
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({ goals: [{
      id: 'goal_report_test', name: 'Synthetic Emergency Fund', type: 'Emergency Fund',
      target: 5000, current: 1250, monthlyContribution: 25, dueDate: '2026-09-01',
      notes: 'Fictional Playwright data', archived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }] }));
    localStorage.setItem('gringottsForecastSettings.v1', JSON.stringify({
      asOfDate: '2026-07-01', startingCash: 2000, minimumBuffer: 500,
      flexibleMonthlySpend: 300, horizonDays: 60
    }));
    localStorage.setItem('gringottsDebtPlan.v1', JSON.stringify({ debts: [{
      id: 'debt_report_test', name: 'Synthetic Promo Card', balance: 1200, apr: 24,
      minimumPayment: 40, targetPayment: 150, promoApr: 0, promoEnd: '2026-10-01',
      notes: 'Fictional Playwright data', totalPaymentsRecorded: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }], monthlyExtra: 50 }));
  });
  await openReports(page);
  await expect(page.getByText('Synthetic Emergency Fund').first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Synthetic Promo Card', exact: true })).toBeVisible();
  await expect(page.getByText(/Vault Health/i).first()).toBeVisible();
  await expect(page.getByText(/Forecast:/i)).toBeVisible();
  await expect(page.getByText(/Current priority: Synthetic Promo Card/i)).toBeVisible();
  await expect(page.getByText(/Review the contribution pace for Synthetic Emergency Fund/i).first()).toBeVisible();
});

test('downloads the 32-sheet workbook, guided plan, and range CSV', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for generated-file smoke coverage.');
  const { page } = app;
  await openReports(page);
  const [workbook] = await Promise.all([page.waitForEvent('download'), page.locator('#vaultXlsx').click()]);
  expect(workbook.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v114_2026-07-01_to_2026-07-31_.*\.xlsx/i);

  const [plan] = await Promise.all([page.waitForEvent('download'), page.locator('#planMd').click()]);
  expect(plan.suggestedFilename()).toMatch(/Gringotts_Guided_Household_Plan_v114_2026-07_.*\.md/i);

  const [csv] = await Promise.all([page.waitForEvent('download'), page.locator('#familyCsv').click()]);
  expect(csv.suggestedFilename()).toMatch(/Income_Expenses_Range_2026-07-01_to_2026-07-31_.*\.csv/i);
});

test('uses eight report pages for print and hides screen-only controls', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.range-controls')).toBeHidden();
  await expect(page.locator('.report-page')).toHaveCount(8);
  await expect(page.locator('.guided-plan-report')).toBeVisible();
});

test('keeps Guided Household Planning inside every configured viewport', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('#reportPreset')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reportStart')).toHaveAttribute('type', 'date');
  await expect(page.locator('#reportEnd')).toHaveAttribute('type', 'date');
});
