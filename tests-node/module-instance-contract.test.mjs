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
  assert.match(boot, /cleanupExport\.installAccountCleanupExportController\(\);[\s\S]*await v122\.prepareV122Interceptors\(\);[\s\S]*await v121\.prepareV121Interceptors\(\);/);
  assert.match(boot, /v118\.activateV118\(\);[\s\S]*v119\.activateV119\(\);[\s\S]*v120\.activateV120\(\);[\s\S]*v121\.activateV121\(\);[\s\S]*v122\.activateV122\(\)/);
});

test('v120 and v121 retain inherited presentation-yield contracts', () => {
  const v120 = read('src/v120/release.js');
  const v121 = read('src/v121/release.js');
  assert.match(v120, /function v121OwnsPresentation\(\)/);
  assert.match(v120, /window\.GringottsV121\?\.release === 'v121'/);
  assert.match(v121, /function v122OwnsPresentation\(\)/);
  assert.match(v121, /window\.GringottsV122\?\.release === 'v122'/);
  assert.match(v121, /if \(!root \|\| v122OwnsPresentation\(\)\) return;/);
});

test('v123 owns presentation without activating the v122 observer', () => {
  const boot = read('src/boot-v123.js');
  const cleanupImport = "import('./v122/account-cleanup.js?v=123recurring1')";
  const cleanupExportImport = "import('./v122/account-cleanup-export-controller.js?v=123recurring1')";
  const v123Import = "import('./v123/release.js?v=123recurring1')";
  assert.ok(boot.includes(cleanupImport));
  assert.ok(boot.includes(cleanupExportImport));
  assert.ok(boot.includes(v123Import));
  assert.doesNotMatch(boot, /import\('\.\/v122\/release\.js\?v=123/);
  assert.match(boot, /cleanupExport\.installAccountCleanupExportController\(\);[\s\S]*accountCleanup\.installAccountCleanupFeatures\(\);[\s\S]*await v123\.prepareV123Interceptors\(\);[\s\S]*await v121\.prepareV121Interceptors\(\);/);
  assert.match(boot, /v118\.activateV118\(\);[\s\S]*v119\.activateV119\(\);[\s\S]*v120\.activateV120\(\);[\s\S]*v121\.activateV121\(\);[\s\S]*v123\.activateV123\(\)/);
  assert.match(boot, /\['money', 'reports', 'activity', 'tools'\]\.includes\(route\)/);
});

test('v124 owns presentation without activating the v123 release observer', () => {
  const boot = read('src/boot-v124.js');
  assert.match(boot, /import\('\.\/v123\/recurring-decisions\.js\?v=124scenario1'\)/);
  assert.match(boot, /import\('\.\/v124\/release\.js\?v=124scenario1'\)/);
  assert.doesNotMatch(boot, /import\('\.\/v123\/release\.js\?v=124/);
  assert.match(boot, /accountCleanup\.installAccountCleanupFeatures\(\);[\s\S]*recurring\.installRecurringDecisionFeatures\(\);/);
  assert.match(boot, /v124RecurringObserverGuard:[\s\S]*page\.dataset\.v124RecurringEnhanced === 'true'[\s\S]*inheritedEnhancer\(page\)/);
  assert.match(boot, /await layers\.v124\.prepareV124Interceptors\(\);[\s\S]*await layers\.v121\.prepareV121Interceptors\(\);/);
  assert.match(boot, /layers\.v118\.activateV118\(\);[\s\S]*layers\.v119\.activateV119\(\);[\s\S]*layers\.v120\.activateV120\(\);[\s\S]*layers\.v121\.activateV121\(\);[\s\S]*layers\.v124\.activateV124\(\)/);
  assert.match(boot, /openPreparedRoute\(requestedRoute\);[\s\S]*prepareAndActivateAfterRender\(layers\);/);
  assert.match(boot, /\['money', 'reports', 'activity', 'tools'\]\.includes\(route\)/);
});

test('v122 cleanup, v123 recurring decisions, and v124 scenarios read active local models without a second transaction engine', () => {
  const cleanup = read('src/v122/account-cleanup.js');
  const cleanupExport = read('src/v122/account-cleanup-export-controller.js');
  const recurring = read('src/v123/recurring-decisions.js');
  const scenarios = read('src/v124/scenario-comparison.js');
  for (const source of [cleanup, recurring, scenarios]) {
    assert.doesNotMatch(source, /bank-import\.js/);
    assert.doesNotMatch(source, /import-profiles\.js/);
    assert.doesNotMatch(source, /runtime-v111-reporting\.js/);
  }
  assert.match(cleanup, /from '\.\.\/v103\/core\.js'/);
  assert.match(recurring, /from '\.\.\/v103\/core\.js'/);
  assert.match(scenarios, /from '\.\.\/v110\/planning\.js'/);
  assert.match(cleanupExport, /buildAccountCleanupPackage/);
  assert.match(cleanupExport, /stopImmediatePropagation/);
  assert.match(recurring, /The previous decision metadata was restored/);
  assert.match(scenarios, /The previous scenario metadata was restored/);
  assert.doesNotMatch(scenarios, /localStorage\.setItem\('gringottsBudgetVault\.latest'/);
});
