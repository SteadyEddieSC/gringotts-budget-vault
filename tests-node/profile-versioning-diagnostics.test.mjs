import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendRevisionHistory, assertDryRunDiagnosticSafe, buildDryRunDiagnostic,
  createProfileRevisionSummary, dryRunDiagnosticSignature, profileRevisionChanges,
  sanitizeRevisionHistory
} from '../src/v119/profile-versioning-model.js';

const base = {
  profileId: 'profile_existing', name: 'Household Card', format: 'delimited',
  schemaId: 'generic-signed', schemaLabel: 'Generic signed-amount CSV', delimiter: ',',
  headerSignature: 'fnv1a-12345678', headerCount: 6,
  mapping: { date: 'Date', description: 'Description', amount: 'Amount', debit: '', credit: '', status: 'Status', account: '', memo: 'Memo', id: 'Reference', category: '', type: '' },
  options: { dateOrder: 'mdy', signMode: 'bank', accountLabel: 'Household Card', accountMode: 'label', useSourceCategory: false },
  createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-02T00:00:00.000Z'
};
const changed = {
  ...base, name: 'Household Card Reviewed',
  mapping: { ...base.mapping, category: 'Category' },
  options: { ...base.options, accountLabel: 'Household Card •4242', useSourceCategory: true },
  updatedAt: '2026-07-10T12:00:00.000Z'
};

const state = {
  encoding: 'UTF-8', inspected: true, normalized: true, ready: false,
  acknowledged: false, backupPrepared: false,
  inspection: {
    format: 'delimited', delimiter: ',', headers: ['Date', 'Description', 'Amount', 'Status', 'Reference', 'Memo'],
    rowCount: 3, records: [{ Description: 'SECRET MERCHANT' }],
    schema: { id: 'generic-signed', label: 'Generic signed-amount CSV' }
  },
  sourceFingerprint: 'SECRET-FINGERPRINT', fileName: 'private-bank.csv',
  options: { ...base.options, mapping: base.mapping },
  normalization: { transactions: [{ name: 'SECRET MERCHANT', amount: 45 }], errors: [], warnings: ['review sign'] },
  analysis: { coverage: { incomingEarliest: '2026-07-01', incomingLatest: '2026-07-03', existingEarliest: '2026-01-01', existingLatest: '2026-06-30', overlap: 'None', missingIncomingMonths: [] } },
  counts: { exact: 1, fuzzy: 1, fresh: 1, fuzzyKeep: 0, fuzzySkip: 0, unresolved: 1, inserted: 1, skipped: 1 }
};

const profileSnapshot = { profiles: [base], appliedProfileId: base.profileId };

test('compares profile fields and redacts local account-label values', () => {
  const changes = profileRevisionChanges(base, changed);
  assert.ok(changes.some((change) => change.path === 'mapping.category'));
  const label = changes.find((change) => change.path === 'options.accountLabel');
  assert.equal(label.before, '[local label changed]');
  assert.equal(label.after, '[local label changed]');
});

test('creates bounded metadata-only revision summaries', () => {
  const summary = createProfileRevisionSummary(base, changed, { source: 'local-update', now: '2026-07-10T12:00:00.000Z' });
  assert.equal(summary.profileId, base.profileId);
  assert.equal(summary.source, 'local-update');
  assert.ok(summary.changeCount >= 3);
  assert.doesNotMatch(JSON.stringify(summary), /SECRET MERCHANT|4242|transactions|records|sourceFingerprint/i);
  const history = appendRevisionHistory({ revisions: [] }, summary);
  assert.equal(history.length, 1);
  assert.deepEqual(sanitizeRevisionHistory({ revisions: history }), history);
});

test('builds a dry-run diagnostic without rows, filenames, fingerprints, labels, or vault contents', () => {
  const diagnostic = buildDryRunDiagnostic(state, { profileSnapshot, now: '2026-07-10T12:00:00.000Z' });
  assert.equal(diagnostic.kind, 'gringotts-import-dry-run-diagnostic');
  assert.equal(diagnostic.duplicates.exact, 1);
  assert.equal(diagnostic.duplicates.unresolved, 1);
  assert.equal(diagnostic.readiness.transactionWritePerformed, false);
  const text = JSON.stringify(diagnostic);
  assert.doesNotMatch(text, /SECRET MERCHANT|SECRET-FINGERPRINT|private-bank\.csv|Household Card|4242/i);
  assert.equal(assertDryRunDiagnosticSafe(diagnostic), true);
});

test('changes diagnostic identity when mapping or reconciliation decisions change', () => {
  const original = dryRunDiagnosticSignature(state, profileSnapshot);
  const changedState = { ...state, counts: { ...state.counts, unresolved: 0, inserted: 2 } };
  assert.notEqual(dryRunDiagnosticSignature(changedState, profileSnapshot), original);
});
