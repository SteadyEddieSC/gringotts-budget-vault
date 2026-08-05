export const DECISION_GATE_KIND = 'gringotts-observed-needs-decision' as const;
export const DECISION_GATE_VERSION = 1 as const;
export const DECISION_GATE_RELEASE = 'v131' as const;

export const WORKFLOW_IDS = [
  'dashboard-review',
  'bills-paydays',
  'recurring-decisions',
  'month-close',
  'forecast-debt-scenarios',
  'calendar-cash-flow',
  'transaction-review',
  'insights-guided-plan',
  'reports-exports',
  'import-restore-diagnostics'
] as const;

export type WorkflowId = typeof WORKFLOW_IDS[number];
export type DecisionDisposition = 'unselected' | 'hold' | 'maintenance-only' | 'candidate-proposal';
export type GateState = 'evidence-incomplete' | 'runtime-blocked' | 'decision-ready' | 'hold' | 'maintenance-only' | 'candidate-proposal';

export interface WorkflowReviewSummary {
  inventoryCount: number;
  reviewedCount: number;
  completeCount: number;
  highFrictionWorkflowIds: WorkflowId[];
  consolidationCandidateIds: WorkflowId[];
  unmetNeedWorkflowIds: WorkflowId[];
  keepCandidateIds: WorkflowId[];
}

export interface RuntimeInput {
  runtimeObservers: number;
  primaryDestinations: number;
  workbookSheets: number;
  dispatcherOwned: boolean;
  coordinatorOwned: boolean;
}

export interface RuntimeSnapshot {
  memoryOnlyHistory: boolean;
  financialDataRead: boolean;
  persistentStoreAdded: boolean;
  networkImplementationAdded: boolean;
  observerAdded: boolean;
  serviceWorkerAdded: boolean;
  current: {
    input: RuntimeInput;
    evaluation: { ok: boolean } | null;
  };
}

export interface RuntimeEvidence {
  ok: boolean;
  failures: string[];
}

export interface DecisionGateResult {
  state: GateState;
  message: string;
  featureFreeze: true;
  reviewLoaded: boolean;
  summary: WorkflowReviewSummary;
  runtime: RuntimeEvidence;
  disposition: DecisionDisposition;
  rationale: string;
}

const RISKY_TEXT = /[$€£¥]\s*\d|\b\d{4,}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:account|routing|card|transaction)\s*(?:number|ending|id|#)|\b(?:visa|mastercard|amex|discover)\b|\b(?:merchant|balance)\s*[:#$]/i;

function fail(message: string): never {
  throw new Error(`Decision gate rejected: ${message}`);
}

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function sanitizeDecisionRationale(value: unknown): string {
  const rationale = normalizeText(value);
  if (!rationale) return '';
  if (rationale.length > 320) fail('decision rationale must be 320 characters or fewer');
  if (RISKY_TEXT.test(rationale)) {
    fail('decision rationale may describe workflow scope only, not financial, account, card, transaction, merchant, balance, or contact details');
  }
  return rationale;
}

export function evaluateRuntimeEvidence(snapshot: RuntimeSnapshot | null | undefined): RuntimeEvidence {
  const failures: string[] = [];
  const input = snapshot?.current?.input;
  if (!snapshot || !input) failures.push('v130 runtime snapshot is unavailable.');
  if (snapshot?.memoryOnlyHistory !== true) failures.push('Runtime history is not declared memory-only.');
  if (snapshot?.financialDataRead !== false) failures.push('Runtime evidence does not preserve the no-financial-data boundary.');
  if (snapshot?.persistentStoreAdded !== false) failures.push('Runtime evidence reports a persistent store.');
  if (snapshot?.networkImplementationAdded !== false) failures.push('Runtime evidence reports a network implementation.');
  if (snapshot?.observerAdded !== false) failures.push('Runtime evidence reports an additional observer.');
  if (snapshot?.serviceWorkerAdded !== false) failures.push('Runtime evidence reports a service worker.');
  if (input?.runtimeObservers !== 1) failures.push('Exactly one v126-owned runtime observer is required.');
  if (input?.primaryDestinations !== 6) failures.push('Exactly six primary destinations are required.');
  if (input?.workbookSheets !== 43) failures.push('The workbook must remain capped at 43 sheets.');
  if (input?.dispatcherOwned !== true || input?.coordinatorOwned !== true) {
    failures.push('Workflow runtime ownership is not coordinator and dispatcher controlled.');
  }
  if (snapshot?.current?.evaluation?.ok !== true) failures.push('Current measured runtime budgets have not passed.');
  return { ok: failures.length === 0, failures };
}

export function evaluateDecisionState(
  summary: WorkflowReviewSummary,
  runtime: RuntimeEvidence,
  disposition: DecisionDisposition,
  rationaleValue: unknown
): DecisionGateResult {
  const rationale = sanitizeDecisionRationale(rationaleValue);
  let state: GateState = 'evidence-incomplete';
  let message = `Complete all ${summary.inventoryCount} workflow observations before changing product scope.`;
  let effectiveDisposition: DecisionDisposition = 'unselected';
  let effectiveRationale = '';

  if (summary.completeCount === summary.inventoryCount && !runtime.ok) {
    state = 'runtime-blocked';
    message = 'Workflow evidence is complete, but runtime or maintenance evidence blocks a scope decision.';
  } else if (summary.completeCount === summary.inventoryCount && runtime.ok) {
    state = 'decision-ready';
    message = 'Evidence is complete. Feature freeze remains active until an explicit human disposition is recorded.';
    if (disposition === 'hold') {
      state = 'hold';
      effectiveDisposition = disposition;
      effectiveRationale = rationale;
      message = 'Feature freeze preserved. No product-scope change is approved.';
    } else if (disposition === 'maintenance-only') {
      if (!summary.highFrictionWorkflowIds.length && !summary.consolidationCandidateIds.length) {
        fail('maintenance-only requires recorded friction or consolidation evidence');
      }
      if (!rationale) fail('maintenance-only requires a workflow-only rationale');
      state = 'maintenance-only';
      effectiveDisposition = disposition;
      effectiveRationale = rationale;
      message = 'Maintenance or simplification work may be scoped; no household-finance capability is approved.';
    } else if (disposition === 'candidate-proposal') {
      if (!summary.unmetNeedWorkflowIds.length) {
        fail('candidate-proposal requires at least one unmet-need or unclear-outcome signal');
      }
      if (!rationale) fail('candidate-proposal requires a workflow-only rationale');
      state = 'candidate-proposal';
      effectiveDisposition = disposition;
      effectiveRationale = rationale;
      message = 'One narrowly evidenced proposal may be written for later review; it is not approved or implemented by v131.';
    }
  }

  return {
    state,
    message,
    featureFreeze: true,
    reviewLoaded: summary.reviewedCount > 0,
    summary,
    runtime,
    disposition: effectiveDisposition,
    rationale: effectiveRationale
  };
}
