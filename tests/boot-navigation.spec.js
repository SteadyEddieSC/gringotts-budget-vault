import { test, expect, openPrimary } from './helpers/app.js';

const destinations = [
  ['Dashboard', /Vault Dashboard/i],
  ['Money', /Bills, Recurring & Budgets/i],
  ['Calendar', /Calendar & Cash Flow/i],
  ['Reports', /Reports Center/i],
  ['Activity', /Ledger/i],
  ['Tools', /Import \/ Restore/i]
];

test('boots without module errors and exposes the consolidated navigation', async ({ app }) => {
  const { page } = app;
  await expect(page).toHaveTitle(/Gringotts Budget Vault v109/i);
  await expect(page.locator('[data-tab]')).toHaveCount(6);
  await expect(page.locator('.version-text')).toHaveText('v109');

  const methods = [];
  page.on('request', (request) => methods.push({ method: request.method(), url: request.url() }));

  for (const [name, heading] of destinations) {
    await openPrimary(page, name);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }

  const unsafe = methods.filter(({ method, url }) => method !== 'GET' && !url.startsWith('blob:'));
  expect(unsafe, 'The local-first app should not make write network requests').toEqual([]);
});

test('keeps the page inside the viewport at each configured device size', async ({ app }) => {
  const { page } = app;
  for (const [name] of destinations) {
    await openPrimary(page, name);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  }
});

test('does not register a service worker', async ({ app }) => {
  const { page } = app;
  const registrations = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 0;
    return (await navigator.serviceWorker.getRegistrations()).length;
  });
  expect(registrations).toBe(0);
});
