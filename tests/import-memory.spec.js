import { test, expect, openPrimary } from './helpers/app.js';

const jsonFile = (name, value) => ({
  name,
  mimeType: 'application/json',
  buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
});

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Import / Restore' })).toBeVisible();
  await expect(page.locator('#importFile')).toBeAttached();
}

function onlyChromium(testInfo) {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for transaction-write scenarios.');
}

test('imports all-new rows, warns about missing periods, verifies storage, and records metadata-only history', async ({ app }, testInfo) => {
  onlyChromium(testInfo);
  const { page } = app;
  await openImport(page);
  const writeRequests = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && !request.url().startsWith('blob:')) writeRequests.push(request.url()); });

  const incoming = {
    version: 'synthetic-import-all-new',
    source: { fileName: 'fictional-all-new.json', institution: 'Synthetic Test Bank' },
    transactions: [
      { id: 'aug-new-1', date: '2026-08-01', name: 'Fictional School Supplies', amount: 64.25, account: 'Test Checking', category: 'Education', pending: false },
      { id: 'oct-new-1', date: '2026-10-01', name: 'Fictional Autumn Market', amount: 91.4, account: 'Test Checking', category: 'Groceries', pending: false }
    ]
  };
  await page.locator('#importFile').setInputFiles(jsonFile('fictional-all-new.json', incoming));
  await expect(page.getByText(/2 new/).first()).toBeVisible();
  await expect(page.getByText(/no rows for 2026-09/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#prepareImportBackup').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v109_pre_import_12_/i);
  await page.locator('#importAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitImport').click();
  await expect(page.getByText(/Verified result: 2 inserted, 0 skipped, 14 destination rows/i)).toBeVisible();

  const saved = await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const history = JSON.parse(localStorage.getItem('gringottsImportHistory.v1'));
    return { ids: vault.transactions.map((row) => row.id), count: vault.transactions.length, history };
  });
  expect(saved.count).toBe(14);
  expect(saved.ids).toEqual(expect.arrayContaining(['aug-new-1', 'oct-new-1']));
  expect(saved.history.imports[0].insertedCount).toBe(2);
  expect(saved.history.imports[0].verificationResult).toBe('verified');
  expect(saved.history.imports[0]).not.toHaveProperty('transactions');
  expect(writeRequests).toEqual([]);
});

test('skips exact ID and deterministic-fingerprint duplicates without rewriting the vault', async ({ app }, testInfo) => {
  onlyChromium(testInfo);
  const { page } = app;
  await openImport(page);
  const incoming = {
    version: 'synthetic-import-exact',
    transactions: [
      { id: 'jul-utility-1', date: '2026-07-05', name: 'Electric Utility', amount: 145, account: 'Test Checking' },
      { date: '2026-07-10', name: 'StreamFlix', merchant: 'StreamFlix', amount: 19.99, account: 'Test Credit Card' }
    ]
  };
  await page.locator('#importFile').setInputFiles(jsonFile('fictional-exact.json', incoming));
  await expect(page.getByText(/2 skipped automatically/i)).toBeVisible();
  await expect(page.locator('#prepareImportBackup')).toBeDisabled();
  await page.locator('#importAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitImport').click();

  const result = await page.evaluate(() => ({
    count: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    history: JSON.parse(localStorage.getItem('gringottsImportHistory.v1')).imports[0]
  }));
  expect(result.count).toBe(12);
  expect(result.history.exactDuplicates).toBe(2);
  expect(result.history.insertedCount).toBe(0);
  expect(result.history.verificationResult).toBe('verified-no-change');
});

test('requires explicit decisions for fuzzy and pending-to-posted candidates before a missing-only merge', async ({ app }, testInfo) => {
  onlyChromium(testInfo);
  const { page } = app;
  await openImport(page);
  const incoming = {
    version: 'synthetic-import-fuzzy',
    transactions: [
      { id: 'near-review-new', date: '2026-07-16', name: 'Needs Review Purchase LLC', amount: 42.5, account: 'Test Checking', pending: false },
      { id: 'posted-grocery-new', date: '2026-07-15', name: 'Pending Groceries Posted', amount: 88.12, account: 'Test Checking', pending: false }
    ]
  };
  await page.locator('#importFile').setInputFiles(jsonFile('fictional-fuzzy.json', incoming));
  await expect(page.getByText(/2 unresolved/i)).toBeVisible();
  await expect(page.getByText(/pending-to-posted transition/i)).toBeVisible();
  await expect(page.locator('#commitImport')).toBeDisabled();

  await page.locator('[data-fuzzy-decision="0"]').selectOption('keep');
  await page.locator('[data-fuzzy-decision="1"]').selectOption('skip');
  await expect(page.getByText(/0 unresolved/i)).toBeVisible();

  await Promise.all([page.waitForEvent('download'), page.locator('#prepareImportBackup').click()]);
  await page.locator('#importAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitImport').click();

  const result = await page.evaluate(() => ({
    vault: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')),
    history: JSON.parse(localStorage.getItem('gringottsImportHistory.v1')).imports[0]
  }));
  expect(result.vault.transactions).toHaveLength(13);
  expect(result.vault.transactions.some((row) => row.id === 'near-review-new')).toBe(true);
  expect(result.vault.transactions.some((row) => row.id === 'posted-grocery-new')).toBe(false);
  expect(result.history.fuzzyCandidates).toBe(2);
  expect(result.history.insertedCount).toBe(1);
  expect(result.history.skippedCount).toBe(1);
});

test('blocks malformed, missing-array, and empty import files without empty-vault overwrite', async ({ app }, testInfo) => {
  onlyChromium(testInfo);
  const { page } = app;
  await openImport(page);

  await page.locator('#importFile').setInputFiles(jsonFile('malformed.json', '{not-json'));
  await expect(page.locator('.error-box').first()).toContainText('Malformed JSON');

  await page.locator('#importFile').setInputFiles(jsonFile('missing-array.json', { version: 'synthetic-missing' }));
  await expect(page.locator('.error-box').first()).toContainText('does not contain a transactions array');

  await page.locator('#importFile').setInputFiles(jsonFile('empty-array.json', { version: 'synthetic-empty', transactions: [] }));
  await expect(page.locator('.error-box').first()).toContainText('transactions array is empty');
  await expect(page.locator('#commitImport')).toHaveCount(0);

  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length);
  expect(count).toBe(12);
});

test('keeps the Import / Restore workflow inside phone, tablet, and desktop viewports', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  await expect(page.locator('#importDestination')).toHaveJSProperty('tagName', 'SELECT');
  await expect(page.locator('#restoreFile')).toBeAttached();
});
