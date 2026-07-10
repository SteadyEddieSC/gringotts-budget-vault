import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { bootQualityPage, expectNoBrowserErrors, openPrimary, safeArtifactName } from './helpers.js';

const BLOCKING_IMPACTS = new Set(['critical', 'serious']);
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const profileCsv = 'Date,Description,Amount,Status,Reference,Memo\n07/10/2026,Synthetic Fuel,-45.67,Posted,profile-test-1,Fictional quality row';
const portableBundle = {
  kind: 'gringotts-import-profile-bundle',
  version: 1,
  generator: 'Synthetic accessibility fixture',
  exportedAt: '2026-07-10T12:00:00.000Z',
  profileCount: 1,
  profiles: [{
    name: 'Fictional Wallet',
    format: 'delimited',
    schemaId: 'generic-signed',
    schemaLabel: 'Generic signed-amount CSV',
    delimiter: ',',
    headerSignature: 'fnv1a-87654321',
    headerCount: 7,
    mapping: {
      date: 'Activity Date', description: 'Name', amount: 'Net Amount', debit: '', credit: '',
      status: 'Status', account: '', memo: 'Note', id: 'Transaction ID', category: '', type: 'Type'
    },
    options: {
      dateOrder: 'auto', signMode: 'bank', accountLabel: 'Fictional Wallet',
      accountMode: 'label', useSourceCategory: false
    }
  }]
};

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
  const report = {
    surface: name,
    project: testInfo.project.name,
    url: page.url(),
    timestamp: new Date().toISOString(),
    passes: results.passes.length,
    incomplete: summarizeViolations(results.incomplete),
    violations: summarizeViolations(results.violations)
  };
  await testInfo.attach(`${safeArtifactName(`${testInfo.project.name}-${name}`)}-axe.json`, {
    body: Buffer.from(JSON.stringify(report, null, 2)),
    contentType: 'application/json'
  });
  const blocking = results.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact));
  expect(blocking, `${name} has serious or critical axe violations:\n${JSON.stringify(summarizeViolations(blocking), null, 2)}`).toEqual([]);
}

async function clickSubsection(page, name) {
  const tab = page.getByRole('tab', { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(tab).toHaveClass(/active/);
}

async function inspectProfileCsv(page) {
  await page.locator('#bankImportFile').setInputFiles({
    name: 'synthetic-profile-quality.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(profileCsv)
  });
  await expect(page.locator('#importProfileCard')).toBeVisible();
  await expect(page.locator('.field-validation')).toHaveCount(11);
}

async function inspectPortableBundle(page) {
  await page.locator('#profileBundleFile').setInputFiles({
    name: 'synthetic-portability-quality.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(portableBundle))
  });
  await expect(page.locator('#profileBundlePreview')).toBeVisible();
  await expect(page.locator('[data-profile-bundle-action]')).toBeVisible();
}

function desktopOnly(testInfo) {
  test.skip(testInfo.project.name !== 'quality-desktop', 'Full surface inventory runs once in the desktop quality project.');
}

test('axe scans all primary destinations', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await scanSurface(page, testInfo, 'Dashboard');
  await openPrimary(page, 'Money');
  await scanSurface(page, testInfo, 'Money — Budget and Recurring');
  await openPrimary(page, 'Calendar');
  await scanSurface(page, testInfo, 'Calendar');
  await openPrimary(page, 'Reports');
  await scanSurface(page, testInfo, 'Reports — Family Summary');
  await openPrimary(page, 'Activity');
  await scanSurface(page, testInfo, 'Activity — Transactions');
  await openPrimary(page, 'Tools');
  await scanSurface(page, testInfo, 'Tools — Profile Library and Bank Import');
  await expectNoBrowserErrors(errors);
});

test('axe scans every report preview page', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Reports');
  const select = page.locator('#reportPreviewPage');
  for (const value of ['summary', 'comparison', 'spending', 'goals', 'planning', 'insights', 'plan', 'meeting']) {
    await select.selectOption(value);
    await scanSurface(page, testInfo, `Reports — ${value}`);
  }
  await expectNoBrowserErrors(errors);
});

test('axe scans every Money subsection', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Money');
  await scanSurface(page, testInfo, 'Money — Budget and Recurring');
  await clickSubsection(page, 'Bills & Paydays');
  await scanSurface(page, testInfo, 'Money — Bills and Paydays');
  await clickSubsection(page, 'Goals & Health');
  await scanSurface(page, testInfo, 'Money — Goals and Health');
  await clickSubsection(page, 'Close & Forecast');
  await scanSurface(page, testInfo, 'Money — Close and Forecast');
  await expectNoBrowserErrors(errors);
});

test('axe scans every Activity subsection including Guided Plan', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Activity');
  await scanSurface(page, testInfo, 'Activity — Transactions');
  await clickSubsection(page, 'Review Queue');
  await scanSurface(page, testInfo, 'Activity — Review Queue');
  await clickSubsection(page, 'Rules');
  await scanSurface(page, testInfo, 'Activity — Rules');
  await clickSubsection(page, 'Insights');
  await scanSurface(page, testInfo, 'Activity — Household Insights');
  await clickSubsection(page, 'Plan');
  await scanSurface(page, testInfo, 'Activity — Guided Household Plan');
  await expectNoBrowserErrors(errors);
});

test('axe scans every Tools subsection, profile portability, both import tasks, and field validation', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await openPrimary(page, 'Tools');
  await scanSurface(page, testInfo, 'Tools — Profile Library and Bank Import');
  await inspectPortableBundle(page);
  await scanSurface(page, testInfo, 'Tools — Profile Bundle Conflict Review');
  await inspectProfileCsv(page);
  await scanSurface(page, testInfo, 'Tools — Import Profile and Field Validation');
  await page.getByRole('button', { name: /Restore full vault/i }).click();
  await scanSurface(page, testInfo, 'Tools — Full Restore');
  await clickSubsection(page, 'Exports & Backup');
  await scanSurface(page, testInfo, 'Tools — Exports and Backup');
  await clickSubsection(page, 'Diagnostics');
  await expect(page.locator('#diagnosticsMount')).not.toBeEmpty();
  await scanSurface(page, testInfo, 'Tools — Diagnostics');
  await clickSubsection(page, 'Roadmap');
  await scanSurface(page, testInfo, 'Tools — Roadmap');
  await expectNoBrowserErrors(errors);
});

test('axe scans key phone surfaces including reports, Guided Plan, profile portability, and import profiles', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Phone-specific axe coverage runs in the mobile quality project.');
  const errors = await bootQualityPage(page);
  await scanSurface(page, testInfo, 'Mobile Dashboard');
  await openPrimary(page, 'Reports');
  await scanSurface(page, testInfo, 'Mobile Reports — Summary');
  await page.locator('#reportPreviewPage').selectOption('insights');
  await scanSurface(page, testInfo, 'Mobile Reports — Insights');
  await page.locator('#reportPreviewPage').selectOption('plan');
  await scanSurface(page, testInfo, 'Mobile Reports — Guided Plan');
  await openPrimary(page, 'Activity');
  await clickSubsection(page, 'Insights');
  await scanSurface(page, testInfo, 'Mobile Activity — Household Insights');
  await clickSubsection(page, 'Plan');
  await scanSurface(page, testInfo, 'Mobile Activity — Guided Household Plan');
  await openPrimary(page, 'Tools');
  await inspectPortableBundle(page);
  await scanSurface(page, testInfo, 'Mobile Tools — Profile Bundle Conflict Review');
  await inspectProfileCsv(page);
  await scanSurface(page, testInfo, 'Mobile Tools — Import Profile and Field Validation');
  await expectNoBrowserErrors(errors);
});

test('keyboard focus, skip navigation, and identifiers remain usable', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const errors = await bootQualityPage(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  const duplicateIds = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll('[id]').forEach((node) => counts.set(node.id, (counts.get(node.id) || 0) + 1));
    return [...counts.entries()].filter(([, count]) => count > 1);
  });
  expect(duplicateIds, 'Rendered page must not contain duplicate IDs').toEqual([]);

  for (const selector of ['[data-tab="dashboard"]', '#monthPicker', '#openReports']) {
    const element = page.locator(selector);
    await element.focus();
    const focusStyle = await element.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    const visible = focusStyle.outlineStyle !== 'none' && focusStyle.outlineWidth !== '0px'
      || focusStyle.boxShadow !== 'none';
    expect(visible, `${selector} must expose a visible keyboard focus indicator`).toBe(true);
  }
  await expectNoBrowserErrors(errors);
});

test('mobile menu exposes state and closes after keyboard escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'quality-mobile', 'Mobile navigation behavior is audited in the mobile project.');
  const errors = await bootQualityPage(page);
  const toggle = page.getByRole('button', { name: /Menu/i });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expectNoBrowserErrors(errors);
});
