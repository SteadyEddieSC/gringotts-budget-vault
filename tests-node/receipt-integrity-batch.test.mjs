import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_IMPORT_BATCH_LINKS, appendBatchLink, assertReceiptTimelinePackageSafe,
  buildReceiptTimeline, buildReceiptTimelinePackage, createDryRunReceiptLink,
  filterReceiptTimeline, sanitizeBatchIndex
} from '../src/v121/receipt-integrity-model.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from '../src/v121/roadmap-horizon.js';

function receipt(overrides = {}) {
  return {
    importId: 'receipt-1',
    timestamp: '2026-07-01T12:00:00.000Z',
    sourceFilename: 'SECRET-household.csv',
    sourceFingerprint: 'SECRET-fingerprint-a',
    source: 'Synthetic source',
    format: 'delimited',
    detectedSchema: 'Synthetic ledger',
    schemaConfidence: 'high',
    encoding: 'UTF-8',
    mappingSummary: 'date:Date; description:SECRET MERCHANT; amount:Amount',
    signMode: 'bank',
    dateOrder: 'mdy',
    warningCount: 0,
    transactionCount: 10,
    earliestDate: '2026-06-01',
    latestDate: '2026-06-30',
    exactDuplicates: 2,
    fuzzyCandidates: 0,
    insertedCount: 8,
    skippedCount: 2,
    selectedDestinationVault: 'SECRET-destination-key',
    destinationBeforeCount: 100,
    destinationAfterCount: 108,
    verificationResult: 'verified',
    ...overrides
  };
}

function dryRun(overrides = {}) {
  return {
    current: true,
    signature: 'fnv1a-1234abcd',
    createdAt: '2026-07-01T11:55:00.000Z',
    source: {
      format: 'delimited',
      schemaId: 'synthetic-ledger',
      schemaLabel: 'Synthetic ledger'
    },
    validation: {
      normalizedRowCount: 10,
      normalizationErrorCount: 0,
      normalizationWarningCount: 1
    },
    duplicates: {
      wouldInsert: 8,
      wouldSkip: 2
    },
    readiness: {
      transactionWriteReady: true
    },
    ...overrides
  };
}

test('creates a privacy-safe dry-run link only after count and source reconciliation', () => {
  const link = createDryRunReceiptLink(receipt(), dryRun(), {
    now: '2026-07-01T12:00:01.000Z',
    linkId: 'link-1'
  });
  assert.equal(link.receiptImportId, 'receipt-1');
  assert.equal(link.verifiedCounts, true);
  assert.equal(link.normalizedRowCount, 10);
  assert.equal(link.wouldInsert, 8);
  assert.equal(link.wouldSkip, 2);
  assert.equal(link.transactionWriteReady, true);
  assert.deepEqual(link.dataBoundary, {
    transactionRowsIncluded: false,
    sourceFileNameIncluded: false,
    sourceFingerprintIncluded: false,
    destinationStorageKeyIncluded: false,
    accountIdentifiersIncluded: false,
    merchantNamesIncluded: false,
    vaultContentsIncluded: false
  });
  const text = JSON.stringify(link);
  assert.doesNotMatch(text, /SECRET-household|SECRET-fingerprint|SECRET-destination|SECRET MERCHANT/i);
});

test('rejects stale or mismatched dry-run linkage', () => {
  assert.throws(() => createDryRunReceiptLink(receipt(), dryRun({ current: false })), /missing or no longer matches/i);
  assert.throws(() => createDryRunReceiptLink(receipt(), dryRun({
    validation: { normalizedRowCount: 11, normalizationErrorCount: 0, normalizationWarningCount: 0 }
  })), /does not reconcile/i);
  assert.throws(() => createDryRunReceiptLink(receipt(), dryRun({
    source: { format: 'ofx', schemaId: 'ofx', schemaLabel: 'OFX ledger' }
  })), /does not reconcile/i);
});

test('bounds and deduplicates the metadata-only batch index', () => {
  const base = createDryRunReceiptLink(receipt(), dryRun(), {
    now: '2026-07-01T12:00:01.000Z', linkId: 'link-1'
  });
  let index = appendBatchLink({}, base, { now: '2026-07-01T12:00:02.000Z' });
  index = appendBatchLink(index, { ...base, linkId: 'link-2' }, { now: '2026-07-01T12:00:03.000Z' });
  assert.equal(index.links.length, 1);
  assert.equal(index.links[0].linkId, 'link-2');

  const many = [];
  for (let number = 0; number < MAX_IMPORT_BATCH_LINKS + 15; number += 1) {
    many.push({
      ...base,
      linkId: `link-${number}`,
      receiptImportId: `receipt-${number}`,
      linkedAt: new Date(Date.UTC(2026, 6, 1, 12, 0, number)).toISOString()
    });
  }
  assert.equal(sanitizeBatchIndex({ links: many }).links.length, MAX_IMPORT_BATCH_LINKS);
});

test('derives continuous, untracked-increase, and count-decrease lineage', () => {
  const receipts = [
    receipt({ importId: 'receipt-3', timestamp: '2026-07-03T12:00:00.000Z', destinationBeforeCount: 120, destinationAfterCount: 118, transactionCount: 2, insertedCount: 0, skippedCount: 2, verificationResult: 'verified-no-change', sourceFingerprint: 'fingerprint-c' }),
    receipt({ importId: 'receipt-2', timestamp: '2026-07-02T12:00:00.000Z', destinationBeforeCount: 110, destinationAfterCount: 112, transactionCount: 4, insertedCount: 2, skippedCount: 2, sourceFingerprint: 'fingerprint-b' }),
    receipt({ importId: 'receipt-1', timestamp: '2026-07-01T12:00:00.000Z', destinationBeforeCount: 100, destinationAfterCount: 108, sourceFingerprint: 'fingerprint-a' })
  ];
  const timeline = buildReceiptTimeline(receipts);
  const first = timeline.batches.find((batch) => batch.receipt.importId === 'receipt-1');
  const second = timeline.batches.find((batch) => batch.receipt.importId === 'receipt-2');
  const third = timeline.batches.find((batch) => batch.receipt.importId === 'receipt-3');
  assert.equal(first.continuity.state, 'origin');
  assert.equal(second.continuity.state, 'untracked-increase');
  assert.equal(third.continuity.state, 'untracked-increase');
  assert.equal(timeline.summary.lineageBreaks, 2);

  const decrease = buildReceiptTimeline([
    receipt({ importId: 'older', timestamp: '2026-07-01T12:00:00.000Z', destinationAfterCount: 120 }),
    receipt({ importId: 'newer', timestamp: '2026-07-02T12:00:00.000Z', destinationBeforeCount: 110, destinationAfterCount: 112 })
  ]).batches.find((batch) => batch.receipt.importId === 'newer');
  assert.equal(decrease.continuity.state, 'count-decrease');
});

test('links a verified dry run and detects duplicate receipt identities', () => {
  const sourceReceipt = receipt();
  const link = createDryRunReceiptLink(sourceReceipt, dryRun(), {
    now: '2026-07-01T12:00:01.000Z', linkId: 'link-1'
  });
  const index = appendBatchLink({}, link, { now: '2026-07-01T12:00:02.000Z' });
  const timeline = buildReceiptTimeline([sourceReceipt, { ...sourceReceipt }], index);
  assert.equal(timeline.summary.needsReview, 2);
  assert.equal(timeline.summary.linkedDryRuns, 2);
  assert.ok(timeline.batches.every((batch) => batch.checks.some((check) => check.id === 'receipt-identity' && check.status === 'fail')));
});

test('filters the receipt timeline by status, result, lineage, dry run, destination, and query', () => {
  const inserted = receipt({ importId: 'inserted', sourceFilename: 'alpha.csv', sourceFingerprint: 'fp-a' });
  const noChange = receipt({
    importId: 'no-change', timestamp: '2026-07-02T12:00:00.000Z', sourceFilename: 'beta.csv',
    sourceFingerprint: 'fp-b', transactionCount: 4, insertedCount: 0, skippedCount: 4,
    destinationBeforeCount: 108, destinationAfterCount: 108, verificationResult: 'verified-no-change'
  });
  const link = createDryRunReceiptLink(inserted, dryRun(), {
    now: '2026-07-01T12:00:01.000Z', linkId: 'link-1'
  });
  const timeline = buildReceiptTimeline([noChange, inserted], appendBatchLink({}, link));
  assert.equal(filterReceiptTimeline(timeline, { result: 'inserted' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { result: 'no-change' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { dryRun: 'linked' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { dryRun: 'unlinked' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { lineage: 'linked' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { query: 'beta' }).length, 1);
  assert.equal(filterReceiptTimeline(timeline, { destination: timeline.batches[0].destinationFamily }).length, 2);
});

test('builds a sanitized timeline package without household identifiers or source details', () => {
  const sourceReceipt = receipt();
  const link = createDryRunReceiptLink(sourceReceipt, dryRun(), {
    now: '2026-07-01T12:00:01.000Z', linkId: 'link-1'
  });
  const timeline = buildReceiptTimeline([sourceReceipt], appendBatchLink({}, link));
  const payload = buildReceiptTimelinePackage(timeline, { now: '2026-07-01T12:10:00.000Z' });
  assert.equal(payload.kind, 'gringotts-import-receipt-timeline');
  assert.equal(payload.batches.length, 1);
  assert.equal(assertReceiptTimelinePackageSafe(payload), true);
  const text = JSON.stringify(payload);
  assert.doesNotMatch(text, /SECRET-household|SECRET-fingerprint|SECRET-destination|SECRET MERCHANT/i);
  assert.doesNotMatch(text, /"transactions"\s*:|"records"\s*:|"rows"\s*:|"sourceFilename"\s*:|"sourceFingerprint"\s*:/i);
});

test('ships a detailed v121 through v127 roadmap horizon', () => {
  assert.equal(validateRoadmapHorizon(), true);
  assert.equal(ROADMAP_HORIZON.length, 7);
  assert.equal(ROADMAP_HORIZON[0].version, 'v121');
  assert.equal(ROADMAP_HORIZON[0].status, 'current');
  assert.equal(ROADMAP_HORIZON.at(-1).version, 'v127');
  ROADMAP_HORIZON.forEach((entry) => {
    assert.ok(entry.scope.length >= 4);
    assert.ok(entry.dependencies.length >= 3);
    assert.ok(entry.safeguards.length >= 3);
    assert.ok(entry.outcome.length > 50);
  });
});
