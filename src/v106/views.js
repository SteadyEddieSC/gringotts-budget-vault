import {
  BUILD, account, best, category, esc, flow, getMonth, money,
  reportAmount, serviceWorkerStatus, shellProof, txName, vaults
} from '../v103/core.js';
import { dashboardView as baseDashboard, ledgerView, monthNavigator, planningView } from '../v104/views-main.js';
import { importView, exportsView, rulesView } from '../v104/views-admin.js';
import { intelligenceView, reportsView } from '../v105/views.js';
import { calendarAccessibleLabel, calendarModel, calendarSummary, dayDetails } from './calendar.js';

function concise(html, replacements = []) {
  return replacements.reduce((output, [from, to]) => output.replace(from, to), html);
}

export function dashboardView() {
  return concise(baseDashboard(), [
    ['<p>Dashboard analysis and reports use one shared month.</p>', '<p>Your selected month at a glance.</p>'],
    ['<h3>Safe restore status</h3><p>Import files stay in this browser. A populated transaction array, preview, acknowledgment, and explicit confirmation are still required before restore.</p>', '<h3>Data safety</h3><p>Imports remain local and restores require validation and confirmation.</p>'],
    ['<div class="button-row"><button class="btn primary" id="openImport">Open Import / Restore</button><button class="btn secondary" id="dashboardBackup">Download Backup</button></div>', '<div class="button-row"><button class="btn primary" id="openImport">Open Import / Restore</button></div>']
  ]);
}

export function moneyView(section = 'budget') {
  const content = section === 'planning' ? planningView() : intelligenceView();
  return `<div class="workspace"><div class="subnav" role="tablist" aria-label="Money sections">
    <button class="subtab ${section === 'budget' ? 'active' : ''}" data-money-section="budget">Budget & Recurring</button>
    <button class="subtab ${section === 'planning' ? 'active' : ''}" data-money-section="planning">Bills & Paydays</button>
  </div>${content}</div>`;
}

function eventLines(day) {
  const lines = [];
  day.paydays.forEach((event) => lines.push(`<span class="calendar-event payday-event">Payday ${money(event.amount)}</span>`));
  day.bills.forEach((event) => lines.push(`<span class="calendar-event bill-event">Bill ${money(event.amount)}</span>`));
  if (day.transactions.length) lines.push(`<span class="calendar-event transaction-event">${day.transactions.length} transaction${day.transactions.length === 1 ? '' : 's'}</span>`);
  return lines.join('');
}

export function calendarView(selectedDate = '') {
  const month = getMonth();
  const model = calendarModel(month);
  const summary = calendarSummary(month);
  const date = selectedDate && selectedDate.startsWith(month) ? selectedDate : `${month}-01`;
  const details = dayDetails(date, month);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `<section class="section active calendar-page">
    <div class="section-title-row"><div><h2>Calendar & Cash Flow</h2><p>Bills, paydays, and transaction activity organized by day.</p></div><div class="section-meta">${esc(model.label)}</div></div>
    ${monthNavigator()}
    <div class="kpi-grid calendar-kpis">
      <article class="kpi"><strong>${money(summary.bills)}</strong><span>Scheduled bills</span></article>
      <article class="kpi"><strong>${money(summary.paydays)}</strong><span>Scheduled paydays</span></article>
      <article class="kpi"><strong>${money(summary.scheduledNet)}</strong><span>Scheduled net</span></article>
      <article class="kpi"><strong>${summary.pressureDays}</strong><span>Pressure days</span></article>
    </div>
    <div class="calendar-layout">
      <article class="card calendar-card">
        <div class="calendar-weekdays">${weekdays.map((day) => `<span>${day}</span>`).join('')}</div>
        <div class="calendar-grid">${model.days.map((day) => day.empty
          ? '<div class="calendar-day empty" aria-hidden="true"></div>'
          : `<button class="calendar-day ${day.date === date ? 'selected' : ''}" data-calendar-day="${day.date}" aria-label="${esc(calendarAccessibleLabel(day))}"><strong>${day.day}</strong>${eventLines(day)}${day.spending ? `<small>${money(day.spending)} spent</small>` : ''}</button>`).join('')}</div>
      </article>
      <aside class="card day-detail">
        <div class="section-title-row"><div><h3>${esc(new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }))}</h3><p>Selected-day detail</p></div></div>
        <div class="day-summary"><span><strong>${money(details.income)}</strong> income</span><span><strong>${money(details.spending)}</strong> spending</span><span><strong>${money(details.scheduledNet)}</strong> scheduled net</span></div>
        <div class="day-events">${details.paydays.map((event) => `<div class="day-row"><span><strong>Payday</strong><br>${esc(event.title)}</span><strong class="amount-income">${money(event.amount)}</strong></div>`).join('')}${details.bills.map((event) => `<div class="day-row"><span><strong>Bill</strong><br>${esc(event.title)}</span><strong class="amount-outflow">${money(event.amount)}</strong></div>`).join('')}${details.transactionRows.slice(0, 20).map((transaction) => `<div class="day-row"><span><strong>${esc(txName(transaction))}</strong><br>${esc(category(transaction))}${account(transaction) ? ` · ${esc(account(transaction))}` : ''}</span><strong class="${flow(transaction) === 'Income' ? 'amount-income' : 'amount-outflow'}">${money(reportAmount(transaction))}</strong></div>`).join('') || '<p>No activity is stored for this day.</p>'}</div>
      </aside>
    </div>
    <div class="grid two calendar-lower">
      <article class="card"><h3>Cash-flow pressure</h3><p>These warnings use scheduled bills and paydays only. They do not include an opening account balance.</p><div class="list">${model.pressureDays.slice(0, 12).map((day) => `<div class="list-item"><span><strong>${esc(day.date)}</strong><br><small>Bills ${money(day.bills)} · Paydays ${money(day.paydays)}</small></span><strong class="amount-outflow">${money(day.net)}</strong></div>`).join('') || '<p>No scheduled pressure days were identified.</p>'}</div></article>
      <article class="card"><h3>Calendar actions</h3><p>Add or change bills and paydays in Money → Bills & Paydays. Calendar exports include those saved dates.</p><div class="button-row"><button id="calendarPlanning" class="btn primary">Manage Bills & Paydays</button><button id="downloadIcs" class="btn secondary">Download ICS</button><button id="copyIcs" class="btn secondary">Copy ICS</button></div></article>
    </div>
  </section>`;
}

export function activityView(section = 'ledger', search = '') {
  const content = section === 'rules' ? rulesView() : ledgerView(search);
  return `<div class="workspace"><div class="subnav" role="tablist" aria-label="Activity sections">
    <button class="subtab ${section === 'ledger' ? 'active' : ''}" data-activity-section="ledger">Transactions</button>
    <button class="subtab ${section === 'rules' ? 'active' : ''}" data-activity-section="rules">Rules</button>
  </div>${content}</div>`;
}

export async function diagnosticsView() {
  const status = await serviceWorkerStatus();
  const candidate = best();
  return `<section class="section active"><div class="section-title-row"><div><h2>Diagnostics</h2><p>Runtime, vault selection, and local-only checks.</p></div><div class="section-meta">${shellProof().ok ? 'Runtime verified' : 'Runtime check needed'}</div></div><article class="card"><div class="summary-box compact">Release: ${esc(BUILD.version + ' ' + BUILD.name)}\nLoaded runtime: ${esc(BUILD.runtime)}\nRuntime match: ${shellProof().ok ? 'yes' : 'no'}\nBest vault: ${esc(candidate?.key || 'none')}\nTransactions: ${candidate?.transactions || 0}\nVault candidates: ${vaults().length}\nRestore destination: ${esc(BUILD.storageKey)}\nService worker registrations: ${status.registrations}\nService worker controller: ${status.controller ? 'yes' : 'no'}\nPrivacy: local browser storage only</div><div class="button-row"><button id="copyDebug" class="btn secondary">Copy diagnostics</button><button id="downloadDebug" class="btn secondary">Download diagnostics</button></div></article></section>`;
}

export function toolsView(section = 'import') {
  const map = {
    import: importView,
    exports: exportsView,
    roadmap: roadmapView
  };
  const content = section === 'diagnostics' ? '<div id="diagnosticsMount"></div>' : (map[section] || map.import)();
  return `<div class="workspace"><div class="subnav tools-subnav" role="tablist" aria-label="Tools sections">
    <button class="subtab ${section === 'import' ? 'active' : ''}" data-tools-section="import">Import / Restore</button>
    <button class="subtab ${section === 'exports' ? 'active' : ''}" data-tools-section="exports">Exports & Backup</button>
    <button class="subtab ${section === 'diagnostics' ? 'active' : ''}" data-tools-section="diagnostics">Diagnostics</button>
    <button class="subtab ${section === 'roadmap' ? 'active' : ''}" data-tools-section="roadmap">Roadmap</button>
  </div>${content}</div>`;
}

export function roadmapView() {
  const roadmap = [
    ['v107', 'Review Queue II', 'mobile-first transaction review, guarded edits, and safe batch actions'],
    ['v108', 'Goals & Vault Health', 'goals, sinking funds, score history, and actionable recommendations'],
    ['v109', 'Import Memory & Duplicate Guard', 'duplicate protection, import history, and coverage-gap warnings'],
    ['v110', 'Month Close & Forecasting', 'reconciliation, close snapshots, forecasting, debt, and promotional APR planning'],
    ['v116', 'Planned UI Architecture Review', 'scheduled navigation, content, accessibility, and responsive-design overhaul; earlier if complexity thresholds are reached']
  ];
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Feature releases include a UI quality check; larger architecture reviews occur about every 10 releases.</p></div><div class="section-meta">Next: v107</div></div><article class="roadmap-item shipped"><h3>v106 — Calendar, Cash Flow & UI Consolidation</h3><p>Six primary destinations, responsive menu behavior, contextual backup placement, concise page copy, full calendar detail, and cash-flow pressure warnings.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}
