const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const FORBIDDEN_EXPORT_KEYS = new Set([
  'transaction', 'transactions', 'merchant', 'merchants', 'account', 'accounts',
  'accountlabel', 'accountlabels', 'owner', 'owners', 'name', 'names', 'note', 'notes',
  'id', 'ids', 'filename', 'filenames', 'fingerprint', 'fingerprints', 'raw', 'rows',
  'routing', 'credential', 'credentials', 'token', 'tokens', 'vault', 'vaults'
]);

const RECURRING_CATEGORY_PATTERNS = [
  /subscription/i, /utility|utilities/i, /housing|rent|mortgage/i,
  /insurance/i, /phone|internet|cable/i, /childcare/i, /debt|loan/i
];

const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const rounded = (value) => Math.round((asNumber(value) + Number.EPSILON) * 100) / 100;
const cleanText = (value) => String(value ?? '').trim();

export function normalizeMonth(value) {
  const candidate = cleanText(value).slice(0, 7);
  return MONTH_RE.test(candidate) ? candidate : '';
}

export function previousCalendarMonth(month) {
  if (!normalizeMonth(month)) return '';
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function transactionMonth(transaction) {
  return normalizeMonth(transaction?.date);
}

function transactionAmount(transaction) {
  return Math.abs(asNumber(transaction?.amount));
}

function transactionKind(transaction) {
  const type = cleanText(transaction?.type).toLowerCase();
  const category = cleanText(transaction?.category).toLowerCase();
  const joined = `${type} ${category}`;
  if (joined.includes('transfer')) return 'transfer';
  if (joined.includes('income') || joined.includes('deposit') || asNumber(transaction?.amount) < 0) return 'income';
  return 'expense';
}

function recurringIdentity(transaction) {
  const merchant = cleanText(transaction?.merchant || transaction?.name)
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/[^a-z#]+/g, ' ')
    .trim();
  return merchant.length >= 3 ? merchant : '';
}

function recurringCandidates(transactions) {
  const monthsByIdentity = new Map();
  transactions.forEach((transaction) => {
    if (transactionKind(transaction) !== 'expense' || transaction?.pending) return;
    const identity = recurringIdentity(transaction);
    const month = transactionMonth(transaction);
    if (!identity || !month) return;
    const months = monthsByIdentity.get(identity) || new Set();
    months.add(month);
    monthsByIdentity.set(identity, months);
  });
  return new Set([...monthsByIdentity]
    .filter(([, months]) => months.size >= 2)
    .map(([identity]) => identity));
}

function isRecurringExpense(transaction, recurringSet) {
  const category = cleanText(transaction?.category);
  if (RECURRING_CATEGORY_PATTERNS.some((pattern) => pattern.test(category))) return true;
  const identity = recurringIdentity(transaction);
  return Boolean(identity && recurringSet.has(identity));
}

function closeEventsForMonth(closeStore, month) {
  const raw = closeStore?.months?.[month]?.events;
  return Array.isArray(raw) ? raw.filter((event) => event && typeof event === 'object') : [];
}

export function closeStateForMonth(closeStore, month) {
  const events = closeEventsForMonth(closeStore, month);
  const closeEvents = events.filter((event) => event.type === 'close');
  const reopenEvents = events.filter((event) => event.type === 'reopen');
  const lastEvent = events.at(-1) || null;
  return {
    status: lastEvent?.type === 'close' ? 'closed' : 'open',
    revision: closeEvents.length,
    closeEvents: closeEvents.length,
    reopenEvents: reopenEvents.length,
    lastEventType: cleanText(lastEvent?.type) || 'none',
    lastEventAt: cleanText(lastEvent?.timestamp || lastEvent?.createdAt || lastEvent?.at),
    snapshot: closeEvents.at(-1)?.snapshot && typeof closeEvents.at(-1).snapshot === 'object'
      ? closeEvents.at(-1).snapshot
      : null
  };
}

function monthCoverage(transactions) {
  const dates = transactions
    .map((transaction) => cleanText(transaction?.date).slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return {
    firstDate: dates[0] || '',
    lastDate: dates.at(-1) || '',
    daySpan: dates.length > 0
      ? Math.max(1, Math.round((Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) / 86400000) + 1)
      : 0
  };
}

function snapshotCategoryBuckets(snapshot, totalExpense) {
  const categories = Array.isArray(snapshot?.categories) ? snapshot.categories : [];
  let recurringExpense = 0;
  let usableCategories = 0;
  categories.forEach((entry) => {
    const category = cleanText(entry?.category);
    const normalized = category.toLowerCase();
    if (!category || normalized.includes('income') || normalized.includes('transfer')) return;
    usableCategories += 1;
    if (RECURRING_CATEGORY_PATTERNS.some((pattern) => pattern.test(category))) {
      recurringExpense += Math.abs(asNumber(entry?.amount));
    }
  });
  recurringExpense = Math.min(Math.max(0, rounded(recurringExpense)), Math.max(0, rounded(totalExpense)));
  return {
    recurringExpense,
    variableExpense: rounded(Math.max(0, asNumber(totalExpense) - recurringExpense)),
    categoryDetailAvailable: usableCategories > 0
  };
}

function snapshotCoverage(snapshot) {
  const accounts = Array.isArray(snapshot?.accounts) ? snapshot.accounts : [];
  const dates = accounts.flatMap((entry) => [cleanText(entry?.earliest), cleanText(entry?.latest)])
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return {
    firstDate: dates[0] || '',
    lastDate: dates.at(-1) || '',
    daySpan: dates.length > 0
      ? Math.max(1, Math.round((Date.parse(`${dates.at(-1)}T00:00:00Z`) - Date.parse(`${dates[0]}T00:00:00Z`)) / 86400000) + 1)
      : 0
  };
}

function monthSummary(month, allTransactions, closeStore, recurringSet) {
  const monthTransactions = allTransactions.filter((transaction) => transactionMonth(transaction) === month);
  const posted = monthTransactions.filter((transaction) => !transaction?.pending);
  const pending = monthTransactions.filter((transaction) => Boolean(transaction?.pending));
  const unreviewed = posted.filter((transaction) => transaction?.reviewed === false || transaction?.review_required === true);
  const liveAccounts = new Set(posted.map((transaction) => cleanText(transaction?.account)).filter(Boolean));

  let income = 0;
  let recurringExpense = 0;
  let variableExpense = 0;
  let transferIn = 0;
  let transferOut = 0;
  let transferCount = 0;

  posted.forEach((transaction) => {
    const amount = transactionAmount(transaction);
    const kind = transactionKind(transaction);
    if (kind === 'transfer') {
      transferCount += 1;
      if (asNumber(transaction?.amount) < 0) transferIn += amount;
      else transferOut += amount;
      return;
    }
    if (kind === 'income') {
      income += amount;
      return;
    }
    if (isRecurringExpense(transaction, recurringSet)) recurringExpense += amount;
    else variableExpense += amount;
  });

  const close = closeStateForMonth(closeStore, month);
  const snapshot = close.snapshot;
  const snapshotMetrics = snapshot?.metrics && typeof snapshot.metrics === 'object' ? snapshot.metrics : null;
  const snapshotCount = asNumber(snapshot?.transactionCount ?? snapshot?.postedCount ?? snapshot?.rows);
  const snapshotAccounts = Array.isArray(snapshot?.accounts)
    ? snapshot.accounts.length
    : asNumber(snapshot?.accountCount ?? snapshot?.reconciledAccounts);
  const hasSnapshotTotals = close.status === 'closed' && snapshotMetrics
    && ['income', 'spend', 'net'].every((key) => Number.isFinite(Number(snapshotMetrics[key])));

  let evidenceSource = 'posted-rows';
  let categoryDetailAvailable = true;
  let coverage = monthCoverage(posted);
  let evidencePosted = posted.length;
  let evidencePending = pending.length;
  let evidenceUnreviewed = unreviewed.length;
  let evidenceAccounts = liveAccounts.size;

  if (hasSnapshotTotals) {
    evidenceSource = 'close-snapshot';
    income = asNumber(snapshotMetrics.income);
    const expense = Math.max(0, asNumber(snapshotMetrics.spend));
    const buckets = snapshotCategoryBuckets(snapshot, expense);
    recurringExpense = buckets.recurringExpense;
    variableExpense = buckets.variableExpense;
    categoryDetailAvailable = buckets.categoryDetailAvailable;
    transferIn = 0;
    transferOut = Math.max(0, asNumber(snapshotMetrics.transfers));
    transferCount = Array.isArray(snapshot?.accounts)
      ? snapshot.accounts.reduce((sum, entry) => sum + asNumber(entry?.transfers), 0) > 0 ? 1 : 0
      : 0;
    coverage = snapshotCoverage(snapshot);
    evidencePosted = snapshotCount || posted.length;
    evidencePending = Math.max(0, asNumber(snapshotMetrics.pending));
    evidenceUnreviewed = Math.max(0, asNumber(snapshotMetrics.review));
    evidenceAccounts = snapshotAccounts || liveAccounts.size;
  }

  const expense = recurringExpense + variableExpense;
  const snapshotCurrentMismatch = close.status === 'closed' && snapshotCount > 0 && posted.length > 0
    ? snapshotCount !== posted.length || (snapshotAccounts > 0 && snapshotAccounts !== liveAccounts.size)
    : false;

  return {
    month,
    status: close.status,
    revision: close.revision,
    closeEvents: close.closeEvents,
    reopenEvents: close.reopenEvents,
    lastEventType: close.lastEventType,
    lastEventAt: close.lastEventAt,
    evidence: {
      source: evidenceSource,
      immutableSnapshot: evidenceSource === 'close-snapshot',
      snapshotCurrentMismatch,
      categoryDetailAvailable
    },
    counts: {
      total: evidencePosted + evidencePending,
      posted: evidencePosted,
      pending: evidencePending,
      unreviewed: evidenceUnreviewed,
      transfers: transferCount,
      accounts: evidenceAccounts,
      snapshotPosted: snapshotCount || null,
      snapshotAccounts: snapshotAccounts || null
    },
    coverage,
    money: {
      income: rounded(income),
      expense: rounded(expense),
      recurringExpense: rounded(recurringExpense),
      variableExpense: rounded(variableExpense),
      operatingNet: hasSnapshotTotals ? rounded(snapshotMetrics.net) : rounded(income - expense),
      transferIn: rounded(transferIn),
      transferOut: rounded(transferOut),
      transferVolume: rounded(transferIn + transferOut)
    }
  };
}

function driver(id, label, current, previous, effectDirection = 'positive') {
  const delta = rounded(current - previous);
  const operatingImpact = effectDirection === 'expense' ? rounded(-delta) : delta;
  return {
    id,
    label,
    current: rounded(current),
    previous: rounded(previous),
    delta,
    operatingImpact,
    direction: operatingImpact > 0.005 ? 'improved' : operatingImpact < -0.005 ? 'declined' : 'stable'
  };
}

function coverageDriver(current, previous) {
  const delta = current.counts.accounts - previous.counts.accounts;
  return {
    id: 'account-coverage',
    label: 'Account coverage',
    current: current.counts.accounts,
    previous: previous.counts.accounts,
    delta,
    operatingImpact: 0,
    direction: delta === 0 ? 'stable' : 'review',
    detail: delta === 0
      ? 'The same number of account labels contributed posted rows.'
      : 'The number of account labels changed, so comparisons may not be like-for-like.'
  };
}

function confidence(current, previous, comparisonAvailable) {
  const reasons = [];
  let score = 100;
  if (!comparisonAvailable) {
    score -= 65;
    reasons.push('No prior month with close or posted evidence is available.');
  }
  if (current.status !== 'closed') {
    score -= 18;
    reasons.push('The selected month is still open and uses posted evidence rather than an immutable close snapshot.');
  } else if (current.evidence.source !== 'close-snapshot') {
    score -= 25;
    reasons.push('The selected month is marked closed but its immutable close snapshot lacks aggregate totals, so posted rows are used as a fallback.');
  }
  if (previous && previous.status !== 'closed') {
    score -= 12;
    reasons.push('The comparison month is not closed.');
  } else if (previous && previous.evidence.source !== 'close-snapshot') {
    score -= 15;
    reasons.push('The comparison month lacks complete immutable close totals.');
  }
  if (current.counts.pending > 0) {
    score -= 10;
    reasons.push(`${current.counts.pending} pending row${current.counts.pending === 1 ? '' : 's'} are excluded.`);
  }
  if (current.counts.unreviewed > 0) {
    score -= 10;
    reasons.push(`${current.counts.unreviewed} posted row${current.counts.unreviewed === 1 ? '' : 's'} still need review.`);
  }
  if (previous && current.counts.accounts !== previous.counts.accounts) {
    score -= 12;
    reasons.push('Account coverage changed between months.');
  }
  if (current.evidence.snapshotCurrentMismatch || previous?.evidence?.snapshotCurrentMismatch) {
    score -= 15;
    reasons.push('Current posted rows no longer match at least one immutable close snapshot; closed figures remain snapshot-based.');
  }
  if (!current.evidence.categoryDetailAvailable || (previous && !previous.evidence.categoryDetailAvailable)) {
    score -= 10;
    reasons.push('At least one close snapshot lacks category detail, limiting recurring-versus-variable attribution.');
  }
  if (current.counts.posted < 4 || (previous && previous.counts.posted < 4)) {
    score -= 12;
    reasons.push('One of the compared months has limited aggregate activity.');
  }
  if (current.coverage.daySpan > 0 && current.coverage.daySpan < 20 && current.status !== 'closed') {
    score -= 8;
    reasons.push('The selected open month has a short observed date span.');
  }
  const bounded = Math.max(0, Math.min(100, score));
  return {
    score: bounded,
    level: bounded >= 80 ? 'high' : bounded >= 55 ? 'medium' : 'low',
    reasons: reasons.length ? reasons : ['Both months use immutable close snapshots with consistent coverage and complete category detail.']
  };
}

function trendLabel(delta) {
  if (delta > 0.005) return 'improved';
  if (delta < -0.005) return 'declined';
  return 'stable';
}

function monthSort(a, b) {
  return a.localeCompare(b);
}

function availableMonths(transactions, closeStore) {
  const months = new Set(transactions.map(transactionMonth).filter(Boolean));
  Object.keys(closeStore?.months || {}).map(normalizeMonth).filter(Boolean).forEach((month) => months.add(month));
  return [...months].sort(monthSort);
}

function comparisonMonthFor(selectedMonth, summaries) {
  const calendarPrevious = previousCalendarMonth(selectedMonth);
  if (summaries.has(calendarPrevious)) return calendarPrevious;
  return [...summaries.keys()].filter((month) => month < selectedMonth).sort(monthSort).at(-1) || '';
}

function explainDrivers(drivers) {
  return drivers
    .filter((entry) => entry.id !== 'account-coverage')
    .sort((a, b) => Math.abs(b.operatingImpact) - Math.abs(a.operatingImpact))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function buildCloseTrendModel(transactions = [], closeStore = {}, selectedMonth = '') {
  const safeTransactions = Array.isArray(transactions) ? transactions.filter((entry) => entry && typeof entry === 'object') : [];
  const months = availableMonths(safeTransactions, closeStore);
  const selected = normalizeMonth(selectedMonth) || months.at(-1) || '';
  if (selected && !months.includes(selected)) months.push(selected);
  months.sort(monthSort);
  const recurringSet = recurringCandidates(safeTransactions);
  const summaries = new Map(months.map((month) => [month, monthSummary(month, safeTransactions, closeStore, recurringSet)]));
  const current = summaries.get(selected) || monthSummary(selected, safeTransactions, closeStore, recurringSet);
  const comparisonMonth = comparisonMonthFor(selected, summaries);
  const previous = summaries.get(comparisonMonth) || null;

  const rawDrivers = previous ? [
    driver('income', 'Income', current.money.income, previous.money.income),
    driver('recurring-expense', 'Recurring expenses', current.money.recurringExpense, previous.money.recurringExpense, 'expense'),
    driver('variable-expense', 'Variable expenses', current.money.variableExpense, previous.money.variableExpense, 'expense'),
    coverageDriver(current, previous)
  ] : [];
  const drivers = explainDrivers(rawDrivers);
  const operatingDelta = previous ? rounded(current.money.operatingNet - previous.money.operatingNet) : null;
  const confidenceResult = confidence(current, previous, Boolean(previous));
  const trend = operatingDelta === null ? 'unavailable' : trendLabel(operatingDelta);

  const warnings = [];
  if (current.money.transferVolume > 0) warnings.push('Transfers are shown for context but excluded from income, spending, and operating-net comparisons.');
  if (current.evidence.source === 'close-snapshot') warnings.push('Closed-month totals come from the immutable close snapshot, not from later transaction edits.');
  if (current.evidence.snapshotCurrentMismatch || previous?.evidence?.snapshotCurrentMismatch) warnings.push('Current posted rows differ from a retained close snapshot; the comparison preserves the snapshot and lowers confidence.');
  if (!current.evidence.categoryDetailAvailable || (previous && !previous.evidence.categoryDetailAvailable)) warnings.push('Recurring and variable attribution is limited because category detail is incomplete.');
  if (current.status !== 'closed') warnings.push('The selected month is open; results can change as more rows post or are reviewed.');
  if (current.counts.pending > 0) warnings.push('Pending rows are excluded from all money totals.');
  if (current.counts.unreviewed > 0) warnings.push('Posted rows that still need review remain in totals but reduce confidence.');
  if (previous && current.counts.accounts !== previous.counts.accounts) warnings.push('Account coverage changed, so month-to-month totals may not be like-for-like.');
  if (!previous) warnings.push('A prior month comparison is not available.');
  warnings.push('Ranked drivers show aggregate correlation between months, not proof that any event caused the change.');

  return {
    generatedAt: new Date().toISOString(),
    selectedMonth: selected,
    comparisonMonth,
    current,
    previous,
    trend: {
      state: trend,
      operatingDelta,
      headline: operatingDelta === null
        ? 'No prior-month comparison is available.'
        : operatingDelta > 0.005
          ? `Operating net improved by ${Math.abs(operatingDelta).toFixed(2)}.`
          : operatingDelta < -0.005
            ? `Operating net declined by ${Math.abs(operatingDelta).toFixed(2)}.`
            : 'Operating net was effectively unchanged.'
    },
    drivers,
    coverage: rawDrivers.find((entry) => entry.id === 'account-coverage') || null,
    confidence: confidenceResult,
    warnings,
    history: [...summaries.values()].sort((a, b) => b.month.localeCompare(a.month)),
    boundaries: {
      localOnly: true,
      aggregateOnly: true,
      transferNeutral: true,
      pendingExcluded: true,
      automaticWriteAvailable: false,
      transactionCopiesStored: false,
      counterpartyDetailsExported: false,
      accountLabelsExported: false,
      causationClaimed: false,
      closedEvidenceUsesImmutableSnapshots: true
    }
  };
}

function sanitizeSummary(summary) {
  if (!summary) return null;
  return {
    month: summary.month,
    status: summary.status,
    revision: summary.revision,
    closeEvents: summary.closeEvents,
    reopenEvents: summary.reopenEvents,
    evidence: { ...summary.evidence },
    counts: {
      total: summary.counts.total,
      posted: summary.counts.posted,
      pending: summary.counts.pending,
      unreviewed: summary.counts.unreviewed,
      transfers: summary.counts.transfers,
      accountCount: summary.counts.accounts
    },
    coverage: { ...summary.coverage },
    money: { ...summary.money }
  };
}

function assertExportSafe(value, path = 'package') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertExportSafe(entry, `${path}[${index}]`));
    return true;
  }
  if (!value || typeof value !== 'object') return true;
  Object.entries(value).forEach(([key, entry]) => {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
    if (FORBIDDEN_EXPORT_KEYS.has(normalized)) {
      throw new Error(`Close trend package contains a forbidden household-data field at ${path}.${key}.`);
    }
    assertExportSafe(entry, `${path}.${key}`);
  });
  return true;
}

export function buildCloseTrendPackage(model) {
  const payload = {
    schema: 'gringotts.close-trend-explainability.v1',
    generatedAt: new Date().toISOString(),
    selectedMonth: normalizeMonth(model?.selectedMonth),
    comparisonMonth: normalizeMonth(model?.comparisonMonth),
    trend: model?.trend ? { ...model.trend } : null,
    confidence: model?.confidence ? {
      level: model.confidence.level,
      score: model.confidence.score,
      reasons: [...(model.confidence.reasons || [])]
    } : null,
    current: sanitizeSummary(model?.current),
    previous: sanitizeSummary(model?.previous),
    drivers: (model?.drivers || []).map((entry) => ({
      rank: entry.rank,
      driverCode: entry.id,
      label: entry.label,
      current: entry.current,
      previous: entry.previous,
      delta: entry.delta,
      operatingImpact: entry.operatingImpact,
      direction: entry.direction
    })),
    warnings: [...(model?.warnings || [])],
    boundaries: { ...(model?.boundaries || {}) }
  };
  assertExportSafe(payload);
  return payload;
}

export function closeTrendWorkbookSheets(model) {
  const historyRows = (model?.history || []).map((summary) => [
    summary.month,
    summary.status,
    summary.revision,
    summary.reopenEvents,
    summary.evidence.source,
    summary.evidence.snapshotCurrentMismatch ? 'Review' : 'Consistent',
    summary.counts.posted,
    summary.counts.pending,
    summary.counts.unreviewed,
    summary.counts.accounts,
    summary.money.income,
    summary.money.recurringExpense,
    summary.money.variableExpense,
    summary.money.expense,
    summary.money.operatingNet,
    summary.money.transferVolume,
    summary.coverage.firstDate,
    summary.coverage.lastDate
  ]);
  const driverRows = (model?.drivers || []).map((entry) => [
    entry.rank, entry.label, entry.previous, entry.current, entry.delta,
    entry.operatingImpact, entry.direction
  ]);
  return [
    {
      name: 'Close Trends',
      rows: [
        ['Month', 'Status', 'Revision', 'Reopen Events', 'Evidence Source', 'Snapshot Consistency', 'Posted Rows', 'Pending Excluded', 'Unreviewed', 'Account Count', 'Income', 'Recurring Expense', 'Variable Expense', 'Total Expense', 'Operating Net', 'Transfer Volume Excluded', 'Coverage Start', 'Coverage End'],
        ...historyRows
      ]
    },
    {
      name: 'Close Drivers',
      rows: [
        ['Rank', 'Driver', 'Prior Month', 'Selected Month', 'Change', 'Operating-Net Impact', 'Direction'],
        ...driverRows,
        [],
        ['Confidence', model?.confidence?.level || 'low'],
        ['Confidence Score', model?.confidence?.score ?? 0],
        ['Selected Month', model?.selectedMonth || ''],
        ['Comparison Month', model?.comparisonMonth || ''],
        ['Transfer Rule', 'Transfers excluded from operating comparisons'],
        ['Pending Rule', 'Pending rows excluded from all money totals'],
        ['Causation Rule', 'Aggregate drivers show correlation, not proof of causation']
      ]
    }
  ];
}
