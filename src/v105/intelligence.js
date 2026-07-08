import {
  category, categoryTotals, download, dte, flow, getMonth, money, monthLabel,
  monthOf, read, reportAmount, rowsForMonth, save, shiftMonth, stamp, txName, txs
} from '../v103/core.js';
import { workbookSheets, xlsxBlob } from '../v103/reports.js';

export const BUDGET_KEY = 'gringottsBudgets.v1';
export const RECURRING_PREF_KEY = 'gringottsRecurringPrefs.v1';

const normalizeMerchant = (value) => String(value || 'Unknown')
  .toLowerCase()
  .replace(/\b\d{3,}\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function monthIndex(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : 0;
}

export function budgetData() {
  const stored = read(BUDGET_KEY, { categories: {}, updatedAt: '' });
  return {
    categories: stored && typeof stored.categories === 'object' ? stored.categories : {},
    updatedAt: stored?.updatedAt || ''
  };
}

export function saveBudget(categoryName, amount) {
  const name = String(categoryName || '').trim();
  const value = Number(amount);
  if (!name || !Number.isFinite(value) || value < 0) return false;
  const data = budgetData();
  data.categories[name] = Math.round(value * 100) / 100;
  data.updatedAt = new Date().toISOString();
  save(BUDGET_KEY, data);
  return true;
}

export function removeBudget(categoryName) {
  const data = budgetData();
  delete data.categories[categoryName];
  data.updatedAt = new Date().toISOString();
  save(BUDGET_KEY, data);
}

export function recurringPreferences() {
  const stored = read(RECURRING_PREF_KEY, { statuses: {}, updatedAt: '' });
  return {
    statuses: stored && typeof stored.statuses === 'object' ? stored.statuses : {},
    updatedAt: stored?.updatedAt || ''
  };
}

export function setRecurringStatus(key, status) {
  const data = recurringPreferences();
  if (!status || status === 'candidate') delete data.statuses[key];
  else data.statuses[key] = status;
  data.updatedAt = new Date().toISOString();
  save(RECURRING_PREF_KEY, data);
}

export function recurringWatch() {
  const prefs = recurringPreferences().statuses;
  const groups = new Map();
  txs().forEach((transaction) => {
    if (flow(transaction) !== 'Expense') return;
    const key = normalizeMerchant(txName(transaction));
    if (!key) return;
    const list = groups.get(key) || [];
    list.push(transaction);
    groups.set(key, list);
  });

  return [...groups.entries()].map(([key, rows]) => {
    const sorted = rows.slice().sort((a, b) => dte(a).localeCompare(dte(b)));
    const dated = sorted.filter((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(dte(transaction)));
    const distinctMonths = [...new Set(dated.map(monthOf).filter(Boolean))].sort();
    const gaps = distinctMonths.slice(1).map((month, index) => monthIndex(month) - monthIndex(distinctMonths[index]));
    const mostlyMonthly = gaps.length ? gaps.filter((gap) => gap >= 1 && gap <= 2).length / gaps.length >= 0.6 : false;
    const latest = dated.at(-1);
    const previous = dated.at(-2);
    const latestAmount = latest ? reportAmount(latest) : 0;
    const previousAmount = previous ? reportAmount(previous) : 0;
    const delta = latestAmount - previousAmount;
    const percent = previousAmount ? delta / previousAmount : 0;
    const average = dated.reduce((sum, transaction) => sum + reportAmount(transaction), 0) / (dated.length || 1);
    const status = prefs[key] || 'candidate';
    return {
      key,
      name: txName(latest || rows[0]),
      category: category(latest || rows[0]),
      occurrences: dated.length,
      months: distinctMonths.length,
      mostlyMonthly,
      latestDate: latest ? dte(latest) : '',
      previousDate: previous ? dte(previous) : '',
      latestAmount,
      previousAmount,
      delta,
      percent,
      average,
      status
    };
  }).filter((item) => item.occurrences >= 2 && (item.months >= 2 || item.status === 'confirmed'))
    .sort((a, b) => {
      const order = { confirmed: 0, candidate: 1, excluded: 2 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1) || b.months - a.months || b.latestDate.localeCompare(a.latestDate);
    });
}

export function recurringAmountAlerts() {
  return recurringWatch().filter((item) => item.status !== 'excluded' && item.previousAmount > 0 && Math.abs(item.delta) >= Math.max(2, item.previousAmount * 0.05));
}

export function recentMonths(selectedMonth = getMonth(), count = 6) {
  return Array.from({ length: count }, (_, index) => shiftMonth(selectedMonth, index - count + 1));
}

export function spendingTrends(selectedMonth = getMonth(), count = 6) {
  return recentMonths(selectedMonth, count).map((month) => {
    const spending = rowsForMonth(month).filter((transaction) => flow(transaction) === 'Expense')
      .reduce((sum, transaction) => sum + reportAmount(transaction), 0);
    return { month, label: monthLabel(month), spending, transactions: rowsForMonth(month).length };
  });
}

function historicalAverage(categoryName, selectedMonth = getMonth(), count = 3) {
  const months = recentMonths(shiftMonth(selectedMonth, -1), count);
  const values = months.map((month) => categoryTotals(month).find(([name]) => name === categoryName)?.[1] || 0);
  const nonzero = values.filter((value) => value > 0);
  return nonzero.length ? nonzero.reduce((sum, value) => sum + value, 0) / nonzero.length : 0;
}

export function budgetRows(selectedMonth = getMonth()) {
  const saved = budgetData().categories;
  const actual = new Map(categoryTotals(selectedMonth));
  const categories = [...new Set([...Object.keys(saved), ...actual.keys()])].sort((a, b) => a.localeCompare(b));
  return categories.map((name) => {
    const spent = actual.get(name) || 0;
    const budget = Number(saved[name] || 0);
    const suggested = historicalAverage(name, selectedMonth, 3);
    const variance = budget > 0 ? budget - spent : 0;
    const percent = budget > 0 ? spent / budget : 0;
    return { category: name, spent, budget, suggested, variance, percent, hasBudget: budget > 0 };
  }).sort((a, b) => (b.hasBudget - a.hasBudget) || b.spent - a.spent);
}

export function budgetSummary(selectedMonth = getMonth()) {
  const rows = budgetRows(selectedMonth).filter((row) => row.hasBudget);
  const budget = rows.reduce((sum, row) => sum + row.budget, 0);
  const spent = rows.reduce((sum, row) => sum + row.spent, 0);
  const over = rows.filter((row) => row.spent > row.budget);
  return { categories: rows.length, budget, spent, remaining: budget - spent, over: over.length };
}

export function categoryTuning(selectedMonth = getMonth()) {
  return budgetRows(selectedMonth).map((row) => {
    if (row.hasBudget && row.spent > row.budget) {
      return { category: row.category, level: 'over', message: `${row.category} is ${money(row.spent - row.budget)} over its ${money(row.budget)} budget.` };
    }
    if (row.hasBudget && row.suggested > 0 && row.budget < row.suggested * 0.75) {
      return { category: row.category, level: 'review', message: `${row.category}'s budget is well below its recent ${money(row.suggested)} monthly average.` };
    }
    if (!row.hasBudget && row.suggested > 0 && row.spent > 0) {
      return { category: row.category, level: 'suggest', message: `Consider a ${money(Math.ceil(row.suggested / 10) * 10)} budget for ${row.category}, based on recent months.` };
    }
    return null;
  }).filter(Boolean).slice(0, 12);
}

export function intelligenceSheets(month = getMonth()) {
  const budgets = budgetRows(month);
  const recurring = recurringWatch();
  const alerts = recurringAmountAlerts();
  const trends = spendingTrends(month, 6);
  const tuning = categoryTuning(month);
  return [
    { name: 'Budget vs Actual', rows: [['Category', 'Budget', 'Actual Spending', 'Remaining', 'Percent Used', 'Suggested Budget'], ...budgets.map((row) => [row.category, row.budget, row.spent, row.variance, row.percent, row.suggested])] },
    { name: 'Recurring Watch', rows: [['Merchant', 'Category', 'Status', 'Occurrences', 'Months', 'Latest Date', 'Latest Amount', 'Previous Amount', 'Average'], ...recurring.map((item) => [item.name, item.category, item.status, item.occurrences, item.months, item.latestDate, item.latestAmount, item.previousAmount, item.average])] },
    { name: 'Amount Changes', rows: [['Merchant', 'Category', 'Latest Date', 'Latest Amount', 'Previous Amount', 'Change', 'Percent Change', 'Status'], ...alerts.map((item) => [item.name, item.category, item.latestDate, item.latestAmount, item.previousAmount, item.delta, item.percent, item.status])] },
    { name: 'Spending Trends', rows: [['Month', 'Label', 'Spending', 'Transactions'], ...trends.map((item) => [item.month, item.label, item.spending, item.transactions])] },
    { name: 'Category Tuning', rows: [['Category', 'Level', 'Recommendation'], ...tuning.map((item) => [item.category, item.level, item.message])] }
  ];
}

export function expandedWorkbookSheets(month = getMonth()) {
  return [...workbookSheets(month), ...intelligenceSheets(month)];
}

export function exportExpandedVaultWorkbook(notify = () => {}) {
  const month = getMonth();
  download(`Gringotts_Budget_Vault_v105_${month}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheets(month)));
  notify('Expanded Vault Workbook downloaded');
}
