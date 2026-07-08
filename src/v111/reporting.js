import {
  account, category, dte, flow, getMonth, isPending, money, monthLabel, num, owner,
  read, reportAmount, save, txName, txs
} from '../v103/core.js';
import { activeGoals, goalProgress, goalSummary, healthHistory, vaultHealth } from '../v108/goals.js';
import {
  allCloseEvents, cashForecast, debtAnalysis, expandedWorkbookSheetsV110,
  forecastSettings, monthCloseStatus
} from '../v110/planning.js';

export const REPORT_RANGE_KEY = 'gringottsReportRange.v1';

const PRESETS = new Set(['month', 'ytd', 'last3', 'last6', 'last12', 'custom']);
const clean = (value) => String(value ?? '').trim();
const roundMoney = (value) => Math.round((num(value) + Number.EPSILON) * 100) / 100;
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value));
const validMonth = (value) => /^\d{4}-\d{2}$/.test(clean(value));

function dateFromIso(value) {
  return new Date(`${value}T00:00:00Z`);
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function monthStart(month) {
  return `${month}-01`;
}

function monthEnd(month) {
  const [year, number] = month.split('-').map(Number);
  return isoDate(new Date(Date.UTC(year, number, 0)));
}

function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  const target = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`;
}

function shiftYear(value, offset) {
  const source = dateFromIso(value);
  const year = source.getUTCFullYear() + offset;
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return isoDate(new Date(Date.UTC(year, month, Math.min(day, last))));
}

function rangeLabel(start, end) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${dateFromIso(start).toLocaleDateString(undefined, options)} – ${dateFromIso(end).toLocaleDateString(undefined, options)}`;
}

function selectedMonth() {
  const month = getMonth();
  return validMonth(month) ? month : new Date().toISOString().slice(0, 7);
}

function resolvePreset(preset, customStart = '', customEnd = '') {
  const month = selectedMonth();
  const end = monthEnd(month);
  if (preset === 'ytd') return { start: `${month.slice(0, 4)}-01-01`, end };
  if (preset === 'last3') return { start: monthStart(shiftMonth(month, -2)), end };
  if (preset === 'last6') return { start: monthStart(shiftMonth(month, -5)), end };
  if (preset === 'last12') return { start: monthStart(shiftMonth(month, -11)), end };
  if (preset === 'custom') return { start: clean(customStart), end: clean(customEnd) };
  return { start: monthStart(month), end };
}

export function reportRangeSettings() {
  const stored = read(REPORT_RANGE_KEY, {});
  const preset = PRESETS.has(stored?.preset) ? stored.preset : 'month';
  const resolved = resolvePreset(preset, stored?.start, stored?.end);
  if (!validDate(resolved.start) || !validDate(resolved.end) || resolved.start > resolved.end) {
    const fallback = resolvePreset('month');
    return { preset: 'month', ...fallback, comparePriorYear: true, updatedAt: '' };
  }
  return {
    preset,
    start: resolved.start,
    end: resolved.end,
    comparePriorYear: stored?.comparePriorYear !== false,
    updatedAt: clean(stored?.updatedAt)
  };
}

export function saveReportRange(input) {
  const preset = PRESETS.has(input?.preset) ? input.preset : 'month';
  const resolved = resolvePreset(preset, input?.start, input?.end);
  if (!validDate(resolved.start) || !validDate(resolved.end)) throw new Error('Choose a valid report start and end date.');
  if (resolved.start > resolved.end) throw new Error('Report start date must be on or before the end date.');
  const startYear = Number(resolved.start.slice(0, 4));
  const endYear = Number(resolved.end.slice(0, 4));
  if (endYear - startYear > 10) throw new Error('Custom reports are limited to a ten-year span.');
  const value = {
    preset,
    start: resolved.start,
    end: resolved.end,
    comparePriorYear: input?.comparePriorYear !== false,
    updatedAt: new Date().toISOString()
  };
  save(REPORT_RANGE_KEY, value);
  return value;
}

export function rowsForRange(start, end) {
  if (!validDate(start) || !validDate(end) || start > end) return [];
  return txs().filter((transaction) => {
    const date = dte(transaction);
    return validDate(date) && date >= start && date <= end;
  }).slice().sort((left, right) => dte(left).localeCompare(dte(right)) || txName(left).localeCompare(txName(right)));
}

function needsReview(transaction) {
  const value = clean(category(transaction)).toLowerCase();
  return transaction?.reviewed === false || !value || value === 'other' || value === 'uncategorized';
}

export function metricsForRows(rows) {
  const output = { count: rows.length, income: 0, spend: 0, transfers: 0, net: 0, pending: 0, review: 0 };
  rows.forEach((transaction) => {
    const amount = reportAmount(transaction);
    const kind = flow(transaction);
    if (kind === 'Income') output.income += amount;
    else if (kind === 'Expense') output.spend += amount;
    else output.transfers += amount;
    if (isPending(transaction)) output.pending += 1;
    if (needsReview(transaction)) output.review += 1;
  });
  output.income = roundMoney(output.income);
  output.spend = roundMoney(output.spend);
  output.transfers = roundMoney(output.transfers);
  output.net = roundMoney(output.income - output.spend);
  return output;
}

function groupedTotals(rows, labelFn, limit = 250) {
  const totals = new Map();
  rows.filter((transaction) => flow(transaction) === 'Expense').forEach((transaction) => {
    const label = clean(labelFn(transaction)) || 'Unassigned';
    totals.set(label, roundMoney((totals.get(label) || 0) + reportAmount(transaction)));
  });
  return [...totals.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, limit);
}

function monthsBetween(start, end) {
  if (!validDate(start) || !validDate(end) || start > end) return [];
  const values = [];
  let cursor = start.slice(0, 7);
  const finish = end.slice(0, 7);
  while (cursor <= finish && values.length < 132) {
    values.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return values;
}

function percentageChange(current, prior) {
  if (!prior) return current ? null : 0;
  return (current - prior) / Math.abs(prior);
}

function comparisonRow(label, current, prior, lowerIsBetter = false) {
  const delta = roundMoney(current - prior);
  const percent = percentageChange(current, prior);
  const direction = delta === 0 ? 'flat' : lowerIsBetter ? (delta < 0 ? 'better' : 'worse') : (delta > 0 ? 'better' : 'worse');
  return { label, current: roundMoney(current), prior: roundMoney(prior), delta, percent, direction };
}

function rangeMonths(start, end, currentRows, priorRows) {
  const priorStart = shiftYear(start, -1);
  return monthsBetween(start, end).map((month, index) => {
    const current = metricsForRows(currentRows.filter((transaction) => dte(transaction).startsWith(month)));
    const priorMonth = shiftMonth(priorStart.slice(0, 7), index);
    const prior = metricsForRows(priorRows.filter((transaction) => dte(transaction).startsWith(priorMonth)));
    return {
      month,
      label: monthLabel(month),
      income: current.income,
      spend: current.spend,
      net: current.net,
      count: current.count,
      priorMonth,
      priorIncome: prior.income,
      priorSpend: prior.spend,
      priorNet: prior.net,
      priorCount: prior.count
    };
  });
}

function closeSummary(start, end) {
  const months = new Set(monthsBetween(start, end));
  const events = allCloseEvents().filter((event) => months.has(event.month));
  const currentByMonth = [...months].map((month) => monthCloseStatus(month));
  return {
    closedMonths: currentByMonth.filter((item) => item.closed).length,
    openMonths: currentByMonth.filter((item) => !item.closed).length,
    driftedMonths: currentByMonth.filter((item) => item.drifted).length,
    events
  };
}

function meetingInsights(model) {
  const wins = [];
  const risks = [];
  const actions = [];
  const questions = [];
  const topCategory = model.categories[0];
  const topMerchant = model.merchants[0];
  const goalData = model.goalSummary;
  const firstDebt = model.debt.priority[0];

  if (model.metrics.net >= 0) wins.push(`The household finished the range with ${money(model.metrics.net)} more income than spending.`);
  else risks.push(`Household spending exceeded income by ${money(Math.abs(model.metrics.net))} in the selected range.`);
  if (model.metrics.review === 0) wins.push('No selected-range transactions remain in the review queue.');
  else actions.push(`Review ${model.metrics.review} selected-range transaction${model.metrics.review === 1 ? '' : 's'} before relying on category trends.`);
  if (model.metrics.pending) risks.push(`${model.metrics.pending} transaction${model.metrics.pending === 1 ? '' : 's'} remain pending and may change the final totals.`);
  if (topCategory) questions.push(`Does ${topCategory[0]} spending of ${money(topCategory[1])} match the household plan for this period?`);
  if (topMerchant) questions.push(`Is ${topMerchant[0]} at ${money(topMerchant[1])} a normal household pattern or an area to reduce?`);
  if (goalData.count) wins.push(`${goalData.count} active goal${goalData.count === 1 ? '' : 's'} are ${money(goalData.current)} funded in total.`);
  else actions.push('Create at least one savings, sinking-fund, emergency, or debt-payoff goal.');
  if (model.forecast.negativeDays.length) risks.push(`The cash forecast shows ${model.forecast.negativeDays.length} negative-balance day${model.forecast.negativeDays.length === 1 ? '' : 's'} within the current horizon.`);
  else wins.push('The current cash forecast does not fall below zero in its selected horizon.');
  if (model.forecast.pressureDays.length) actions.push(`Review the first buffer-pressure date, ${model.forecast.pressureDays[0].date}.`);
  if (firstDebt) {
    questions.push(`Should extra debt money remain focused on ${firstDebt.name}, the current planning priority?`);
    if (firstDebt.promoGap > 0) actions.push(`Raise the planned ${firstDebt.name} payment by about ${money(firstDebt.promoGap)} to meet the simple promotional payoff pace.`);
  }
  if (model.close.driftedMonths) actions.push(`Reopen and reconcile ${model.close.driftedMonths} closed month${model.close.driftedMonths === 1 ? '' : 's'} with post-close transaction changes.`);
  if (model.health.score >= 90) wins.push(`Vault Health is ${model.health.score} (${model.health.label}).`);
  else actions.push(...model.health.actions.slice(0, 3));
  if (model.comparison && model.comparison.rows.find((item) => item.label === 'Spending')?.direction === 'better') wins.push('Household spending decreased versus the equivalent prior-year range.');
  if (model.comparison && model.comparison.rows.find((item) => item.label === 'Spending')?.direction === 'worse') risks.push('Household spending increased versus the equivalent prior-year range.');

  return {
    questions: [...new Set(questions)].slice(0, 8),
    wins: [...new Set(wins)].slice(0, 8),
    risks: [...new Set(risks)].slice(0, 8),
    actions: [...new Set(actions)].slice(0, 10)
  };
}

export function householdReportModel(settings = reportRangeSettings()) {
  const currentRows = rowsForRange(settings.start, settings.end);
  const metrics = metricsForRows(currentRows);
  const priorStart = shiftYear(settings.start, -1);
  const priorEnd = shiftYear(settings.end, -1);
  const priorRows = settings.comparePriorYear ? rowsForRange(priorStart, priorEnd) : [];
  const priorMetrics = metricsForRows(priorRows);
  const selected = selectedMonth();
  const categories = groupedTotals(currentRows, category);
  const merchants = groupedTotals(currentRows, txName);
  const accounts = groupedTotals(currentRows, (transaction) => `${owner(transaction) || 'Unassigned'} / ${account(transaction) || 'No account'}`);
  const goals = activeGoals();
  const health = vaultHealth(selected);
  const forecast = cashForecast(forecastSettings());
  const debt = debtAnalysis(forecast.settings.asOfDate);
  const comparison = settings.comparePriorYear ? {
    start: priorStart,
    end: priorEnd,
    label: rangeLabel(priorStart, priorEnd),
    metrics: priorMetrics,
    rows: [
      comparisonRow('Income', metrics.income, priorMetrics.income),
      comparisonRow('Spending', metrics.spend, priorMetrics.spend, true),
      comparisonRow('Net', metrics.net, priorMetrics.net),
      comparisonRow('Transactions', metrics.count, priorMetrics.count),
      comparisonRow('Pending', metrics.pending, priorMetrics.pending, true),
      comparisonRow('Review queue', metrics.review, priorMetrics.review, true)
    ]
  } : null;
  const model = {
    generatedAt: new Date().toISOString(),
    settings,
    label: rangeLabel(settings.start, settings.end),
    currentRows,
    metrics,
    categories,
    merchants,
    accounts,
    monthly: rangeMonths(settings.start, settings.end, currentRows, priorRows),
    comparison,
    goals: goals.map((goal) => ({ ...goal, progress: goalProgress(goal) })),
    goalSummary: goalSummary(),
    health,
    healthHistory: healthHistory(),
    close: closeSummary(settings.start, settings.end),
    forecast,
    debt
  };
  model.meeting = meetingInsights(model);
  return model;
}

export function rangeExecutiveSummary(model = householdReportModel()) {
  const comparison = model.comparison?.rows || [];
  const spendingComparison = comparison.find((item) => item.label === 'Spending');
  const comparisonText = spendingComparison
    ? spendingComparison.delta === 0
      ? ' Spending was unchanged from the equivalent prior-year range.'
      : ` Spending was ${money(Math.abs(spendingComparison.delta))} ${spendingComparison.delta < 0 ? 'lower' : 'higher'} than the equivalent prior-year range.`
    : '';
  return `${model.label}: ${model.metrics.count} transactions produced ${money(model.metrics.income)} of income, ${money(model.metrics.spend)} of household spending, and ${money(model.metrics.net)} of net household cash flow. ${model.metrics.pending} rows remain pending and ${model.metrics.review} need review.${comparisonText}`;
}

function markdownList(values, emptyText = 'No items were generated.') {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : `- ${emptyText}`;
}

export function rangeExecutiveMarkdown(model = householdReportModel()) {
  const comparisonRows = model.comparison?.rows || [];
  return `# Gringotts Household Executive Report — ${model.label}\n\nGenerated: ${model.generatedAt}\n\n${rangeExecutiveSummary(model)}\n\n## Core metrics\n\n| Metric | Current range | Prior-year range | Change |\n|---|---:|---:|---:|\n${[
    ['Transactions', model.metrics.count, model.comparison?.metrics.count ?? '', model.comparison ? model.metrics.count - model.comparison.metrics.count : ''],
    ['Income', money(model.metrics.income), model.comparison ? money(model.comparison.metrics.income) : '', model.comparison ? money(model.metrics.income - model.comparison.metrics.income) : ''],
    ['Spending', money(model.metrics.spend), model.comparison ? money(model.comparison.metrics.spend) : '', model.comparison ? money(model.metrics.spend - model.comparison.metrics.spend) : ''],
    ['Net', money(model.metrics.net), model.comparison ? money(model.comparison.metrics.net) : '', model.comparison ? money(model.metrics.net - model.comparison.metrics.net) : '']
  ].map((row) => `| ${row.join(' | ')} |`).join('\n')}\n\n## Year-over-year interpretation\n${markdownList(comparisonRows.map((item) => `${item.label}: ${money(item.current)} current versus ${money(item.prior)} prior, ${money(Math.abs(item.delta))} ${item.delta === 0 ? 'unchanged' : item.delta > 0 ? 'higher' : 'lower'}.`), 'Prior-year comparison is disabled.')}\n\n## Top spending categories\n${markdownList(model.categories.slice(0, 10).map(([name, amount]) => `${name}: ${money(amount)}`))}\n\n## Top merchants\n${markdownList(model.merchants.slice(0, 10).map(([name, amount]) => `${name}: ${money(amount)}`))}\n`;
}

export function familyMeetingMarkdownV111(model = householdReportModel()) {
  const debtPriority = model.debt.priority[0];
  return `# Gringotts Family Budget Meeting Pack — ${model.label}\n\nGenerated: ${model.generatedAt}\n\n${rangeExecutiveSummary(model)}\n\n## Questions to Decide Together\n${markdownList(model.meeting.questions)}\n\n## Wins\n${markdownList(model.meeting.wins)}\n\n## Risks and Watch Items\n${markdownList(model.meeting.risks)}\n\n## Action Items\n${markdownList(model.meeting.actions)}\n\n## Goals and Vault Health\n- Vault Health: ${model.health.score} (${model.health.label})\n- Active goals: ${model.goalSummary.count}\n- Goal funding: ${money(model.goalSummary.current)} of ${money(model.goalSummary.target)}\n${markdownList(model.goals.slice(0, 10).map((goal) => `${goal.name}: ${money(goal.progress.current)} of ${money(goal.progress.target)} (${Math.round(goal.progress.percent * 100)}%)`), 'No active goals are configured.')}\n\n## Month Close\n- Closed months in range: ${model.close.closedMonths}\n- Open months in range: ${model.close.openMonths}\n- Closed months with detected drift: ${model.close.driftedMonths}\n\n## Forecast and Debt\n- Forecast through ${model.forecast.end}: ending ${money(model.forecast.endingBalance)}, lowest ${money(model.forecast.lowBalance)} on ${model.forecast.lowDate}\n- Days below the selected buffer: ${model.forecast.pressureDays.length}\n- Total planned debt: ${money(model.debt.totalBalance)}\n- Estimated monthly interest: ${money(model.debt.estimatedMonthlyInterest)}\n- Current priority: ${debtPriority ? `${debtPriority.name} at ${debtPriority.effectiveApr}% effective APR` : 'No debt plan entry'}\n`;
}

export function familyTrackerRangeCsv(model = householdReportModel()) {
  const csvSafe = (value) => {
    const text = String(value ?? '');
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [['DATE', 'TYPE', 'CATEGORY', 'AMOUNT', 'DESCRIPTION', 'ACCOUNT', 'OWNER'], ...model.currentRows.map((transaction) => [dte(transaction), flow(transaction).toUpperCase(), category(transaction), reportAmount(transaction).toFixed(2), txName(transaction), account(transaction), owner(transaction)])]
    .map((row) => row.map(csvSafe).join(',')).join('\r\n');
}

export function reportRangeSheetsV111(model = householdReportModel()) {
  return [
    {
      name: 'Report Range',
      rows: [
        ['Household Reporting III', model.label],
        ['Generated', model.generatedAt],
        ['Preset', model.settings.preset],
        ['Start', model.settings.start],
        ['End', model.settings.end],
        ['Prior-Year Comparison', model.comparison ? 'Enabled' : 'Disabled'],
        [],
        ['Metric', 'Current', 'Prior Year', 'Change'],
        ['Transactions', model.metrics.count, model.comparison?.metrics.count ?? '', model.comparison ? model.metrics.count - model.comparison.metrics.count : ''],
        ['Income', model.metrics.income, model.comparison?.metrics.income ?? '', model.comparison ? roundMoney(model.metrics.income - model.comparison.metrics.income) : ''],
        ['Spending', model.metrics.spend, model.comparison?.metrics.spend ?? '', model.comparison ? roundMoney(model.metrics.spend - model.comparison.metrics.spend) : ''],
        ['Net', model.metrics.net, model.comparison?.metrics.net ?? '', model.comparison ? roundMoney(model.metrics.net - model.comparison.metrics.net) : ''],
        ['Pending', model.metrics.pending, model.comparison?.metrics.pending ?? '', model.comparison ? model.metrics.pending - model.comparison.metrics.pending : ''],
        ['Review Queue', model.metrics.review, model.comparison?.metrics.review ?? '', model.comparison ? model.metrics.review - model.comparison.metrics.review : '']
      ]
    },
    {
      name: 'Range Transactions',
      rows: [['Date', 'Flow', 'Category', 'Amount', 'Description', 'Account', 'Owner', 'Pending', 'Reviewed'], ...model.currentRows.map((transaction) => [dte(transaction), flow(transaction), category(transaction), reportAmount(transaction), txName(transaction), account(transaction), owner(transaction), isPending(transaction) ? 'Yes' : 'No', transaction.reviewed === true ? 'Yes' : 'No'])]
    },
    {
      name: 'Year over Year',
      rows: [
        ['Current Range', model.label],
        ['Prior Range', model.comparison?.label || 'Disabled'],
        [],
        ['Metric', 'Current', 'Prior', 'Delta', 'Percent Change', 'Direction'],
        ...(model.comparison?.rows || []).map((item) => [item.label, item.current, item.prior, item.delta, item.percent ?? '', item.direction]),
        [],
        ['Current Month', 'Income', 'Spending', 'Net', 'Transactions', 'Prior Month', 'Prior Income', 'Prior Spending', 'Prior Net', 'Prior Transactions'],
        ...model.monthly.map((item) => [item.month, item.income, item.spend, item.net, item.count, item.priorMonth, item.priorIncome, item.priorSpend, item.priorNet, item.priorCount])
      ]
    },
    {
      name: 'Family Meeting Brief',
      rows: [
        ['Report Range', model.label],
        ['Executive Summary', rangeExecutiveSummary(model)],
        [],
        ['Questions to Decide Together'],
        ...model.meeting.questions.map((value) => [value]),
        [],
        ['Wins'],
        ...model.meeting.wins.map((value) => [value]),
        [],
        ['Risks and Watch Items'],
        ...model.meeting.risks.map((value) => [value]),
        [],
        ['Actions'],
        ...model.meeting.actions.map((value) => [value]),
        [],
        ['Vault Health', model.health.score, model.health.label],
        ['Active Goals', model.goalSummary.count],
        ['Goal Funding', model.goalSummary.current, model.goalSummary.target],
        ['Closed Months', model.close.closedMonths],
        ['Open Months', model.close.openMonths],
        ['Drifted Closed Months', model.close.driftedMonths],
        ['Forecast Ending Cash', model.forecast.endingBalance],
        ['Forecast Lowest Cash', model.forecast.lowBalance, model.forecast.lowDate],
        ['Total Planned Debt', model.debt.totalBalance],
        ['Estimated Monthly Interest', model.debt.estimatedMonthlyInterest]
      ]
    }
  ];
}

export function expandedWorkbookSheetsV111(month = getMonth(), model = householdReportModel()) {
  return [...expandedWorkbookSheetsV110(month), ...reportRangeSheetsV111(model)];
}
