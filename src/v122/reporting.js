import {
  getMonth, keys, read, recurringCandidates, ruleData, state, txs
} from '../v103/core.js';
import { householdReportModel } from '../v111/reporting.js';
import { expandedWorkbookSheetsV121 } from '../v121/reporting.js';
import {
  ACCOUNT_CLEANUP_PLAN_KEY,
  buildAccountInventory,
  buildAccountReferenceImpact,
  detectAccountCandidates,
  inventorySignature,
  reconcileCleanupPlan,
  sanitizeCleanupPlan
} from './account-cleanup-model.js';

function metadataSources() {
  const current = state();
  const vaultMetadata = Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'transactions' && key !== '_activeKey'));
  const browserMetadata = {};
  keys().filter((key) => !key.startsWith('gringottsBudgetVault.')
    && key !== ACCOUNT_CLEANUP_PLAN_KEY
    && /rule|cashflow|guided|goal|close|forecast|debt|recurring|annual|bill|payday|budget|insight/i.test(key))
    .forEach((key) => { browserMetadata[key] = read(key, null); });
  return { vaultMetadata, browserMetadata, rules: ruleData().rules, recurring: recurringCandidates() };
}

function storedPlan() {
  try {
    return sanitizeCleanupPlan(JSON.parse(localStorage.getItem(ACCOUNT_CLEANUP_PLAN_KEY) || '{}'));
  } catch {
    return sanitizeCleanupPlan({});
  }
}

export function accountCleanupReportModelV122() {
  const inventory = buildAccountInventory(txs());
  const candidates = detectAccountCandidates(inventory);
  const impact = buildAccountReferenceImpact(inventory, metadataSources());
  const plan = reconcileCleanupPlan(storedPlan(), candidates, inventorySignature(inventory));
  return { inventory, candidates, impact, plan };
}

export function accountInventorySheetV122(model = accountCleanupReportModelV122()) {
  return {
    name: 'Account Inventory',
    rows: [
      [
        'Account ID', 'Masked Label', 'Type', 'Transactions', 'Pending', 'First Date',
        'Last Date', 'Owners', 'Identifier Masked', 'Rules', 'Recurring', 'Budgets',
        'Bills & Paydays', 'Goals', 'Planning', 'Other Metadata'
      ],
      ...model.inventory.map((account) => {
        const impact = model.impact[account.accountId] || {};
        return [
          account.accountId,
          account.displayLabel,
          account.kind,
          account.transactionCount,
          account.pendingCount,
          account.firstDate,
          account.lastDate,
          account.ownerCount,
          'Yes',
          impact.rules || 0,
          impact.recurring || 0,
          impact.budgets || 0,
          impact.billsAndPaydays || 0,
          impact.goals || 0,
          impact.planning || 0,
          impact.otherMetadata || 0
        ];
      })
    ]
  };
}

export function cleanupPlanSheetV122(model = accountCleanupReportModelV122()) {
  const decisions = new Map(model.plan.decisions.map((entry) => [entry.candidateId, entry]));
  return {
    name: 'Account Cleanup Plan',
    rows: [
      [
        'Candidate ID', 'Left Account', 'Right Account', 'Classification', 'Confidence',
        'Date Relationship', 'Combined Transactions', 'Decision', 'Decision Updated',
        'Evidence', 'Automatic Merge', 'Transaction Write'
      ],
      ...model.candidates.map((candidate) => [
        candidate.candidateId,
        candidate.leftDisplayLabel,
        candidate.rightDisplayLabel,
        candidate.classification,
        candidate.confidence,
        candidate.dateRelationship,
        candidate.combinedTransactionCount,
        decisions.get(candidate.candidateId)?.decision || 'unresolved',
        decisions.get(candidate.candidateId)?.updatedAt || '',
        candidate.evidence.join(' | '),
        'Unavailable',
        'Unavailable'
      ])
    ]
  };
}

export function expandedWorkbookSheetsV122(
  month = getMonth(),
  reportModel = householdReportModel()
) {
  const cleanupModel = accountCleanupReportModelV122();
  return [
    ...expandedWorkbookSheetsV121(month, reportModel),
    accountInventorySheetV122(cleanupModel),
    cleanupPlanSheetV122(cleanupModel)
  ];
}
