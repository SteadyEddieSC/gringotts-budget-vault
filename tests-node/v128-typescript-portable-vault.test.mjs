import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  AUTHORITATIVE_VAULT_KEY,
  PORTABLE_VAULT_FORMAT,
  PORTABLE_VAULT_FORMAT_VERSION,
  PORTABLE_VAULT_SCHEMA_VERSION
} from '../src/v128/contracts.js';
import {
  canonicalJson,
  createPortableVaultPackage,
  parsePortableVaultPackage,
  portableVaultFilename,
  serializePortableVaultPackage,
  validatePortableVaultPackage
} from '../src/v128/portable-vault.js';

const syntheticVault = {
  release: 'v128-fixture',
  transactions: [
    { id: 'tx-2', date: '2026-08-02', name: 'Synthetic Grocer', amount: 42.5, type: 'Expense', category: 'Groceries' },
    { id: 'tx-1', date: '2026-08-01', name: 'Synthetic Deposit', amount: -1000, type: 'Income', category: 'Income' }
  ],
  metadata: { owner: 'Synthetic Household', reviewed: true }
};

const createdAt = '2026-08-03T03:30:00.000Z';

test('creates a deterministic local-only portable package and round-trips it', async () => {
  const packageValue = await createPortableVaultPackage(syntheticVault, { createdAt, sourceRelease: 'v128' });
  assert.equal(packageValue.manifest.format, PORTABLE_VAULT_FORMAT);
  assert.equal(packageValue.manifest.formatVersion, PORTABLE_VAULT_FORMAT_VERSION);
  assert.equal(packageValue.manifest.schemaVersion, PORTABLE_VAULT_SCHEMA_VERSION);
  assert.equal(packageValue.manifest.destinationKey, AUTHORITATIVE_VAULT_KEY);
  assert.equal(packageValue.manifest.transactionCount, 2);
  assert.deepEqual(packageValue.manifest.privacy, {
    deviceLocal: true,
    networkRequired: false,
    cloudStored: false,
    encryption: 'none-foundation-only'
  });
  assert.match(packageValue.manifest.integrity.digest, /^[a-f0-9]{64}$/);

  const text = serializePortableVaultPackage(packageValue);
  const parsed = await parsePortableVaultPackage(text);
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.package, packageValue);
  assert.equal(parsed.canonicalVault, canonicalJson(packageValue.vault));
});

test('canonical JSON is stable across object insertion order', () => {
  assert.equal(
    canonicalJson({ z: 1, nested: { b: 2, a: 1 }, a: 3 }),
    canonicalJson({ a: 3, nested: { a: 1, b: 2 }, z: 1 })
  );
});

test('rejects empty vaults and non-authoritative destinations', async () => {
  await assert.rejects(() => createPortableVaultPackage({ transactions: [] }, { createdAt }), /empty transaction arrays/i);
  await assert.rejects(
    () => createPortableVaultPackage(syntheticVault, { createdAt, destinationKey: 'other-vault' }),
    /non-authoritative destination/i
  );
});

test('rejects tampering, count mismatches, and unsupported versions', async () => {
  const packageValue = await createPortableVaultPackage(syntheticVault, { createdAt });

  const tampered = structuredClone(packageValue);
  tampered.vault.transactions[0].amount = 999;
  await assert.rejects(() => validatePortableVaultPackage(tampered), /integrity verification failed/i);

  const wrongCount = structuredClone(packageValue);
  wrongCount.manifest.transactionCount = 1;
  await assert.rejects(() => validatePortableVaultPackage(wrongCount), /transaction count/i);

  const wrongSchema = structuredClone(packageValue);
  wrongSchema.manifest.schemaVersion = 99;
  await assert.rejects(() => validatePortableVaultPackage(wrongSchema), /unsupported schema version/i);
});

test('package operations do not call network or browser persistence APIs', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  let fetchCalls = 0;
  let storageCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error('network forbidden'); };
  globalThis.localStorage = new Proxy({}, { get() { storageCalls += 1; throw new Error('storage forbidden'); } });
  try {
    const packageValue = await createPortableVaultPackage(syntheticVault, { createdAt });
    await parsePortableVaultPackage(serializePortableVaultPackage(packageValue));
  } finally {
    if (originalFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
  assert.equal(fetchCalls, 0);
  assert.equal(storageCalls, 0);
});

test('source contracts contain no network or storage implementation', () => {
  const source = fs.readFileSync(new URL('../src/v128/portable-vault.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB)\b/);
  assert.match(source, /none-foundation-only/);
});

test('portable filenames are stable and provider-neutral', () => {
  assert.equal(portableVaultFilename(createdAt), 'Gringotts_Vault_2026-08-03T03-30-00-000Z.gringotts');
});
