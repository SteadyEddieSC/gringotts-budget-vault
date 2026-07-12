import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_SCENARIOS,
  compareScenario,
  deleteScenarioRecord,
  sanitizeScenarioAssumptions,
  sanitizeScenarioStore,
  saveScenarioRecord,
  scenarioSummaryText
} from '../src/v124/scenario-model.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from '../src/v124/roadmap-horizon.js';

function baseline(days = 30) {
  const daily = [];
  let balance = 1000;
  for (let index = 0; index < days; index += 1) {
    const date = new Date(Date.UTC(2026, 6, 1 + index)).toISOString().slice(0, 10);
    balance -= 10;
    daily.push({ date, balance });
  }
  return {
    settings: { asOfDate: '2026-07-01', startingCash: 1000, minimumBuffer: 500, flexibleMonthlySpend: 300, horizonDays: days },
    start: '2026-07-01', end: daily.at(-1).date, endingBalance: daily.at(-1).balance,
    lowBalance: daily.at(-1).balance, lowDate: daily.at(-1).date,
    pressureDays: daily.filter((day) => day.balance < 500),
    negativeDays: [], daily
  };
}

test('sanitizes scenario assumptions and clamps nonnegative fields', () => {
  assert.deepEqual(sanitizeScenarioAssumptions({
    horizonDays: 45,
    startingCashDelta: '100.126',
    monthlyRecurringSavings: -20,
    oneTimeExpense: '50.555',
    oneTimeDate: 'not-a-date',
    extraDebtPaymentMonthly: -1
  }), {
    horizonDays: 60,
    startingCashDelta: 100.13,
    monthlyIncomeDelta: 0,
    monthlyRecurringSavings: 0,
    flexibleSpendDelta: 0,
    oneTimeExpense: 50.56,
    oneTimeDate: '',
    extraDebtPaymentMonthly: 0,
    extraGoalContributionMonthly: 0
  });
});

test('compares cash pressure without mutating baseline data', () => {
  const source = baseline();
  const before = JSON.stringify(source);
  const comparison = compareScenario({
    baselineForecast: source,
    assumptions: {
      horizonDays: 30,
      startingCashDelta: 100,
      monthlyIncomeDelta: 300,
      monthlyRecurringSavings: 50,
      flexibleSpendDelta: -40,
      oneTimeExpense: 120,
      oneTimeDate: '2026-07-15'
    }
  });
  assert.equal(JSON.stringify(source), before);
  assert.equal(comparison.horizonDays, 30);
  assert.ok(comparison.scenario.endingBalance > comparison.baseline.endingBalance);
  assert.ok(comparison.monthlyNetImpact > 0);
  assert.equal(comparison.dataBoundary.transactionRowsStored, false);
  assert.equal(comparison.dataBoundary.automaticApplyAvailable, false);
  assert.match(scenarioSummaryText(comparison), /Across 30 days/);
});

test('models debt principal direction and aggregate goal timing without interest claims', () => {
  const comparison = compareScenario({
    baselineForecast: baseline(60),
    assumptions: { horizonDays: 60, extraDebtPaymentMonthly: 200, extraGoalContributionMonthly: 100 },
    debts: [{ balance: 1200 }, { balance: 800 }],
    goals: [{ target: 2000, current: 500, monthlyContribution: 150, archived: false }]
  });
  assert.equal(comparison.debt.baselineBalance, 2000);
  assert.ok(comparison.debt.scenarioBalance < 2000);
  assert.equal(comparison.debt.interestModeled, false);
  assert.equal(comparison.goals.baselineMonths, 10);
  assert.equal(comparison.goals.scenarioMonths, 6);
  assert.ok(comparison.assumptionsDisclosure.some((entry) => /interest/i.test(entry)));
});

test('stores bounded assumption metadata and no copied financial rows', () => {
  let store = sanitizeScenarioStore({});
  for (let index = 0; index < MAX_SCENARIOS + 5; index += 1) {
    ({ store } = saveScenarioRecord(store, {
      name: `Synthetic scenario ${index}`,
      assumptions: { horizonDays: 30, monthlyIncomeDelta: index },
      notes: 'Fictional model only',
      transactions: [{ merchant: 'Forbidden' }]
    }, `2026-07-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`));
  }
  assert.equal(store.items.length, MAX_SCENARIOS);
  const serialized = JSON.stringify(store);
  assert.doesNotMatch(serialized, /transactions|merchant|account|balance|credential|token/i);
  assert.ok(store.history.length <= 80);
});

test('requires a date for a modeled one-time expense', () => {
  assert.throws(() => saveScenarioRecord({}, {
    name: 'Large purchase', assumptions: { oneTimeExpense: 1000 }
  }), /Choose a date/);
});

test('deletes scenario metadata without touching other records', () => {
  const saved = saveScenarioRecord({}, { name: 'Delete me', assumptions: {} }, '2026-07-11T12:00:00.000Z');
  const result = deleteScenarioRecord(saved.store, saved.item.id, '2026-07-11T13:00:00.000Z');
  assert.equal(result.deleted, true);
  assert.equal(result.store.items.length, 0);
  assert.equal(result.store.history[0].action, 'deleted');
});

test('validates the detailed v124 through v130 roadmap horizon', () => {
  assert.equal(validateRoadmapHorizon(), true);
  assert.equal(ROADMAP_HORIZON.length, 7);
  assert.equal(ROADMAP_HORIZON[0].version, 'v124');
  assert.equal(ROADMAP_HORIZON.at(-1).version, 'v130');
});
