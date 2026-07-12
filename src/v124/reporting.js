import { getMonth, read } from '../v103/core.js';
import { activeGoals } from '../v108/goals.js';
import { cashForecast, debtPlan, forecastSettings } from '../v110/planning.js';
import { householdReportModel } from '../v111/reporting.js';
import { expandedWorkbookSheetsV123 } from '../v123/reporting.js';
import {
  SCENARIO_STORE_KEY,
  compareScenario,
  sanitizeScenarioStore,
  scenarioSummaryText
} from './scenario-model.js';

function storedScenarios() {
  return sanitizeScenarioStore(read(SCENARIO_STORE_KEY, {}));
}

function comparisonFor(item) {
  const settings = { ...forecastSettings(), horizonDays: item.assumptions.horizonDays };
  return compareScenario({
    baselineForecast: cashForecast(settings),
    assumptions: item.assumptions,
    debts: debtPlan().debts,
    goals: activeGoals()
  });
}

export function scenarioReportModelV124() {
  const store = storedScenarios();
  const scenarios = store.items.map((item) => ({
    item,
    comparison: comparisonFor(item)
  }));
  return {
    store,
    scenarios,
    summary: {
      saved: scenarios.length,
      improvedEndingCash: scenarios.filter(({ comparison }) => comparison.differences.endingBalance > 0).length,
      reducedPressure: scenarios.filter(({ comparison }) => comparison.differences.pressureDays < 0).length,
      modeledDebtReduction: scenarios.reduce((sum, { comparison }) => sum + comparison.debt.modeledExtraReduction, 0)
    }
  };
}

export function scenarioComparisonSheetV124(model = scenarioReportModelV124()) {
  return {
    name: 'Scenario Comparisons',
    rows: [
      [
        'Scenario ID', 'Scenario Name', 'Horizon Days', 'Start', 'End',
        'Baseline Ending Cash', 'Scenario Ending Cash', 'Ending Cash Difference',
        'Baseline Low Cash', 'Scenario Low Cash', 'Low Cash Difference',
        'Baseline Pressure Days', 'Scenario Pressure Days', 'Pressure Day Difference',
        'Baseline Negative Days', 'Scenario Negative Days', 'Negative Day Difference',
        'Baseline Debt Balance', 'Scenario Debt Balance', 'Modeled Extra Principal',
        'Baseline Goal Months', 'Scenario Goal Months', 'Goal Month Difference',
        'Automatic Apply', 'Transaction Write', 'Forecast Write', 'Debt Write', 'Goal Write'
      ],
      ...model.scenarios.map(({ item, comparison }) => [
        item.id,
        item.name,
        comparison.horizonDays,
        comparison.start,
        comparison.end,
        comparison.baseline.endingBalance,
        comparison.scenario.endingBalance,
        comparison.differences.endingBalance,
        comparison.baseline.lowBalance,
        comparison.scenario.lowBalance,
        comparison.differences.lowBalance,
        comparison.baseline.pressureDays,
        comparison.scenario.pressureDays,
        comparison.differences.pressureDays,
        comparison.baseline.negativeDays,
        comparison.scenario.negativeDays,
        comparison.differences.negativeDays,
        comparison.baseline.debtBalance,
        comparison.scenario.debtBalance,
        comparison.debt.modeledExtraReduction,
        comparison.baseline.goalMonths ?? '',
        comparison.scenario.goalMonths ?? '',
        comparison.differences.goalMonths ?? '',
        'Unavailable',
        'Unavailable',
        'Unavailable',
        'Unavailable',
        'Unavailable'
      ])
    ]
  };
}

export function scenarioAssumptionsSheetV124(model = scenarioReportModelV124()) {
  return {
    name: 'Scenario Assumptions',
    rows: [
      [
        'Scenario ID', 'Scenario Name', 'Horizon Days', 'Starting Cash Change',
        'Monthly Income Change', 'Monthly Recurring Savings', 'Flexible Spending Change',
        'One-Time Expense', 'One-Time Date', 'Extra Monthly Debt Payment',
        'Extra Monthly Goal Contribution', 'Monthly Net Cash Impact', 'Notes', 'Updated'
      ],
      ...model.scenarios.map(({ item, comparison }) => [
        item.id,
        item.name,
        item.assumptions.horizonDays,
        item.assumptions.startingCashDelta,
        item.assumptions.monthlyIncomeDelta,
        item.assumptions.monthlyRecurringSavings,
        item.assumptions.flexibleSpendDelta,
        item.assumptions.oneTimeExpense,
        item.assumptions.oneTimeDate,
        item.assumptions.extraDebtPaymentMonthly,
        item.assumptions.extraGoalContributionMonthly,
        comparison.monthlyNetImpact,
        item.notes,
        item.updatedAt
      ])
    ]
  };
}

export function expandedWorkbookSheetsV124(
  month = getMonth(),
  reportModel = householdReportModel()
) {
  const scenarioModel = scenarioReportModelV124();
  return [
    ...expandedWorkbookSheetsV123(month, reportModel),
    scenarioComparisonSheetV124(scenarioModel),
    scenarioAssumptionsSheetV124(scenarioModel)
  ];
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function signedMoney(value) {
  const amount = Number(value || 0);
  if (!amount) return money(0);
  return `${amount > 0 ? '+' : '−'}${money(Math.abs(amount))}`;
}

export function scenarioMarkdownV124(model = scenarioReportModelV124(), {
  heading = 'Household Scenario Comparisons'
} = {}) {
  const lines = [
    `## ${heading}`,
    '',
    `Saved scenarios: ${model.summary.saved}`,
    `Scenarios with higher modeled ending cash: ${model.summary.improvedEndingCash}`,
    `Scenarios with fewer buffer-pressure days: ${model.summary.reducedPressure}`,
    `Modeled extra principal across saved scenarios: ${money(model.summary.modeledDebtReduction)}`,
    '',
    '> Scenario results are simplified household discussion projections. They do not change the vault, apply a plan, model full debt amortization, or guarantee an outcome.',
    ''
  ];
  if (!model.scenarios.length) {
    lines.push('No saved household scenario is available.', '');
    return lines.join('\n');
  }
  model.scenarios.forEach(({ item, comparison }) => {
    lines.push(
      `### ${item.name}`,
      '',
      `- Horizon: ${comparison.start} through ${comparison.end} (${comparison.horizonDays} days)`,
      `- Ending cash difference: ${signedMoney(comparison.differences.endingBalance)}`,
      `- Buffer-pressure day difference: ${comparison.differences.pressureDays > 0 ? '+' : ''}${comparison.differences.pressureDays}`,
      `- Modeled debt difference: ${signedMoney(comparison.differences.debtBalance)}`,
      `- Goal timing difference: ${comparison.differences.goalMonths === null ? 'Not estimable' : `${comparison.differences.goalMonths > 0 ? '+' : ''}${comparison.differences.goalMonths} months`}`,
      `- Summary: ${scenarioSummaryText(comparison)}`
    );
    if (item.notes) lines.push(`- Notes: ${item.notes}`);
    lines.push('');
  });
  return lines.join('\n');
}
