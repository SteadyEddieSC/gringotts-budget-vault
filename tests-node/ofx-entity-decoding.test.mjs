import assert from 'node:assert/strict';
import test from 'node:test';
import { parseOfxFamily } from '../src/v115/parser.js';

test('decodes each OFX entity at most once', () => {
  const parsed = parseOfxFamily(`
    <OFX>
      <ORG>Test &amp; Co
      <ACCTID>SYNTHETIC1234
      <STMTTRN>
        <TRNTYPE>DEBIT
        <DTPOSTED>20260709
        <TRNAMT>-1.00
        <FITID>entity-test-1
        <NAME>Research &amp; Supplies
        <MEMO>Literal &amp;lt;token&amp;gt; &quot;quoted&quot; &apos;apostrophe&apos;
      </STMTTRN>
    </OFX>
  `, 'ofx');

  assert.equal(parsed.institution, 'Test & Co');
  assert.equal(parsed.transactions[0].name, 'Research & Supplies');
  assert.equal(parsed.transactions[0].notes, `Literal &lt;token&gt; "quoted" 'apostrophe'`);
});
