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
  const boot = read('src/boot-v120.js');
  const v115 = read('src/v115/release.js');
  assert.match(controller, /window\.GringottsV115\?\.importHistory/);
  assert.doesNotMatch(controller, /bank-import\.js/);
  assert.match(v115, /bank-import\.js\?v=115bankimport2/);
  assert.match(boot, /import\('\.\/v115\/release\.js\?v=120receipts1'\)/);
  assert.match(boot, /import\('\.\/v119\/release\.js\?v=120receipts1'\)/);
  assert.doesNotMatch(boot, /bank-import\.js\?v=120/);
});

test('v119 defers presentation writes when the v120 layer owns the route', () => {
  const release = read('src/v119/release.js');
  assert.match(release, /function v120OwnsPresentation\(\)/);
  assert.match(release, /window\.GringottsV120\?\.release === 'v120'/);
  assert.match(release, /if \(!v120OwnsPresentation\(\)\) \{[\s\S]*report-kicker/);
  assert.match(release, /function enhanceRoadmap\(root\) \{\s*if \(v120OwnsPresentation\(\)\) return;/);
  assert.match(release, /function enhanceImportPage\(page\) \{\s*if \(!v120OwnsPresentation\(\)\)/);
  assert.match(release, /module\.enhanceProfileVersioning\(page\)/);
});
