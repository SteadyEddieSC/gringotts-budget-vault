export const RECEIPT_AUDIT_KIND = 'gringotts-import-receipt-audit';
export const RECEIPT_AUDIT_VERSION = 1;

const clean = (value) => String(value ?? '').trim();
const finiteCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : null;
};
const validIso = (value) => Number.isFinite(Date.parse(clean(value)));
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value));

function dateRangeState(earliest, latest) {
  if (!earliest && !latest) return { status: 'warn', detail: 'No source date range was retained in this receipt.' };
  if (!validDate(earliest) || !validDate(latest)) return { status: 'warn', detail: 'The retained source date range is incomplete or uses a legacy format.' };
  if (earliest > latest) return { status: 'fail', detail: 'The retained earliest date is after the latest date.' };
  return { status: 'pass', detail: `${earliest} through ${latest}` };
}

function countState(label, value) {
  return value === null
    ? { id: label, label, status: 'warn', detail: 'This count is missing from the retained receipt.' }
    : { id: label, label, status: 'pass', detail: `${value.toLocaleString()} retained.` };
}

export function normalizeImportReceipt(receipt, index = 0) {
  const value = receipt && typeof receipt === 'object' && !Array.isArray(receipt) ? receipt : {};
  return {
    receiptIndex: index,
    importId: clean(value.importId) || `legacy-receipt-${index + 1}`,
    timestamp: clean(value.timestamp),
    sourceFilename: clean(value.sourceFilename),
    sourceFingerprint: clean(value.sourceFingerprint),
    source: clean(value.source),
    format: clean(value.format) || 'unknown',
    detectedSchema: clean(value.detectedSchema) || clean(value.source) || 'Unknown',
    schemaConfidence: clean(value.schemaConfidence) || 'unknown',
    encoding: clean(value.encoding),
    mappingSummary: clean(value.mappingSummary),
    signMode: clean(value.signMode),
    dateOrder: clean(value.dateOrder),
    warningCount: finiteCount(value.warningCount),
    transactionCount: finiteCount(value.transactionCount),
    earliestDate: clean(value.earliestDate),
    latestDate: clean(value.latestDate),
    exactDuplicates: finiteCount(value.exactDuplicates),
    fuzzyCandidates: finiteCount(value.fuzzyCandidates),
    insertedCount: finiteCount(value.insertedCount),
    skippedCount: finiteCount(value.skippedCount),
    selectedDestinationVault: clean(value.selectedDestinationVault),
    destinationBeforeCount: finiteCount(value.destinationBeforeCount),
    destinationAfterCount: finiteCount(value.destinationAfterCount),
    verificationResult: clean(value.verificationResult) || 'unknown'
  };
}

function arithmeticChecks(receipt) {
  const checks = [];
  const { transactionCount, insertedCount, skippedCount, destinationBeforeCount, destinationAfterCount } = receipt;

  if (transactionCount !== null && insertedCount !== null && skippedCount !== null) {
    const reconciled = insertedCount + skippedCount;
    checks.push({
      id: 'incoming-reconciliation',
      label: 'Incoming rows reconcile',
      status: reconciled === transactionCount ? 'pass' : 'fail',
      detail: reconciled === transactionCount
        ? `${insertedCount} inserted + ${skippedCount} skipped = ${transactionCount} incoming.`
        : `${insertedCount} inserted + ${skippedCount} skipped does not equal ${transactionCount} incoming.`
    });
  } else {
    checks.push({
      id: 'incoming-reconciliation', label: 'Incoming rows reconcile', status: 'warn',
      detail: 'Legacy or incomplete counts prevent a complete incoming-row reconciliation.'
    });
  }

  if (destinationBeforeCount !== null && destinationAfterCount !== null && insertedCount !== null) {
    const expected = destinationBeforeCount + insertedCount;
    checks.push({
      id: 'destination-arithmetic',
      label: 'Destination count arithmetic',
      status: expected === destinationAfterCount ? 'pass' : 'fail',
      detail: expected === destinationAfterCount
        ? `${destinationBeforeCount} before + ${insertedCount} inserted = ${destinationAfterCount} after.`
        : `${destinationBeforeCount} before + ${insertedCount} inserted should equal ${expected}, not ${destinationAfterCount}.`
    });
  } else {
    checks.push({
      id: 'destination-arithmetic', label: 'Destination count arithmetic', status: 'warn',
      detail: 'Legacy or incomplete counts prevent destination arithmetic verification.'
    });
  }

  return checks;
}

function verificationCheck(receipt) {
  const result = receipt.verificationResult;
  const noChange = result === 'verified-no-change';
  const verified = result === 'verified';
  if (!verified && !noChange) {
    return { id: 'verification-result', label: 'Writer verification result', status: 'fail', detail: `Receipt result is “${result || 'unknown'}”, not a recognized verified result.` };
  }
  if (noChange && receipt.insertedCount !== null && receipt.insertedCount !== 0) {
    return { id: 'verification-result', label: 'Writer verification result', status: 'fail', detail: 'A no-change receipt reports inserted rows.' };
  }
  if (verified && receipt.insertedCount !== null && receipt.insertedCount < 1) {
    return { id: 'verification-result', label: 'Writer verification result', status: 'warn', detail: 'The receipt is marked verified but does not retain a positive inserted count.' };
  }
  return {
    id: 'verification-result', label: 'Writer verification result', status: 'pass',
    detail: noChange ? 'The guarded writer recorded a verified no-change review.' : 'The guarded writer recorded a verified transaction insertion.'
  };
}

function currentDestinationCheck(receipt, currentDestinationCount) {
  if (currentDestinationCount === null || currentDestinationCount === undefined) {
    return {
      id: 'current-destination', label: 'Current destination comparison', status: 'warn',
      detail: 'The receipt destination is not currently available as a readable local vault. This does not prove a problem.'
    };
  }
  const current = finiteCount(currentDestinationCount);
  if (current === null) {
    return { id: 'current-destination', label: 'Current destination comparison', status: 'warn', detail: 'The current destination count could not be read.' };
  }
  if (receipt.destinationAfterCount !== null && current === receipt.destinationAfterCount) {
    return { id: 'current-destination', label: 'Current destination comparison', status: 'pass', detail: `The current destination still contains ${current} transactions, matching this receipt's verified after-count.` };
  }
  if (receipt.destinationBeforeCount !== null && current === receipt.destinationBeforeCount) {
    return { id: 'current-destination', label: 'Current destination comparison', status: 'warn', detail: `The current destination contains ${current} transactions, matching this receipt's pre-import count. It may already have been restored, or later changes may coincidentally match.` };
  }
  return {
    id: 'current-destination', label: 'Current destination comparison', status: 'warn',
    detail: `The current destination contains ${current} transactions. That differs from this receipt's retained before/after counts and may reflect later household activity.`
  };
}

function statusFor(checks) {
  if (checks.some((check) => check.status === 'fail')) return 'needs-review';
  if (checks.some((check) => check.status === 'warn')) return 'verified-with-notes';
  return 'verified';
}

export function auditImportReceipt(receipt, options = {}) {
  const normalized = normalizeImportReceipt(receipt, options.index || 0);
  const range = dateRangeState(normalized.earliestDate, normalized.latestDate);
  const checks = [
    {
      id: 'timestamp', label: 'Receipt timestamp',
      status: validIso(normalized.timestamp) ? 'pass' : 'warn',
      detail: validIso(normalized.timestamp) ? new Date(normalized.timestamp).toISOString() : 'The receipt has no parseable timestamp.'
    },
    verificationCheck(normalized),
    ...arithmeticChecks(normalized),
    { id: 'date-range', label: 'Source date range', ...range },
    countState('Warnings retained', normalized.warningCount),
    currentDestinationCheck(normalized, options.currentDestinationCount)
  ];
  const status = statusFor(checks);
  const backupExpected = (normalized.insertedCount || 0) > 0;
  const backupFilenamePattern = backupExpected && normalized.destinationBeforeCount !== null
    ? `Gringotts_v115_pre_import_${normalized.destinationBeforeCount}_*.json`
    : '';
  return {
    kind: RECEIPT_AUDIT_KIND,
    version: RECEIPT_AUDIT_VERSION,
    generatedAt: clean(options.now) || new Date().toISOString(),
    receipt: normalized,
    status,
    checks,
    backup: {
      expected: backupExpected,
      filenamePattern: backupFilenamePattern,
      expectedTransactionCount: normalized.destinationBeforeCount,
      createdBeforeReceipt: backupExpected,
      automaticallyLocated: false
    },
    rollback: {
      automaticRollbackAvailable: false,
      destructiveActionPerformed: false,
      restoreDestination: 'gringottsBudgetVault.latest',
      steps: rollbackGuidance({ ...normalized, backupFilenamePattern, backupExpected })
    }
  };
}

export function rollbackGuidance(receiptOrAudit) {
  const source = receiptOrAudit?.receipt || receiptOrAudit || {};
  const before = finiteCount(source.destinationBeforeCount);
  const after = finiteCount(source.destinationAfterCount);
  const pattern = clean(source.backupFilenamePattern)
    || ((finiteCount(source.insertedCount) || 0) > 0 && before !== null ? `Gringotts_v115_pre_import_${before}_*.json` : 'No pre-import backup was required for a verified no-change receipt.');
  const timestamp = validIso(source.timestamp) ? new Date(source.timestamp).toLocaleString('en-US') : 'the recorded import time';
  return [
    `Locate the local pre-import backup downloaded immediately before ${timestamp}. Expected filename pattern: ${pattern}`,
    before === null
      ? 'Open Tools → Import & Restore → Restore full vault and inspect the candidate backup transaction count before continuing.'
      : `Open Tools → Import & Restore → Restore full vault and confirm the preview is readable, populated, and contains ${before} transactions.`,
    'Confirm the restore preview identifies the intended backup. Full restore always targets gringottsBudgetVault.latest and remains separate from receipt review.',
    'Proceed only when manual rollback is truly required. v120 never restores or deletes transactions automatically.',
    after === null
      ? 'After restore, reopen the vault and verify the populated transaction count and household reports.'
      : `After restore, verify the count matches the expected pre-import count rather than this receipt's post-import count of ${after}.`
  ];
}

function publicCheck(check) {
  return { id: check.id, label: check.label, status: check.status, detail: check.detail };
}

export function buildReceiptAuditPackage(audit, options = {}) {
  const source = audit?.kind === RECEIPT_AUDIT_KIND ? audit : auditImportReceipt(audit, options);
  const receipt = source.receipt;
  const result = {
    kind: RECEIPT_AUDIT_KIND,
    version: RECEIPT_AUDIT_VERSION,
    generatedAt: clean(options.now) || new Date().toISOString(),
    receiptReference: receipt.importId,
    status: source.status,
    sourceMetadata: {
      format: receipt.format,
      detectedSchema: receipt.detectedSchema,
      schemaConfidence: receipt.schemaConfidence,
      encoding: receipt.encoding,
      dateRange: { earliest: receipt.earliestDate, latest: receipt.latestDate }
    },
    counts: {
      incoming: receipt.transactionCount,
      inserted: receipt.insertedCount,
      skipped: receipt.skippedCount,
      exactDuplicates: receipt.exactDuplicates,
      fuzzyCandidates: receipt.fuzzyCandidates,
      destinationBefore: receipt.destinationBeforeCount,
      destinationAfter: receipt.destinationAfterCount,
      warnings: receipt.warningCount
    },
    verificationResult: receipt.verificationResult,
    checks: source.checks.map(publicCheck),
    backup: {
      expected: source.backup.expected,
      filenamePattern: source.backup.filenamePattern,
      expectedTransactionCount: source.backup.expectedTransactionCount,
      automaticallyLocated: false
    },
    rollback: {
      automaticRollbackAvailable: false,
      destructiveActionPerformed: false,
      restoreDestination: 'gringottsBudgetVault.latest',
      steps: [...source.rollback.steps]
    },
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
  assertReceiptAuditPackageSafe(result);
  return result;
}

export function assertReceiptAuditPackageSafe(value) {
  const text = JSON.stringify(value || {});
  const forbiddenKeys = /"(?:transactions|records|rows|sourceFilename|sourceFingerprint|mappingSummary|selectedDestinationVault|merchant|accountNumber|vaultContents)"\s*:/i;
  if (forbiddenKeys.test(text)) throw new Error('Receipt audit package contains a forbidden household-data field.');
  if (value?.dataBoundary?.transactionRowsIncluded !== false
      || value?.dataBoundary?.sourceFileNameIncluded !== false
      || value?.dataBoundary?.sourceFingerprintIncluded !== false
      || value?.dataBoundary?.destinationStorageKeyIncluded !== false
      || value?.dataBoundary?.vaultContentsIncluded !== false) {
    throw new Error('Receipt audit package does not declare the required privacy boundary.');
  }
  return true;
}

export function summarizeReceiptAudits(receipts, currentCounts = {}) {
  const audits = (Array.isArray(receipts) ? receipts : []).map((receipt, index) => auditImportReceipt(receipt, {
    index,
    currentDestinationCount: currentCounts[clean(receipt?.selectedDestinationVault)]
  }));
  return {
    audits,
    count: audits.length,
    verified: audits.filter((audit) => audit.status === 'verified').length,
    verifiedWithNotes: audits.filter((audit) => audit.status === 'verified-with-notes').length,
    needsReview: audits.filter((audit) => audit.status === 'needs-review').length,
    backupExpected: audits.filter((audit) => audit.backup.expected).length
  };
}
