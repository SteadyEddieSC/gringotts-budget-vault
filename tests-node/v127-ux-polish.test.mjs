import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTION_INTENTS, V127_RELEASE, actionDescriptor, classifyAction, normalizeActionLabel, validateActionPolicy
} from '../src/v127/ux-policy.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from '../src/v127/roadmap-horizon.js';
import { CURRENT_RELEASE } from '../src/release-manifest.js';

test('v127 interaction policy classifies household actions consistently', () => {
  assert.equal(validateActionPolicy(), true);
  assert.equal(normalizeActionLabel('  Download workbook…  '), 'Download workbook');
  assert.equal(actionDescriptor({ label: 'Retry', id: 'retryV126Enhancements' }), 'Retry retryV126Enhancements');
  assert.equal(classifyAction({ label: 'Save plan' }), 'primary');
  assert.equal(classifyAction({ label: 'Preview import' }), 'preview');
  assert.equal(classifyAction({ label: 'Download 43-sheet Workbook' }), 'export');
  assert.equal(classifyAction({ label: 'Open Stable v105 Rescue' }), 'recovery');
  assert.equal(classifyAction({ label: 'Reset report settings' }), 'destructive');
  assert.equal(classifyAction({ label: 'Cancel' }), 'cancel');
  assert.deepEqual(ACTION_INTENTS, ['primary', 'preview', 'export', 'recovery', 'destructive', 'cancel', 'secondary']);
});

test('v127 preserves the feature freeze and existing household boundaries', () => {
  assert.equal(V127_RELEASE.version, 'v127');
  assert.equal(V127_RELEASE.featureFreeze, true);
  assert.equal(V127_RELEASE.primaryDestinations, 6);
  assert.equal(V127_RELEASE.workbookSheets, 43);
});

test('v127 publishes the maintained ten-release reliability horizon through v136', () => {
  assert.equal(validateRoadmapHorizon(), true);
  assert.equal(ROADMAP_HORIZON.length, 10);
  assert.equal(ROADMAP_HORIZON[0].version, 'v127');
  assert.equal(ROADMAP_HORIZON[0].status, 'shipped');
  assert.equal(ROADMAP_HORIZON[5].version, 'v132');
  assert.equal(ROADMAP_HORIZON[5].status, 'shipped');
  assert.equal(ROADMAP_HORIZON[6].version, 'v133');
  assert.equal(ROADMAP_HORIZON[6].status, 'shipped');
  const current = ROADMAP_HORIZON.find((entry) => entry.status === 'current');
  assert.equal(current?.version, CURRENT_RELEASE.version);
  assert.equal(current?.title, CURRENT_RELEASE.name);
  assert.equal(ROADMAP_HORIZON.at(-1).version, 'v136');
  assert.ok(ROADMAP_HORIZON.every((entry) => entry.safeguards.length > 0));
});
