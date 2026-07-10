import { downloadJson, stamp, vaults } from '../v103/core.js';
import * as imports from '../v115/bank-import.js?v=115bankimport2';
import { importProfileSnapshot } from '../v117/import-profiles.js?v=117profiles1';
import {
  buildDryRunDiagnostic, dryRunDiagnosticSignature
} from '../v119/profile-versioning-model.js';
import { auditImportReceipt } from '../v120/import-receipt-audit-model.js';
import {
  IMPORT_BATCH_INDEX_KEY, appendBatchLink, buildReceiptTimeline,
  buildReceiptTimelinePackage, createDryRunReceiptLink, filterReceiptTimeline,
  sanitizeBatchIndex
} from './receipt-integrity-model.js';

let selectedBatchKey = '';
let stagedDryRun = null;
let handlersInstalled = false;
let refreshQueued = false;
let queryTimer = null;
const filters = {
  status: 'all', result: 'all', lineage: 'all', dryRun: 'all', destination: 'all', query: ''
};

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function currentDestinationCounts() {
  return Object.fromEntries(vaults()
    .filter((candidate) => candidate?.status === 'readable' && candidate?.key)
    .map((candidate) => [candidate.key, candidate.transactions]));
}

function readBatchIndex() {
  try {
    return sanitizeBatchIndex(JSON.parse(localStorage.getItem(IMPORT_BATCH_INDEX_KEY) || '{"links":[]}'));
  } catch {
    return sanitizeBatchIndex({ links: [] });
  }
}

function verifiedWriteBatchIndex(nextValue) {
  const previousRaw = localStorage.getItem(IMPORT_BATCH_INDEX_KEY);
  const next = sanitizeBatchIndex(nextValue);
  try {
    localStorage.setItem(IMPORT_BATCH_INDEX_KEY, JSON.stringify(next));
    const verified = sanitizeBatchIndex(JSON.parse(localStorage.getItem(IMPORT_BATCH_INDEX_KEY) || '{}'));
    if (JSON.stringify(verified) !== JSON.stringify(next)) {
      throw new Error('Import batch-index read-back verification failed.');
    }
    return verified;
  } catch (error) {
    try {
      if (previousRaw === null) localStorage.removeItem(IMPORT_BATCH_INDEX_KEY);
      else localStorage.setItem(IMPORT_BATCH_INDEX_KEY, previousRaw);
    } catch {}
    throw new Error(`${error?.message || 'Import batch-index write failed.'} The previous metadata index was restored.`);
  }
}

function currentTimeline() {
  return buildReceiptTimeline(imports.importHistory(), readBatchIndex(), currentDestinationCounts());
}

function batchKey(batch) {
  return `${batch.batchId}:${batch.receipt.receiptIndex}`;
}

function findSelected(timeline, visible = timeline.batches) {
  return visible.find((batch) => batchKey(batch) === selectedBatchKey)
    || timeline.batches.find((batch) => batchKey(batch) === selectedBatchKey)
    || visible[0]
    || timeline.batches[0]
    || null;
}

function stageDryRunCandidate() {
  try {
    const state = imports.snapshot();
    if (!state?.inspection) return;
    const profileSnapshot = importProfileSnapshot();
    const diagnostic = buildDryRunDiagnostic(state, { profileSnapshot });
    stagedDryRun = {
      signature: dryRunDiagnosticSignature(state, profileSnapshot),
      createdAt: diagnostic.createdAt,
      source: { ...diagnostic.source },
      validation: { ...diagnostic.validation },
      duplicates: { ...diagnostic.duplicates },
      readiness: { ...diagnostic.readiness }
    };
  } catch {
    stagedDryRun = null;
  }
}

function currentStagedDryRun() {
  if (!stagedDryRun) return null;
  try {
    const signature = dryRunDiagnosticSignature(imports.snapshot(), importProfileSnapshot());
    return signature && signature === stagedDryRun.signature
      ? { ...stagedDryRun, current: true }
      : null;
  } catch {
    return null;
  }
}

function writeDryRunLink(receipt, candidate) {
  if (!candidate) return false;
  const link = createDryRunReceiptLink(receipt, candidate);
  const next = appendBatchLink(readBatchIndex(), link);
  verifiedWriteBatchIndex(next);
  window.dispatchEvent(new CustomEvent('gringotts:batch-index-changed', {
    detail: { receiptImportId: receipt.importId, linked: true }
  }));
  stagedDryRun = null;
  return true;
}

function detectNewReceipt(previousIds, candidate, attempt = 0) {
  const history = imports.importHistory();
  const receipt = history.find((entry) => entry?.importId && !previousIds.has(entry.importId));
  if (!receipt && attempt < 5) {
    setTimeout(() => detectNewReceipt(previousIds, candidate, attempt + 1), 50);
    return;
  }
  if (!receipt || !candidate) return;
  try {
    if (writeDryRunLink(receipt, candidate)) {
      announce('Verified dry-run metadata linked to the new import receipt');
      refreshTimelineCard();
    }
  } catch (error) {
    announce(error?.message || 'The receipt was saved, but dry-run lineage could not be retained');
  }
}

function installEarlyCaptureHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if (!button) return;
    if (button.id === 'prepareImportDryRun') {
      queueMicrotask(stageDryRunCandidate);
      return;
    }
    if (button.id === 'commitBankImport') {
      const previousIds = new Set(imports.importHistory().map((entry) => entry?.importId).filter(Boolean));
      const candidate = currentStagedDryRun();
      setTimeout(() => detectNewReceipt(previousIds, candidate), 0);
    }
  }, true);
}

function statusLabel(status) {
  if (status === 'verified') return 'Verified';
  if (status === 'verified-with-notes') return 'Verified with notes';
  return 'Needs review';
}

function statusClass(status) {
  if (status === 'verified') return 'good-note';
  if (status === 'verified-with-notes') return 'warning-note';
  return 'risk-note';
}

function continuityLabel(state) {
  if (state === 'linked') return 'Continuous';
  if (state === 'origin') return 'Earliest retained';
  if (state === 'legacy') return 'Legacy counts';
  if (state === 'untracked-increase') return 'Untracked increase';
  if (state === 'count-decrease') return 'Count decrease';
  return state || 'Unknown';
}

function outcomeLabel(value) {
  if (value === 'inserted') return 'Inserted rows';
  if (value === 'no-change') return 'No change';
  return 'Unknown result';
}

function dryRunLabel(batch) {
  if (!batch.dryRun.linked) return 'Not linked';
  return batch.dryRun.transactionWriteReady ? 'Linked · ready' : 'Linked · not ready';
}

function sourceLabel(receipt) {
  const name = receipt.sourceFilename || 'Selected bank export';
  const fingerprint = receipt.sourceFingerprint || '';
  return fingerprint ? `${name}\n${fingerprint.slice(0, 16)}…` : name;
}

function metric(value, label) {
  const card = element('article', 'kpi receipt-timeline-kpi');
  card.append(element('strong', '', Number(value || 0).toLocaleString()), element('span', '', label));
  return card;
}

function option(value, label, selected) {
  const node = element('option', '', label);
  node.value = value;
  node.selected = value === selected;
  return node;
}

function selectFilter(name, label, values) {
  const wrapper = element('label', 'receipt-filter-control');
  wrapper.append(element('span', '', label));
  const select = document.createElement('select');
  select.dataset.v121Filter = name;
  values.forEach(([value, text]) => select.append(option(value, text, filters[name])));
  wrapper.append(select);
  return wrapper;
}

function filterControls(timeline) {
  const card = element('section', 'receipt-timeline-filters');
  const grid = element('div', 'receipt-filter-grid');
  grid.append(
    selectFilter('status', 'Integrity', [
      ['all', 'All integrity states'], ['verified', 'Verified'],
      ['verified-with-notes', 'Verified with notes'], ['needs-review', 'Needs review']
    ]),
    selectFilter('result', 'Result', [
      ['all', 'All results'], ['inserted', 'Inserted rows'], ['no-change', 'No change'], ['unknown', 'Unknown']
    ]),
    selectFilter('lineage', 'Lineage', [
      ['all', 'All lineage states'], ['linked', 'Continuous'], ['origin', 'Earliest retained'],
      ['break', 'Continuity break'], ['legacy', 'Legacy counts']
    ]),
    selectFilter('dryRun', 'Dry-run link', [
      ['all', 'All dry-run states'], ['linked', 'Any linked dry run'], ['ready', 'Linked and write-ready'],
      ['not-ready', 'Linked but not write-ready'], ['unlinked', 'Not linked']
    ])
  );
  const destinations = [...new Set(timeline.batches.map((batch) => batch.destinationFamily))].sort();
  grid.append(selectFilter('destination', 'Destination family', [
    ['all', 'All destination families'],
    ...destinations.map((value, index) => [value, `Destination family ${index + 1}`])
  ]));
  const search = element('label', 'receipt-filter-control receipt-filter-search');
  search.append(element('span', '', 'Local search'));
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Receipt, source, schema, format';
  input.value = filters.query;
  input.dataset.v121FilterQuery = 'true';
  search.append(input);
  grid.append(search);
  const actions = element('div', 'button-row receipt-filter-actions');
  const clear = element('button', 'btn secondary', 'Clear Filters');
  clear.type = 'button';
  clear.id = 'clearReceiptTimelineFilters';
  actions.append(clear);
  card.append(grid, actions);
  return card;
}

function addCell(row, text, className = '') {
  row.append(element('td', className, text));
}

function timelineTable(visible) {
  const wrap = element('div', 'table-wrap receipt-timeline-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Import receipt timeline');
  const table = element('table', 'ledger import-table receipt-timeline-table');
  const head = element('thead');
  const headRow = element('tr');
  ['Imported', 'Source', 'Result', 'Lineage', 'Dry run', 'Integrity', 'Review'].forEach((label) => headRow.append(element('th', '', label)));
  head.append(headRow);
  const body = element('tbody');
  visible.forEach((batch) => {
    const row = element('tr');
    const time = Number.isFinite(Date.parse(batch.receipt.timestamp))
      ? new Date(batch.receipt.timestamp).toLocaleString()
      : 'Unknown time';
    addCell(row, time);
    addCell(row, `${sourceLabel(batch.receipt)}\n${String(batch.receipt.format || 'unknown').toUpperCase()} · ${batch.receipt.detectedSchema}`);
    addCell(row, `${outcomeLabel(batch.outcome)}\n${batch.receipt.insertedCount ?? '—'} inserted · ${batch.receipt.skippedCount ?? '—'} skipped`);
    addCell(row, `${continuityLabel(batch.continuity.state)}\nBatch ${batch.sequence} of ${batch.sequenceCount}`);
    addCell(row, dryRunLabel(batch));
    const statusCell = element('td');
    statusCell.append(element('span', `note compact-note ${statusClass(batch.status)}`, statusLabel(batch.status)));
    row.append(statusCell);
    const actionCell = element('td');
    const button = element('button', 'btn secondary compact-button', 'Review');
    button.type = 'button';
    button.dataset.v121BatchSelect = batchKey(batch);
    button.setAttribute('aria-label', `Review receipt batch imported ${time}`);
    actionCell.append(button);
    row.append(actionCell);
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function summaryBox(lines) {
  const box = element('div', 'summary-box compact');
  box.textContent = lines.join('\n');
  return box;
}

function checksTable(batch) {
  const card = element('article', 'card receipt-integrity-checks');
  card.append(element('h4', '', 'Receipt and lineage checks'));
  const wrap = element('div', 'table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Receipt and lineage integrity checks');
  const table = element('table', 'ledger');
  const head = element('thead');
  const row = element('tr');
  ['Check', 'Status', 'Detail'].forEach((label) => row.append(element('th', '', label)));
  head.append(row);
  const body = element('tbody');
  batch.checks.forEach((check) => {
    const checkRow = element('tr');
    addCell(checkRow, check.label);
    addCell(checkRow, check.status === 'pass' ? 'Pass' : check.status === 'warn' ? 'Review note' : check.status === 'fail' ? 'Failed' : 'Information');
    addCell(checkRow, check.detail);
    body.append(checkRow);
  });
  table.append(head, body);
  wrap.append(table);
  card.append(wrap);
  return card;
}

function rollbackCard(batch) {
  const audit = auditImportReceipt(batch.receipt, {
    currentDestinationCount: currentDestinationCounts()[batch.receipt.selectedDestinationVault]
  });
  const card = element('article', 'card warning-card receipt-lineage-rollback');
  card.append(
    element('h4', '', 'Backup and manual rollback guidance'),
    element('p', '', 'No automatic rollback is available. Receipt and batch review never restores, deletes, repairs, or rewrites transactions.')
  );
  card.append(summaryBox(audit.backup.expected ? [
    `Expected backup filename: ${audit.backup.filenamePattern || 'Unknown'}`,
    `Expected pre-import transaction count: ${audit.backup.expectedTransactionCount ?? 'Unknown'}`,
    'Backup location is not stored or scanned automatically.'
  ] : [
    'This receipt reports no inserted rows.',
    'No pre-import backup requirement is inferred for a verified no-change receipt.'
  ]));
  const steps = element('ol', 'action-list receipt-rollback-steps');
  audit.rollback.steps.forEach((step) => steps.append(element('li', '', step)));
  card.append(steps);
  const actions = element('div', 'button-row');
  const copy = element('button', 'btn secondary', 'Copy Batch Summary');
  copy.type = 'button';
  copy.id = 'copyReceiptBatchSummary';
  const download = element('button', 'btn secondary', 'Download Selected Batch');
  download.type = 'button';
  download.id = 'downloadSelectedReceiptBatch';
  const restore = element('button', 'btn primary', 'Open Restore Task');
  restore.type = 'button';
  restore.id = 'openReceiptTimelineRestore';
  actions.append(copy, download, restore);
  card.append(actions);
  return card;
}

function detailView(batch) {
  const section = element('section', 'receipt-timeline-detail');
  section.id = 'receiptTimelineDetail';
  section.setAttribute('aria-live', 'polite');
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  const imported = Number.isFinite(Date.parse(batch.receipt.timestamp))
    ? new Date(batch.receipt.timestamp).toLocaleString()
    : 'Unknown time';
  title.append(
    element('h4', '', `Batch ${batch.sequence} of ${batch.sequenceCount} · ${imported}`),
    element('p', '', 'Source filename, fingerprint, and destination key are visible only in this local browser view and are excluded from timeline downloads.')
  );
  titleRow.append(title, element('span', `note compact-note ${statusClass(batch.status)}`, statusLabel(batch.status)));
  const overview = element('div', 'grid two receipt-timeline-overview');
  overview.append(
    summaryBox([
      `Source: ${sourceLabel(batch.receipt)}`,
      `Format: ${String(batch.receipt.format || 'unknown').toUpperCase()}`,
      `Schema: ${batch.receipt.detectedSchema}`,
      `Coverage: ${batch.receipt.earliestDate || 'Unknown'} through ${batch.receipt.latestDate || 'Unknown'}`
    ]),
    summaryBox([
      `Destination: ${batch.localDestinationKey || 'Unknown local key'}`,
      `Family: ${batch.destinationFamily}`,
      `Counts: ${batch.receipt.destinationBeforeCount ?? '—'} → ${batch.receipt.destinationAfterCount ?? '—'}`,
      `Continuity: ${continuityLabel(batch.continuity.state)}`
    ])
  );
  const lineage = element('article', 'card receipt-lineage-card');
  lineage.append(element('h4', '', 'Batch lineage'));
  lineage.append(summaryBox([
    batch.continuity.detail,
    `Predecessor: ${batch.continuity.predecessorBatchId || 'None retained'}`,
    `Successor: ${batch.continuity.successorBatchId || 'None retained'}`,
    `Repeated local source detected: ${batch.repeatedSource ? 'Yes; review intentional reuse' : 'No'}`
  ]));
  const dryRun = element('article', 'card receipt-dry-run-lineage');
  dryRun.append(element('h4', '', 'Dry-run readiness lineage'));
  dryRun.append(summaryBox(batch.dryRun.linked ? [
    `State: ${dryRunLabel(batch)}`,
    `Prepared: ${batch.dryRun.createdAt || 'Unknown'}`,
    `Linked: ${batch.dryRun.linkedAt || 'Unknown'}`,
    `Rows: ${batch.dryRun.normalizedRowCount ?? '—'} normalized · ${batch.dryRun.wouldInsert ?? '—'} would insert · ${batch.dryRun.wouldSkip ?? '—'} would skip`,
    `Validation: ${batch.dryRun.validationErrorCount ?? '—'} errors · ${batch.dryRun.validationWarningCount ?? '—'} warnings`
  ] : [
    'No verified v121 dry-run link is retained for this receipt.',
    'Older imports and imports completed without Prepare Dry Run remain valid.',
    'v121 does not backfill or infer a dry-run link after the fact.'
  ]));
  section.append(titleRow, overview, lineage, dryRun, checksTable(batch), rollbackCard(batch));
  return section;
}

function timelineCard(root = document) {
  return [...root.querySelectorAll('article.card')].find((card) => {
    const heading = card.querySelector('h3')?.textContent?.trim();
    return heading === 'Import receipts' || heading === 'Import receipt audit'
      || heading === 'Import batch timeline' || card.classList.contains('receipt-timeline-card');
  }) || null;
}

function renderTimelineCard(card) {
  const timeline = currentTimeline();
  const visible = filterReceiptTimeline(timeline, filters);
  if (!timeline.batches.some((batch) => batchKey(batch) === selectedBatchKey)) {
    selectedBatchKey = visible[0] ? batchKey(visible[0]) : timeline.batches[0] ? batchKey(timeline.batches[0]) : '';
  }
  const selected = findSelected(timeline, visible);
  card.dataset.v120ReceiptAudit = 'true';
  card.dataset.v121ReceiptTimeline = 'true';
  card.classList.add('receipt-timeline-card');
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h3', '', 'Import batch timeline'),
    element('p', '', 'Filter retained receipts, verify receipt-to-receipt count continuity, and review optional metadata-only dry-run lineage. Existing receipts remain authoritative.')
  );
  const actions = element('div', 'button-row');
  const download = element('button', 'btn secondary', 'Download Full Timeline');
  download.type = 'button';
  download.id = 'downloadReceiptTimeline';
  actions.append(download);
  titleRow.append(title, actions);
  const metrics = element('div', 'import-summary-grid receipt-timeline-summary');
  metrics.append(
    metric(timeline.summary.batches, 'Retained batches'),
    metric(timeline.summary.verified, 'Verified'),
    metric(timeline.summary.needsReview, 'Needs review'),
    metric(timeline.summary.linkedDryRuns, 'Dry runs linked'),
    metric(timeline.summary.lineageBreaks, 'Continuity breaks')
  );
  card.replaceChildren(titleRow, metrics, filterControls(timeline));
  const result = element('p', 'muted-note', `Showing ${visible.length} of ${timeline.summary.batches} retained batch${timeline.summary.batches === 1 ? '' : 'es'}. ${timeline.summary.orphanLinks} orphan dry-run link${timeline.summary.orphanLinks === 1 ? '' : 's'} retained.`);
  card.append(result);
  if (!visible.length) {
    card.append(element('div', 'note warning-note', timeline.summary.batches
      ? 'No retained receipt matches the current filters.'
      : 'No duplicate-safe imports have been recorded in this browser.'));
    return;
  }
  card.append(timelineTable(visible));
  if (selected) card.append(detailView(selected));
  card.append(element('p', 'muted-note', 'Timeline downloads exclude transaction rows, source filenames, source fingerprints, mappings, destination storage keys, account identifiers, merchant names, and vault contents.'));
}

export function enhanceReceiptTimeline(page) {
  const card = timelineCard(page);
  if (!card || card.dataset.v121ReceiptTimeline === 'true') return false;
  renderTimelineCard(card);
  return true;
}

function refreshTimelineCard() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    const card = document.querySelector('.receipt-timeline-card');
    if (card) renderTimelineCard(card);
  });
}

function selectedBatch() {
  const timeline = currentTimeline();
  return findSelected(timeline, filterReceiptTimeline(timeline, filters));
}

function oneBatchTimeline(batch) {
  return {
    generatedAt: new Date().toISOString(),
    batches: [batch],
    orphanLinks: [],
    summary: {
      batches: 1,
      verified: batch.status === 'verified' ? 1 : 0,
      verifiedWithNotes: batch.status === 'verified-with-notes' ? 1 : 0,
      needsReview: batch.status === 'needs-review' ? 1 : 0,
      inserted: batch.outcome === 'inserted' ? 1 : 0,
      noChange: batch.outcome === 'no-change' ? 1 : 0,
      linkedDryRuns: batch.dryRun.linked ? 1 : 0,
      lineageBreaks: batch.continuity.filterState === 'break' ? 1 : 0,
      legacyContinuity: batch.continuity.filterState === 'legacy' ? 1 : 0,
      repeatedSources: batch.repeatedSource ? 1 : 0,
      orphanLinks: 0,
      destinationFamilies: 1
    }
  };
}

async function copyBatchSummary(batch) {
  const lines = [
    'Gringotts v121 import batch summary',
    `Receipt: ${batch.receipt.importId}`,
    `Imported: ${batch.receipt.timestamp || 'Unknown'}`,
    `Integrity: ${statusLabel(batch.status)}`,
    `Result: ${outcomeLabel(batch.outcome)}`,
    `Counts: ${batch.receipt.destinationBeforeCount ?? '—'} → ${batch.receipt.destinationAfterCount ?? '—'}`,
    `Lineage: ${continuityLabel(batch.continuity.state)} — ${batch.continuity.detail}`,
    `Dry run: ${dryRunLabel(batch)}`,
    'No automatic rollback, receipt repair, or transaction change was performed.'
  ];
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is not available in this browser.');
  await navigator.clipboard.writeText(lines.join('\n'));
}

function installUiHandlers() {
  document.addEventListener('change', (event) => {
    const control = event.target.closest?.('[data-v121-filter]');
    if (!control) return;
    filters[control.dataset.v121Filter] = control.value;
    refreshTimelineCard();
  });
  document.addEventListener('input', (event) => {
    const input = event.target.closest?.('[data-v121-filter-query]');
    if (!input) return;
    clearTimeout(queryTimer);
    queryTimer = setTimeout(() => {
      filters.query = input.value;
      refreshTimelineCard();
    }, 160);
  });
  document.addEventListener('click', (event) => {
    const select = event.target.closest?.('[data-v121-batch-select]');
    if (select) {
      event.preventDefault();
      selectedBatchKey = select.dataset.v121BatchSelect || '';
      const card = select.closest('.receipt-timeline-card');
      if (card) renderTimelineCard(card);
      document.getElementById('receiptTimelineDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (event.target.closest?.('#clearReceiptTimelineFilters')) {
      event.preventDefault();
      Object.assign(filters, { status: 'all', result: 'all', lineage: 'all', dryRun: 'all', destination: 'all', query: '' });
      refreshTimelineCard();
      return;
    }
    if (event.target.closest?.('#downloadReceiptTimeline')) {
      event.preventDefault();
      downloadJson(`Gringotts_v121_import_receipt_timeline_${stamp()}.json`, buildReceiptTimelinePackage(currentTimeline()));
      announce('Sanitized import receipt timeline downloaded');
      return;
    }
    const batch = selectedBatch();
    if (!batch) return;
    if (event.target.closest?.('#downloadSelectedReceiptBatch')) {
      event.preventDefault();
      downloadJson(`Gringotts_v121_import_batch_${stamp()}.json`, buildReceiptTimelinePackage(oneBatchTimeline(batch)));
      announce('Sanitized selected batch audit downloaded');
      return;
    }
    if (event.target.closest?.('#copyReceiptBatchSummary')) {
      event.preventDefault();
      copyBatchSummary(batch)
        .then(() => announce('Batch summary copied'))
        .catch((error) => announce(error?.message || 'Batch summary could not be copied'));
      return;
    }
    if (event.target.closest?.('#openReceiptTimelineRestore')) {
      event.preventDefault();
      const button = document.querySelector('[data-v116-import-task="restore"]');
      if (button) button.click();
      else announce('Open Tools → Import & Restore and choose Restore full vault');
    }
  });
  window.addEventListener('gringotts:batch-index-changed', refreshTimelineCard);
}

export function installReceiptIntegrityFeatures() {
  installEarlyCaptureHandlers();
  installUiHandlers();
  const registry = window.GringottsV121 || (window.GringottsV121 = {});
  Object.assign(registry, {
    receiptIntegrityReady: true,
    enhanceReceiptTimeline,
    buildReceiptTimeline: currentTimeline,
    batchIndexCount: () => readBatchIndex().links.length,
    stagedDryRunReady: () => Boolean(currentStagedDryRun())
  });
  return registry;
}
