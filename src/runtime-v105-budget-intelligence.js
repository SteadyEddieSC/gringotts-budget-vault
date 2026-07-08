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
import {
  exportExpandedVaultWorkbook, removeBudget, saveBudget, setRecurringStatus
} from './v105/intelligence.js';
import {
  dashboardView, intelligenceView, ledgerView, planningView, reportsView
} from './v105/views.js';
import {
  calendarView, diagnosticsView, exportsView, importView, roadmapView, rulesView
} from './v105/views-admin.js';

Object.assign(BUILD, {
  version: 'v105',
  name: 'Bills, Recurring & Budget Intelligence',
  runtime: 'src/runtime-v105-budget-intelligence.js',
  cacheBust: '105budget1'
});

let active = 'dashboard';
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
  downloadJson(`Gringotts_v105_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  toast('Current vault backup downloaded');
  return true;
}

function shell() {
  return `<a class="skip-link" href="#main">Skip to content</a>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="crest" aria-hidden="true">G</div><div><h1>Gringotts Budget Vault</h1><p><strong>Mischief Managed. Money Manged</strong> <span class="version-text">${BUILD.version}</span></p></div></div>
      <div class="topbar-actions"><button id="topBackup" class="btn secondary">Download Backup</button></div>
    </header>
    <nav class="tabs" aria-label="Primary">${[
      ['dashboard', 'Dashboard'], ['insights', 'Bills & Budget'], ['reports', 'Reports'],
      ['ledger', 'Ledger'], ['planning', 'Planning'], ['rules', 'Rules'], ['calendar', 'Calendar'],
      ['import', 'Import / Restore'], ['exports', 'Exports'], ['diagnostics', 'Diagnostics'], ['roadmap', 'Roadmap']
    ].map(([id, label]) => `<button class="tab ${active === id ? 'active' : ''}" data-tab="${id}">${label}</button>`).join('')}</nav>
    <main id="main"></main>
  </div><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function installStyles() {
  if ($('gringotts-v105-styles')) return;
  const style = document.createElement('style');
  style.id = 'gringotts-v105-styles';
  style.textContent = `
    .compact{min-height:0}.warning-card{border-color:#a16207;background:linear-gradient(180deg,rgba(95,57,12,.55),rgba(15,23,42,.96))}
    .error-box{border:1px solid #fb7185;background:rgba(127,29,29,.28);color:#fecdd3;border-radius:14px;padding:1rem}
    .ack-row{display:flex!important;grid-template-columns:auto 1fr!important;align-items:flex-start;gap:.75rem;color:var(--text)!important;margin:1rem 0}
    .ack-row input{width:auto;margin-top:.25rem;accent-color:var(--gold)}.muted-note{color:var(--muted)}.restore-button{width:100%;margin-top:.5rem}
    .btn:disabled,input:disabled{opacity:.45;cursor:not-allowed}.button-row .btn{flex:1 1 160px}.version-text{color:var(--muted);font-size:.82rem;font-weight:600;margin-left:.45rem}
    .section-meta{color:var(--muted);font-size:.9rem;padding-top:.2rem}.month-nav{display:grid;grid-template-columns:auto minmax(210px,1fr) auto auto minmax(150px,auto);gap:.7rem;align-items:center;margin-bottom:1rem;padding:.8rem;border:1px solid var(--line);border-radius:18px;background:#0b1220}
    .month-center{position:relative;display:grid!important;gap:.25rem;color:var(--muted)}.month-center span{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}.month-center strong{font-size:1.15rem;color:var(--text)}
    .month-center input{position:absolute;inset:0;width:100%;height:100%;opacity:.001;cursor:pointer}.month-arrow{min-width:48px}.latest-button{white-space:nowrap}.month-status{color:var(--muted);font-size:.88rem;text-align:right}
    .executive-card{margin-bottom:1rem}.executive-text{font-size:1rem;line-height:1.65;color:var(--text)!important}.good-note{border-left-color:var(--green)}.risk-note{border-left-color:var(--red)}
    .report-downloads{margin-bottom:1rem}.report-option{display:grid;align-content:start;gap:.8rem}.report-option>.btn{width:100%}.preferred-report{border-color:#8f741e}.compact-drop{min-height:120px;margin:.2rem 0}
    .template-status{border-left:3px solid var(--green);background:rgba(74,222,128,.08);padding:.7rem .8rem;border-radius:10px;color:var(--muted)}
    .report-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem;margin-top:1rem}.report-metrics span{border:1px solid var(--line);border-radius:14px;background:#0b1220;padding:.8rem;color:var(--muted)}
    .report-metrics strong{display:block;color:var(--text);font-size:1.25rem}.sheet-list{columns:2;line-height:1.75;margin:.4rem 0;padding-left:1.2rem}.printable-report ul{line-height:1.7;padding-left:1.25rem}
    .shipped{border-color:var(--green);margin-bottom:1rem}.screen-only{display:block}.compact-button{padding:.42rem .65rem;font-size:.8rem}.budget-table{min-width:980px}
    .budget-progress{min-width:180px}.budget-track{height:10px;border-radius:999px;background:#111827;overflow:hidden;margin-bottom:.3rem}.budget-fill{display:block;height:100%;background:var(--green);border-radius:999px}.budget-fill.over{background:var(--red)}
    .recurring-list{display:grid;gap:.7rem}.recurring-item{display:grid;grid-template-columns:minmax(0,1.4fr) auto minmax(220px,auto);gap:.8rem;align-items:center;border-bottom:1px solid rgba(148,163,184,.14);padding:.6rem 0}
    .recurring-item.excluded{opacity:.55}.recurring-meta,.recurring-amount small{color:var(--muted);font-size:.82rem}.recurring-amount{text-align:right}.recurring-actions{display:flex;gap:.35rem;align-items:center;justify-content:flex-end;flex-wrap:wrap}.status-text{color:var(--muted);font-size:.78rem;text-transform:capitalize;margin-right:.25rem}
    .trend-grid{display:grid;grid-template-columns:repeat(6,minmax(70px,1fr));gap:.8rem;align-items:end;min-height:250px}.trend-column{display:grid;grid-template-rows:auto 170px auto;gap:.45rem;text-align:center}.trend-value{font-size:.78rem;color:var(--muted)}
    .trend-track{height:170px;background:#0b1220;border:1px solid var(--line);border-radius:12px;display:flex;align-items:flex-end;overflow:hidden}.trend-track span{display:block;width:100%;background:linear-gradient(180deg,var(--gold),#a16207);border-radius:10px 10px 0 0}.trend-label{font-size:.82rem;color:var(--muted)}
    @media(max-width:760px){.month-nav{grid-template-columns:auto minmax(0,1fr) auto}.latest-button,.month-status{grid-column:1/-1}.month-status{text-align:left}.month-center strong{font-size:1rem}.report-metrics{grid-template-columns:1fr 1fr}.sheet-list{columns:1}.recurring-item{grid-template-columns:1fr}.recurring-amount{text-align:left}.recurring-actions{justify-content:flex-start}.trend-grid{overflow:auto;grid-template-columns:repeat(6,minmax(100px,1fr))}}
    @media print{body{background:#fff!important;color:#111!important}.topbar,.tabs,.screen-only,.toast{display:none!important}.app-shell{width:100%;padding:0}.section{display:none!important}.report-center{display:block!important}.card{box-shadow:none!important;background:#fff!important;color:#111!important;border-color:#bbb!important;break-inside:avoid}.card p,.card li,.executive-text{color:#111!important}.printable-report{display:grid!important}.month-nav{display:none!important}}
  `;
  document.head.appendChild(style);
}

function addBill() {
  const data = cashflow();
  const name = $('billName').value.trim();
  const date = $('billDate').value;
  if (!name || !date) { toast('Bill name and date are required'); return; }
  data.bills.unshift({ id: uid('b'), name, amount: Number($('billAmount').value) || 0, dueDate: date });
  saveCashflow(data);
  render();
}

function addPayday() {
  const data = cashflow();
  const name = $('payName').value.trim();
  const date = $('payDate').value;
  if (!name || !date) { toast('Payday name and date are required'); return; }
  data.paydays.unshift({ id: uid('p'), name, amount: Number($('payAmount').value) || 0, date });
  saveCashflow(data);
  render();
}

function addRule() {
  const find = $('findText').value.trim();
  const to = $('toText').value.trim();
  const label = $('labelText').value.trim();
  const scope = $('scopeText').value;
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

function setMonth(value) { if (setMonthValue(value)) render(); }

function bindMonth() {
  $('monthPrev')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), -1)));
  $('monthNext')?.addEventListener('click', () => setMonth(shiftMonth(getMonth(), 1)));
  $('monthLatest')?.addEventListener('click', () => { const available = months(); setMonth(available.at(-1) || new Date().toISOString().slice(0, 7)); });
  $('monthPicker')?.addEventListener('change', (event) => setMonth(event.target.value));
  $('monthPicker')?.addEventListener('pointerdown', (event) => { if (typeof event.currentTarget.showPicker === 'function') try { event.currentTarget.showPicker(); } catch {} });
}

function bindCommon() {
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { active = button.dataset.tab; render(); }));
  $('topBackup')?.addEventListener('click', downloadBackup);
}

function bindIntelligence() {
  $('saveBudget')?.addEventListener('click', () => {
    if (!saveBudget($('budgetCategory').value, $('budgetAmount').value)) { toast('Enter a category and a valid non-negative budget'); return; }
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

function bindView() {
  bindMonth();
  bindIntelligence();
  $('openImport')?.addEventListener('click', () => { active = 'import'; render(); });
  $('openReports')?.addEventListener('click', () => { active = 'reports'; render(); });
  $('exportsReports')?.addEventListener('click', () => { active = 'reports'; render(); });
  $('dashboardBackup')?.addEventListener('click', downloadBackup);
  $('q')?.addEventListener('input', (event) => { search = event.target.value; render(); });
  $('addBill')?.addEventListener('click', addBill);
  $('addPay')?.addEventListener('click', addPayday);
  $('addRule')?.addEventListener('click', addRule);
  document.querySelectorAll('[data-up]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.up, 'up')));
  document.querySelectorAll('[data-down]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.down, 'down')));
  document.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.toggle, 'toggle')));
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => mutateRule(button.dataset.del, 'delete')));
  $('exportReview')?.addEventListener('click', () => downloadJson(`Gringotts_v105_rules_review_${stamp()}.json`, reviewPackage()));
  $('backupRules')?.addEventListener('click', downloadBackup);
  $('downloadIcs')?.addEventListener('click', () => download(`Gringotts_v105_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('copyIcs')?.addEventListener('click', async () => { await navigator.clipboard.writeText(ics()); toast('ICS copied'); });
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
  $('exportRules')?.addEventListener('click', () => downloadJson(`Gringotts_v105_rules_review_${stamp()}.json`, reviewPackage()));
  $('exportIcs')?.addEventListener('click', () => download(`Gringotts_v105_calendar_${stamp()}.ics`, ics(), 'text/calendar'));
  $('exportDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v105_diagnostics_${stamp()}.json`, debugReport()));
  $('copyDebug')?.addEventListener('click', async () => { await navigator.clipboard.writeText(JSON.stringify(debugReport(), null, 2)); toast('Diagnostics copied'); });
  $('downloadDebug')?.addEventListener('click', () => downloadJson(`Gringotts_v105_diagnostics_${stamp()}.json`, debugReport()));
}

function view() {
  if (active === 'dashboard') return dashboardView();
  if (active === 'insights') return intelligenceView();
  if (active === 'reports') return reportsView();
  if (active === 'ledger') return ledgerView(search);
  if (active === 'planning') return planningView();
  if (active === 'rules') return rulesView();
  if (active === 'calendar') return calendarView();
  if (active === 'import') return importView();
  if (active === 'exports') return exportsView();
  if (active === 'roadmap') return roadmapView();
  return '';
}

async function render() {
  installStyles();
  document.title = 'Gringotts Budget Vault v105';
  document.body.innerHTML = shell();
  const main = $('main');
  main.innerHTML = active === 'diagnostics' ? await diagnosticsView() : view();
  bindCommon();
  bindView();
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
