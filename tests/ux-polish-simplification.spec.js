import { test, expect, openPrimary } from './helpers/app.js';

test('preserves v127 UX ownership under the v128 typed foundation without adding a runtime, observer, store, destination, or workbook sheet', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText('v128');
  const state = await page.evaluate(() => ({
    coordinator: window.GringottsV126.coordinator.snapshot(),
    ux: window.GringottsV127.snapshot(),
    foundation: window.GringottsV128.snapshot(),
    build: window.GringottsCleanRuntime.BUILD
  }));
  expect(state.coordinator.observerCount).toBe(1);
  expect(state.coordinator.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.ux.release).toBe('v127');
  expect(state.ux.observerAdded).toBe(false);
  expect(state.ux.storageWritesAdded).toBe(false);
  expect(state.ux.primaryDestinations).toBe(6);
  expect(state.ux.workbookSheets).toBe(43);
  expect(state.foundation.release).toBe('v128');
  expect(state.foundation.observerAdded).toBe(false);
  expect(state.foundation.storageWritesAdded).toBe(false);
  expect(state.build.version).toBe('v128');
  expect(state.build.runtime).toContain('v127 interaction policy');
  expect(state.build.runtime).toContain('v128 typed portable-vault foundation');
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
  await expect(page.getByRole('heading', { name: 'v128 — TypeScript & Portable Vault Foundation', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'v136 — Architecture Baseline & Next-Horizon Decision', exact: true })).toBeVisible();
  await expect(page.locator('.roadmap-horizon-card').first().locator('details')).toHaveCount(1);
});

test('keeps the reliability roadmap and actions within a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await openPrimary(page, 'Tools');
  await page.getByRole('tab', { name: 'Roadmap', exact: true }).click();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
