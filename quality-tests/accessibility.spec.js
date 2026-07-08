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
  const report = {
    surface: name,
    url: page.url(),
    timestamp: new Date().toISOString(),
    passes: results.passes.length,
    incomplete: summarizeViolations(results.incomplete),
    violations: summarizeViolations(results.violations)
  };
  await testInfo.attach(`${safeArtifactName(name)}-axe.json`, {
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

test('axe scans every primary and important secondary surface', async ({ page }, testInfo) => {
  const errors = await bootQualityPage(page);

  await scanSurface(page, testInfo, 'Dashboard');

  await openPrimary(page, 'Money');
  await scanSurface(page, testInfo, 'Money — Budget and Recurring');
  await clickSubsection(page, 'Bills & Paydays');
  await scanSurface(page, testInfo, 'Money — Bills and Paydays');
  await clickSubsection(page, 'Goals & Health');
  await scanSurface(page, testInfo, 'Money — Goals and Health');
  await clickSubsection(page, 'Close & Forecast');
  await scanSurface(page, testInfo, 'Money — Close and Forecast');

  await openPrimary(page, 'Calendar');
  await scanSurface(page, testInfo, 'Calendar');

  await openPrimary(page, 'Reports');
  await scanSurface(page, testInfo, 'Reports');

  await openPrimary(page, 'Activity');
  await scanSurface(page, testInfo, 'Activity — Transactions');
  await clickSubsection(page, 'Review Queue');
  await scanSurface(page, testInfo, 'Activity — Review Queue');
  await clickSubsection(page, 'Rules');
  await scanSurface(page, testInfo, 'Activity — Rules');

  await openPrimary(page, 'Tools');
  await scanSurface(page, testInfo, 'Tools — Import and Restore');
  await clickSubsection(page, 'Exports & Backup');
  await scanSurface(page, testInfo, 'Tools — Exports and Backup');
  await clickSubsection(page, 'Diagnostics');
  await expect(page.locator('#diagnosticsMount')).not.toBeEmpty();
  await scanSurface(page, testInfo, 'Tools — Diagnostics');
  await clickSubsection(page, 'Roadmap');
  await scanSurface(page, testInfo, 'Tools — Roadmap');

  await expectNoBrowserErrors(errors);
});

test('keyboard focus, skip navigation, and identifiers remain usable', async ({ page }) => {
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
