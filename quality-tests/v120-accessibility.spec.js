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
    nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary, html: node.html }))
  }));
}

async function scanSurface(page, testInfo, name) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await testInfo.attach(`${safeArtifactName(`${testInfo.project.name}-${name}`)}-axe.json`, {
    body: Buffer.from(JSON.stringify({ surface: name, project: testInfo.project.name, url: page.url(), timestamp: new Date().toISOString(), violations: summarizeViolations(results.violations), incomplete: summarizeViolations(results.incomplete) }, null, 2)),
    contentType: 'application/json'
  });
  const blocking = results.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact));
  expect(blocking, `${name} has serious or critical axe violations:\n${JSON.stringify(summarizeViolations(blocking), null, 2)}`).toEqual([]);
}

async function seedReceipt(page) {
  await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const after = vault.transactions.length;
    localStorage.setItem('gringottsImportHistory.v1', JSON.stringify({
      imports: [{
        importId: 'quality_v120_receipt', timestamp: '2026-07-10T12:00:00.000Z',
        sourceFilename: 'synthetic-quality.csv', sourceFingerprint: 'synthetic-quality-fingerprint',
        source: 'Synthetic quality fixture', format: 'delimited', detectedSchema: 'Generic signed-amount CSV',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:Description; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 1, transactionCount: 5,
        earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 2, fuzzyCandidates: 0,
        insertedCount: 3, skippedCount: 2, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: after - 3, destinationAfterCount: after, verificationResult: 'verified'
      }], updatedAt: '2026-07-10T12:00:00.000Z'
    }));
  });
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'The preserved v120 audit surface runs once in the desktop quality project.');
}

test('axe scans v120 receipt arithmetic and rollback guidance within v124', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await seedReceipt(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
  await expect(page.locator('#receiptTimelineDetail')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Destination count arithmetic', exact: true })).toBeVisible();
  await expect(page.getByText(/No automatic rollback/i)).toBeVisible();
  await scanSurface(page, testInfo, 'Tools — Preserved Receipt Audit and Rollback');
  await expectNoBrowserErrors(errors);
});

test('axe scans the advanced multi-release roadmap from a fresh render', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /v124 — Household Scenario Comparison/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /v130 — Household Resilience/i })).toBeVisible();
  await scanSurface(page, testInfo, 'Tools — Detailed Roadmap Horizon');
  await expectNoBrowserErrors(errors);
});

test('axe scans preserved audit safety and roadmap on the phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific preserved audit coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await seedReceipt(page);
  await openPrimary(page, 'Tools');
  await expect(page.locator('#receiptTimelineDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Mobile Tools — Preserved Receipt Audit and Rollback');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Mobile Tools — Detailed Roadmap Horizon');
  await expectNoBrowserErrors(errors);
});
