import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXPORT_CATALOG,
  EXPORT_CONTRACT_RELEASE,
  WORKBOOK_OWNERSHIP,
  WORKBOOK_SHEET_CAP,
  assertExportPayloadSafe,
  buildExportFilename,
  getExportContract,
  validateExportCatalog,
  validateWorkbookOwnership
} from '../src/v134/export-contracts.js';
import { executeLocalExport } from '../src/v134/local-export.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const createdAt = '2026-08-05T22:15:16.123Z';
const stamp = '2026-08-05T22-15-16-123Z';

test('publishes one complete retained-output catalog with no automatic or retry path', () => {
  assert.equal(EXPORT_CONTRACT_RELEASE, 'v134');
  assert.equal(validateExportCatalog(), true);
  assert.equal(EXPORT_CATALOG.length, 16);
  assert.equal(new Set(EXPORT_CATALOG.map((entry) => entry.id)).size, 16);
  assert.equal(EXPORT_CATALOG.filter((entry) => entry.startupPath).length, 7);
  assert.ok(EXPORT_CATALOG.every((entry) => entry.automatic === false));
  assert.ok(EXPORT_CATALOG.every((entry) => entry.retryBehavior === 'none'));
  assert.ok(EXPORT_CATALOG.every((entry) => entry.failureBehavior === 'throw-without-substitution'));
  assert.ok(EXPORT_CATALOG.every((entry) => entry.cancellationBehavior === 'abort-before-dispatch'));
});

test('preserves recognizable filename prefixes, versions, and extensions deterministically', () => {
  assert.equal(buildExportFilename('vault-workbook', { createdAt, start:'2026-01-01', end:'2026-01-31' }), `Gringotts_Budget_Vault_v115_2026-01-01_to_2026-01-31_${stamp}.xlsx`);
  assert.equal(buildExportFilename('full-vault-backup', { createdAt, transactionCount:42 }), `Gringotts_v115_backup_42_${stamp}.json`);
  assert.equal(buildExportFilename('import-profile-bundle', { createdAt, profileCount:3 }), `Gringotts_v118_import_profiles_3_${stamp}.json`);
  assert.equal(buildExportFilename('close-trend', { createdAt, month:'2026-07' }), `Gringotts_v125_close_trend_2026-07_${stamp}.json`);
  assert.equal(buildExportFilename('workflow-review', { createdAt }), `Gringotts_Workflow_Review_${stamp}.json`);
  assert.equal(buildExportFilename('decision-record', { createdAt }), `Gringotts_Decision_Gate_${stamp}.json`);
  for (const entry of EXPORT_CATALOG) {
    assert.ok(buildExportFilename(entry.id, { createdAt }).endsWith(entry.extension), entry.id);
    assert.ok(entry.mimeType.includes('/'), entry.id);
  }
});

test('maps the retained workbook ownership chain to exactly 43 sheets', () => {
  assert.equal(WORKBOOK_SHEET_CAP, 43);
  assert.equal(validateWorkbookOwnership(), true);
  assert.deepEqual(WORKBOOK_OWNERSHIP.map((group) => group.count), [32, 1, 2, 2, 2, 2, 2]);
  assert.equal(WORKBOOK_OWNERSHIP.reduce((sum, group) => sum + group.count, 0), 43);
  assert.deepEqual(WORKBOOK_OWNERSHIP.at(-1).sheets, ['Close Trends', 'Close Drivers']);
});

test('enforces aggregate-only and workflow-only forbidden-field boundaries', () => {
  assert.equal(assertExportPayloadSafe('account-cleanup-plan', {
    accountId:'stable-hash', displayLabel:'Account ••1234', transactionCount:8,
    dataBoundary:{ transactionRowsIncluded:false, merchantNamesIncluded:false, balancesIncluded:false }
  }), true);
  assert.throws(() => assertExportPayloadSafe('account-cleanup-plan', { transactions:[] }), /transactions is forbidden/i);
  assert.throws(() => assertExportPayloadSafe('account-cleanup-plan', { merchant:'Synthetic Merchant' }), /merchant is forbidden/i);
  assert.throws(() => assertExportPayloadSafe('workflow-review', { accountId:'acct-raw' }), /accountId is forbidden/i);
  assert.throws(() => assertExportPayloadSafe('decision-record', { amount:12.34 }), /amount is forbidden/i);
  assert.equal(assertExportPayloadSafe('workflow-review', {
    kind:'gringotts-workflow-evidence-review', summary:{ completeCount:10 }, privacy:{ financialDataIncluded:false }
  }), true);
});

function environment({ failCreate = false } = {}) {
  const events = [];
  let createCalls = 0;
  const anchor = {
    href:'', download:'',
    click() { events.push('click'); },
    remove() { events.push('remove'); }
  };
  return {
    events,
    get createCalls() { return createCalls; },
    documentRef: {
      body: { append(node) { assert.equal(node, anchor); events.push('append'); } },
      createElement(tag) { assert.equal(tag, 'a'); events.push('anchor'); return anchor; }
    },
    urlRef: {
      createObjectURL(blob) {
        createCalls += 1;
        events.push('create-url');
        assert.equal(blob.type, 'application/json');
        if (failCreate) throw new Error('synthetic object URL failure');
        return 'blob:synthetic-export';
      },
      revokeObjectURL(value) { assert.equal(value, 'blob:synthetic-export'); events.push('revoke-url'); }
    },
    setTimeoutRef(callback, delay) { assert.equal(delay, 0); events.push('schedule-cleanup'); callback(); return 1; }
  };
}

test('dispatches one local download before reporting success and then cleans up', () => {
  const env = environment();
  const result = executeLocalExport({
    id:'workflow-review',
    payload:{ kind:'gringotts-workflow-evidence-review', privacy:{ financialDataIncluded:false } },
    filenameContext:{ createdAt },
    documentRef:env.documentRef,
    urlRef:env.urlRef,
    setTimeoutRef:env.setTimeoutRef
  });
  assert.deepEqual(result, {
    status:'dispatched', id:'workflow-review',
    filename:`Gringotts_Workflow_Review_${stamp}.json`,
    mimeType:'application/json', dispatched:true
  });
  assert.deepEqual(env.events, ['anchor','create-url','append','click','remove','schedule-cleanup','revoke-url']);
  assert.equal(env.createCalls, 1);
});

test('cancels before dispatch without creating a URL or anchor', () => {
  const env = environment();
  const controller = new AbortController();
  controller.abort();
  const result = executeLocalExport({
    id:'decision-record', payload:{}, filenameContext:{ createdAt }, signal:controller.signal,
    documentRef:env.documentRef, urlRef:env.urlRef, setTimeoutRef:env.setTimeoutRef
  });
  assert.deepEqual(result, {
    status:'cancelled', id:'decision-record',
    filename:`Gringotts_Decision_Gate_${stamp}.json`, dispatched:false
  });
  assert.deepEqual(env.events, []);
  assert.equal(env.createCalls, 0);
});

test('throws on dispatch failure without retry or silent substitution', () => {
  const env = environment({ failCreate:true });
  assert.throws(() => executeLocalExport({
    id:'workflow-review', payload:{}, filenameContext:{ createdAt },
    documentRef:env.documentRef, urlRef:env.urlRef, setTimeoutRef:env.setTimeoutRef
  }), /synthetic object URL failure/i);
  assert.equal(env.createCalls, 1);
  assert.deepEqual(env.events, ['anchor','create-url','remove']);
});

test('keeps v134 contracts and executor free of persistence, network, observers, and automatic retry', () => {
  for (const file of [
    'src/v134/export-contracts.js','src/v134/export-contracts.ts',
    'src/v134/local-export.js','src/v134/local-export.ts'
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(source, /serviceWorker\.register|new MutationObserver/);
    assert.doesNotMatch(source, /retry\s*\(|setInterval\s*\(/);
  }
  assert.equal(getExportContract('workflow-review').startupPath, false);
  assert.equal(getExportContract('decision-record').startupPath, false);
});
