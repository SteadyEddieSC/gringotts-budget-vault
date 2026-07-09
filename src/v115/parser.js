export const MAX_BANK_EXPORT_BYTES = 5 * 1024 * 1024;
export const MAX_BANK_EXPORT_ROWS = 25_000;

const clean = (value) => String(value ?? '').replace(/^\uFEFF/, '').trim();
const normalizeHeader = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const FIELD_SYNONYMS = {
  date: ['date', 'transaction date', 'posted date', 'post date', 'effective date', 'activity date'],
  description: ['description', 'merchant', 'payee', 'name', 'transaction description', 'details'],
  amount: ['amount', 'transaction amount', 'signed amount', 'net amount'],
  debit: ['debit', 'debit amount', 'withdrawal', 'withdrawals', 'charge', 'charges'],
  credit: ['credit', 'credit amount', 'deposit', 'deposits'],
  status: ['status', 'transaction status', 'state'],
  account: ['account', 'account name', 'account number', 'account id'],
  memo: ['memo', 'note', 'notes', 'additional details'],
  id: ['transaction id', 'reference', 'reference number', 'fitid', 'id'],
  category: ['category', 'transaction category'],
  type: ['type', 'transaction type', 'debit credit', 'credit debit']
};

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function extensionOf(fileName) {
  const match = clean(fileName).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}

export function detectBankFormat({ fileName = '', text = '' } = {}) {
  const extension = extensionOf(fileName);
  const sample = clean(text).slice(0, 20_000);
  if (['exe', 'dll', 'zip', '7z', 'rar', 'pdf', 'xlsx', 'xls', 'doc', 'docx'].includes(extension)) {
    return { format: 'unsupported', confidence: 'high', reason: `.${extension} is not a supported transaction-export format.` };
  }
  if (/^\s*[{[]/.test(sample)) {
    try {
      const parsed = JSON.parse(sample.length === clean(text).length ? sample : clean(text));
      if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.transactions)) {
        return { format: 'json', confidence: 'high', reason: 'A populated Gringotts-style transactions array was detected.' };
      }
    } catch {}
  }
  if (/<OFX[>\s]/i.test(sample) || /<STMTTRN>/i.test(sample) || /OFXHEADER\s*:/i.test(sample)) {
    const format = extension === 'qbo' ? 'qbo' : extension === 'qfx' ? 'qfx' : 'ofx';
    return { format, confidence: 'high', reason: 'OFX-family headers or transaction blocks were detected.' };
  }
  if (['csv', 'tsv', 'txt'].includes(extension)) {
    return { format: 'delimited', confidence: 'medium', reason: `The .${extension} extension indicates a delimited text export.` };
  }
  if (/[,;\t|]/.test(sample.split(/\r?\n/, 1)[0] || '')) {
    return { format: 'delimited', confidence: 'medium', reason: 'A delimited header row was detected from file content.' };
  }
  return { format: 'unsupported', confidence: 'low', reason: 'No supported CSV/delimited, OFX, QFX, QBO, or Gringotts JSON signature was found.' };
}

function parseWithDelimiter(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"' && field === '') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => clean(value) !== '')) rows.push(row);
      row = [];
      if (rows.length > MAX_BANK_EXPORT_ROWS + 1) throw new Error(`Import blocked: more than ${MAX_BANK_EXPORT_ROWS.toLocaleString()} rows were detected.`);
      continue;
    }
    field += char;
  }
  if (quoted) throw new Error('Delimited file is malformed: a quoted field was not closed.');
  row.push(field);
  if (row.some((value) => clean(value) !== '')) rows.push(row);
  return rows;
}

function chooseDelimiter(text) {
  const candidates = [',', '\t', ';', '|'];
  const scores = candidates.map((delimiter) => {
    try {
      const rows = parseWithDelimiter(String(text).slice(0, 80_000), delimiter).slice(0, 12);
      const widths = rows.map((row) => row.length).filter((width) => width > 1);
      if (!widths.length) return { delimiter, score: -1 };
      const counts = new Map();
      widths.forEach((width) => counts.set(width, (counts.get(width) || 0) + 1));
      const [modeWidth, modeCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      return { delimiter, score: modeCount * 100 + modeWidth };
    } catch {
      return { delimiter, score: -1 };
    }
  }).sort((a, b) => b.score - a.score);
  if (scores[0].score < 0) throw new Error('No consistent comma, tab, semicolon, or pipe delimiter could be detected.');
  return scores[0].delimiter;
}

export function parseDelimitedText(text, delimiter = 'auto') {
  const selected = delimiter === 'auto' ? chooseDelimiter(text) : delimiter;
  const matrix = parseWithDelimiter(text, selected);
  if (matrix.length < 2) throw new Error('Delimited export must contain a header row and at least one transaction row.');
  const rawHeaders = matrix[0].map((value, index) => clean(value) || `Column ${index + 1}`);
  const seen = new Map();
  const headers = rawHeaders.map((header) => {
    const count = (seen.get(header) || 0) + 1;
    seen.set(header, count);
    return count === 1 ? header : `${header} (${count})`;
  });
  const records = matrix.slice(1).map((values, rowIndex) => {
    const record = { __row: rowIndex + 2 };
    headers.forEach((header, columnIndex) => { record[header] = values[columnIndex] ?? ''; });
    if (values.length > headers.length) record.__extra = values.slice(headers.length);
    return record;
  });
  return { delimiter: selected, headers, records };
}

function scoreHeader(header, synonyms) {
  const normalized = normalizeHeader(header);
  let score = 0;
  synonyms.forEach((synonym) => {
    if (normalized === synonym) score = Math.max(score, 100);
    else if (normalized.includes(synonym) || synonym.includes(normalized)) score = Math.max(score, 70);
  });
  return score;
}

function mappingCandidates(headers) {
  const result = {};
  Object.entries(FIELD_SYNONYMS).forEach(([field, synonyms]) => {
    result[field] = headers
      .map((header) => ({ header, score: scoreHeader(header, synonyms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.header.localeCompare(b.header));
  });
  return result;
}

function defaultMapping(candidates) {
  const mapping = {};
  Object.entries(candidates).forEach(([field, values]) => {
    mapping[field] = values[0]?.header || '';
  });
  if (mapping.debit || mapping.credit) mapping.amount = '';
  return mapping;
}

function schemaFromHeaders(headers, mapping) {
  const normalized = headers.map(normalizeHeader);
  const separate = Boolean(mapping.debit || mapping.credit);
  if (separate) return { id: 'generic-debit-credit', label: 'Generic debit/credit columns', confidence: 'high' };
  if (normalized.includes('transaction date') && normalized.includes('post date') && normalized.includes('description') && normalized.includes('amount')) {
    return { id: 'card-activity', label: 'Card activity CSV pattern', confidence: 'medium' };
  }
  if (normalized.includes('date') && normalized.includes('description') && normalized.includes('amount')) {
    return { id: 'generic-signed', label: 'Generic signed-amount CSV', confidence: 'medium' };
  }
  return { id: 'generic-delimited', label: 'Generic delimited export', confidence: 'low' };
}

function tagValue(source, tag) {
  const expression = new RegExp(`<${escapeRegex(tag)}(?:\\s[^>]*)?>([^<\\r\\n]*)`, 'i');
  const match = String(source ?? '').match(expression);
  return clean(decodeEntities(match?.[1] || ''));
}

function parseOfxDate(value) {
  const match = clean(value).match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function maskedAccount(value) {
  const compact = clean(value).replace(/\s+/g, '');
  const last4 = compact.match(/([A-Za-z0-9]{4})$/)?.[1];
  return last4 ? `Imported account •${last4}` : 'Imported account';
}

export function parseOfxFamily(text, format = 'ofx') {
  const source = String(text ?? '');
  const blocks = [...source.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>))/gi)].map((match) => match[1]);
  if (!blocks.length) throw new Error('OFX-family export contains no STMTTRN transaction blocks.');
  if (blocks.length > MAX_BANK_EXPORT_ROWS) throw new Error(`Import blocked: more than ${MAX_BANK_EXPORT_ROWS.toLocaleString()} OFX transactions were detected.`);
  const accountId = tagValue(source, 'ACCTID');
  const institution = tagValue(source, 'ORG') || tagValue(source, 'FI') || tagValue(source, 'INTU.BID') || 'OFX-family institution';
  const accountLabel = maskedAccount(accountId);
  const warnings = [];
  const transactions = blocks.map((block, index) => {
    const date = parseOfxDate(tagValue(block, 'DTPOSTED') || tagValue(block, 'DTUSER') || tagValue(block, 'DTAVAIL'));
    const rawAmount = Number(tagValue(block, 'TRNAMT').replace(/,/g, ''));
    const fitid = tagValue(block, 'FITID');
    const trnType = tagValue(block, 'TRNTYPE').toUpperCase();
    const name = tagValue(block, 'NAME') || tagValue(block, 'PAYEE') || tagValue(block, 'MEMO') || `Imported transaction ${index + 1}`;
    const memo = tagValue(block, 'MEMO');
    if (!date) throw new Error(`OFX transaction ${index + 1} has no valid posting date.`);
    if (!Number.isFinite(rawAmount)) throw new Error(`OFX transaction ${index + 1} has no numeric TRNAMT value.`);
    const amount = -rawAmount;
    const transfer = /XFER|TRANSFER/.test(trnType);
    return {
      date,
      name,
      merchant: name,
      amount,
      type: transfer ? 'Transfer' : amount < 0 ? 'Income' : 'Expense',
      category: transfer ? 'Transfer' : 'Other',
      account: accountLabel,
      pending: false,
      reviewed: false,
      review_required: true,
      notes: memo && memo !== name ? memo.slice(0, 500) : '',
      fitid,
      source_transaction_id: fitid || '',
      import_format: format.toUpperCase()
    };
  });
  if (transactions.some((transaction) => !transaction.fitid)) warnings.push('One or more OFX transactions have no FITID; deterministic fingerprints will be used for duplicate checks.');
  return {
    institution,
    accountLabel,
    transactions,
    warnings,
    schema: { id: `${format}-stmttrn`, label: `${format.toUpperCase()} STMTTRN`, confidence: 'high' }
  };
}

function validDateParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function parseMappedDate(value, dateOrder = 'auto') {
  const input = clean(value);
  let match = input.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:\D.*)?$/);
  if (match) {
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    if (!validDateParts(year, month, day)) return { value: '', error: `Invalid date: ${input}` };
    return { value: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, error: '' };
  }
  match = input.match(/^(\d{4})(\d{2})(\d{2})(?:\D.*)?$/);
  if (match) {
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    if (!validDateParts(year, month, day)) return { value: '', error: `Invalid date: ${input}` };
    return { value: `${match[1]}-${match[2]}-${match[3]}`, error: '' };
  }
  match = input.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})(?:\D.*)?$/);
  if (!match) return { value: '', error: `Unsupported date: ${input || '(blank)'}` };
  const first = Number(match[1]), second = Number(match[2]), year = Number(match[3]);
  let month;
  let day;
  if (dateOrder === 'mdy') { month = first; day = second; }
  else if (dateOrder === 'dmy') { day = first; month = second; }
  else if (first > 12 && second <= 12) { day = first; month = second; }
  else if (second > 12 && first <= 12) { month = first; day = second; }
  else return { value: '', error: `Ambiguous date ${input}; choose month/day/year or day/month/year.` };
  if (!validDateParts(year, month, day)) return { value: '', error: `Invalid date: ${input}` };
  return { value: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, error: '' };
}

export function parseMoneyValue(value) {
  const input = clean(value);
  if (!input) return { value: null, error: '' };
  const negativeParentheses = /^\(.*\)$/.test(input);
  const normalized = input
    .replace(/[()]/g, '')
    .replace(/[$£€¥,\s]/g, '')
    .replace(/(?:CR|DR)$/i, '');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return { value: null, error: `Invalid amount: ${input}` };
  let number = Number(normalized);
  if (negativeParentheses) number = -Math.abs(number);
  return Number.isFinite(number) ? { value: number, error: '' } : { value: null, error: `Invalid amount: ${input}` };
}

function mappedValue(record, mapping, field) {
  const header = mapping[field];
  return header ? record[header] ?? '' : '';
}

function typeAssistedAmount(rawAmount, rawType) {
  const type = normalizeHeader(rawType);
  if (/deposit|credit|refund|payment|income|payroll|interest/.test(type)) return -Math.abs(rawAmount);
  if (/debit|purchase|withdraw|charge|fee|expense|sale/.test(type)) return Math.abs(rawAmount);
  return null;
}

function privacySafeMappedAccount(value, fallback) {
  const input = clean(value);
  if (!input) return fallback;
  const last4 = input.replace(/\s+/g, '').match(/([A-Za-z0-9]{4})$/)?.[1];
  return last4 ? `Imported account •${last4}` : fallback;
}

export function normalizeDelimitedExport(model, options = {}) {
  if (model.format !== 'delimited') throw new Error('Delimited normalization requires a delimited inspection model.');
  const mapping = { ...model.defaultMapping, ...(options.mapping || {}) };
  const dateOrder = options.dateOrder || 'auto';
  const signMode = options.signMode || '';
  const accountMode = options.accountMode || 'label';
  const accountLabel = clean(options.accountLabel) || 'Imported account';
  const useSourceCategory = options.useSourceCategory === true;
  const errors = [];
  const warnings = [...model.warnings];
  const transactions = [];
  if (!mapping.date) errors.push('Map a transaction date column.');
  if (!mapping.description && !mapping.memo) errors.push('Map a description, merchant, payee, or memo column.');
  const separateColumns = Boolean(mapping.debit || mapping.credit);
  if (!separateColumns && !mapping.amount) errors.push('Map one signed amount column or separate debit and credit columns.');
  if (!separateColumns && !['bank', 'vault', 'type'].includes(signMode)) errors.push('Choose how signed amounts should be interpreted.');
  if (!mapping.description && mapping.memo) mapping.description = mapping.memo;
  if (errors.length) return { transactions: [], errors, warnings, mapping, signMode, dateOrder };

  model.records.forEach((record) => {
    if (errors.length >= 100) return;
    const row = record.__row;
    const parsedDate = parseMappedDate(mappedValue(record, mapping, 'date'), dateOrder);
    if (parsedDate.error) { errors.push(`Row ${row}: ${parsedDate.error}`); return; }
    let amount;
    if (separateColumns) {
      const debit = parseMoneyValue(mappedValue(record, mapping, 'debit'));
      const credit = parseMoneyValue(mappedValue(record, mapping, 'credit'));
      if (debit.error || credit.error) { errors.push(`Row ${row}: ${debit.error || credit.error}`); return; }
      const hasDebit = debit.value !== null && Math.abs(debit.value) > 0;
      const hasCredit = credit.value !== null && Math.abs(credit.value) > 0;
      if (hasDebit && hasCredit) { errors.push(`Row ${row}: both debit and credit contain values.`); return; }
      if (!hasDebit && !hasCredit) { errors.push(`Row ${row}: no debit or credit amount is present.`); return; }
      amount = hasDebit ? Math.abs(debit.value) : -Math.abs(credit.value);
    } else {
      const parsed = parseMoneyValue(mappedValue(record, mapping, 'amount'));
      if (parsed.error || parsed.value === null) { errors.push(`Row ${row}: ${parsed.error || 'amount is blank.'}`); return; }
      if (signMode === 'bank') amount = -parsed.value;
      else if (signMode === 'vault') amount = parsed.value;
      else {
        amount = typeAssistedAmount(parsed.value, mappedValue(record, mapping, 'type'));
        if (amount === null) { errors.push(`Row ${row}: transaction type does not explain whether the amount is a debit or credit.`); return; }
      }
    }
    const description = clean(mappedValue(record, mapping, 'description')) || clean(mappedValue(record, mapping, 'memo'));
    if (!description) { errors.push(`Row ${row}: description is blank.`); return; }
    const status = normalizeHeader(mappedValue(record, mapping, 'status'));
    const pending = /pending|processing|authorized|authorization/.test(status);
    const mappedAccount = accountMode === 'mapped-masked' ? privacySafeMappedAccount(mappedValue(record, mapping, 'account'), accountLabel) : accountLabel;
    const sourceCategory = clean(mappedValue(record, mapping, 'category'));
    const id = clean(mappedValue(record, mapping, 'id'));
    const memo = clean(mappedValue(record, mapping, 'memo'));
    const typeText = normalizeHeader(mappedValue(record, mapping, 'type'));
    const transfer = /transfer|xfer/.test(typeText);
    transactions.push({
      date: parsedDate.value,
      name: description,
      merchant: description,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      type: transfer ? 'Transfer' : amount < 0 ? 'Income' : 'Expense',
      category: transfer ? 'Transfer' : useSourceCategory && sourceCategory ? sourceCategory : 'Other',
      source_category: sourceCategory || '',
      account: mappedAccount,
      pending,
      reviewed: false,
      review_required: true,
      notes: memo && memo !== description ? memo.slice(0, 500) : '',
      source_transaction_id: id,
      import_format: 'CSV'
    });
  });
  if (errors.length >= 100) warnings.push('Additional row errors were omitted after the first 100.');
  if (transactions.length > MAX_BANK_EXPORT_ROWS) errors.push(`Import blocked: more than ${MAX_BANK_EXPORT_ROWS.toLocaleString()} normalized rows were produced.`);
  if (!transactions.length && !errors.length) errors.push('No transaction rows could be normalized.');
  return { transactions: errors.length ? [] : transactions, errors, warnings, mapping, signMode, dateOrder };
}

export function inspectBankExportText({ fileName = '', text = '', sizeBytes = 0 } = {}) {
  if (sizeBytes > MAX_BANK_EXPORT_BYTES) throw new Error(`Import blocked: file exceeds the ${Math.round(MAX_BANK_EXPORT_BYTES / 1024 / 1024)} MB local safety limit.`);
  const detection = detectBankFormat({ fileName, text });
  if (detection.format === 'unsupported') throw new Error(detection.reason);
  if (detection.format === 'json') {
    let parsed;
    try { parsed = JSON.parse(String(text).replace(/^\uFEFF/, '')); } catch { throw new Error('Malformed JSON: the selected file could not be parsed.'); }
    if (!parsed || Array.isArray(parsed) || !Array.isArray(parsed.transactions) || !parsed.transactions.length) throw new Error('Gringotts JSON import requires a populated transactions array.');
    if (parsed.transactions.length > MAX_BANK_EXPORT_ROWS) throw new Error(`Import blocked: more than ${MAX_BANK_EXPORT_ROWS.toLocaleString()} transactions were detected.`);
    return {
      format: 'json', detection, fileName, institution: clean(parsed?.source?.institution) || 'Gringotts JSON',
      schema: { id: 'gringotts-json', label: 'Gringotts transactions array', confidence: 'high' },
      directTransactions: parsed.transactions, warnings: [], headers: [], records: [], mappingCandidates: {}, defaultMapping: {}
    };
  }
  if (['ofx', 'qfx', 'qbo'].includes(detection.format)) {
    const parsed = parseOfxFamily(text, detection.format);
    return {
      format: detection.format, detection, fileName, institution: parsed.institution,
      schema: parsed.schema, directTransactions: parsed.transactions, warnings: parsed.warnings,
      accountLabel: parsed.accountLabel, headers: [], records: [], mappingCandidates: {}, defaultMapping: {}
    };
  }
  const parsed = parseDelimitedText(text);
  const candidates = mappingCandidates(parsed.headers);
  const mapping = defaultMapping(candidates);
  const warnings = [];
  if (!mapping.date) warnings.push('No date column was selected automatically.');
  if (!mapping.description && !mapping.memo) warnings.push('No description or memo column was selected automatically.');
  if (!mapping.amount && !mapping.debit && !mapping.credit) warnings.push('No amount, debit, or credit column was selected automatically.');
  if (parsed.records.some((record) => Array.isArray(record.__extra) && record.__extra.length)) warnings.push('One or more rows contain more values than the header row.');
  return {
    format: 'delimited', detection, fileName, institution: 'Generic delimited export',
    delimiter: parsed.delimiter, headers: parsed.headers, records: parsed.records,
    mappingCandidates: candidates, defaultMapping: mapping,
    schema: schemaFromHeaders(parsed.headers, mapping), warnings, directTransactions: null
  };
}
