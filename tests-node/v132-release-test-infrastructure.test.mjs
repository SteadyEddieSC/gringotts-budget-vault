import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CURRENT_RELEASE,
  validateCurrentReleaseManifest
} from '../src/release-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const withoutBlockComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').trim();

test('retains the shipped v132 compatibility entry as a manifest-only re-export', () => {
  assert.equal(validateCurrentReleaseManifest(), true);
  assert.ok(CURRENT_RELEASE.number > 132);
  const compatibilityBoot = read('src/boot-v132.js');
  const executable = withoutBlockComments(compatibilityBoot);
  assert.equal(executable, "export * from './release-manifest.js';");
  assert.doesNotMatch(executable, /registerRelease|MutationObserver|localStorage|sessionStorage|fetch\s*\(/);
});

test('retains the v132 release record and marks it shipped in the maintained roadmap', () => {
  const notes = read('RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md');
  const roadmap = read('ROADMAP.md');
  const source = read('src/v127/roadmap-horizon.js');
  assert.match(notes, /v132 — Release & Test Infrastructure Simplification/);
  assert.match(roadmap, /### v132 — Release & Test Infrastructure Simplification — Shipped/);
  assert.match(source, /version: 'v132', status: 'shipped', title: 'Release & Test Infrastructure Simplification'/);
});

test('keeps the historical v132 release record explicit about preserved architecture and validation', () => {
  const security = read('V132_SECURITY_REVIEW.md');
  const notes = read('RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md');
  assert.match(`${security}\n${notes}`, /45/);
  assert.match(`${security}\n${notes}`, /500,000/);
  assert.match(`${security}\n${notes}`, /43/);
  assert.match(notes, /exact final head/i);
  assert.match(security, /does not expand the household-finance attack surface/i);
  assert.doesNotMatch(`${security}\n${notes}`, /automatic financial action is added/i);
});
