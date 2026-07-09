import { test, expect, openPrimary } from './helpers/app.js';

async function openPlan(page) {
  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guided Household Plan', exact: true })).toBeVisible();
}

async function addPlanningFixture(page) {
  await page.evaluate(() => {
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({ goals: [{
      id: 'guided-goal', name: 'Synthetic Repair Fund', type: 'Sinking Fund',
      target: 2400, current: 300, monthlyContribution: 25, dueDate: '2026-09-01',
      notes: 'Fictional planning fixture', archived: false,
      createdAt: '2026-06-01T12:00:00.000Z', updatedAt: '2026-06-01T12:00:00.000Z'
    }] }));
    localStorage.setItem('gringottsForecastSettings.v1', JSON.stringify({
      asOfDate: '2026-07-01', startingCash: 500, minimumBuffer: 400,
      flexibleMonthlySpend: 600, horizonDays: 60
    }));
    localStorage.setItem('gringottsDebtPlan.v1', JSON.stringify({ debts: [{
      id: 'guided-debt', name: 'Synthetic Promo Card', balance: 1200, apr: 24,
      minimumPayment: 40, targetPayment: 100, promoApr: 0, promoEnd: '2026-10-01',
      notes: 'Fictional planning fixture', totalPaymentsRecorded: 0,
      createdAt: '2026-06-01T12:00:00.000Z', updatedAt: '2026-06-01T12:00:00.000Z'
    }], monthlyExtra: 50 }));
  });
}

test('generates explainable actions without writing planning state', async ({ app }) => {
  const { page } = app;
  await addPlanningFixture(page);
  const beforeVault = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openPlan(page);

  await expect(page.getByText(/Review 1 selected-month transaction/i)).toBeVisible();
  await expect(page.getByText(/Recheck 1 pending transaction/i)).toBeVisible();
  await expect(page.getByText(/Add recurring bills and paydays/i)).toBeVisible();
  await expect(page.getByText(/Review the contribution pace for Synthetic Repair Fund/i)).toBeVisible();
  await expect(page.getByText(/Decide how to close the Synthetic Promo Card promotional payoff gap/i)).toBeVisible();
  await expect(page.getByText(/Why this appears:/i).first()).toBeVisible();
  await expect(page.getByText(/Recommended next step:/i).first()).toBeVisible();

  const state = await page.evaluate(() => ({
    guidedPlan: localStorage.getItem('gringottsGuidedPlan.v1'),
    vault: localStorage.getItem('gringottsBudgetVault.latest')
  }));
  expect(state.guidedPlan).toBeNull();
  expect(state.vault).toBe(beforeVault);
});

test('saves verified checklist metadata separately without changing transactions', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for explicit local planning writes.');
  const { page } = app;
  await addPlanningFixture(page);
  await openPlan(page);

  const card = page.locator('[data-plan-item]').filter({ hasText: /Review 1 selected-month transaction/i });
  await card.locator('.plan-status').selectOption('planned');
  await card.locator('.plan-owner').fill('Synthetic Household');
  await card.locator('.plan-date').fill('2026-07-25');
  await card.locator('.plan-notes').fill('Review during the fictional monthly meeting.');
  const vaultBefore = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await card.locator('[data-save-plan]').click();

  await expect(page.getByText(/Plan item saved as planned/i)).toBeVisible();
  const savedCard = page.locator('[data-plan-item]').filter({ hasText: /Review 1 selected-month transaction/i });
  await expect(savedCard.locator('.plan-status')).toHaveValue('planned');
  await expect(savedCard.locator('.plan-owner')).toHaveValue('Synthetic Household');
  await expect(savedCard.locator('.plan-date')).toHaveValue('2026-07-25');
  await expect(savedCard.locator('.plan-notes')).toHaveValue('Review during the fictional monthly meeting.');

  const result = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    plan: JSON.parse(localStorage.getItem('gringottsGuidedPlan.v1'))
  }));
  expect(result.vault).toBe(vaultBefore);
  const records = Object.values(result.plan.items);
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    status: 'planned', owner: 'Synthetic Household', targetDate: '2026-07-25',
    notes: 'Review during the fictional monthly meeting.'
  });
  expect(result.plan.history).toHaveLength(1);
  expect(result.plan.history[0]).toMatchObject({ fromStatus: 'not-started', toStatus: 'planned' });
});

test('moves an explicitly completed current item into the resolved section', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for checklist state transitions.');
  const { page } = app;
  await openPlan(page);
  const card = page.locator('[data-plan-item]').filter({ hasText: /Review 1 selected-month transaction/i });
  await card.locator('.plan-status').selectOption('done');
  await card.locator('[data-save-plan]').click();

  const resolved = page.locator('.resolved-plan-items');
  await expect(resolved).toBeVisible();
  await resolved.locator('summary').click();
  await expect(resolved.getByText(/Review 1 selected-month transaction/i)).toBeVisible();
  await expect(resolved.locator('.plan-status')).toHaveValue('done');
});

test('opens the source workflow from a guided action', async ({ app }) => {
  const { page } = app;
  await openPlan(page);
  const card = page.locator('[data-plan-item]').filter({ hasText: /Review 1 selected-month transaction/i });
  await card.getByRole('button', { name: 'Open Review Queue', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Review Queue', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: /Review Queue/i }).first()).toBeVisible();
});

test('does not make network writes and stays inside every configured viewport', async ({ app }) => {
  const { page } = app;
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writes.push(`${request.method()} ${request.url()}`);
  });
  await openPlan(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('.guided-plan-form').first()).toBeVisible();
  expect(writes).toEqual([]);
});
