import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MAX_BANK_EXPORT_BYTES,
  detectBankFormat,
  inspectBankExportText,
  normalizeDelimitedExport,
  parseDelimitedText,
  parseMappedDate,
  parseMoneyValue,
  parseOfxFamily
} from '../src/v115/parser.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => fs.readFileSync(path.join(root, 'tests', 'fixtures', 'bank-import', name), 'utf8');

function mappedInspection(text, fileName = 'synthetic.csv') {
  const inspected = inspectBankExportText({ fileName, text, sizeBytes: Buffer.byteLength(text) });
  assert.equal(inspected.format, 'delimited');
  return inspected;
}

test('detects supported and unsupported formats from extension and content', () => {
  assert.equal(detectBankFormat({ fileName: 'a.csv', text: 'Date,Amount\n2026-01-01,-2' }).format, 'delimited');
  assert.equal(detectBankFormat({ fileName: 'a.qfx', text: '<OFX><STMTTRN>' }).format, 'qfx');
  assert.equal(detectBankFormat({ fileName: 'a.qbo', text: 'OFXHEADER:100\n<OFX>' }).format, 'qbo');
  assert.equal(detectBankFormat({ fileName: 'a.ofx', text: '<OFX>' }).format, 'ofx');
  assert.equal(detectBankFormat({ fileName: 'a.json', text: '{"transactions":[{"date":"2026-01-01","amount":1}]}' }).format, 'json');
  for (const name of ['statement.pdf', 'archive.zip', 'book.xlsx', 'program.exe']) {
    assert.equal(detectBankFormat({ fileName: name, text: 'Date,Amount' }).format, 'unsupported');
  }
});

test('parses quoted commas, escaped quotes, multiline fields, and a UTF-8 BOM', () => {
  const input = '\uFEFFDate,Description,Memo,Amount\r\n07/20/2026,"Store, Synthetic","Line one\nLine two with ""quotes""",-45.67\r\n';
  const parsed = parseDelimitedText(input);
  assert.equal(parsed.delimiter, ',');
  assert.deepEqual(parsed.headers, ['Date', 'Description', 'Memo', 'Amount']);
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].Description, 'Store, Synthetic');
  assert.equal(parsed.records[0].Memo, 'Line one\nLine two with "quotes"');
  assert.equal(parsed.records[0].Amount, '-45.67');
});

test('detects tab, semicolon, and pipe-delimited exports', () => {
  assert.equal(parseDelimitedText('Date\tPayee\tAmount\n2026-01-01\tTest\t-1').delimiter, '\t');
  assert.equal(parseDelimitedText('Date;Payee;Amount\n2026-01-01;Test;-1').delimiter, ';');
  assert.equal(parseDelimitedText('Date|Payee|Amount\n2026-01-01|Test|-1').delimiter, '|');
});

test('blocks malformed quoted delimited text', () => {
  assert.throws(() => parseDelimitedText('Date,Description\n2026-01-01,"Unclosed'), /quoted field was not closed/i);
});

test('auto-maps common signed CSV headers but requires an explicit sign convention', () => {
  const inspected = mappedInspection(fixture('synthetic-signed.csv'));
  assert.equal(inspected.defaultMapping.date, 'Date');
  assert.equal(inspected.defaultMapping.description, 'Description');
  assert.equal(inspected.defaultMapping.amount, 'Amount');
  assert.equal(inspected.defaultMapping.status, 'Status');
  assert.equal(inspected.defaultMapping.id, 'Reference');

  const blocked = normalizeDelimitedExport(inspected, {
    mapping: inspected.defaultMapping,
    dateOrder: 'mdy',
    signMode: '',
    accountLabel: 'Test Credit Card'
  });
  assert.match(blocked.errors.join(' '), /Choose how signed amounts/i);

  const normalized = normalizeDelimitedExport(inspected, {
    mapping: inspected.defaultMapping,
    dateOrder: 'mdy',
    signMode: 'bank',
    accountLabel: 'Test Credit Card'
  });
  assert.deepEqual(normalized.errors, []);
  assert.equal(normalized.transactions.length, 3);
  assert.equal(normalized.transactions[0].amount, 19.99);
  assert.equal(normalized.transactions[0].type, 'Expense');
  assert.equal(normalized.transactions[1].amount, 45.67);
  assert.equal(normalized.transactions[2].amount, -12.34);
  assert.equal(normalized.transactions[2].type, 'Income');
  assert.equal(normalized.transactions[2].pending, true);
  assert.equal(normalized.transactions[1].notes, 'Fictional fuel purchase, test only');
  assert.equal(normalized.transactions[2].notes, 'Quoted memo with a comma, and a\nsecond synthetic line');
  assert.equal(normalized.transactions[0].category, 'Other');
  assert.equal(normalized.transactions[0].review_required, true);
});

test('normalizes separate debit and credit columns without a sign-mode guess', () => {
  const inspected = mappedInspection(fixture('synthetic-debit-credit.csv'));
  assert.equal(inspected.defaultMapping.debit, 'Debit');
  assert.equal(inspected.defaultMapping.credit, 'Credit');
  const normalized = normalizeDelimitedExport(inspected, {
    mapping: inspected.defaultMapping,
    dateOrder: 'auto',
    signMode: 'separate',
    accountLabel: 'Synthetic Checking',
    accountMode: 'mapped-masked',
    useSourceCategory: true
  });
  assert.deepEqual(normalized.errors, []);
  assert.equal(normalized.transactions[0].amount, 75.25);
  assert.equal(normalized.transactions[0].type, 'Expense');
  assert.equal(normalized.transactions[0].account, 'Imported account •1234');
  assert.equal(normalized.transactions[0].category, 'Household');
  assert.equal(normalized.transactions[1].amount, -2500);
  assert.equal(normalized.transactions[1].type, 'Income');
  assert.equal(normalized.transactions[1].category, 'Income');
});

test('blocks ambiguous dates until MDY or DMY is selected', () => {
  assert.match(parseMappedDate('07/08/2026', 'auto').error, /Ambiguous date/i);
  assert.equal(parseMappedDate('07/08/2026', 'mdy').value, '2026-07-08');
  assert.equal(parseMappedDate('07/08/2026', 'dmy').value, '2026-08-07');
  assert.equal(parseMappedDate('2026-07-08', 'auto').value, '2026-07-08');
  assert.equal(parseMappedDate('20260708', 'auto').value, '2026-07-08');
  assert.match(parseMappedDate('2026-02-30', 'auto').error, /Invalid date/i);
});

test('parses money values safely', () => {
  assert.equal(parseMoneyValue('$1,234.56').value, 1234.56);
  assert.equal(parseMoneyValue('(45.67)').value, -45.67);
  assert.equal(parseMoneyValue('-12.34 CR').value, -12.34);
  assert.equal(parseMoneyValue('').value, null);
  assert.match(parseMoneyValue('1.2.3').error, /Invalid amount/i);
});

test('parses QFX STMTTRN blocks, FITIDs, masked accounts, and Gringotts signs', () => {
  const text = fixture('synthetic.qfx');
  const inspected = inspectBankExportText({ fileName: 'synthetic.qfx', text, sizeBytes: Buffer.byteLength(text) });
  assert.equal(inspected.format, 'qfx');
  assert.equal(inspected.schema.id, 'qfx-stmttrn');
  assert.equal(inspected.directTransactions.length, 3);
  assert.equal(inspected.directTransactions[0].date, '2026-07-15');
  assert.equal(inspected.directTransactions[0].amount, 42.5);
  assert.equal(inspected.directTransactions[0].fitid, 'jul-review-1');
  assert.equal(inspected.directTransactions[0].account, 'Imported account •1234');
  assert.equal(inspected.directTransactions[1].amount, 64.2);
  assert.equal(inspected.directTransactions[2].amount, -25);
  assert.equal(inspected.directTransactions[2].type, 'Income');
  assert.ok(!JSON.stringify(inspected).includes('TESTACCOUNT1234'));
});

test('blocks malformed or empty OFX-family files', () => {
  assert.throws(() => parseOfxFamily('<OFX><BANKTRANLIST></BANKTRANLIST></OFX>', 'ofx'), /no STMTTRN/i);
  assert.throws(() => parseOfxFamily('<OFX><STMTTRN><DTPOSTED>bad<TRNAMT>-1</STMTTRN></OFX>', 'ofx'), /valid posting date/i);
  assert.throws(() => parseOfxFamily('<OFX><STMTTRN><DTPOSTED>20260701<TRNAMT>oops</STMTTRN></OFX>', 'ofx'), /numeric TRNAMT/i);
});

test('blocks oversized files and excessive row counts before browser work', () => {
  assert.throws(() => inspectBankExportText({ fileName: 'large.csv', text: 'Date,Amount\n', sizeBytes: MAX_BANK_EXPORT_BYTES + 1 }), /5 MB/i);
  const header = 'Date,Description,Amount\n';
  const rows = Array.from({ length: 25_001 }, (_, index) => `2026-07-01,Synthetic ${index},-1`).join('\n');
  assert.throws(() => parseDelimitedText(header + rows), /25,000 rows/i);
});

test('blocks rows with both debit and credit or neither', () => {
  const both = mappedInspection('Date,Description,Debit,Credit\n2026-07-01,Synthetic,10,20');
  const bothResult = normalizeDelimitedExport(both, { mapping: both.defaultMapping, accountLabel: 'Test' });
  assert.match(bothResult.errors.join(' '), /both debit and credit/i);
  const neither = mappedInspection('Date,Description,Debit,Credit\n2026-07-01,Synthetic,,');
  const neitherResult = normalizeDelimitedExport(neither, { mapping: neither.defaultMapping, accountLabel: 'Test' });
  assert.match(neitherResult.errors.join(' '), /no debit or credit/i);
});

test('does not hang or throw unexpected errors across deterministic malformed mutations', () => {
  const seeds = [
    '', ',', '"', '\u0000', '<OFX>', '<STMTTRN>', '{', '[]', 'Date,Amount\n',
    'Date;Description;Amount\n01/02/2026;A;-1',
    'Date\tDescription\tAmount\n2026-01-01\tA\t-1'
  ];
  let state = 0x1152026;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  for (let index = 0; index < 400; index += 1) {
    const seed = seeds[next() % seeds.length];
    const extra = String.fromCharCode(32 + (next() % 95)).repeat(next() % 16);
    const text = `${seed}${extra}`;
    const name = ['mutation.csv', 'mutation.ofx', 'mutation.qfx', 'mutation.txt', 'mutation.json'][next() % 5];
    try {
      inspectBankExportText({ fileName: name, text, sizeBytes: Buffer.byteLength(text) });
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.length > 0);
    }
  }
});
