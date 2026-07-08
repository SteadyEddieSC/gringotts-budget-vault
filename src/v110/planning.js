import {
  account, best, cashflow, categoryTotals, dte, flow, getMonth, isPending, metrics,
  num, read, reportAmount, rowsForMonth, save, saveCashflow, txName, uid
} from '../v103/core.js';
import { expandedWorkbookSheetsV108 } from '../v108/goals.js';

export const MONTH_CLOSE_KEY = 'gringottsMonthClose.v1';
export const FORECAST_KEY = 'gringottsForecastSettings.v1';
export const DEBT_PLAN_KEY = 'gringottsDebtPlan.v1';

const FREQUENCIES = new Set(['once', 'weekly', 'biweekly', 'monthly']);
const DAY_MS = 86_400_000;
const clean = (value) => String(value ?? '').trim();
const roundMoney = (value) => Math.round((num(value) + Number.EPSILON) * 100) / 100;
const todayIso = () => new Date().toISOString().slice(0, 10);

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(clean(value));
}

function normalizeText(value) {
  return clean(value).toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function transactionToken(transaction) {
  const idKeys = ['transaction_id', 'transactionId', 'id', 'source_transaction_id', 'sourceTransactionId', 'external_id', 'externalId', 'fitid', 'FITID'];
  const stableId = idKeys.map((key) => clean(transaction?.[key])).find(Boolean);
  if (stableId) return `id:${stableId}`;
  return `fp:${[
    dte(transaction),
    Number.isFinite(Number(transaction?.amount)) ? Number(transaction.amount).toFixed(4) : 'invalid',
    normalizeText(txName(transaction)),
    normalizeText(account(transaction))
  ].join('|')}`;
}

export function monthTransactionSignature(month = getMonth()) {
  const tokens = rowsForMonth(month).map(transactionToken).sort();
  return `${tokens.length}:${fnv1a(tokens.join('\n'))}`;
}

function closeStore() {
  const stored = read(MONTH_CLOSE_KEY, { months: {}, updatedAt: '' });
  return {
    months: stored?.months && typeof stored.months === 'object' && !Array.isArray(stored.months) ? stored.months : {},
    updatedAt: clean(stored?.updatedAt)
  };
}

function monthRecord(month = getMonth()) {
  const record = closeStore().months?.[month];
  return {
    reconciliations: record?.reconciliations && typeof record.reconciliations === 'object' ? record.reconciliations : {},
    events: Array.isArray(record?.events) ? record.events.filter((event) => event && typeof event === 'object') : []
  };
}

function saveMonthRecord(month, record) {
  const stored = closeStore();
  stored.months[month] = {
    reconciliations: record.reconciliations || {},
    events: Array.isArray(record.events) ? record.events : []
  };
  stored.updatedAt = new Date().toISOString();
  save(MONTH_CLOSE_KEY, stored);
  return monthRecord(month);
}

export function monthCloseStatus(month = getMonth()) {
  const record = monthRecord(month);
  const latest = record.events.at(-1) || null;
  const closed = latest?.type === 'close';
  const closeEvent = closed ? latest : [...record.events].reverse().find((event) => event.type === 'close') || null;
  const currentSignature = monthTransactionSignature(month);
  return {
    month,
    closed,
    latest,
    closeEvent,
    events: record.events,
    currentSignature,
    drifted: Boolean(closed && closeEvent?.snapshot?.transactionSignature && closeEvent.snapshot.transactionSignature !== currentSignature)
  };
}

export function accountSummaries(month = getMonth()) {
  const grouped = new Map();
  rowsForMonth(month).forEach((transaction) => {
    const name = clean(account(transaction)) || 'Unassigned account';
    const list = grouped.get(name) || [];
    list.push(transaction);
    grouped.set(name, list);
  });
  return [...grouped.entries()].map(([name, rows]) => {
    const posted = rows.filter((transaction) => !isPending(transaction));
    const dates = rows.map(dte).filter(validDate).sort();
    let inflows = 0;
    let outflows = 0;
    let transfers = 0;
    posted.forEach((transaction) => {
      const amount = reportAmount(transaction);
      const kind = flow(transaction);
      if (kind === 'Income') inflows += amount;
      else if (kind === 'Expense') outflows += amount;
      else transfers += amount;
    });
    return {
      account: name,
      count: rows.length,
      postedCount: posted.length,
      pendingCount: rows.length - posted.length,
      signedNet: roundMoney(posted.reduce((sum, transaction) => sum + num(transaction.amount), 0)),
      inflows: roundMoney(inflows),
      outflows: roundMoney(outflows),
      transfers: roundMoney(transfers),
      earliest: dates[0] || '',
      latest: dates.at(-1) || ''
    };
  }).sort((left, right) => left.account.localeCompare(right.account));
}

export function reconciliationsForMonth(month = getMonth()) {
  return monthRecord(month).reconciliations;
}

export function saveReconciliation(month, payload) {
  const status = monthCloseStatus(month);
  if (status.closed) throw new Error('Reopen the month before changing reconciliation records.');
  const accountName = clean(payload?.account);
  const summary = accountSummaries(month).find((item) => item.account === accountName);
  if (!summary) throw new Error('The selected account is not present in this month.');
  const statementCount = Number(payload?.statementCount);
  const statementNet = Number(payload?.statementNet);
  const notes = clean(payload?.notes);
  const acceptDifference = Boolean(payload?.acceptDifference);
  if (!Number.isInteger(statementCount) || statementCount < 0) throw new Error('Statement posted count must be a whole number of zero or more.');
  if (!Number.isFinite(statementNet)) throw new Error('Statement net activity must be a valid number.');
  const countVariance = statementCount - summary.postedCount;
  const amountVariance = roundMoney(statementNet - summary.signedNet);
  const exact = countVariance === 0 && Math.abs(amountVariance) <= 0.01;
  if (!exact && acceptDifference && notes.length < 4) throw new Error('Explain the accepted difference in the reconciliation notes.');
  const record = monthRecord(month);
  record.reconciliations[accountName] = {
    account: accountName,
    statementCount,
    statementNet: roundMoney(statementNet),
    vaultPostedCount: summary.postedCount,
    vaultSignedNet: summary.signedNet,
    countVariance,
    amountVariance,
    acceptDifference: !exact && acceptDifference,
    status: exact ? 'matched' : acceptDifference ? 'accepted-difference' : 'difference',
    notes,
    transactionSignature: monthTransactionSignature(month),
    savedAt: new Date().toISOString()
  };
  saveMonthRecord(month, record);
  return record.reconciliations[accountName];
}

export function closeReadiness(month = getMonth()) {
  const selectedMetrics = metrics(month);
  const accounts = accountSummaries(month);
  const reconciliations = reconciliationsForMonth(month);
  const blockers = [];
  const warnings = [];
  const signature = monthTransactionSignature(month);
  if (!selectedMetrics.count) blockers.push('No transactions are stored for the selected month.');
  if (selectedMetrics.pending) blockers.push(`${selectedMetrics.pending} pending transaction${selectedMetrics.pending === 1 ? '' : 's'} must post or be removed before close.`);
  if (selectedMetrics.review) blockers.push(`${selectedMetrics.review} transaction${selectedMetrics.review === 1 ? '' : 's'} still need review or a specific category.`);
  accounts.forEach((summary) => {
    const reconciliation = reconciliations[summary.account];
    if (!reconciliation) blockers.push(`${summary.account} has not been reconciled.`);
    else if (reconciliation.transactionSignature !== signature) blockers.push(`${summary.account} reconciliation is stale because selected-month transactions changed.`);
    else if (reconciliation.status === 'difference') blockers.push(`${summary.account} still has an unexplained statement difference.`);
    else if (reconciliation.status === 'accepted-difference') warnings.push(`${summary.account} closes with an accepted difference: ${reconciliation.notes}`);
  });
  if (!accounts.length && selectedMetrics.count) blockers.push('No account labels are available for statement reconciliation.');
  return {
    month,
    metrics: selectedMetrics,
    accounts,
    reconciliations,
    blockers,
    warnings,
    ready: blockers.length === 0,
    status: monthCloseStatus(month)
  };
}

function snapshotForClose(month, note) {
  const readiness = closeReadiness(month);
  const categories = categoryTotals(month).map(([category, amount]) => ({ category, amount: roundMoney(amount) }));
  return {
    selectedVault: best()?.key || 'none',
    transactionSignature: monthTransactionSignature(month),
    transactionCount: readiness.metrics.count,
    metrics: {
      income: roundMoney(readiness.metrics.income),
      spend: roundMoney(readiness.metrics.spend),
      transfers: roundMoney(readiness.metrics.transfers),
      net: roundMoney(readiness.metrics.net),
      pending: readiness.metrics.pending,
      review: readiness.metrics.review
    },
    categories,
    accounts: readiness.accounts,
    reconciliations: Object.values(readiness.reconciliations),
    note: clean(note)
  };
}

export function closeMonth(month = getMonth(), note = '') {
  const status = monthCloseStatus(month);
  if (status.closed) throw new Error('This month is already closed. Reopen it before creating another close revision.');
  const readiness = closeReadiness(month);
  if (!readiness.ready) throw new Error(readiness.blockers[0] || 'The month is not ready to close.');
  const record = monthRecord(month);
  const revision = record.events.filter((event) => event.type === 'close').length + 1;
  const event = {
    id: uid('close'),
    type: 'close',
    month,
    revision,
    capturedAt: new Date().toISOString(),
    snapshot: snapshotForClose(month, note)
  };
  record.events.push(event);
  saveMonthRecord(month, record);
  const verified = monthRecord(month).events.at(-1);
  if (!verified || verified.id !== event.id || verified.type !== 'close') throw new Error('Month-close verification failed.');
  return event;
}

export function reopenMonth(month = getMonth(), reason = '') {
  const status = monthCloseStatus(month);
  const explanation = clean(reason);
  if (!status.closed || !status.latest?.id) throw new Error('The selected month is not currently closed.');
  if (explanation.length < 8) throw new Error('Enter a specific reopen reason of at least 8 characters.');
  const record = monthRecord(month);
  const event = {
    id: uid('reopen'),
    type: 'reopen',
    month,
    capturedAt: new Date().toISOString(),
    targetCloseId: status.latest.id,
    targetRevision: status.latest.revision,
    reason: explanation
  };
  record.events.push(event);
  saveMonthRecord(month, record);
  const verified = monthRecord(month).events.at(-1);
  if (!verified || verified.id !== event.id || verified.type !== 'reopen') throw new Error('Month-reopen verification failed.');
  return event;
}

export function allCloseEvents() {
  const stored = closeStore();
  return Object.entries(stored.months).flatMap(([month, record]) => (Array.isArray(record?.events) ? record.events : []).map((event) => ({ ...event, month })))
    .sort((left, right) => String(right.capturedAt || '').localeCompare(String(left.capturedAt || '')));
}

export function forecastSettings() {
  const stored = read(FORECAST_KEY, {});
  const horizon = Number(stored?.horizonDays);
  return {
    asOfDate: validDate(stored?.asOfDate) ? stored.asOfDate : todayIso(),
    startingCash: roundMoney(stored?.startingCash),
    minimumBuffer: Math.max(0, roundMoney(stored?.minimumBuffer || 0)),
    flexibleMonthlySpend: Math.max(0, roundMoney(stored?.flexibleMonthlySpend || 0)),
    horizonDays: [30, 60, 90].includes(horizon) ? horizon : 60
  };
}

export function saveForecastSettings(payload) {
  const asOfDate = clean(payload?.asOfDate);
  const startingCash = Number(payload?.startingCash);
  const minimumBuffer = Number(payload?.minimumBuffer);
  const flexibleMonthlySpend = Number(payload?.flexibleMonthlySpend);
  const horizonDays = Number(payload?.horizonDays);
  if (!validDate(asOfDate)) throw new Error('Choose a valid forecast start date.');
  if (![startingCash, minimumBuffer, flexibleMonthlySpend].every(Number.isFinite)) throw new Error('Forecast amounts must be valid numbers.');
  if (minimumBuffer < 0 || flexibleMonthlySpend < 0) throw new Error('Buffer and flexible spending cannot be negative.');
  if (![30, 60, 90].includes(horizonDays)) throw new Error('Forecast horizon must be 30, 60, or 90 days.');
  const value = { asOfDate, startingCash: roundMoney(startingCash), minimumBuffer: roundMoney(minimumBuffer), flexibleMonthlySpend: roundMoney(flexibleMonthlySpend), horizonDays, updatedAt: new Date().toISOString() };
  save(FORECAST_KEY, value);
  return value;
}

export function planningEvents() {
  const stored = cashflow();
  const normalize = (item, type, index) => ({
    id: clean(item?.id) || `legacy_${type}_${fnv1a([clean(item?.name), clean(type === 'bill' ? item?.dueDate : item?.date), roundMoney(item?.amount), index].join('|'))}`,
    type,
    name: clean(item?.name) || (type === 'bill' ? 'Unnamed bill' : 'Unnamed payday'),
    amount: Math.max(0, roundMoney(item?.amount)),
    date: clean(type === 'bill' ? item?.dueDate : item?.date),
    frequency: FREQUENCIES.has(item?.frequency) ? item.frequency : 'once',
    account: clean(item?.account)
  });
  return [
    ...(Array.isArray(stored?.bills) ? stored.bills : []).map((item, index) => normalize(item, 'bill', index)),
    ...(Array.isArray(stored?.paydays) ? stored.paydays : []).map((item, index) => normalize(item, 'payday', index))
  ].sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name));
}

export function savePlanningEvent(type, payload) {
  if (!['bill', 'payday'].includes(type)) throw new Error('Unsupported planning-event type.');
  const name = clean(payload?.name);
  const amount = Number(payload?.amount);
  const date = clean(payload?.date);
  const frequency = FREQUENCIES.has(payload?.frequency) ? payload.frequency : 'once';
  if (!name || !validDate(date) || !Number.isFinite(amount) || amount <= 0) throw new Error('Name, positive amount, and valid date are required.');
  const stored = cashflow();
  stored.bills = Array.isArray(stored?.bills) ? stored.bills : [];
  stored.paydays = Array.isArray(stored?.paydays) ? stored.paydays : [];
  const item = { id: uid(type === 'bill' ? 'b' : 'p'), name, amount: roundMoney(amount), frequency, account: clean(payload?.account) };
  if (type === 'bill') item.dueDate = date;
  else item.date = date;
  (type === 'bill' ? stored.bills : stored.paydays).unshift(item);
  saveCashflow(stored);
  return item;
}

export function deletePlanningEvent(type, id) {
  if (!['bill', 'payday'].includes(type)) return false;
  const stored = cashflow();
  const key = type === 'bill' ? 'bills' : 'paydays';
  const current = Array.isArray(stored?.[key]) ? stored[key] : [];
  const before = current.length;
  stored[key] = current.filter((item, index) => {
    const itemDate = clean(type === 'bill' ? item?.dueDate : item?.date);
    const fallbackId = `legacy_${type}_${fnv1a([clean(item?.name), itemDate, roundMoney(item?.amount), index].join('|'))}`;
    return (clean(item?.id) || fallbackId) !== id;
  });
  if (stored[key].length === before) return false;
  saveCashflow(stored);
  return true;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  return isoDate(new Date(parseDate(value).getTime() + days * DAY_MS));
}

function addMonthsClamped(value, count) {
  const source = parseDate(value);
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + count, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return isoDate(target);
}

function occurrencesFor(event, start, end) {
  if (!validDate(event.date)) return [];
  const output = [];
  let cursor = event.date;
  let iteration = 0;
  while (cursor < start && iteration < 500) {
    if (event.frequency === 'once') return [];
    cursor = event.frequency === 'weekly' ? addDays(cursor, 7)
      : event.frequency === 'biweekly' ? addDays(cursor, 14)
        : addMonthsClamped(event.date, iteration + 1);
    iteration += 1;
  }
  while (cursor <= end && iteration < 500) {
    if (cursor >= start) output.push({ ...event, occurrenceDate: cursor });
    if (event.frequency === 'once') break;
    if (event.frequency === 'weekly') cursor = addDays(cursor, 7);
    else if (event.frequency === 'biweekly') cursor = addDays(cursor, 14);
    else cursor = addMonthsClamped(event.date, iteration + 1);
    iteration += 1;
  }
  return output;
}

function daysInMonth(value) {
  const date = parseDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

export function cashForecast(settings = forecastSettings()) {
  const start = settings.asOfDate;
  const end = addDays(start, settings.horizonDays - 1);
  const occurrences = planningEvents().flatMap((event) => occurrencesFor(event, start, end))
    .sort((left, right) => left.occurrenceDate.localeCompare(right.occurrenceDate) || (left.type === 'payday' ? -1 : 1));
  const byDate = new Map();
  occurrences.forEach((event) => {
    const list = byDate.get(event.occurrenceDate) || [];
    list.push(event);
    byDate.set(event.occurrenceDate, list);
  });
  let balance = roundMoney(settings.startingCash);
  let lowBalance = balance;
  let lowDate = start;
  const pressureDays = [];
  const negativeDays = [];
  const daily = [];
  const monthly = new Map();
  for (let offset = 0; offset < settings.horizonDays; offset += 1) {
    const date = addDays(start, offset);
    const flexible = roundMoney(settings.flexibleMonthlySpend / daysInMonth(date));
    const events = byDate.get(date) || [];
    const income = roundMoney(events.filter((event) => event.type === 'payday').reduce((sum, event) => sum + event.amount, 0));
    const bills = roundMoney(events.filter((event) => event.type === 'bill').reduce((sum, event) => sum + event.amount, 0));
    balance = roundMoney(balance + income - bills - flexible);
    if (balance < lowBalance) { lowBalance = balance; lowDate = date; }
    if (balance < settings.minimumBuffer) pressureDays.push({ date, balance });
    if (balance < 0) negativeDays.push({ date, balance });
    daily.push({ date, income, bills, flexible, balance, events });
    const month = date.slice(0, 7);
    const summary = monthly.get(month) || { month, income: 0, bills: 0, flexible: 0, endBalance: balance };
    summary.income = roundMoney(summary.income + income);
    summary.bills = roundMoney(summary.bills + bills);
    summary.flexible = roundMoney(summary.flexible + flexible);
    summary.endBalance = balance;
    monthly.set(month, summary);
  }
  return {
    settings,
    start,
    end,
    endingBalance: balance,
    lowBalance,
    lowDate,
    pressureDays,
    negativeDays,
    occurrences,
    daily,
    monthly: [...monthly.values()]
  };
}

function debtStore() {
  const stored = read(DEBT_PLAN_KEY, { debts: [], monthlyExtra: 0 });
  return {
    debts: Array.isArray(stored?.debts) ? stored.debts.filter((debt) => debt && typeof debt === 'object') : [],
    monthlyExtra: Math.max(0, roundMoney(stored?.monthlyExtra || 0)),
    updatedAt: clean(stored?.updatedAt)
  };
}

export function debtPlan() {
  return debtStore();
}

export function saveDebt(payload) {
  const stored = debtStore();
  const name = clean(payload?.name);
  const balance = Number(payload?.balance);
  const apr = Number(payload?.apr);
  const minimumPayment = Number(payload?.minimumPayment);
  const targetPayment = Number(payload?.targetPayment || 0);
  const promoAprRaw = clean(payload?.promoApr);
  const promoApr = promoAprRaw === '' ? null : Number(promoAprRaw);
  const promoEnd = clean(payload?.promoEnd);
  if (!name || ![balance, apr, minimumPayment, targetPayment].every(Number.isFinite)) throw new Error('Debt name, balance, APR, and payment amounts are required.');
  if (balance < 0 || apr < 0 || minimumPayment < 0 || targetPayment < 0) throw new Error('Debt amounts and APR cannot be negative.');
  if (promoApr !== null && (!Number.isFinite(promoApr) || promoApr < 0)) throw new Error('Promotional APR must be zero or greater.');
  if (promoEnd && !validDate(promoEnd)) throw new Error('Promotional end date is invalid.');
  const existingIndex = stored.debts.findIndex((debt) => debt.id === payload?.id);
  const existing = existingIndex >= 0 ? stored.debts[existingIndex] : null;
  const debt = {
    id: existing?.id || uid('debt'),
    name,
    balance: roundMoney(balance),
    apr: roundMoney(apr),
    minimumPayment: roundMoney(minimumPayment),
    targetPayment: roundMoney(targetPayment),
    promoApr,
    promoEnd,
    notes: clean(payload?.notes),
    totalPaymentsRecorded: roundMoney(existing?.totalPaymentsRecorded || 0),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (existingIndex >= 0) stored.debts[existingIndex] = debt;
  else stored.debts.unshift(debt);
  stored.updatedAt = new Date().toISOString();
  save(DEBT_PLAN_KEY, stored);
  return debt.id;
}

export function deleteDebt(id) {
  const stored = debtStore();
  const before = stored.debts.length;
  stored.debts = stored.debts.filter((debt) => debt.id !== id);
  if (stored.debts.length === before) return false;
  stored.updatedAt = new Date().toISOString();
  save(DEBT_PLAN_KEY, stored);
  return true;
}

export function applyDebtPayment(id, amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a positive payment amount.');
  const stored = debtStore();
  const debt = stored.debts.find((item) => item.id === id);
  if (!debt) throw new Error('Debt plan entry not found.');
  const applied = Math.min(roundMoney(value), roundMoney(debt.balance));
  debt.balance = roundMoney(debt.balance - applied);
  debt.totalPaymentsRecorded = roundMoney((debt.totalPaymentsRecorded || 0) + applied);
  debt.lastPaymentAt = new Date().toISOString();
  debt.updatedAt = debt.lastPaymentAt;
  stored.updatedAt = debt.lastPaymentAt;
  save(DEBT_PLAN_KEY, stored);
  return applied;
}

export function saveDebtExtra(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new Error('Monthly extra debt amount must be zero or greater.');
  const stored = debtStore();
  stored.monthlyExtra = roundMoney(value);
  stored.updatedAt = new Date().toISOString();
  save(DEBT_PLAN_KEY, stored);
  return stored.monthlyExtra;
}

function monthsUntil(date, from = todayIso()) {
  if (!validDate(date) || date <= from) return 0;
  return Math.max(1, Math.ceil((parseDate(date) - parseDate(from)) / (30.4375 * DAY_MS)));
}

export function debtAnalysis(asOf = forecastSettings().asOfDate) {
  const stored = debtStore();
  const debts = stored.debts.map((debt) => {
    const promoMonths = monthsUntil(debt.promoEnd, asOf);
    const promoActive = Boolean(promoMonths && debt.promoApr !== null && debt.promoApr !== undefined);
    const effectiveApr = promoActive ? num(debt.promoApr) : num(debt.apr);
    const monthlyInterest = roundMoney(num(debt.balance) * effectiveApr / 100 / 12);
    const promoPayoffNeeded = promoActive ? roundMoney(num(debt.balance) / promoMonths) : 0;
    const targetPayment = Math.max(num(debt.minimumPayment), num(debt.targetPayment));
    return {
      ...debt,
      promoMonths,
      promoActive,
      effectiveApr,
      monthlyInterest,
      promoPayoffNeeded,
      targetPayment,
      promoGap: promoActive ? roundMoney(Math.max(0, promoPayoffNeeded - targetPayment)) : 0
    };
  });
  const priority = [...debts].sort((left, right) => {
    const leftUrgent = left.promoActive && left.promoMonths <= 6 ? 1 : 0;
    const rightUrgent = right.promoActive && right.promoMonths <= 6 ? 1 : 0;
    if (leftUrgent !== rightUrgent) return rightUrgent - leftUrgent;
    if (leftUrgent && rightUrgent && left.promoMonths !== right.promoMonths) return left.promoMonths - right.promoMonths;
    return right.effectiveApr - left.effectiveApr || right.balance - left.balance;
  });
  return {
    debts,
    priority,
    monthlyExtra: stored.monthlyExtra,
    totalBalance: roundMoney(debts.reduce((sum, debt) => sum + num(debt.balance), 0)),
    minimumPayments: roundMoney(debts.reduce((sum, debt) => sum + num(debt.minimumPayment), 0)),
    targetPayments: roundMoney(debts.reduce((sum, debt) => sum + debt.targetPayment, 0)),
    estimatedMonthlyInterest: roundMoney(debts.reduce((sum, debt) => sum + debt.monthlyInterest, 0)),
    promoExpiring: debts.filter((debt) => debt.promoActive && debt.promoMonths <= 6).length
  };
}

export function closeForecastSheets(month = getMonth()) {
  const readiness = closeReadiness(month);
  const status = monthCloseStatus(month);
  const forecast = cashForecast();
  const debts = debtAnalysis();
  return [
    {
      name: 'Month Close',
      rows: [
        ['Selected Month', month],
        ['Current Status', status.closed ? 'Closed' : 'Open'],
        ['Current Transaction Signature', status.currentSignature],
        ['Snapshot Drift', status.drifted ? 'Yes' : 'No'],
        ['Readiness', readiness.ready ? 'Ready' : 'Blocked'],
        [],
        ['Blockers'],
        ...readiness.blockers.map((item) => [item]),
        [],
        ['Warnings'],
        ...readiness.warnings.map((item) => [item]),
        [],
        ['Event Type', 'Captured At', 'Revision', 'Reason / Note', 'Transaction Count', 'Income', 'Spending', 'Net'],
        ...status.events.map((event) => [event.type, event.capturedAt, event.revision || event.targetRevision || '', event.reason || event.snapshot?.note || '', event.snapshot?.transactionCount || '', event.snapshot?.metrics?.income || '', event.snapshot?.metrics?.spend || '', event.snapshot?.metrics?.net || ''])
      ]
    },
    {
      name: 'Reconciliations',
      rows: [['Month', 'Account', 'Status', 'Vault Posted Count', 'Statement Count', 'Count Variance', 'Vault Signed Net', 'Statement Net', 'Amount Variance', 'Notes', 'Saved At'], ...Object.values(readiness.reconciliations).map((item) => [month, item.account, item.status, item.vaultPostedCount, item.statementCount, item.countVariance, item.vaultSignedNet, item.statementNet, item.amountVariance, item.notes, item.savedAt])]
    },
    {
      name: 'Cash Forecast',
      rows: [
        ['As Of', forecast.start],
        ['Through', forecast.end],
        ['Starting Cash', forecast.settings.startingCash],
        ['Minimum Buffer', forecast.settings.minimumBuffer],
        ['Flexible Monthly Spend', forecast.settings.flexibleMonthlySpend],
        ['Ending Balance', forecast.endingBalance],
        ['Lowest Balance', forecast.lowBalance],
        ['Lowest Date', forecast.lowDate],
        ['Pressure Days', forecast.pressureDays.length],
        ['Negative Days', forecast.negativeDays.length],
        [],
        ['Month', 'Income', 'Bills', 'Flexible Spend', 'Ending Balance'],
        ...forecast.monthly.map((item) => [item.month, item.income, item.bills, item.flexible, item.endBalance])
      ]
    },
    {
      name: 'Debt Plan',
      rows: [['Debt', 'Balance', 'Standard APR', 'Effective APR', 'Minimum Payment', 'Target Payment', 'Estimated Monthly Interest', 'Promo End', 'Promo Months', 'Promo Payoff Needed', 'Promo Gap', 'Notes'], ...debts.priority.map((debt) => [debt.name, debt.balance, debt.apr, debt.effectiveApr, debt.minimumPayment, debt.targetPayment, debt.monthlyInterest, debt.promoEnd, debt.promoMonths, debt.promoPayoffNeeded, debt.promoGap, debt.notes])]
    }
  ];
}

export function expandedWorkbookSheetsV110(month = getMonth()) {
  return [...expandedWorkbookSheetsV108(month), ...closeForecastSheets(month)];
}
