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
  assert.equal(withoutBlockComments(compatibilityBoot), "export * from './release-manifest.js';");
  assert.doesNotMatch(compatibilityBoot, /registerRelease|MutationObserver|localStorage|sessionStorage|fetch\s*\(/);
});

test('retains the v132 release record and marks it shipped in the maintained roadmap', () => {
  const notes = read('RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md');
  const roadmap = read('ROADMAP.md');
  const source = read('src/v127/roadmap-horizon.js');
  assert.match(notes, /v132 — Release & Test Infrastructure Simplification/);
  assert.match(roadmap, /### v132 — Release & Test Infrastructure Simplification — Shipped/);
  assert.match(source, /version: 'v132', status: 'shipped', title: 'Release & Test Infrastructure Simplification'/);
});

test('keeps the v132 infrastructure documentation explicit about unchanged safety gates', () => {
  const security = read('V132_SECURITY_REVIEW.md');
  const notes = read('RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md');
  for (const source of [security, notes]) {
    assert.match(source, /45/);
    assert.match(source, /500,000/);
    assert.match(source, /43/);
    assert.doesNotMatch(source, /automatic financial action is added/i);
  }
});
