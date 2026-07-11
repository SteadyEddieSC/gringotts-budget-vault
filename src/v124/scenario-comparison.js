import { money } from '../v103/core.js';
import { activeGoals } from '../v108/goals.js';
import { cashForecast, debtPlan, forecastSettings } from '../v110/planning.js';
import {
  SCENARIO_STORE_KEY,
  compareScenario,
  deleteScenarioRecord,
  sanitizeScenarioAssumptions,
  sanitizeScenarioStore,
  saveScenarioRecord,
  scenarioSummaryText
} from './scenario-model.js';

let installed = false;
let renderQueued = false;
let selectedScenarioId = '';
let draft = null;

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function readStore() {
  try {
    return sanitizeScenarioStore(JSON.parse(localStorage.getItem(SCENARIO_STORE_KEY) || '{}'));
  } catch {
    return sanitizeScenarioStore({});
  }
}

function verifiedWrite(nextValue) {
  const previousRaw = localStorage.getItem(SCENARIO_STORE_KEY);
  const next = sanitizeScenarioStore(nextValue);
  try {
    localStorage.setItem(SCENARIO_STORE_KEY, JSON.stringify(next));
    const verified = sanitizeScenarioStore(JSON.parse(localStorage.getItem(SCENARIO_STORE_KEY) || '{}'));
    if (JSON.stringify(verified) !== JSON.stringify(next)) {
      throw new Error('Scenario metadata read-back verification failed.');
    }
    return verified;
  } catch (error) {
    try {
      if (previousRaw === null) localStorage.removeItem(SCENARIO_STORE_KEY);
      else localStorage.setItem(SCENARIO_STORE_KEY, previousRaw);
    } catch {}
    throw new Error(`${error?.message || 'Scenario metadata write failed.'} The previous scenario metadata was restored.`);
  }
}

function emptyDraft() {
  const settings = forecastSettings();
  return {
    id: '',
    name: 'Household what-if',
    notes: '',
    assumptions: sanitizeScenarioAssumptions({ horizonDays: settings.horizonDays })
  };
}

function currentDraft(store = readStore()) {
  if (draft) return draft;
  const selected = store.items.find((item) => item.id === selectedScenarioId) || store.items[0];
  if (selected) {
    selectedScenarioId = selected.id;
    draft = { ...selected, assumptions: { ...selected.assumptions } };
    return draft;
  }
  draft = emptyDraft();
  return draft;
}

export function scenarioComparisonAnalysis(value = currentDraft()) {
  const assumptions = sanitizeScenarioAssumptions(value?.assumptions);
  const settings = { ...forecastSettings(), horizonDays: assumptions.horizonDays };
  const baselineForecast = cashForecast(settings);
  return compareScenario({
    baselineForecast,
    assumptions,
    debts: debtPlan().debts,
    goals: activeGoals()
  });
}

function option(value, label, selected) {
  const node = element('option', '', label);
  node.value = value;
  node.selected = value === selected;
  return node;
}

function select(values, selected = '') {
  const node = document.createElement('select');
  values.forEach(([value, label]) => node.append(option(value, label, selected)));
  return node;
}

function input(type, value, id, attributes = {}) {
  const node = document.createElement('input');
  node.type = type;
  node.id = id;
  node.value = value ?? '';
  Object.entries(attributes).forEach(([key, item]) => node.setAttribute(key, item));
  return node;
}

function control(labelText, node, className = '') {
  const label = element('label', `scenario-control ${className}`.trim());
  label.append(element('span', '', labelText), node);
  return label;
}

function metric(value, label) {
  const card = element('article', 'kpi scenario-kpi');
  card.append(element('strong', '', value), element('span', '', label));
  return card;
}

function signedMoney(value) {
  const amount = Number(value || 0);
  if (!amount) return money(0);
  return `${amount > 0 ? '+' : '−'}${money(Math.abs(amount))}`;
}

function signedNumber(value, suffix = '') {
  const amount = Number(value || 0);
  if (!amount) return `0${suffix}`;
  return `${amount > 0 ? '+' : '−'}${Math.abs(amount)}${suffix}`;
}

function comparisonTable(comparison) {
  const wrap = element('div', 'table-wrap scenario-comparison-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Baseline and scenario comparison');
  const table = element('table', 'ledger scenario-comparison-table');
  const head = element('thead');
  const headRow = element('tr');
  ['Measure', 'Baseline', 'Scenario', 'Difference'].forEach((label) => headRow.append(element('th', '', label)));
  head.append(headRow);
  const body = element('tbody');
  const rows = [
    ['Ending cash', money(comparison.baseline.endingBalance), money(comparison.scenario.endingBalance), signedMoney(comparison.differences.endingBalance)],
    ['Lowest cash point', `${money(comparison.baseline.lowBalance)} · ${comparison.baseline.lowDate}`, `${money(comparison.scenario.lowBalance)} · ${comparison.scenario.lowDate}`, signedMoney(comparison.differences.lowBalance)],
    ['Buffer-pressure days', String(comparison.baseline.pressureDays), String(comparison.scenario.pressureDays), signedNumber(comparison.differences.pressureDays)],
    ['Negative-balance days', String(comparison.baseline.negativeDays), String(comparison.scenario.negativeDays), signedNumber(comparison.differences.negativeDays)],
    ['Monthly flexible spending', money(comparison.baseline.flexibleMonthlySpend), money(comparison.scenario.flexibleMonthlySpend), signedMoney(comparison.differences.flexibleMonthlySpend)],
    ['Modeled debt balance', money(comparison.baseline.debtBalance), money(comparison.scenario.debtBalance), signedMoney(comparison.differences.debtBalance)],
    ['Aggregate goal timing', comparison.baseline.goalMonths === null ? 'Not estimable' : `${comparison.baseline.goalMonths} months`, comparison.scenario.goalMonths === null ? 'Not estimable' : `${comparison.scenario.goalMonths} months`, comparison.differences.goalMonths === null ? 'Not estimable' : signedNumber(comparison.differences.goalMonths, ' months')]
  ];
  rows.forEach((values) => {
    const row = element('tr');
    values.forEach((value, index) => row.append(element(index === 0 ? 'th' : 'td', '', value)));
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function scenarioPicker(store, selected) {
  const picker = select([
    ['', 'New unsaved scenario'],
    ...store.items.map((item) => [item.id, item.name])
  ], selected?.id || '');
  picker.id = 'scenarioSavedSelect';
  return control('Saved scenario', picker, 'scenario-saved-picker');
}

function assumptionForm(value) {
  const assumptions = value.assumptions;
  const section = element('section', 'scenario-form');
  const grid = element('div', 'scenario-form-grid');
  const name = input('text', value.name, 'scenarioName', { maxlength: '100' });
  const horizon = select([['30', '30 days'], ['60', '60 days'], ['90', '90 days']], String(assumptions.horizonDays));
  horizon.id = 'scenarioHorizon';
  grid.append(
    control('Scenario name', name),
    control('Horizon', horizon),
    control('Starting cash change', input('number', assumptions.startingCashDelta, 'scenarioStartingCashDelta', { step: '0.01' })),
    control('Monthly income change', input('number', assumptions.monthlyIncomeDelta, 'scenarioMonthlyIncomeDelta', { step: '0.01' })),
    control('Monthly recurring-cost savings', input('number', assumptions.monthlyRecurringSavings, 'scenarioRecurringSavings', { min: '0', step: '0.01' })),
    control('Monthly flexible-spending change', input('number', assumptions.flexibleSpendDelta, 'scenarioFlexibleSpendDelta', { step: '0.01' })),
    control('One-time purchase or expense', input('number', assumptions.oneTimeExpense, 'scenarioOneTimeExpense', { min: '0', step: '0.01' })),
    control('One-time expense date', input('date', assumptions.oneTimeDate, 'scenarioOneTimeDate')),
    control('Extra monthly debt payment', input('number', assumptions.extraDebtPaymentMonthly, 'scenarioDebtExtra', { min: '0', step: '0.01' })),
    control('Extra monthly goal contribution', input('number', assumptions.extraGoalContributionMonthly, 'scenarioGoalExtra', { min: '0', step: '0.01' }))
  );
  const notes = document.createElement('textarea');
  notes.id = 'scenarioNotes';
  notes.rows = 4;
  notes.maxLength = 1200;
  notes.value = value.notes || '';
  notes.placeholder = 'What decision is this scenario meant to support?';
  const actions = element('div', 'scenario-actions');
  const preview = element('button', 'btn primary', 'Preview Scenario');
  preview.type = 'button';
  preview.id = 'previewScenario';
  const save = element('button', 'btn secondary', 'Save Assumptions');
  save.type = 'button';
  save.id = 'saveScenario';
  const fresh = element('button', 'btn secondary', 'New Scenario');
  fresh.type = 'button';
  fresh.id = 'newScenario';
  actions.append(preview, save, fresh);
  if (value.id) {
    const remove = element('button', 'btn danger', 'Delete Saved Scenario');
    remove.type = 'button';
    remove.id = 'deleteScenario';
    actions.append(remove);
  }
  section.append(
    grid,
    control('Discussion notes', notes, 'scenario-notes'),
    actions,
    element('div', 'note warning-note', 'Preview and save affect scenario metadata only. There is no Apply Scenario action, and this workspace cannot change transactions, budgets, forecast settings, debts, goals, or recurring decisions.')
  );
  return section;
}

function disclosure(comparison) {
  const card = element('article', 'card scenario-disclosure');
  card.append(element('h4', '', 'Projection assumptions and limits'));
  const list = element('ul');
  comparison.assumptionsDisclosure.forEach((item) => list.append(element('li', '', item)));
  card.append(list);
  return card;
}

function renderWorkspace(workspace) {
  const store = readStore();
  const value = currentDraft(store);
  const comparison = scenarioComparisonAnalysis(value);
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h3', '', 'Household scenario comparison'),
    element('p', '', 'Compare temporary assumptions with the current cash forecast without changing the real household plan.')
  );
  titleRow.append(title, element('div', 'section-meta', `${comparison.start} to ${comparison.end}`));
  const metrics = element('div', 'import-summary-grid scenario-summary');
  metrics.append(
    metric(signedMoney(comparison.differences.endingBalance), 'Ending cash change'),
    metric(signedNumber(comparison.differences.pressureDays), 'Buffer-pressure days'),
    metric(signedMoney(comparison.differences.debtBalance), 'Modeled debt change'),
    metric(comparison.differences.goalMonths === null ? 'N/A' : signedNumber(comparison.differences.goalMonths), 'Goal months change'),
    metric(signedMoney(comparison.monthlyNetImpact), 'Monthly cash impact')
  );
  workspace.dataset.v124ScenarioWorkspace = 'true';
  workspace.replaceChildren(
    titleRow,
    metrics,
    element('p', 'scenario-summary-text', scenarioSummaryText(comparison)),
    scenarioPicker(store, value),
    assumptionForm(value),
    comparisonTable(comparison),
    disclosure(comparison)
  );
  if (store.items.length) {
    workspace.append(element('p', 'muted-note', `${store.items.length} of 24 saved assumption set${store.items.length === 1 ? '' : 's'} retained locally. Saved scenarios contain assumptions and notes only—not transaction rows or copied vault data.`));
  }
}

function readForm() {
  return {
    id: selectedScenarioId,
    name: document.getElementById('scenarioName')?.value || '',
    notes: document.getElementById('scenarioNotes')?.value || '',
    assumptions: {
      horizonDays: Number(document.getElementById('scenarioHorizon')?.value || 60),
      startingCashDelta: document.getElementById('scenarioStartingCashDelta')?.value || 0,
      monthlyIncomeDelta: document.getElementById('scenarioMonthlyIncomeDelta')?.value || 0,
      monthlyRecurringSavings: document.getElementById('scenarioRecurringSavings')?.value || 0,
      flexibleSpendDelta: document.getElementById('scenarioFlexibleSpendDelta')?.value || 0,
      oneTimeExpense: document.getElementById('scenarioOneTimeExpense')?.value || 0,
      oneTimeDate: document.getElementById('scenarioOneTimeDate')?.value || '',
      extraDebtPaymentMonthly: document.getElementById('scenarioDebtExtra')?.value || 0,
      extraGoalContributionMonthly: document.getElementById('scenarioGoalExtra')?.value || 0
    }
  };
}

function refreshWorkspace() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    const workspace = document.querySelector('.scenario-comparison-workspace');
    if (workspace) renderWorkspace(workspace);
  });
}

export function enhanceScenarioPage(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Close & Forecast') return false;
  let workspace = page.querySelector('.scenario-comparison-workspace');
  if (!workspace) {
    workspace = element('article', 'card scenario-comparison-workspace');
    page.append(workspace);
  }
  renderWorkspace(workspace);
  return true;
}

function scenarioActionCard(value, comparison) {
  const card = element('article', 'card scenario-plan-action');
  const row = element('div', 'section-title-row');
  const title = element('div');
  title.append(element('h4', '', `Review scenario: ${value.name}`), element('p', '', scenarioSummaryText(comparison)));
  row.append(title, element('div', 'section-meta', `${comparison.horizonDays} days`));
  const list = element('ul');
  list.append(
    element('li', '', `Ending cash difference: ${signedMoney(comparison.differences.endingBalance)}`),
    element('li', '', `Buffer-pressure day difference: ${signedNumber(comparison.differences.pressureDays)}`),
    element('li', '', `Modeled debt difference: ${signedMoney(comparison.differences.debtBalance)}`),
    element('li', '', 'Next step: discuss whether the assumptions are realistic before changing any real plan.')
  );
  if (value.notes) list.append(element('li', '', `Notes: ${value.notes}`));
  card.append(row, list);
  return card;
}

export function enhanceScenarioGuidedPlan(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Guided Household Plan') return false;
  if (page.querySelector('.v124-scenario-plan-section')) return true;
  const store = readStore();
  const section = element('section', 'v124-scenario-plan-section');
  const row = element('div', 'section-title-row');
  const title = element('div');
  title.append(element('h3', '', 'Scenario discussion'), element('p', '', 'Saved what-if assumptions for household review. No scenario is applied automatically.'));
  row.append(title, element('div', 'section-meta', `${store.items.length} saved`));
  section.append(row);
  if (!store.items.length) {
    section.append(element('div', 'note good-note', 'No saved scenario currently needs household discussion.'));
  } else {
    const list = element('div', 'scenario-plan-list');
    store.items.slice(0, 6).forEach((item) => list.append(scenarioActionCard(item, scenarioComparisonAnalysis(item))));
    section.append(list);
  }
  page.append(section);
  return true;
}

function reportSection(titleText, description, store) {
  const section = element('section', 'report-section v124-scenario-report-section');
  section.append(element('h3', '', titleText), element('p', '', description));
  if (!store.items.length) {
    section.append(element('p', '', 'No saved household scenario is available.'));
    return section;
  }
  const list = element('ul');
  store.items.slice(0, 6).forEach((item) => {
    const comparison = scenarioComparisonAnalysis(item);
    list.append(element('li', '', `${item.name}: ${scenarioSummaryText(comparison)}`));
  });
  section.append(list, element('p', 'muted-note', 'Scenario results are simplified discussion projections. They do not alter the real vault or guarantee an outcome.'));
  return section;
}

export function enhanceScenarioReportPages(root) {
  const store = readStore();
  const planningHeading = [...(root?.querySelectorAll('.report-page h2, .report-page h3') || [])]
    .find((node) => node.textContent?.trim() === 'Month close, forecast, and debt');
  const planningPage = planningHeading?.closest('.report-page');
  if (planningPage && !planningPage.querySelector('.v124-scenario-report-section')) {
    planningPage.append(reportSection('Household scenario comparisons', 'Saved baseline-versus-scenario projections for discussion.', store));
  }
  const meetingHeading = [...(root?.querySelectorAll('.report-page h2, .report-page h3') || [])]
    .find((node) => node.textContent?.trim() === 'Family meeting brief');
  const meetingPage = meetingHeading?.closest('.report-page');
  if (meetingPage && !meetingPage.querySelector('.v124-scenario-report-section')) {
    meetingPage.append(reportSection('Scenario conversation', 'Review assumptions, trade-offs, and whether a separate real-world change should be planned.', store));
  }
  return Boolean(planningPage || meetingPage);
}

function installHandlers() {
  if (installed) return;
  installed = true;
  document.addEventListener('change', (event) => {
    if (event.target?.id !== 'scenarioSavedSelect') return;
    selectedScenarioId = event.target.value;
    draft = selectedScenarioId ? null : emptyDraft();
    refreshWorkspace();
  });
  document.addEventListener('click', (event) => {
    const preview = event.target.closest?.('#previewScenario');
    const save = event.target.closest?.('#saveScenario');
    const fresh = event.target.closest?.('#newScenario');
    const remove = event.target.closest?.('#deleteScenario');
    if (!preview && !save && !fresh && !remove) return;
    event.preventDefault();
    try {
      if (preview) {
        draft = { ...readForm(), assumptions: sanitizeScenarioAssumptions(readForm().assumptions) };
        scenarioComparisonAnalysis(draft);
        announce('Scenario preview refreshed in memory');
      } else if (save) {
        const result = saveScenarioRecord(readStore(), readForm());
        verifiedWrite(result.store);
        selectedScenarioId = result.item.id;
        draft = result.item;
        announce('Scenario assumptions saved and verified');
      } else if (fresh) {
        selectedScenarioId = '';
        draft = emptyDraft();
        announce('New unsaved scenario started');
      } else if (remove) {
        const result = deleteScenarioRecord(readStore(), selectedScenarioId);
        if (!result.deleted) throw new Error('Saved scenario was not found.');
        verifiedWrite(result.store);
        selectedScenarioId = '';
        draft = emptyDraft();
        announce('Saved scenario metadata deleted');
      }
      refreshWorkspace();
    } catch (error) {
      announce(error?.message || 'Scenario action could not be completed');
    }
  });
}

export function installScenarioComparisonFeatures() {
  installHandlers();
  const registry = window.GringottsV124 || (window.GringottsV124 = {});
  Object.assign(registry, {
    scenarioComparisonReady: true,
    scenarioComparisonAnalysis,
    enhanceScenarioPage,
    enhanceScenarioGuidedPlan,
    enhanceScenarioReportPages,
    automaticApplyAvailable: false,
    transactionWriteAvailable: false,
    forecastWriteAvailable: false,
    debtWriteAvailable: false,
    goalWriteAvailable: false
  });
  return registry;
}
