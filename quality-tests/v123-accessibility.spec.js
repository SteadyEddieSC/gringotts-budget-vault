import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { bootQualityPage, expectNoBrowserErrors, openPrimary, safeArtifactName } from './helpers.js';

const BLOCKING_IMPACTS = new Set(['critical', 'serious']);
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

function summarizeViolations(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      failureSummary: node.failureSummary,
      html: node.html
    }))
  }));
}

async function scanSurface(page, testInfo, name) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await testInfo.attach(`${safeArtifactName(`${testInfo.project.name}-${name}`)}-axe.json`, {
    body: Buffer.from(JSON.stringify({
      surface: name,
      project: testInfo.project.name,
      url: page.url(),
      timestamp: new Date().toISOString(),
      violations: summarizeViolations(results.violations),
      incomplete: summarizeViolations(results.incomplete)
    }, null, 2)),
    contentType: 'application/json'
  });
  const blocking = results.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact));
  expect(blocking, `${name} has serious or critical axe violations:\n${JSON.stringify(summarizeViolations(blocking), null, 2)}`).toEqual([]);
}

async function seedRecurring(page) {
  await page.evaluate(async () => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions.push(
      { id: 'quality-v123-1', date: '2026-03-05', name: 'Quality Stream Plan', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Quality Card 1234', owner: 'Adult A', pending: false, reviewed: true },
      { id: 'quality-v123-2', date: '2026-04-05', name: 'Quality Stream Plan', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Quality Card 1234', owner: 'Adult A', pending: false, reviewed: true },
      { id: 'quality-v123-3', date: '2026-05-05', name: 'Quality Stream Plan', amount: 14, type: 'Expense', category: 'Entertainment', account: 'Quality Card 1234', owner: 'Adult A', pending: false, reviewed: true }
    );
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
    const core = await import('/src/v103/core.js');
    core.invalidateVaultCache();
  });
}

async function saveInvestigate(page) {
  await page.locator('#recurringDecisionChoice').selectOption('investigate');
  await page.locator('#recurringDecisionStatus').selectOption('planned');
  await page.locator('#recurringDecisionOwner').fill('Adult A');
  await page.locator('#saveRecurringDecision').click();
  await expect(page.locator('#toast')).toContainText('Recurring decision saved and verified');
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v123 desktop surfaces run once.');
}

test('axe scans recurring evidence, filters, and decision controls', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await seedRecurring(page);
  await openPrimary(page, 'Money');
  await expect(page.getByRole('heading', { name: 'Recurring cost decisions', exact: true })).toBeVisible();
  await expect(page.locator('#recurringCandidateDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Money — Recurring Cost Decisions');
  await expectNoBrowserErrors(errors);
});

test('axe scans recurring follow-up inside Guided Household Plan', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await seedRecurring(page);
  await openPrimary(page, 'Money');
  await saveInvestigate(page);
  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recurring-cost follow-up', exact: true })).toBeVisible();
  await scanSurface(page, testInfo, 'Activity — Recurring Follow-up');
  await expectNoBrowserErrors(errors);
});

test('axe scans the v123 through v129 roadmap', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Tools — v123 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans recurring decisions and roadmap on the phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific v123 coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await seedRecurring(page);
  await openPrimary(page, 'Money');
  await expect(page.locator('#recurringCandidateDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Mobile Money — Recurring Cost Decisions');
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Mobile Tools — v123 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});
