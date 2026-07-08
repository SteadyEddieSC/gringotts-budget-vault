import { esc, getMonth, money } from '../v103/core.js';
import { trackerTemplateSnapshot } from '../v104/template-workbook.js';
import { exportsView } from '../v104/views-admin.js';
import {
  activityView as baseActivityView, calendarView, dashboardView, diagnosticsView, importView, moneyView
} from '../v110/views.js';
import { compactMonthNavigator } from '../v107/views.js';
import { buildHouseholdInsights } from '../v113/insights.js';
import { insightsReportPage, insightsView } from '../v113/views.js';
import {
  expandedWorkbookSheetsV111, householdReportModel, rangeExecutiveSummary,
  reportRangeSettings
} from './reporting.js';

export { calendarView, dashboardView, diagnosticsView, importView, moneyView };

const presetLabels = {
  month: 'Selected month',
  ytd: 'Year to date',
  last3: 'Rolling 3 months',
  last6: 'Rolling 6 months',
  last12: 'Rolling 12 months',
  custom: 'Custom dates'
};
const countMetrics = new Set(['Transactions', 'Pending', 'Review queue']);

function percent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'New / no prior baseline';
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
}

function metricValue(item, value) {
  return countMetrics.has(item.label) ? Number(value).toLocaleString() : money(value);
}

function metricChange(item) {
  const amount = countMetrics.has(item.label) ? Math.abs(item.delta).toLocaleString() : money(Math.abs(item.delta));
  const direction = item.delta === 0 ? 'No change' : `${amount} ${item.delta > 0 ? 'higher' : 'lower'}`;
  return `<span class="comparison-direction ${item.direction}">${esc(direction)}<small>${esc(percent(item.percent))}</small></span>`;
}

function bars(items, maxItems = 8) {
  const selected = items.slice(0, maxItems);
  const max = selected[0]?.[1] || 1;
  return selected.length ? `<div class="bars">${selected.map(([label, amount]) => `<div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(2, Math.min(100, amount / max * 100))}%"></span></span><strong>${money(amount)}</strong></div>`).join('')}</div>` : '<p>No spending appears in this report range.</p>';
}

export function activityView(section = 'ledger', search = '', reviewPosition = 0) {
  let content = '';
  if (section === 'insights') content = insightsView();
  else {
    const base = baseActivityView(section, search, reviewPosition);
    const subnavClose = base.indexOf('</div>');
    content = subnavClose >= 0 && base.endsWith('</div>') ? base.slice(subnavClose + 6, -6) : base;
  }
  return `<div class="workspace"><div class="subnav activity-subnav" role="tablist" aria-label="Activity sections"><button class="subtab ${section === 'ledger' ? 'active' : ''}" data-activity-section="ledger">Transactions</button><button class="subtab ${section === 'review' ? 'active' : ''}" data-activity-section="review">Review Queue</button><button class="subtab ${section === 'rules' ? 'active' : ''}" data-activity-section="rules">Rules</button><button class="subtab ${section === 'insights' ? 'active' : ''}" data-activity-section="insights">Insights</button></div>${content}</div>`;
}

function reportControls(settings) {
  return `<article class="card range-controls screen-only"><div class="section-title-row"><div><h3>Report range</h3><p>Choose a reusable household reporting period. This changes reports only and never filters or edits the vault.</p></div><div class="section-meta">${esc(presetLabels[settings.preset])}</div></div>
    <div class="report-range-grid">
      <label>Range preset<select id="reportPreset">${Object.entries(presetLabels).map(([value, label]) => `<option value="${value}" ${settings.preset === value ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></label>
      <label>Start date<input id="reportStart" type="date" value="${esc(settings.start)}" ${settings.preset === 'custom' ? '' : 'disabled'}></label>
      <label>End date<input id="reportEnd" type="date" value="${esc(settings.end)}" ${settings.preset === 'custom' ? '' : 'disabled'}></label>
      <label class="ack-row comparison-toggle"><input id="reportComparePrior" type="checkbox" ${settings.comparePriorYear ? 'checked' : ''}><span>Compare with the equivalent prior-year range.</span></label>
    </div>
    <button id="applyReportRange" class="btn primary">Apply Report Range</button>
  </article>`;
}

function downloadOptions(template, model) {
  return `<div class="grid two report-downloads screen-only">
    <article class="card report-option preferred-report"><h3>Wife's Annual Income & Expense Tracker</h3><p>The preferred annual tracker remains tied to the selected month and its source year. Choose the local template to preserve its formulas, charts, and styling.</p><label class="file-drop compact-drop" for="annualTrackerFile"><span><strong>${template.valid ? esc(template.fileName) : 'Choose annual tracker template (.xlsx)'}</strong><br>${template.valid ? `${template.transactions} transactions ready for ${esc(template.selectedMonthLabel)}` : 'The template stays local to this browser tab.'}</span><input id="annualTrackerFile" type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"></label>${template.valid ? `<div class="template-status"><strong>Template validated.</strong> Required sheets found.${template.truncated ? ' The template limit uses the latest 10,000 dated transactions.' : ''}</div>` : ''}<button id="filledAnnualTracker" class="btn primary" ${template.valid ? '' : 'disabled'}>Fill and Download Annual Tracker</button></article>
    <article class="card report-option"><h3>28-sheet Vault Workbook</h3><p>Includes the full v110 workbook plus Report Range, Range Transactions, Year over Year, and Family Meeting Brief.</p><button id="vaultXlsx" class="btn primary">Download 28-sheet Workbook</button></article>
    <article class="card report-option"><h3>Range transaction export</h3><p>Download the active ${esc(model.label)} transaction range as CSV, or retain the selected-month quick XLSX.</p><div class="button-row"><button id="familyCsv" class="btn secondary">Download Range CSV</button><button id="familyXlsx" class="btn secondary">Selected-Month Quick XLSX</button></div></article>
    <article class="card report-option"><h3>Range executive report</h3><p>Download or copy the custom-range narrative with year-over-year context.</p><div class="button-row"><button id="executiveMd" class="btn secondary">Download Executive Markdown</button><button id="copyExecutive" class="btn secondary">Copy Range Summary</button></div></article>
    <article class="card report-option"><h3>Family meeting pack</h3><p>Insights, goals, Vault Health, close status, forecast, debt priorities, questions, wins, risks, and actions.</p><div class="button-row"><button id="meetingMd" class="btn secondary">Download Meeting Pack</button><button id="printReports" class="btn secondary">Print / Save PDF</button></div></article>
  </div>`;
}

function executivePage(model) {
  return `<article class="card printable-report report-page report-cover"><div class="report-kicker">Household Insights IV</div><h2>Family Financial Report</h2><p class="report-period">${esc(model.label)}</p><p class="executive-text">${esc(rangeExecutiveSummary(model))}</p><div class="report-metrics"><span><strong>${model.metrics.count}</strong> Transactions</span><span><strong>${money(model.metrics.income)}</strong> Income</span><span><strong>${money(model.metrics.spend)}</strong> Spending</span><span><strong>${money(model.metrics.net)}</strong> Net</span></div><div class="report-quality-line"><span>${model.metrics.pending} pending</span><span>${model.metrics.review} need review</span><span>Generated ${esc(new Date(model.generatedAt).toLocaleString())}</span></div></article>`;
}

function comparisonPage(model) {
  if (!model.comparison) return `<article class="card printable-report report-page"><h2>Year-over-year comparison</h2><p>Prior-year comparison is disabled for this report range.</p></article>`;
  return `<article class="card printable-report report-page"><div class="section-title-row"><div><h2>Year-over-year comparison</h2><p>${esc(model.label)} versus ${esc(model.comparison.label)}</p></div><div class="section-meta">Equivalent dates</div></div><div class="table-wrap report-table-wrap"><table class="ledger comparison-table"><thead><tr><th>Metric</th><th>Current</th><th>Prior year</th><th>Change</th></tr></thead><tbody>${model.comparison.rows.map((item) => `<tr><td><strong>${esc(item.label)}</strong></td><td>${metricValue(item, item.current)}</td><td>${metricValue(item, item.prior)}</td><td>${metricChange(item)}</td></tr>`).join('')}</tbody></table></div><h3>Monthly trend</h3><div class="table-wrap report-table-wrap"><table class="ledger monthly-comparison-table"><thead><tr><th>Month</th><th>Income</th><th>Spending</th><th>Net</th><th>Prior spending</th></tr></thead><tbody>${model.monthly.map((item) => `<tr><td>${esc(item.label)}</td><td>${money(item.income)}</td><td>${money(item.spend)}</td><td>${money(item.net)}</td><td>${money(item.priorSpend)}</td></tr>`).join('')}</tbody></table></div></article>`;
}

function spendingPage(model) {
  return `<section class="printable-report report-page report-grid-page"><article class="card"><h2>Spending by category</h2>${bars(model.categories, 10)}</article><article class="card"><h2>Top merchants</h2>${bars(model.merchants, 10)}</article><article class="card"><h2>Owner / account split</h2>${bars(model.accounts, 10)}</article><article class="card"><h2>Report quality</h2><div class="notes">${model.metrics.pending ? `<div class="note warning-note">${model.metrics.pending} pending transaction${model.metrics.pending === 1 ? '' : 's'} remain provisional.</div>` : '<div class="note good-note">No pending transactions appear in the range.</div>'}${model.metrics.review ? `<div class="note risk-note">${model.metrics.review} transaction${model.metrics.review === 1 ? '' : 's'} need review.</div>` : '<div class="note good-note">No selected-range review warnings remain.</div>'}</div></article></section>`;
}

function goalsHealthPage(model) {
  return `<section class="printable-report report-page"><div class="section-title-row"><div><h2>Goals and Vault Health</h2><p>Goal data and the health score remain separate from transactions.</p></div><div class="health-print-score"><strong>${model.health.score}</strong><span>${esc(model.health.label)}</span></div></div><div class="report-metrics"><span><strong>${model.goalSummary.count}</strong> Active goals</span><span><strong>${money(model.goalSummary.current)}</strong> Funded</span><span><strong>${money(model.goalSummary.target)}</strong> Target</span><span><strong>${money(model.goalSummary.remaining)}</strong> Remaining</span></div><div class="goal-report-grid">${model.goals.map((goal) => `<article class="goal-report-row"><div><strong>${esc(goal.name)}</strong><span>${esc(goal.type)}${goal.dueDate ? ` · ${esc(goal.dueDate)}` : ''}</span></div><div class="goal-progress"><span style="width:${goal.progress.percent * 100}%"></span></div><div>${money(goal.progress.current)} / ${money(goal.progress.target)} · ${Math.round(goal.progress.percent * 100)}%</div></article>`).join('') || '<p>No active goals are configured.</p>'}</div><div class="grid two health-report-lower"><article class="card"><h3>Current deductions</h3><div class="notes">${model.health.deductions.map((item) => `<div class="note risk-note"><strong>-${item.points}</strong> ${esc(item.reason)}</div>`).join('') || '<div class="note good-note">No automatic deductions were generated.</div>'}</div></article><article class="card"><h3>Recommended actions</h3><ol class="action-list">${model.health.actions.map((value) => `<li>${esc(value)}</li>`).join('') || '<li>Continue the current household review routine.</li>'}</ol></article></div></section>`;
}

function planningPage(model) {
  const priority = model.debt.priority[0];
  return `<section class="printable-report report-page"><h2>Month close, forecast, and debt</h2><div class="report-metrics"><span><strong>${model.close.closedMonths}</strong> Closed months</span><span><strong>${model.close.openMonths}</strong> Open months</span><span><strong>${model.close.driftedMonths}</strong> Drifted closes</span><span><strong>${money(model.forecast.endingBalance)}</strong> Forecast ending</span></div><div class="grid two"><article class="card"><h3>Cash forecast</h3><div class="summary-box compact">Forecast: ${esc(model.forecast.start)} through ${esc(model.forecast.end)}\nStarting cash: ${money(model.forecast.settings.startingCash)}\nEnding cash: ${money(model.forecast.endingBalance)}\nLowest cash: ${money(model.forecast.lowBalance)} on ${esc(model.forecast.lowDate)}\nDays below buffer: ${model.forecast.pressureDays.length}\nNegative days: ${model.forecast.negativeDays.length}</div></article><article class="card"><h3>Debt plan</h3><div class="summary-box compact">Total planned balance: ${money(model.debt.totalBalance)}\nMonthly minimums: ${money(model.debt.minimumPayments)}\nTarget payments: ${money(model.debt.targetPayments)}\nEstimated monthly interest: ${money(model.debt.estimatedMonthlyInterest)}\nPromos within 6 months: ${model.debt.promoExpiring}\nCurrent priority: ${esc(priority?.name || 'No debt plan entry')}</div></article></div><div class="table-wrap report-table-wrap"><table class="ledger debt-report-table"><thead><tr><th>Priority</th><th>Debt</th><th>Balance</th><th>Effective APR</th><th>Target</th><th>Promo end</th><th>Promo gap</th></tr></thead><tbody>${model.debt.priority.map((debt, index) => `<tr><td>${index + 1}</td><td>${esc(debt.name)}</td><td>${money(debt.balance)}</td><td>${debt.effectiveApr}%</td><td>${money(debt.targetPayment)}</td><td>${esc(debt.promoEnd || '—')}</td><td>${money(debt.promoGap)}</td></tr>`).join('') || '<tr><td colspan="7">No debt planning entries.</td></tr>'}</tbody></table></div></section>`;
}

function meetingPage(model, insights) {
  const section = (title, values, className = '') => `<article class="card ${className}"><h3>${esc(title)}</h3><ul>${values.map((value) => `<li>${esc(value)}</li>`).join('') || '<li>No item was generated.</li>'}</ul></article>`;
  const questions = [...new Set([...insights.prompts.map((item) => item.question), ...model.meeting.questions])].slice(0, 10);
  const insightRisks = insights.signals.filter((item) => item.severity !== 'watch').slice(0, 4).map((item) => item.summary);
  const risks = [...new Set([...insightRisks, ...model.meeting.risks])].slice(0, 10);
  return `<section class="printable-report report-page"><h2>Family meeting brief</h2><div class="grid two meeting-report-grid">${section('Questions to Decide Together', questions)}${section('Wins', model.meeting.wins, 'report-wins')}${section('Risks & Watch Items', risks, 'report-risks')}${section('Action Items', model.meeting.actions, 'report-actions')}</div></section>`;
}

export function reportsView() {
  const settings = reportRangeSettings();
  const model = householdReportModel(settings);
  const insights = buildHouseholdInsights({ rows: model.currentRows, start: settings.start, end: settings.end, label: model.label });
  const template = trackerTemplateSnapshot();
  return `<section class="section active report-center v111-report-center v113-report-center"><div class="section-title-row"><div><h2>Reports Center</h2><p>Build selected-month, custom-range, year-over-year, insights, and family meeting reports entirely in this browser.</p></div><div class="section-meta">${esc(model.label)}</div></div>${compactMonthNavigator()}${reportControls(settings)}${downloadOptions(template, model)}${executivePage(model)}${comparisonPage(model)}${spendingPage(model)}${goalsHealthPage(model)}${planningPage(model)}${insightsReportPage(insights)}${meetingPage(model, insights)}<article class="card screen-only"><h3>Vault workbook contents</h3><p>The deeper workbook contains ${expandedWorkbookSheetsV111(getMonth(), model).length} sheets.</p><ul class="sheet-list">${expandedWorkbookSheetsV111(getMonth(), model).map((sheet) => `<li>${esc(sheet.name)}</li>`).join('')}</ul></article></section>`;
}

export function roadmapView() {
  const roadmap = [
    ['v114', 'Guided Household Planning', 'advisor-style planning checklists driven by goals, close status, forecast pressure, debt priorities, and household insights'],
    ['v115', 'Bank Export Import & Mapping', 'local CSV, OFX, QFX, and QBO parsing with mapping preview, duplicate review, backup-first writes, and read-back verification'],
    ['v116', 'Planned UI Architecture Review', 'navigation, content usefulness, accessibility, touch targets, density, and responsive design']
  ];
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Every release retains responsive, privacy, security, accessibility, and working-control gates.</p></div><div class="section-meta">Next: v114</div></div><article class="roadmap-item shipped"><h3>v113 — Household Insights IV</h3><p>Explainable unusual-spending signals, recurring-cost opportunities, traceable decision prompts, and report-center integration without automatic transaction changes.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}

export function toolsView(section = 'import') {
  const map = { import: importView, exports: exportsView, roadmap: roadmapView };
  const content = section === 'diagnostics' ? '<div id="diagnosticsMount"></div>' : (map[section] || map.import)();
  return `<div class="workspace"><div class="subnav tools-subnav" role="tablist" aria-label="Tools sections"><button class="subtab ${section === 'import' ? 'active' : ''}" data-tools-section="import">Import / Restore</button><button class="subtab ${section === 'exports' ? 'active' : ''}" data-tools-section="exports">Exports & Backup</button><button class="subtab ${section === 'diagnostics' ? 'active' : ''}" data-tools-section="diagnostics">Diagnostics</button><button class="subtab ${section === 'roadmap' ? 'active' : ''}" data-tools-section="roadmap">Roadmap</button></div>${content}</div>`;
}
