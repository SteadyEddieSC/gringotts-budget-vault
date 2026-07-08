import fs from 'node:fs';
import path from 'node:path';
import { test, expect, openPrimary } from '../tests/helpers/app.js';

const contracts = JSON.parse(fs.readFileSync(path.resolve('quality-baselines/v112-layout-contracts.json'), 'utf8'));
const resultsDirectory = path.resolve('quality-results');

async function visibleCount(page, selector) {
  const locator = page.locator(selector);
  let count = 0;
  for (let index = 0; index < await locator.count(); index += 1) {
    if (await locator.nth(index).isVisible()) count += 1;
  }
  return count;
}

async function computedSnapshot(page, name, contract) {
  await page.setViewportSize(contract.viewport);
  await openPrimary(page, contract.route);
  await page.waitForTimeout(100);

  const root = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color
  }));
  const mainBox = await page.locator('#main').boundingBox();
  const topbarBox = await page.locator('.topbar').boundingBox();
  const rangeGrid = page.locator('.report-range-grid');
  const rangeColumns = await rangeGrid.count() && await rangeGrid.isVisible()
    ? await rangeGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length)
    : null;
  const controlHeights = await page.locator('.range-controls input, .range-controls select, .range-controls button').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map((element) => Math.round(element.getBoundingClientRect().height)));

  const requiredVisible = {};
  for (const selector of contract.requiredVisible || []) requiredVisible[selector] = await visibleCount(page, selector);
  const requiredHidden = {};
  for (const selector of contract.requiredHidden || []) requiredHidden[selector] = await visibleCount(page, selector);

  return {
    name,
    viewport: contract.viewport,
    route: contract.route,
    horizontalOverflow: root.scrollWidth - root.clientWidth,
    bodyBackground: root.bodyBackground,
    bodyColor: root.bodyColor,
    main: mainBox && {
      x: Math.round(mainBox.x), y: Math.round(mainBox.y),
      width: Math.round(mainBox.width), height: Math.round(mainBox.height)
    },
    topbar: topbarBox && {
      x: Math.round(topbarBox.x), y: Math.round(topbarBox.y),
      width: Math.round(topbarBox.width), height: Math.round(topbarBox.height)
    },
    primaryTabs: await page.locator('[data-tab]').count(),
    visibleCards: await visibleCount(page, '.section.active .card'),
    reportPages: await page.locator('.report-page').count(),
    rangeColumns,
    minimumControlHeight: controlHeights.length ? Math.min(...controlHeights) : null,
    requiredVisible,
    requiredHidden
  };
}

function enforceContract(actual, contract) {
  expect(actual.horizontalOverflow, `${actual.name} horizontal overflow`).toBeLessThanOrEqual(contract.maximumHorizontalOverflow);
  expect(actual.main?.width || 0, `${actual.name} main width`).toBeGreaterThanOrEqual(contract.minimumMainWidth);
  if (contract.minimumPrimaryTabs !== undefined) expect(actual.primaryTabs).toBeGreaterThanOrEqual(contract.minimumPrimaryTabs);
  if (contract.minimumCards !== undefined) expect(actual.visibleCards).toBeGreaterThanOrEqual(contract.minimumCards);
  if (contract.minimumReportPages !== undefined) expect(actual.reportPages).toBeGreaterThanOrEqual(contract.minimumReportPages);
  if (contract.expectedRangeColumns !== undefined) expect(actual.rangeColumns).toBe(contract.expectedRangeColumns);
  if (contract.minimumControlHeight !== undefined) expect(actual.minimumControlHeight || 0).toBeGreaterThanOrEqual(contract.minimumControlHeight);
  if (contract.maximumTopbarY !== undefined) expect(actual.topbar?.y ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(contract.maximumTopbarY);
  for (const [selector, count] of Object.entries(actual.requiredVisible)) {
    expect(count, `${actual.name}: ${selector} should be visible`).toBeGreaterThan(0);
  }
  for (const [selector, count] of Object.entries(actual.requiredHidden)) {
    expect(count, `${actual.name}: ${selector} should be hidden`).toBe(0);
  }
}

test('matches the v112 desktop and phone visual layout snapshots', async ({ app }) => {
  const { page } = app;
  const actualSnapshots = {};
  for (const [name, contract] of Object.entries(contracts.snapshots)) {
    const actual = await computedSnapshot(page, name, contract);
    enforceContract(actual, contract);
    actualSnapshots[name] = actual;
  }

  fs.mkdirSync(resultsDirectory, { recursive: true });
  fs.writeFileSync(path.join(resultsDirectory, 'visual-layout-snapshots.json'), JSON.stringify({
    baselineVersion: contracts.version,
    generatedAt: new Date().toISOString(),
    snapshots: actualSnapshots
  }, null, 2));
});
