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

async function seedTimeline(page) {
  await page.evaluate(() => {
    const receipts = [
      {
        importId: 'quality-v121-2', timestamp: '2026-07-02T12:00:00.000Z',
        sourceFilename: 'synthetic-quality-second.csv', sourceFingerprint: 'synthetic-quality-repeat',
        source: 'Synthetic quality source', format: 'delimited', detectedSchema: 'Card activity export',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:Description; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 1, transactionCount: 4,
        earliestDate: '2026-06-01', latestDate: '2026-06-30', exactDuplicates: 2, fuzzyCandidates: 0,
        insertedCount: 2, skippedCount: 2, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: 15, destinationAfterCount: 17, verificationResult: 'verified'
      },
      {
        importId: 'quality-v121-1', timestamp: '2026-07-01T12:00:00.000Z',
        sourceFilename: 'synthetic-quality-first.csv', sourceFingerprint: 'synthetic-quality-first',
        source: 'Synthetic quality source', format: 'delimited', detectedSchema: 'Generic signed-amount CSV',
        schemaConfidence: 'high', encoding: 'UTF-8', mappingSummary: 'date:Date; description:Description; amount:Amount',
        signMode: 'bank', dateOrder: 'mdy', warningCount: 0, transactionCount: 5,
        earliestDate: '2026-05-01', latestDate: '2026-05-31', exactDuplicates: 2, fuzzyCandidates: 0,
        insertedCount: 3, skippedCount: 2, selectedDestinationVault: 'gringottsBudgetVault.latest',
        destinationBeforeCount: 12, destinationAfterCount: 15, verificationResult: 'verified'
      }
    ];
    localStorage.setItem('gringottsImportHistory.v1', JSON.stringify({ imports: receipts, updatedAt: '2026-07-02T12:00:01.000Z' }));
    localStorage.setItem('gringottsImportBatchIndex.v1', JSON.stringify({
      version: 1,
      updatedAt: '2026-07-02T12:00:01.000Z',
      links: [{
        linkId: 'quality-link', receiptImportId: 'quality-v121-2',
        linkedAt: '2026-07-02T12:00:01.000Z', dryRunSignature: 'fnv1a-1234abcd',
        dryRunCreatedAt: '2026-07-02T11:55:00.000Z', sourceFormat: 'delimited',
        schemaId: 'card-activity', schemaLabel: 'Card activity export', normalizedRowCount: 4,
        wouldInsert: 2, wouldSkip: 2, validationErrorCount: 0, validationWarningCount: 1,
        transactionWriteReady: true, verifiedCounts: true,
        dataBoundary: {
          transactionRowsIncluded: false, sourceFileNameIncluded: false,
          sourceFingerprintIncluded: false, destinationStorageKeyIncluded: false,
          accountIdentifiersIncluded: false, merchantNamesIncluded: false,
          vaultContentsIncluded: false
        }
      }]
    }));
  });
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Detailed v121 desktop surfaces run once.');
}

test('axe scans the receipt timeline, filters, and selected batch detail', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await seedTimeline(page);
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import batch timeline', exact: true })).toBeVisible();
  await expect(page.locator('#receiptTimelineDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Tools — Receipt Integrity Timeline');
  await expectNoBrowserErrors(errors);
});

test('axe scans the detailed v121 through v127 roadmap', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Tools — v121 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans timeline and roadmap on the phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific v121 coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await seedTimeline(page);
  await openPrimary(page, 'Tools');
  await expect(page.locator('#receiptTimelineDetail')).toBeVisible();
  await scanSurface(page, testInfo, 'Mobile Tools — Receipt Integrity Timeline');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(7);
  await scanSurface(page, testInfo, 'Mobile Tools — v121 Detailed Roadmap');
  await expectNoBrowserErrors(errors);
});
