import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertReceiptAuditPackageSafe, auditImportReceipt, buildReceiptAuditPackage,
  normalizeImportReceipt, summarizeReceiptAudits
} from '../src/v120/import-receipt-audit-model.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from '../src/v120/roadmap-horizon.js';

const verifiedReceipt = {
  importId: 'import_synthetic_1',
  timestamp: '2026-07-10T12:00:00.000Z',
  sourceFilename: 'SECRET-household-card.csv',
  sourceFingerprint: 'SECRET-FINGERPRINT-123456789',
  source: 'Synthetic card activity',
  format: 'delimited',
  detectedSchema: 'Card activity export',
  schemaConfidence: 'high',
  encoding: 'UTF-8',
  mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
  signMode: 'bank',
  dateOrder: 'mdy',
  warningCount: 1,
  transactionCount: 12,
  earliestDate: '2026-06-01',
  latestDate: '2026-06-30',
  exactDuplicates: 3,
  fuzzyCandidates: 1,
  insertedCount: 8,
  skippedCount: 4,
  selectedDestinationVault: 'SECRET-destination-key',
  destinationBeforeCount: 92,
  destinationAfterCount: 100,
  verificationResult: 'verified'
};

const noChangeReceipt = {
  ...verifiedReceipt,
  importId: 'import_synthetic_2',
  transactionCount: 12,
  insertedCount: 0,
  skippedCount: 12,
  destinationBeforeCount: 100,
  destinationAfterCount: 100,
  verificationResult: 'verified-no-change'
};

test('normalizes legacy receipt values without transaction rows', () => {
  const receipt = normalizeImportReceipt({ insertedCount: '2', skippedCount: '3' }, 4);
  assert.equal(receipt.importId, 'legacy-receipt-5');
  assert.equal(receipt.insertedCount, 2);
  assert.equal(receipt.skippedCount, 3);
  assert.equal('transactions' in receipt, false);
});

test('audits a verified receipt and derives the expected backup pattern', () => {
  const audit = auditImportReceipt(verifiedReceipt, { currentDestinationCount: 100, now: '2026-07-10T13:00:00.000Z' });
  assert.equal(audit.status, 'verified');
  assert.equal(audit.backup.expected, true);
  assert.equal(audit.backup.filenamePattern, 'Gringotts_v115_pre_import_92_*.json');
  assert.ok(audit.checks.every((check) => check.status === 'pass'));
  assert.equal(audit.rollback.automaticRollbackAvailable, false);
  assert.equal(audit.rollback.destructiveActionPerformed, false);
});

test('recognizes verified no-change receipts without inventing a backup requirement', () => {
  const audit = auditImportReceipt(noChangeReceipt, { currentDestinationCount: 100 });
  assert.equal(audit.status, 'verified');
  assert.equal(audit.backup.expected, false);
  assert.equal(audit.backup.filenamePattern, '');
  assert.match(audit.rollback.steps[0], /No pre-import backup was required/i);
});

test('flags inconsistent count arithmetic for manual review', () => {
  const audit = auditImportReceipt({
    ...verifiedReceipt,
    destinationAfterCount: 99,
    transactionCount: 13
  }, { currentDestinationCount: 101 });
  assert.equal(audit.status, 'needs-review');
  assert.ok(audit.checks.some((check) => check.id === 'destination-arithmetic' && check.status === 'fail'));
  assert.ok(audit.checks.some((check) => check.id === 'incoming-reconciliation' && check.status === 'fail'));
});

test('builds a sanitized audit package without household identifiers or rows', () => {
  const audit = auditImportReceipt(verifiedReceipt, { currentDestinationCount: 100 });
  const payload = buildReceiptAuditPackage(audit, { now: '2026-07-10T13:00:00.000Z' });
  assert.equal(payload.kind, 'gringotts-import-receipt-audit');
  assert.equal(payload.counts.destinationAfter, 100);
  assert.equal(payload.rollback.automaticRollbackAvailable, false);
  assert.equal(assertReceiptAuditPackageSafe(payload), true);
  const text = JSON.stringify(payload);
  assert.doesNotMatch(text, /SECRET-household-card|SECRET-FINGERPRINT|SECRET-destination-key|SECRET MERCHANT/i);
  assert.doesNotMatch(text, /"transactions"\s*:|"records"\s*:|"rows"\s*:/i);
});

test('summarizes multiple receipt audit states', () => {
  const inconsistent = { ...verifiedReceipt, importId: 'import_synthetic_3', destinationAfterCount: 99 };
  const summary = summarizeReceiptAudits([verifiedReceipt, noChangeReceipt, inconsistent], {
    'SECRET-destination-key': 100
  });
  assert.equal(summary.count, 3);
  assert.equal(summary.verified, 2);
  assert.equal(summary.needsReview, 1);
  assert.equal(summary.backupExpected, 2);
});

test('ships a detailed seven-release roadmap horizon', () => {
  assert.equal(validateRoadmapHorizon(), true);
  assert.ok(ROADMAP_HORIZON.length >= 7);
  assert.equal(ROADMAP_HORIZON[0].version, 'v120');
  assert.equal(ROADMAP_HORIZON.at(-1).version, 'v126');
  ROADMAP_HORIZON.forEach((entry) => {
    assert.ok(entry.scope.length >= 3);
    assert.ok(entry.dependencies.length >= 2);
    assert.ok(entry.safeguards.length >= 2);
    assert.ok(entry.outcome.length > 40);
  });
});
