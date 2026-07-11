export const SCENARIO_STORE_KEY = 'gringottsScenarioComparisons.v1';
export const MAX_SCENARIOS = 24;
export const MAX_SCENARIO_HISTORY = 80;

const DAY_MS = 86_400_000;
const HORIZONS = new Set([30, 60, 90]);

const clean = (value) => String(value ?? '').trim();
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundMoney = (value) => Math.round((number(value) + Number.EPSILON) * 100) / 100;
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(clean(value));

function fnv1a(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function daysBetween(start, end) {
  if (!validDate(start) || !validDate(end)) return 0;
  return Math.max(0, Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS));
}

function daysInMonth(value) {
  if (!validDate(value)) return 30;
  const date = parseDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function scenarioId(name, now) {
  return `scenario_${fnv1a(`${clean(name).toLowerCase()}|${now}`)}`;
}

export function sanitizeScenarioAssumptions(value = {}) {
  const horizonDays = Number(value?.horizonDays);
  return {
    horizonDays: HORIZONS.has(horizonDays) ? horizonDays : 60,
    startingCashDelta: roundMoney(value?.startingCashDelta),
    monthlyIncomeDelta: roundMoney(value?.monthlyIncomeDelta),
    monthlyRecurringSavings: Math.max(0, roundMoney(value?.monthlyRecurringSavings)),
    flexibleSpendDelta: roundMoney(value?.flexibleSpendDelta),
    oneTimeExpense: Math.max(0, roundMoney(value?.oneTimeExpense)),
    oneTimeDate: validDate(value?.oneTimeDate) ? clean(value.oneTimeDate) : '',
    extraDebtPaymentMonthly: Math.max(0, roundMoney(value?.extraDebtPaymentMonthly)),
    extraGoalContributionMonthly: Math.max(0, roundMoney(value?.extraGoalContributionMonthly))
  };
}

export function sanitizeScenarioStore(value = {}) {
  const items = Array.isArray(value?.items) ? value.items : [];
  const history = Array.isArray(value?.history) ? value.history : [];
  return {
    version: 1,
    items: items.filter((item) => item && typeof item === 'object').map((item) => ({
      id: clean(item.id),
      name: clean(item.name).slice(0, 100),
      assumptions: sanitizeScenarioAssumptions(item.assumptions),
      notes: clean(item.notes).slice(0, 1200),
      createdAt: clean(item.createdAt),
      updatedAt: clean(item.updatedAt)
    })).filter((item) => item.id && item.name).slice(0, MAX_SCENARIOS),
    history: history.filter((entry) => entry && typeof entry === 'object').map((entry) => ({
      id: clean(entry.id),
      scenarioId: clean(entry.scenarioId),
      action: ['created', 'updated', 'deleted'].includes(entry.action) ? entry.action : 'updated',
      capturedAt: clean(entry.capturedAt)
    })).filter((entry) => entry.id && entry.scenarioId).slice(0, MAX_SCENARIO_HISTORY),
    updatedAt: clean(value?.updatedAt)
  };
}

export function saveScenarioRecord(storeValue, payload, now = new Date().toISOString()) {
  const store = sanitizeScenarioStore(storeValue);
  const name = clean(payload?.name).slice(0, 100);
  if (name.length < 2) throw new Error('Enter a scenario name of at least 2 characters.');
  const assumptions = sanitizeScenarioAssumptions(payload?.assumptions);
  if (assumptions.oneTimeExpense > 0 && !assumptions.oneTimeDate) {
    throw new Error('Choose a date for the one-time expense.');
  }
  const existingIndex = store.items.findIndex((item) => item.id === clean(payload?.id));
  const existing = existingIndex >= 0 ? store.items[existingIndex] : null;
  const item = {
    id: existing?.id || scenarioId(name, now),
    name,
    assumptions,
    notes: clean(payload?.notes).slice(0, 1200),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  if (existingIndex >= 0) store.items.splice(existingIndex, 1);
  store.items.unshift(item);
  store.items = store.items.slice(0, MAX_SCENARIOS);
  store.history.unshift({
    id: `scenario_history_${fnv1a(`${item.id}|${now}|${existing ? 'updated' : 'created'}`)}`,
    scenarioId: item.id,
    action: existing ? 'updated' : 'created',
    capturedAt: now
  });
  store.history = store.history.slice(0, MAX_SCENARIO_HISTORY);
  store.updatedAt = now;
  return { store, item };
}

export function deleteScenarioRecord(storeValue, id, now = new Date().toISOString()) {
  const store = sanitizeScenarioStore(storeValue);
  const scenarioIdValue = clean(id);
  const before = store.items.length;
  store.items = store.items.filter((item) => item.id !== scenarioIdValue);
  if (store.items.length === before) return { store, deleted: false };
  store.history.unshift({
    id: `scenario_history_${fnv1a(`${scenarioIdValue}|${now}|deleted`)}`,
    scenarioId: scenarioIdValue,
    action: 'deleted',
    capturedAt: now
  });
  store.history = store.history.slice(0, MAX_SCENARIO_HISTORY);
  store.updatedAt = now;
  return { store, deleted: true };
}

function goalTiming(goals, extraMonthly) {
  const active = (Array.isArray(goals) ? goals : []).filter((goal) => goal && goal.archived !== true);
  const remaining = roundMoney(active.reduce((sum, goal) => sum + Math.max(0, number(goal.target) - number(goal.current)), 0));
  const baselineMonthly = roundMoney(active.reduce((sum, goal) => sum + Math.max(0, number(goal.monthlyContribution)), 0));
  const scenarioMonthly = roundMoney(baselineMonthly + Math.max(0, extraMonthly));
  return {
    remaining,
    baselineMonthly,
    scenarioMonthly,
    baselineMonths: remaining > 0 && baselineMonthly > 0 ? Math.ceil(remaining / baselineMonthly) : null,
    scenarioMonths: remaining > 0 && scenarioMonthly > 0 ? Math.ceil(remaining / scenarioMonthly) : null
  };
}

function debtDirection(debts, extraMonthly, horizonDays) {
  const total = roundMoney((Array.isArray(debts) ? debts : []).reduce((sum, debt) => sum + Math.max(0, number(debt?.balance)), 0));
  const horizonMonths = horizonDays / 30.4375;
  const modeledExtra = roundMoney(Math.min(total, Math.max(0, extraMonthly) * horizonMonths));
  return {
    baselineBalance: total,
    scenarioBalance: roundMoney(Math.max(0, total - modeledExtra)),
    modeledExtraReduction: modeledExtra,
    interestModeled: false
  };
}

export function compareScenario({ baselineForecast, assumptions: rawAssumptions, debts = [], goals = [] } = {}) {
  if (!baselineForecast || !Array.isArray(baselineForecast.daily) || !baselineForecast.settings) {
    throw new Error('A readable baseline cash forecast is required.');
  }
  const assumptions = sanitizeScenarioAssumptions({
    ...rawAssumptions,
    horizonDays: rawAssumptions?.horizonDays || baselineForecast.settings.horizonDays
  });
  const daily = baselineForecast.daily.slice(0, assumptions.horizonDays);
  if (!daily.length) throw new Error('The baseline forecast does not contain daily rows for this horizon.');
  const monthlyNetImpact = roundMoney(
    assumptions.monthlyIncomeDelta
    + assumptions.monthlyRecurringSavings
    - assumptions.flexibleSpendDelta
    - assumptions.extraDebtPaymentMonthly
    - assumptions.extraGoalContributionMonthly
  );
  let cumulative = assumptions.startingCashDelta;
  let lowBalance = Number.POSITIVE_INFINITY;
  let lowDate = daily[0].date;
  const pressureDays = [];
  const negativeDays = [];
  const scenarioDaily = daily.map((day) => {
    cumulative = roundMoney(cumulative + monthlyNetImpact / daysInMonth(day.date));
    if (assumptions.oneTimeExpense > 0 && day.date === assumptions.oneTimeDate) {
      cumulative = roundMoney(cumulative - assumptions.oneTimeExpense);
    }
    const balance = roundMoney(number(day.balance) + cumulative);
    if (balance < lowBalance) {
      lowBalance = balance;
      lowDate = day.date;
    }
    if (balance < number(baselineForecast.settings.minimumBuffer)) pressureDays.push({ date: day.date, balance });
    if (balance < 0) negativeDays.push({ date: day.date, balance });
    return { date: day.date, baselineBalance: roundMoney(day.balance), scenarioBalance: balance };
  });
  const endingBalance = scenarioDaily.at(-1)?.scenarioBalance ?? roundMoney(baselineForecast.endingBalance);
  const debt = debtDirection(debts, assumptions.extraDebtPaymentMonthly, assumptions.horizonDays);
  const goalsModel = goalTiming(goals, assumptions.extraGoalContributionMonthly);
  const baselineFlexible = Math.max(0, roundMoney(baselineForecast.settings.flexibleMonthlySpend));
  const scenarioFlexible = Math.max(0, roundMoney(baselineFlexible + assumptions.flexibleSpendDelta));
  const baseline = {
    endingBalance: roundMoney(baselineForecast.endingBalance),
    lowBalance: roundMoney(baselineForecast.lowBalance),
    lowDate: clean(baselineForecast.lowDate),
    pressureDays: baselineForecast.pressureDays?.length || 0,
    negativeDays: baselineForecast.negativeDays?.length || 0,
    flexibleMonthlySpend: baselineFlexible,
    debtBalance: debt.baselineBalance,
    goalMonths: goalsModel.baselineMonths
  };
  const scenario = {
    endingBalance,
    lowBalance: roundMoney(lowBalance),
    lowDate,
    pressureDays: pressureDays.length,
    negativeDays: negativeDays.length,
    flexibleMonthlySpend: scenarioFlexible,
    debtBalance: debt.scenarioBalance,
    goalMonths: goalsModel.scenarioMonths
  };
  return {
    assumptions,
    start: daily[0].date,
    end: daily.at(-1).date,
    horizonDays: daily.length,
    monthlyNetImpact,
    baseline,
    scenario,
    differences: {
      endingBalance: roundMoney(scenario.endingBalance - baseline.endingBalance),
      lowBalance: roundMoney(scenario.lowBalance - baseline.lowBalance),
      pressureDays: scenario.pressureDays - baseline.pressureDays,
      negativeDays: scenario.negativeDays - baseline.negativeDays,
      flexibleMonthlySpend: roundMoney(scenario.flexibleMonthlySpend - baseline.flexibleMonthlySpend),
      debtBalance: roundMoney(scenario.debtBalance - baseline.debtBalance),
      goalMonths: baseline.goalMonths !== null && scenario.goalMonths !== null ? scenario.goalMonths - baseline.goalMonths : null
    },
    debt,
    goals: goalsModel,
    daily: scenarioDaily,
    dataBoundary: {
      transactionRowsStored: false,
      forecastSettingsModified: false,
      debtPlanModified: false,
      goalsModified: false,
      recurringDecisionsModified: false,
      automaticApplyAvailable: false
    },
    assumptionsDisclosure: [
      'Monthly assumption changes are prorated across the modeled days rather than assigned to a specific payday or bill date.',
      'Debt direction subtracts extra principal only; interest, fees, minimum-payment changes, and amortization are not modeled.',
      'Goal timing divides remaining active-goal dollars by recorded monthly contributions plus the scenario contribution.',
      'Results are household discussion projections, not guarantees or financial advice.'
    ]
  };
}

export function scenarioSummaryText(comparison) {
  if (!comparison) return 'No scenario comparison is available.';
  const direction = comparison.differences.endingBalance > 0 ? 'improves' : comparison.differences.endingBalance < 0 ? 'reduces' : 'does not change';
  const pressure = comparison.differences.pressureDays < 0
    ? `${Math.abs(comparison.differences.pressureDays)} fewer buffer-pressure day${Math.abs(comparison.differences.pressureDays) === 1 ? '' : 's'}`
    : comparison.differences.pressureDays > 0
      ? `${comparison.differences.pressureDays} more buffer-pressure day${comparison.differences.pressureDays === 1 ? '' : 's'}`
      : 'the same number of buffer-pressure days';
  return `Across ${comparison.horizonDays} days, the scenario ${direction} ending cash by ${roundMoney(Math.abs(comparison.differences.endingBalance)).toFixed(2)} and produces ${pressure}.`;
}
