import {
  ACCOUNT_CLEANUP_PACKAGE_KIND,
  ACCOUNT_CLEANUP_PACKAGE_VERSION,
  inventorySignature,
  reconcileCleanupPlan
} from './account-cleanup-model.js';

const clean = (value) => String(value ?? '').trim();
const finiteCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
};
const validIso = (value) => Number.isFinite(Date.parse(clean(value)));

const FORBIDDEN_KEYS = new Set([
  'transactions',
  'rows',
  'locallabel',
  'rawlabel',
  'accountnumber',
  'account_id',
  'balance',
  'merchant',
  'sourcefilename',
  'destinationstoragekey',
  'vaultcontents',
  'credentials',
  'tokens'
]);

function assertNoForbiddenKeys(value, path = 'root', seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenKeys(entry, `${path}[${index}]`, seen));
    return;
  }
  Object.entries(value).forEach(([key, entry]) => {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      throw new Error(`Account cleanup package contains forbidden field ${path}.${key}.`);
    }
    assertNoForbiddenKeys(entry, `${path}.${key}`, seen);
  });
}

function publicAccount(account, impact = {}) {
  return {
    accountId: account.accountId,
    displayLabel: account.displayLabel,
    kind: account.kind,
    transactionCount: finiteCount(account.transactionCount),
    pendingCount: finiteCount(account.pendingCount),
    firstDate: clean(account.firstDate).slice(0, 10),
    lastDate: clean(account.lastDate).slice(0, 10),
    ownerCount: finiteCount(account.ownerCount),
    identifierMasked: true,
    referenceImpact: {
      transactionReferenceCount: finiteCount(impact.transactions),
      rules: finiteCount(impact.rules),
      recurring: finiteCount(impact.recurring),
      budgets: finiteCount(impact.budgets),
      billsAndPaydays: finiteCount(impact.billsAndPaydays),
      goals: finiteCount(impact.goals),
      planning: finiteCount(impact.planning),
      otherMetadata: finiteCount(impact.otherMetadata)
    }
  };
}

export function buildAccountCleanupPackage({
  inventory = [],
  candidates = [],
  impact = {},
  plan = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const safePlan = reconcileCleanupPlan(plan, candidates, inventorySignature(inventory));
  const decisions = new Map(safePlan.decisions.map((entry) => [entry.candidateId, entry]));
  const result = {
    kind: ACCOUNT_CLEANUP_PACKAGE_KIND,
    version: ACCOUNT_CLEANUP_PACKAGE_VERSION,
    generatedAt: validIso(generatedAt)
      ? new Date(generatedAt).toISOString()
      : new Date().toISOString(),
    summary: {
      accounts: inventory.length,
      candidates: candidates.length,
      decisions: safePlan.status.decided,
      unresolved: safePlan.status.unresolved,
      complete: safePlan.status.complete,
      transactionWriteAvailable: false,
      automaticMergeAvailable: false
    },
    accounts: inventory.map((account) => publicAccount(account, impact[account.accountId])),
    candidates: candidates.map((candidate) => ({
      candidateId: clean(candidate.candidateId).slice(0, 100),
      leftAccountId: clean(candidate.leftAccountId).slice(0, 100),
      rightAccountId: clean(candidate.rightAccountId).slice(0, 100),
      leftDisplayLabel: clean(candidate.leftDisplayLabel).slice(0, 160),
      rightDisplayLabel: clean(candidate.rightDisplayLabel).slice(0, 160),
      classification: clean(candidate.classification).slice(0, 60),
      confidence: clean(candidate.confidence).slice(0, 20),
      evidence: (Array.isArray(candidate.evidence) ? candidate.evidence : [])
        .map((entry) => clean(entry).slice(0, 300))
        .filter(Boolean),
      dateRelationship: clean(candidate.dateRelationship).slice(0, 30),
      combinedTransactionCount: finiteCount(candidate.combinedTransactionCount),
      decision: decisions.get(candidate.candidateId)?.decision || 'unresolved'
    })),
    dataBoundary: {
      transactionRowsIncluded: false,
      rawAccountLabelsIncluded: false,
      fullAccountIdentifiersIncluded: false,
      balancesIncluded: false,
      merchantNamesIncluded: false,
      sourceFilesIncluded: false,
      credentialsIncluded: false,
      tokensIncluded: false,
      vaultContentsIncluded: false
    }
  };
  assertAccountCleanupPackageSafe(result);
  return result;
}

export function assertAccountCleanupPackageSafe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Account cleanup package must be an object.');
  }
  if (value.kind !== ACCOUNT_CLEANUP_PACKAGE_KIND
      || Number(value.version) !== ACCOUNT_CLEANUP_PACKAGE_VERSION) {
    throw new Error('Account cleanup package kind or version is invalid.');
  }
  assertNoForbiddenKeys(value);
  const boundary = value.dataBoundary || {};
  const required = [
    'transactionRowsIncluded',
    'rawAccountLabelsIncluded',
    'fullAccountIdentifiersIncluded',
    'balancesIncluded',
    'merchantNamesIncluded',
    'sourceFilesIncluded',
    'credentialsIncluded',
    'tokensIncluded',
    'vaultContentsIncluded'
  ];
  if (!required.every((key) => boundary[key] === false)) {
    throw new Error('Account cleanup package does not declare the required privacy boundary.');
  }
  return true;
}
