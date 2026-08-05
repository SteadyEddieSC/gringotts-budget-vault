import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WORKFLOW_INVENTORY,
  buildWorkflowReviewBundle
} from '../src/v129/workflow-evidence.js';
import {
  validateWorkflowReviewBundle,
  evaluateDecisionGate,
  evaluateRuntimeEvidence,
  buildDecisionRecord,
  decisionRecordSummaryText,
  decisionRecordFilename,
  sanitizeDecisionRationale
} from '../src/v131/decision-contracts.js';

function completeObservations() {
  return WORKFLOW_INVENTORY.map((workflow, index) => ({
    workflowId:workflow.id,
    usage:index === 0 ? 'essential' : 'regular',
    friction:index === 1 ? 'high' : 'low',
    outcome:index === 2 ? 'unclear' : 'successful',
    signal:index === 2 ? 'unmet-need' : 'works-well',
    disposition:index === 1 ? 'simplify' : 'keep',
    ...(index === 1 ? { note:'The weekly sequence repeats guidance and should be simplified.' } : {})
  }));
}

function reviewBundle(values = completeObservations()) {
  return buildWorkflowReviewBundle(values, '2026-08-05T02:00:00.000Z');
}

function runtimeSnapshot(overrides = {}) {
  return {
    release:'v130',
    memoryOnlyHistory:true,
    financialDataRead:false,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false,
    current:{
      input:{
        runtimeObservers:1,
        primaryDestinations:6,
        workbookSheets:43,
        dispatcherOwned:true,
        coordinatorOwned:true
      },
      evaluation:{ ok:true, failures:[] }
    },
    ...overrides
  };
}

test('validates a complete privacy-filtered v129 workflow review bundle', () => {
  const result = validateWorkflowReviewBundle(reviewBundle());
  assert.equal(result.summary.completeCount, 10);
  assert.equal(result.summary.highFrictionWorkflowIds.length, 1);
  assert.equal(result.summary.unmetNeedWorkflowIds.length, 1);
});

test('rejects mismatched review summaries, duplicate workflows, and weakened privacy', () => {
  const mismatched = structuredClone(reviewBundle());
  mismatched.summary.completeCount = 9;
  assert.throws(() => validateWorkflowReviewBundle(mismatched), /summary does not match/);

  const duplicate = structuredClone(reviewBundle());
  duplicate.observations.push({ ...duplicate.observations[0] });
  assert.throws(() => validateWorkflowReviewBundle(duplicate), /duplicate workflow observation/);

  const weakened = structuredClone(reviewBundle());
  weakened.privacy.financialDataIncluded = true;
  assert.throws(() => validateWorkflowReviewBundle(weakened), /privacy declaration/);
});

test('keeps the feature freeze closed until all ten observations are complete', () => {
  const values = completeObservations();
  values[0] = {
    workflowId:values[0].workflowId,
    usage:'unreviewed',
    friction:'low',
    outcome:'successful',
    signal:'works-well',
    disposition:'keep'
  };
  const result = evaluateDecisionGate({ reviewBundle:reviewBundle(values), runtimeSnapshot:runtimeSnapshot() });
  assert.equal(result.state, 'evidence-incomplete');
  assert.equal(result.featureFreeze, true);
  assert.equal(result.disposition, 'unselected');
});

test('blocks scope decisions when v130 runtime evidence is unhealthy', () => {
  const runtime = runtimeSnapshot({
    current:{
      input:{
        runtimeObservers:2,
        primaryDestinations:6,
        workbookSheets:43,
        dispatcherOwned:true,
        coordinatorOwned:true
      },
      evaluation:{ ok:false, failures:['observer budget exceeded'] }
    }
  });
  const evaluated = evaluateRuntimeEvidence(runtime);
  assert.equal(evaluated.ok, false);
  assert.ok(evaluated.failures.some((failure) => /one v126-owned runtime observer/i.test(failure)));

  const result = evaluateDecisionGate({ reviewBundle:reviewBundle(), runtimeSnapshot:runtime });
  assert.equal(result.state, 'runtime-blocked');
  assert.equal(result.featureFreeze, true);
});

test('permits only explicit hold, maintenance, or proposal records after the gate is ready', () => {
  const ready = evaluateDecisionGate({ reviewBundle:reviewBundle(), runtimeSnapshot:runtimeSnapshot() });
  assert.equal(ready.state, 'decision-ready');
  assert.equal(ready.disposition, 'unselected');

  const hold = evaluateDecisionGate({
    reviewBundle:reviewBundle(),
    runtimeSnapshot:runtimeSnapshot(),
    disposition:'hold'
  });
  assert.equal(hold.state, 'hold');

  const maintenance = evaluateDecisionGate({
    reviewBundle:reviewBundle(),
    runtimeSnapshot:runtimeSnapshot(),
    disposition:'maintenance-only',
    rationale:'Simplify the repeated weekly planning sequence.'
  });
  assert.equal(maintenance.state, 'maintenance-only');

  const proposal = evaluateDecisionGate({
    reviewBundle:reviewBundle(),
    runtimeSnapshot:runtimeSnapshot(),
    disposition:'candidate-proposal',
    rationale:'Write one bounded proposal for the unclear workflow outcome.'
  });
  assert.equal(proposal.state, 'candidate-proposal');
  assert.match(proposal.message, /not approved or implemented/i);
});

test('requires evidence-backed rationales and rejects financial or identifying details', () => {
  assert.throws(() => evaluateDecisionGate({
    reviewBundle:reviewBundle(),
    runtimeSnapshot:runtimeSnapshot(),
    disposition:'maintenance-only'
  }), /requires a workflow-only rationale/);

  assert.throws(() => sanitizeDecisionRationale('Card ending 1234 should be changed.'), /Decision gate rejected/);
  assert.throws(() => sanitizeDecisionRationale('Balance: $500'), /Decision gate rejected/);
  assert.equal(sanitizeDecisionRationale('Reduce duplicate guidance in the review sequence.'), 'Reduce duplicate guidance in the review sequence.');
});

test('exports a sanitized local decision record without automatic approval', () => {
  const record = buildDecisionRecord({
    reviewBundle:reviewBundle(),
    runtimeSnapshot:runtimeSnapshot(),
    disposition:'candidate-proposal',
    rationale:'Write one bounded proposal for the unclear workflow outcome.'
  }, '2026-08-05T03:00:00.000Z');

  assert.equal(record.kind, 'gringotts-observed-needs-decision');
  assert.equal(record.release, 'v131');
  assert.equal(record.featureFreeze, true);
  assert.deepEqual(record.privacy, {
    manualDecisionOnly:true,
    financialDataIncluded:false,
    persistentStoreUsed:false,
    automaticTelemetry:false,
    remoteTransmission:false,
    automaticApproval:false
  });
  assert.equal('observations' in record.evidence, false);
  assert.match(decisionRecordSummaryText(record), /not approved or implemented/i);
  assert.equal(decisionRecordFilename(record.createdAt), 'Gringotts_Decision_Gate_2026-08-05T03-00-00-000Z.json');
});
