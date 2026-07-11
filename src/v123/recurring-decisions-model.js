export const RECURRING_DECISION_KEY = 'gringottsRecurringDecisions.v1';
export const RECURRING_DECISION_VERSION = 1;
export const MAX_RECURRING_DECISIONS = 120;
export const MAX_RECURRING_HISTORY = 240;

export const RECURRING_DECISIONS = Object.freeze([
  'keep',
  'cancel',
  'renegotiate',
  'investigate',
  'completed'
]);

export const FOLLOW_UP_STATUSES = Object.freeze([
  'not-started',
  'planned',
  'waiting',
  'done'
]);

const DAY_MS = 86_400_000;
const clean = (value, limit = 800) => String(value ?? '').trim().slice(0, limit);
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value, 10));
const validIso = (value) => Number.isFinite(Date.parse(clean(value, 50)));

function fnv1a(value) {
  let hash = 2166136261;
  for (const character of String(value ?? '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeMerchant(value) {
  return clean(value, 240)
    .toLowerCase()
    .replace(/\b\d{3,}\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAccount(value) {
  return clean(value, 240)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function maskAccount(value) {
  const source = clean(value, 240) || 'Unassigned account';
  return source.replace(/[A-Za-z]*\d[A-Za-z0-9-]{3,}|(?:[•*xX]{2,}\s*)?\d{4,}/g, (token) => {
    const digits = token.match(/\d/g)?.join('') || '';
    return digits.length >= 4 ? `••••${digits.slice(-4)}` : '••••';
  });
}

function transactionDate(transaction = {}) {
  return clean(
    transaction.date
    || transaction.posted_datetime
    || transaction.authorized_date
    || transaction.datetime,
    10
  );
}

function transactionName(transaction = {}) {
  return clean(
    transaction.merchant
    || transaction.merchant_name
    || transaction.name
    || transaction.description
    || 'Unknown merchant',
    240
  );
}

function transactionAccount(transaction = {}) {
  return clean(
    transaction.account
    || transaction.accountName
    || transaction.account_name
    || transaction.official_name
    || transaction.account_id,
    240
  );
}

function transactionOwner(transaction = {}) {
  return clean(
    transaction.owner
    || transaction.cardOwner
    || transaction.cardLast4
    || transaction.account_owner,
    120
  );
}

function transactionCategory(transaction = {}) {
  return clean(
    transaction.category
    || transaction.personal_finance_category_primary
    || transaction.primaryCategory
    || 'Other',
    160
  );
}

function transactionAmount(transaction = {}) {
  const parsed = Number(transaction.amount);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function isPending(transaction = {}) {
  return transaction.pending === true || clean(transaction.status, 40).toLowerCase() === 'pending';
}

function isExpense(transaction = {}) {
  const explicit = clean(
    transaction.type || transaction.flow_type || transaction.transaction_type,
    60
  ).toLowerCase();
  if (/income|deposit|inflow|credit/.test(explicit)) return false;
  if (/transfer|internal movement/.test(explicit)) return false;
  if (/expense|outflow|debit|purchase/.test(explicit)) return true;
  return Number(transaction.amount) >= 0;
}

function dateValue(value) {
  return Date.parse(`${value}T00:00:00Z`);
}

function dayGap(left, right) {
  return Math.max(0, Math.round((dateValue(right) - dateValue(left)) / DAY_MS));
}

function median(values) {
  const sorted = values.filter(Number.isFinite).slice().sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function cadenceFor(gaps) {
  const typical = median(gaps.filter((gap) => gap > 0));
  if (!typical) return { cadence: 'unknown', typicalDays: 0, multiplier: 0 };
  if (typical <= 10) return { cadence: 'weekly', typicalDays: typical, multiplier: 52 };
  if (typical <= 20) return { cadence: 'biweekly', typicalDays: typical, multiplier: 26 };
  if (typical <= 45) return { cadence: 'monthly', typicalDays: typical, multiplier: 12 };
  if (typical <= 110) return { cadence: 'quarterly', typicalDays: typical, multiplier: 4 };
  if (typical <= 220) return { cadence: 'semiannual', typicalDays: typical, multiplier: 2 };
  if (typical <= 420) return { cadence: 'annual', typicalDays: typical, multiplier: 1 };
  return { cadence: 'irregular', typicalDays: typical, multiplier: 0 };
}

function amountStability(amounts, average) {
  if (!amounts.length || !average) return { stability: 'unknown', variation: 0 };
  const variation = (Math.max(...amounts) - Math.min(...amounts)) / average;
  if (variation <= 0.1) return { stability: 'stable', variation };
  if (variation <= 0.25) return { stability: 'variable', variation };
  return { stability: 'volatile', variation };
}

function candidateId(merchantKey, accountKey) {
  return `recurring-${fnv1a(`${merchantKey}|${accountKey || 'unassigned'}`)}`;
}

function legacyStatus(legacyStatuses, merchantKey) {
  const value = clean(legacyStatuses?.[merchantKey], 40);
  return ['candidate', 'confirmed', 'excluded'].includes(value) ? value : 'candidate';
}

export function buildRecurringCandidates(transactionsValue = [], {
  legacyStatuses = {}
} = {}) {
  const transactions = Array.isArray(transactionsValue) ? transactionsValue : [];
  const groups = new Map();
  let pendingExcluded = 0;
  let nonExpenseExcluded = 0;

  transactions.forEach((transaction) => {
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) return;
    if (isPending(transaction)) {
      pendingExcluded += 1;
      return;
    }
    if (!isExpense(transaction)) {
      nonExpenseExcluded += 1;
      return;
    }
    const date = transactionDate(transaction);
    const amount = transactionAmount(transaction);
    const merchantKey = normalizeMerchant(transactionName(transaction));
    const accountKey = normalizeAccount(transactionAccount(transaction));
    if (!validDate(date) || !merchantKey || amount <= 0) return;
    const key = `${merchantKey}|${accountKey || 'unassigned'}`;
    const list = groups.get(key) || [];
    list.push(transaction);
    groups.set(key, list);
  });

  const candidates = [];
  groups.forEach((rows) => {
    const sorted = rows.slice().sort((left, right) => transactionDate(left).localeCompare(transactionDate(right)));
    const first = sorted[0];
    const latest = sorted.at(-1);
    const previous = sorted.at(-2);
    const merchantKey = normalizeMerchant(transactionName(latest));
    const accountKey = normalizeAccount(transactionAccount(latest));
    const legacy = legacyStatus(legacyStatuses, merchantKey);
    if (legacy === 'excluded') return;
    const months = [...new Set(sorted.map((row) => transactionDate(row).slice(0, 7)))];
    if (sorted.length < 2 || (months.length < 2 && legacy !== 'confirmed')) return;

    const dates = sorted.map(transactionDate);
    const gaps = dates.slice(1).map((date, index) => dayGap(dates[index], date));
    const amounts = sorted.map(transactionAmount);
    const average = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
    const cadence = cadenceFor(gaps);
    const stability = amountStability(amounts, average);
    const latestAmount = transactionAmount(latest);
    const previousAmount = previous ? transactionAmount(previous) : 0;
    const delta = roundMoney(latestAmount - previousAmount);
    const percentChange = previousAmount ? delta / previousAmount : 0;
    const positiveIncrease = previousAmount > 0 && delta > 0 && (delta >= 2 || percentChange >= 0.05);
    const annualCost = cadence.multiplier ? roundMoney(average * cadence.multiplier) : 0;
    const annualIncrease = positiveIncrease && cadence.multiplier
      ? roundMoney(delta * cadence.multiplier)
      : 0;
    const id = candidateId(merchantKey, accountKey);

    candidates.push({
      candidateId: id,
      merchantKey,
      accountKey,
      displayName: transactionName(latest),
      category: transactionCategory(latest),
      accountDisplay: maskAccount(transactionAccount(latest)),
      owner: transactionOwner(latest),
      occurrences: sorted.length,
      months: months.length,
      firstDate: transactionDate(first),
      latestDate: transactionDate(latest),
      previousDate: previous ? transactionDate(previous) : '',
      latestAmount: roundMoney(latestAmount),
      previousAmount: roundMoney(previousAmount),
      averageAmount: roundMoney(average),
      minAmount: roundMoney(Math.min(...amounts)),
      maxAmount: roundMoney(Math.max(...amounts)),
      delta,
      percentChange: Number(percentChange.toFixed(4)),
      priceIncrease: positiveIncrease,
      cadence: cadence.cadence,
      typicalDays: cadence.typicalDays,
      annualMultiplier: cadence.multiplier,
      annualCost,
      annualIncrease,
      amountStability: stability.stability,
      amountVariation: Number(stability.variation.toFixed(4)),
      legacyStatus: legacy,
      evidence: [
        `${sorted.length} posted charges across ${months.length} distinct month${months.length === 1 ? '' : 's'}.`,
        cadence.typicalDays
          ? `Typical gap is about ${cadence.typicalDays} days, classified as ${cadence.cadence}.`
          : 'There is not enough date-gap evidence to infer a cadence.',
        average
          ? `Amounts average ${roundMoney(average).toFixed(2)} with ${stability.stability} variation.`
          : 'No positive amount average is available.',
        positiveIncrease
          ? `The latest charge is ${delta.toFixed(2)} above the preceding charge.`
          : 'No material latest-charge increase was detected.',
        annualCost
          ? `The ${annualCost.toFixed(2)} annual footprint is a simple ${cadence.cadence} annualization, not guaranteed future spending.`
          : 'No annual footprint is estimated because the cadence is irregular or unknown.'
      ]
    });
  });

  const cadenceRank = { monthly: 7, biweekly: 6, weekly: 5, quarterly: 4, semiannual: 3, annual: 2, irregular: 1, unknown: 0 };
  candidates.sort((left, right) => Number(right.priceIncrease) - Number(left.priceIncrease)
    || right.annualIncrease - left.annualIncrease
    || right.annualCost - left.annualCost
    || (cadenceRank[right.cadence] || 0) - (cadenceRank[left.cadence] || 0)
    || right.months - left.months
    || left.displayName.localeCompare(right.displayName));

  return {
    candidates,
    summary: {
      candidateCount: candidates.length,
      pendingExcluded,
      nonExpenseExcluded,
      annualFootprint: roundMoney(candidates.reduce((sum, item) => sum + item.annualCost, 0)),
      annualizedIncreases: roundMoney(candidates.reduce((sum, item) => sum + item.annualIncrease, 0)),
      priceIncreaseCount: candidates.filter((item) => item.priceIncrease).length
    }
  };
}

function safeItem(value = {}) {
  const decision = RECURRING_DECISIONS.includes(clean(value.decision, 40))
    ? clean(value.decision, 40)
    : '';
  const status = FOLLOW_UP_STATUSES.includes(clean(value.status, 40))
    ? clean(value.status, 40)
    : 'not-started';
  return {
    decision,
    status,
    owner: clean(value.owner, 80),
    targetDate: validDate(value.targetDate) ? value.targetDate : '',
    notes: clean(value.notes, 800),
    createdAt: validIso(value.createdAt) ? new Date(value.createdAt).toISOString() : '',
    updatedAt: validIso(value.updatedAt) ? new Date(value.updatedAt).toISOString() : ''
  };
}

function safeHistoryEntry(value = {}) {
  const candidateIdValue = clean(value.candidateId, 100);
  if (!candidateIdValue || !validIso(value.updatedAt)) return null;
  return {
    candidateId: candidateIdValue,
    previousDecision: RECURRING_DECISIONS.includes(clean(value.previousDecision, 40))
      ? clean(value.previousDecision, 40)
      : '',
    decision: RECURRING_DECISIONS.includes(clean(value.decision, 40))
      ? clean(value.decision, 40)
      : '',
    status: FOLLOW_UP_STATUSES.includes(clean(value.status, 40))
      ? clean(value.status, 40)
      : 'not-started',
    updatedAt: new Date(value.updatedAt).toISOString()
  };
}

export function sanitizeRecurringDecisionStore(value = {}) {
  const items = {};
  const entries = Object.entries(value?.items && typeof value.items === 'object' && !Array.isArray(value.items)
    ? value.items
    : {});
  for (const [rawId, rawItem] of entries) {
    const id = clean(rawId, 100);
    if (!/^recurring-[0-9a-f]{8}$/.test(id) || Object.keys(items).length >= MAX_RECURRING_DECISIONS) continue;
    const item = safeItem(rawItem);
    if (!item.decision && item.status === 'not-started' && !item.owner && !item.targetDate && !item.notes) continue;
    items[id] = item;
  }

  const history = [];
  for (const rawEntry of Array.isArray(value?.history) ? value.history : []) {
    const entry = safeHistoryEntry(rawEntry);
    if (!entry) continue;
    history.push(entry);
    if (history.length >= MAX_RECURRING_HISTORY) break;
  }

  return {
    version: RECURRING_DECISION_VERSION,
    items,
    history,
    updatedAt: validIso(value?.updatedAt) ? new Date(value.updatedAt).toISOString() : ''
  };
}

export function setRecurringDecision(storeValue, candidateIdValue, inputValue = {}, {
  now = new Date().toISOString()
} = {}) {
  const store = sanitizeRecurringDecisionStore(storeValue);
  const candidateIdValueClean = clean(candidateIdValue, 100);
  if (!/^recurring-[0-9a-f]{8}$/.test(candidateIdValueClean)) {
    throw new Error('A valid recurring candidate is required.');
  }
  if (!validIso(now)) throw new Error('The recurring decision timestamp is invalid.');
  const next = safeItem({ ...inputValue, updatedAt: now });
  if (!next.decision) throw new Error('Choose a recurring-cost decision before saving.');
  if (next.decision === 'completed') next.status = 'done';
  if (!next.createdAt) next.createdAt = store.items[candidateIdValueClean]?.createdAt || new Date(now).toISOString();
  next.updatedAt = new Date(now).toISOString();
  const previous = store.items[candidateIdValueClean] || safeItem({});

  return sanitizeRecurringDecisionStore({
    version: RECURRING_DECISION_VERSION,
    items: {
      ...store.items,
      [candidateIdValueClean]: next
    },
    history: [{
      candidateId: candidateIdValueClean,
      previousDecision: previous.decision,
      decision: next.decision,
      status: next.status,
      updatedAt: next.updatedAt
    }, ...store.history],
    updatedAt: next.updatedAt
  });
}

export function reconcileRecurringDecisions(storeValue, candidatesValue = []) {
  const store = sanitizeRecurringDecisionStore(storeValue);
  const candidates = Array.isArray(candidatesValue) ? candidatesValue : [];
  const currentIds = new Set(candidates.map((candidate) => candidate.candidateId));
  const activeItems = Object.fromEntries(Object.entries(store.items).filter(([id]) => currentIds.has(id)));
  const dormantItems = Object.fromEntries(Object.entries(store.items).filter(([id]) => !currentIds.has(id)));
  const decided = candidates.filter((candidate) => activeItems[candidate.candidateId]?.decision);
  const open = decided.filter((candidate) => activeItems[candidate.candidateId].status !== 'done');
  const due = open.filter((candidate) => activeItems[candidate.candidateId].targetDate);
  const potentialCancellation = roundMoney(candidates.reduce((sum, candidate) => {
    return activeItems[candidate.candidateId]?.decision === 'cancel' ? sum + candidate.annualCost : sum;
  }, 0));
  const increaseUnderReview = roundMoney(candidates.reduce((sum, candidate) => {
    const decision = activeItems[candidate.candidateId]?.decision;
    return ['renegotiate', 'investigate'].includes(decision) ? sum + candidate.annualIncrease : sum;
  }, 0));

  return {
    ...store,
    activeItems,
    dormantItems,
    summary: {
      candidates: candidates.length,
      decided: decided.length,
      unresolved: candidates.length - decided.length,
      open: open.length,
      done: decided.length - open.length,
      due: due.length,
      dormant: Object.keys(dormantItems).length,
      potentialCancellation,
      increaseUnderReview
    }
  };
}

export function recurringDecisionSignature(candidatesValue = []) {
  const candidates = Array.isArray(candidatesValue) ? candidatesValue : [];
  return `fnv1a-${fnv1a(JSON.stringify(candidates.map((candidate) => [
    candidate.candidateId,
    candidate.occurrences,
    candidate.latestDate,
    candidate.latestAmount,
    candidate.cadence
  ]).sort()))}`;
}

export function recurringPlanActions(candidatesValue = [], reconciledValue = {}) {
  const candidates = Array.isArray(candidatesValue) ? candidatesValue : [];
  const items = reconciledValue?.activeItems || {};
  return candidates.map((candidate) => {
    const state = items[candidate.candidateId];
    if (!state?.decision || state.status === 'done' || ['keep', 'completed'].includes(state.decision)) return null;
    const verbs = {
      cancel: 'Review cancellation steps for',
      renegotiate: 'Prepare to renegotiate',
      investigate: 'Investigate'
    };
    return {
      id: `recurring-action-${candidate.candidateId}`,
      candidateId: candidate.candidateId,
      title: `${verbs[state.decision] || 'Review'} ${candidate.displayName}`,
      decision: state.decision,
      status: state.status,
      owner: state.owner,
      targetDate: state.targetDate,
      notes: state.notes,
      annualCost: candidate.annualCost,
      annualIncrease: candidate.annualIncrease,
      evidence: `${candidate.occurrences} posted charges across ${candidate.months} months; ${candidate.cadence} cadence; ${candidate.amountStability} amounts.`,
      nextStep: state.decision === 'cancel'
        ? 'Confirm service ownership, cancellation terms, and the final billing date outside Gringotts.'
        : state.decision === 'renegotiate'
          ? 'Gather the current price, prior price, alternatives, and the household target before contacting the merchant outside Gringotts.'
          : 'Confirm whether the charges are expected, still useful, and correctly classified before choosing a final action.'
    };
  }).filter(Boolean);
}
