import { esc, getMonth, money, monthLabel } from '../v103/core.js';
import { exportsView } from '../v104/views-admin.js';
import { intelligenceView } from '../v105/views.js';
import { compactMonthNavigator } from '../v107/views.js';
import { goalsView } from '../v108/views.js';
import {
  activityView, calendarView, dashboardView, diagnosticsView, importView,
  reportsView as baseReportsView
} from '../v109/views.js';
import {
  cashForecast, closeReadiness, debtAnalysis, debtPlan,
  expandedWorkbookSheetsV110, forecastSettings, monthCloseStatus, planningEvents,
  reconciliationsForMonth
} from './planning.js';

export { activityView, calendarView, dashboardView, diagnosticsView, importView };

const frequencyLabel = (value) => ({ once: 'One time', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }[value] || 'One time');

function frequencyOptions(current = 'once') {
  return [['once', 'One time'], ['weekly', 'Weekly'], ['biweekly', 'Every 2 weeks'], ['monthly', 'Monthly']]
    .map(([value, label]) => `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`).join('');
}

export function planningView() {
  const events = planningEvents();
  const bills = events.filter((event) => event.type === 'bill');
  const paydays = events.filter((event) => event.type === 'payday');
  return `<section class="section active planning-page">
    <div class="section-title-row"><div><h2>Bills & Paydays</h2><p>Save planned cash dates locally and choose whether each item happens once or repeats.</p></div><div class="section-meta">${events.length} planned items</div></div>
    <div class="grid two">
      <article class="card"><h3>Add bill</h3><p>Bills reduce the forecast balance on each scheduled date.</p><label>Name<input id="billName" placeholder="Mortgage, utility, insurance"></label><div class="grid two"><label>Amount<input id="billAmount" type="number" min="0" step="0.01" placeholder="0.00"></label><label>First due date<input id="billDate" type="date"></label></div><div class="grid two"><label>Frequency<select id="billFrequency">${frequencyOptions()}</select></label><label>Account, optional<input id="billAccount" placeholder="Checking"></label></div><button id="addBill" class="btn primary">Add Bill</button></article>
      <article class="card"><h3>Add payday</h3><p>Paydays increase the forecast balance on each scheduled date.</p><label>Name<input id="payName" placeholder="Primary paycheck, VA payment"></label><div class="grid two"><label>Amount<input id="payAmount" type="number" min="0" step="0.01" placeholder="0.00"></label><label>First deposit date<input id="payDate" type="date"></label></div><div class="grid two"><label>Frequency<select id="payFrequency">${frequencyOptions()}</select></label><label>Account, optional<input id="payAccount" placeholder="Checking"></label></div><button id="addPay" class="btn primary">Add Payday</button></article>
    </div>
    <div class="grid two">
      <article class="card"><div class="section-title-row"><div><h3>Saved bills</h3><p>Only dates inside the forecast horizon affect the forecast.</p></div><div class="section-meta">${bills.length}</div></div><div class="list planning-event-list">${bills.map((event) => `<div class="list-item planning-event"><span><strong>${esc(event.name)}</strong><br><small>${esc(event.date)} · ${esc(frequencyLabel(event.frequency))}${event.account ? ` · ${esc(event.account)}` : ''}</small></span><span><strong>${money(event.amount)}</strong><button class="btn secondary small-button" data-delete-planning="bill" data-planning-id="${esc(event.id)}">Delete</button></span></div>`).join('') || '<p>No bills saved.</p>'}</div></article>
      <article class="card"><div class="section-title-row"><div><h3>Saved paydays</h3><p>Recurring dates are projected without altering transactions.</p></div><div class="section-meta">${paydays.length}</div></div><div class="list planning-event-list">${paydays.map((event) => `<div class="list-item planning-event"><span><strong>${esc(event.name)}</strong><br><small>${esc(event.date)} · ${esc(frequencyLabel(event.frequency))}${event.account ? ` · ${esc(event.account)}` : ''}</small></span><span><strong>${money(event.amount)}</strong><button class="btn secondary small-button" data-delete-planning="payday" data-planning-id="${esc(event.id)}">Delete</button></span></div>`).join('') || '<p>No paydays saved.</p>'}</div></article>
    </div>
  </section>`;
}

function reconciliationCard(summary, reconciliation, closed) {
  const countVariance = reconciliation?.countVariance ?? 0;
  const amountVariance = reconciliation?.amountVariance ?? 0;
  const statusText = !reconciliation ? 'Not reconciled'
    : reconciliation.status === 'matched' ? 'Matched'
      : reconciliation.status === 'accepted-difference' ? 'Accepted difference'
        : 'Difference remains';
  const statusClass = reconciliation?.status === 'matched' ? 'good-note' : reconciliation?.status === 'accepted-difference' ? 'warning-note' : 'risk-note';
  return `<article class="card reconciliation-card" data-reconcile-account="${esc(summary.account)}" data-ledger-count="${summary.postedCount}" data-ledger-net="${summary.signedNet}">
    <div class="section-title-row"><div><h4>${esc(summary.account)}</h4><p>${summary.postedCount} posted · ${summary.pendingCount} pending · coverage ${esc(summary.earliest || 'none')} to ${esc(summary.latest || 'none')}</p></div><div class="section-meta">${esc(statusText)}</div></div>
    <div class="grid two"><div class="summary-box compact">Vault posted count: ${summary.postedCount}\nVault signed activity: ${money(summary.signedNet)}\nInflows: ${money(summary.inflows)}\nOutflows: ${money(summary.outflows)}\nTransfers: ${money(summary.transfers)}</div><div><label>Statement posted count<input class="statement-count" type="number" min="0" step="1" value="${reconciliation?.statementCount ?? summary.postedCount}" ${closed ? 'disabled' : ''}></label><label>Statement signed activity<input class="statement-net" type="number" step="0.01" value="${reconciliation?.statementNet ?? summary.signedNet}" ${closed ? 'disabled' : ''}></label></div></div>
    <p class="muted-note">Signed activity follows the vault convention: money out is positive; deposits and credits are negative. Compare the statement period covering this month.</p>
    <label class="ack-row"><input class="accept-difference" type="checkbox" ${reconciliation?.acceptDifference ? 'checked' : ''} ${closed ? 'disabled' : ''}><span>Accept an explained difference for this close revision.</span></label>
    <label>Reconciliation notes<textarea class="reconcile-notes" rows="2" ${closed ? 'disabled' : ''}>${esc(reconciliation?.notes || '')}</textarea></label>
    ${reconciliation ? `<div class="note ${statusClass}">Count variance: ${countVariance}. Amount variance: ${money(amountVariance)}. Saved ${esc(new Date(reconciliation.savedAt).toLocaleString())}.</div>` : ''}
    <button class="btn secondary" data-save-reconciliation="${esc(summary.account)}" ${closed ? 'disabled' : ''}>Save Reconciliation</button>
  </article>`;
}

function monthCloseView() {
  const month = getMonth();
  const readiness = closeReadiness(month);
  const status = monthCloseStatus(month);
  const reconciliations = reconciliationsForMonth(month);
  const currentClose = status.closed ? status.latest : null;
  return `<section class="close-section" aria-labelledby="monthCloseHeading">
    <article class="card close-overview ${status.closed ? 'closed-month' : ''}"><div class="section-title-row"><div><h3 id="monthCloseHeading">Month close — ${esc(monthLabel(month))}</h3><p>Create an immutable summary only after posted transactions and statement checks are ready.</p></div><div class="section-meta">${status.closed ? `Closed · revision ${currentClose.revision}` : readiness.ready ? 'Ready to close' : 'Open'}</div></div>
      <div class="close-summary-grid"><div><strong>${readiness.metrics.count}</strong><span>Transactions</span></div><div><strong>${money(readiness.metrics.income)}</strong><span>Income</span></div><div><strong>${money(readiness.metrics.spend)}</strong><span>Spending</span></div><div><strong>${money(readiness.metrics.net)}</strong><span>Net</span></div></div>
      ${status.closed ? `<div class="note ${status.drifted ? 'risk-note' : 'good-note'}">Closed ${esc(new Date(currentClose.capturedAt).toLocaleString())}. ${status.drifted ? 'Transactions changed after close; reopen and reconcile before creating a new revision.' : 'The current transaction signature still matches the close snapshot.'}</div><div class="summary-box compact">Close signature: ${esc(currentClose.snapshot.transactionSignature)}\nCurrent signature: ${esc(status.currentSignature)}\nClose note: ${esc(currentClose.snapshot.note || 'None')}</div><label>Reason to reopen<textarea id="reopenReason" rows="2" placeholder="Explain why the closed month must change"></textarea></label><button id="reopenMonth" class="btn danger">Reopen Month</button>` : `<div class="grid two"><div><h4>Close blockers</h4><div class="notes">${readiness.blockers.map((item) => `<div class="note risk-note">${esc(item)}</div>`).join('') || '<div class="note good-note">No close blockers remain.</div>'}</div></div><div><h4>Close warnings</h4><div class="notes">${readiness.warnings.map((item) => `<div class="note warning-note">${esc(item)}</div>`).join('') || '<div class="note good-note">No explained differences are carried into close.</div>'}</div></div></div><label>Close note<textarea id="closeNote" rows="2" placeholder="Optional family or reconciliation note"></textarea></label><button id="closeMonth" class="btn primary" ${readiness.ready ? '' : 'disabled'}>Close ${esc(monthLabel(month))}</button>`}
    </article>
    <div class="section-title-row subsection-heading"><div><h3>Statement reconciliation</h3><p>Save one result for every account represented in the selected month. Pending transactions and unexplained differences block close.</p></div><div class="section-meta">${readiness.accounts.length} accounts</div></div>
    <div class="reconciliation-grid">${readiness.accounts.map((summary) => reconciliationCard(summary, reconciliations[summary.account], status.closed)).join('') || '<article class="card"><p>No account-level transactions are available for this month.</p></article>'}</div>
    <article class="card"><h3>Close and reopen history</h3><p>Close snapshots are retained as revisions. Reopening appends a separate audit event instead of deleting or rewriting the prior close.</p><div class="table-wrap"><table class="ledger"><thead><tr><th>Event</th><th>Captured</th><th>Revision</th><th>Reason / note</th><th>Signature</th></tr></thead><tbody>${status.events.slice().reverse().map((event) => `<tr><td>${esc(event.type)}</td><td>${esc(new Date(event.capturedAt).toLocaleString())}</td><td>${event.revision || event.targetRevision || ''}</td><td>${esc(event.reason || event.snapshot?.note || '')}</td><td>${esc(event.snapshot?.transactionSignature || '')}</td></tr>`).join('') || '<tr><td colspan="5">No close activity for this month.</td></tr>'}</tbody></table></div></article>
  </section>`;
}

function forecastView() {
  const settings = forecastSettings();
  const forecast = cashForecast(settings);
  return `<section class="forecast-section" aria-labelledby="forecastHeading">
    <article class="card"><div class="section-title-row"><div><h3 id="forecastHeading">Cash-flow forecast</h3><p>Project scheduled bills, paydays, and a user-set flexible-spending estimate. This does not predict unscheduled income or purchases.</p></div><div class="section-meta">${settings.horizonDays} days</div></div>
      <div class="grid two"><label>Forecast start<input id="forecastAsOf" type="date" value="${esc(settings.asOfDate)}"></label><label>Starting available cash<input id="forecastStartingCash" type="number" step="0.01" value="${settings.startingCash}"></label><label>Minimum cash buffer<input id="forecastMinimumBuffer" type="number" min="0" step="0.01" value="${settings.minimumBuffer}"></label><label>Flexible spending per month<input id="forecastFlexibleSpend" type="number" min="0" step="0.01" value="${settings.flexibleMonthlySpend}"></label></div><label>Forecast horizon<select id="forecastHorizon">${[30, 60, 90].map((days) => `<option value="${days}" ${settings.horizonDays === days ? 'selected' : ''}>${days} days</option>`).join('')}</select></label><button id="saveForecastSettings" class="btn primary">Save Forecast Settings</button>
    </article>
    <div class="kpi-grid forecast-kpis"><article class="kpi"><strong>${money(forecast.endingBalance)}</strong><span>Projected ending cash</span></article><article class="kpi"><strong>${money(forecast.lowBalance)}</strong><span>Lowest projected cash</span></article><article class="kpi"><strong>${forecast.pressureDays.length}</strong><span>Days below buffer</span></article><article class="kpi"><strong>${forecast.negativeDays.length}</strong><span>Negative-balance days</span></article></div>
    <div class="grid two"><article class="card"><h3>Monthly forecast</h3><div class="table-wrap"><table class="ledger forecast-table"><thead><tr><th>Month</th><th>Paydays</th><th>Bills</th><th>Flexible</th><th>Ending cash</th></tr></thead><tbody>${forecast.monthly.map((item) => `<tr><td>${esc(item.month)}</td><td>${money(item.income)}</td><td>${money(item.bills)}</td><td>${money(item.flexible)}</td><td>${money(item.endBalance)}</td></tr>`).join('')}</tbody></table></div></article><article class="card"><h3>Pressure outlook</h3><div class="notes">${forecast.negativeDays.length ? `<div class="note risk-note">The forecast first falls below zero on ${esc(forecast.negativeDays[0].date)} at ${money(forecast.negativeDays[0].balance)}.</div>` : '<div class="note good-note">No negative-balance day appears in the selected horizon.</div>'}${forecast.pressureDays.length ? `<div class="note warning-note">The first day below the ${money(settings.minimumBuffer)} buffer is ${esc(forecast.pressureDays[0].date)}.</div>` : '<div class="note good-note">The selected minimum buffer is maintained throughout the forecast.</div>'}<div class="note">Lowest point: ${esc(forecast.lowDate)} at ${money(forecast.lowBalance)}.</div></div></article></div>
    <article class="card"><div class="section-title-row"><div><h3>Scheduled occurrences</h3><p>Generated from saved one-time and repeating bills and paydays.</p></div><div class="section-meta">${forecast.occurrences.length}</div></div><div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Frequency</th><th>Amount</th></tr></thead><tbody>${forecast.occurrences.slice(0, 100).map((event) => `<tr><td>${esc(event.occurrenceDate)}</td><td>${esc(event.type)}</td><td>${esc(event.name)}</td><td>${esc(frequencyLabel(event.frequency))}</td><td>${money(event.amount)}</td></tr>`).join('') || '<tr><td colspan="5">No saved event falls inside this forecast horizon.</td></tr>'}</tbody></table></div></article>
  </section>`;
}

function debtView(editDebtId = '') {
  const stored = debtPlan();
  const analysis = debtAnalysis();
  const editing = stored.debts.find((debt) => debt.id === editDebtId) || null;
  return `<section class="debt-section" aria-labelledby="debtHeading">
    <div class="section-title-row"><div><h3 id="debtHeading">Debt and promotional APR plan</h3><p>Track planning assumptions separately from transactions. Estimates do not include new charges, compounding details, or lender-specific rules.</p></div><div class="section-meta">${analysis.debts.length} debts</div></div>
    <div class="kpi-grid debt-kpis"><article class="kpi"><strong>${money(analysis.totalBalance)}</strong><span>Total planned balance</span></article><article class="kpi"><strong>${money(analysis.minimumPayments)}</strong><span>Monthly minimums</span></article><article class="kpi"><strong>${money(analysis.estimatedMonthlyInterest)}</strong><span>Estimated monthly interest</span></article><article class="kpi"><strong>${analysis.promoExpiring}</strong><span>Promos within 6 months</span></article></div>
    <div class="grid two"><article class="card"><h3>${editing ? 'Edit debt plan' : 'Add debt plan'}</h3><input id="debtId" type="hidden" value="${esc(editing?.id || '')}"><label>Name<input id="debtName" value="${esc(editing?.name || '')}" placeholder="Credit card, truck, personal loan"></label><div class="grid two"><label>Current balance<input id="debtBalance" type="number" min="0" step="0.01" value="${editing?.balance ?? ''}"></label><label>Standard APR %<input id="debtApr" type="number" min="0" step="0.01" value="${editing?.apr ?? ''}"></label><label>Minimum payment<input id="debtMinimum" type="number" min="0" step="0.01" value="${editing?.minimumPayment ?? ''}"></label><label>Target payment<input id="debtTarget" type="number" min="0" step="0.01" value="${editing?.targetPayment ?? ''}"></label><label>Promotional APR %, optional<input id="debtPromoApr" type="number" min="0" step="0.01" value="${editing?.promoApr ?? ''}"></label><label>Promo end date<input id="debtPromoEnd" type="date" value="${esc(editing?.promoEnd || '')}"></label></div><label>Notes<textarea id="debtNotes" rows="2">${esc(editing?.notes || '')}</textarea></label><div class="button-row"><button id="saveDebt" class="btn primary">${editing ? 'Update Debt' : 'Add Debt'}</button>${editing ? '<button id="cancelDebtEdit" class="btn secondary">Cancel</button>' : ''}</div></article>
      <article class="card"><h3>Extra-payment strategy</h3><p>Extra dollars are shown against the first priority entry; the app does not move money or change transactions.</p><label>Monthly extra debt amount<input id="debtMonthlyExtra" type="number" min="0" step="0.01" value="${analysis.monthlyExtra}"></label><button id="saveDebtExtra" class="btn secondary">Save Extra Amount</button>${analysis.priority[0] ? `<div class="note">Current first priority: <strong>${esc(analysis.priority[0].name)}</strong>. Suggested planned payment: ${money(analysis.priority[0].targetPayment + analysis.monthlyExtra)}.</div>` : '<div class="note">Add a debt entry to calculate a priority order.</div>'}</article></div>
    <div class="debt-grid">${analysis.priority.map((debt, index) => `<article class="card debt-card"><div class="section-title-row"><div><h4>${index + 1}. ${esc(debt.name)}</h4><p>${debt.promoActive ? `${debt.effectiveApr}% promotional APR · ${debt.promoMonths} month${debt.promoMonths === 1 ? '' : 's'} left` : `${debt.effectiveApr}% current APR`}</p></div><strong>${money(debt.balance)}</strong></div><div class="debt-facts"><span>Minimum ${money(debt.minimumPayment)}</span><span>Target ${money(debt.targetPayment)}</span><span>Interest estimate ${money(debt.monthlyInterest)}/mo</span>${debt.promoActive ? `<span>Promo payoff pace ${money(debt.promoPayoffNeeded)}/mo</span>` : ''}</div>${debt.promoGap > 0 ? `<div class="note risk-note">Target payment is ${money(debt.promoGap)} below the simple payoff pace before the promotional end date.</div>` : ''}<div class="goal-contribution"><input type="number" min="0" step="0.01" placeholder="Record payment" data-debt-payment-input="${esc(debt.id)}"><button class="btn secondary" data-debt-payment="${esc(debt.id)}">Apply</button></div><div class="button-row"><button class="btn secondary" data-debt-edit="${esc(debt.id)}">Edit</button><button class="btn secondary" data-debt-delete="${esc(debt.id)}">Delete</button></div></article>`).join('') || '<article class="card"><p>No debt planning entries yet.</p></article>'}</div>
  </section>`;
}

export function closeForecastView(editDebtId = '') {
  const month = getMonth();
  return `<section class="section active close-forecast-page"><div class="section-title-row"><div><h2>Close & Forecast</h2><p>Reconcile and close the selected month, then plan near-term cash and debt without changing transaction history.</p></div><div class="section-meta">${esc(monthLabel(month))}</div></div>${compactMonthNavigator()}${monthCloseView()}${forecastView()}${debtView(editDebtId)}</section>`;
}

export function moneyView(section = 'budget', editGoalId = '', editDebtId = '') {
  const content = section === 'planning' ? planningView()
    : section === 'goals' ? goalsView(editGoalId)
      : section === 'close' ? closeForecastView(editDebtId)
        : intelligenceView();
  const rendered = section === 'goals' || section === 'close' ? content : String(content).replace(/<div class="month-nav"[\s\S]*?<\/div>/, compactMonthNavigator());
  return `<div class="workspace"><div class="subnav money-subnav" role="tablist" aria-label="Money sections"><button class="subtab ${section === 'budget' ? 'active' : ''}" data-money-section="budget">Budget & Recurring</button><button class="subtab ${section === 'planning' ? 'active' : ''}" data-money-section="planning">Bills & Paydays</button><button class="subtab ${section === 'goals' ? 'active' : ''}" data-money-section="goals">Goals & Health</button><button class="subtab ${section === 'close' ? 'active' : ''}" data-money-section="close">Close & Forecast</button></div>${rendered}</div>`;
}

export function reportsView() {
  let html = baseReportsView();
  html = html.replaceAll('20-sheet', '24-sheet').replaceAll('Expanded 20-sheet workbook', 'Expanded 24-sheet workbook');
  const marker = '<h3>Vault workbook contents</h3><ul class="sheet-list">';
  const start = html.indexOf(marker);
  if (start >= 0) {
    const close = html.indexOf('</ul>', start);
    if (close >= 0 && !html.slice(start, close).includes('<li>Month Close</li>')) {
      const names = expandedWorkbookSheetsV110(getMonth()).slice(20).map((sheet) => `<li>${esc(sheet.name)}</li>`).join('');
      html = html.slice(0, close) + names + html.slice(close);
    }
  }
  return html;
}

export function roadmapView() {
  const roadmap = [
    ['v111', 'Household Reporting III', 'goal, health, close, forecast, and debt sections in family reports; custom ranges and year-over-year views'],
    ['v112', 'Accessibility & Quality Automation', 'axe-core, Lighthouse CI budgets, and selective synthetic visual regression'],
    ['v116', 'Planned UI Architecture Review', 'navigation, content usefulness, accessibility, touch targets, density, and responsive design']
  ];
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Every release includes responsive and navigation checks; the next larger architecture review remains scheduled for about v116.</p></div><div class="section-meta">Next: v111</div></div><article class="roadmap-item shipped"><h3>v110 — Month Close & Forecasting</h3><p>Statement reconciliation, immutable close revisions, controlled reopen events, scheduled cash forecasting, and debt or promotional APR planning.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}

export function toolsView(section = 'import') {
  const map = { import: importView, exports: exportsView, roadmap: roadmapView };
  const content = section === 'diagnostics' ? '<div id="diagnosticsMount"></div>' : (map[section] || map.import)();
  return `<div class="workspace"><div class="subnav tools-subnav" role="tablist" aria-label="Tools sections"><button class="subtab ${section === 'import' ? 'active' : ''}" data-tools-section="import">Import / Restore</button><button class="subtab ${section === 'exports' ? 'active' : ''}" data-tools-section="exports">Exports & Backup</button><button class="subtab ${section === 'diagnostics' ? 'active' : ''}" data-tools-section="diagnostics">Diagnostics</button><button class="subtab ${section === 'roadmap' ? 'active' : ''}" data-tools-section="roadmap">Roadmap</button></div>${content}</div>`;
}
