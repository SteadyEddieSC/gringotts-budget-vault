import {
  best, download, getMonth, isPending, money, read, reportAmount, rowsForMonth,
  save, stamp, txs, uid
} from '../v103/core.js';
import { budgetSummary, expandedWorkbookSheets, recurringAmountAlerts, recurringWatch } from '../v105/intelligence.js';
import { xlsxBlob } from '../v103/reports.js';
import { reviewQueue } from '../v107/review.js';

export const GOALS_KEY = 'gringottsGoals.v1';
export const HEALTH_HISTORY_KEY = 'gringottsVaultHealthHistory.v1';

function clean(value) {
  return String(value ?? '').trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function goalsData() {
  const stored = read(GOALS_KEY, { goals: [], updatedAt: '' });
  return {
    goals: Array.isArray(stored?.goals) ? stored.goals : [],
    updatedAt: stored?.updatedAt || ''
  };
}

export function activeGoals() {
  return goalsData().goals.filter((goal) => goal.archived !== true);
}

export function goalProgress(goal) {
  const target = Math.max(0, number(goal.target));
  const current = Math.max(0, number(goal.current));
  return {
    target,
    current,
    remaining: Math.max(0, target - current),
    percent: target > 0 ? Math.min(1, current / target) : 0
  };
}

export function goalSummary() {
  const goals = activeGoals();
  const totals = goals.reduce((summary, goal) => {
    const progress = goalProgress(goal);
    summary.target += progress.target;
    summary.current += progress.current;
    summary.remaining += progress.remaining;
    if (progress.target > 0 && progress.current >= progress.target) summary.completed += 1;
    return summary;
  }, { target: 0, current: 0, remaining: 0, completed: 0 });
  return { ...totals, count: goals.length };
}

export function saveGoal(input) {
  const name = clean(input.name);
  const target = number(input.target);
  if (!name || target <= 0) return false;
  const data = goalsData();
  const now = new Date().toISOString();
  const id = clean(input.id) || uid('goal');
  const existing = data.goals.findIndex((goal) => goal.id === id);
  const record = {
    id,
    name,
    type: clean(input.type) || 'Sinking Fund',
    target: Math.round(target * 100) / 100,
    current: Math.max(0, Math.round(number(input.current) * 100) / 100),
    monthlyContribution: Math.max(0, Math.round(number(input.monthlyContribution) * 100) / 100),
    dueDate: clean(input.dueDate),
    notes: clean(input.notes),
    archived: false,
    createdAt: existing >= 0 ? data.goals[existing].createdAt || now : now,
    updatedAt: now
  };
  if (existing >= 0) data.goals[existing] = record;
  else data.goals.unshift(record);
  data.updatedAt = now;
  save(GOALS_KEY, data);
  return id;
}

export function addGoalContribution(id, amount) {
  const value = number(amount);
  if (!id || !Number.isFinite(value) || value === 0) return false;
  const data = goalsData();
  const index = data.goals.findIndex((goal) => goal.id === id && goal.archived !== true);
  if (index < 0) return false;
  const current = Math.max(0, number(data.goals[index].current) + value);
  data.goals[index] = {
    ...data.goals[index],
    current: Math.round(current * 100) / 100,
    updatedAt: new Date().toISOString()
  };
  data.updatedAt = data.goals[index].updatedAt;
  save(GOALS_KEY, data);
  return true;
}

export function archiveGoal(id) {
  const data = goalsData();
  const index = data.goals.findIndex((goal) => goal.id === id);
  if (index < 0) return false;
  data.goals[index] = { ...data.goals[index], archived: true, updatedAt: new Date().toISOString() };
  data.updatedAt = data.goals[index].updatedAt;
  save(GOALS_KEY, data);
  return true;
}

export function deleteGoal(id) {
  const data = goalsData();
  const before = data.goals.length;
  data.goals = data.goals.filter((goal) => goal.id !== id);
  if (data.goals.length === before) return false;
  data.updatedAt = new Date().toISOString();
  save(GOALS_KEY, data);
  return true;
}

export function healthHistory() {
  const stored = read(HEALTH_HISTORY_KEY, { snapshots: [] });
  return Array.isArray(stored?.snapshots) ? stored.snapshots : [];
}

export function vaultHealth(month = getMonth()) {
  const rows = rowsForMonth(month);
  const pending = rows.filter(isPending).length;
  const review = reviewQueue(month).length;
  const budgets = budgetSummary(month);
  const goals = goalSummary();
  const recurring = recurringWatch();
  const unresolvedRecurring = recurring.filter((item) => item.status === 'candidate').length;
  const amountAlerts = recurringAmountAlerts().length;
  const candidate = best();
  let score = 100;
  const deductions = [];
  const actions = [];

  const deduct = (points, reason, action) => {
    if (points <= 0) return;
    score -= points;
    deductions.push({ points, reason });
    if (action) actions.push(action);
  };

  if (!candidate?.transactions) deduct(35, 'No populated readable vault is available.', 'Restore or import a populated vault before relying on reports.');
  else if (!rows.length) deduct(20, `No transactions are stored for ${month}.`, 'Select a month with data or import the missing period.');

  deduct(Math.min(25, review * 2), `${review} selected-month transaction${review === 1 ? '' : 's'} need review.`, 'Work through Activity → Review Queue.');
  deduct(Math.min(10, pending), `${pending} pending transaction${pending === 1 ? '' : 's'} remain provisional.`, 'Recheck the month after pending transactions settle.');

  if (!budgets.categories) deduct(8, 'No monthly category budgets are configured.', 'Set budgets for the household categories that matter most.');
  else deduct(Math.min(15, budgets.over * 5), `${budgets.over} budgeted categor${budgets.over === 1 ? 'y is' : 'ies are'} over target.`, 'Review over-budget categories in Money → Budget & Recurring.');

  deduct(Math.min(10, unresolvedRecurring), `${unresolvedRecurring} recurring candidate${unresolvedRecurring === 1 ? '' : 's'} remain unconfirmed.`, 'Confirm or exclude recurring candidates.');
  deduct(Math.min(10, amountAlerts * 2), `${amountAlerts} recurring amount-change alert${amountAlerts === 1 ? '' : 's'} need attention.`, 'Review recurring price changes.');

  if (!goals.count) deduct(5, 'No active goal or sinking fund is configured.', 'Create one savings, debt, or sinking-fund goal.');

  score = Math.max(0, Math.min(100, score));
  const label = score >= 90 ? 'Strong' : score >= 75 ? 'Healthy' : score >= 60 ? 'Needs attention' : 'At risk';
  return {
    month,
    score,
    label,
    deductions,
    actions: [...new Set(actions)].slice(0, 8),
    facts: {
      vaultTransactions: candidate?.transactions || 0,
      selectedMonthTransactions: rows.length,
      pending,
      review,
      budgetedCategories: budgets.categories,
      overBudgetCategories: budgets.over,
      unresolvedRecurring,
      amountAlerts,
      activeGoals: goals.count,
      goalCurrent: goals.current,
      goalTarget: goals.target
    }
  };
}

export function saveHealthSnapshot(month = getMonth()) {
  const health = vaultHealth(month);
  const stored = read(HEALTH_HISTORY_KEY, { snapshots: [] });
  const snapshots = Array.isArray(stored?.snapshots) ? stored.snapshots : [];
  snapshots.unshift({
    id: uid('health'),
    capturedAt: new Date().toISOString(),
    month,
    score: health.score,
    label: health.label,
    facts: health.facts
  });
  save(HEALTH_HISTORY_KEY, { snapshots: snapshots.slice(0, 60), updatedAt: new Date().toISOString() });
  return health;
}

export function goalSheets(month = getMonth()) {
  const goals = activeGoals();
  const health = vaultHealth(month);
  const history = healthHistory();
  return [
    {
      name: 'Goals',
      rows: [['Goal', 'Type', 'Target', 'Current', 'Remaining', 'Percent Complete', 'Monthly Contribution', 'Due Date', 'Notes'], ...goals.map((goal) => {
        const progress = goalProgress(goal);
        return [goal.name, goal.type, progress.target, progress.current, progress.remaining, progress.percent, number(goal.monthlyContribution), goal.dueDate, goal.notes];
      })]
    },
    {
      name: 'Vault Health',
      rows: [
        ['Selected Month', month],
        ['Score', health.score],
        ['Label', health.label],
        [],
        ['Deduction', 'Points'],
        ...health.deductions.map((item) => [item.reason, item.points]),
        [],
        ['Recommended Actions'],
        ...health.actions.map((action) => [action])
      ]
    },
    {
      name: 'Health History',
      rows: [['Captured At', 'Month', 'Score', 'Label', 'Vault Transactions', 'Selected Month Transactions', 'Review Queue', 'Pending', 'Active Goals'], ...history.map((snapshot) => [snapshot.capturedAt, snapshot.month, snapshot.score, snapshot.label, snapshot.facts?.vaultTransactions || 0, snapshot.facts?.selectedMonthTransactions || 0, snapshot.facts?.review || 0, snapshot.facts?.pending || 0, snapshot.facts?.activeGoals || 0])]
    }
  ];
}

export function expandedWorkbookSheetsV108(month = getMonth()) {
  return [...expandedWorkbookSheets(month), ...goalSheets(month)];
}

export function exportExpandedVaultWorkbookV108(notify = () => {}) {
  const month = getMonth();
  download(`Gringotts_Budget_Vault_v108_${month}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV108(month)));
  notify('20-sheet Vault Workbook downloaded');
}
