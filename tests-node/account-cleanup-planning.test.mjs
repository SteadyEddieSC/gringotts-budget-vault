import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNT_CLEANUP_PLAN_KEY,
  MAX_ACCOUNT_CLEANUP_DECISIONS,
  assertAccountCleanupPackageSafe,
  buildAccountCleanupPackage,
  buildAccountInventory,
  buildAccountReferenceImpact,
  detectAccountCandidates,
  inventorySignature,
  reconcileCleanupPlan,
  sanitizeCleanupPlan,
  setCleanupDecision
} from '../src/v122/account-cleanup-model.js';

const transactions = [
  { date: '2026-01-05', account: 'Fictional Everyday Checking 1234', owner: 'Adult A', amount: 40 },
  { date: '2026-02-05', account: 'Fictional Everyday Checking 1234', owner: 'Adult A', amount: 55 },
  { date: '2026-03-05', account: 'Fictional Everyday Chking ••••1234', owner: 'Adult A', amount: 60 },
  { date: '2026-04-05', account: 'Fictional Everyday Chking ••••1234', owner: 'Adult A', amount: 70 },
  { date: '2026-01-12', account_name: 'Fictional Rewards Card 9876', owner: 'Adult B', amount: 20 },
  { date: '2026-01-13', account_name: 'Fictional Travel Card 5555', owner: 'Adult B', amount: 25 },
  { date: '2026-02-13', account_name: 'Fictional Travel Card 5555', owner: 'Adult B', amount: 30, pending: true }
];

test('exports the bounded v122 cleanup storage contract', () => {
  assert.equal(ACCOUNT_CLEANUP_PLAN_KEY, 'gringottsAccountCleanupPlan.v1');
  assert.equal(MAX_ACCOUNT_CLEANUP_DECISIONS, 120);
});

test('builds a masked account inventory without copying transaction rows', () => {
  const inventory = buildAccountInventory(transactions);
  assert.equal(inventory.length, 4);
  const checking = inventory.find((entry) => entry.localLabel.includes('Checking 1234'));
  assert.ok(checking);
  assert.equal(checking.displayLabel, 'Fictional Everyday Checking ••••1234');
  assert.equal(checking.transactionCount, 2);
  assert.equal(checking.firstDate, '2026-01-05');
  assert.equal(checking.lastDate, '2026-02-05');
  assert.equal(checking.ownerCount, 1);
  assert.equal(checking.identifierMasked, true);
  assert.equal(Object.hasOwn(checking, 'transactions'), false);
});

test('surfaces explainable rename or spelling candidates without treating distinct cards as merges', () => {
  const inventory = buildAccountInventory(transactions);
  const candidates = detectAccountCandidates(inventory);
  const checking = candidates.find((entry) => entry.leftDisplayLabel.includes('Checking') || entry.rightDisplayLabel.includes('Checking'));
  assert.ok(checking);
  assert.match(checking.classification, /possible-rename|spelling-drift|possible-duplicate/);
  assert.ok(['high', 'medium'].includes(checking.confidence));
  assert.ok(checking.evidence.some((entry) => /similar|shared|digits|ranges/i.test(entry)));
  assert.equal(candidates.some((entry) => entry.leftDisplayLabel.includes('Rewards') && entry.rightDisplayLabel.includes('Travel')), false);
});

test('counts downstream references by surface without returning referenced values', () => {
  const inventory = buildAccountInventory(transactions);
  const impact = buildAccountReferenceImpact(inventory, {
    rules: [{ scope: 'account', find: 'Fictional Everyday Checking 1234', to: 'Household' }],
    recurring: [{ account: 'Fictional Everyday Checking 1234', name: 'Synthetic utility' }],
    budgets: { primaryAccount: 'Fictional Everyday Checking 1234' },
    goals: [{ fundingAccount: 'Fictional Everyday Checking 1234' }],
    planning: { debt: { account: 'Fictional Rewards Card 9876' } }
  });
  const checking = inventory.find((entry) => entry.localLabel.includes('Checking 1234'));
  assert.equal(impact[checking.accountId].transactions, 2);
  assert.equal(impact[checking.accountId].rules, 1);
  assert.equal(impact[checking.accountId].recurring, 1);
  assert.equal(impact[checking.accountId].budgets, 1);
  assert.equal(impact[checking.accountId].goals, 1);
  assert.equal(JSON.stringify(impact).includes('Synthetic utility'), false);
});

test('requires explicit decisions and resets stale inventory decisions', () => {
  const inventory = buildAccountInventory(transactions);
  const candidates = detectAccountCandidates(inventory);
  assert.ok(candidates.length > 0);
  const signature = inventorySignature(inventory);
  let plan = reconcileCleanupPlan({}, candidates, signature);
  assert.equal(plan.status.unresolved, candidates.length);
  assert.equal(plan.status.complete, false);
  plan = setCleanupDecision(plan, candidates[0].candidateId, 'investigate', {
    inventorySignature: signature,
    now: '2026-07-11T12:00:00.000Z'
  });
  plan = reconcileCleanupPlan(plan, candidates, signature);
  assert.equal(plan.status.decided, 1);
  const stale = reconcileCleanupPlan(plan, candidates, 'fnv1a-deadbeef');
  assert.equal(stale.decisions.length, 0);
  assert.equal(stale.status.staleInventoryReset, true);
});

test('bounds and sanitizes cleanup decisions', () => {
  const value = sanitizeCleanupPlan({
    inventorySignature: 'fnv1a-1234abcd',
    updatedAt: '2026-07-11T12:00:00.000Z',
    decisions: Array.from({ length: 150 }, (_, index) => ({
      candidateId: `candidate-${index}`,
      decision: index % 2 ? 'keep-separate' : 'investigate',
      updatedAt: '2026-07-11T12:00:00.000Z',
      transactions: [{ secret: true }]
    }))
  });
  assert.equal(value.decisions.length, MAX_ACCOUNT_CLEANUP_DECISIONS);
  assert.equal(JSON.stringify(value).includes('transactions'), false);
});

test('exports a privacy-safe plan with masked labels and no automatic merge capability', () => {
  const inventory = buildAccountInventory(transactions);
  const candidates = detectAccountCandidates(inventory);
  const impact = buildAccountReferenceImpact(inventory, {});
  let plan = {};
  if (candidates[0]) {
    plan = setCleanupDecision(plan, candidates[0].candidateId, 'keep-separate', {
      inventorySignature: inventorySignature(inventory),
      now: '2026-07-11T12:00:00.000Z'
    });
  }
  const payload = buildAccountCleanupPackage({
    inventory,
    candidates,
    impact,
    plan,
    generatedAt: '2026-07-11T12:05:00.000Z'
  });
  assert.equal(assertAccountCleanupPackageSafe(payload), true);
  assert.equal(payload.summary.automaticMergeAvailable, false);
  assert.equal(payload.summary.transactionWriteAvailable, false);
  assert.ok(payload.accounts.every((entry) => !entry.displayLabel.includes('Checking 1234')));
  assert.deepEqual(payload.dataBoundary, {
    transactionRowsIncluded: false,
    rawAccountLabelsIncluded: false,
    fullAccountIdentifiersIncluded: false,
    balancesIncluded: false,
    merchantNamesIncluded: false,
    sourceFilesIncluded: false,
    credentialsIncluded: false,
    tokensIncluded: false,
    vaultContentsIncluded: false
  });
  assert.doesNotMatch(JSON.stringify(payload), /"(?:transactions|rows|localLabel|account_id|balance|merchant|vaultContents)"\s*:/i);
});
