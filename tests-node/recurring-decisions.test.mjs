import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FOLLOW_UP_STATUSES,
  MAX_RECURRING_DECISIONS,
  MAX_RECURRING_HISTORY,
  RECURRING_DECISION_KEY,
  RECURRING_DECISIONS,
  buildRecurringCandidates,
  reconcileRecurringDecisions,
  recurringDecisionSignature,
  recurringPlanActions,
  sanitizeRecurringDecisionStore,
  setRecurringDecision
} from '../src/v123/recurring-decisions-model.js';

const transactions = [
  { id: 'stream-1', date: '2026-03-05', name: 'StreamFlix 7788', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A' },
  { id: 'stream-2', date: '2026-04-05', name: 'StreamFlix 7788', amount: 12, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A' },
  { id: 'stream-3', date: '2026-05-05', name: 'StreamFlix 7788', amount: 14, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A' },
  { id: 'stream-pending', date: '2026-06-05', name: 'StreamFlix 7788', amount: 14, type: 'Expense', category: 'Entertainment', account: 'Family Card 1234', owner: 'Adult A', pending: true },
  { id: 'stream-other-card-1', date: '2026-04-12', name: 'StreamFlix 7788', amount: 8, type: 'Expense', category: 'Entertainment', account: 'Travel Card 9876', owner: 'Adult B' },
  { id: 'stream-other-card-2', date: '2026-05-12', name: 'StreamFlix 7788', amount: 8, type: 'Expense', category: 'Entertainment', account: 'Travel Card 9876', owner: 'Adult B' },
  { id: 'utility-1', date: '2026-03-15', name: 'Synthetic Utility', amount: 100, type: 'Expense', category: 'Utilities', account: 'Checking 2222', owner: 'Adult A' },
  { id: 'utility-2', date: '2026-04-15', name: 'Synthetic Utility', amount: 118, type: 'Expense', category: 'Utilities', account: 'Checking 2222', owner: 'Adult A' },
  { id: 'one-time', date: '2026-05-22', name: 'Synthetic Appliance', amount: 500, type: 'Expense', category: 'Household', account: 'Family Card 1234', owner: 'Adult A' },
  { id: 'income', date: '2026-05-01', name: 'Synthetic Pay', amount: -2000, type: 'Income', category: 'Income', account: 'Checking 2222', owner: 'Adult A' }
];

test('exports bounded v123 storage and decision enums', () => {
  assert.equal(RECURRING_DECISION_KEY, 'gringottsRecurringDecisions.v1');
  assert.equal(MAX_RECURRING_DECISIONS, 120);
  assert.equal(MAX_RECURRING_HISTORY, 240);
  assert.deepEqual(RECURRING_DECISIONS, ['keep', 'cancel', 'renegotiate', 'investigate', 'completed']);
  assert.deepEqual(FOLLOW_UP_STATUSES, ['not-started', 'planned', 'waiting', 'done']);
});

test('detects posted recurring evidence while excluding pending, income, and one-time charges', () => {
  const result = buildRecurringCandidates(transactions);
  assert.equal(result.summary.pendingExcluded, 1);
  assert.equal(result.summary.nonExpenseExcluded, 1);
  assert.equal(result.candidates.some((candidate) => candidate.displayName.includes('Appliance')), false);
  assert.equal(result.candidates.length, 3);
  const stream = result.candidates.find((candidate) => candidate.accountDisplay.includes('1234'));
  assert.ok(stream);
  assert.equal(stream.occurrences, 3);
  assert.equal(stream.months, 3);
  assert.equal(stream.cadence, 'monthly');
  assert.equal(stream.priceIncrease, true);
  assert.equal(stream.annualIncrease, 24);
  assert.equal(stream.accountDisplay, 'Family Card ••••1234');
  assert.ok(stream.evidence.some((entry) => /simple monthly annualization/i.test(entry)));
});

test('keeps the same merchant on separate accounts as distinct candidates', () => {
  const result = buildRecurringCandidates(transactions);
  const streams = result.candidates.filter((candidate) => candidate.displayName.includes('StreamFlix'));
  assert.equal(streams.length, 2);
  assert.notEqual(streams[0].candidateId, streams[1].candidateId);
  assert.notEqual(streams[0].accountDisplay, streams[1].accountDisplay);
});

test('respects legacy exclusions and confirmed evidence', () => {
  const excluded = buildRecurringCandidates(transactions, {
    legacyStatuses: { streamflix: 'excluded' }
  });
  assert.equal(excluded.candidates.filter((candidate) => candidate.merchantKey === 'streamflix').length, 0);

  const singleMonth = [
    { date: '2026-05-01', name: 'Confirmed Weekly', amount: 10, type: 'Expense', account: 'Checking 2222' },
    { date: '2026-05-08', name: 'Confirmed Weekly', amount: 10, type: 'Expense', account: 'Checking 2222' }
  ];
  const confirmed = buildRecurringCandidates(singleMonth, {
    legacyStatuses: { 'confirmed weekly': 'confirmed' }
  });
  assert.equal(confirmed.candidates.length, 1);
  assert.equal(confirmed.candidates[0].cadence, 'weekly');
});

test('saves explicit decisions with bounded metadata and history', () => {
  const candidate = buildRecurringCandidates(transactions).candidates[0];
  const store = setRecurringDecision({}, candidate.candidateId, {
    decision: 'renegotiate',
    status: 'planned',
    owner: 'Adult A',
    targetDate: '2026-08-01',
    notes: 'Compare the current plan with a fictional alternative.',
    transactions: [{ secret: true }]
  }, { now: '2026-07-11T12:00:00.000Z' });
  assert.equal(store.items[candidate.candidateId].decision, 'renegotiate');
  assert.equal(store.items[candidate.candidateId].status, 'planned');
  assert.equal(store.history.length, 1);
  assert.equal(JSON.stringify(store).includes('transactions'), false);
  assert.equal(JSON.stringify(store).includes('StreamFlix'), false);
});

test('completed decisions force done status and preserve prior decision history', () => {
  const candidate = buildRecurringCandidates(transactions).candidates[0];
  let store = setRecurringDecision({}, candidate.candidateId, {
    decision: 'cancel', status: 'planned'
  }, { now: '2026-07-11T12:00:00.000Z' });
  store = setRecurringDecision(store, candidate.candidateId, {
    decision: 'completed', status: 'waiting'
  }, { now: '2026-07-12T12:00:00.000Z' });
  assert.equal(store.items[candidate.candidateId].status, 'done');
  assert.equal(store.history[0].previousDecision, 'cancel');
  assert.equal(store.history[0].decision, 'completed');
});

test('reconciles active and dormant decisions without applying them to another candidate', () => {
  const detection = buildRecurringCandidates(transactions);
  const candidate = detection.candidates[0];
  const store = setRecurringDecision({}, candidate.candidateId, {
    decision: 'cancel', status: 'planned'
  }, { now: '2026-07-11T12:00:00.000Z' });
  const active = reconcileRecurringDecisions(store, detection.candidates);
  assert.equal(active.summary.decided, 1);
  assert.equal(active.summary.open, 1);
  assert.equal(active.summary.potentialCancellation, candidate.annualCost);
  const dormant = reconcileRecurringDecisions(store, detection.candidates.slice(1));
  assert.equal(dormant.summary.dormant, 1);
  assert.equal(Object.keys(dormant.activeItems).length, 0);
});

test('creates Guided Plan actions only for open actionable decisions', () => {
  const detection = buildRecurringCandidates(transactions);
  const candidate = detection.candidates[0];
  let store = setRecurringDecision({}, candidate.candidateId, {
    decision: 'investigate', status: 'waiting', owner: 'Adult A', targetDate: '2026-08-15'
  }, { now: '2026-07-11T12:00:00.000Z' });
  let reconciled = reconcileRecurringDecisions(store, detection.candidates);
  let actions = recurringPlanActions(detection.candidates, reconciled);
  assert.equal(actions.length, 1);
  assert.match(actions[0].nextStep, /Confirm whether the charges are expected/i);

  store = setRecurringDecision(store, candidate.candidateId, {
    decision: 'keep', status: 'planned'
  }, { now: '2026-07-12T12:00:00.000Z' });
  reconciled = reconcileRecurringDecisions(store, detection.candidates);
  actions = recurringPlanActions(detection.candidates, reconciled);
  assert.equal(actions.length, 0);
});

test('sanitizes oversized stores and creates deterministic evidence signatures', () => {
  const items = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [
    `recurring-${index.toString(16).padStart(8, '0')}`,
    { decision: 'keep', status: 'planned', updatedAt: '2026-07-11T12:00:00.000Z' }
  ]));
  const history = Array.from({ length: 300 }, (_, index) => ({
    candidateId: `recurring-${(index % 120).toString(16).padStart(8, '0')}`,
    decision: 'keep', status: 'planned', updatedAt: '2026-07-11T12:00:00.000Z'
  }));
  const store = sanitizeRecurringDecisionStore({ items, history });
  assert.equal(Object.keys(store.items).length, MAX_RECURRING_DECISIONS);
  assert.equal(store.history.length, MAX_RECURRING_HISTORY);
  const candidates = buildRecurringCandidates(transactions).candidates;
  assert.match(recurringDecisionSignature(candidates), /^fnv1a-[0-9a-f]{8}$/);
  assert.equal(recurringDecisionSignature(candidates), recurringDecisionSignature(candidates.slice().reverse()));
});
