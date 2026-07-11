import { test, expect, openPrimary } from './helpers/app.js';

async function seedRecurringEvidence(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions = vault.transactions.filter((transaction) => !String(transaction.id || '').startsWith('v123-recurring-'));
    vault.transactions.push(
      { id: 'v123-recurring-stream-1', date: '2026-03-05', name: 'Synthetic Stream Plan', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A', pending: false, reviewed: true },
      { id: 'v123-recurring-stream-2', date: '2026-04-05', name: 'Synthetic Stream Plan', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A', pending: false, reviewed: true },
      { id: 'v123-recurring-stream-3', date: '2026-05-05', name: 'Synthetic Stream Plan', amount: 14, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A', pending: false, reviewed: true },
      { id: 'v123-recurring-stream-pending', date: '2026-06-05', name: 'Synthetic Stream Plan', amount: 14, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A', pending: true, reviewed: true },
      { id: 'v123-recurring-utility-1', date: '2026-03-15', name: 'Synthetic Utility Plan', amount: 100, type: 'Expense', category: 'Utilities', account: 'Test Checking', owner: 'Adult B', pending: false, reviewed: true },
      { id: 'v123-recurring-utility-2', date: '2026-04-15', name: 'Synthetic Utility Plan', amount: 118, type: 'Expense', category: 'Utilities', account: 'Test Checking', owner: 'Adult B', pending: false, reviewed: true },
      { id: 'v123-recurring-one-time', date: '2026-05-22', name: 'Synthetic One Time Appliance', amount: 500, type: 'Expense', category: 'Household', account: 'Family Card 1234', owner: 'Adult A', pending: false, reviewed: true }
    );
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

async function openRecurring(page) {
  await seedRecurringEvidence(page);
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name: 'Recurring cost decisions', exact: true })).toBeVisible();
}

async function selectCandidate(page, merchantName) {
  const option = page.locator('#recurringDecisionCandidate option').filter({ hasText: merchantName }).first();
  const value = await option.getAttribute('value');
  expect(value, `Recurring candidate option for ${merchantName}`).toBeTruthy();
  await page.locator('#recurringDecisionCandidate').selectOption(value);
}

test('shows evidence-backed recurring costs and excludes pending and one-time noise', async ({ app }) => {
  const { page } = app;
  await openRecurring(page);
  await expect(page.locator('.recurring-decision-workspace')).toBeVisible();
  await expect(page.locator('[data-v123-legacy-recurring-hidden="true"]')).toBeHidden();
  await expect(page.locator('.recurring-decision-workspace > .section-title-row .section-meta')).toContainText(/pending excluded/i);
  await expect(page.getByRole('option', { name: /Synthetic Stream Plan/i })).toBeAttached();
  await expect(page.getByRole('option', { name: /Synthetic Utility Plan/i })).toBeAttached();
  await expect(page.getByText('Synthetic One Time Appliance', { exact: true })).toHaveCount(0);
  await selectCandidate(page, 'Synthetic Stream Plan');
  await expect(page.getByRole('cell', { name: 'Family Card ••••1234', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: /monthly · about 31 days/i })).toBeVisible();
  await expect(page.getByText(/Only posted expense rows provide evidence/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Cancel service|Contact merchant|Change payment|Send email/i })).toHaveCount(0);
});

test('saves bounded decision metadata without changing the vault', async ({ app }) => {
  const { page } = app;
  await openRecurring(page);
  await selectCandidate(page, 'Synthetic Stream Plan');
  const beforeVault = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await page.locator('#recurringDecisionChoice').selectOption('renegotiate');
  await page.locator('#recurringDecisionStatus').selectOption('planned');
  await page.locator('#recurringDecisionOwner').fill('Adult A');
  await page.locator('#recurringDecisionTargetDate').fill('2026-08-15');
  await page.locator('#recurringDecisionNotes').fill('Compare current terms with a fictional alternative.');
  await page.locator('#saveRecurringDecision').click();
  await expect(page.locator('#toast')).toContainText('Recurring decision saved and verified');
  await expect(page.locator('#recurringCandidateDetail .section-meta')).toContainText('Renegotiate');

  const result = await page.evaluate(() => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    store: JSON.parse(localStorage.getItem('gringottsRecurringDecisions.v1') || '{}')
  }));
  expect(result.vault).toBe(beforeVault);
  expect(result.store.version).toBe(1);
  expect(Object.values(result.store.items)).toHaveLength(1);
  expect(Object.values(result.store.items)[0]).toMatchObject({
    decision: 'renegotiate', status: 'planned', owner: 'Adult A', targetDate: '2026-08-15'
  });
  expect(JSON.stringify(result.store)).not.toMatch(/Synthetic Stream Plan|transactions|merchant|account|amount/i);
});

test('feeds open recurring decisions into Guided Household Plan', async ({ app }) => {
  const { page } = app;
  await openRecurring(page);
  await selectCandidate(page, 'Synthetic Utility Plan');
  await page.locator('#recurringDecisionChoice').selectOption('investigate');
  await page.locator('#recurringDecisionStatus').selectOption('waiting');
  await page.locator('#recurringDecisionOwner').fill('Adult B');
  await page.locator('#saveRecurringDecision').click();

  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recurring-cost follow-up', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Investigate Synthetic Utility Plan/i })).toBeVisible();
  await expect(page.getByText(/Owner: Adult B/i)).toBeVisible();
  await expect(page.getByText(/Confirm whether the charges are expected/i)).toBeVisible();
});

test('adds recurring decisions to reports and the 39-sheet workbook', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for workbook and report integration coverage.');
  const { page } = app;
  await openRecurring(page);
  await selectCandidate(page, 'Synthetic Stream Plan');
  await page.locator('#recurringDecisionChoice').selectOption('cancel');
  await page.locator('#recurringDecisionStatus').selectOption('planned');
  await page.locator('#saveRecurringDecision').click();

  await openPrimary(page, 'Reports');
  await expect(page.getByRole('heading', { name: '39-sheet Vault Workbook', exact: true })).toBeVisible();
  await expect(page.getByText('Recurring Decisions', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Recurring Decision History', { exact: true }).last()).toBeVisible();
  await page.locator('#reportPreviewPage').selectOption('plan');
  const guidedPlanReport = page.locator('.guided-plan-report');
  await expect(guidedPlanReport.getByRole('heading', { name: 'Recurring-cost decisions', exact: true })).toBeVisible();
  await expect(guidedPlanReport.getByText(/Review cancellation steps/i)).toBeVisible();
  await page.locator('#reportPreviewPage').selectOption('meeting');
  await expect(page.getByRole('heading', { name: 'Recurring-cost conversation', exact: true })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#vaultXlsx').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_Budget_Vault_v123_.*\.xlsx/i);
});

test('shows the v123 through v129 roadmap horizon', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v123 — Recurring Cost Decisions/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v129 — Decision Outcome Review/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delivered capabilities', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Planned capabilities', exact: true })).toHaveCount(6);
  await expect(page.getByText(/v124 is the strongest next commitment/i)).toBeVisible();
});

test('keeps recurring decisions, Guided Plan, reports, and Roadmap inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openRecurring(page);
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
