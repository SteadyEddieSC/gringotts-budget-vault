import { test, expect, openPrimary } from './helpers/app.js';

const STORAGE_KEY = 'gringottsImportProfiles.v1';

const savedProfile = {
  profileId: 'profile_existing',
  name: 'Household Visa',
  format: 'delimited',
  schemaId: 'card-activity',
  schemaLabel: 'Card activity CSV pattern',
  delimiter: ',',
  headerSignature: 'fnv1a-12345678',
  headerCount: 8,
  mapping: {
    date: 'Transaction Date', description: 'Description', amount: 'Amount', debit: '', credit: '',
    status: 'Status', account: '', memo: '', id: 'Reference Number', category: 'Category', type: 'Type'
  },
  options: {
    dateOrder: 'mdy', signMode: 'bank', accountLabel: 'Household Visa',
    accountMode: 'label', useSourceCategory: false
  },
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z'
};

function portable(profile = savedProfile) {
  const { profileId, createdAt, updatedAt, ...definition } = profile;
  return definition;
}

function bundle(profiles) {
  return {
    kind: 'gringotts-import-profile-bundle',
    version: 1,
    generator: 'Synthetic Playwright fixture',
    exportedAt: '2026-07-10T12:00:00.000Z',
    profileCount: profiles.length,
    profiles: profiles.map(portable)
  };
}

async function seedProfiles(page, profiles = [savedProfile]) {
  await page.evaluate(({ key, records }) => {
    localStorage.setItem(key, JSON.stringify({ profiles: records, updatedAt: '2026-07-10T12:00:00.000Z' }));
  }, { key: STORAGE_KEY, records: profiles });
}

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import & Restore', exact: true })).toBeVisible();
  await expect(page.locator('#profilePortabilityCard')).toBeVisible();
}

async function chooseBundle(page, value, name = 'synthetic-profile-bundle.json') {
  await page.locator('#profileBundleFile').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(value))
  });
  await expect(page.locator('#profileBundlePreview')).toBeVisible();
}

async function confirmRevision(page) {
  await expect(page.locator('#profileRevisionGate')).toBeVisible();
  await page.locator('#profileRevisionAck').check();
  await page.locator('#confirmProfileRevision').click();
  await expect(page.locator('#profileRevisionGate')).toHaveCount(0);
}

test('shows profile portability before a transaction export is selected', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  await expect(page.getByRole('heading', { name: 'Profile library and portability', exact: true })).toBeVisible();
  await expect(page.locator('#profileBundleFile')).toBeAttached();
  await expect(page.locator('#exportProfileBundle')).toBeDisabled();
  await expect(page.locator('#importProfileCard')).toHaveCount(0);
});

test('exports only sanitized portable definitions', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for download content coverage.');
  const { page } = app;
  await seedProfiles(page);
  await openImport(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportProfileBundle').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Gringotts_v118_import_profiles_1_/);
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString();
  const exported = JSON.parse(text);
  expect(exported.kind).toBe('gringotts-import-profile-bundle');
  expect(exported.profiles).toHaveLength(1);
  expect(exported.profiles[0]).toMatchObject({ name: 'Household Visa', headerSignature: 'fnv1a-12345678' });
  expect(exported.profiles[0].profileId).toBeUndefined();
  expect(exported.profiles[0].createdAt).toBeUndefined();
  expect(exported.profiles[0].updatedAt).toBeUndefined();
  expect(text).not.toMatch(/transactions|records|sourceFingerprint|sourceFilename|accountNumber|credentials/i);
});

test('adds a reviewed profile without changing the household vault or retaining its filename', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for verified portability writes.');
  const { page } = app;
  const before = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await openImport(page);
  const wallet = {
    ...savedProfile,
    profileId: 'portable_wallet',
    name: 'Fictional Wallet',
    schemaId: 'generic-signed',
    schemaLabel: 'Generic signed-amount CSV',
    headerSignature: 'fnv1a-87654321',
    headerCount: 7,
    mapping: {
      date: 'Activity Date', description: 'Name', amount: 'Net Amount', debit: '', credit: '',
      status: 'Status', account: '', memo: 'Note', id: 'Transaction ID', category: '', type: 'Type'
    },
    options: { ...savedProfile.options, dateOrder: 'auto', accountLabel: 'Fictional Wallet' }
  };
  await chooseBundle(page, bundle([wallet]), 'private-looking-name.json');
  const action = page.locator('[data-profile-bundle-action]').first();
  await expect(action).toHaveValue('add');
  await page.locator('#profileBundleAck').check();
  await page.locator('#commitProfileBundle').click();
  await expect(page.getByLabel('Bank export import').getByText(/Verified profile bundle result: 1 added, 0 replaced, 0 skipped/i)).toBeVisible();

  const result = await page.evaluate((key) => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    raw: localStorage.getItem(key),
    profiles: JSON.parse(localStorage.getItem(key)).profiles
  }), STORAGE_KEY);
  expect(result.vault).toBe(before);
  expect(result.profiles).toHaveLength(1);
  expect(result.profiles[0].name).toBe('Fictional Wallet');
  expect(result.raw).not.toContain('private-looking-name.json');
  expect(result.raw).not.toMatch(/transactions|records|sourceFingerprint|sourceFilename/i);
});

test('revision-gates an identity-matched replacement and preserves its local identity', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for replacement coverage.');
  const { page } = app;
  const beforeVault = await page.evaluate(() => localStorage.getItem('gringottsBudgetVault.latest'));
  await seedProfiles(page);
  await openImport(page);
  const changed = {
    ...savedProfile,
    profileId: 'portable_changed',
    name: 'Household Visa Updated',
    mapping: { ...savedProfile.mapping, category: '' },
    options: { ...savedProfile.options, accountLabel: 'Household Visa •4242' }
  };
  await chooseBundle(page, bundle([changed]));
  await expect(page.getByText(/source identity matches 1 saved profile/i)).toBeVisible();
  await page.locator('[data-profile-bundle-action]').selectOption('replace');
  const target = page.locator('[data-profile-bundle-target]');
  await expect(target).toBeVisible();
  await target.selectOption(savedProfile.profileId);
  await page.locator('#profileBundleAck').check();
  await page.locator('#commitProfileBundle').click();
  await confirmRevision(page);

  const result = await page.evaluate((key) => ({
    vault: localStorage.getItem('gringottsBudgetVault.latest'),
    profile: JSON.parse(localStorage.getItem(key)).profiles[0],
    revisions: JSON.parse(localStorage.getItem('gringottsImportProfileRevisions.v1')).revisions
  }), STORAGE_KEY);
  expect(result.vault).toBe(beforeVault);
  expect(result.profile.profileId).toBe(savedProfile.profileId);
  expect(result.profile.createdAt).toBe(savedProfile.createdAt);
  expect(result.profile.name).toBe('Household Visa Updated');
  expect(result.profile.options.accountLabel).toBe('Household Visa •4242');
  expect(result.profile.mapping.category).toBe('');
  expect(result.revisions[0].source).toBe('bundle-replace');
});

test('defaults an identical imported definition to Skip and creates no duplicate', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for exact duplicate coverage.');
  const { page } = app;
  await seedProfiles(page);
  await openImport(page);
  await chooseBundle(page, bundle([savedProfile]));
  await expect(page.getByText(/identical saved profile already exists/i)).toBeVisible();
  await expect(page.locator('[data-profile-bundle-action]')).toHaveValue('skip');
  await page.locator('#profileBundleAck').check();
  await page.locator('#commitProfileBundle').click();
  const profiles = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).profiles, STORAGE_KEY);
  expect(profiles).toHaveLength(1);
  expect(profiles[0].profileId).toBe(savedProfile.profileId);
});

test('rejects a transaction-shaped bundle before preview or storage', async ({ app }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for unsafe-file rejection.');
  const { page } = app;
  await seedProfiles(page);
  const before = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await openImport(page);
  const unsafe = { ...bundle([savedProfile]), transactions: [{ amount: 10 }] };
  await page.locator('#profileBundleFile').setInputFiles({
    name: 'unsafe.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(unsafe))
  });
  await expect(page.locator('#profileBundlePreview')).toHaveCount(0);
  await expect(page.locator('#toast')).toContainText(/not permitted in a metadata-only profile file/i);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(before);
});

test('keeps the portability library and conflict controls inside a phone viewport', async ({ app }) => {
  const { page } = app;
  await page.setViewportSize({ width: 390, height: 844 });
  await seedProfiles(page);
  await openImport(page);
  const changed = {
    ...savedProfile,
    name: 'Phone conflict profile',
    options: { ...savedProfile.options, accountLabel: 'Phone conflict destination' }
  };
  await chooseBundle(page, bundle([changed]));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('[data-profile-bundle-action]')).toBeVisible();
  await expect(page.locator('[data-profile-bundle-name]')).toBeVisible();
  await expect(page.locator('#profileBundleAck')).toBeVisible();
});
