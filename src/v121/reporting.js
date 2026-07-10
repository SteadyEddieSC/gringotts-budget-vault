import { getMonth, vaults } from '../v103/core.js';
import { householdReportModel } from '../v111/reporting.js';
import { expandedWorkbookSheetsV115 } from '../v115/reporting.js';
import {
  IMPORT_BATCH_INDEX_KEY, buildReceiptTimeline, sanitizeBatchIndex
} from './receipt-integrity-model.js';

function importHistory() {
  const reader = window.GringottsV115?.importHistory;
  return typeof reader === 'function' ? reader() : [];
}

function batchIndex() {
  try {
    return sanitizeBatchIndex(JSON.parse(localStorage.getItem(IMPORT_BATCH_INDEX_KEY) || '{"links":[]}'));
  } catch {
    return sanitizeBatchIndex({ links: [] });
  }
}

function currentDestinationCounts() {
  return Object.fromEntries(vaults()
    .filter((candidate) => candidate?.status === 'readable' && candidate?.key)
    .map((candidate) => [candidate.key, candidate.transactions]));
}

export function receiptIntegrityTimelineV121() {
  return buildReceiptTimeline(importHistory(), batchIndex(), currentDestinationCounts());
}

export function receiptIntegritySheetV121(timeline = receiptIntegrityTimelineV121()) {
  return {
    name: 'Receipt Integrity',
    rows: [
      [
        'Imported At', 'Receipt ID', 'Batch ID', 'Destination Family', 'Sequence',
        'Integrity', 'Outcome', 'Verification', 'Continuity', 'Continuity Detail',
        'Dry Run State', 'Dry Run Ready', 'Repeated Source', 'Incoming', 'Inserted',
        'Skipped', 'Before', 'After', 'Warnings'
      ],
      ...timeline.batches.map((batch) => [
        batch.receipt.timestamp,
        batch.receipt.importId,
        batch.batchId,
        batch.destinationFamily,
        `${batch.sequence} of ${batch.sequenceCount}`,
        batch.status,
        batch.outcome,
        batch.receipt.verificationResult,
        batch.continuity.state,
        batch.continuity.detail,
        batch.dryRun.state,
        batch.dryRun.transactionWriteReady ? 'Yes' : 'No',
        batch.repeatedSource ? 'Yes' : 'No',
        batch.receipt.transactionCount,
        batch.receipt.insertedCount,
        batch.receipt.skippedCount,
        batch.receipt.destinationBeforeCount,
        batch.receipt.destinationAfterCount,
        batch.receipt.warningCount
      ])
    ]
  };
}

export function batchLineageSheetV121(timeline = receiptIntegrityTimelineV121()) {
  return {
    name: 'Batch Lineage',
    rows: [
      [
        'Destination Family', 'Batch ID', 'Receipt ID', 'Predecessor Batch',
        'Successor Batch', 'Continuity State', 'Continuity Detail', 'Dry Run Linked',
        'Dry Run Signature', 'Dry Run Prepared', 'Dry Run Linked At',
        'Normalized Rows', 'Would Insert', 'Would Skip', 'Validation Errors',
        'Validation Warnings', 'Transaction Write Ready', 'Verified Counts'
      ],
      ...timeline.batches.map((batch) => [
        batch.destinationFamily,
        batch.batchId,
        batch.receipt.importId,
        batch.continuity.predecessorBatchId,
        batch.continuity.successorBatchId,
        batch.continuity.state,
        batch.continuity.detail,
        batch.dryRun.linked ? 'Yes' : 'No',
        batch.dryRun.signature,
        batch.dryRun.createdAt,
        batch.dryRun.linkedAt,
        batch.dryRun.normalizedRowCount,
        batch.dryRun.wouldInsert,
        batch.dryRun.wouldSkip,
        batch.dryRun.validationErrorCount,
        batch.dryRun.validationWarningCount,
        batch.dryRun.transactionWriteReady ? 'Yes' : 'No',
        batch.dryRun.verifiedCounts ? 'Yes' : 'No'
      ]),
      ...timeline.orphanLinks.map((link) => [
        '', '', link.receiptImportId, '', '', 'orphan-link',
        'A retained dry-run link no longer has a matching receipt in the bounded local history.',
        'Yes', link.dryRunSignature, link.dryRunCreatedAt, link.linkedAt,
        link.normalizedRowCount, link.wouldInsert, link.wouldSkip,
        link.validationErrorCount, link.validationWarningCount,
        link.transactionWriteReady ? 'Yes' : 'No', link.verifiedCounts ? 'Yes' : 'No'
      ])
    ]
  };
}

export function expandedWorkbookSheetsV121(
  month = getMonth(),
  model = householdReportModel()
) {
  const timeline = receiptIntegrityTimelineV121();
  return [
    ...expandedWorkbookSheetsV115(month, model),
    receiptIntegritySheetV121(timeline),
    batchLineageSheetV121(timeline)
  ];
}
