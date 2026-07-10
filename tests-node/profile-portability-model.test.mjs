import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROFILE_BUNDLE_KIND, PROFILE_BUNDLE_VERSION, applyProfileImportPlan,
  exportProfileBundle, inspectProfileBundle, parseProfileBundle, profileDifferences,
  profileLibrary
} from '../src/v118/profile-portability-model.js';

const base = {
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

const changed = {
  ...base,
  profileId: 'portable_source',
  name: 'Household Visa Updated',
  mapping: { ...base.mapping, category: '' },
  options: { ...base.options, accountLabel: 'Household Visa •4242' }
};

const newProfile = {
  ...base,
  profileId: 'portable_new',
  name: 'Fictional Wallet',
  schemaId: 'generic-signed',
  schemaLabel: 'Generic signed-amount CSV',
  headerSignature: 'fnv1a-87654321',
  headerCount: 7,
  mapping: {
    date: 'Activity Date', description: 'Name', amount: 'Net Amount', debit: '', credit: '',
    status: 'Status', account: '', memo: 'Note', id: 'Transaction ID', category: '', type: 'Type'
  },
  options: { ...base.options, dateOrder: 'auto', accountLabel: 'Fictional Wallet' }
};

test('exports a versioned metadata-only bundle without local IDs or timestamps', () => {
  const bundle = exportProfileBundle([base], { now: '2026-07-10T12:00:00.000Z' });
  assert.equal(bundle.kind, PROFILE_BUNDLE_KIND);
  assert.equal(bundle.version, PROFILE_BUNDLE_VERSION);
  assert.equal(bundle.profileCount, 1);
  assert.equal(bundle.profiles[0].profileId, undefined);
  assert.equal(bundle.profiles[0].createdAt, undefined);
  assert.equal(bundle.profiles[0].updatedAt, undefined);
  const serialized = JSON.stringify(bundle);
  assert.doesNotMatch(serialized, /transactions|records|sourceFingerprint|sourceFilename|accountNumber|credentials/i);
});

test('rejects unknown files and forbidden transaction-shaped payloads', () => {
  assert.throws(() => parseProfileBundle({ profiles: [] }), /not a Gringotts/i);
  const bundle = exportProfileBundle([base]);
  bundle.transactions = [{ amount: 10 }];
  assert.throws(() => parseProfileBundle(bundle), /not permitted/i);
});

test('classifies exact, same-definition, identity, name, and new cases', () => {
  assert.equal(inspectProfileBundle(exportProfileBundle([base]), [base]).items[0].status, 'exact');
  assert.equal(inspectProfileBundle(exportProfileBundle([{ ...base, name: 'Second name' }]), [base]).items[0].status, 'same-definition');
  assert.equal(inspectProfileBundle(exportProfileBundle([changed]), [base]).items[0].status, 'identity-conflict');
  assert.equal(inspectProfileBundle(exportProfileBundle([{ ...newProfile, name: base.name }]), [base]).items[0].status, 'name-conflict');
  assert.equal(inspectProfileBundle(exportProfileBundle([newProfile]), [base]).items[0].status, 'new');
});

test('explains mapping and option differences before replacement', () => {
  const differences = profileDifferences(base, changed).join(' ');
  assert.match(differences, /Name differs/i);
  assert.match(differences, /Mapped category field differs/i);
  assert.match(differences, /accountLabel option differs/i);
});

test('adds a reviewed new profile and skips exact duplicates', () => {
  const preview = inspectProfileBundle(exportProfileBundle([base, newProfile]), [base]);
  const decisions = preview.items.map((item) => ({
    itemId: item.itemId,
    action: item.status === 'new' ? 'add' : 'skip',
    name: item.suggestedName
  }));
  const result = applyProfileImportPlan([base], preview, decisions, {
    now: '2026-07-10T12:00:00.000Z',
    idFactory: () => 'profile_added'
  });
  assert.deepEqual(result.counts, { added: 1, replaced: 0, skipped: 1 });
  assert.equal(result.profiles.length, 2);
  assert.equal(result.profiles[0].profileId, 'profile_added');
});

test('replaces only an identity-matched target and preserves its local identity', () => {
  const preview = inspectProfileBundle(exportProfileBundle([changed]), [base]);
  const item = preview.items[0];
  assert.equal(item.status, 'identity-conflict');
  const result = applyProfileImportPlan([base], preview, [{
    itemId: item.itemId,
    action: 'replace',
    name: changed.name,
    targetProfileId: base.profileId
  }], { now: '2026-07-10T12:00:00.000Z' });
  assert.deepEqual(result.counts, { added: 0, replaced: 1, skipped: 0 });
  assert.equal(result.profiles[0].profileId, base.profileId);
  assert.equal(result.profiles[0].createdAt, base.createdAt);
  assert.equal(result.profiles[0].updatedAt, '2026-07-10T12:00:00.000Z');
  assert.equal(result.profiles[0].options.accountLabel, 'Household Visa •4242');
});

test('blocks unreviewed actions, duplicate names, and invalid replacement targets', () => {
  const preview = inspectProfileBundle(exportProfileBundle([newProfile]), [base]);
  const item = preview.items[0];
  assert.throws(() => applyProfileImportPlan([base], preview, []), /Choose Add/i);
  assert.throws(() => applyProfileImportPlan([base], preview, [{ itemId: item.itemId, action: 'add', name: base.name }]), /already in use/i);
  assert.throws(() => applyProfileImportPlan([base], preview, [{ itemId: item.itemId, action: 'replace', name: 'No target', targetProfileId: base.profileId }]), /identity-matched/i);
});

test('builds a sorted management library without exposing mappings', () => {
  const library = profileLibrary([newProfile, base]);
  assert.equal(library.length, 2);
  assert.deepEqual(Object.keys(library[0]).sort(), ['accountLabel', 'identity', 'name', 'profileId', 'schema', 'updatedAt'].sort());
  assert.equal(JSON.stringify(library).includes('Reference Number'), false);
});
