import {
  account, category, dte, flow, getMonth, isPending, owner, reportAmount,
  rowsForMonth, txName, txs
} from '../v103/core.js';
import { recurringWatch } from '../v105/intelligence.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const clean = (value) => String(value ?? '').trim();
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value));

function dateValue(value) {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function addDays(value, days) {
  return isoDate(new Date(dateValue(value).getTime() + days * DAY_MS));
}

function monthEnd(month) {
  const [year, number] = String(month).split('-').map(Number);
  return isoDate(new Date(Date.UTC(year, number, 0)));
}

function daysInclusive(start, end) {
  return Math.max(1, Math.min(366, Math.round((dateValue(end) - dateValue(start)) / DAY_MS) + 1));
}

function normalizeMerchant(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\b\d{3,}\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function expenseRows(rows) {
  return rows.filter((transaction) => flow(transaction) === 'Expense' && !isPending(transaction) && validDate(dte(transaction)));
}

function rowsBetween(rows, start, end) {
  return rows.filter((transaction) => {
    const date = dte(transaction);
    return validDate(date) && date >= start && date <= end;
  });
}

function totalBy(rows, labelFn) {
  const totals = new Map();
  expenseRows(rows).forEach((transaction) => {
    const label = clean(labelFn(transaction)) || 'Unassigned';
    totals.set(label, roundMoney((totals.get(label) || 0) + reportAmount(transaction)));
  });
  return totals;
}

function merchantHistory(rows) {
  const groups = new Map();
  expenseRows(rows).forEach((transaction) => {
    const key = normalizeMerchant(txName(transaction));
    if (!key) return;
    const list = groups.get(key) || [];
    list.push(transaction);
    groups.set(key, list);
  });
  return groups;
}

function severityRank(value) {
  return { high: 3, review: 2, watch: 1 }[value] || 0;
}

function merchantSignals(currentExpenses, historyExpenses) {
  const history = merchantHistory(historyExpenses);
  const currentMedian = median(currentExpenses.map(reportAmount));
  const firstSeenThreshold = Math.max(100, currentMedian * 1.75);
  const signals = [];

  currentExpenses.forEach((transaction) => {
    const amount = reportAmount(transaction);
    const key = normalizeMerchant(txName(transaction));
    const prior = history.get(key) || [];
    const priorAmounts = prior.map(reportAmount).filter((value) => value > 0);
    const priorMedian = median(priorAmounts);

    if (priorAmounts.length >= 2 && priorMedian > 0) {
      const delta = roundMoney(amount - priorMedian);
      const factor = amount / priorMedian;
      if (amount >= 25 && delta >= 20 && factor >= 1.5) {
        signals.push({
          id: `merchant-spike:${dte(transaction)}:${key}:${amount}`,
          type: 'merchant-spike',
          severity: factor >= 2 || delta >= 100 ? 'high' : 'review',
          title: `${txName(transaction)} is above its prior typical amount`,
          summary: `${amount.toFixed(2)} versus a ${priorMedian.toFixed(2)} median across ${priorAmounts.length} earlier charges.`,
          amount: roundMoney(amount),
          delta,
          factor: roundMoney(factor),
          date: dte(transaction),
          merchant: txName(transaction),
          category: category(transaction),
          account: account(transaction),
          owner: owner(transaction),
          baselineCount: priorAmounts.length,
          baselineAmount: roundMoney(priorMedian),
          method: 'Current posted expense compared with the median of earlier normalized-merchant charges in the 180-day history window.',
          evidence: [transaction]
        });
      }
      return;
    }

    if (!priorAmounts.length && amount >= firstSeenThreshold) {
      signals.push({
        id: `first-seen:${dte(transaction)}:${key}:${amount}`,
        type: 'first-seen-large',
        severity: amount >= firstSeenThreshold * 2 ? 'high' : 'watch',
        title: `${txName(transaction)} is a large first-seen merchant`,
        summary: `${amount.toFixed(2)} with no earlier normalized-merchant charge in the 180-day history window.`,
        amount: roundMoney(amount),
        delta: roundMoney(amount),
        factor: null,
        date: dte(transaction),
        merchant: txName(transaction),
        category: category(transaction),
        account: account(transaction),
        owner: owner(transaction),
        baselineCount: 0,
        baselineAmount: 0,
        method: `First-seen posted expense above the dynamic ${firstSeenThreshold.toFixed(2)} large-charge threshold.`,
        evidence: [transaction]
      });
    }
  });

  return signals;
}

function categorySignals(currentRows, comparisonRows) {
  const current = totalBy(currentRows, category);
  const baseline = totalBy(comparisonRows, category);
  const signals = [];

  current.forEach((amount, name) => {
    const prior = baseline.get(name) || 0;
    const delta = roundMoney(amount - prior);
    if (prior > 0 && delta >= 50 && amount >= prior * 1.35) {
      const factor = amount / prior;
      signals.push({
        id: `category-spike:${name}:${amount}`,
        type: 'category-spike',
        severity: factor >= 2 || delta >= 250 ? 'high' : 'review',
        title: `${name} spending increased`,
        summary: `${amount.toFixed(2)} in the selected period versus ${prior.toFixed(2)} in the immediately preceding equivalent period.`,
        amount: roundMoney(amount),
        delta,
        factor: roundMoney(factor),
        date: '',
        merchant: '',
        category: name,
        account: '',
        owner: '',
        baselineCount: expenseRows(comparisonRows).filter((transaction) => clean(category(transaction)) === name).length,
        baselineAmount: roundMoney(prior),
        method: 'Selected-period category total compared with the immediately preceding period of equal length.',
        evidence: expenseRows(currentRows).filter((transaction) => clean(category(transaction)) === name)
      });
    }
  });

  return signals;
}

function recurringOpportunities() {
  return recurringWatch()
    .filter((item) => item.status !== 'excluded')
    .map((item) => {
      const positiveIncrease = item.delta > 0 && item.previousAmount > 0 && (item.delta >= 2 || item.percent >= 0.05);
      const annualCost = roundMoney(item.average * 12);
      const annualIncrease = positiveIncrease ? roundMoney(item.delta * 12) : 0;
      const kind = positiveIncrease ? 'amount-increase' : item.status === 'candidate' ? 'confirm-or-exclude' : 'annual-footprint';
      return {
        key: item.key,
        name: item.name,
        category: item.category,
        status: item.status,
        kind,
        occurrences: item.occurrences,
        months: item.months,
        latestDate: item.latestDate,
        latestAmount: roundMoney(item.latestAmount),
        previousAmount: roundMoney(item.previousAmount),
        average: roundMoney(item.average),
        delta: roundMoney(item.delta),
        percent: item.percent,
        annualCost,
        annualIncrease,
        explanation: positiveIncrease
          ? `Latest charge is ${item.delta.toFixed(2)} above the prior charge, an approximate ${annualIncrease.toFixed(2)} annualized increase if monthly.`
          : item.status === 'candidate'
            ? `Appears in ${item.months} months and has not yet been confirmed or excluded.`
            : `Confirmed recurring pattern with an approximate ${annualCost.toFixed(2)} annual footprint based on its historical average.`,
        question: positiveIncrease
          ? `Was the ${item.name} increase expected, and is the service still worth the new amount?`
          : item.status === 'candidate'
            ? `Should ${item.name} be confirmed as recurring or excluded from recurring review?`
            : `Does ${item.name} still earn a place in the household plan at about ${annualCost.toFixed(2)} per year?`
      };
    })
    .filter((item) => item.kind !== 'annual-footprint' || item.annualCost >= 120)
    .sort((left, right) => right.annualIncrease - left.annualIncrease || right.annualCost - left.annualCost)
    .slice(0, 12);
}

function decisionPrompts(signals, recurring) {
  const prompts = [];
  signals.slice(0, 5).forEach((signal) => {
    if (signal.type === 'merchant-spike') prompts.push({
      source: signal.id,
      question: `Was the ${signal.merchant} charge of ${signal.amount.toFixed(2)} expected, or does it need transaction review?`,
      reason: signal.summary
    });
    else if (signal.type === 'first-seen-large') prompts.push({
      source: signal.id,
      question: `Is ${signal.merchant} a planned one-time purchase, a new recurring cost, or a transaction that needs review?`,
      reason: signal.summary
    });
    else prompts.push({
      source: signal.id,
      question: `Does the increase in ${signal.category} reflect a planned household choice or a category that needs attention next period?`,
      reason: signal.summary
    });
  });
  recurring.slice(0, 4).forEach((item) => prompts.push({ source: `recurring:${item.key}`, question: item.question, reason: item.explanation }));
  if (!prompts.length) prompts.push({
    source: 'no-automatic-signal',
    question: 'Are there any expected large purchases or recurring changes that the automatic review could not recognize?',
    reason: 'No threshold-based unusual-spending or recurring-cost signal was generated for this period.'
  });
  return prompts.slice(0, 8);
}

export function buildHouseholdInsights({ rows = [], start, end, label = '' } = {}) {
  const safeStart = validDate(start) ? start : `${getMonth()}-01`;
  const safeEnd = validDate(end) ? end : monthEnd(getMonth());
  const periodDays = daysInclusive(safeStart, safeEnd);
  const comparisonEnd = addDays(safeStart, -1);
  const comparisonStart = addDays(comparisonEnd, -(periodDays - 1));
  const historyStart = addDays(safeStart, -180);
  const historyEnd = comparisonEnd;
  const allRows = txs();
  const currentRows = rows.length ? rows : rowsBetween(allRows, safeStart, safeEnd);
  const currentExpenses = expenseRows(currentRows);
  const comparisonRows = rowsBetween(allRows, comparisonStart, comparisonEnd);
  const historyRows = rowsBetween(allRows, historyStart, historyEnd);
  const signals = [
    ...merchantSignals(currentExpenses, historyRows),
    ...categorySignals(currentRows, comparisonRows)
  ].sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || right.delta - left.delta || right.amount - left.amount).slice(0, 20);
  const recurring = recurringOpportunities();
  const prompts = decisionPrompts(signals, recurring);
  const annualizedIncrease = roundMoney(recurring.reduce((sum, item) => sum + item.annualIncrease, 0));

  return {
    generatedAt: new Date().toISOString(),
    label: label || `${safeStart} through ${safeEnd}`,
    start: safeStart,
    end: safeEnd,
    comparisonStart,
    comparisonEnd,
    historyStart,
    historyEnd,
    currentRows,
    signals,
    recurring,
    prompts,
    counts: {
      transactions: currentRows.length,
      postedExpenses: currentExpenses.length,
      pending: currentRows.filter(isPending).length,
      unusual: signals.length,
      high: signals.filter((item) => item.severity === 'high').length,
      recurring: recurring.length
    },
    annualizedIncrease,
    methodology: [
      'Pending transactions are counted but excluded from unusual-spending comparisons.',
      'Merchant spikes compare a posted expense with the median of earlier normalized-merchant charges from the prior 180 days.',
      'Category spikes compare the selected period with the immediately preceding period of equal length.',
      'First-seen merchant thresholds are based on the larger of $100 or 1.75 times the selected-period posted-expense median.',
      'Recurring annual figures are simple monthly annualizations for discussion, not guaranteed savings or forecasts.',
      'Insights never edit transactions, categories, recurring status, budgets, or account assignments.'
    ]
  };
}

export function selectedMonthInsights(month = getMonth()) {
  return buildHouseholdInsights({
    rows: rowsForMonth(month),
    start: `${month}-01`,
    end: monthEnd(month),
    label: month
  });
}
