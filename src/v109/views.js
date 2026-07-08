import { BUILD, best, esc, money } from '../v103/core.js';
import { snapshot as restoreSnapshot } from '../v103/restore.js';
import { exportsView } from '../v104/views-admin.js';
import {
  activityView, calendarView, dashboardView, diagnosticsView, moneyView, reportsView
} from '../v108/views.js';
import { snapshot as importSnapshot } from './import-memory.js';

export { activityView, calendarView, dashboardView, diagnosticsView, moneyView, reportsView };

function transactionLine(transaction) {
  return `${esc(transaction.date)} · ${esc(transaction.name)} · ${money(transaction.amount)} · ${esc(transaction.account)}`;
}

function destinationOptions(state) {
  return state.destinations.map((destination) => `<option value="${esc(destination.key)}" ${destination.key === state.destinationKey ? 'selected' : ''}>${esc(destination.key)} — ${destination.transactions} transactions</option>`).join('');
}

function coverageView(state) {
  const coverage = state.analysis.coverage;
  return `<article class="card import-coverage-card"><div class="section-title-row"><div><h3>Date coverage</h3><p>Use these ranges to spot missing periods before any write.</p></div><div class="section-meta">Overlap: ${esc(coverage.overlap)}</div></div><div class="grid two"><div class="summary-box compact">Incoming earliest: ${esc(coverage.incomingEarliest)}\nIncoming latest: ${esc(coverage.incomingLatest)}</div><div class="summary-box compact">Existing earliest: ${esc(coverage.existingEarliest)}\nExisting latest: ${esc(coverage.existingLatest)}</div></div><div class="notes">${coverage.warnings.map((warning) => `<div class="note ${coverage.missingIncomingMonths.length ? 'risk-note' : 'good-note'}">${esc(warning)}</div>`).join('')}</div></article>`;
}

function exactDuplicatesView(state) {
  const rows = state.analysis.exact;
  return `<article class="card"><div class="section-title-row"><div><h3>Exact duplicates</h3><p>Stable transaction IDs are preferred. Rows without IDs use a deterministic date, amount, merchant, account, and source fingerprint.</p></div><div class="section-meta">${rows.length} skipped automatically</div></div>${rows.length ? `<div class="table-wrap"><table class="ledger import-table"><thead><tr><th>Incoming</th><th>Existing match</th><th>Reason</th></tr></thead><tbody>${rows.slice(0, 100).map((item) => `<tr><td>${transactionLine(item.incoming)}</td><td>${transactionLine(item.existing)}</td><td>${esc(item.reason)}</td></tr>`).join('')}</tbody></table></div>${rows.length > 100 ? `<p class="muted-note">Showing the first 100 of ${rows.length} exact duplicates.</p>` : ''}` : '<p>No exact duplicates were found.</p>'}</article>`;
}

function fuzzyView(state) {
  const rows = state.analysis.fuzzy;
  return `<article class="card"><div class="section-title-row"><div><h3>Probable duplicates requiring review</h3><p>Ambiguous matches are never discarded automatically. Choose an outcome for every row.</p></div><div class="section-meta">${state.counts.unresolved} unresolved</div></div>${rows.length ? `<div class="fuzzy-review-list">${rows.map((item) => {
    const decision = state.decisions[item.incomingIndex] || 'defer';
    return `<article class="fuzzy-review-card"><div class="fuzzy-comparison"><div><strong>Incoming</strong><p>${transactionLine(item.incoming)}</p></div><div><strong>Existing candidate</strong><p>${transactionLine(item.existing)}</p></div></div><p><strong>${esc(item.confidence)} match:</strong> ${item.reasons.map(esc).join(', ')}.</p><label>Decision<select data-fuzzy-decision="${item.incomingIndex}"><option value="defer" ${decision === 'defer' ? 'selected' : ''}>Defer / keep under review</option><option value="keep" ${decision === 'keep' ? 'selected' : ''}>Keep incoming</option><option value="skip" ${decision === 'skip' ? 'selected' : ''}>Skip incoming</option></select></label><p class="muted-note">Keeping the incoming row adds it without changing the existing candidate.</p></article>`;
  }).join('')}</div>` : '<p>No fuzzy duplicate candidates need a decision.</p>'}</article>`;
}

function newRowsView(state) {
  const rows = state.analysis.fresh;
  return `<article class="card"><div class="section-title-row"><div><h3>Rows not already present</h3><p>These rows are included in the missing-only import unless a later validation blocks the write.</p></div><div class="section-meta">${rows.length} new</div></div>${rows.length ? `<div class="list compact-list">${rows.slice(0, 30).map((item) => `<div class="list-item"><span>${transactionLine(item.incoming)}</span></div>`).join('')}</div>${rows.length > 30 ? `<p class="muted-note">Showing the first 30 of ${rows.length} new rows.</p>` : ''}` : '<p>No automatically new rows remain.</p>'}</article>`;
}

function importSafetyView(state) {
  const noChange = state.valid && state.counts.inserted === 0 && state.counts.unresolved === 0;
  const acknowledgement = noChange
    ? 'I reviewed the duplicate results and want to record this no-change import.'
    : 'I downloaded the populated destination backup and reviewed the duplicate and coverage results.';
  const buttonLabel = noChange ? 'Record No-Change Import' : `Confirm Missing-Only Import (${state.counts.inserted})`;
  return `<article class="card warning-card"><div class="section-title-row"><div><h3>Backup, acknowledge, and confirm</h3><p>A populated destination backup is required before any transaction write. The destination is read back and verified after storage.</p></div><div class="section-meta">${state.counts.inserted} to insert · ${state.counts.skipped} to skip</div></div><div class="button-row"><button id="prepareImportBackup" class="btn primary" ${state.valid && state.counts.inserted > 0 ? '' : 'disabled'}>${state.backupPrepared ? `Backup prepared (${state.backupTransactionCount})` : 'Download Pre-Import Backup'}</button><button id="resetImportPreview" class="btn secondary" ${state.fileName ? '' : 'disabled'}>Clear Preview</button></div><label class="ack-row"><input id="importAck" type="checkbox" ${state.acknowledged ? 'checked' : ''} ${state.valid && state.counts.unresolved === 0 && (noChange || state.backupPrepared) ? '' : 'disabled'}><span>${esc(acknowledgement)}</span></label><button id="commitImport" class="btn danger restore-button" ${state.ready ? '' : 'disabled'}>${esc(buttonLabel)}</button>${state.result ? `<div class="note good-note" role="status">Verified result: ${state.result.insertedCount} inserted, ${state.result.skippedCount} skipped, ${state.result.destinationAfterCount} destination rows.</div>` : ''}</article>`;
}

function importHistoryView(state) {
  const history = state.history;
  return `<article class="card"><div class="section-title-row"><div><h3>Import history</h3><p>History stores reconciliation metadata only, never redundant transaction copies.</p></div><div class="section-meta">${history.length} recorded</div></div>${history.length ? `<div class="table-wrap"><table class="ledger import-table"><thead><tr><th>Imported</th><th>Source</th><th>Coverage</th><th>Result</th><th>Destination</th></tr></thead><tbody>${history.map((entry) => `<tr><td>${esc(new Date(entry.timestamp).toLocaleString())}</td><td>${esc(entry.sourceFilename)}<br><small>${esc(String(entry.sourceFingerprint || '').slice(0, 16))}${entry.sourceFingerprint ? '…' : ''}</small></td><td>${esc(entry.earliestDate)} through ${esc(entry.latestDate)}</td><td>${entry.insertedCount} inserted · ${entry.skippedCount} skipped<br><small>${esc(entry.verificationResult)}</small></td><td>${esc(entry.selectedDestinationVault)}<br><small>${entry.destinationBeforeCount} → ${entry.destinationAfterCount}</small></td></tr>`).join('')}</tbody></table></div>` : '<p>No duplicate-safe imports have been recorded in this browser.</p>'}</article>`;
}

function duplicateSafeImportView() {
  const state = importSnapshot();
  return `<section class="import-workflow" aria-labelledby="duplicateSafeImportHeading"><article class="card"><div class="section-title-row"><div><h3 id="duplicateSafeImportHeading">Duplicate-safe transaction import</h3><p>Preview a local JSON file, reconcile exact and probable duplicates, then add only reviewed missing rows.</p></div><div class="section-meta">Local processing only</div></div><div class="grid two"><label class="file-drop" for="importFile"><span><strong>Choose transaction JSON</strong><br>The file must contain a populated <code>transactions</code> array.</span><input id="importFile" type="file" accept="application/json,.json"></label><label>Destination vault<select id="importDestination" ${state.destinations.length ? '' : 'disabled'}>${destinationOptions(state)}</select></label></div>${state.fileName ? `<div class="summary-box compact">Selected file: ${esc(state.fileName)}\nSource fingerprint: ${esc(state.sourceFingerprint.slice(0, 20))}${state.sourceFingerprint ? '…' : ''}\nDestination: ${esc(state.destinationKey)}</div>` : ''}${state.error ? `<div class="error-box" role="alert">${esc(state.error)}</div>` : ''}</article>${state.valid ? `<div class="import-summary-grid"><article class="kpi"><strong>${state.analysis.incomingCount}</strong><span>Incoming rows</span></article><article class="kpi"><strong>${state.counts.exact}</strong><span>Exact duplicates</span></article><article class="kpi"><strong>${state.counts.fuzzy}</strong><span>Needs review</span></article><article class="kpi"><strong>${state.counts.inserted}</strong><span>Planned inserts</span></article></div>${coverageView(state)}${exactDuplicatesView(state)}${fuzzyView(state)}${newRowsView(state)}${importSafetyView(state)}` : ''}${importHistoryView(state)}</section>`;
}

function restoreView() {
  const current = best();
  const data = restoreSnapshot();
  return `<section class="restore-workflow" aria-labelledby="fullRestoreHeading"><div class="section-title-row"><div><h3 id="fullRestoreHeading">Full vault restore</h3><p>Restore replaces the destination vault after a separate populated-file preview and explicit confirmation.</p></div><div class="section-meta">Destination: ${esc(BUILD.storageKey)}</div></div><article class="card warning-card"><h4>Backup first</h4><p>Download the current populated vault before restoring whenever a backup is available.</p><div class="summary-box compact">Current best vault: ${esc(current?.key || 'none')}\nCurrent transactions: ${current?.transactions || 0}\nRestore destination: ${esc(BUILD.storageKey)}</div><div class="button-row"><button id="importBackup" class="btn primary">Download Current Backup</button></div></article><article class="card"><h4>1. Choose local JSON vault</h4><label class="file-drop" for="restoreFile"><span><strong>Choose Gringotts JSON vault</strong><br>Nothing is uploaded or transmitted.</span><input id="restoreFile" type="file" accept="application/json,.json"></label>${data.error ? `<div class="error-box" role="alert">${esc(data.error)}</div>` : ''}</article><article class="card"><h4>2. Review restore preview</h4>${data.valid ? `<div class="grid two"><div class="summary-box compact">File: ${esc(data.preview.fileName)}\nTransactions: ${data.preview.transactionCount}\nEarliest date: ${esc(data.preview.earliestDate)}\nLatest date: ${esc(data.preview.latestDate)}</div><div class="summary-box compact">Source: ${esc(data.preview.source)}\nVersion: ${esc(data.preview.version)}\nDeclared key: ${esc(data.preview.declaredStorageKey)}\nDestination key: ${esc(data.preview.destinationKey)}</div></div>` : '<p>No valid populated vault has been previewed.</p>'}</article><article class="card"><h4>3. Acknowledge and restore</h4><label class="ack-row"><input id="restoreAck" type="checkbox" ${data.acknowledged ? 'checked' : ''} ${data.valid ? '' : 'disabled'}><span>I downloaded a current backup and reviewed the restore preview.</span></label><p class="muted-note">Checking this box also confirms that you intentionally accept proceeding if you chose to skip the backup.</p><button id="restoreVault" class="btn danger restore-button" ${data.valid && data.acknowledged ? '' : 'disabled'}>Confirm Restore to ${esc(BUILD.storageKey)}</button></article></section>`;
}

export function importView() {
  return `<section class="section active import-restore-page"><div class="section-title-row"><div><h2>Import / Restore</h2><p>Use duplicate-safe import for incremental transaction files. Use full restore only when intentionally replacing the vault.</p></div><div class="section-meta">No uploads</div></div>${duplicateSafeImportView()}${restoreView()}</section>`;
}

export function roadmapView() {
  const roadmap = [
    ['v110', 'Month Close & Forecasting', 'statement reconciliation, close snapshots, controlled reopen, forecasting, debt, and promotional APR planning'],
    ['v111', 'Household Reporting III', 'goal and health meeting-pack sections, custom date ranges, year-over-year reporting, and cleaner PDF pagination'],
    ['v112', 'Accessibility & Quality Automation', 'axe-core, Lighthouse CI budgets, and selective synthetic visual regression'],
    ['v116', 'Planned UI Architecture Review', 'navigation, content, accessibility, touch targets, density, and responsive-design review']
  ];
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Every release includes responsive and navigation checks; the next larger architecture review remains scheduled for about v116.</p></div><div class="section-meta">Next: v110</div></div><article class="roadmap-item shipped"><h3>v109 — Import Memory & Duplicate Guard</h3><p>Exact ID and fingerprint protection, explainable fuzzy review, coverage warnings, local import history, missing-only writes, backup-first confirmation, and read-back verification.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}

export function toolsView(section = 'import') {
  const map = { import: importView, exports: exportsView, roadmap: roadmapView };
  const content = section === 'diagnostics' ? '<div id="diagnosticsMount"></div>' : (map[section] || map.import)();
  return `<div class="workspace"><div class="subnav tools-subnav" role="tablist" aria-label="Tools sections"><button class="subtab ${section === 'import' ? 'active' : ''}" data-tools-section="import">Import / Restore</button><button class="subtab ${section === 'exports' ? 'active' : ''}" data-tools-section="exports">Exports & Backup</button><button class="subtab ${section === 'diagnostics' ? 'active' : ''}" data-tools-section="diagnostics">Diagnostics</button><button class="subtab ${section === 'roadmap' ? 'active' : ''}" data-tools-section="roadmap">Roadmap</button></div>${content}</div>`;
}
