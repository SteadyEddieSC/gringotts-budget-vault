import { test, expect, openPrimary } from './helpers/app.js';

async function seedScenarioContext(page) {
  await page.evaluate(() => {
    localStorage.setItem('gringottsForecastSettings.v1', JSON.stringify({
      asOfDate: '2026-07-01',
      startingCash: 1800,
      minimumBuffer: 600,
      flexibleMonthlySpend: 450,
      horizonDays: 60,
      updatedAt: '2026-07-11T12:00:00.000Z'
    }));
    localStorage.setItem('gringottsDebtPlan.v1', JSON.stringify({
      debts: [{
        id: 'scenario-debt', name: 'Synthetic Card', balance: 2400, apr: 18,
        minimumPayment: 80, targetPayment: 150, promoApr: null, promoEnd: '',
        notes: 'Fictional scenario fixture', totalPaymentsRecorded: 0,
        createdAt: '2026-07-01T12:00:00.000Z', updatedAt: '2026-07-01T12:00:00.000Z'
      }], monthlyExtra: 0, updatedAt: '2026-07-01T12:00:00.000Z'
    }));
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({
      goals: [{
        id: 'scenario-goal', name: 'Synthetic Reserve', type: 'Emergency Fund',
        target: 5000, current: 1000, monthlyContribution: 200, dueDate: '2027-12-01',
        notes: 'Fictional scenario fixture', archived: false,
        createdAt: '2026-07-01T12:00:00.000Z', updatedAt: '2026-07-01T12:00:00.000Z'
      }], updatedAt: '2026-07-01T12:00:00.000Z'
    }));
  });
}

async function openScenario(page) {
  await seedScenarioContext(page);
  await openPrimary(page, 'Money');
  await page.getByRole('button', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household scenario comparison', exact: true })).toBeVisible();
}

async function saveScenario(page, name = 'Synthetic resilience option') {
  await page.locator('#scenarioName').fill(name);
  await page.locator('#scenarioMonthlyIncomeDelta').fill('300');
  await page.locator('#scenarioRecurringSavings').fill('75');
  await page.locator('#scenarioFlexibleSpendDelta').fill('-50');
  await page.locator('#scenarioDebtExtra').fill('125');
  await page.locator('#scenarioGoalExtra').fill('100');
  await page.locator('#scenarioNotes').fill('Fictional assumptions for Playwright coverage.');
  await page.locator('#saveScenario').click();
  await expect(page.locator('#toast')).toContainText('Scenario assumptions saved and verified');
}

test('previews a side-by-side scenario without an apply action', async ({ app }) => {
  const { page } = app;
  await openScenario(page);
  await expect(page.locator('.scenario-comparison-table tbody tr')).toHaveCount(7);
  await expect(page.getByRole('cell', { name: 'Ending cash', exact: true })).toBeVisible();
  await page.locator('#scenarioMonthlyIncomeDelta').fill('400');
  await page.locator('#scenarioOneTimeExpense').fill('500');
  await page.locator('#scenarioOneTimeDate').fill('2026-07-20');
  await page.locator('#previewScenario').click();
  await expect(page.locator('#toast')).toContainText('Scenario preview refreshed in memory');
  await expect(page.getByText(/Across 60 days/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Apply Scenario|Apply Plan|Change Forecast/i })).toHaveCount(0);
  await expect(page.getByText(/There is no Apply Scenario action/i)).toBeVisible();
});

test('saves bounded scenario metadata without changing financial stores', async ({ app }) => {
  const { page } = app;
  await openScenario(page);
  const before = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    forecast: localStorage.getItem('gringottsForecastSettings.v1'),
    debt: localStorage.getItem('gringottsDebtPlan.v1'),
    goals: localStorage.getItem('gringottsGoals.v1'),
    recurring: localStorage.getItem('gringottsRecurringDecisions.v1')
  }));
  await saveScenario(page);
  const after = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    forecast: localStorage.getItem('gringottsForecastSettings.v1'),
    debt: localStorage.getItem('gringottsDebtPlan.v1'),
    goals: localStorage.getItem('gringottsGoals.v1'),
    recurring: localStorage.getItem('gringottsRecurringDecisions.v1'),
    scenarios: JSON.parse(localStorage.getItem('gringottsScenarioComparisons.v1') || '{}')
  }));
  expect(after.vault).toBe(before.vault);
  expect(after.forecast).toBe(before.forecast);
  expect(after.debt).toBe(before.debt);
  expect(after.goals).toBe(before.goals);
  expect(after.recurring).toBe(before.recurring);
  expect(after.scenarios.items).toHaveLength(1);
  expect(after.scenarios.items[0]).toMatchObject({
    name: 'Synthetic resilience option',
    assumptions: {
      monthlyIncomeDelta: 300,
      monthlyRecurringSavings: 75,
      flexibleSpendDelta: -50,
      extraDebtPaymentMonthly: 125,
      extraGoalContributionMonthly: 100
    }
  });
  expect(JSON.stringify(after.scenarios)).not.toMatch(/transactions|merchant|account|balance|credential|token/i);
});

test('adds saved scenarios to Guided Plan and report discussion surfaces', async ({ app }) => {
  const { page } = app;
  await openScenario(page);
  await saveScenario(page, 'Synthetic family discussion');

  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scenario discussion', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Review scenario: Synthetic family discussion/i })).toBeVisible();

  await openPrimary(page, 'Reports');
  await page.locator('#reportPreviewPage').selectOption('planning');
  await expect(page.getByRole('heading', { name: 'Household scenario comparisons', exact: true })).toBeVisible();
  await page.locator('#reportPreviewPage').selectOption('meeting');
  await expect(page.getByRole('heading', { name: 'Scenario conversation', exact: true })).toBeVisible();
});

test('exports a 41-sheet v124 workbook and shows the v124 through v130 roadmap', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for workbook and roadmap release coverage.');
  const { page } = app;
  await openScenario(page);
  await saveScenario(page);
  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: '41-sheet Vault Workbook', exact: true })).toBeVisible();
  await expect(page.getByText('Scenario Comparisons', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Scenario Assumptions', { exact: true }).last()).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#vaultXlsx').click()]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v124_.*\.xlsx/i);

  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();
  await expect(page.getByText(/v125 is the strongest next commitment/i)).toBeVisible();
});

test('keeps scenario, Guided Plan, reports, and Roadmap inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openScenario(page);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await openPrimary(page, 'Reports');
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
