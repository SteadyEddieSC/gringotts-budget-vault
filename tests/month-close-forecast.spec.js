import { test, expect, openPrimary } from './helpers/app.js';

async function openCloseForecast(page) {
  await openPrimary(page, 'Money');
  await page.getByRole('button', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Close & Forecast' })).toBeVisible();
}

async function cleanSelectedMonth(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions = vault.transactions.map((transaction) => {
      if (!String(transaction.date || '').startsWith('2026-07')) return transaction;
      return {
        ...transaction,
        pending: false,
        reviewed: true,
        category: String(transaction.category || '').toLowerCase() === 'other' ? 'Household' : transaction.category
      };
    });
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

test('preserves the corrected subtitle and v110 Money features under v118', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.brand strong')).toHaveText('Mischief Managed. Money Managed');
  await expect(page.locator('.version-text')).toHaveText('v118');
  await openCloseForecast(page);
  await expect(page.getByRole('heading', { name: /Month close — July 2026/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cash-flow forecast' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Debt and promotional APR plan' })).toBeVisible();
});

test('blocks close for pending and unreviewed rows', async ({ app }) => {
  const { page } = app;
  await openCloseForecast(page);
  await expect(page.getByText(/pending transaction must post/i)).toBeVisible();
  await expect(page.getByText(/still need review/i)).toBeVisible();
  await expect(page.locator('#closeMonth')).toBeDisabled();
});

test('reconciles, closes, and reopens without changing transactions', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for verified close writes.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await cleanSelectedMonth(page);
  await openCloseForecast(page);

  const accountCount = await page.locator('.reconciliation-card').count();
  expect(accountCount).toBeGreaterThan(0);
  for (let index = 0; index < accountCount; index += 1) {
    await page.locator('.reconciliation-card').nth(index).locator('[data-save-reconciliation]').click();
    await expect(page.locator('.reconciliation-card').nth(index).locator('.section-meta')).toHaveText('Matched');
  }

  await expect(page.locator('#closeMonth')).toBeEnabled();
  await page.locator('#closeNote').fill('Synthetic July statement close');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#closeMonth').click();
  await expect(page.getByText(/Closed · revision 1/i)).toBeVisible();

  const closed = await page.evaluate(() => ({
    vaultCount: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    close: JSON.parse(localStorage.getItem('gringottsMonthClose.v1'))
  }));
  expect(closed.vaultCount).toBe(12);
  expect(closed.close.months['2026-07'].events.at(-1).type).toBe('close');
  expect(closed.close.months['2026-07'].events.at(-1).snapshot.transactions).toBeUndefined();

  await page.locator('#reopenReason').fill('Statement correction required');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#reopenMonth').click();
  await expect(page.getByText(/^Ready to close$/).first()).toBeVisible();

  const reopened = await page.evaluate(() => ({
    vaultCount: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    events: JSON.parse(localStorage.getItem('gringottsMonthClose.v1')).months['2026-07'].events
  }));
  expect(reopened.vaultCount).toBe(12);
  expect(reopened.events.map((event) => event.type)).toEqual(['close', 'reopen']);
  expect(reopened.events[0].snapshot).toBeTruthy();
  expect(writes).toEqual([]);
});

test('projects recurring bills and paydays and stores forecast settings locally', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for forecast storage coverage.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await openPrimary(page, 'Money');
  await page.getByRole('button', { name: 'Bills & Paydays', exact: true }).click();

  await page.locator('#billName').fill('Synthetic Rent');
  await page.locator('#billAmount').fill('900');
  await page.locator('#billDate').fill('2026-07-05');
  await page.locator('#billFrequency').selectOption('monthly');
  await page.locator('#addBill').click();
  await expect(page.getByText('Synthetic Rent').first()).toBeVisible();

  await page.locator('#payName').fill('Synthetic Paycheck');
  await page.locator('#payAmount').fill('1500');
  await page.locator('#payDate').fill('2026-07-01');
  await page.locator('#payFrequency').selectOption('biweekly');
  await page.locator('#addPay').click();
  await expect(page.getByText('Synthetic Paycheck').first()).toBeVisible();

  await page.getByRole('button', { name: 'Close & Forecast', exact: true }).click();
  await page.locator('#forecastAsOf').fill('2026-07-01');
  await page.locator('#forecastStartingCash').fill('1000');
  await page.locator('#forecastMinimumBuffer').fill('500');
  await page.locator('#forecastFlexibleSpend').fill('300');
  await page.locator('#forecastHorizon').selectOption('60');
  await page.locator('#saveForecastSettings').click();

  await expect(page.getByText('Synthetic Rent').last()).toBeVisible();
  await expect(page.getByText('Synthetic Paycheck').last()).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsForecastSettings.v1')));
  expect(saved).toMatchObject({ asOfDate: '2026-07-01', startingCash: 1000, minimumBuffer: 500, flexibleMonthlySpend: 300, horizonDays: 60 });
  expect(writes).toEqual([]);
});

test('adds a promotional APR debt and records a payment without touching the vault', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for debt-plan storage coverage.');
  const { page } = app;
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(request.url()); });
  await openCloseForecast(page);
  await page.locator('#forecastAsOf').fill('2026-07-01');
  await page.locator('#saveForecastSettings').click();

  await page.locator('#debtName').fill('Synthetic Card');
  await page.locator('#debtBalance').fill('1200');
  await page.locator('#debtApr').fill('24');
  await page.locator('#debtMinimum').fill('40');
  await page.locator('#debtTarget').fill('100');
  await page.locator('#debtPromoApr').fill('0');
  await page.locator('#debtPromoEnd').fill('2026-10-01');
  await page.locator('#saveDebt').click();
  await expect(page.getByRole('heading', { name: /1\. Synthetic Card/i })).toBeVisible();
  await expect(page.getByText(/Promo payoff pace/i)).toBeVisible();

  await page.locator('[data-debt-payment-input]').fill('100');
  await page.locator('[data-debt-payment]').click();

  const result = await page.evaluate(() => ({
    vaultCount: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    debt: JSON.parse(localStorage.getItem('gringottsDebtPlan.v1')).debts[0]
  }));
  expect(result.vaultCount).toBe(12);
  expect(result.debt.balance).toBe(1100);
  expect(result.debt.totalPaymentsRecorded).toBe(100);
  expect(writes).toEqual([]);
});

test('keeps close, forecast, and debt surfaces inside every configured viewport', async ({ app }) => {
  const { page } = app;
  await openCloseForecast(page);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  await expect(page.locator('#forecastHorizon')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#debtPromoEnd')).toHaveAttribute('type', 'date');
});
