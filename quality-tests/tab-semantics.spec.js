import { test, expect, openPrimary } from '../tests/helpers/app.js';

test('normalizes secondary navigation as an accessible keyboard tablist', async ({ app }) => {
  const { page } = app;
  await openPrimary(page, 'Money');

  const tablist = page.locator('[role="tablist"]').first();
  await expect(tablist).toBeVisible();
  const tabs = tablist.locator(':scope > [role="tab"]');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.filter({ has: page.locator('[aria-selected="true"]') })).toHaveCount(0);

  const selected = tablist.locator(':scope > [role="tab"][aria-selected="true"]');
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveAttribute('tabindex', '0');

  const selectedIndex = await tabs.evaluateAll((elements) => elements.findIndex((element) => element.getAttribute('aria-selected') === 'true'));
  const nextIndex = (selectedIndex + 1) % await tabs.count();
  const nextLabel = String(await tabs.nth(nextIndex).textContent()).trim();

  await selected.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: nextLabel, exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: nextLabel, exact: true })).toHaveAttribute('tabindex', '0');
});
