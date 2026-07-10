import { downloadJson, stamp, vaults } from '../v103/core.js';
import {
  auditImportReceipt, buildReceiptAuditPackage, summarizeReceiptAudits
} from './import-receipt-audit-model.js';

let selectedReceiptId = '';
let handlersInstalled = false;

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
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function importHistory() {
  const reader = window.GringottsV115?.importHistory;
  return typeof reader === 'function' ? reader() : [];
}

function currentDestinationCounts() {
  return Object.fromEntries(vaults()
    .filter((candidate) => candidate?.status === 'readable' && candidate?.key)
    .map((candidate) => [candidate.key, candidate.transactions]));
}

function localSourceLabel(receipt) {
  const name = String(receipt.sourceFilename || '').trim() || 'Selected bank export';
  const fingerprint = String(receipt.sourceFingerprint || '').trim();
  return fingerprint ? `${name} · ${fingerprint.slice(0, 16)}…` : name;
}

function auditLabel(status) {
  if (status === 'verified') return 'Verified';
  if (status === 'verified-with-notes') return 'Verified with notes';
  return 'Needs review';
}

function statusClass(status) {
  return status === 'verified' ? 'good-note'
    : status === 'verified-with-notes' ? 'warning-note'
      : 'risk-note';
}

function summaryMetric(value, label) {
  const card = element('article', 'kpi receipt-audit-kpi');
  card.append(element('strong', '', Number(value || 0).toLocaleString()), element('span', '', label));
  return card;
}

function createHeader(summary) {
  const row = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h3', '', 'Import receipt audit'),
    element('p', '', 'Review retained import metadata, count arithmetic, backup expectations, and manual rollback guidance. No transaction rows are stored here.')
  );
  row.append(intro, element('div', 'section-meta', `${summary.count} receipt${summary.count === 1 ? '' : 's'}`));
  return row;
}

function createSummary(summary) {
  const grid = element('div', 'import-summary-grid receipt-audit-summary');
  grid.append(
    summaryMetric(summary.verified, 'Verified'),
    summaryMetric(summary.verifiedWithNotes, 'Verified with notes'),
    summaryMetric(summary.needsReview, 'Needs review'),
    summaryMetric(summary.backupExpected, 'Backup expected')
  );
  return grid;
}

function addCell(row, value, className = '') {
  row.append(element('td', className, value));
}

function createReceiptTable(summary) {
  const wrap = element('div', 'table-wrap receipt-audit-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Import receipt audit list');
  const table = element('table', 'ledger import-table receipt-audit-table');
  const head = element('thead');
  const headerRow = element('tr');
  ['Imported', 'Source metadata', 'Counts', 'Verification', 'Current audit', 'Review'].forEach((label) => headerRow.append(element('th', '', label)));
  head.append(headerRow);
  const body = element('tbody');

  summary.audits.forEach((audit) => {
    const receipt = audit.receipt;
    const row = element('tr');
    const timestamp = Number.isFinite(Date.parse(receipt.timestamp)) ? new Date(receipt.timestamp).toLocaleString() : 'Unknown time';
    addCell(row, timestamp);
    addCell(row, `${localSourceLabel(receipt)}\n${String(receipt.format || 'unknown').toUpperCase()} · ${receipt.detectedSchema}`);
    addCell(row, `${receipt.transactionCount ?? '—'} incoming\n${receipt.insertedCount ?? '—'} inserted · ${receipt.skippedCount ?? '—'} skipped\n${receipt.destinationBeforeCount ?? '—'} → ${receipt.destinationAfterCount ?? '—'}`);
    addCell(row, receipt.verificationResult);
    const statusCell = element('td');
    statusCell.append(element('span', `note compact-note ${statusClass(audit.status)}`, auditLabel(audit.status)));
    row.append(statusCell);
    const actionCell = element('td');
    const button = element('button', 'btn secondary compact-button', 'Review');
    button.type = 'button';
    button.dataset.receiptAuditSelect = receipt.importId;
    button.setAttribute('aria-label', `Review import receipt from ${timestamp}`);
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

function createChecks(audit) {
  const article = element('article', 'card receipt-audit-checks');
  article.append(element('h4', '', 'Receipt integrity checks'));
  const wrap = element('div', 'table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Receipt integrity checks');
  const table = element('table', 'ledger');
  const head = element('thead');
  const headRow = element('tr');
  ['Check', 'Status', 'Detail'].forEach((label) => headRow.append(element('th', '', label)));
  head.append(headRow);
  const body = element('tbody');
  audit.checks.forEach((check) => {
    const row = element('tr');
    addCell(row, check.label);
    addCell(row, check.status === 'pass' ? 'Pass' : check.status === 'warn' ? 'Review note' : 'Failed');
    addCell(row, check.detail);
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table);
  article.append(wrap);
  return article;
}

function createRollback(audit) {
  const article = element('article', 'card warning-card receipt-rollback-guidance');
  const row = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h4', '', 'Backup and manual rollback guidance'),
    element('p', '', 'No automatic rollback is available. Receipt review never restores, deletes, or rewrites transactions; full restore remains a separate confirmed workflow.')
  );
  row.append(intro, element('div', 'section-meta', audit.backup.expected ? 'Pre-import backup expected' : 'No-change receipt'));
  article.append(row);

  const backup = audit.backup.expected
    ? [
        `Expected backup filename: ${audit.backup.filenamePattern || 'Unknown'}`,
        `Expected pre-import transaction count: ${audit.backup.expectedTransactionCount ?? 'Unknown'}`,
        'Backup location is not stored or scanned automatically.'
      ]
    : [
        'This receipt reports no inserted rows.',
        'The guarded writer did not require a pre-import backup for a verified no-change record.',
        'No rollback should be needed because the receipt indicates no transaction write.'
      ];
  article.append(summaryBox(backup));

  const list = element('ol', 'action-list receipt-rollback-steps');
  audit.rollback.steps.forEach((step) => list.append(element('li', '', step)));
  article.append(list);
  article.append(element('div', 'note risk-note', 'Do not restore merely because the current vault count differs. Later household activity can legitimately change the count. Validate the backup and the reason for rollback first.'));

  const buttons = element('div', 'button-row');
  const download = element('button', 'btn secondary', 'Download Selected Audit');
  download.type = 'button';
  download.id = 'downloadReceiptAudit';
  const copy = element('button', 'btn secondary', 'Copy Rollback Checklist');
  copy.type = 'button';
  copy.id = 'copyReceiptRollback';
  const restore = element('button', 'btn primary', 'Open Restore Task');
  restore.type = 'button';
  restore.id = 'openReceiptRestore';
  buttons.append(download, copy, restore);
  article.append(buttons);
  return article;
}

function createDetail(audit) {
  const section = element('section', 'receipt-audit-detail');
  section.id = 'importReceiptAuditDetail';
  section.setAttribute('aria-live', 'polite');
  const receipt = audit.receipt;
  const timestamp = Number.isFinite(Date.parse(receipt.timestamp)) ? new Date(receipt.timestamp).toLocaleString() : 'Unknown time';
  const row = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h4', '', `Receipt audit · ${timestamp}`),
    element('p', '', 'The source filename and fingerprint remain visible only in this local browser view and are excluded from the downloadable audit package.')
  );
  row.append(intro, element('div', `note compact-note ${statusClass(audit.status)}`, auditLabel(audit.status)));
  section.append(row);

  const grid = element('div', 'grid two receipt-audit-overview');
  grid.append(
    summaryBox([
      `Source: ${localSourceLabel(receipt)}`,
      `Format: ${String(receipt.format || 'unknown').toUpperCase()}`,
      `Schema: ${receipt.detectedSchema}`,
      `Coverage: ${receipt.earliestDate || 'Unknown'} through ${receipt.latestDate || 'Unknown'}`
    ]),
    summaryBox([
      `Incoming: ${receipt.transactionCount ?? 'Unknown'}`,
      `Inserted: ${receipt.insertedCount ?? 'Unknown'}`,
      `Skipped: ${receipt.skippedCount ?? 'Unknown'}`,
      `Destination: ${receipt.destinationBeforeCount ?? 'Unknown'} → ${receipt.destinationAfterCount ?? 'Unknown'}`
    ])
  );
  section.append(grid, createChecks(audit), createRollback(audit));
  section.append(element('p', 'muted-note', 'Downloaded audits include counts, format/schema metadata, checks, and guidance only. They exclude source filenames, fingerprints, mappings, destination storage keys, account identifiers, merchant names, transaction rows, and vault contents.'));
  return section;
}

function findAudit(summary, receiptId) {
  return summary.audits.find((audit) => audit.receipt.importId === receiptId) || summary.audits[0] || null;
}

function renderReceiptAuditCard(card) {
  const receipts = importHistory();
  const summary = summarizeReceiptAudits(receipts, currentDestinationCounts());
  if (!summary.audits.some((audit) => audit.receipt.importId === selectedReceiptId)) {
    selectedReceiptId = summary.audits[0]?.receipt.importId || '';
  }
  card.dataset.v120ReceiptAudit = 'true';
  card.classList.add('receipt-audit-card');
  card.replaceChildren(createHeader(summary), createSummary(summary));
  if (!summary.count) {
    card.append(element('p', '', 'No duplicate-safe imports have been recorded in this browser. A receipt appears only after a verified import or reviewed no-change result.'));
    return;
  }
  card.append(createReceiptTable(summary));
  const selected = findAudit(summary, selectedReceiptId);
  if (selected) card.append(createDetail(selected));
}

function receiptCard(page = document) {
  return [...page.querySelectorAll('article.card')]
    .find((card) => card.querySelector('h3')?.textContent?.trim() === 'Import receipts'
      || card.classList.contains('receipt-audit-card')) || null;
}

export function enhanceReceiptAudit(page) {
  const card = receiptCard(page);
  if (!card || card.dataset.v120ReceiptAudit === 'true') return false;
  renderReceiptAuditCard(card);
  return true;
}

function selectedAudit() {
  const summary = summarizeReceiptAudits(importHistory(), currentDestinationCounts());
  return findAudit(summary, selectedReceiptId);
}

async function copyRollbackChecklist(audit) {
  const text = [
    'Gringotts v120 manual rollback checklist',
    `Receipt: ${audit.receipt.importId}`,
    `Status: ${auditLabel(audit.status)}`,
    '',
    ...audit.rollback.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    'No automatic rollback was performed.'
  ].join('\n');
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is not available in this browser.');
  await navigator.clipboard.writeText(text);
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('click', (event) => {
    const select = event.target.closest?.('[data-receipt-audit-select]');
    if (select) {
      event.preventDefault();
      selectedReceiptId = select.dataset.receiptAuditSelect || '';
      const card = select.closest('.receipt-audit-card');
      if (card) renderReceiptAuditCard(card);
      document.getElementById('importReceiptAuditDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const audit = selectedAudit();
    if (!audit) return;
    if (event.target.closest?.('#downloadReceiptAudit')) {
      event.preventDefault();
      const payload = buildReceiptAuditPackage(audit);
      downloadJson(`Gringotts_v120_import_receipt_audit_${stamp()}.json`, payload);
      announce('Sanitized receipt audit downloaded');
      return;
    }
    if (event.target.closest?.('#copyReceiptRollback')) {
      event.preventDefault();
      copyRollbackChecklist(audit)
        .then(() => announce('Manual rollback checklist copied'))
        .catch((error) => announce(error?.message || 'Rollback checklist could not be copied'));
      return;
    }
    if (event.target.closest?.('#openReceiptRestore')) {
      event.preventDefault();
      const button = document.querySelector('[data-v116-import-task="restore"]');
      if (button) button.click();
      else announce('Open Tools → Import & Restore and choose Restore full vault');
    }
  });
}

export function installReceiptAuditFeatures() {
  installHandlers();
  const registry = window.GringottsV120 || (window.GringottsV120 = {});
  Object.assign(registry, {
    receiptAuditReady: true,
    enhanceReceiptAudit,
    auditImportReceipt,
    buildReceiptAuditPackage
  });
  return registry;
}
