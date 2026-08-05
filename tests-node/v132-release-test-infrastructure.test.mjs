import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CURRENT_RELEASE,
  CURRENT_RELEASE_TITLE,
  releaseNumber,
  roadmapStatus,
  roadmapStatusLabel,
  validateCurrentReleaseManifest
} from '../src/release-manifest.js';
import {
  currentBootSpecifier,
  currentPackageVersion,
  currentRelease,
  currentTitle,
  currentVersion,
  directionalRoadmapCount,
  shippedRoadmapCount
} from '../tests/helpers/release.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('validates one authoritative v132 current release manifest', () => {
  assert.equal(validateCurrentReleaseManifest(), true);
  assert.equal(CURRENT_RELEASE.version, 'v132');
  assert.equal(CURRENT_RELEASE.number, 132);
  assert.equal(CURRENT_RELEASE.packageVersion, '132.0.0');
  assert.equal(CURRENT_RELEASE.bootSpecifier, 'src/boot-v132.js?v=132release1');
  assert.equal(CURRENT_RELEASE.primaryDestinations, 6);
  assert.equal(CURRENT_RELEASE.workbookSheets, 43);
  assert.equal(CURRENT_RELEASE.budgets.maxRuntimeObservers, 1);
  assert.equal(CURRENT_RELEASE.budgets.maxNetworkRequests, 45);
  assert.equal(CURRENT_RELEASE.budgets.maxScriptBytes, 500000);
});

test('derives roadmap status and counts from the current manifest', () => {
  assert.equal(releaseNumber('v132'), 132);
  assert.equal(roadmapStatus('v127'), 'shipped');
  assert.equal(roadmapStatus('v131'), 'shipped');
  assert.equal(roadmapStatus('v132'), 'current');
  assert.equal(roadmapStatus('v133'), 'directional');
  assert.equal(roadmapStatusLabel('current'), 'Current release');
  assert.equal(shippedRoadmapCount, 5);
  assert.equal(directionalRoadmapCount, 4);
});

test('shares manifest identity with the Playwright helper', () => {
  assert.equal(currentRelease, CURRENT_RELEASE);
  assert.equal(currentVersion, CURRENT_RELEASE.version);
  assert.equal(currentPackageVersion, CURRENT_RELEASE.packageVersion);
  assert.equal(currentTitle, CURRENT_RELEASE_TITLE);
  assert.equal(currentBootSpecifier, CURRENT_RELEASE.bootSpecifier);
});

test('keeps both HTML shells versionless and points them to the manifest-owned boot', () => {
  for (const file of ['index.html', 'app.html']) {
    const source = read(file);
    assert.match(source, /<title>Gringotts Budget Vault<\/title>/);
    assert.ok(source.includes(`src="${CURRENT_RELEASE.bootSpecifier}"`));
    assert.doesNotMatch(source, /<title>[^<]*v\d+/i);
    assert.doesNotMatch(source, /Loading[^<]*\bv\d+\b/i);
  }
});

test('keeps v132 release infrastructure local-only and non-persistent', () => {
  const source = `${read('src/release-manifest.js')}\n${read('src/boot-v132.js')}`;
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
  assert.doesNotMatch(source, /localStorage\.setItem|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(source, /new MutationObserver/);
  assert.doesNotMatch(source, /serviceWorker\.register/);
  assert.doesNotMatch(source, /gringottsBudgetVault\.latest/);
});

test('keeps historical finance and decision releases separate from v132 identity', () => {
  const boot = read('src/boot-v132.js');
  assert.match(boot, /release:'v130'/);
  assert.match(boot, /release:'v131'/);
  assert.match(boot, /window\.GringottsV132/);
  assert.doesNotMatch(boot, /^import .*boot-v131\.js/gm);
  assert.doesNotMatch(boot, /^import .*boot-v130\.js/gm);
  assert.doesNotMatch(boot, /^import .*boot-v129\.js/gm);
});
