import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v119 reuses the active v115 import session and v117 profile controller instances', () => {
  const controller = read('src/v119/profile-versioning.js');
  assert.match(controller, /bank-import\.js\?v=115bankimport2/);
  assert.match(controller, /import-profiles\.js\?v=117profiles1/);
  assert.doesNotMatch(controller, /bank-import\.js\?v=119/);
  assert.doesNotMatch(controller, /import-profiles\.js\?v=119/);
});

test('v120 reads the active registries instead of importing a second bank session', () => {
  const controller = read('src/v120/import-receipt-audit.js');
  const v115 = read('src/v115/release.js');
  assert.match(controller, /window\.GringottsV115\?\.importHistory/);
  assert.doesNotMatch(controller, /bank-import\.js/);
  assert.match(v115, /bank-import\.js\?v=115bankimport2/);
});

test('v119 defers presentation writes when the v120 layer owns the route', () => {
  const release = read('src/v119/release.js');
  assert.match(release, /function v120OwnsPresentation\(\)/);
  assert.match(release, /window\.GringottsV120\?\.release === 'v120'/);
  assert.match(release, /if \(!v120OwnsPresentation\(\)\) \{[\s\S]*report-kicker/);
  assert.match(release, /function enhanceRoadmap\(root\) \{\s*if \(v120OwnsPresentation\(\)\) return;/);
  assert.match(release, /module\.enhanceProfileVersioning\(page\)/);
});

test('v121 reuses the authoritative v115 and v117 module instances', () => {
  const controller = read('src/v121/receipt-integrity.js');
  assert.match(controller, /bank-import\.js\?v=115bankimport2/);
  assert.match(controller, /import-profiles\.js\?v=117profiles1/);
  assert.doesNotMatch(controller, /bank-import\.js\?v=121/);
  assert.doesNotMatch(controller, /import-profiles\.js\?v=121/);
});

test('v122 export privacy installs before inherited route controls attach', () => {
  const boot = read('src/boot-v122.js');
  assert.match(boot, /import\('\.\/v122\/account-cleanup-export-controller\.js\?v=122cleanup1'\)/);
  assert.match(boot, /cleanupExport\.installAccountCleanupExportController\(\);[\s\S]*await v122\.prepareV122Interceptors\(\);[\s\S]*await v121\.prepareV121Interceptors\(\);[\s\S]*v120\.prepareV120Interceptors\(\);[\s\S]*v119\.prepareV119Interceptors\(\);[\s\S]*v118\.prepareV118Interceptors\(\);/);
  assert.match(boot, /v118\.activateV118\(\);[\s\S]*v119\.activateV119\(\);[\s\S]*v120\.activateV120\(\);[\s\S]*v121\.activateV121\(\);[\s\S]*v122\.activateV122\(\)/);
  assert.match(boot, /import\('\.\/v115\/release\.js\?v=122cleanup1'\)/);
  assert.doesNotMatch(boot, /bank-import\.js\?v=122/);
});

test('v120 defers presentation writes while v121 owns the inherited receipt route', () => {
  const release = read('src/v120/release.js');
  assert.match(release, /function v121OwnsPresentation\(\)/);
  assert.match(release, /window\.GringottsV121\?\.release === 'v121'/);
  assert.match(release, /function enhanceMain\(root = document\.getElementById\('main'\)\) \{\s*if \(!root \|\| v121OwnsPresentation\(\)\) return;/);
  assert.match(release, /function enhanceRoadmap\(root\) \{\s*if \(v121OwnsPresentation\(\)\) return;/);
});

test('v121 defers presentation writes while v122 owns the route', () => {
  const release = read('src/v121/release.js');
  assert.match(release, /function v122OwnsPresentation\(\)/);
  assert.match(release, /window\.GringottsV122\?\.release === 'v122'/);
  assert.match(release, /function enhanceMain\(root = document\.getElementById\('main'\)\) \{\s*if \(!root \|\| v122OwnsPresentation\(\)\) return;/);
});

test('v122 account cleanup reads the active core state without importing a second transaction engine', () => {
  const controller = read('src/v122/account-cleanup.js');
  const exportController = read('src/v122/account-cleanup-export-controller.js');
  assert.match(controller, /from '\.\.\/v103\/core\.js'/);
  assert.doesNotMatch(controller, /bank-import\.js/);
  assert.doesNotMatch(controller, /import-profiles\.js/);
  assert.doesNotMatch(controller, /runtime-v111-reporting\.js/);
  assert.match(exportController, /buildAccountCleanupPackage/);
  assert.match(exportController, /stopImmediatePropagation/);
});
