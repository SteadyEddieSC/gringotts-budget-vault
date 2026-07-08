import { test, expect } from './helpers/app.js';

test('month toolbar stays compact and all controls work', async ({ app }) => {
  const { page } = app;
  const toolbar = page.locator('.compact-month-nav');
  await expect(toolbar).toBeVisible();

  const box = await toolbar.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(Math.min(700, viewport.width - 8));

  await expect(page.locator('#monthPicker')).toHaveValue('2026-07');
  await page.locator('#monthPrev').click();
  await expect(page.locator('#monthPicker')).toHaveValue('2026-06');
  await page.locator('#monthNext').click();
  await expect(page.locator('#monthPicker')).toHaveValue('2026-07');

  await page.locator('#monthPicker').evaluate((element) => {
    element.value = '2026-05';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#monthPicker')).toHaveValue('2026-05');

  await page.locator('#monthLatest').click();
  await expect(page.locator('#monthPicker')).toHaveValue('2026-07');
});

test('desktop selected-month field does not expand across the page', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile') || testInfo.project.name === 'tablet');
  const { page } = app;
  const picker = page.locator('.compact-month-picker');
  const box = await picker.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(240);
});
