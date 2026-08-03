import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  WORKFLOW_INVENTORY,
  WORKFLOW_REVIEW_KIND,
  buildWorkflowReviewBundle,
  emptyWorkflowObservation,
  isWorkflowObservationComplete,
  sanitizeWorkflowNote,
  summarizeWorkflowReview,
  validateWorkflowObservation,
  workflowReviewFilename,
  workflowReviewSummaryText
} from '../src/v129/workflow-evidence.js';

const createdAt = '2026-08-03T19:15:00.000Z';

function completeObservation(workflowId, overrides = {}) {
  return {
    workflowId,
    usage: 'regular',
    friction: 'low',
    outcome: 'successful',
    signal: 'works-well',
    disposition: 'keep',
    ...overrides
  };
}

function generatedPrivateDetail() {
  return ['Acc', 'ount num', 'ber ', '12', '345', '6789', ' should not be accepted.'].join('');
}

test('inventories ten bounded workflows across all six primary destinations', () => {
  assert.equal(WORKFLOW_INVENTORY.length, 10);
  assert.deepEqual([...new Set(WORKFLOW_INVENTORY.map((item) => item.destination))].sort(), ['Activity', 'Calendar', 'Dashboard', 'Money', 'Reports', 'Tools']);
  assert.equal(new Set(WORKFLOW_INVENTORY.map((item) => item.id)).size, WORKFLOW_INVENTORY.length);
  assert.ok(WORKFLOW_INVENTORY.every((item) => item.safetyBoundary && item.purpose));
});

test('creates empty observations and validates structured workflow evidence', () => {
  const empty = emptyWorkflowObservation('dashboard-review');
  assert.deepEqual(empty, {
    workflowId: 'dashboard-review', usage: 'unreviewed', friction: 'unreviewed', outcome: 'unreviewed', signal: 'none', disposition: 'unreviewed'
  });
  assert.equal(isWorkflowObservationComplete(empty), false);
  const complete = validateWorkflowObservation(completeObservation('dashboard-review', { note: 'The sequence is easy to follow.' }));
  assert.equal(isWorkflowObservationComplete(complete), true);
  assert.equal(complete.note, 'The sequence is easy to follow.');
});

test('rejects unsupported workflows, duplicate observations, and likely private detail', () => {
  assert.throws(() => emptyWorkflowObservation('unknown-workflow'), /unknown workflow id/i);
  assert.throws(() => validateWorkflowObservation({ ...completeObservation('dashboard-review'), usage: 'hourly' }), /usage value is unsupported/i);
  assert.throws(() => summarizeWorkflowReview([
    completeObservation('dashboard-review'),
    completeObservation('dashboard-review')
  ]), /duplicate workflow observation/i);
  assert.throws(() => sanitizeWorkflowNote(generatedPrivateDetail()), /workflow friction only/i);
  assert.throws(() => sanitizeWorkflowNote('x'.repeat(241)), /240 characters or fewer/i);
});

test('summarizes high friction, consolidation, unmet needs, and keep candidates without automatic deletion', () => {
  const values = WORKFLOW_INVENTORY.map((workflow) => completeObservation(workflow.id));
  values[1] = completeObservation('bills-paydays', { friction: 'high', outcome: 'blocked', signal: 'failure-recovery', disposition: 'simplify' });
  values[2] = completeObservation('recurring-decisions', { usage: 'never', friction: 'medium', outcome: 'unclear', signal: 'duplicate-surface', disposition: 'consolidate' });
  const summary = summarizeWorkflowReview(values);
  assert.equal(summary.completeCount, 10);
  assert.deepEqual(summary.highFrictionWorkflowIds, ['bills-paydays']);
  assert.deepEqual(summary.consolidationCandidateIds, ['recurring-decisions']);
  assert.deepEqual(summary.unmetNeedWorkflowIds, ['recurring-decisions']);
  assert.ok(summary.keepCandidateIds.includes('dashboard-review'));
  assert.match(summary.recommendedNextAction, /v130 performance and maintenance hardening/i);
  assert.doesNotMatch(summary.recommendedNextAction, /automatically remove|delete/i);
});

test('builds a sanitized manual-only local review bundle', () => {
  const values = WORKFLOW_INVENTORY.map((workflow) => emptyWorkflowObservation(workflow.id));
  values[0] = completeObservation('dashboard-review', { usage: 'essential', note: 'The opening summary is clear and useful.' });
  values[8] = completeObservation('reports-exports', { friction: 'medium', outcome: 'partial', signal: 'slow-path', disposition: 'simplify' });
  const bundle = buildWorkflowReviewBundle(values, createdAt);
  assert.equal(bundle.kind, WORKFLOW_REVIEW_KIND);
  assert.equal(bundle.release, 'v129');
  assert.equal(bundle.observations.length, 2);
  assert.deepEqual(bundle.privacy, {
    manualReviewOnly: true,
    automaticTelemetry: false,
    financialDataIncluded: false,
    persistentStoreUsed: false,
    remoteTransmission: false
  });
  assert.doesNotMatch(JSON.stringify(bundle), /transaction_id|account_id|merchant_name|vault payload/i);
  assert.match(workflowReviewSummaryText(bundle), /Recommended next action:/);
  assert.equal(workflowReviewFilename(createdAt), 'Gringotts_Workflow_Review_2026-08-03T19-15-00-000Z.json');
});

test('workflow evidence model contains no browser persistence, network, analytics, or vault-reading implementation', () => {
  const source = fs.readFileSync(new URL('../src/v129/workflow-evidence.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(source, /gringottsBudgetVault\.latest|transactions\s*\[/);
  assert.doesNotMatch(source, /analytics|clickstream|fingerprint/i);
  assert.match(source, /automaticTelemetry: false/);
  assert.match(source, /financialDataIncluded: false/);
});
