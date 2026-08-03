export const WORKFLOW_REVIEW_KIND = 'gringotts-workflow-evidence-review';
export const WORKFLOW_REVIEW_VERSION = 1;
export const WORKFLOW_INVENTORY_VERSION = 1;
export const WORKFLOW_REVIEW_RELEASE = 'v129';

export const WORKFLOW_INVENTORY = Object.freeze([
  Object.freeze({ id: 'dashboard-review', destination: 'Dashboard', label: 'Household dashboard review', purpose: 'Understand the current household position and identify the next useful task.', cadence: 'daily', safetyBoundary: 'Read-only summary; no automatic financial action.' }),
  Object.freeze({ id: 'bills-paydays', destination: 'Money', label: 'Bills and paydays planning', purpose: 'Review expected household inflows and outflows before they occur.', cadence: 'weekly', safetyBoundary: 'Planning metadata remains separate from transaction evidence.' }),
  Object.freeze({ id: 'recurring-decisions', destination: 'Money', label: 'Recurring-cost decisions', purpose: 'Review evidence-backed recurring costs and record a manual household decision.', cadence: 'monthly', safetyBoundary: 'No merchant contact, cancellation, or payment change is executed.' }),
  Object.freeze({ id: 'month-close', destination: 'Money', label: 'Month close and reconciliation', purpose: 'Reconcile accounts and preserve an immutable aggregate close snapshot.', cadence: 'monthly', safetyBoundary: 'Close history stores aggregates only and never rewrites transaction rows.' }),
  Object.freeze({ id: 'forecast-debt-scenarios', destination: 'Money', label: 'Forecast, debt, and scenario review', purpose: 'Compare household planning assumptions without applying them automatically.', cadence: 'monthly', safetyBoundary: 'Scenarios and forecasts do not execute transfers, payments, or account changes.' }),
  Object.freeze({ id: 'calendar-cash-flow', destination: 'Calendar', label: 'Calendar and cash-flow review', purpose: 'See upcoming household timing in a date-oriented view.', cadence: 'weekly', safetyBoundary: 'Calendar output is informational and does not schedule external financial actions.' }),
  Object.freeze({ id: 'transaction-review', destination: 'Activity', label: 'Transaction review and rules', purpose: 'Review imported activity, resolve classification issues, and manage local rules.', cadence: 'weekly', safetyBoundary: 'Broad transaction writes remain explicit, backup-first, and verified.' }),
  Object.freeze({ id: 'insights-guided-plan', destination: 'Activity', label: 'Insights and Guided Plan', purpose: 'Turn explainable household signals into a manual discussion and follow-up checklist.', cadence: 'weekly', safetyBoundary: 'Recommendations remain advisory and require explicit household decisions.' }),
  Object.freeze({ id: 'reports-exports', destination: 'Reports', label: 'Reports and local exports', purpose: 'Create household summaries, printable reports, and local workbook exports.', cadence: 'monthly', safetyBoundary: 'Exports are explicit local actions and the workbook remains capped at 43 sheets.' }),
  Object.freeze({ id: 'import-restore-diagnostics', destination: 'Tools', label: 'Import, restore, and diagnostics', purpose: 'Bring in supported local data, recover a vault, and inspect runtime health.', cadence: 'as-needed', safetyBoundary: 'Restore is separate, empty vaults are blocked, and stable v105 rescue remains available.' })
]);

const USAGES = new Set(['unreviewed', 'never', 'occasional', 'regular', 'essential']);
const FRICTIONS = new Set(['unreviewed', 'none', 'low', 'medium', 'high']);
const OUTCOMES = new Set(['unreviewed', 'successful', 'partial', 'blocked', 'unclear']);
const SIGNALS = new Set(['none', 'works-well', 'repeated-confusion', 'slow-path', 'abandoned', 'duplicate-surface', 'missing-guidance', 'failure-recovery', 'unmet-need']);
const DISPOSITIONS = new Set(['unreviewed', 'keep', 'simplify', 'consolidate', 'demote', 'remove', 'investigate']);
const WORKFLOW_IDS = new Set(WORKFLOW_INVENTORY.map((workflow) => workflow.id));
const RISKY_NOTE = /[$€£¥]\s*\d|\b\d{4,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:account|routing|card|transaction)\s*(?:number|ending|id|#)|\b(?:visa|mastercard|amex|discover)\b|\b(?:merchant|balance)\s*[:#$]/i;

function fail(message) {
  throw new Error(`Workflow review rejected: ${message}`);
}

function normalizedText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function exactIso(value) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== value) fail('createdAt must be an exact ISO timestamp');
  return value;
}

export function emptyWorkflowObservation(workflowId) {
  if (!WORKFLOW_IDS.has(workflowId)) fail(`unknown workflow id ${workflowId}`);
  return { workflowId, usage: 'unreviewed', friction: 'unreviewed', outcome: 'unreviewed', signal: 'none', disposition: 'unreviewed' };
}

export function sanitizeWorkflowNote(value) {
  const note = normalizedText(value);
  if (!note) return undefined;
  if (note.length > 240) fail('optional observations must be 240 characters or fewer');
  if (RISKY_NOTE.test(note)) fail('optional observations may describe workflow friction only, not financial, account, card, transaction, or contact details');
  return note;
}

export function validateWorkflowObservation(value) {
  if (!value || typeof value !== 'object') fail('observation must be an object');
  if (!WORKFLOW_IDS.has(value.workflowId)) fail(`unknown workflow id ${normalizedText(value.workflowId) || '(empty)'}`);
  if (!USAGES.has(value.usage)) fail('usage value is unsupported');
  if (!FRICTIONS.has(value.friction)) fail('friction value is unsupported');
  if (!OUTCOMES.has(value.outcome)) fail('outcome value is unsupported');
  if (!SIGNALS.has(value.signal)) fail('signal value is unsupported');
  if (!DISPOSITIONS.has(value.disposition)) fail('disposition value is unsupported');
  const note = sanitizeWorkflowNote(value.note);
  return note === undefined
    ? { workflowId: value.workflowId, usage: value.usage, friction: value.friction, outcome: value.outcome, signal: value.signal, disposition: value.disposition }
    : { workflowId: value.workflowId, usage: value.usage, friction: value.friction, outcome: value.outcome, signal: value.signal, disposition: value.disposition, note };
}

export function isWorkflowObservationReviewed(value) {
  const item = validateWorkflowObservation(value);
  return item.usage !== 'unreviewed' || item.friction !== 'unreviewed' || item.outcome !== 'unreviewed' || item.signal !== 'none' || item.disposition !== 'unreviewed' || Boolean(item.note);
}

export function isWorkflowObservationComplete(value) {
  const item = validateWorkflowObservation(value);
  return item.usage !== 'unreviewed' && item.friction !== 'unreviewed' && item.outcome !== 'unreviewed' && item.disposition !== 'unreviewed';
}

export function summarizeWorkflowReview(values) {
  const seen = new Set();
  const observations = values.map((value) => {
    const item = validateWorkflowObservation(value);
    if (seen.has(item.workflowId)) fail(`duplicate workflow observation ${item.workflowId}`);
    seen.add(item.workflowId);
    return item;
  });
  const reviewed = observations.filter(isWorkflowObservationReviewed);
  const complete = observations.filter(isWorkflowObservationComplete);
  const highFrictionWorkflowIds = observations.filter((item) => item.friction === 'high' || item.outcome === 'blocked' || item.signal === 'failure-recovery').map((item) => item.workflowId);
  const consolidationCandidateIds = observations.filter((item) => ['consolidate', 'demote', 'remove'].includes(item.disposition) || ['abandoned', 'duplicate-surface'].includes(item.signal)).map((item) => item.workflowId);
  const unmetNeedWorkflowIds = observations.filter((item) => ['missing-guidance', 'unmet-need', 'repeated-confusion'].includes(item.signal) || item.outcome === 'unclear').map((item) => item.workflowId);
  const keepCandidateIds = observations.filter((item) => ['regular', 'essential'].includes(item.usage) && ['none', 'low'].includes(item.friction) && item.outcome === 'successful' && item.disposition === 'keep').map((item) => item.workflowId);
  let recommendedNextAction = 'Complete the structured household review before changing product scope.';
  if (complete.length === WORKFLOW_INVENTORY.length && highFrictionWorkflowIds.length) recommendedNextAction = 'Prioritize the recorded high-friction workflows in v130 performance and maintenance hardening.';
  else if (complete.length === WORKFLOW_INVENTORY.length && consolidationCandidateIds.length) recommendedNextAction = 'Validate the recorded consolidation candidates before removing or merging any surface.';
  else if (complete.length === WORKFLOW_INVENTORY.length) recommendedNextAction = 'Preserve the working workflows and use v130 to reduce maintenance cost without expanding scope.';
  return {
    inventoryCount: WORKFLOW_INVENTORY.length,
    reviewedCount: reviewed.length,
    completeCount: complete.length,
    highFrictionWorkflowIds,
    consolidationCandidateIds,
    unmetNeedWorkflowIds,
    keepCandidateIds,
    recommendedNextAction
  };
}

export function buildWorkflowReviewBundle(values, createdAt = new Date().toISOString()) {
  const observations = values.map(validateWorkflowObservation).filter(isWorkflowObservationReviewed);
  const summary = summarizeWorkflowReview(values);
  return {
    kind: WORKFLOW_REVIEW_KIND,
    version: WORKFLOW_REVIEW_VERSION,
    release: WORKFLOW_REVIEW_RELEASE,
    inventoryVersion: WORKFLOW_INVENTORY_VERSION,
    createdAt: exactIso(createdAt),
    privacy: {
      manualReviewOnly: true,
      automaticTelemetry: false,
      financialDataIncluded: false,
      persistentStoreUsed: false,
      remoteTransmission: false
    },
    observations,
    summary
  };
}

export function workflowReviewSummaryText(bundle) {
  const summary = bundle.summary;
  return [
    'Gringotts Household Workflow Evidence Review',
    `Release: ${bundle.release}`,
    `Completed workflows: ${summary.completeCount}/${summary.inventoryCount}`,
    `High-friction workflows: ${summary.highFrictionWorkflowIds.length}`,
    `Consolidation candidates: ${summary.consolidationCandidateIds.length}`,
    `Unmet-need signals: ${summary.unmetNeedWorkflowIds.length}`,
    `Keep candidates: ${summary.keepCandidateIds.length}`,
    `Recommended next action: ${summary.recommendedNextAction}`,
    'Privacy: manual structured review only; no financial data, persistence, telemetry, or remote transmission.'
  ].join('\n');
}

export function workflowReviewFilename(createdAt = new Date().toISOString()) {
  return `Gringotts_Workflow_Review_${exactIso(createdAt).replace(/[:.]/g, '-')}.json`;
}
