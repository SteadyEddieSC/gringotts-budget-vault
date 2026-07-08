import {
  BUILD, $, best, debugReport, download, downloadJson, executiveSummary,
  getMonth, ics, months, reviewPackage, ruleData, saveRules,
  setMonthValue, shiftMonth, stamp, uid
} from './v103/core.js';
import {
  executiveMarkdown, exportFamilyXlsx, familyTrackerCsv, meetingMarkdown,
  workbookSheets, xlsxBlob
} from './v103/reports.js';
import { previewVaultObject, restore, selectFile, setAcknowledged, snapshot as restoreSnapshot } from './v103/restore.js';
import { exportFilledAnnualTracker, selectTrackerTemplate, trackerTemplateSnapshot } from './v104/template-workbook.js';
import { removeBudget, saveBudget, setRecurringStatus } from './v105/intelligence.js';
import {
  activityView, calendarView, dashboardView, diagnosticsView, moneyView,
  reportsView, toolsView
} from './v110/views.js';
import {
  batchMarkCategorizedReviewed, beginReviewSession, saveTransactionReview
} from './v107/review.js';
import {
  addGoalContribution, archiveGoal, deleteGoal, saveGoal, saveHealthSnapshot
} from './v108/goals.js';
import {
  clearImportSession, executeImport, prepareImportBackup, selectImportFile,
  setFuzzyDecision, setImportAcknowledged, setImportDestination,
  snapshot as importSnapshot
} from './v109/import-memory.js';
import {
  applyDebtPayment, closeMonth, deleteDebt, deletePlanningEvent,
  expandedWorkbookSheetsV110, reopenMonth, saveDebt, saveDebtExtra,
  saveForecastSettings, savePlanningEvent, saveReconciliation
} from './v110/planning.js';

Object.assign(BUILD, {
  version: 'v110',
  name: 'Month Close & Forecasting',
  runtime: 'src/runtime-v110-month-close.js',
  cacheBust: '110monthclose1'
});

let active = 'dashboard';
let moneySection = 'budget';
let activitySection = 'ledger';
let toolsSection = 'import';
let selectedCalendarDate = '';
let search = '';
let reviewPosition = 0;
let goalEditId = '';
let debtEditId = '';
let shellBound = false;
let renderFrame = 0;
let renderToken = 0;
let searchTimer = 0;
let lastRenderMs = 0;

function toast(message) {
  let node = $('toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    node.className = 'toast';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
}

function downloadBackup() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    toast('No populated readable vault is available to back up');
    return false;
  }
  downloadJson(`Gringotts_v110_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  toast('Current vault backup downloaded');
  return true;
}

function exportExpandedVaultWorkbookV110() {
  const month = getMonth();
  download(`Gringotts_Budget_Vault_v110_${month}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV110(month)));
  toast('24-sheet Vault Workbook downloaded');
}

function shell() {
  const nav = [
    ['dashboard', 'Dashboard'], ['money', 'Money'], ['calendar', 'Calendar'],
    ['reports', 'Reports'], ['activity', 'Activity'], ['tools', 'Tools']
  ];
  return `<a class="skip-link" href="#main">Skip to content</a><div id="appShell" class="app-shell">
    <header class="topbar"><div class="brand"><div class="crest" aria-hidden="true">G</div><div><h1>Gringotts Budget Vault</h1><p><strong>Mischief Managed. Money Managed</strong> <span class="version-text">${BUILD.version}</span></p></div></div><button id="menuToggle" class="menu-toggle" aria-expanded="false" aria-controls="primaryNav">☰ Menu</button></header>
    <nav id="primaryNav" class="tabs primary-nav" aria-label="Primary">${nav.map(([id, label]) => `<button class="tab ${active === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav>
    <main id="main"></main></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function ensureShell() {
  if ($('appShell')) return;
  document.body.innerHTML = shell();
  bindShell();
}

function updatePrimaryNavigation() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    const selected = button.dataset.tab === active;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
}

function closeMenu() {
  $('primaryNav')?.classList.remove('open');
  $('menuToggle')?.setAttribute('aria-expanded', 'false');
}

function bindShell() {
  if (shellBound) return;
  shellBound = true;
  $('menuToggle')?.addEventListener('click', () => {
    const nav = $('primaryNav');
    const open = nav.classList.toggle('open');
    $('menuToggle').setAttribute('aria-expanded', String(open));
  });
  $('primaryNav')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    active = button.dataset.tab;
    closeMenu();
    updatePrimaryNavigation();
    window.scrollTo({ top: 0, behavior: 'auto' });
    scheduleRender();
  });
}

function scheduleRender() {
  if (renderFrame) cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    renderMain().catch((error) => Promise.reject(error));
  });
}

function addBill() {
  try {
    savePlanningEvent('bill', {
      name: $('billName')?.value,
      amount: $('billAmount')?.value,
      date: $('billDate')?.value,
      frequency: $('billFrequency')?.value,
      account: $('billAccount')?.value
    });
    toast('Bill added to local planning');
    scheduleRender();
  } catch (error) {
    toast(error?.message || 'Bill could not be saved');
  }
}

function addPayday() {
  try {
    savePlanningEvent('payday', {
      name: $('payName')?.value,
      amount: $('payAmount')?.value,
      date: $('payDate')?.value,
      frequency: $('payFrequency')?.value,
      account: $('payAccount')?.value
    });
    toast('Payday added to local planning');
    scheduleRender();
  } catch (error) {
    toast(error?.message || 'Payday could not be saved');
  }
}

function addRule() {
  const find = $('findText')?.value.trim();
  const to = $('toText')?.value.trim();
  const label = $('labelText')?.value.trim();
  const scope = $('scopeText')?.value;
  if (!find || !to) { toast('Find text and suggested category are required'); return; }
  const data = ruleData();
  data.rules.push({ id: uid('r'), label: label || `${find} -> ${to}`, find, to, scope, on: true, createdAt: new Date().toISOString(), priority: data.rules.length + 1 });
  saveRules(data);
  toast('Rule saved');
  scheduleRender();
}

function mutateRule(id, action) {
  const data = ruleData();
  const index = data.rules.findIndex((rule) => rule.id === id);
  if (index < 0) return;
  if (action === 'delete') data.rules.splice(index, 1);
  else if (action === 'toggle') data.rules[index] = { ...data.rules[index], on: data.rules[index].on === false };
  else {
    const target = index + (action === 'up' ? -1 : 1);
    if (target < 0 || target >= data.rules.length) return;
    [data.rules[index], data.rules[target]] = [data.rules[target], data.rules[index]];
  }
  saveRules(data);
  scheduleRender();
}

function setMonth(value) {
  if (!setMonthValue(value)) return;
  selectedCalendarDate = `${value}-01`;
  reviewPosition = 0;
  debtEditId = '';
  scheduleRender();
}

function bindMonth() {
  $('monthPrev')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), -1)));
  $('monthNext')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), 1)));
  $('monthLatest')?.addEventListener('click', () => { const available = months(); setMonth(available.at(-1) || new Date().toISOString().slice(0, 7)); });
  $('monthPicker')?.addEventListener('change', (event) => setMonth(event.target.value));
  $('monthPicker')?.addEventListener('pointerdown', (event) => { if (typeof event.currentTarget.showPicker === 'function') try { event.currentTarget.showPicker(); } catch {} });
}

function bindSubnavigation() {
  document.querySelectorAll('[data-money-section]').forEach((button) => button.addEventListener('click', () => {
    moneySection = button.dataset.moneySection;
    if (moneySection !== 'goals') goalEditId = '';
    if (moneySection !== 'close') debtEditId = '';
    scheduleRender();
  }));
  document.querySelectorAll('[data-activity-section]').forEach((button) => button.addEventListener('click', () => {
    activitySection = button.dataset.activitySection;
    if (activitySection === 'review') reviewPosition = 0;
    scheduleRender();
  }));
  document.querySelectorAll('[data-tools-section]').forEach((button) => button.addEventListener('click', () => { toolsSection = button.dataset.toolsSection; scheduleRender(); }));
}

function bindBudgetAndRecurring() {
  $('saveBudget')?.addEventListener('click', () => {
    if (!saveBudget($('budgetCategory')?.value, $('budgetAmount')?.value)) { toast('Enter a category and a valid non-negative budget'); return; }
    toast('Category budget saved');
    scheduleRender();
  });
  document.querySelectorAll('[data-budget-delete]').forEach((button) => button.addEventListener('click', () => { removeBudget(button.dataset.budgetDelete); toast('Budget removed'); scheduleRender(); }));
  document.querySelectorAll('[data-budget-suggest]').forEach((button) => button.addEventListener('click', () => {
    const amount = Number(button.dataset.budgetAmount);
    if (!amount || !saveBudget(button.dataset.budgetSuggest, amount)) { toast('No usable suggestion is available'); return; }
    toast('Suggested budget saved');
    scheduleRender();
  }));
  document.querySelectorAll('[data-recurring-action]').forEach((button) => button.addEventListener('click', () => {
    setRecurringStatus(button.dataset.recurringKey, button.dataset.recurringAction);
    toast(`Recurring status set to ${button.dataset.recurringAction}`);
    scheduleRender();
  }));
}

function bindCalendar() {
  document.querySelectorAll('[data-calendar-day]').forEach((button) => button.addEventListener('click', () => { selectedCalendarDate = button.dataset.calendarDay; scheduleRender(); }));
  $('calendarPlanning')?.addEventListener('click', () => { active = 'money'; moneySection = 'planning'; updatePrimaryNavigation(); scheduleRender(); });
  $('downloadIcs')?.addEventListener('click', () => download(`Gringotts_v110_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('copyIcs')?.addEventListener('click', async () => { await navigator.clipboard.writeText(ics()); toast('Calendar copied'); });
}

function reviewChanges() {
  return {
    category: $('reviewCategory')?.value || '',
    owner: $('reviewOwner')?.value || '',
    account: $('reviewAccount')?.value || '',
    notes: $('reviewNotes')?.value || ''
  };
}

function bindReview() {
  $('enableReviewEditing')?.addEventListener('click', () => { if (beginReviewSession(toast)) scheduleRender(); });
  $('reviewPrevious')?.addEventListener('click', () => { reviewPosition = Math.max(0, reviewPosition - 1); scheduleRender(); });
  $('reviewNext')?.addEventListener('click', () => { reviewPosition += 1; scheduleRender(); });
  $('useReviewSuggestion')?.addEventListener('click', (event) => {
    const select = $('reviewCategory');
    const value = event.currentTarget.dataset.suggestion || '';
    if (!select) return;
    if (![...select.options].some((option) => option.value === value)) select.add(new Option(value, value));
    select.value = value;
    select.focus();
  });
  $('saveReviewProgress')?.addEventListener('click', (event) => { if (saveTransactionReview(event.currentTarget.dataset.rowIndex, reviewChanges(), false, toast)) scheduleRender(); });
  $('saveReviewAndNext')?.addEventListener('click', (event) => { if (saveTransactionReview(event.currentTarget.dataset.rowIndex, reviewChanges(), true, toast)) scheduleRender(); });
  $('batchReviewCategorized')?.addEventListener('click', () => {
    if (!window.confirm('Mark every queued transaction in the selected month that already has a specific category as reviewed?\n\nThis does not change categories, amounts, merchants, or dates.')) return;
    if (batchMarkCategorizedReviewed(getMonth(), toast)) { reviewPosition = 0; scheduleRender(); }
  });
}

function goalFormValues() {
  return {
    id: $('goalId')?.value || '',
    name: $('goalName')?.value || '',
    type: $('goalType')?.value || '',
    target: $('goalTarget')?.value || '',
    current: $('goalCurrent')?.value || '',
    monthlyContribution: $('goalMonthly')?.value || '',
    dueDate: $('goalDueDate')?.value || '',
    notes: $('goalNotes')?.value || ''
  };
}

function bindGoals() {
  $('saveGoal')?.addEventListener('click', () => {
    const id = saveGoal(goalFormValues());
    if (!id) { toast('Goal name and a target greater than zero are required'); return; }
    goalEditId = '';
    toast('Goal saved');
    scheduleRender();
  });
  $('cancelGoalEdit')?.addEventListener('click', () => { goalEditId = ''; scheduleRender(); });
  $('saveHealthSnapshot')?.addEventListener('click', () => { const health = saveHealthSnapshot(getMonth()); toast(`Vault Health snapshot saved at ${health.score}`); scheduleRender(); });
  document.querySelectorAll('[data-goal-edit]').forEach((button) => button.addEventListener('click', () => { goalEditId = button.dataset.goalEdit; window.scrollTo({ top: 0, behavior: 'smooth' }); scheduleRender(); }));
  document.querySelectorAll('[data-goal-contribute]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.goalContribute;
    const input = document.querySelector(`[data-goal-contribution-input="${CSS.escape(id)}"]`);
    if (!addGoalContribution(id, input?.value)) { toast('Enter a non-zero contribution amount'); return; }
    toast('Goal contribution saved');
    scheduleRender();
  }));
  document.querySelectorAll('[data-goal-archive]').forEach((button) => button.addEventListener('click', () => {
    if (!window.confirm('Archive this goal? It will be removed from the active goal list but retained in local goal data.')) return;
    if (archiveGoal(button.dataset.goalArchive)) { toast('Goal archived'); goalEditId = ''; scheduleRender(); }
  }));
  document.querySelectorAll('[data-goal-delete]').forEach((button) => button.addEventListener('click', () => {
    if (!window.confirm('Permanently remove this goal from local goal data?')) return;
    if (deleteGoal(button.dataset.goalDelete)) { toast('Goal deleted'); goalEditId = ''; scheduleRender(); }
  }));
}

function bindImportActions() {
  $('importFile')?.addEventListener('change', (event) => selectImportFile(event.target.files?.[0], toast, scheduleRender));
  $('importDestination')?.addEventListener('change', (event) => {
    if (!setImportDestination(event.target.value)) toast(importSnapshot().error || 'Destination could not be selected');
    scheduleRender();
  });
  document.querySelectorAll('[data-fuzzy-decision]').forEach((select) => select.addEventListener('change', (event) => {
    setFuzzyDecision(event.currentTarget.dataset.fuzzyDecision, event.currentTarget.value);
    scheduleRender();
  }));
  $('prepareImportBackup')?.addEventListener('click', () => { if (prepareImportBackup(toast)) scheduleRender(); });
  $('importAck')?.addEventListener('change', (event) => {
    setImportAcknowledged(event.target.checked);
    const button = $('commitImport');
    if (button) button.disabled = !importSnapshot().ready;
  });
  $('commitImport')?.addEventListener('click', () => executeImport(toast, scheduleRender));
  $('resetImportPreview')?.addEventListener('click', () => { clearImportSession(); toast('Import preview cleared'); scheduleRender(); });
}

function bindCloseForecast() {
  document.querySelectorAll('[data-save-reconciliation]').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.reconciliation-card');
    try {
      const saved = saveReconciliation(getMonth(), {
        account: button.dataset.saveReconciliation,
        statementCount: card?.querySelector('.statement-count')?.value,
        statementNet: card?.querySelector('.statement-net')?.value,
        acceptDifference: card?.querySelector('.accept-difference')?.checked,
        notes: card?.querySelector('.reconcile-notes')?.value
      });
      toast(saved.status === 'matched' ? 'Statement reconciliation matched' : saved.status === 'accepted-difference' ? 'Explained statement difference saved' : 'Statement difference saved; month remains blocked');
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Reconciliation could not be saved');
    }
  }));
  $('closeMonth')?.addEventListener('click', () => {
    if (!window.confirm(`Close ${getMonth()}?\n\nThis creates an immutable local summary revision. Transactions are not changed. Reopening later requires a reason.`)) return;
    try {
      const event = closeMonth(getMonth(), $('closeNote')?.value);
      toast(`Month closed and verified as revision ${event.revision}`);
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Month could not be closed');
    }
  });
  $('reopenMonth')?.addEventListener('click', () => {
    const reason = $('reopenReason')?.value;
    if (!window.confirm(`Reopen ${getMonth()}?\n\nThe prior close snapshot remains in history. A new reconciliation and close revision will be required.`)) return;
    try {
      reopenMonth(getMonth(), reason);
      toast('Month reopened; prior close revision preserved');
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Month could not be reopened');
    }
  });
  $('saveForecastSettings')?.addEventListener('click', () => {
    try {
      saveForecastSettings({
        asOfDate: $('forecastAsOf')?.value,
        startingCash: $('forecastStartingCash')?.value,
        minimumBuffer: $('forecastMinimumBuffer')?.value,
        flexibleMonthlySpend: $('forecastFlexibleSpend')?.value,
        horizonDays: $('forecastHorizon')?.value
      });
      toast('Forecast settings saved');
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Forecast settings could not be saved');
    }
  });
  $('saveDebt')?.addEventListener('click', () => {
    try {
      saveDebt({
        id: $('debtId')?.value,
        name: $('debtName')?.value,
        balance: $('debtBalance')?.value,
        apr: $('debtApr')?.value,
        minimumPayment: $('debtMinimum')?.value,
        targetPayment: $('debtTarget')?.value,
        promoApr: $('debtPromoApr')?.value,
        promoEnd: $('debtPromoEnd')?.value,
        notes: $('debtNotes')?.value
      });
      debtEditId = '';
      toast('Debt plan saved');
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Debt plan could not be saved');
    }
  });
  $('cancelDebtEdit')?.addEventListener('click', () => { debtEditId = ''; scheduleRender(); });
  $('saveDebtExtra')?.addEventListener('click', () => {
    try {
      saveDebtExtra($('debtMonthlyExtra')?.value);
      toast('Monthly extra debt amount saved');
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Extra debt amount could not be saved');
    }
  });
  document.querySelectorAll('[data-debt-edit]').forEach((button) => button.addEventListener('click', () => {
    debtEditId = button.dataset.debtEdit;
    document.getElementById('debtHeading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scheduleRender();
  }));
  document.querySelectorAll('[data-debt-delete]').forEach((button) => button.addEventListener('click', () => {
    if (!window.confirm('Delete this local debt-planning entry? Transactions and goals are not changed.')) return;
    if (deleteDebt(button.dataset.debtDelete)) { debtEditId = ''; toast('Debt plan deleted'); scheduleRender(); }
  }));
  document.querySelectorAll('[data-debt-payment]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.debtPayment;
    const input = document.querySelector(`[data-debt-payment-input="${CSS.escape(id)}"]`);
    try {
      const applied = applyDebtPayment(id, input?.value);
      toast(`Recorded ${applied.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} payment`);
      scheduleRender();
    } catch (error) {
      toast(error?.message || 'Payment could not be recorded');
    }
  }));
}

function bindPlanningEvents() {
  document.querySelectorAll('[data-delete-planning]').forEach((button) => button.addEventListener('click', () => {
    if (!window.confirm('Delete this planned cash-flow item? Transactions are not changed.')) return;
    if (deletePlanningEvent(button.dataset.deletePlanning, button.dataset.planningId)) {
      toast('Planned item deleted');
      scheduleRender();
    }
  }));
}

function bindExistingActions() {
  $('openImport')?.addEventListener('click', () => { active = 'tools'; toolsSection = 'import'; updatePrimaryNavigation(); scheduleRender(); });
  $('openReports')?.addEventListener('click', () => { active = 'reports'; updatePrimaryNavigation(); scheduleRender(); });
  $('exportsReports')?.addEventListener('click', () => { active = 'reports'; updatePrimaryNavigation(); scheduleRender(); });
  $('q')?.addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => { search = value; scheduleRender(); }, 180);
  });
  $('addBill')?.addEventListener('click', addBill);
  $('addPay')?.addEventListener('click', addPayday);
  $('addRule')?.addEventListener('click', addRule);
  document.querySelectorAll('[data-up]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.up, 'up')));
  document.querySelectorAll('[data-down]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.down, 'down')));
  document.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.toggle, 'toggle')));
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.del, 'delete')));
  $('exportReview')?.addEventListener('click', () => downloadJson(`Gringotts_v110_rules_review_${stamp()}.json`, reviewPackage()));
  $('backupRules')?.addEventListener('click', downloadBackup);
  $('importBackup')?.addEventListener('click', downloadBackup);
  $('restoreFile')?.addEventListener('change', (event) => selectFile(event.target.files?.[0], toast, scheduleRender));
  $('restoreAck')?.addEventListener('change', (event) => { setAcknowledged(event.target.checked); const button = $('restoreVault'), data = restoreSnapshot(); if (button) button.disabled = !(data.valid && data.acknowledged); });
  $('restoreVault')?.addEventListener('click', () => restore(toast));
  $('annualTrackerFile')?.addEventListener('change', (event) => selectTrackerTemplate(event.target.files?.[0], toast, scheduleRender));
  $('filledAnnualTracker')?.addEventListener('click', () => exportFilledAnnualTracker(toast));
  $('familyXlsx')?.addEventListener('click', () => exportFamilyXlsx(toast));
  $('familyCsv')?.addEventListener('click', () => { const month = getMonth(); download(`Income_Expenses_Quick_${month}_${stamp()}.csv`, familyTrackerCsv(month), 'text/csv'); toast('Quick transactions CSV downloaded'); });
  $('vaultXlsx')?.addEventListener('click', exportExpandedVaultWorkbookV110);
  $('executiveMd')?.addEventListener('click', () => { const month = getMonth(); download(`Gringotts_Executive_Summary_${month}_${stamp()}.md`, executiveMarkdown(month), 'text/markdown'); });
  $('copyExecutive')?.addEventListener('click', async () => { await navigator.clipboard.writeText(executiveSummary(getMonth())); toast('Executive summary copied'); });
  $('meetingMd')?.addEventListener('click', () => { const month = getMonth(); download(`Gringotts_Family_Meeting_Pack_${month}_${stamp()}.md`, meetingMarkdown(month), 'text/markdown'); });
  $('printReports')?.addEventListener('click', () => window.print());
  $('exportBackup')?.addEventListener('click', downloadBackup);
  $('exportRules')?.addEventListener('click', () => downloadJson(`Gringotts_v110_rules_review_${stamp()}.json`, reviewPackage()));
  $('exportIcs')?.addEventListener('click', () => download(`Gringotts_v110_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('exportDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v110_diagnostics_${stamp()}.json`, { ...debugReport(), performance: { lastRenderMs } }));
  $('copyDebug')?.addEventListener('click', async () => { await navigator.clipboard.writeText(JSON.stringify({ ...debugReport(), performance: { lastRenderMs } }, null, 2)); toast('Diagnostics copied'); });
  $('downloadDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v110_diagnostics_${stamp()}.json`, { ...debugReport(), performance: { lastRenderMs } }));
  bindImportActions();
  bindPlanningEvents();
  bindCloseForecast();
}

function bindView() {
  bindMonth();
  bindSubnavigation();
  bindBudgetAndRecurring();
  bindCalendar();
  bindReview();
  bindGoals();
  bindExistingActions();
}

async function renderView() {
  if (active === 'dashboard') return dashboardView();
  if (active === 'money') return moneyView(moneySection, goalEditId, debtEditId);
  if (active === 'calendar') return calendarView(selectedCalendarDate || `${getMonth()}-01`);
  if (active === 'reports') return reportsView();
  if (active === 'activity') return activityView(activitySection, search, reviewPosition);
  if (active === 'tools') return toolsView(toolsSection);
  return dashboardView();
}

async function renderMain() {
  ensureShell();
  updatePrimaryNavigation();
  const token = ++renderToken;
  const main = $('main');
  const started = performance.now();
  main.setAttribute('aria-busy', 'true');
  const html = await renderView();
  if (token !== renderToken) return;
  main.innerHTML = html;
  if (active === 'tools' && toolsSection === 'diagnostics') $('diagnosticsMount').innerHTML = await diagnosticsView();
  if (token !== renderToken) return;
  bindView();
  main.removeAttribute('aria-busy');
  lastRenderMs = Math.round((performance.now() - started) * 10) / 10;
}

async function start() {
  document.title = 'Gringotts Budget Vault v110';
  ensureShell();
  await renderMain();
}

window.GringottsCleanRuntime = {
  BUILD,
  backup: downloadBackup,
  debugReport,
  previewVaultObject,
  imports: { snapshot: importSnapshot },
  performance: { get lastRenderMs() { return lastRenderMs; } },
  reports: { executiveSummary, workbookSheets, xlsxBlob, familyTrackerCsv, trackerTemplateSnapshot },
  month: { get: getMonth, set: setMonthValue, shift: shiftMonth }
};

start();
