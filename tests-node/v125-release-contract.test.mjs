import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('v125 owns route presentation without activating the v124 release observer', () => {
  const boot = read('src/boot-v125.js');
  assert.match(boot, /import\('\.\/v124\/scenario-comparison\.js\?v=125close1'\)/);
  assert.match(boot, /import\('\.\/v125\/release\.js\?v=125close1'\)/);
  assert.doesNotMatch(boot, /import\('\.\/v124\/release\.js\?v=125/);
  assert.match(boot, /await layers\.v125\.prepareV125Interceptors\(\);[\s\S]*await layers\.v121\.prepareV121Interceptors\(\);/);
  assert.match(boot, /layers\.v118\.activateV118\(\);[\s\S]*layers\.v121\.activateV121\(\);[\s\S]*layers\.v125\.activateV125\(\)/);
  assert.match(boot, /await prepareRouteLayers\(layers\);[\s\S]*routeLayersReady = true/);
});

test('v125 download ownership and observer installation are idempotent', () => {
  const release = read('src/v125/release.js');
  assert.match(release, /if \(downloadsInstalled\) return;/);
  assert.match(release, /document\.addEventListener\('click', handleDownload, true\)/);
  assert.match(release, /if \(main && !observer\)/);
  assert.match(release, /43-sheet Vault Workbook/);
  assert.match(release, /expandedWorkbookSheetsV125/);
});

test('v125 keeps close analysis aggregate-only and non-mutating', () => {
  const model = read('src/v125/close-history-model.js');
  const ui = read('src/v125/close-trends.js');
  assert.doesNotMatch(model, /localStorage\.setItem/);
  assert.doesNotMatch(ui, /gringottsBudgetVault\.latest/);
  assert.match(model, /transferNeutral: true/);
  assert.match(model, /pendingExcluded: true/);
  assert.match(model, /automaticWriteAvailable: false/);
  assert.match(model, /transactionCopiesStored: false/);
  assert.match(ui, /existing\?\.dataset\.v125Signature === signature/);
  assert.match(ui, /card\?\.dataset\.v125Signature === signature/);
});
