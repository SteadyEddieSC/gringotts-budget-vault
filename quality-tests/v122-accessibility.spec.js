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

async function seedCleanupAccounts(page) {
  await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    vault.transactions.push(
      { id: 'quality-cleanup-1', date: '2026-01-05', name: 'Synthetic expense', amount: 20, type: 'Expense', category: 'Household', account: 'Quality Family Checking 1234', owner: 'Adult A', reviewed: true, pending: false },
      { id: 'quality-cleanup-2', date: '2026-02-05', name: 'Synthetic expense', amount: 25, type: 'Expense', category: 'Household', account: 'Quality Family Checking 1234', owner: 'Adult A', reviewed: true, pending: false },
      { id: 'quality-cleanup-3', date: '2026-03-05', name: 'Synthetic expense', amount: 30, type: 'Expense', category: 'Household', account: 'Quality Family Chking ••••1234', owner: 'Adult A', reviewed: true, pending: false }
    );
    localStorage.setItem('gringottsBudgetVault.latest', JSON.stringify(vault));
  });
  await page.reload();
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v122 desktop surfaces run once.');
}

test('axe scans account inventory, candidate evidence, and decision controls', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await seedCleanupAccounts(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Account cleanup & merge planning', exact: true })).toBeVisible();
  await expect(page.locator('#accountCleanupCandidateDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Tools — Account Cleanup Planning');
  await expectNoBrowserErrors(errors);
});

test('axe scans the detailed v122 through v128 roadmap', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Tools — v122 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans account planning and roadmap on the phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific v122 coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await seedCleanupAccounts(page);
  await openPrimary(page, 'Tools');
  await expect(page.locator('#accountCleanupCandidateDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Mobile Tools — Account Cleanup Planning');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Mobile Tools — v122 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});
