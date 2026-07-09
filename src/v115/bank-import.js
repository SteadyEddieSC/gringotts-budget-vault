import {
  account, best, dte, downloadJson, invalidateVaultCache, num, read, save,
  stamp, txName, vaults
} from '../v103/core.js';
import {
  MAX_BANK_EXPORT_BYTES, inspectBankExportText, normalizeDelimitedExport
} from './parser.js';

export const IMPORT_HISTORY_KEY = 'gringottsImportHistory.v1';
const MAX_HISTORY = 40;
const DECISIONS = new Set(['keep', 'skip', 'defer']);
const clean = (value) => String(value ?? '').trim();
const normalizedText = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(?:pending|posted|purchase|payment|debit|credit|card|pos)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function emptySession() {
  return {
    fileName: '',
    fileSize: 0,
    encoding: '',
    sourceFingerprint: '',
    inspection: null,
    options: {
      mapping: {},
      dateOrder: 'auto',
      signMode: '',
      accountLabel: 'Imported account',
      accountMode: 'label',
      useSourceCategory: false
    },
    normalization: null,
    destinationKey: '',
    analysis: null,
    decisions: {},
    error: '',
    acknowledged: false,
    backupPrepared: false,
    backupTransactionCount: 0,
    result: null
  };
}

let session = emptySession();

function availableDestinationRecords() {
  return vaults().filter((candidate) => candidate.status === 'readable' && candidate.obj && candidate.transactions > 0);
}

function destinationRecord(key = session.destinationKey) {
  return availableDestinationRecords().find((candidate) => candidate.key === key) || null;
}

export function availableDestinations() {
  return availableDestinationRecords().map((candidate) => ({
    key: candidate.key,
    transactions: candidate.transactions,
    selected: candidate.key === session.destinationKey
  }));
}

function stableId(transaction) {
  for (const key of [
    'transaction_id', 'transactionId', 'id', 'source_transaction_id', 'sourceTransactionId',
    'external_id', 'externalId', 'fitid', 'FITID'
  ]) {
    const value = clean(transaction?.[key]);
    if (value) return value;
  }
  return '';
}

function sourceIdentifier(transaction) {
  for (const key of [
    'source_id', 'sourceId', 'institution_transaction_id', 'institutionTransactionId',
    'plaid_transaction_id', 'plaidTransactionId'
  ]) {
    const value = clean(transaction?.[key]);
    if (value) return value;
  }
  return '';
}

export function transactionFingerprint(transaction) {
  const amount = Number(transaction?.amount);
  return [
    dte(transaction),
    Number.isFinite(amount) ? amount.toFixed(4) : 'invalid',
    normalizedText(txName(transaction)),
    normalizedText(transaction?.account_id || transaction?.accountId || account(transaction)),
    normalizedText(sourceIdentifier(transaction))
  ].join('|');
}

function transactionSummary(transaction) {
  return {
    id: stableId(transaction) || 'No stable ID',
    date: dte(transaction) || 'No date',
    name: txName(transaction),
    amount: num(transaction?.amount),
    account: account(transaction) || 'No account',
    pending: transaction?.pending === true || String(transaction?.status || '').toLowerCase() === 'pending'
  };
}

function dateNumber(transaction) {
  const value = dte(transaction);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
  return Number.isFinite(parsed) ? parsed : NaN;
}

function tokenSimilarity(left, right) {
  const a = normalizedText(left);
  const b = normalizedText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aTokens = new Set(a.split(' '));
  const bTokens = new Set(b.split(' '));
  const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  const jaccard = union ? intersection / union : 0;
  const containment = a.includes(b) || b.includes(a) ? Math.min(a.length, b.length) / Math.max(a.length, b.length) : 0;
  return Math.max(jaccard, containment);
}

function fuzzyCandidate(incoming, existing, existingIndex) {
  const incomingAmount = Number(incoming?.amount);
  const existingAmount = Number(existing?.amount);
  if (!Number.isFinite(incomingAmount) || !Number.isFinite(existingAmount) || Math.abs(incomingAmount - existingAmount) > 0.005) return null;
  const incomingDate = dateNumber(incoming);
  const existingDate = dateNumber(existing);
  const days = Number.isFinite(incomingDate) && Number.isFinite(existingDate) ? Math.abs(incomingDate - existingDate) / 86_400_000 : Infinity;
  if (days > 3) return null;
  const similarity = tokenSimilarity(txName(incoming), txName(existing));
  if (similarity < 0.58) return null;
  const incomingAccount = normalizedText(incoming?.account_id || incoming?.accountId || account(incoming));
  const existingAccount = normalizedText(existing?.account_id || existing?.accountId || account(existing));
  const accountMatch = Boolean(incomingAccount && existingAccount && incomingAccount === existingAccount);
  if (incomingAccount && existingAccount && !accountMatch) return null;
  const incomingPending = transactionSummary(incoming).pending;
  const existingPending = transactionSummary(existing).pending;
  let score = 40;
  const reasons = ['same signed amount'];
  if (days === 0) { score += 20; reasons.push('same transaction date'); }
  else if (days === 1) { score += 14; reasons.push('adjacent transaction date'); }
  else { score += 8; reasons.push(`${days}-day date difference`); }
  if (similarity === 1) { score += 24; reasons.push('same normalized merchant'); }
  else if (similarity >= 0.8) { score += 18; reasons.push('very similar merchant'); }
  else { score += 12; reasons.push('similar merchant'); }
  if (accountMatch) { score += 10; reasons.push('same account'); }
  if (incomingPending !== existingPending) { score += 10; reasons.push('possible pending-to-posted transition'); }
  if (score < 70) return null;
  return {
    existingIndex,
    score,
    confidence: score >= 94 ? 'High' : score >= 82 ? 'Likely' : 'Possible',
    reasons,
    existing: transactionSummary(existing)
  };
}

function monthOf(transaction) {
  const date = dte(transaction);
  return /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : '';
}

function addMonth(value, offset) {
  const match = clean(value).match(/^(\d{4})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthsBetween(start, end) {
  if (!start || !end || start > end) return [];
  const result = [];
  let cursor = start;
  while (cursor && cursor <= end && result.length < 600) {
    result.push(cursor);
    cursor = addMonth(cursor, 1);
  }
  return result;
}

function dateRange(rows) {
  const dates = rows.map(dte).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
  return { earliest: dates[0] || '', latest: dates.at(-1) || '' };
}

function coverageSummary(incomingRows, existingRows) {
  const incoming = dateRange(incomingRows);
  const existing = dateRange(existingRows);
  const incomingMonths = [...new Set(incomingRows.map(monthOf).filter(Boolean))].sort();
  const existingMonths = [...new Set(existingRows.map(monthOf).filter(Boolean))].sort();
  const expectedIncoming = incomingMonths.length ? monthsBetween(incomingMonths[0], incomingMonths.at(-1)) : [];
  const missingIncomingMonths = expectedIncoming.filter((month) => !incomingMonths.includes(month));
  const overlapStart = incoming.earliest && existing.earliest ? [incoming.earliest, existing.earliest].sort().at(-1) : '';
  const overlapEnd = incoming.latest && existing.latest ? [incoming.latest, existing.latest].sort()[0] : '';
  const overlap = overlapStart && overlapEnd && overlapStart <= overlapEnd ? `${overlapStart} through ${overlapEnd}` : 'None';
  const warnings = [];
  if (missingIncomingMonths.length) warnings.push(`The selected file has no rows for ${missingIncomingMonths.join(', ')} inside its date span.`);
  if (existing.latest && incoming.earliest) {
    const priorMonth = existing.latest.slice(0, 7);
    const incomingMonth = incoming.earliest.slice(0, 7);
    const gap = monthsBetween(addMonth(priorMonth, 1), addMonth(incomingMonth, -1));
    if (priorMonth < incomingMonth && gap.length) warnings.push(`No imported coverage is represented between the current vault and this file for ${gap.join(', ')}.`);
  }
  if (existingMonths.length && incomingMonths.length && overlap === 'None' && incomingMonths.at(-1) < existingMonths[0]) {
    warnings.push('The incoming file ends before the current vault begins; confirm that this is the intended historical period.');
  }
  if (!warnings.length) warnings.push('No obvious month-level coverage gap was detected in the selected file.');
  return {
    incomingEarliest: incoming.earliest || 'Not available',
    incomingLatest: incoming.latest || 'Not available',
    existingEarliest: existing.earliest || 'Not available',
    existingLatest: existing.latest || 'Not available',
    overlap,
    missingIncomingMonths,
    warnings
  };
}

function validateTransactions(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Import blocked: no normalized transaction rows are available.');
  const invalidIndex = rows.findIndex((transaction) => {
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dte(transaction))) return true;
    if (!Number.isFinite(Number(transaction.amount))) return true;
    return !clean(txName(transaction));
  });
  if (invalidIndex >= 0) throw new Error(`Import blocked: normalized transaction ${invalidIndex + 1} needs a valid date, description, and numeric amount.`);
  return rows;
}

function normalizeDirectTransactions() {
  const rows = validateTransactions(session.inspection?.directTransactions);
  if (session.inspection.format === 'json') return rows.map((row) => ({ ...row }));
  const accountLabel = clean(session.options.accountLabel) || session.inspection.accountLabel || 'Imported account';
  return rows.map((row) => ({ ...row, account: accountLabel }));
}

function normalizeCurrent() {
  if (!session.inspection) return null;
  if (session.inspection.format === 'delimited') {
    return normalizeDelimitedExport(session.inspection, session.options);
  }
  try {
    return {
      transactions: normalizeDirectTransactions(),
      errors: [],
      warnings: [...(session.inspection.warnings || [])],
      mapping: {},
      signMode: session.inspection.format === 'json' ? 'source-preserved' : 'ofx-bank-standard',
      dateOrder: 'source-normalized'
    };
  } catch (error) {
    return { transactions: [], errors: [error?.message || 'Direct transaction normalization failed.'], warnings: [], mapping: {} };
  }
}

function analyzeRows(rows, destinationKey) {
  const incomingRows = validateTransactions(rows);
  const destination = destinationRecord(destinationKey);
  if (!destination) throw new Error('Select a populated readable destination vault before importing.');
  const existingRows = Array.isArray(destination.obj.transactions) ? destination.obj.transactions : [];
  if (!existingRows.length) throw new Error('Import requires a populated destination vault so a backup can be created first.');
  const existingIds = new Map();
  const existingFingerprints = new Map();
  existingRows.forEach((transaction, index) => {
    const id = stableId(transaction);
    if (id && !existingIds.has(id)) existingIds.set(id, index);
    const fingerprint = transactionFingerprint(transaction);
    if (!existingFingerprints.has(fingerprint)) existingFingerprints.set(fingerprint, index);
  });
  const seenIds = new Map();
  const seenFingerprints = new Map();
  const exact = [];
  const fuzzy = [];
  const fresh = [];
  incomingRows.forEach((transaction, incomingIndex) => {
    const id = stableId(transaction);
    const fingerprint = transactionFingerprint(transaction);
    let exactMatch = null;
    if (id && existingIds.has(id)) exactMatch = { source: 'current vault', existingIndex: existingIds.get(id), reason: 'matching stable transaction ID' };
    else if (id && seenIds.has(id)) exactMatch = { source: 'selected file', existingIndex: seenIds.get(id), reason: 'repeated stable transaction ID inside the selected file' };
    else if (!id && existingFingerprints.has(fingerprint)) exactMatch = { source: 'current vault', existingIndex: existingFingerprints.get(fingerprint), reason: 'matching deterministic date/amount/merchant/account fingerprint' };
    else if (!id && seenFingerprints.has(fingerprint)) exactMatch = { source: 'selected file', existingIndex: seenFingerprints.get(fingerprint), reason: 'repeated deterministic fingerprint inside the selected file' };
    if (exactMatch) {
      const comparison = exactMatch.source === 'current vault' ? existingRows[exactMatch.existingIndex] : incomingRows[exactMatch.existingIndex];
      exact.push({ incomingIndex, reason: exactMatch.reason, source: exactMatch.source, incoming: transactionSummary(transaction), existing: transactionSummary(comparison) });
    } else {
      let bestCandidate = null;
      existingRows.forEach((existing, existingIndex) => {
        const candidate = fuzzyCandidate(transaction, existing, existingIndex);
        if (candidate && (!bestCandidate || candidate.score > bestCandidate.score)) bestCandidate = candidate;
      });
      if (bestCandidate) fuzzy.push({ incomingIndex, incoming: transactionSummary(transaction), ...bestCandidate });
      else fresh.push({ incomingIndex, incoming: transactionSummary(transaction) });
    }
    if (id && !seenIds.has(id)) seenIds.set(id, incomingIndex);
    if (!seenFingerprints.has(fingerprint)) seenFingerprints.set(fingerprint, incomingIndex);
  });
  return {
    source: session.inspection.institution || session.inspection.schema?.label || 'Bank export',
    incomingCount: incomingRows.length,
    destinationKey: destination.key,
    destinationTransactions: existingRows.length,
    exact,
    fuzzy,
    fresh,
    coverage: coverageSummary(incomingRows, existingRows)
  };
}

async function hashBytes(bytes) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  } catch {
    let hash = 2166136261;
    const values = new Uint8Array(bytes);
    for (const value of values) { hash ^= value; hash = Math.imul(hash, 16777619); }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }
}

function decodeBuffer(buffer) {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(buffer), encoding: 'UTF-8' };
  } catch {
    try {
      return { text: new TextDecoder('windows-1252').decode(buffer), encoding: 'Windows-1252 fallback' };
    } catch {
      throw new Error('The file could not be decoded as UTF-8 or Windows-1252 text.');
    }
  }
}

function resetWriteState() {
  session.analysis = null;
  session.decisions = {};
  session.acknowledged = false;
  session.backupPrepared = false;
  session.backupTransactionCount = 0;
  session.result = null;
}

export async function selectBankExportFile(file, notify = () => {}, rerender = () => {}) {
  const destinationKey = session.destinationKey || best()?.key || '';
  session = { ...emptySession(), destinationKey };
  if (!file) { rerender(); return; }
  try {
    if (file.size > MAX_BANK_EXPORT_BYTES) throw new Error(`Import blocked: file exceeds the ${Math.round(MAX_BANK_EXPORT_BYTES / 1024 / 1024)} MB local safety limit.`);
    const buffer = await file.arrayBuffer();
    const decoded = decodeBuffer(buffer);
    const inspection = inspectBankExportText({ fileName: file.name, text: decoded.text, sizeBytes: file.size });
    const destination = destinationRecord(destinationKey) || availableDestinationRecords()[0];
    if (!destination) throw new Error('No populated readable destination vault is available. Use guarded restore for the first populated vault.');
    session.fileName = file.name || 'Selected bank export';
    session.fileSize = file.size;
    session.encoding = decoded.encoding;
    session.sourceFingerprint = await hashBytes(buffer);
    session.inspection = inspection;
    session.destinationKey = destination.key;
    session.options.mapping = { ...(inspection.defaultMapping || {}) };
    session.options.accountLabel = inspection.accountLabel || 'Imported account';
    session.options.signMode = inspection.format === 'delimited' && (inspection.defaultMapping?.debit || inspection.defaultMapping?.credit) ? 'separate' : '';
    session.normalization = normalizeCurrent();
    if (decoded.encoding !== 'UTF-8') session.normalization.warnings.push('The file required Windows-1252 decoding; review accented and special characters carefully.');
    notify(`${inspection.format.toUpperCase()} inspection ready`);
  } catch (error) {
    session.error = error?.message || 'The selected bank export could not be inspected.';
    notify(session.error);
  }
  rerender();
}

export function updateBankMapping(field, header) {
  if (!session.inspection || session.inspection.format !== 'delimited') return false;
  const allowed = new Set(session.inspection.headers);
  const value = clean(header);
  if (value && !allowed.has(value)) return false;
  session.options.mapping[field] = value;
  session.normalization = normalizeCurrent();
  resetWriteState();
  return true;
}

export function updateBankOption(name, value) {
  if (!session.inspection) return false;
  if (name === 'useSourceCategory') session.options.useSourceCategory = Boolean(value);
  else if (['dateOrder', 'signMode', 'accountLabel', 'accountMode'].includes(name)) session.options[name] = clean(value);
  else return false;
  session.normalization = normalizeCurrent();
  resetWriteState();
  return true;
}

export function prepareDuplicateReview(notify = () => {}, rerender = () => {}) {
  if (!session.inspection) { notify('Choose and inspect a supported export first'); return false; }
  session.normalization = normalizeCurrent();
  if (session.normalization.errors.length) {
    notify(`Resolve ${session.normalization.errors.length} normalization issue${session.normalization.errors.length === 1 ? '' : 's'} first`);
    rerender();
    return false;
  }
  try {
    session.analysis = analyzeRows(session.normalization.transactions, session.destinationKey);
    session.decisions = Object.fromEntries(session.analysis.fuzzy.map((item) => [item.incomingIndex, 'defer']));
    session.acknowledged = false;
    session.backupPrepared = false;
    session.backupTransactionCount = 0;
    session.result = null;
    session.error = '';
    notify('Duplicate and overlap review ready');
    rerender();
    return true;
  } catch (error) {
    session.error = error?.message || 'Duplicate review could not be prepared.';
    notify(session.error);
    rerender();
    return false;
  }
}

export function setImportDestination(key) {
  const destination = destinationRecord(clean(key));
  if (!destination) return false;
  session.destinationKey = destination.key;
  if (session.normalization?.transactions?.length && !session.normalization.errors.length) {
    try {
      session.analysis = analyzeRows(session.normalization.transactions, session.destinationKey);
      session.decisions = Object.fromEntries(session.analysis.fuzzy.map((item) => [item.incomingIndex, 'defer']));
      session.error = '';
    } catch (error) {
      session.analysis = null;
      session.error = error?.message || 'Destination analysis failed.';
    }
  }
  session.acknowledged = false;
  session.backupPrepared = false;
  session.backupTransactionCount = 0;
  session.result = null;
  return !session.error;
}

export function setFuzzyDecision(incomingIndex, decision) {
  const index = Number(incomingIndex);
  const normalized = clean(decision).toLowerCase();
  if (!DECISIONS.has(normalized) || !session.analysis?.fuzzy.some((item) => item.incomingIndex === index)) return false;
  session.decisions[index] = normalized;
  session.acknowledged = false;
  session.result = null;
  return true;
}

export function setImportAcknowledged(value) {
  session.acknowledged = Boolean(value);
}

export function clearBankImportSession() {
  session = { ...emptySession(), destinationKey: best()?.key || '' };
}

export function importHistory() {
  const stored = read(IMPORT_HISTORY_KEY, { imports: [] });
  return Array.isArray(stored?.imports) ? stored.imports.filter((entry) => entry && typeof entry === 'object') : [];
}

function counts() {
  const exact = session.analysis?.exact.length || 0;
  const fuzzy = session.analysis?.fuzzy.length || 0;
  const fresh = session.analysis?.fresh.length || 0;
  const fuzzyKeep = session.analysis?.fuzzy.filter((item) => session.decisions[item.incomingIndex] === 'keep').length || 0;
  const fuzzySkip = session.analysis?.fuzzy.filter((item) => session.decisions[item.incomingIndex] === 'skip').length || 0;
  const unresolved = session.analysis?.fuzzy.filter((item) => !session.decisions[item.incomingIndex] || session.decisions[item.incomingIndex] === 'defer').length || 0;
  return { exact, fuzzy, fresh, fuzzyKeep, fuzzySkip, unresolved, inserted: fresh + fuzzyKeep, skipped: exact + fuzzySkip };
}

function selectedRows() {
  if (!session.analysis || !session.normalization?.transactions) return [];
  const exactIndices = new Set(session.analysis.exact.map((item) => item.incomingIndex));
  const fuzzyByIndex = new Map(session.analysis.fuzzy.map((item) => [item.incomingIndex, session.decisions[item.incomingIndex] || 'defer']));
  return session.normalization.transactions.filter((transaction, index) => {
    if (exactIndices.has(index)) return false;
    if (!fuzzyByIndex.has(index)) return true;
    return fuzzyByIndex.get(index) === 'keep';
  });
}

export function snapshot() {
  const summary = counts();
  const inspected = Boolean(session.inspection && !session.error);
  const normalized = Boolean(session.normalization?.transactions?.length && !session.normalization?.errors?.length);
  const valid = Boolean(normalized && session.analysis && !session.error);
  const noChange = valid && summary.inserted === 0 && summary.unresolved === 0;
  const ready = valid && session.acknowledged && summary.unresolved === 0 && (noChange || session.backupPrepared);
  const mappedHeaders = new Set(Object.values(session.options.mapping || {}).filter(Boolean));
  return {
    fileName: session.fileName,
    fileSize: session.fileSize,
    encoding: session.encoding,
    sourceFingerprint: session.sourceFingerprint,
    inspection: session.inspection,
    options: { ...session.options, mapping: { ...session.options.mapping } },
    normalization: session.normalization,
    destinationKey: session.destinationKey,
    analysis: session.analysis,
    decisions: { ...session.decisions },
    error: session.error,
    acknowledged: session.acknowledged,
    backupPrepared: session.backupPrepared,
    backupTransactionCount: session.backupTransactionCount,
    result: session.result,
    inspected,
    normalized,
    valid,
    ready,
    counts: summary,
    destinations: availableDestinations(),
    ignoredColumns: session.inspection?.headers?.filter((header) => !mappedHeaders.has(header)) || [],
    history: importHistory()
  };
}

export function prepareImportBackup(notify = () => {}) {
  const destination = destinationRecord();
  if (!session.analysis || !destination?.obj || destination.transactions < 1) {
    notify('Prepare duplicate review and select a populated destination first');
    return false;
  }
  downloadJson(`Gringotts_v115_pre_import_${destination.transactions}_${stamp()}.json`, destination.obj);
  session.backupPrepared = true;
  session.backupTransactionCount = destination.transactions;
  session.acknowledged = false;
  notify('Verified pre-import backup downloaded');
  return true;
}

function verificationToken(transaction) {
  const id = stableId(transaction);
  return id ? `id:${id}` : `fingerprint:${transactionFingerprint(transaction)}`;
}

function tokenCounts(rows) {
  const map = new Map();
  rows.forEach((transaction) => {
    const token = verificationToken(transaction);
    map.set(token, (map.get(token) || 0) + 1);
  });
  return map;
}

function mappingSummary() {
  if (session.inspection?.format !== 'delimited') return session.inspection?.schema?.label || '';
  return Object.entries(session.options.mapping)
    .filter(([, value]) => value)
    .map(([field, value]) => `${field}:${value}`)
    .join('; ')
    .slice(0, 1000);
}

function historyEntry({ inserted, skipped, result, beforeCount, afterCount }) {
  const coverage = session.analysis.coverage;
  return {
    importId: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    sourceFilename: session.fileName || 'Selected bank export',
    sourceFingerprint: session.sourceFingerprint,
    source: session.analysis.source,
    format: session.inspection?.format || 'unknown',
    detectedSchema: session.inspection?.schema?.label || 'Unknown',
    schemaConfidence: session.inspection?.schema?.confidence || 'unknown',
    encoding: session.encoding,
    mappingSummary: mappingSummary(),
    signMode: session.normalization?.signMode || '',
    dateOrder: session.normalization?.dateOrder || '',
    warningCount: (session.normalization?.warnings || []).length + (coverage.warnings || []).length,
    transactionCount: session.analysis.incomingCount,
    earliestDate: coverage.incomingEarliest,
    latestDate: coverage.incomingLatest,
    exactDuplicates: session.analysis.exact.length,
    fuzzyCandidates: session.analysis.fuzzy.length,
    insertedCount: inserted,
    skippedCount: skipped,
    selectedDestinationVault: session.destinationKey,
    destinationBeforeCount: beforeCount,
    destinationAfterCount: afterCount,
    verificationResult: result
  };
}

function saveHistory(entry) {
  const history = importHistory();
  save(IMPORT_HISTORY_KEY, { imports: [entry, ...history].slice(0, MAX_HISTORY), updatedAt: new Date().toISOString() });
}

export function executeImport(notify = () => {}, rerender = () => {}) {
  const state = snapshot();
  if (!state.valid) { notify('Inspect, normalize, and review a valid export first'); return false; }
  if (state.counts.unresolved) { notify('Resolve every fuzzy duplicate candidate before importing'); return false; }
  if (!state.acknowledged) { notify('Acknowledge the mapping, sign, coverage, and duplicate review first'); return false; }
  if (state.counts.inserted > 0 && !state.backupPrepared) { notify('Download the populated destination backup before importing'); return false; }
  const destination = destinationRecord();
  if (!destination?.obj || destination.transactions < 1) { notify('The populated destination vault is no longer available'); return false; }
  const incomingRows = selectedRows();
  const beforeRows = Array.isArray(destination.obj.transactions) ? destination.obj.transactions : [];
  const expectedAfter = beforeRows.length + incomingRows.length;
  const confirmation = incomingRows.length
    ? `Confirm local bank export import\n\nFormat: ${(session.inspection?.format || '').toUpperCase()}\nSchema: ${session.inspection?.schema?.label || 'Unknown'}\nDestination: ${destination.key}\nCurrent rows: ${beforeRows.length}\nInsert rows: ${incomingRows.length}\nExact/fuzzy skipped: ${state.counts.skipped}\nExpected rows after import: ${expectedAfter}\n\nOnly normalized reviewed rows are written. Continue?`
    : `No new rows remain after duplicate reconciliation.\n\nRecord this reviewed no-change import in local metadata history?`;
  if (!window.confirm(confirmation)) { notify('Import canceled; no vault data changed'); return false; }
  if (!incomingRows.length) {
    const entry = historyEntry({ inserted: 0, skipped: state.counts.skipped, result: 'verified-no-change', beforeCount: beforeRows.length, afterCount: beforeRows.length });
    saveHistory(entry);
    session.result = entry;
    session.acknowledged = false;
    notify('No new rows were written; reviewed import recorded');
    rerender();
    return true;
  }
  const previousRaw = localStorage.getItem(destination.key);
  const beforeTokens = tokenCounts(beforeRows);
  const expectedIncreases = tokenCounts(incomingRows);
  const now = new Date().toISOString();
  const merged = {
    ...destination.obj,
    transactions: [...beforeRows, ...incomingRows],
    storageKey: destination.key,
    lastSavedAt: now,
    lastImportAt: now
  };
  if (!Array.isArray(merged.transactions) || merged.transactions.length < 1) {
    notify('Import blocked because the prepared vault is empty');
    return false;
  }
  try {
    localStorage.setItem(destination.key, JSON.stringify(merged));
    const verified = JSON.parse(localStorage.getItem(destination.key) || 'null');
    if (!verified || !Array.isArray(verified.transactions) || verified.transactions.length !== expectedAfter) throw new Error('Import verification failed: transaction count mismatch.');
    const afterTokens = tokenCounts(verified.transactions);
    for (const [token, increase] of expectedIncreases) {
      const before = beforeTokens.get(token) || 0;
      const after = afterTokens.get(token) || 0;
      if (after < before + increase) throw new Error('Import verification failed: an expected inserted transaction was not found.');
    }
    invalidateVaultCache();
    const entry = historyEntry({ inserted: incomingRows.length, skipped: state.counts.skipped, result: 'verified', beforeCount: beforeRows.length, afterCount: verified.transactions.length });
    saveHistory(entry);
    session.analysis = analyzeRows(session.normalization.transactions, session.destinationKey);
    session.decisions = Object.fromEntries(session.analysis.fuzzy.map((item) => [item.incomingIndex, 'defer']));
    session.result = entry;
    session.backupPrepared = false;
    session.backupTransactionCount = 0;
    session.acknowledged = false;
    notify(`Import verified: ${incomingRows.length} new transaction${incomingRows.length === 1 ? '' : 's'} added`);
    rerender();
    return true;
  } catch (error) {
    try {
      if (previousRaw == null) localStorage.removeItem(destination.key);
      else localStorage.setItem(destination.key, previousRaw);
    } catch {}
    invalidateVaultCache();
    notify(error?.message || 'Import failed; the previous destination vault was restored');
    rerender();
    return false;
  }
}
