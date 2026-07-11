import { getMonth, read, txs } from '../v103/core.js';
import { householdReportModel } from '../v111/reporting.js';
import { expandedWorkbookSheetsV122 } from '../v122/reporting.js';
import {
  RECURRING_DECISION_KEY,
  buildRecurringCandidates,
  reconcileRecurringDecisions,
  recurringPlanActions,
  sanitizeRecurringDecisionStore
} from './recurring-decisions-model.js';

const LEGACY_PREF_KEY = 'gringottsRecurringPrefs.v1';

function legacyStatuses() {
  const stored = read(LEGACY_PREF_KEY, { statuses: {} });
  return stored?.statuses && typeof stored.statuses === 'object' && !Array.isArray(stored.statuses)
    ? stored.statuses
    : {};
}

function storedDecisions() {
  return sanitizeRecurringDecisionStore(read(RECURRING_DECISION_KEY, {}));
}

export function recurringDecisionReportModelV123() {
  const detection = buildRecurringCandidates(txs(), { legacyStatuses: legacyStatuses() });
  const decisions = reconcileRecurringDecisions(storedDecisions(), detection.candidates);
  const actions = recurringPlanActions(detection.candidates, decisions);
  return { ...detection, decisions, actions };
}

export function recurringDecisionSheetV123(model = recurringDecisionReportModelV123()) {
  return {
    name: 'Recurring Decisions',
    rows: [
      [
        'Candidate ID', 'Merchant', 'Category', 'Masked Account', 'Detected Owner',
        'Occurrences', 'Months', 'First Date', 'Latest Date', 'Cadence', 'Typical Days',
        'Amount Stability', 'Average Amount', 'Latest Amount', 'Previous Amount', 'Change',
        'Simple Annual Footprint', 'Annualized Increase', 'Decision', 'Follow-up Status',
        'Assigned Owner', 'Target Date', 'Notes', 'External Action', 'Transaction Write'
      ],
      ...model.candidates.map((candidate) => {
        const state = model.decisions.activeItems[candidate.candidateId] || {};
        return [
          candidate.candidateId,
          candidate.displayName,
          candidate.category,
          candidate.accountDisplay,
          candidate.owner,
          candidate.occurrences,
          candidate.months,
          candidate.firstDate,
          candidate.latestDate,
          candidate.cadence,
          candidate.typicalDays,
          candidate.amountStability,
          candidate.averageAmount,
          candidate.latestAmount,
          candidate.previousAmount,
          candidate.delta,
          candidate.annualCost,
          candidate.annualIncrease,
          state.decision || 'unresolved',
          state.status || 'not-started',
          state.owner || '',
          state.targetDate || '',
          state.notes || '',
          'Unavailable',
          'Unavailable'
        ];
      })
    ]
  };
}

export function recurringDecisionHistorySheetV123(model = recurringDecisionReportModelV123()) {
  const currentNames = new Map(model.candidates.map((candidate) => [candidate.candidateId, candidate.displayName]));
  return {
    name: 'Recurring Decision History',
    rows: [
      ['Candidate ID', 'Current Merchant', 'Previous Decision', 'Decision', 'Follow-up Status', 'Updated'],
      ...model.decisions.history.map((entry) => [
        entry.candidateId,
        currentNames.get(entry.candidateId) || 'No longer in current evidence',
        entry.previousDecision || '',
        entry.decision || '',
        entry.status,
        entry.updatedAt
      ])
    ]
  };
}

export function expandedWorkbookSheetsV123(
  month = getMonth(),
  reportModel = householdReportModel()
) {
  const recurringModel = recurringDecisionReportModelV123();
  return [
    ...expandedWorkbookSheetsV122(month, reportModel),
    recurringDecisionSheetV123(recurringModel),
    recurringDecisionHistorySheetV123(recurringModel)
  ];
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function recurringDecisionMarkdownV123(model = recurringDecisionReportModelV123(), {
  heading = 'Recurring Cost Decisions'
} = {}) {
  const lines = [
    `## ${heading}`,
    '',
    `Evidence-backed recurring costs: ${model.candidates.length}`,
    `Decisions saved: ${model.decisions.summary.decided}`,
    `Open follow-ups: ${model.decisions.summary.open}`,
    `Simple annual footprint: ${money(model.summary.annualFootprint)}`,
    `Potential cancellation decisions: ${money(model.decisions.summary.potentialCancellation)}`,
    `Annualized increases under review: ${money(model.decisions.summary.increaseUnderReview)}`,
    '',
    '> Annual amounts are simple cadence-based discussion estimates. They are not guaranteed savings or forecasts. Gringotts cannot cancel services, contact merchants, change payments, or connect to external accounts.',
    ''
  ];
  if (!model.actions.length) {
    lines.push('No open Cancel, Renegotiate, or Investigate follow-up is recorded.', '');
    return lines.join('\n');
  }
  model.actions.forEach((action) => {
    lines.push(
      `### ${action.title}`,
      '',
      `- Decision: ${action.decision}`,
      `- Status: ${action.status}`,
      `- Owner: ${action.owner || 'Unassigned'}`,
      `- Target date: ${action.targetDate || 'Not set'}`,
      `- Evidence: ${action.evidence}`,
      `- Next step: ${action.nextStep}`,
      `- Simple annual footprint: ${action.annualCost ? money(action.annualCost) : 'Not estimated'}`
    );
    if (action.annualIncrease) lines.push(`- Annualized latest increase: ${money(action.annualIncrease)}`);
    if (action.notes) lines.push(`- Notes: ${action.notes}`);
    lines.push('');
  });
  return lines.join('\n');
}
