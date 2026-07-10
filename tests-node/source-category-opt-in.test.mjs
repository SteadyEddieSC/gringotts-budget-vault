import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectBankExportText, normalizeDelimitedExport } from '../src/v115/parser.js';

const text = 'Date,Description,Amount,Category\n2026-07-01,Synthetic Purchase,-10.00,Household';

function normalize(useSourceCategory) {
  const inspected = inspectBankExportText({ fileName: 'category.csv', text, sizeBytes: Buffer.byteLength(text) });
  return normalizeDelimitedExport(inspected, {
    mapping: inspected.defaultMapping,
    dateOrder: 'auto',
    signMode: 'bank',
    accountLabel: 'Synthetic Checking',
    useSourceCategory
  });
}

test('does not retain a mapped source category unless the user opts in', () => {
  const defaultResult = normalize(false);
  assert.deepEqual(defaultResult.errors, []);
  assert.equal(defaultResult.transactions[0].category, 'Other');
  assert.equal(defaultResult.transactions[0].source_category, '');

  const optedIn = normalize(true);
  assert.deepEqual(optedIn.errors, []);
  assert.equal(optedIn.transactions[0].category, 'Household');
  assert.equal(optedIn.transactions[0].source_category, 'Household');
});
