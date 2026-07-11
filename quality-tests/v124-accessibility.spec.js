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

async function seedScenarioContext(page) {
  await page.evaluate(() => {
    localStorage.setItem('gringottsForecastSettings.v1', JSON.stringify({
      asOfDate: '2026-07-01', startingCash: 1800, minimumBuffer: 600,
      flexibleMonthlySpend: 450, horizonDays: 60
    }));
    localStorage.setItem('gringottsDebtPlan.v1', JSON.stringify({
      debts: [{ id: 'quality-scenario-debt', name: 'Quality Card', balance: 2400, apr: 18, minimumPayment: 80, targetPayment: 150 }],
      monthlyExtra: 0
    }));
    localStorage.setItem('gringottsGoals.v1', JSON.stringify({
      goals: [{ id: 'quality-scenario-goal', name: 'Quality Reserve', target: 5000, current: 1000, monthlyContribution: 200, archived: false }]
    }));
  });
}

async function openScenario(page) {
  await seedScenarioContext(page);
  await openPrimary(page, 'Money');
  await page.getByRole('button', { name: 'Close & Forecast', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Household scenario comparison', exact: true })).toBeVisible();
}

async function saveScenario(page) {
  await page.locator('#scenarioName').fill('Quality household option');
  await page.locator('#scenarioMonthlyIncomeDelta').fill('300');
  await page.locator('#scenarioRecurringSavings').fill('75');
  await page.locator('#scenarioDebtExtra').fill('100');
  await page.locator('#saveScenario').click();
  await expect(page.locator('#toast')).toContainText('Scenario assumptions saved and verified');
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v124 desktop surfaces run once.');
}

test('axe scans scenario assumptions and comparison table', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openScenario(page);
  await expect(page.locator('.scenario-comparison-table')).toBeVisible();
  await scanSurface(page, testInfo, 'Money — Household Scenario Comparison');
  await expectNoBrowserErrors(errors);
});

test('axe scans saved scenario discussion in Guided Plan and reports', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openScenario(page);
  await saveScenario(page);
  await openPrimary(page, 'Activity');
  await page.getByRole('tab', { name: 'Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scenario discussion', exact: true })).toBeVisible();
  await scanSurface(page, testInfo, 'Activity — Scenario Discussion');
  await openPrimary(page, 'Reports');
  await page.locator('#reportPreviewPage').selectOption('planning');
  await expect(page.getByRole('heading', { name: 'Household scenario comparisons', exact: true })).toBeVisible();
  await scanSurface(page, testInfo, 'Reports — Scenario Comparison');
  await expectNoBrowserErrors(errors);
});

test('axe scans the v124 through v130 roadmap', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();
  await scanSurface(page, testInfo, 'Tools — v124 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans scenario comparison and roadmap on the phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific v124 coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await openScenario(page);
  await scanSurface(page, testInfo, 'Mobile Money — Household Scenario Comparison');
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Mobile Tools — v124 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});
