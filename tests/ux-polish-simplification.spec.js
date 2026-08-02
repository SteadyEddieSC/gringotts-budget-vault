import { test, expect, openPrimary } from './helpers/app.js';

test('publishes v127 UX ownership without adding a runtime, observer, store, destination, or workbook sheet', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText('v127');
  const state = await page.evaluate(() => ({
    coordinator: window.GringottsV126.coordinator.snapshot(),
    ux: window.GringottsV127.snapshot(),
    build: window.GringottsCleanRuntime.BUILD
  }));
  expect(state.coordinator.observerCount).toBe(1);
  expect(state.coordinator.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.ux.release).toBe('v127');
  expect(state.ux.observerAdded).toBe(false);
  expect(state.ux.storageWritesAdded).toBe(false);
  expect(state.ux.primaryDestinations).toBe(6);
  expect(state.ux.workbookSheets).toBe(43);
  expect(state.build.version).toBe('v127');
  expect(state.build.runtime).toContain('v127 interaction policy');
});

test('classifies report actions and announces local export feedback', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Reports');
  const workbook = page.getByRole('button', { name: 'Download 43-sheet Workbook', exact: true });
  await expect(workbook).toHaveAttribute('data-action-intent', 'export');
  await expect(workbook).toHaveAttribute('data-action-verb', 'Export');
  await workbook.click();
  await expect(page.locator('#v127Status')).toHaveText('Preparing the local export');
});

test('moves focus to the rendered route heading after primary navigation', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Money');
  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim()
  }));
  expect(['H1', 'H2']).toContain(focused.tag);
  expect(focused.text).toMatch(/Bills, Recurring & Budgets/i);
});

test('shows the v127 through v136 reliability roadmap with progressive details', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'v127–v136 Reliability Roadmap', exact: true })).toBeVisible();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  await expect(page.getByRole('heading', { name: 'v127 — UX Polish & Simplification', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'v136 — Architecture Baseline & Next-Horizon Decision', exact: true })).toBeVisible();
  await expect(page.locator('.roadmap-horizon-card').first().locator('details')).toHaveCount(1);
});

test('keeps v127 roadmap and actions within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
