export const ACCOUNT_CLEANUP_PLAN_KEY = 'gringottsAccountCleanupPlan.v1';
export const ACCOUNT_CLEANUP_PLAN_VERSION = 1;
export const MAX_ACCOUNT_CLEANUP_DECISIONS = 120;
export const ACCOUNT_CLEANUP_PACKAGE_KIND = 'gringotts-account-cleanup-plan';
export const ACCOUNT_CLEANUP_PACKAGE_VERSION = 1;

export const CLEANUP_DECISIONS = Object.freeze([
  'keep-separate',
  'rename-left-to-right',
  'rename-right-to-left',
  'merge-left-to-right',
  'merge-right-to-left',
  'investigate'
]);

const clean = (value) => String(value ?? '').trim();
const finiteCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
};
const validIso = (value) => Number.isFinite(Date.parse(clean(value)));

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value ?? '')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function transactionDate(transaction = {}) {
  return clean(transaction.date || transaction.posted_datetime || transaction.authorized_date || transaction.datetime).slice(0, 10);
}

function transactionAccount(transaction = {}) {
  const candidates = [
    ['account', transaction.account],
    ['accountName', transaction.accountName],
    ['account_name', transaction.account_name],
    ['official_name', transaction.official_name],
    ['account_id', transaction.account_id]
  ];
  const found = candidates.find(([, value]) => clean(value));
  return found ? { field: found[0], label: clean(found[1]) } : { field: 'unlabeled', label: 'Unlabeled account' };
}

function transactionOwner(transaction = {}) {
  return clean(transaction.owner || transaction.cardOwner || transaction.cardLast4 || transaction.account_owner);
}

function normalizeLabel(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\b(?:account|acct)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function numericSuffix(value) {
  const digits = clean(value).match(/\d/g)?.join('') || '';
  return digits.length >= 4 ? digits.slice(-4) : '';
}

function maskAccountLabel(value) {
  const source = clean(value) || 'Unlabeled account';
  return source.replace(/[A-Za-z]*\d[A-Za-z0-9-]{3,}|\d{4,}/g, (token) => {
    const digits = token.match(/\d/g)?.join('') || '';
    return digits.length >= 4 ? `••••${digits.slice(-4)}` : '••••';
  });
}

function accountKind(value) {
  const normalized = normalizeLabel(value);
  if (/\bchecking\b/.test(normalized)) return 'checking';
  if (/\bsavings?\b/.test(normalized)) return 'savings';
  if (/\b(?:credit|card|visa|mastercard|amex)\b/.test(normalized)) return 'card';
  if (/\b(?:loan|mortgage|auto)\b/.test(normalized)) return 'loan';
  if (/\b(?:investment|brokerage|retirement|ira|401k)\b/.test(normalized)) return 'investment';
  if (/\bcash\b/.test(normalized)) return 'cash';
  return 'unknown';
}

function semanticTokens(value) {
  const ignored = new Set(['account', 'acct', 'bank', 'the']);
  return new Set(normalizeLabel(value).split(' ').filter((token) => token && !ignored.has(token)));
}

function jaccard(left, right) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let shared = 0;
  left.forEach((value) => { if (right.has(value)) shared += 1; });
  return shared / union.size;
}

function levenshtein(leftValue, rightValue) {
  const left = clean(leftValue);
  const right = clean(rightValue);
  if (!left) return right.length;
  if (!right) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return previous[right.length];
}

function editSimilarity(left, right) {
  const maximum = Math.max(clean(left).length, clean(right).length);
  return maximum ? 1 - (levenshtein(left, right) / maximum) : 1;
}

function rangesOverlap(left, right) {
  if (!left.firstDate || !left.lastDate || !right.firstDate || !right.lastDate) return null;
  return left.firstDate <= right.lastDate && right.firstDate <= left.lastDate;
}

function dateRelationship(left, right) {
  const overlap = rangesOverlap(left, right);
  if (overlap === true) return 'overlapping';
  if (overlap === false) return 'sequential';
  return 'unknown';
}

function accountId(label) {
  return `account-${fnv1a(clean(label).toLowerCase())}`;
}

export function buildAccountInventory(transactionsValue = []) {
  const rows = Array.isArray(transactionsValue) ? transactionsValue : [];
  const groups = new Map();
  rows.forEach((transaction) => {
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) return;
    const account = transactionAccount(transaction);
    const key = account.label;
    const entry = groups.get(key) || {
      accountId: accountId(key),
      localLabel: key,
      displayLabel: maskAccountLabel(key),
      normalizedLabel: normalizeLabel(key),
      suffix: numericSuffix(key),
      kind: accountKind(key),
      transactionCount: 0,
      pendingCount: 0,
      firstDate: '',
      lastDate: '',
      ownerValues: new Set(),
      sourceFields: new Set(),
      identifierLikeSource: false
    };
    entry.transactionCount += 1;
    if (transaction.pending === true || clean(transaction.status).toLowerCase() === 'pending') entry.pendingCount += 1;
    const date = transactionDate(transaction);
    if (date && (!entry.firstDate || date < entry.firstDate)) entry.firstDate = date;
    if (date && (!entry.lastDate || date > entry.lastDate)) entry.lastDate = date;
    const owner = transactionOwner(transaction);
    if (owner) entry.ownerValues.add(owner);
    entry.sourceFields.add(account.field);
    if (account.field === 'account_id' || /\d{4,}/.test(key)) entry.identifierLikeSource = true;
    groups.set(key, entry);
  });
  return [...groups.values()].map((entry) => ({
    accountId: entry.accountId,
    localLabel: entry.localLabel,
    displayLabel: entry.displayLabel,
    normalizedLabel: entry.normalizedLabel,
    suffix: entry.suffix,
    kind: entry.kind,
    transactionCount: entry.transactionCount,
    pendingCount: entry.pendingCount,
    firstDate: entry.firstDate,
    lastDate: entry.lastDate,
    ownerCount: entry.ownerValues.size,
    sourceFields: [...entry.sourceFields].sort(),
    identifierMasked: entry.identifierLikeSource || entry.displayLabel !== entry.localLabel
  })).sort((left, right) => right.transactionCount - left.transactionCount || left.displayLabel.localeCompare(right.displayLabel));
}

function classifyPair(left, right) {
  const leftTokens = semanticTokens(left.localLabel);
  const rightTokens = semanticTokens(right.localLabel);
  const tokenSimilarity = jaccard(leftTokens, rightTokens);
  const textSimilarity = editSimilarity(left.normalizedLabel, right.normalizedLabel);
  const suffixMatch = Boolean(left.suffix && right.suffix && left.suffix === right.suffix);
  const kindMatch = left.kind !== 'unknown' && left.kind === right.kind;
  const normalizedMatch = Boolean(left.normalizedLabel && left.normalizedLabel === right.normalizedLabel);
  const evidence = [];
  let classification = '';
  let confidence = '';

  if (normalizedMatch) {
    classification = 'label-drift';
    confidence = 'high';
    evidence.push('Labels differ only by capitalization, punctuation, spacing, or the word account.');
  }
  if (suffixMatch) evidence.push('Both labels retain the same masked final four digits.');
  if (kindMatch) evidence.push(`Both labels appear to describe the same ${left.kind} account type.`);
  if (tokenSimilarity >= 0.75) evidence.push('Most meaningful label words are shared.');
  else if (tokenSimilarity >= 0.5) evidence.push('Several meaningful label words are shared.');
  if (textSimilarity >= 0.86 && !normalizedMatch) evidence.push('The normalized labels are very similar.');
  const relationship = dateRelationship(left, right);
  if (relationship === 'sequential') evidence.push('The retained transaction date ranges do not overlap, which can indicate a rename or replacement.');
  if (relationship === 'overlapping') evidence.push('The retained transaction date ranges overlap, so the accounts may be distinct even when labels are similar.');

  if (!classification && suffixMatch && (tokenSimilarity >= 0.5 || kindMatch)) {
    classification = relationship === 'sequential' ? 'possible-rename' : 'possible-duplicate';
    confidence = tokenSimilarity >= 0.75 && kindMatch ? 'high' : 'medium';
  }
  if (!classification && kindMatch && textSimilarity >= 0.82) {
    classification = relationship === 'sequential' ? 'possible-rename' : 'spelling-drift';
    confidence = textSimilarity >= 0.9 ? 'high' : 'medium';
  }
  if (!classification && tokenSimilarity >= 0.78 && textSimilarity >= 0.7) {
    classification = 'possible-duplicate';
    confidence = 'medium';
  }
  if (!classification) return null;

  return {
    classification,
    confidence,
    evidence,
    tokenSimilarity: Number(tokenSimilarity.toFixed(3)),
    textSimilarity: Number(textSimilarity.toFixed(3)),
    suffixMatch,
    kindMatch,
    dateRelationship: relationship
  };
}

export function detectAccountCandidates(inventoryValue = []) {
  const inventory = Array.isArray(inventoryValue) ? inventoryValue : [];
  const candidates = [];
  for (let leftIndex = 0; leftIndex < inventory.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < inventory.length; rightIndex += 1) {
      const left = inventory[leftIndex];
      const right = inventory[rightIndex];
      const analysis = classifyPair(left, right);
      if (!analysis) continue;
      const ordered = [left.accountId, right.accountId].sort();
      candidates.push({
        candidateId: `candidate-${fnv1a(ordered.join('|'))}`,
        leftAccountId: left.accountId,
        rightAccountId: right.accountId,
        leftDisplayLabel: left.displayLabel,
        rightDisplayLabel: right.displayLabel,
        leftLocalLabel: left.localLabel,
        rightLocalLabel: right.localLabel,
        leftTransactionCount: left.transactionCount,
        rightTransactionCount: right.transactionCount,
        combinedTransactionCount: left.transactionCount + right.transactionCount,
        ...analysis
      });
    }
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return candidates.sort((left, right) => rank[left.confidence] - rank[right.confidence]
    || right.combinedTransactionCount - left.combinedTransactionCount
    || left.candidateId.localeCompare(right.candidateId));
}

function classifyReferenceBucket(path) {
  const value = clean(path).toLowerCase();
  if (/rule/.test(value)) return 'rules';
  if (/recurring|subscription/.test(value)) return 'recurring';
  if (/budget/.test(value)) return 'budgets';
  if (/bill|payday|calendar|cashflow/.test(value)) return 'billsAndPaydays';
  if (/goal|sinking/.test(value)) return 'goals';
  if (/plan|forecast|debt|close|annual|insight/.test(value)) return 'planning';
  return 'otherMetadata';
}

function scanReferences(value, account, output, path = 'root', seen = new WeakSet()) {
  if (typeof value === 'string') {
    if (normalizeLabel(value) === account.normalizedLabel) output[classifyReferenceBucket(path)] += 1;
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanReferences(entry, account, output, `${path}[${index}]`, seen));
    return;
  }
  Object.entries(value).forEach(([key, entry]) => {
    if (key === 'transactions') return;
    scanReferences(entry, account, output, `${path}.${key}`, seen);
  });
}

export function buildAccountReferenceImpact(inventoryValue = [], sources = {}) {
  const inventory = Array.isArray(inventoryValue) ? inventoryValue : [];
  return Object.fromEntries(inventory.map((account) => {
    const counts = {
      transactions: account.transactionCount,
      rules: 0,
      recurring: 0,
      budgets: 0,
      billsAndPaydays: 0,
      goals: 0,
      planning: 0,
      otherMetadata: 0
    };
    scanReferences(sources, account, counts);
    return [account.accountId, counts];
  }));
}

export function inventorySignature(inventoryValue = []) {
  const inventory = Array.isArray(inventoryValue) ? inventoryValue : [];
  return `fnv1a-${fnv1a(JSON.stringify(inventory.map((account) => [
    account.accountId,
    account.transactionCount,
    account.firstDate,
    account.lastDate
  ]).sort()))}`;
}

function safeDecision(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const candidateId = clean(entry.candidateId).slice(0, 100);
  const decision = CLEANUP_DECISIONS.includes(clean(entry.decision)) ? clean(entry.decision) : '';
  const updatedAt = validIso(entry.updatedAt) ? new Date(entry.updatedAt).toISOString() : '';
  return candidateId && decision && updatedAt ? { candidateId, decision, updatedAt } : null;
}

export function sanitizeCleanupPlan(value = {}) {
  const seen = new Set();
  const decisions = [];
  for (const entry of Array.isArray(value?.decisions) ? value.decisions : []) {
    const decision = safeDecision(entry);
    if (!decision || seen.has(decision.candidateId)) continue;
    seen.add(decision.candidateId);
    decisions.push(decision);
    if (decisions.length >= MAX_ACCOUNT_CLEANUP_DECISIONS) break;
  }
  return {
    version: ACCOUNT_CLEANUP_PLAN_VERSION,
    inventorySignature: /^fnv1a-[0-9a-f]{8}$/.test(clean(value?.inventorySignature)) ? clean(value.inventorySignature) : '',
    decisions,
    updatedAt: validIso(value?.updatedAt) ? new Date(value.updatedAt).toISOString() : ''
  };
}

export function setCleanupDecision(planValue, candidateIdValue, decisionValue, {
  inventorySignature: signature = '',
  now = new Date().toISOString()
} = {}) {
  const plan = sanitizeCleanupPlan(planValue);
  const candidateId = clean(candidateIdValue).slice(0, 100);
  const decision = clean(decisionValue);
  if (!candidateId || !CLEANUP_DECISIONS.includes(decision)) throw new Error('A valid cleanup candidate and explicit decision are required.');
  if (!/^fnv1a-[0-9a-f]{8}$/.test(signature)) throw new Error('The account inventory signature is invalid.');
  if (!validIso(now)) throw new Error('The cleanup decision timestamp is invalid.');
  return sanitizeCleanupPlan({
    version: ACCOUNT_CLEANUP_PLAN_VERSION,
    inventorySignature: signature,
    decisions: [
      { candidateId, decision, updatedAt: new Date(now).toISOString() },
      ...plan.decisions.filter((entry) => entry.candidateId !== candidateId)
    ],
    updatedAt: new Date(now).toISOString()
  });
}

export function reconcileCleanupPlan(planValue, candidatesValue = [], signature = '') {
  const plan = sanitizeCleanupPlan(planValue);
  const candidates = Array.isArray(candidatesValue) ? candidatesValue : [];
  const candidateIds = new Set(candidates.map((candidate) => candidate.candidateId));
  const current = plan.inventorySignature === signature;
  const decisions = current ? plan.decisions.filter((decision) => candidateIds.has(decision.candidateId)) : [];
  const decided = new Set(decisions.map((decision) => decision.candidateId));
  return {
    version: ACCOUNT_CLEANUP_PLAN_VERSION,
    inventorySignature: signature,
    decisions,
    updatedAt: current ? plan.updatedAt : '',
    status: {
      candidates: candidates.length,
      decided: candidates.filter((candidate) => decided.has(candidate.candidateId)).length,
      unresolved: candidates.filter((candidate) => !decided.has(candidate.candidateId)).length,
      complete: candidates.length > 0 && candidates.every((candidate) => decided.has(candidate.candidateId)),
      staleInventoryReset: Boolean(plan.inventorySignature && !current)
    }
  };
}

function publicAccount(account, impact = {}) {
  return {
    accountId: account.accountId,
    displayLabel: account.displayLabel,
    kind: account.kind,
    transactionCount: account.transactionCount,
    pendingCount: account.pendingCount,
    firstDate: account.firstDate,
    lastDate: account.lastDate,
    ownerCount: account.ownerCount,
    identifierMasked: true,
    referenceImpact: {
      transactions: finiteCount(impact.transactions),
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
    generatedAt: validIso(generatedAt) ? new Date(generatedAt).toISOString() : new Date().toISOString(),
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
      candidateId: candidate.candidateId,
      leftAccountId: candidate.leftAccountId,
      rightAccountId: candidate.rightAccountId,
      leftDisplayLabel: candidate.leftDisplayLabel,
      rightDisplayLabel: candidate.rightDisplayLabel,
      classification: candidate.classification,
      confidence: candidate.confidence,
      evidence: candidate.evidence.map((entry) => clean(entry).slice(0, 300)),
      dateRelationship: candidate.dateRelationship,
      combinedTransactionCount: candidate.combinedTransactionCount,
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Account cleanup package must be an object.');
  if (value.kind !== ACCOUNT_CLEANUP_PACKAGE_KIND || Number(value.version) !== ACCOUNT_CLEANUP_PACKAGE_VERSION) {
    throw new Error('Account cleanup package kind or version is invalid.');
  }
  const serialized = JSON.stringify(value);
  const forbiddenKeys = /"(?:transactions|rows|localLabel|rawLabel|accountNumber|account_id|balance|merchant|sourceFilename|destinationStorageKey|vaultContents|credentials|tokens)"\s*:/i;
  if (forbiddenKeys.test(serialized)) throw new Error('Account cleanup package contains a forbidden household-data field.');
  const boundary = value.dataBoundary || {};
  if (!Object.values(boundary).every((entry) => entry === false)) throw new Error('Account cleanup package does not declare the required privacy boundary.');
  return true;
}
