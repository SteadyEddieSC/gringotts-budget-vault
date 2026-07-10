import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectBankExportText, normalizeDelimitedExport } from '../src/v115/parser.js';
import { detectInstitutionPattern } from '../src/v118/institution-patterns.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => fs.readFileSync(path.join(root, 'tests', 'fixtures', 'bank-import', name), 'utf8');
const inspect = (name) => {
  const text = fixture(name);
  return inspectBankExportText({ fileName: name, text, sizeBytes: Buffer.byteLength(text) });
};

test('recognizes a fictional card activity header family', () => {
  const model = inspect('synthetic-card-activity.csv');
  assert.equal(model.schema.id, 'card-activity');
  assert.equal(detectInstitutionPattern(model).id, 'fictional-card-activity');
  assert.equal(model.defaultMapping.id, 'Reference Number');
});

test('recognizes and normalizes a fictional deposit and withdrawal ledger', () => {
  const model = inspect('synthetic-credit-union-ledger.csv');
  assert.equal(model.schema.id, 'generic-debit-credit');
  assert.equal(detectInstitutionPattern(model).id, 'fictional-credit-union-ledger');
  const normalized = normalizeDelimitedExport(model, {
    mapping: model.defaultMapping,
    dateOrder: 'mdy',
    signMode: 'separate',
    accountLabel: 'Fictional Household Checking'
  });
  assert.deepEqual(normalized.errors, []);
  assert.equal(normalized.transactions[0].amount, 82.45);
  assert.equal(normalized.transactions[1].amount, -1250);
});

test('recognizes and maps a fictional digital wallet export', () => {
  const model = inspect('synthetic-digital-wallet.csv');
  assert.equal(detectInstitutionPattern(model).id, 'fictional-digital-wallet');
  assert.equal(model.defaultMapping.date, 'Activity Date');
  assert.equal(model.defaultMapping.description, 'Name');
  assert.equal(model.defaultMapping.amount, 'Net Amount');
  assert.equal(model.defaultMapping.id, 'Transaction ID');
  const normalized = normalizeDelimitedExport(model, {
    mapping: model.defaultMapping,
    dateOrder: 'auto',
    signMode: 'bank',
    accountLabel: 'Fictional Wallet'
  });
  assert.deepEqual(normalized.errors, []);
  assert.equal(normalized.transactions.length, 2);
});
