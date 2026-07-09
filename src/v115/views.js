import { BUILD, best, esc, money } from '../v103/core.js';
import { snapshot as restoreSnapshot } from '../v103/restore.js';
import { snapshot as bankSnapshot } from './bank-import.js';

const FIELD_LABELS = {
  date: 'Transaction date',
  description: 'Description / payee',
  amount: 'Signed amount',
  debit: 'Debit amount',
  credit: 'Credit amount',
  status: 'Pending / posted status',
  account: 'Source account',
  memo: 'Memo / notes',
  id: 'Stable transaction ID',
  category: 'Source category',
  type: 'Transaction type'
};

function transactionLine(transaction) {
  return `${esc(transaction.date)} · ${esc(transaction.name)} · ${money(transaction.amount)} · ${esc(transaction.account)}`;
}

function destinationOptions(state) {
  return state.destinations.map((destination) => `<option value="${esc(destination.key)}" ${destination.key === state.destinationKey ? 'selected' : ''}>${esc(destination.key)} — ${destination.transactions} transactions</option>`).join('');
}

function headerOptions(state, selected) {
  return `<option value="">Not mapped</option>${(state.inspection?.headers || []).map((header) => `<option value="${esc(header)}" ${header === selected ? 'selected' : ''}>${esc(header)}</option>`).join('')}`;
}

function formatLabel(format) {
  if (format === 'delimited') return 'CSV / delimited text';
  return String(format || '').toUpperCase();
}

function fileInspectionView(state) {
  const inspection = state.inspection;
  return `<article class="card bank-file-card"><div class="section-title-row"><div><h3>1. Inspect a local export</h3><p>Supported: CSV, TSV, delimited text, OFX, QFX, QBO, and existing Gringotts JSON. Nothing is uploaded.</p></div><div class="section-meta">5 MB · 25,000-row limits</div></div>
    <label class="file-drop" for="bankImportFile"><span><strong>Choose bank or card export</strong><br>PDF, archives, executables, Office files, and unsupported binaries are blocked.</span><input id="bankImportFile" type="file" accept=".csv,.tsv,.txt,.ofx,.qfx,.qbo,.json,text/csv,text/tab-separated-values,text/plain,application/json,application/x-ofx"></label>
    ${state.error ? `<div class="error-box" role="alert">${esc(state.error)}</div>` : ''}
    ${inspection ? `<div class="grid two bank-inspection-summary"><div class="summary-box compact">File: ${esc(state.fileName)}\nSize: ${Number(state.fileSize || 0).toLocaleString()} bytes\nEncoding: ${esc(state.encoding)}\nFormat: ${esc(formatLabel(inspection.format))}</div><div class="summary-box compact">Detected schema: ${esc(inspection.schema?.label || 'Unknown')}\nConfidence: ${esc(inspection.schema?.confidence || inspection.detection?.confidence || 'Unknown')}\nInstitution: ${esc(inspection.institution || 'Not detected')}\nRows: ${inspection.records?.length || inspection.directTransactions?.length || 0}</div></div><p class="muted-note"><strong>Detection reason:</strong> ${esc(inspection.detection?.reason || 'Content inspection completed.')}</p><p class="muted-note">Source fingerprint: ${esc(state.sourceFingerprint.slice(0, 24))}${state.sourceFingerprint ? '…' : ''}</p>` : ''}
  </article>`;
}

function sourcePreview(state) {
  const inspection = state.inspection;
  if (!inspection) return '';
  if (inspection.format !== 'delimited') {
    const rows = inspection.directTransactions || [];
    return `<article class="card"><div class="section-title-row"><div><h3>Source interpretation preview</h3><p>The source format already supplies transaction fields. Account identifiers are masked for OFX-family files.</p></div><div class="section-meta">${rows.length} rows</div></div><div class="table-wrap"><table class="ledger bank-preview-table"><thead><tr><th>Date</th><th>Description</th><th>Vault amount</th><th>Account</th><th>ID</th></tr></thead><tbody>${rows.slice(0, 12).map((row) => `<tr><td>${esc(row.date || '')}</td><td>${esc(row.name || row.merchant || '')}</td><td>${money(Number(row.amount) || 0)}</td><td>${esc(row.account || '')}</td><td>${esc(row.source_transaction_id || row.fitid || row.id || '—')}</td></tr>`).join('')}</tbody></table></div>${rows.length > 12 ? `<p class="muted-note">Showing 12 of ${rows.length} source rows.</p>` : ''}</article>`;
  }
  const headers = inspection.headers || [];
  return `<article class="card"><div class="section-title-row"><div><h3>Raw source preview</h3><p>Review source columns before mapping. Extra and ignored columns are shown rather than silently discarded.</p></div><div class="section-meta">Delimiter: ${inspection.delimiter === '\t' ? 'Tab' : esc(inspection.delimiter)}</div></div><div class="table-wrap"><table class="ledger bank-source-table"><thead><tr><th>Source row</th>${headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${inspection.records.slice(0, 8).map((record) => `<tr><td>${record.__row}</td>${headers.map((header) => `<td>${esc(record[header] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${inspection.records.length > 8 ? `<p class="muted-note">Showing 8 of ${inspection.records.length} rows.</p>` : ''}</article>`;
}

function mappingView(state) {
  const inspection = state.inspection;
  if (!inspection) return '';
  const normalization = state.normalization || { errors: [], warnings: [] };
  if (inspection.format !== 'delimited') {
    return `<article class="card"><div class="section-title-row"><div><h3>2. Confirm normalization options</h3><p>${inspection.format === 'json' ? 'Existing Gringotts transaction fields are preserved.' : 'OFX-family signed amounts are inverted to Gringotts convention: expenses positive and income negative.'}</p></div><div class="section-meta">${esc(normalization.signMode || 'Source-defined')}</div></div>${inspection.format === 'json' ? '' : `<label>Destination account label<input data-bank-option="accountLabel" maxlength="100" value="${esc(state.options.accountLabel)}" placeholder="Checking, card, or household label"></label>`}${normalization.warnings?.length ? `<div class="notes">${normalization.warnings.map((warning) => `<div class="note warning-note">${esc(warning)}</div>`).join('')}</div>` : ''}<button id="prepareBankDuplicateReview" class="btn primary" ${normalization.errors?.length ? 'disabled' : ''}>Prepare Duplicate Review</button></article>`;
  }
  const mapping = state.options.mapping || {};
  const separate = Boolean(mapping.debit || mapping.credit);
  return `<article class="card bank-mapping-card"><div class="section-title-row"><div><h3>2. Map and normalize</h3><p>Correct every ambiguous field before duplicate review. A signed amount interpretation is never guessed silently.</p></div><div class="section-meta">${esc(inspection.schema?.confidence || 'low')} confidence</div></div>
    <div class="bank-mapping-grid">${Object.entries(FIELD_LABELS).map(([field, label]) => `<label>${esc(label)}<select data-bank-mapping="${field}">${headerOptions(state, mapping[field] || '')}</select></label>`).join('')}</div>
    <div class="grid two bank-option-grid"><label>Date order<select data-bank-option="dateOrder"><option value="auto" ${state.options.dateOrder === 'auto' ? 'selected' : ''}>Auto; block ambiguous dates</option><option value="mdy" ${state.options.dateOrder === 'mdy' ? 'selected' : ''}>Month / day / year</option><option value="dmy" ${state.options.dateOrder === 'dmy' ? 'selected' : ''}>Day / month / year</option></select></label><label>Signed amount interpretation<select data-bank-option="signMode" ${separate ? 'disabled' : ''}><option value="" ${!state.options.signMode ? 'selected' : ''}>Choose interpretation</option><option value="bank" ${state.options.signMode === 'bank' ? 'selected' : ''}>Bank standard: negative outflow, positive inflow</option><option value="vault" ${state.options.signMode === 'vault' ? 'selected' : ''}>Gringotts: positive expense, negative income</option><option value="type" ${state.options.signMode === 'type' ? 'selected' : ''}>Use mapped transaction type</option>${separate ? '<option value="separate" selected>Separate debit and credit columns</option>' : ''}</select></label><label>Destination account label<input data-bank-option="accountLabel" maxlength="100" value="${esc(state.options.accountLabel)}" placeholder="Checking, card, or household label"></label><label>Account handling<select data-bank-option="accountMode"><option value="label" ${state.options.accountMode === 'label' ? 'selected' : ''}>Use destination label for every row</option><option value="mapped-masked" ${state.options.accountMode === 'mapped-masked' ? 'selected' : ''}>Use masked final 4 from mapped account</option></select></label></div>
    <label class="ack-row"><input data-bank-option="useSourceCategory" type="checkbox" ${state.options.useSourceCategory ? 'checked' : ''}><span>Explicitly use mapped source categories for new rows. Otherwise new rows use Other and enter Review Queue.</span></label>
    ${state.ignoredColumns.length ? `<div class="summary-box compact">Ignored source columns: ${state.ignoredColumns.map(esc).join(', ')}</div>` : ''}
    ${normalization.errors?.length ? `<div class="error-box" role="alert"><strong>${normalization.errors.length} normalization issue${normalization.errors.length === 1 ? '' : 's'}:</strong><ul>${normalization.errors.slice(0, 20).map((error) => `<li>${esc(error)}</li>`).join('')}</ul>${normalization.errors.length > 20 ? `<p>Showing the first 20 issues.</p>` : ''}</div>` : ''}
    ${normalization.warnings?.length ? `<div class="notes">${normalization.warnings.map((warning) => `<div class="note warning-note">${esc(warning)}</div>`).join('')}</div>` : ''}
    <button id="prepareBankDuplicateReview" class="btn primary" ${normalization.errors?.length || !normalization.transactions?.length ? 'disabled' : ''}>Prepare Duplicate Review (${normalization.transactions?.length || 0})</button>
  </article>`;
}

function normalizedPreview(state) {
  const normalization = state.normalization;
  if (!normalization?.transactions?.length) return '';
  return `<article class="card"><div class="section-title-row"><div><h3>Normalized preview</h3><p>This is the shape used for duplicate review. Raw source rows are not copied into the vault.</p></div><div class="section-meta">${normalization.transactions.length} valid</div></div><div class="table-wrap"><table class="ledger bank-preview-table"><thead><tr><th>Date</th><th>Description</th><th>Vault amount</th><th>Type</th><th>Category</th><th>Account</th><th>Status</th></tr></thead><tbody>${normalization.transactions.slice(0, 15).map((row) => `<tr><td>${esc(row.date)}</td><td>${esc(row.name)}</td><td>${money(row.amount)}</td><td>${esc(row.type)}</td><td>${esc(row.category)}</td><td>${esc(row.account)}</td><td>${row.pending ? 'Pending' : 'Posted'}</td></tr>`).join('')}</tbody></table></div>${normalization.transactions.length > 15 ? `<p class="muted-note">Showing 15 of ${normalization.transactions.length} normalized rows.</p>` : ''}</article>`;
}

function coverageView(state) {
  const coverage = state.analysis.coverage;
  const hasRisk = coverage.missingIncomingMonths.length > 0;
  return `<article class="card import-coverage-card"><div class="section-title-row"><div><h3>Date coverage and overlap</h3><p>Review gaps and overlap before any write.</p></div><div class="section-meta">Overlap: ${esc(coverage.overlap)}</div></div><div class="grid two"><div class="summary-box compact">Incoming earliest: ${esc(coverage.incomingEarliest)}\nIncoming latest: ${esc(coverage.incomingLatest)}</div><div class="summary-box compact">Existing earliest: ${esc(coverage.existingEarliest)}\nExisting latest: ${esc(coverage.existingLatest)}</div></div><div class="notes">${coverage.warnings.map((warning) => `<div class="note ${hasRisk ? 'risk-note' : 'good-note'}">${esc(warning)}</div>`).join('')}</div></article>`;
}

function exactDuplicatesView(state) {
  const rows = state.analysis.exact;
  return `<article class="card"><div class="section-title-row"><div><h3>Exact duplicates</h3><p>Stable transaction IDs are preferred. Rows without IDs use a deterministic date, amount, merchant, account, and source fingerprint.</p></div><div class="section-meta">${rows.length} skipped automatically</div></div>${rows.length ? `<div class="table-wrap"><table class="ledger import-table"><thead><tr><th>Incoming</th><th>Existing match</th><th>Reason</th></tr></thead><tbody>${rows.slice(0, 100).map((item) => `<tr><td>${transactionLine(item.incoming)}</td><td>${transactionLine(item.existing)}</td><td>${esc(item.reason)}</td></tr>`).join('')}</tbody></table></div>` : '<p>No exact duplicates were found.</p>'}</article>`;
}

function fuzzyView(state) {
  const rows = state.analysis.fuzzy;
  return `<article class="card"><div class="section-title-row"><div><h3>Probable duplicates requiring review</h3><p>Ambiguous matches are never discarded automatically. Choose an outcome for every row.</p></div><div class="section-meta">${state.counts.unresolved} unresolved</div></div>${rows.length ? `<div class="fuzzy-review-list">${rows.map((item) => { const decision = state.decisions[item.incomingIndex] || 'defer'; return `<article class="fuzzy-review-card"><div class="fuzzy-comparison"><div><strong>Incoming</strong><p>${transactionLine(item.incoming)}</p></div><div><strong>Existing candidate</strong><p>${transactionLine(item.existing)}</p></div></div><p><strong>${esc(item.confidence)} match:</strong> ${item.reasons.map(esc).join(', ')}.</p><label>Decision<select data-bank-fuzzy-decision="${item.incomingIndex}"><option value="defer" ${decision === 'defer' ? 'selected' : ''}>Defer / keep under review</option><option value="keep" ${decision === 'keep' ? 'selected' : ''}>Keep incoming</option><option value="skip" ${decision === 'skip' ? 'selected' : ''}>Skip incoming</option></select></label></article>`; }).join('')}</div>` : '<p>No fuzzy duplicate candidates need a decision.</p>'}</article>`;
}

function newRowsView(state) {
  const rows = state.analysis.fresh;
  return `<article class="card"><div class="section-title-row"><div><h3>Rows not already present</h3><p>These rows are included unless later validation blocks the write.</p></div><div class="section-meta">${rows.length} new</div></div>${rows.length ? `<div class="list compact-list">${rows.slice(0, 30).map((item) => `<div class="list-item"><span>${transactionLine(item.incoming)}</span></div>`).join('')}</div>` : '<p>No automatically new rows remain.</p>'}</article>`;
}

function importSafetyView(state) {
  const noChange = state.valid && state.counts.inserted === 0 && state.counts.unresolved === 0;
  const acknowledgement = noChange
    ? 'I reviewed the mapping, amount signs, date coverage, and duplicate results and want to record this no-change import.'
    : 'I downloaded the populated destination backup and reviewed mapping, amount signs, date coverage, and every duplicate result.';
  return `<article class="card warning-card"><div class="section-title-row"><div><h3>Backup, acknowledge, and confirm</h3><p>A populated destination backup is required before any transaction write. The saved vault is read back and verified.</p></div><div class="section-meta">${state.counts.inserted} to insert · ${state.counts.skipped} to skip</div></div><div class="button-row"><button id="prepareBankImportBackup" class="btn primary" ${state.valid && state.counts.inserted > 0 ? '' : 'disabled'}>${state.backupPrepared ? `Backup prepared (${state.backupTransactionCount})` : 'Download v115 Pre-Import Backup'}</button><button id="resetBankImport" class="btn secondary">Clear Import Session</button></div><label class="ack-row"><input id="bankImportAck" type="checkbox" ${state.acknowledged ? 'checked' : ''} ${state.valid && state.counts.unresolved === 0 && (noChange || state.backupPrepared) ? '' : 'disabled'}><span>${esc(acknowledgement)}</span></label><button id="commitBankImport" class="btn danger restore-button" ${state.ready ? '' : 'disabled'}>${noChange ? 'Record No-Change Import' : `Confirm Local Import (${state.counts.inserted})`}</button>${state.result ? `<div class="note good-note" role="status">Verified result: ${state.result.insertedCount} inserted, ${state.result.skippedCount} skipped, ${state.result.destinationAfterCount} destination rows.</div>` : ''}</article>`;
}

function duplicateReviewView(state) {
  if (!state.analysis) return '';
  return `<section class="bank-duplicate-review"><div class="section-title-row"><div><h3>3. Reconcile and import</h3><p>Exact matches are skipped. Probable matches require an explicit Keep, Skip, or Defer decision.</p></div><label>Destination vault<select id="bankImportDestination">${destinationOptions(state)}</select></label></div><div class="import-summary-grid"><article class="kpi"><strong>${state.analysis.incomingCount}</strong><span>Incoming rows</span></article><article class="kpi"><strong>${state.counts.exact}</strong><span>Exact duplicates</span></article><article class="kpi"><strong>${state.counts.fuzzy}</strong><span>Needs review</span></article><article class="kpi"><strong>${state.counts.inserted}</strong><span>Planned inserts</span></article></div>${coverageView(state)}${exactDuplicatesView(state)}${fuzzyView(state)}${newRowsView(state)}${importSafetyView(state)}</section>`;
}

function importHistoryView(state) {
  const history = state.history;
  return `<article class="card"><div class="section-title-row"><div><h3>Import receipts</h3><p>Receipts store format, schema, mapping summary, counts, and verification metadata—not transaction copies.</p></div><div class="section-meta">${history.length} recorded</div></div>${history.length ? `<div class="table-wrap"><table class="ledger import-table"><thead><tr><th>Imported</th><th>Source</th><th>Format / schema</th><th>Coverage</th><th>Result</th><th>Destination</th></tr></thead><tbody>${history.map((entry) => `<tr><td>${esc(new Date(entry.timestamp).toLocaleString())}</td><td>${esc(entry.sourceFilename)}<br><small>${esc(String(entry.sourceFingerprint || '').slice(0, 16))}${entry.sourceFingerprint ? '…' : ''}</small></td><td>${esc(String(entry.format || 'JSON').toUpperCase())}<br><small>${esc(entry.detectedSchema || entry.source || 'Legacy import')}</small></td><td>${esc(entry.earliestDate)} through ${esc(entry.latestDate)}</td><td>${entry.insertedCount} inserted · ${entry.skippedCount} skipped<br><small>${esc(entry.verificationResult)}</small></td><td>${esc(entry.selectedDestinationVault)}<br><small>${entry.destinationBeforeCount} → ${entry.destinationAfterCount}</small></td></tr>`).join('')}</tbody></table></div>` : '<p>No duplicate-safe imports have been recorded in this browser.</p>'}</article>`;
}

function restoreView() {
  const current = best();
  const data = restoreSnapshot();
  return `<section class="restore-workflow" aria-labelledby="fullRestoreHeading"><div class="section-title-row"><div><h3 id="fullRestoreHeading">Full vault restore</h3><p>Restore replaces the destination vault after a separate populated-file preview and explicit confirmation.</p></div><div class="section-meta">Destination: ${esc(BUILD.storageKey)}</div></div><article class="card warning-card"><h4>Backup first</h4><p>Download the current populated vault before restoring whenever a backup is available.</p><div class="summary-box compact">Current best vault: ${esc(current?.key || 'none')}\nCurrent transactions: ${current?.transactions || 0}\nRestore destination: ${esc(BUILD.storageKey)}</div><div class="button-row"><button id="importBackup" class="btn primary">Download Current Backup</button></div></article><article class="card"><h4>1. Choose local JSON vault</h4><label class="file-drop" for="restoreFile"><span><strong>Choose Gringotts JSON vault</strong><br>Nothing is uploaded or transmitted.</span><input id="restoreFile" type="file" accept="application/json,.json"></label>${data.error ? `<div class="error-box" role="alert">${esc(data.error)}</div>` : ''}</article><article class="card"><h4>2. Review restore preview</h4>${data.valid ? `<div class="grid two"><div class="summary-box compact">File: ${esc(data.preview.fileName)}\nTransactions: ${data.preview.transactionCount}\nEarliest date: ${esc(data.preview.earliestDate)}\nLatest date: ${esc(data.preview.latestDate)}</div><div class="summary-box compact">Source: ${esc(data.preview.source)}\nVersion: ${esc(data.preview.version)}\nDeclared key: ${esc(data.preview.declaredStorageKey)}\nDestination key: ${esc(data.preview.destinationKey)}</div></div>` : '<p>No valid populated vault has been previewed.</p>'}</article><article class="card"><h4>3. Acknowledge and restore</h4><label class="ack-row"><input id="restoreAck" type="checkbox" ${data.acknowledged ? 'checked' : ''} ${data.valid ? '' : 'disabled'}><span>I downloaded a current backup and reviewed the restore preview.</span></label><button id="restoreVault" class="btn danger restore-button" ${data.valid && data.acknowledged ? '' : 'disabled'}>Confirm Restore to ${esc(BUILD.storageKey)}</button></article></section>`;
}

export function bankImportView() {
  const state = bankSnapshot();
  return `<section class="section active import-restore-page v115-import-page"><div class="section-title-row"><div><h2>Bank Export Import / Restore</h2><p>Inspect and map local bank exports, reconcile duplicates, then write only verified missing rows. Use full restore only to replace a vault.</p></div><div class="section-meta">No uploads</div></div><section class="import-workflow" aria-labelledby="bankExportImportHeading"><h3 id="bankExportImportHeading" class="visually-hidden">Bank export import</h3>${fileInspectionView(state)}${sourcePreview(state)}${mappingView(state)}${normalizedPreview(state)}${duplicateReviewView(state)}${importHistoryView(state)}</section>${restoreView()}</section>`;
}
