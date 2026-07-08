import { test, expect, openPrimary } from './helpers/app.js';

test('makes the skip target focusable and secondary navigation a valid tablist', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('#main')).toHaveAttribute('tabindex', '-1');

  await openPrimary(page, 'Money');
  const tablist = page.locator('[role="tablist"]').first();
  await expect(tablist).toBeVisible();
  await expect(tablist).toHaveAttribute('aria-label', /sections/i);

  const tabs = tablist.locator(':scope > [role="tab"]');
  await expect(tabs).toHaveCount(4);
  await expect(tablist.locator(':scope > [role="tab"][aria-selected="true"]')).toHaveCount(1);
  await expect(tablist.locator(':scope > [role="tab"][tabindex="0"]')).toHaveCount(1);
  await expect(tablist.locator(':scope > [role="tab"][tabindex="-1"]')).toHaveCount(3);
});

test('moves secondary navigation with arrow keys', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Money');
  const tablist = page.locator('[role="tablist"]').first();
  const selected = tablist.locator(':scope > [role="tab"][aria-selected="true"]');
  const tabs = tablist.locator(':scope > [role="tab"]');
  const selectedIndex = await tabs.evaluateAll((elements) => elements.findIndex((element) => element.getAttribute('aria-selected') === 'true'));
  const nextIndex = (selectedIndex + 1) % await tabs.count();
  const nextLabel = String(await tabs.nth(nextIndex).textContent()).trim();

  await selected.focus();
  await page.keyboard.press('ArrowRight');
  const next = page.getByRole('tab', { name: nextLabel, exact: true });
  await expect(next).toHaveAttribute('aria-selected', 'true');
  await expect(next).toHaveAttribute('tabindex', '0');
});

test('labels table wrappers as keyboard-accessible scroll regions', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Money');
  await page.getByRole('tab', { name: 'Goals & Health', exact: true }).click();

  const region = page.locator('.table-wrap').first();
  await expect(region).toHaveAttribute('role', 'region');
  await expect(region).toHaveAttribute('tabindex', '0');
  await expect(region).toHaveAttribute('aria-label', /table/i);
  await region.focus();
  await expect(region).toBeFocused();
});
