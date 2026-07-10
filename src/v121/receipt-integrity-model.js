import { auditImportReceipt, normalizeImportReceipt } from '../v120/import-receipt-audit-model.js';

export const IMPORT_BATCH_INDEX_KEY = 'gringottsImportBatchIndex.v1';
export const IMPORT_BATCH_INDEX_VERSION = 1;
export const MAX_IMPORT_BATCH_LINKS = 80;
export const RECEIPT_TIMELINE_KIND = 'gringotts-import-receipt-timeline';
export const RECEIPT_TIMELINE_VERSION = 1;

const clean = (value) => String(value ?? '').trim();
const compact = (value, max = 160) => clean(value).slice(0, max);
const finiteCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
};
const validIso = (value) => Number.isFinite(Date.parse(clean(value)));

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value ?? '')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function signature(value) {
  const normalized = clean(value);
  return /^fnv1a-[0-9a-f]{8}$/.test(normalized) ? normalized : '';
}

function privacyBoundary(value = {}) {
  return {
    transactionRowsIncluded: value.transactionRowsIncluded === false ? false : null,
    sourceFileNameIncluded: value.sourceFileNameIncluded === false ? false : null,
    sourceFingerprintIncluded: value.sourceFingerprintIncluded === false ? false : null,
    destinationStorageKeyIncluded: value.destinationStorageKeyIncluded === false ? false : null,
    accountIdentifiersIncluded: value.accountIdentifiersIncluded === false ? false : null,
    merchantNamesIncluded: value.merchantNamesIncluded === false ? false : null,
    vaultContentsIncluded: value.vaultContentsIncluded === false ? false : null
  };
}

function boundaryIsSafe(boundary) {
  return Object.values(boundary).every((value) => value === false);
}

function safeLink(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const boundary = privacyBoundary(entry.dataBoundary);
  const normalized = {
    linkId: compact(entry.linkId, 100),
    receiptImportId: compact(entry.receiptImportId, 120),
    linkedAt: compact(entry.linkedAt, 40),
    dryRunSignature: signature(entry.dryRunSignature),
    dryRunCreatedAt: compact(entry.dryRunCreatedAt, 40),
    sourceFormat: compact(entry.sourceFormat, 40),
    schemaId: compact(entry.schemaId, 100),
    schemaLabel: compact(entry.schemaLabel, 140),
    normalizedRowCount: finiteCount(entry.normalizedRowCount),
    wouldInsert: finiteCount(entry.wouldInsert),
    wouldSkip: finiteCount(entry.wouldSkip),
    validationErrorCount: finiteCount(entry.validationErrorCount),
    validationWarningCount: finiteCount(entry.validationWarningCount),
    transactionWriteReady: entry.transactionWriteReady === true,
    verifiedCounts: entry.verifiedCounts === true,
    dataBoundary: boundary
  };
  if (!normalized.linkId || !normalized.receiptImportId || !normalized.dryRunSignature
      || !validIso(normalized.linkedAt) || !validIso(normalized.dryRunCreatedAt)
      || !boundaryIsSafe(boundary)) return null;
  return normalized;
}

export function sanitizeBatchIndex(value) {
  const source = Array.isArray(value?.links) ? value.links : [];
  const seenReceipts = new Set();
  const links = [];
  for (const entry of source) {
    const normalized = safeLink(entry);
    if (!normalized || seenReceipts.has(normalized.receiptImportId)) continue;
    seenReceipts.add(normalized.receiptImportId);
    links.push(normalized);
    if (links.length >= MAX_IMPORT_BATCH_LINKS) break;
  }
  return {
    version: IMPORT_BATCH_INDEX_VERSION,
    links,
    updatedAt: validIso(value?.updatedAt) ? new Date(value.updatedAt).toISOString() : ''
  };
}

function candidateCounts(candidate = {}) {
  const validation = candidate.validation || {};
  const duplicates = candidate.duplicates || {};
  return {
    normalizedRowCount: finiteCount(validation.normalizedRowCount),
    wouldInsert: finiteCount(duplicates.wouldInsert),
    wouldSkip: finiteCount(duplicates.wouldSkip),
    validationErrorCount: finiteCount(validation.normalizationErrorCount),
    validationWarningCount: finiteCount(validation.normalizationWarningCount)
  };
}

function sameText(left, right) {
  return clean(left).toLowerCase() === clean(right).toLowerCase();
}

export function createDryRunReceiptLink(receiptValue, candidate, {
  now = new Date().toISOString(),
  linkId = ''
} = {}) {
  const receipt = normalizeImportReceipt(receiptValue);
  if (!receipt.importId || receipt.importId.startsWith('legacy-receipt-')) {
    throw new Error('A retained receipt identity is required for dry-run linkage.');
  }
  if (!candidate || candidate.current !== true) {
    throw new Error('The prepared dry run is missing or no longer matches the current import session.');
  }
  const drySignature = signature(candidate.signature);
  if (!drySignature) throw new Error('The dry-run signature is invalid.');
  if (!validIso(candidate.createdAt) || !validIso(now)) throw new Error('Dry-run linkage requires valid timestamps.');
  const counts = candidateCounts(candidate);
  const countsMatch = counts.normalizedRowCount !== null
    && counts.wouldInsert !== null
    && counts.wouldSkip !== null
    && receipt.transactionCount === counts.normalizedRowCount
    && receipt.insertedCount === counts.wouldInsert
    && receipt.skippedCount === counts.wouldSkip;
  const formatMatches = sameText(candidate.source?.format, receipt.format);
  const schemaMatches = !clean(candidate.source?.schemaLabel)
    || sameText(candidate.source.schemaLabel, receipt.detectedSchema);
  if (!countsMatch || !formatMatches || !schemaMatches) {
    throw new Error('The dry-run metadata does not reconcile to the saved receipt.');
  }
  const id = compact(linkId, 100)
    || `batchlink_${fnv1a(`${receipt.importId}|${drySignature}|${now}`)}`;
  return safeLink({
    linkId: id,
    receiptImportId: receipt.importId,
    linkedAt: new Date(now).toISOString(),
    dryRunSignature: drySignature,
    dryRunCreatedAt: new Date(candidate.createdAt).toISOString(),
    sourceFormat: candidate.source?.format,
    schemaId: candidate.source?.schemaId,
    schemaLabel: candidate.source?.schemaLabel,
    normalizedRowCount: counts.normalizedRowCount,
    wouldInsert: counts.wouldInsert,
    wouldSkip: counts.wouldSkip,
    validationErrorCount: counts.validationErrorCount,
    validationWarningCount: counts.validationWarningCount,
    transactionWriteReady: candidate.readiness?.transactionWriteReady === true,
    verifiedCounts: true,
    dataBoundary: {
      transactionRowsIncluded: false,
      sourceFileNameIncluded: false,
      sourceFingerprintIncluded: false,
      destinationStorageKeyIncluded: false,
      accountIdentifiersIncluded: false,
      merchantNamesIncluded: false,
      vaultContentsIncluded: false
    }
  });
}

export function appendBatchLink(currentValue, link, { now = new Date().toISOString() } = {}) {
  const current = sanitizeBatchIndex(currentValue);
  const normalized = safeLink(link);
  if (!normalized) throw new Error('A privacy-safe dry-run receipt link is required.');
  const links = [normalized, ...current.links.filter((entry) => entry.receiptImportId !== normalized.receiptImportId)]
    .slice(0, MAX_IMPORT_BATCH_LINKS);
  return {
    version: IMPORT_BATCH_INDEX_VERSION,
    links,
    updatedAt: validIso(now) ? new Date(now).toISOString() : new Date().toISOString()
  };
}

function destinationFamily(key) {
  return `destination-${fnv1a(clean(key) || 'unknown')}`;
}

function batchId(importId) {
  return `batch-${fnv1a(importId)}`;
}

function timestampValue(value) {
  const parsed = Date.parse(clean(value));
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function continuityCheck(previous, current) {
  if (!previous) {
    return {
      state: 'origin',
      status: 'pass',
      detail: 'This is the earliest retained receipt for the local destination family.',
      predecessorImportId: '',
      predecessorBatchId: ''
    };
  }
  const before = current.receipt.destinationBeforeCount;
  const previousAfter = previous.receipt.destinationAfterCount;
  if (before === null || previousAfter === null) {
    return {
      state: 'legacy',
      status: 'warn',
      detail: 'Legacy or incomplete destination counts prevent receipt-to-receipt continuity verification.',
      predecessorImportId: previous.receipt.importId,
      predecessorBatchId: previous.batchId
    };
  }
  if (before === previousAfter) {
    return {
      state: 'linked',
      status: 'pass',
      detail: `${previousAfter} transactions after the prior receipt matches ${before} before this receipt.`,
      predecessorImportId: previous.receipt.importId,
      predecessorBatchId: previous.batchId
    };
  }
  if (before > previousAfter) {
    return {
      state: 'untracked-increase',
      status: 'warn',
      detail: `${before - previousAfter} transaction${before - previousAfter === 1 ? '' : 's'} appeared between retained receipts. This may be normal household activity or an unrecorded import.`,
      predecessorImportId: previous.receipt.importId,
      predecessorBatchId: previous.batchId
    };
  }
  return {
    state: 'count-decrease',
    status: 'warn',
    detail: `The next receipt begins ${previousAfter - before} transaction${previousAfter - before === 1 ? '' : 's'} below the prior after-count. A restore, deletion, cleanup, or older-vault switch may have occurred.`,
    predecessorImportId: previous.receipt.importId,
    predecessorBatchId: previous.batchId
  };
}

function integrityStatus(checks) {
  if (checks.some((check) => check.status === 'fail')) return 'needs-review';
  if (checks.some((check) => check.status === 'warn')) return 'verified-with-notes';
  return 'verified';
}

function outcome(receipt) {
  if (receipt.insertedCount !== null && receipt.insertedCount > 0) return 'inserted';
  if (receipt.insertedCount === 0 && receipt.verificationResult === 'verified-no-change') return 'no-change';
  return 'unknown';
}

function duplicateCounts(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return counts;
}

function lineageFilterState(state) {
  if (state === 'linked' || state === 'origin') return state;
  if (state === 'legacy') return 'legacy';
  return 'break';
}

export function buildReceiptTimeline(receiptsValue, batchIndexValue = {}, currentCounts = {}, {
  now = new Date().toISOString()
} = {}) {
  const receipts = (Array.isArray(receiptsValue) ? receiptsValue : []).map((value, index) => ({
    raw: value,
    receipt: normalizeImportReceipt(value, index),
    originalIndex: index
  }));
  const importIdCounts = duplicateCounts(receipts.map((item) => item.receipt.importId));
  const fingerprintCounts = duplicateCounts(receipts.map((item) => clean(item.raw?.sourceFingerprint)));
  const index = sanitizeBatchIndex(batchIndexValue);
  const linksByReceipt = new Map(index.links.map((link) => [link.receiptImportId, link]));
  const groups = new Map();

  receipts.forEach((item) => {
    const family = destinationFamily(item.receipt.selectedDestinationVault);
    const batch = {
      ...item,
      batchId: batchId(item.receipt.importId),
      destinationFamily: family,
      localDestinationKey: item.receipt.selectedDestinationVault,
      linkedDryRun: linksByReceipt.get(item.receipt.importId) || null
    };
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(batch);
  });

  const batches = [];
  for (const group of groups.values()) {
    group.sort((left, right) => timestampValue(left.receipt.timestamp) - timestampValue(right.receipt.timestamp)
      || left.originalIndex - right.originalIndex);
    group.forEach((batch, indexInGroup) => {
      const audit = auditImportReceipt(batch.raw, {
        index: batch.originalIndex,
        currentDestinationCount: currentCounts[batch.receipt.selectedDestinationVault]
      });
      const continuity = continuityCheck(group[indexInGroup - 1] || null, batch);
      const successor = group[indexInGroup + 1] || null;
      const checks = [...audit.checks];
      const duplicatedId = (importIdCounts.get(batch.receipt.importId) || 0) > 1;
      checks.push({
        id: 'receipt-identity',
        label: 'Receipt identity',
        status: duplicatedId ? 'fail' : 'pass',
        detail: duplicatedId
          ? 'This receipt identity is duplicated in local history.'
          : 'The receipt identity is unique within retained local history.'
      });
      checks.push({
        id: 'batch-continuity',
        label: 'Receipt-to-receipt continuity',
        status: continuity.status,
        detail: continuity.detail
      });
      const sourceFingerprint = clean(batch.raw?.sourceFingerprint);
      const repeatedSource = Boolean(sourceFingerprint && (fingerprintCounts.get(sourceFingerprint) || 0) > 1);
      checks.push({
        id: 'source-reuse',
        label: 'Source reuse',
        status: 'info',
        detail: repeatedSource
          ? 'The same local source fingerprint appears on more than one retained receipt. This can be intentional when rechecking an export.'
          : 'No repeated retained source fingerprint was detected for this receipt.'
      });
      const link = batch.linkedDryRun;
      checks.push({
        id: 'dry-run-link',
        label: 'Dry-run lineage',
        status: link ? (link.verifiedCounts ? 'pass' : 'fail') : 'info',
        detail: link
          ? (link.verifiedCounts
            ? 'A metadata-only dry run reconciles to this receipt.'
            : 'A retained dry-run link does not carry verified count reconciliation.')
          : 'No v121 dry-run link is retained. Older and no-dry-run imports remain valid without one.'
      });
      const status = integrityStatus(checks);
      batches.push({
        batchId: batch.batchId,
        receipt: batch.receipt,
        destinationFamily: batch.destinationFamily,
        localDestinationKey: batch.localDestinationKey,
        sequence: indexInGroup + 1,
        sequenceCount: group.length,
        status,
        outcome: outcome(batch.receipt),
        checks,
        continuity: {
          ...continuity,
          filterState: lineageFilterState(continuity.state),
          successorImportId: successor?.receipt.importId || '',
          successorBatchId: successor?.batchId || ''
        },
        dryRun: link ? {
          linked: true,
          state: link.transactionWriteReady ? 'linked-ready' : 'linked-not-ready',
          signature: link.dryRunSignature,
          createdAt: link.dryRunCreatedAt,
          linkedAt: link.linkedAt,
          normalizedRowCount: link.normalizedRowCount,
          wouldInsert: link.wouldInsert,
          wouldSkip: link.wouldSkip,
          validationErrorCount: link.validationErrorCount,
          validationWarningCount: link.validationWarningCount,
          transactionWriteReady: link.transactionWriteReady,
          verifiedCounts: link.verifiedCounts
        } : {
          linked: false,
          state: 'unlinked',
          signature: '',
          createdAt: '',
          linkedAt: '',
          normalizedRowCount: null,
          wouldInsert: null,
          wouldSkip: null,
          validationErrorCount: null,
          validationWarningCount: null,
          transactionWriteReady: false,
          verifiedCounts: false
        },
        repeatedSource
      });
    });
  }

  batches.sort((left, right) => timestampValue(right.receipt.timestamp) - timestampValue(left.receipt.timestamp)
    || right.receipt.receiptIndex - left.receipt.receiptIndex);
  const receiptIds = new Set(receipts.map((item) => item.receipt.importId));
  const orphanLinks = index.links.filter((link) => !receiptIds.has(link.receiptImportId));
  const summary = {
    batches: batches.length,
    verified: batches.filter((batch) => batch.status === 'verified').length,
    verifiedWithNotes: batches.filter((batch) => batch.status === 'verified-with-notes').length,
    needsReview: batches.filter((batch) => batch.status === 'needs-review').length,
    inserted: batches.filter((batch) => batch.outcome === 'inserted').length,
    noChange: batches.filter((batch) => batch.outcome === 'no-change').length,
    linkedDryRuns: batches.filter((batch) => batch.dryRun.linked).length,
    lineageBreaks: batches.filter((batch) => batch.continuity.filterState === 'break').length,
    legacyContinuity: batches.filter((batch) => batch.continuity.filterState === 'legacy').length,
    repeatedSources: batches.filter((batch) => batch.repeatedSource).length,
    orphanLinks: orphanLinks.length,
    destinationFamilies: new Set(batches.map((batch) => batch.destinationFamily)).size
  };
  return {
    generatedAt: validIso(now) ? new Date(now).toISOString() : new Date().toISOString(),
    batches,
    orphanLinks,
    summary
  };
}

export function filterReceiptTimeline(timeline, filters = {}) {
  const status = clean(filters.status) || 'all';
  const result = clean(filters.result) || 'all';
  const lineage = clean(filters.lineage) || 'all';
  const dryRun = clean(filters.dryRun) || 'all';
  const destination = clean(filters.destination) || 'all';
  const query = clean(filters.query).toLowerCase();
  return (Array.isArray(timeline?.batches) ? timeline.batches : []).filter((batch) => {
    if (status !== 'all' && batch.status !== status) return false;
    if (result !== 'all' && batch.outcome !== result) return false;
    if (lineage !== 'all' && batch.continuity.filterState !== lineage) return false;
    if (dryRun === 'linked' && !batch.dryRun.linked) return false;
    if (dryRun === 'unlinked' && batch.dryRun.linked) return false;
    if (dryRun === 'ready' && batch.dryRun.state !== 'linked-ready') return false;
    if (dryRun === 'not-ready' && batch.dryRun.state !== 'linked-not-ready') return false;
    if (destination !== 'all' && batch.destinationFamily !== destination) return false;
    if (query) {
      const haystack = [
        batch.receipt.importId,
        batch.receipt.sourceFilename,
        batch.receipt.format,
        batch.receipt.detectedSchema,
        batch.receipt.verificationResult,
        batch.destinationFamily
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function publicCheck(check) {
  return {
    id: clean(check.id),
    label: compact(check.label, 120),
    status: ['pass', 'warn', 'fail', 'info'].includes(check.status) ? check.status : 'info',
    detail: compact(check.detail, 500)
  };
}

function publicBatch(batch) {
  return {
    batchId: batch.batchId,
    receiptReference: batch.receipt.importId,
    importedAt: batch.receipt.timestamp,
    destinationFamily: batch.destinationFamily,
    sequence: batch.sequence,
    sequenceCount: batch.sequenceCount,
    integrityStatus: batch.status,
    outcome: batch.outcome,
    sourceMetadata: {
      format: batch.receipt.format,
      detectedSchema: batch.receipt.detectedSchema,
      schemaConfidence: batch.receipt.schemaConfidence,
      encoding: batch.receipt.encoding,
      dateRange: {
        earliest: batch.receipt.earliestDate,
        latest: batch.receipt.latestDate
      }
    },
    counts: {
      incoming: batch.receipt.transactionCount,
      inserted: batch.receipt.insertedCount,
      skipped: batch.receipt.skippedCount,
      exactDuplicates: batch.receipt.exactDuplicates,
      fuzzyCandidates: batch.receipt.fuzzyCandidates,
      destinationBefore: batch.receipt.destinationBeforeCount,
      destinationAfter: batch.receipt.destinationAfterCount,
      warnings: batch.receipt.warningCount
    },
    verificationResult: batch.receipt.verificationResult,
    continuity: {
      state: batch.continuity.state,
      detail: batch.continuity.detail,
      predecessorBatchId: batch.continuity.predecessorBatchId,
      successorBatchId: batch.continuity.successorBatchId
    },
    dryRun: {
      linked: batch.dryRun.linked,
      state: batch.dryRun.state,
      signature: batch.dryRun.signature,
      createdAt: batch.dryRun.createdAt,
      linkedAt: batch.dryRun.linkedAt,
      normalizedRowCount: batch.dryRun.normalizedRowCount,
      wouldInsert: batch.dryRun.wouldInsert,
      wouldSkip: batch.dryRun.wouldSkip,
      validationErrorCount: batch.dryRun.validationErrorCount,
      validationWarningCount: batch.dryRun.validationWarningCount,
      transactionWriteReady: batch.dryRun.transactionWriteReady,
      verifiedCounts: batch.dryRun.verifiedCounts
    },
    repeatedSourceDetected: batch.repeatedSource,
    checks: batch.checks.map(publicCheck)
  };
}

export function buildReceiptTimelinePackage(timelineValue, {
  now = new Date().toISOString()
} = {}) {
  const timeline = timelineValue?.batches ? timelineValue : buildReceiptTimeline([]);
  const result = {
    kind: RECEIPT_TIMELINE_KIND,
    version: RECEIPT_TIMELINE_VERSION,
    generatedAt: validIso(now) ? new Date(now).toISOString() : new Date().toISOString(),
    summary: { ...timeline.summary },
    batches: timeline.batches.map(publicBatch),
    orphanDryRunLinks: timeline.orphanLinks.map((link) => ({
      linkId: link.linkId,
      receiptReference: link.receiptImportId,
      linkedAt: link.linkedAt,
      dryRunSignature: link.dryRunSignature
    })),
    dataBoundary: {
      transactionRowsIncluded: false,
      sourceFileNameIncluded: false,
      sourceFingerprintIncluded: false,
      mappingSummaryIncluded: false,
      destinationStorageKeyIncluded: false,
      accountIdentifiersIncluded: false,
      merchantNamesIncluded: false,
      vaultContentsIncluded: false
    }
  };
  assertReceiptTimelinePackageSafe(result);
  return result;
}

export function assertReceiptTimelinePackageSafe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Receipt timeline package must be an object.');
  }
  if (value.kind !== RECEIPT_TIMELINE_KIND || Number(value.version) !== RECEIPT_TIMELINE_VERSION) {
    throw new Error('Receipt timeline package kind or version is invalid.');
  }
  const serialized = JSON.stringify(value);
  const forbiddenKeys = /"(?:transactions|records|rows|sourceFilename|sourceFingerprint|mappingSummary|selectedDestinationVault|localDestinationKey|merchant|accountNumber|vaultContents)"\s*:/i;
  if (forbiddenKeys.test(serialized)) throw new Error('Receipt timeline package contains a forbidden household-data field.');
  const boundary = privacyBoundary(value.dataBoundary);
  if (!boundaryIsSafe(boundary)) throw new Error('Receipt timeline package does not declare the required privacy boundary.');
  return true;
}
