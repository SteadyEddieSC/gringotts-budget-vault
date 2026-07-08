import { category, esc, flow, getMonth, money, monthLabel, txs } from '../v103/core.js';
import {
  budgetRows, budgetSummary, categoryTuning, expandedWorkbookSheets,
  recurringAmountAlerts, recurringWatch, spendingTrends
} from './intelligence.js';
import {
  dashboardView, ledgerView, planningView, reportsView as baseReportsView
} from '../v104/views-main.js';

export { dashboardView, ledgerView, planningView };

export function reportsView() {
  let html = baseReportsView();
  html = html.replace(
    'Curated 12-sheet workbook with executive summary, enriched transactions, monthly/category/merchant summaries, recurring charges, planning, rules, review queue, and metadata.',
    'Expanded 17-sheet workbook with executive summary, enriched transactions, monthly/category/merchant summaries, budgets, recurring-charge watch, amount changes, spending trends, tuning recommendations, planning, rules, review queue, and metadata.'
  );
  const marker = '<h3>Vault workbook contents</h3><ul class="sheet-list">';
  const start = html.indexOf(marker);
  if (start >= 0) {
    const close = html.indexOf('</ul>', start);
    if (close >= 0) {
      const names = expandedWorkbookSheets(getMonth()).slice(12).map((sheet) => `<li>${esc(sheet.name)}</li>`).join('');
      html = html.slice(0, close) + names + html.slice(close);
    }
  }
  return html;
}

function expenseCategories() {
  return [...new Set(txs().filter((transaction) => flow(transaction) === 'Expense').map(category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function budgetProgress(row) {
  const percent = row.hasBudget ? Math.min(140, Math.max(0, row.percent * 100)) : 0;
  const status = !row.hasBudget ? 'No budget set' : row.spent > row.budget ? `${money(row.spent - row.budget)} over` : `${money(row.budget - row.spent)} remaining`;
  return `<div class="budget-progress"><div class="budget-track"><span class="budget-fill ${row.spent > row.budget ? 'over' : ''}" style="width:${Math.min(100, percent)}%"></span></div><small>${esc(status)}</small></div>`;
}

export function intelligenceView() {
  const month = getMonth();
  const summary = budgetSummary(month);
  const budgets = budgetRows(month);
  const recurring = recurringWatch();
  const visibleRecurring = recurring.filter((item) => item.status !== 'excluded');
  const alerts = recurringAmountAlerts();
  const trends = spendingTrends(month, 6);
  const tuning = categoryTuning(month);
  const categories = expenseCategories();
  const trendMax = Math.max(1, ...trends.map((item) => item.spending));

  return `<section class="section active intelligence-view">
    <div class="section-title-row"><div><h2>Bills, Recurring & Budgets</h2><p>Local budget targets, recurring-charge review, amount-change alerts, and spending trends.</p></div><div class="section-meta">${esc(monthLabel(month))}</div></div>

    <div class="kpi-grid">
      <article class="kpi"><strong>${summary.categories}</strong><span>Budgeted categories</span></article>
      <article class="kpi"><strong>${money(summary.budget)}</strong><span>Category budgets</span></article>
      <article class="kpi"><strong>${money(summary.spent)}</strong><span>Budgeted-category spending</span></article>
      <article class="kpi"><strong>${summary.over}</strong><span>Categories over budget</span></article>
    </div>

    <div class="grid two">
      <article class="card"><h3>Add or update a category budget</h3><p>Budgets are saved only in this browser and apply as monthly category targets.</p><label>Category<input id="budgetCategory" list="budgetCategoryList" placeholder="Choose or type a category"><datalist id="budgetCategoryList">${categories.map((name) => `<option value="${esc(name)}"></option>`).join('')}</datalist></label><label>Monthly budget<input id="budgetAmount" type="number" min="0" step="0.01" placeholder="0.00"></label><button id="saveBudget" class="btn primary">Save Budget</button></article>
      <article class="card"><h3>Budget guidance</h3><div class="notes">${tuning.map((item) => `<div class="note ${item.level === 'over' ? 'risk-note' : ''}">${esc(item.message)}</div>`).join('') || '<div class="note good-note">No budget tuning recommendation is available yet.</div>'}</div></article>
    </div>

    <article class="card"><div class="section-title-row"><div><h3>Budget versus actual</h3><p>Actual household spending for the selected month compared with saved targets.</p></div><div class="section-meta">${budgets.length} categories</div></div><div class="table-wrap"><table class="ledger budget-table"><thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Progress</th><th>Suggested</th><th></th></tr></thead><tbody>${budgets.map((row) => `<tr><td><strong>${esc(row.category)}</strong></td><td>${row.hasBudget ? money(row.budget) : '—'}</td><td>${money(row.spent)}</td><td>${budgetProgress(row)}</td><td>${row.suggested ? money(Math.ceil(row.suggested / 10) * 10) : '—'}</td><td>${row.hasBudget ? `<button class="btn secondary compact-button" data-budget-delete="${esc(row.category)}">Remove</button>` : `<button class="btn secondary compact-button" data-budget-suggest="${esc(row.category)}" data-budget-amount="${Math.ceil(row.suggested / 10) * 10}">Use suggestion</button>`}</td></tr>`).join('') || '<tr><td colspan="6">No spending categories are available.</td></tr>'}</tbody></table></div></article>

    <div class="grid two">
      <article class="card"><div class="section-title-row"><div><h3>Recurring-charge watch</h3><p>Confirm real subscriptions and bills, or exclude false positives.</p></div><div class="section-meta">${visibleRecurring.length} visible</div></div><div class="recurring-list">${recurring.slice(0, 40).map((item) => `<div class="recurring-item ${item.status === 'excluded' ? 'excluded' : ''}"><div><strong>${esc(item.name)}</strong><div class="recurring-meta">${esc(item.category)} · ${item.occurrences} charges across ${item.months} months · latest ${esc(item.latestDate)}</div></div><div class="recurring-amount"><strong>${money(item.latestAmount)}</strong><small>${item.previousAmount ? `previously ${money(item.previousAmount)}` : 'no prior amount'}</small></div><div class="recurring-actions"><span class="status-text">${esc(item.status)}</span><button class="btn secondary compact-button" data-recurring-action="confirmed" data-recurring-key="${esc(item.key)}">Confirm</button><button class="btn secondary compact-button" data-recurring-action="excluded" data-recurring-key="${esc(item.key)}">Exclude</button><button class="btn secondary compact-button" data-recurring-action="candidate" data-recurring-key="${esc(item.key)}">Reset</button></div></div>`).join('') || '<p>No recurring candidates were detected.</p>'}</div></article>
      <article class="card"><div class="section-title-row"><div><h3>Amount-change alerts</h3><p>Recurring candidates with a change of at least $2 or 5%.</p></div><div class="section-meta">${alerts.length} alerts</div></div><div class="list">${alerts.map((item) => `<div class="list-item"><span><strong>${esc(item.name)}</strong><br><small>${esc(item.latestDate)} · ${esc(item.status)}</small></span><span class="${item.delta > 0 ? 'amount-outflow' : 'amount-income'}">${item.delta > 0 ? '+' : ''}${money(item.delta)}<br><small>${item.percent > 0 ? '+' : ''}${(item.percent * 100).toFixed(1)}%</small></span></div>`).join('') || '<p>No meaningful recurring amount changes were detected.</p>'}</div></article>
    </div>

    <article class="card"><div class="section-title-row"><div><h3>Six-month household spending trend</h3><p>Transfers and income are excluded.</p></div><div class="section-meta">Through ${esc(monthLabel(month))}</div></div><div class="trend-grid">${trends.map((item) => `<div class="trend-column"><div class="trend-value">${money(item.spending)}</div><div class="trend-track"><span style="height:${Math.max(3, item.spending / trendMax * 100)}%"></span></div><div class="trend-label">${esc(item.label.replace(/ \d{4}$/, ''))}</div></div>`).join('')}</div></article>
  </section>`;
}
