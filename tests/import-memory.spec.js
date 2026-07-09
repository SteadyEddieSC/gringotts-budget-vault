import { test, expect, openPrimary } from './helpers/app.js';

const jsonFile = (name, value) => ({
  name,
  mimeType: 'application/json',
  buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value))
});

async function openImport(page) {
  await openPrimary(page, 'Tools');
  await expect(page.getByRole('heading', { name: 'Bank Export Import / Restore' })).toBeVisible();
  await expect(page.locator('#bankImportFile')).toBeAttached();
}

function onlyChromium(testInfo) {
  test.skip(testInfo.project.name !== 'chromium', 'One desktop browser is sufficient for transaction-write scenarios.');
}

test('imports all-new legacy JSON rows with backup, verification, and metadata-only receipt', async ({ app }, testInfo) => {
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
  await page.locator('#bankImportFile').setInputFiles(jsonFile('fictional-all-new.json', incoming));
  await expect(page.getByText('JSON', { exact: true })).toBeVisible();
  await expect(page.getByText(/Gringotts transactions array/i)).toBeVisible();
  await page.locator('#prepareBankDuplicateReview').click();
  await expect(page.getByText(/2 new/).first()).toBeVisible();
  await expect(page.getByText(/no rows for 2026-09/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#prepareBankImportBackup').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/Gringotts_v115_pre_import_12_/i);
  await page.locator('#bankImportAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();
  await expect(page.getByText(/Verified result: 2 inserted, 0 skipped, 14 destination rows/i)).toBeVisible();

  const saved = await page.evaluate(() => {
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const history = JSON.parse(localStorage.getItem('gringottsImportHistory.v1'));
    return { ids: vault.transactions.map((row) => row.id), count: vault.transactions.length, receipt: history.imports[0] };
  });
  expect(saved.count).toBe(14);
  expect(saved.ids).toEqual(expect.arrayContaining(['aug-new-1', 'oct-new-1']));
  expect(saved.receipt).toMatchObject({ format: 'json', insertedCount: 2, verificationResult: 'verified' });
  expect(saved.receipt).not.toHaveProperty('transactions');
  expect(writeRequests).toEqual([]);
});

test('records a verified no-change legacy JSON review for exact duplicates', async ({ app }, testInfo) => {
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
  await page.locator('#bankImportFile').setInputFiles(jsonFile('fictional-exact.json', incoming));
  await page.locator('#prepareBankDuplicateReview').click();
  await expect(page.getByText(/2 skipped automatically/i)).toBeVisible();
  await expect(page.locator('#prepareBankImportBackup')).toBeDisabled();
  await page.locator('#bankImportAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();

  const result = await page.evaluate(() => ({
    count: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length,
    receipt: JSON.parse(localStorage.getItem('gringottsImportHistory.v1')).imports[0]
  }));
  expect(result.count).toBe(12);
  expect(result.receipt.exactDuplicates).toBe(2);
  expect(result.receipt.insertedCount).toBe(0);
  expect(result.receipt.verificationResult).toBe('verified-no-change');
});

test('requires explicit decisions for fuzzy and pending-to-posted JSON candidates', async ({ app }, testInfo) => {
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
  await page.locator('#bankImportFile').setInputFiles(jsonFile('fictional-fuzzy.json', incoming));
  await page.locator('#prepareBankDuplicateReview').click();
  await expect(page.getByText(/2 unresolved/i)).toBeVisible();
  await expect(page.getByText(/pending-to-posted transition/i)).toBeVisible();
  await expect(page.locator('#commitBankImport')).toBeDisabled();

  await page.locator('[data-bank-fuzzy-decision="0"]').selectOption('keep');
  await page.locator('[data-bank-fuzzy-decision="1"]').selectOption('skip');
  await expect(page.getByText(/0 unresolved/i)).toBeVisible();

  await Promise.all([page.waitForEvent('download'), page.locator('#prepareBankImportBackup').click()]);
  await page.locator('#bankImportAck').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#commitBankImport').click();

  const result = await page.evaluate(() => ({
    vault: JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')),
    receipt: JSON.parse(localStorage.getItem('gringottsImportHistory.v1')).imports[0]
  }));
  expect(result.vault.transactions).toHaveLength(13);
  expect(result.vault.transactions.some((row) => row.id === 'near-review-new')).toBe(true);
  expect(result.vault.transactions.some((row) => row.id === 'posted-grocery-new')).toBe(false);
  expect(result.receipt.fuzzyCandidates).toBe(2);
  expect(result.receipt.insertedCount).toBe(1);
  expect(result.receipt.skippedCount).toBe(1);
});

test('blocks malformed, missing-array, and empty JSON without empty-vault overwrite', async ({ app }, testInfo) => {
  onlyChromium(testInfo);
  const { page } = app;
  await openImport(page);

  await page.locator('#bankImportFile').setInputFiles(jsonFile('malformed.json', '{not-json'));
  await expect(page.locator('.error-box').first()).toContainText('Malformed JSON');

  await page.locator('#bankImportFile').setInputFiles(jsonFile('missing-array.json', { version: 'synthetic-missing' }));
  await expect(page.locator('.error-box').first()).toContainText(/No supported CSV\/delimited, OFX, QFX, QBO, or Gringotts JSON signature/i);

  await page.locator('#bankImportFile').setInputFiles(jsonFile('empty-array.json', { version: 'synthetic-empty', transactions: [] }));
  await expect(page.locator('.error-box').first()).toContainText(/populated transactions array/i);
  await expect(page.locator('#commitBankImport')).toHaveCount(0);

  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('gringottsBudgetVault.latest')).transactions.length);
  expect(count).toBe(12);
});

test('keeps the v115 Import / Restore workflow inside phone, tablet, and desktop viewports', async ({ app }) => {
  const { page } = app;
  await openImport(page);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  await expect(page.locator('#bankImportFile')).toBeAttached();
  await expect(page.locator('#restoreFile')).toBeAttached();
});
