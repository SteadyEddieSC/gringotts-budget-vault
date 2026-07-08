import { account, category, dte, esc, money, owner, reportAmount, txName } from '../v103/core.js';
import { compactMonthNavigator } from '../v107/views.js';
import { selectedMonthInsights } from './insights.js';

function severityLabel(value) {
  return value === 'high' ? 'High attention' : value === 'review' ? 'Review' : 'Watch';
}

function severityClass(value) {
  return value === 'high' ? 'risk-note' : value === 'review' ? 'warning-note' : 'note';
}

function evidenceTable(signal) {
  const rows = signal.evidence || [];
  if (!rows.length) return '';
  return `<details class="insight-evidence"><summary>Source transactions (${rows.length})</summary><div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Account / owner</th><th>Amount</th></tr></thead><tbody>${rows.slice(0, 12).map((transaction) => `<tr><td>${esc(dte(transaction))}</td><td>${esc(txName(transaction))}</td><td>${esc(category(transaction))}</td><td>${esc(account(transaction) || 'No account')} / ${esc(owner(transaction) || 'Unassigned')}</td><td>${money(reportAmount(transaction))}</td></tr>`).join('')}</tbody></table></div>${rows.length > 12 ? `<p class="muted-note">Showing the first 12 of ${rows.length} source transactions.</p>` : ''}</details>`;
}

function signalCards(model) {
  if (!model.signals.length) return '<article class="card"><h3>No threshold-based unusual spending</h3><p>The selected period did not cross the merchant or category thresholds. This is not a guarantee that every transaction is expected; review the ledger and pending items as needed.</p></article>';
  return model.signals.map((signal) => `<article class="card insight-card ${signal.severity}"><div class="section-title-row"><div><h3>${esc(signal.title)}</h3><p>${esc(signal.summary)}</p></div><div class="section-meta">${esc(severityLabel(signal.severity))}</div></div><div class="insight-facts"><span><strong>${money(signal.amount)}</strong> selected amount</span><span><strong>${money(signal.baselineAmount)}</strong> baseline</span><span><strong>${signal.baselineCount}</strong> baseline rows</span>${signal.factor ? `<span><strong>${signal.factor.toFixed(2)}×</strong> baseline</span>` : ''}</div><div class="note ${severityClass(signal.severity)}"><strong>Why flagged:</strong> ${esc(signal.method)}</div>${evidenceTable(signal)}</article>`).join('');
}

function recurringTable(model) {
  return `<article class="card"><div class="section-title-row"><div><h3>Recurring-cost opportunities</h3><p>These are review prompts, not automatic cancellation or savings recommendations.</p></div><div class="section-meta">${model.recurring.length} items</div></div>${model.recurring.length ? `<div class="table-wrap"><table class="ledger recurring-insights-table"><thead><tr><th>Merchant</th><th>Status</th><th>Latest</th><th>Average</th><th>Annual footprint</th><th>Annualized increase</th><th>Why review</th></tr></thead><tbody>${model.recurring.map((item) => `<tr><td><strong>${esc(item.name)}</strong><br><small>${esc(item.category)}</small></td><td>${esc(item.status)}</td><td>${money(item.latestAmount)}<br><small>${esc(item.latestDate)}</small></td><td>${money(item.average)}</td><td>${money(item.annualCost)}</td><td>${item.annualIncrease ? money(item.annualIncrease) : '—'}</td><td>${esc(item.explanation)}</td></tr>`).join('')}</tbody></table></div>` : '<p>No non-excluded recurring pattern met the current review thresholds.</p>'}</article>`;
}

function decisionCards(model) {
  return `<article class="card"><div class="section-title-row"><div><h3>Questions to decide together</h3><p>Each question is tied to a visible signal or recurring pattern.</p></div><div class="section-meta">${model.prompts.length}</div></div><ol class="insight-prompts">${model.prompts.map((item) => `<li><strong>${esc(item.question)}</strong><span>${esc(item.reason)}</span></li>`).join('')}</ol></article>`;
}

function methodology(model) {
  return `<article class="card methodology-card"><h3>How these insights were calculated</h3><ul>${model.methodology.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><p class="muted-note">Generated ${esc(new Date(model.generatedAt).toLocaleString())}. No transaction, category, budget, rule, or recurring preference was changed.</p></article>`;
}

export function insightsView(model = selectedMonthInsights()) {
  return `<section class="section active household-insights-page"><div class="section-title-row"><div><h2>Household Insights</h2><p>Review explainable unusual-spending signals, recurring-cost changes, and decision prompts without changing transaction history.</p></div><div class="section-meta">${esc(model.label)}</div></div>${compactMonthNavigator()}<div class="kpi-grid insight-kpis"><article class="kpi"><strong>${model.counts.unusual}</strong><span>Unusual signals</span></article><article class="kpi"><strong>${model.counts.high}</strong><span>High attention</span></article><article class="kpi"><strong>${model.counts.recurring}</strong><span>Recurring reviews</span></article><article class="kpi"><strong>${money(model.annualizedIncrease)}</strong><span>Annualized increases</span></article></div><article class="card insight-period-card"><div class="grid two"><div class="summary-box compact">Selected period: ${esc(model.start)} through ${esc(model.end)}\nTransactions: ${model.counts.transactions}\nPosted expenses analyzed: ${model.counts.postedExpenses}\nPending rows excluded from comparisons: ${model.counts.pending}</div><div class="summary-box compact">Equivalent comparison: ${esc(model.comparisonStart)} through ${esc(model.comparisonEnd)}\nMerchant history: ${esc(model.historyStart)} through ${esc(model.historyEnd)}\nAutomatic writes: none\nRemote processing: none</div></div></article><div class="insight-signal-list">${signalCards(model)}</div>${recurringTable(model)}${decisionCards(model)}${methodology(model)}</section>`;
}

export function insightsReportPage(model) {
  const topSignals = model.signals.slice(0, 8);
  const topRecurring = model.recurring.slice(0, 8);
  return `<section class="printable-report report-page household-insights-report"><div class="section-title-row"><div><h2>Household insights</h2><p>Explainable review signals for ${esc(model.label)}. No automatic financial decisions or transaction changes.</p></div><div class="section-meta">${model.counts.unusual} signals</div></div><div class="report-metrics"><span><strong>${model.counts.high}</strong> High attention</span><span><strong>${model.counts.recurring}</strong> Recurring reviews</span><span><strong>${money(model.annualizedIncrease)}</strong> Annualized increases</span><span><strong>${model.counts.pending}</strong> Pending excluded</span></div><div class="grid two insight-report-grid"><article class="card"><h3>Unusual-spending review</h3><ul>${topSignals.map((signal) => `<li><strong>${esc(signal.title)}</strong><br>${esc(signal.summary)}<br><small>${esc(signal.method)}</small></li>`).join('') || '<li>No threshold-based unusual-spending signal was generated.</li>'}</ul></article><article class="card"><h3>Recurring-cost review</h3><ul>${topRecurring.map((item) => `<li><strong>${esc(item.name)}</strong> — ${esc(item.explanation)}</li>`).join('') || '<li>No recurring-cost review item met the current thresholds.</li>'}</ul></article></div><article class="card"><h3>Questions to decide together</h3><ol>${model.prompts.map((item) => `<li>${esc(item.question)}</li>`).join('')}</ol></article><article class="card"><h3>Method</h3><ul>${model.methodology.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article></section>`;
}
