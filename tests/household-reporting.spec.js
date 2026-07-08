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

test('boots v111 and renders the complete Household Reporting III preview', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v111/i);
  await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
  await openReports(page);
  await expect(page.getByRole('heading', { name: 'Family Financial Report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Year-over-year comparison' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Goals and Vault Health' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Month close, forecast, and debt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Family meeting brief' })).toBeVisible();
  await expect(page.getByText(/28 sheets/i)).toBeVisible();
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

test('includes local goal, health, forecast, and debt context in the family report', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for report context coverage.');
  const { page } = app;
  await page.evaluate(() => {
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({ goals: [{
      id: 'goal_report_test', name: 'Synthetic Emergency Fund', type: 'Emergency Fund',
      target: 5000, current: 1250, monthlyContribution: 250, dueDate: '2027-01-01',
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
  await expect(page.getByText('Synthetic Emergency Fund')).toBeVisible();
  await expect(page.getByText('Synthetic Promo Card')).toBeVisible();
  await expect(page.getByText(/Vault Health/i).first()).toBeVisible();
  await expect(page.getByText(/Forecast:/i)).toBeVisible();
  await expect(page.getByText(/Current priority: Synthetic Promo Card/i)).toBeVisible();
});

test('downloads the 28-sheet workbook and range CSV', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for generated-file smoke coverage.');
  const { page } = app;
  await openReports(page);
  const [workbook] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#vaultXlsx').click()
  ]);
  expect(workbook.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v111_2026-07-01_to_2026-07-31_.*\.xlsx/i);

  const [csv] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#familyCsv').click()
  ]);
  expect(csv.suggestedFilename()).toMatch(/Income_Expenses_Range_2026-07-01_to_2026-07-31_.*\.csv/i);
});

test('uses report pages for print and hides screen-only controls', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.range-controls')).toBeHidden();
  await expect(page.locator('.report-page')).toHaveCount(6);
  await expect(page.locator('.report-page').first()).toBeVisible();
});

test('keeps Household Reporting III inside every configured viewport', async ({ app }) => {
  const { page } = app;
  await openReports(page);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  await expect(page.locator('#reportPreset')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#reportStart')).toHaveAttribute('type', 'date');
  await expect(page.locator('#reportEnd')).toHaveAttribute('type', 'date');
});
