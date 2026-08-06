import {
  WORKFLOW_INVENTORY,
  WORKFLOW_REVIEW_KIND,
  WORKFLOW_REVIEW_VERSION,
  WORKFLOW_INVENTORY_VERSION,
  emptyWorkflowObservation,
  validateWorkflowObservation,
  summarizeWorkflowReview
} from '../v129/workflow-evidence.js?v=131review1';
import { buildExportFilename } from '../v134/export-contracts.js?v=134contracts1';

export const DECISION_GATE_KIND = 'gringotts-observed-needs-decision';
export const DECISION_GATE_VERSION = 1;
export const DECISION_GATE_RELEASE = 'v131';
export const DECISION_DISPOSITIONS = Object.freeze(['unselected', 'hold', 'maintenance-only', 'candidate-proposal']);

const WORKFLOW_IDS = new Set(WORKFLOW_INVENTORY.map((workflow) => workflow.id));
const RISKY_TEXT = /[$€£¥]\s*\d|\b\d{4,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:account|routing|card|transaction)\s*(?:number|ending|id|#)|\b(?:visa|mastercard|amex|discover)\b|\b(?:merchant|balance)\s*[:#$]/i;

function fail(message) {
  throw new Error(`Decision gate rejected: ${message}`);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function exactIso(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) fail('createdAt must be an exact ISO timestamp');
  return value;
}

function arraysEqual(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function rebuildReview(bundle) {
  if (!bundle || typeof bundle !== 'object') fail('workflow review bundle must be an object');
  if (bundle.kind !== WORKFLOW_REVIEW_KIND) fail('workflow review kind is unsupported');
  if (bundle.version !== WORKFLOW_REVIEW_VERSION) fail('workflow review version is unsupported');
  if (bundle.inventoryVersion !== WORKFLOW_INVENTORY_VERSION) fail('workflow inventory version is unsupported');
  if (!bundle.privacy || bundle.privacy.manualReviewOnly !== true || bundle.privacy.automaticTelemetry !== false ||
      bundle.privacy.financialDataIncluded !== false || bundle.privacy.persistentStoreUsed !== false ||
      bundle.privacy.remoteTransmission !== false) {
    fail('workflow review privacy declaration is incomplete');
  }
  const values = new Map(WORKFLOW_INVENTORY.map((workflow) => [workflow.id, emptyWorkflowObservation(workflow.id)]));
  const seen = new Set();
  if (!Array.isArray(bundle.observations)) fail('workflow review observations must be an array');
  for (const value of bundle.observations) {
    const item = validateWorkflowObservation(value);
    if (!WORKFLOW_IDS.has(item.workflowId)) fail(`unknown workflow id ${item.workflowId}`);
    if (seen.has(item.workflowId)) fail(`duplicate workflow observation ${item.workflowId}`);
    seen.add(item.workflowId);
    values.set(item.workflowId, item);
  }
  const observations = WORKFLOW_INVENTORY.map((workflow) => values.get(workflow.id));
  const summary = summarizeWorkflowReview(observations);
  const supplied = bundle.summary;
  if (!supplied || supplied.inventoryCount !== summary.inventoryCount || supplied.reviewedCount !== summary.reviewedCount ||
      supplied.completeCount !== summary.completeCount ||
      !arraysEqual(supplied.highFrictionWorkflowIds, summary.highFrictionWorkflowIds) ||
      !arraysEqual(supplied.consolidationCandidateIds, summary.consolidationCandidateIds) ||
      !arraysEqual(supplied.unmetNeedWorkflowIds, summary.unmetNeedWorkflowIds) ||
      !arraysEqual(supplied.keepCandidateIds, summary.keepCandidateIds)) {
    fail('workflow review summary does not match its observations');
  }
  return Object.freeze({
    release: String(bundle.release || 'v129'),
    createdAt: exactIso(bundle.createdAt),
    observations,
    summary
  });
}

export function validateWorkflowReviewBundle(bundle) {
  return rebuildReview(bundle);
}

export function sanitizeDecisionRationale(value) {
  const rationale = normalizeText(value);
  if (!rationale) return '';
  if (rationale.length > 320) fail('decision rationale must be 320 characters or fewer');
  if (RISKY_TEXT.test(rationale)) fail('decision rationale may describe workflow scope only, not financial, account, card, transaction, merchant, balance, or contact details');
  return rationale;
}

export function evaluateRuntimeEvidence(snapshot) {
  const failures = [];
  const input = snapshot?.current?.input || {};
  const evaluation = snapshot?.current?.evaluation;
  if (!snapshot || typeof snapshot !== 'object') failures.push('v130 runtime snapshot is unavailable.');
  if (snapshot?.memoryOnlyHistory !== true) failures.push('Runtime history is not declared memory-only.');
  if (snapshot?.financialDataRead !== false) failures.push('Runtime evidence does not preserve the no-financial-data boundary.');
  if (snapshot?.persistentStoreAdded !== false) failures.push('Runtime evidence reports a persistent store.');
  if (snapshot?.networkImplementationAdded !== false) failures.push('Runtime evidence reports a network implementation.');
  if (snapshot?.observerAdded !== false) failures.push('Runtime evidence reports an additional observer.');
  if (snapshot?.serviceWorkerAdded !== false) failures.push('Runtime evidence reports a service worker.');
  if (input.runtimeObservers !== 1) failures.push('Exactly one v126-owned runtime observer is required.');
  if (input.primaryDestinations !== 6) failures.push('Exactly six primary destinations are required.');
  if (input.workbookSheets !== 43) failures.push('The workbook must remain capped at 43 sheets.');
  if (input.dispatcherOwned !== true || input.coordinatorOwned !== true) failures.push('Workflow runtime ownership is not coordinator and dispatcher controlled.');
  if (!evaluation || evaluation.ok !== true) failures.push('Current measured runtime budgets have not passed.');
  return Object.freeze({ ok: failures.length === 0, failures });
}

function evidenceGroups(summary) {
  return Object.freeze({
    keep: [...summary.keepCandidateIds],
    highFriction: [...summary.highFrictionWorkflowIds],
    consolidate: [...summary.consolidationCandidateIds],
    investigate: [...summary.unmetNeedWorkflowIds]
  });
}

export function evaluateDecisionGate({ reviewBundle = null, runtimeSnapshot = null, disposition = 'unselected', rationale = '' } = {}) {
  if (!DECISION_DISPOSITIONS.includes(disposition)) fail('decision disposition is unsupported');
  const runtime = evaluateRuntimeEvidence(runtimeSnapshot);
  const review = reviewBundle ? rebuildReview(reviewBundle) : null;
  const summary = review?.summary || {
    inventoryCount: WORKFLOW_INVENTORY.length,
    reviewedCount: 0,
    completeCount: 0,
    highFrictionWorkflowIds: [],
    consolidationCandidateIds: [],
    unmetNeedWorkflowIds: [],
    keepCandidateIds: []
  };
  const sanitizedRationale = sanitizeDecisionRationale(rationale);
  let state = 'evidence-incomplete';
  let message = `Complete all ${summary.inventoryCount} workflow observations before changing product scope.`;
  if (summary.completeCount === summary.inventoryCount && !runtime.ok) {
    state = 'runtime-blocked';
    message = 'Workflow evidence is complete, but runtime or maintenance evidence blocks a scope decision.';
  } else if (summary.completeCount === summary.inventoryCount && runtime.ok) {
    state = 'decision-ready';
    message = 'Evidence is complete. Feature freeze remains active until an explicit human disposition is recorded.';
    if (disposition === 'hold') {
      state = 'hold';
      message = 'Feature freeze preserved. No product-scope change is approved.';
    } else if (disposition === 'maintenance-only') {
      if (!summary.highFrictionWorkflowIds.length && !summary.consolidationCandidateIds.length) {
        fail('maintenance-only requires recorded friction or consolidation evidence');
      }
      if (!sanitizedRationale) fail('maintenance-only requires a workflow-only rationale');
      state = 'maintenance-only';
      message = 'Maintenance or simplification work may be scoped; no household-finance capability is approved.';
    } else if (disposition === 'candidate-proposal') {
      if (!summary.unmetNeedWorkflowIds.length) fail('candidate-proposal requires at least one unmet-need or unclear-outcome signal');
      if (!sanitizedRationale) fail('candidate-proposal requires a workflow-only rationale');
      state = 'candidate-proposal';
      message = 'One narrowly evidenced proposal may be written for later review; it is not approved or implemented by v131.';
    }
  }
  return Object.freeze({
    state,
    message,
    featureFreeze: true,
    reviewLoaded: Boolean(review),
    reviewRelease: review?.release || null,
    reviewCreatedAt: review?.createdAt || null,
    summary,
    groups: evidenceGroups(summary),
    runtime,
    disposition: state === 'decision-ready' || state === 'evidence-incomplete' || state === 'runtime-blocked' ? 'unselected' : disposition,
    rationale: state === 'maintenance-only' || state === 'candidate-proposal' || state === 'hold' ? sanitizedRationale : ''
  });
}

export function buildDecisionRecord(input, createdAt = new Date().toISOString()) {
  const result = evaluateDecisionGate(input);
  if (!['hold', 'maintenance-only', 'candidate-proposal'].includes(result.state)) {
    fail('an explicit eligible disposition is required before exporting a decision record');
  }
  return {
    kind: DECISION_GATE_KIND,
    version: DECISION_GATE_VERSION,
    release: DECISION_GATE_RELEASE,
    createdAt: exactIso(createdAt),
    featureFreeze: true,
    decision: {
      state: result.state,
      message: result.message,
      rationale: result.rationale
    },
    evidence: {
      reviewRelease: result.reviewRelease,
      reviewCreatedAt: result.reviewCreatedAt,
      completedWorkflows: result.summary.completeCount,
      inventoryCount: result.summary.inventoryCount,
      highFrictionWorkflowIds: result.groups.highFriction,
      consolidationCandidateIds: result.groups.consolidate,
      unmetNeedWorkflowIds: result.groups.investigate,
      keepCandidateIds: result.groups.keep,
      runtimePassed: result.runtime.ok,
      runtimeFailures: [...result.runtime.failures]
    },
    privacy: {
      manualDecisionOnly: true,
      financialDataIncluded: false,
      persistentStoreUsed: false,
      automaticTelemetry: false,
      remoteTransmission: false,
      automaticApproval: false
    }
  };
}

export function decisionRecordSummaryText(record) {
  return [
    'Gringotts Observed Needs Decision Gate',
    `Release: ${record.release}`,
    `Decision: ${record.decision.state}`,
    `Completed workflows: ${record.evidence.completedWorkflows}/${record.evidence.inventoryCount}`,
    `Runtime evidence passed: ${record.evidence.runtimePassed ? 'Yes' : 'No'}`,
    `High-friction workflows: ${record.evidence.highFrictionWorkflowIds.length}`,
    `Consolidation candidates: ${record.evidence.consolidationCandidateIds.length}`,
    `Unmet-need signals: ${record.evidence.unmetNeedWorkflowIds.length}`,
    `Keep candidates: ${record.evidence.keepCandidateIds.length}`,
    `Outcome: ${record.decision.message}`,
    record.decision.rationale ? `Rationale: ${record.decision.rationale}` : '',
    'Privacy: manual decision only; no financial data, persistence, telemetry, remote transmission, or automatic approval.'
  ].filter(Boolean).join('\n');
}

export function decisionRecordFilename(createdAt = new Date().toISOString()) {
  return buildExportFilename('decision-record', { createdAt:exactIso(createdAt) });
}
