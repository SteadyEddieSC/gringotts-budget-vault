import {
  BUILD, $, best, cashflow, debugReport, download, downloadJson, executiveSummary,
  getMonth, ics, months, reviewPackage, ruleData, saveCashflow, saveRules,
  setMonthValue, shiftMonth, stamp, uid
} from './v103/core.js';
import {
  executiveMarkdown, exportFamilyXlsx, familyTrackerCsv, meetingMarkdown,
  workbookSheets, xlsxBlob
} from './v103/reports.js';
import { previewVaultObject, restore, selectFile, setAcknowledged, snapshot as restoreSnapshot } from './v103/restore.js';
import { exportFilledAnnualTracker, selectTrackerTemplate, trackerTemplateSnapshot } from './v104/template-workbook.js';
import { exportExpandedVaultWorkbook, removeBudget, saveBudget, setRecurringStatus } from './v105/intelligence.js';
import {
  activityView, calendarView, dashboardView, diagnosticsView, moneyView,
  reportsView, toolsView
} from './v106/views.js';

Object.assign(BUILD, {
  version: 'v106',
  name: 'Calendar, Cash Flow & UI Consolidation',
  runtime: 'src/runtime-v106-calendar-ui.js',
  cacheBust: '106calendarui1'
});

let active = 'dashboard';
let moneySection = 'budget';
let activitySection = 'ledger';
let toolsSection = 'import';
let selectedCalendarDate = '';
let search = '';

function toast(message) {
  let node = $('toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    node.className = 'toast';
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
  downloadJson(`Gringotts_v106_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  toast('Current vault backup downloaded');
  return true;
}

function shell() {
  const nav = [
    ['dashboard', 'Dashboard'], ['money', 'Money'], ['calendar', 'Calendar'],
    ['reports', 'Reports'], ['activity', 'Activity'], ['tools', 'Tools']
  ];
  return `<a class="skip-link" href="#main">Skip to content</a><div class="app-shell">
    <header class="topbar"><div class="brand"><div class="crest" aria-hidden="true">G</div><div><h1>Gringotts Budget Vault</h1><p><strong>Mischief Managed. Money Manged</strong> <span class="version-text">${BUILD.version}</span></p></div></div><button id="menuToggle" class="menu-toggle" aria-expanded="false" aria-controls="primaryNav">☰ Menu</button></header>
    <nav id="primaryNav" class="tabs primary-nav" aria-label="Primary">${nav.map(([id, label]) => `<button class="tab ${active === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav>
    <main id="main"></main></div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function addBill() {
  const data = cashflow();
  const name = $('billName')?.value.trim();
  const date = $('billDate')?.value;
  if (!name || !date) { toast('Bill name and date are required'); return; }
  data.bills.unshift({ id: uid('b'), name, amount: Number($('billAmount')?.value) || 0, dueDate: date });
  saveCashflow(data);
  render();
}

function addPayday() {
  const data = cashflow();
  const name = $('payName')?.value.trim();
  const date = $('payDate')?.value;
  if (!name || !date) { toast('Payday name and date are required'); return; }
  data.paydays.unshift({ id: uid('p'), name, amount: Number($('payAmount')?.value) || 0, date });
  saveCashflow(data);
  render();
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
  render();
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
  render();
}

function setMonth(value) {
  if (!setMonthValue(value)) return;
  selectedCalendarDate = `${value}-01`;
  render();
}

function bindNavigation() {
  $('menuToggle')?.addEventListener('click', () => {
    const nav = $('primaryNav');
    const open = nav.classList.toggle('open');
    $('menuToggle').setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
    active = button.dataset.tab;
    render();
  }));
  document.querySelectorAll('[data-money-section]').forEach((button) => button.addEventListener('click', () => { moneySection = button.dataset.moneySection; render(); }));
  document.querySelectorAll('[data-activity-section]').forEach((button) => button.addEventListener('click', () => { activitySection = button.dataset.activitySection; render(); }));
  document.querySelectorAll('[data-tools-section]').forEach((button) => button.addEventListener('click', () => { toolsSection = button.dataset.toolsSection; render(); }));
}

function bindMonth() {
  $('monthPrev')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), -1)));
  $('monthNext')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), 1)));
  $('monthLatest')?.addEventListener('click', () => { const available = months(); setMonth(available.at(-1) || new Date().toISOString().slice(0, 7)); });
  $('monthPicker')?.addEventListener('change', (event) => setMonth(event.target.value));
  $('monthPicker')?.addEventListener('pointerdown', (event) => { if (typeof event.currentTarget.showPicker === 'function') try { event.currentTarget.showPicker(); } catch {} });
}

function bindBudgetAndRecurring() {
  $('saveBudget')?.addEventListener('click', () => {
    if (!saveBudget($('budgetCategory')?.value, $('budgetAmount')?.value)) { toast('Enter a category and a valid non-negative budget'); return; }
    toast('Category budget saved');
    render();
  });
  document.querySelectorAll('[data-budget-delete]').forEach((button) => button.addEventListener('click', () => { removeBudget(button.dataset.budgetDelete); toast('Budget removed'); render(); }));
  document.querySelectorAll('[data-budget-suggest]').forEach((button) => button.addEventListener('click', () => {
    const amount = Number(button.dataset.budgetAmount);
    if (!amount || !saveBudget(button.dataset.budgetSuggest, amount)) { toast('No usable suggestion is available'); return; }
    toast('Suggested budget saved');
    render();
  }));
  document.querySelectorAll('[data-recurring-action]').forEach((button) => button.addEventListener('click', () => {
    setRecurringStatus(button.dataset.recurringKey, button.dataset.recurringAction);
    toast(`Recurring status set to ${button.dataset.recurringAction}`);
    render();
  }));
}

function bindCalendar() {
  document.querySelectorAll('[data-calendar-day]').forEach((button) => button.addEventListener('click', () => { selectedCalendarDate = button.dataset.calendarDay; render(); }));
  $('calendarPlanning')?.addEventListener('click', () => { active = 'money'; moneySection = 'planning'; render(); });
  $('downloadIcs')?.addEventListener('click', () => download(`Gringotts_v106_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('copyIcs')?.addEventListener('click', async () => { await navigator.clipboard.writeText(ics()); toast('Calendar copied'); });
}

function bindExistingActions() {
  $('openImport')?.addEventListener('click', () => { active = 'tools'; toolsSection = 'import'; render(); });
  $('openReports')?.addEventListener('click', () => { active = 'reports'; render(); });
  $('exportsReports')?.addEventListener('click', () => { active = 'reports'; render(); });
  $('q')?.addEventListener('input', (event) => { search = event.target.value; render(); });
  $('addBill')?.addEventListener('click', addBill);
  $('addPay')?.addEventListener('click', addPayday);
  $('addRule')?.addEventListener('click', addRule);
  document.querySelectorAll('[data-up]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.up, 'up')));
  document.querySelectorAll('[data-down]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.down, 'down')));
  document.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.toggle, 'toggle')));
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.del, 'delete')));
  $('exportReview')?.addEventListener('click', () => downloadJson(`Gringotts_v106_rules_review_${stamp()}.json`, reviewPackage()));
  $('backupRules')?.addEventListener('click', downloadBackup);
  $('importBackup')?.addEventListener('click', downloadBackup);
  $('restoreFile')?.addEventListener('change', (event) => selectFile(event.target.files?.[0], toast, render));
  $('restoreAck')?.addEventListener('change', (event) => { setAcknowledged(event.target.checked); const button = $('restoreVault'), data = restoreSnapshot(); if (button) button.disabled = !(data.valid && data.acknowledged); });
  $('restoreVault')?.addEventListener('click', () => restore(toast));
  $('annualTrackerFile')?.addEventListener('change', (event) => selectTrackerTemplate(event.target.files?.[0], toast, render));
  $('filledAnnualTracker')?.addEventListener('click', () => exportFilledAnnualTracker(toast));
  $('familyXlsx')?.addEventListener('click', () => exportFamilyXlsx(toast));
  $('familyCsv')?.addEventListener('click', () => { const month = getMonth(); download(`Income_Expenses_Quick_${month}_${stamp()}.csv`, familyTrackerCsv(month), 'text/csv'); toast('Quick transactions CSV downloaded'); });
  $('vaultXlsx')?.addEventListener('click', () => exportExpandedVaultWorkbook(toast));
  $('executiveMd')?.addEventListener('click', () => { const month = getMonth(); download(`Gringotts_Executive_Summary_${month}_${stamp()}.md`, executiveMarkdown(month), 'text/markdown'); });
  $('copyExecutive')?.addEventListener('click', async () => { await navigator.clipboard.writeText(executiveSummary(getMonth())); toast('Executive summary copied'); });
  $('meetingMd')?.addEventListener('click', () => { const month = getMonth(); download(`Gringotts_Family_Meeting_Pack_${month}_${stamp()}.md`, meetingMarkdown(month), 'text/markdown'); });
  $('printReports')?.addEventListener('click', () => window.print());
  $('exportBackup')?.addEventListener('click', downloadBackup);
  $('exportRules')?.addEventListener('click', () => downloadJson(`Gringotts_v106_rules_review_${stamp()}.json`, reviewPackage()));
  $('exportIcs')?.addEventListener('click', () => download(`Gringotts_v106_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('exportDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v106_diagnostics_${stamp()}.json`, debugReport()));
  $('copyDebug')?.addEventListener('click', async () => { await navigator.clipboard.writeText(JSON.stringify(debugReport(), null, 2)); toast('Diagnostics copied'); });
  $('downloadDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v106_diagnostics_${stamp()}.json`, debugReport()));
}

async function renderView() {
  if (active === 'dashboard') return dashboardView();
  if (active === 'money') return moneyView(moneySection);
  if (active === 'calendar') return calendarView(selectedCalendarDate || `${getMonth()}-01`);
  if (active === 'reports') return reportsView();
  if (active === 'activity') return activityView(activitySection, search);
  if (active === 'tools') return toolsView(toolsSection);
  return dashboardView();
}

async function render() {
  document.title = 'Gringotts Budget Vault v106';
  document.body.innerHTML = shell();
  const main = $('main');
  main.innerHTML = await renderView();
  if (active === 'tools' && toolsSection === 'diagnostics') $('diagnosticsMount').innerHTML = await diagnosticsView();
  bindNavigation();
  bindMonth();
  bindBudgetAndRecurring();
  bindCalendar();
  bindExistingActions();
}

window.GringottsCleanRuntime = {
  BUILD,
  backup: downloadBackup,
  debugReport,
  previewVaultObject,
  reports: { executiveSummary, workbookSheets, xlsxBlob, familyTrackerCsv, trackerTemplateSnapshot },
  month: { get: getMonth, set: setMonthValue, shift: shiftMonth }
};

render();
