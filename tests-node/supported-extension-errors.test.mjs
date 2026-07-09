import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectBankExportText } from '../src/v115/parser.js';

test('returns JSON validation errors for malformed or incomplete .json files', () => {
  assert.throws(
    () => inspectBankExportText({ fileName: 'malformed.json', text: '{not-json', sizeBytes: 9 }),
    /Malformed JSON/i
  );
  assert.throws(
    () => inspectBankExportText({ fileName: 'missing-array.json', text: '{"version":"test"}', sizeBytes: 18 }),
    /populated transactions array/i
  );
});

test('returns OFX-family parsing errors for malformed supported extensions', () => {
  for (const fileName of ['malformed.ofx', 'malformed.qfx', 'malformed.qbo']) {
    assert.throws(
      () => inspectBankExportText({ fileName, text: 'synthetic malformed content', sizeBytes: 27 }),
      /no STMTTRN transaction blocks/i
    );
  }
});
