import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOfxFamily } from '../src/v115/parser.js';

test('blocks an OFX transaction with a missing TRNAMT instead of treating it as zero', () => {
  assert.throws(
    () => parseOfxFamily('<OFX><STMTTRN><DTPOSTED>20260701<NAME>Synthetic Missing Amount</STMTTRN></OFX>', 'ofx'),
    /no numeric TRNAMT value/i
  );
});
