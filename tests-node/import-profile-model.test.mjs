import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compatibility, compatibleProfiles, inspectionIdentity, profileApplication,
  profileFromSession, sanitizeStoredProfiles
} from '../src/v117/profile-model.js';

const inspection = {
  format: 'delimited',
  delimiter: ',',
  schema: { id: 'generic-signed', label: 'Generic signed-amount CSV' },
  headers: ['Date', 'Description', 'Amount', 'Status', 'Reference']
};

const options = {
  mapping: { date: 'Date', description: 'Description', amount: 'Amount', status: 'Status', id: 'Reference' },
  dateOrder: 'mdy',
  signMode: 'bank',
  accountLabel: 'Household Card',
  accountMode: 'label',
  useSourceCategory: false
};

test('creates a metadata-only profile from inspected headers and reviewed options', () => {
  const profile = profileFromSession({ name: 'Household card export', inspection, options, now: '2026-07-10T00:00:00.000Z' });
  assert.equal(profile.name, 'Household card export');
  assert.equal(profile.schemaId, 'generic-signed');
  assert.match(profile.headerSignature, /^fnv1a-[0-9a-f]{8}$/);
  assert.deepEqual(profile.mapping, options.mapping);
  assert.equal(profile.options.signMode, 'bank');
  const serialized = JSON.stringify(profile);
  assert.doesNotMatch(serialized, /transactions|records|directTransactions|sourceFingerprint|fileName/);
});

test('applies only to an exact format schema delimiter and ordered-header signature', () => {
  const profile = profileFromSession({ name: 'Exact profile', inspection, options });
  assert.equal(compatibility(profile, inspection).compatible, true);
  assert.equal(compatibleProfiles([profile], inspection).length, 1);
  const reordered = { ...inspection, headers: ['Description', 'Date', 'Amount', 'Status', 'Reference'] };
  const changed = compatibility(profile, reordered);
  assert.equal(changed.compatible, false);
  assert.match(changed.reasons.join(' '), /ordered header signature changed/i);
});

test('rejects a profile when a remembered mapped header is missing', () => {
  const profile = profileFromSession({ name: 'Missing header profile', inspection, options });
  const changed = { ...inspection, headers: ['Date', 'Description', 'Amount', 'Status', 'Different ID'] };
  const result = compatibility(profile, changed);
  assert.equal(result.compatible, false);
  assert.match(result.reasons.join(' '), /mapped header.*Reference/i);
});

test('returns a safe application payload with mapping and options only', () => {
  const profile = profileFromSession({ name: 'Apply me', inspection, options });
  const applied = profileApplication(profile, inspection);
  assert.equal(applied.profileName, 'Apply me');
  assert.deepEqual(applied.mapping, options.mapping);
  assert.deepEqual(applied.options, {
    dateOrder: 'mdy', signMode: 'bank', accountLabel: 'Household Card',
    accountMode: 'label', useSourceCategory: false
  });
});

test('sanitizes invalid stored profiles and caps unsafe option values', () => {
  const [profile] = sanitizeStoredProfiles({ profiles: [{
    profileId: 'profile_test', name: ' Saved ', format: 'DELIMITED', schemaId: 'generic-signed',
    schemaLabel: 'Generic', delimiter: ',', headerSignature: 'fnv1a-12345678', headerCount: 3,
    mapping: { date: 'Date', amount: 'Amount' },
    options: { dateOrder: 'unknown', signMode: 'danger', accountLabel: ' A ', accountMode: 'invalid', useSourceCategory: true },
    createdAt: '2026-01-01', updatedAt: '2026-01-02'
  }] });
  assert.equal(profile.name, 'Saved');
  assert.equal(profile.format, 'delimited');
  assert.deepEqual(profile.mapping, { date: 'Date', description: '', amount: 'Amount', debit: '', credit: '', status: '', account: '', memo: '', id: '', category: '', type: '' });
  assert.equal(profile.options.dateOrder, 'auto');
  assert.equal(profile.options.signMode, '');
  assert.equal(profile.options.accountMode, 'label');
  assert.equal(profile.options.accountLabel, 'A');
});

test('uses a deterministic header identity without retaining raw rows', () => {
  const identity = inspectionIdentity(inspection);
  assert.deepEqual(identity, {
    format: 'delimited', schemaId: 'generic-signed', schemaLabel: 'Generic signed-amount CSV',
    delimiter: ',', headerSignature: identity.headerSignature, headerCount: 5
  });
  assert.match(identity.headerSignature, /^fnv1a-/);
});
