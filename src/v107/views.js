import { esc, getMonth, money, monthLabel, months, rowsForMonth } from '../v103/core.js';
import {
  calendarView as baseCalendarView,
  dashboardView as baseDashboardView, diagnosticsView, moneyView as baseMoneyView,
  reportsView as baseReportsView
} from '../v106/views.js';
import { exportsView, importView, rulesView } from '../v104/views-admin.js';
import { ledgerView } from '../v104/views-main.js';
import { reviewOptions, reviewQueue, reviewSession } from './review.js';

export { diagnosticsView };

export function compactMonthNavigator() {
  const month = getMonth();
  const available = months();
  const count = rowsForMonth(month).length;
  const hasRows = available.includes(month);
  return `<div class="month-nav compact-month-nav" aria-label="Report month navigation">
    <button class="btn secondary month-arrow" id="monthPrev" aria-label="Previous month">◀</button>
    <label class="compact-month-picker">
      <span class="sr-only">Select report month</span>
      <input id="monthPicker" type="month" value="${esc(month)}" aria-label="Select year and month">
      <strong>${esc(monthLabel(month))}</strong>
    </label>
    <button class="btn secondary month-arrow" id="monthNext" aria-label="Next month">▶</button>
    <button class="btn secondary latest-button" id="monthLatest">Latest</button>
    <span class="month-status">${hasRows ? `${count} transactions` : 'No transactions'}</span>
  </div>`;
}

function compactizeMonth(html) {
  return String(html).replace(/<div class="month-nav"[\s\S]*?<\/div>/, compactMonthNavigator());
}

export function dashboardView() {
  return compactizeMonth(baseDashboardView());
}

export function moneyView(section = 'budget') {
  return compactizeMonth(baseMoneyView(section));
}

export function calendarView(selectedDate = '') {
  return compactizeMonth(baseCalendarView(selectedDate));
}

export function reportsView() {
  return compactizeMonth(baseReportsView());
}

function datalist(id, values) {
  return `<datalist id="${id}">${values.map((value) => `<option value="${esc(value)}"></option>`).join('')}</datalist>`;
}

export function reviewView(position = 0) {
  const month = getMonth();
  const queue = reviewQueue(month);
  const session = reviewSession();
  const options = reviewOptions();
  const safePosition = queue.length ? Math.min(Math.max(Number(position) || 0, 0), queue.length - 1) : 0;
  const item = queue[safePosition];
  const categorizedBatch = queue.filter((entry) => { const value = String(entry.category || '').trim(); return value && !/^(other|uncategorized)$/i.test(value); }).length;

  if (!item) {
    return `<section class="section active review-page">
      <div class="section-title-row"><div><h2>Review Queue</h2><p>${esc(monthLabel(month))} has no transactions requiring category or review cleanup.</p></div><div class="section-meta">Queue clear</div></div>
      <article class="card"><h3>Nothing waiting</h3><p>Use the month controls on Dashboard, Money, Calendar, or Reports to review another month.</p></article>
    </section>`;
  }

  const suggestion = item.matches[0];
  const locked = session.editingEnabled ? '' : 'disabled';
  return `<section class="section active review-page">
    <div class="section-title-row"><div><h2>Review Queue</h2><p>Review one transaction at a time without losing your place on phone or tablet.</p></div><div class="section-meta">${safePosition + 1} of ${queue.length} · ${esc(monthLabel(month))}</div></div>

    <article class="card review-safety ${session.editingEnabled ? 'editing-ready' : ''}">
      <div><h3>${session.editingEnabled ? 'Safe editing enabled' : 'Editing locked'}</h3><p>${session.editingEnabled ? `The current vault is protected by a downloaded backup${session.recoveryStored ? ' and a local recovery snapshot' : ''}.` : 'Enable safe editing to download a backup before any transaction row can change.'}</p></div>
      ${session.editingEnabled ? '' : '<button id="enableReviewEditing" class="btn primary">Enable Safe Editing</button>'}
    </article>

    <article class="review-card review-workspace">
      <div class="review-heading"><div><span class="review-count">${safePosition + 1} / ${queue.length}</span><h3>${esc(item.name)}</h3><p>${esc(item.date)} · ${esc(item.flow)}</p></div><div class="review-amount ${item.flow === 'Income' ? 'income' : 'outflow'}">${money(item.amount)}</div></div>
      <div class="review-reasons"><strong>Why it is here</strong><ul>${item.reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul></div>
      ${suggestion ? `<div class="rule-suggestion"><strong>Rule suggestion</strong><p>${esc(suggestion.label || suggestion.find)} suggests ${esc(suggestion.to)}.</p><button id="useReviewSuggestion" class="btn secondary" data-suggestion="${esc(suggestion.to)}">Use Suggestion</button></div>` : ''}
      <div class="review-form">
        <label>Category<input id="reviewCategory" list="reviewCategories" value="${esc(item.category)}" ${locked}></label>
        <label>Owner<input id="reviewOwner" list="reviewOwners" value="${esc(item.owner === 'Unassigned' ? '' : item.owner)}" ${locked}></label>
        <label>Account<input id="reviewAccount" list="reviewAccounts" value="${esc(item.account)}" ${locked}></label>
        <label class="review-notes-field">Notes<textarea id="reviewNotes" rows="3" ${locked}>${esc(item.notes)}</textarea></label>
      </div>
      ${datalist('reviewCategories', options.categories)}${datalist('reviewOwners', options.owners)}${datalist('reviewAccounts', options.accounts)}
      <div class="review-navigation">
        <button id="reviewPrevious" class="btn secondary" ${safePosition <= 0 ? 'disabled' : ''}>Previous</button>
        <button id="reviewNext" class="btn secondary" ${safePosition >= queue.length - 1 ? 'disabled' : ''}>Next</button>
      </div>
      <div class="review-save-actions">
        <button id="saveReviewProgress" class="btn secondary" data-row-index="${item.rowIndex}" ${locked}>Save Progress</button>
        <button id="saveReviewAndNext" class="btn primary" data-row-index="${item.rowIndex}" ${locked}>Save & Mark Reviewed</button>
      </div>
    </article>

    <article class="card review-batch-card">
      <h3>Safe batch action</h3><p>${categorizedBatch} queued transaction${categorizedBatch === 1 ? '' : 's'} already have a specific category. This action marks only those rows reviewed; it does not change their category, amount, merchant, or date.</p>
      <button id="batchReviewCategorized" class="btn secondary" ${!session.editingEnabled || !categorizedBatch ? 'disabled' : ''}>Mark Categorized Rows Reviewed</button>
    </article>
  </section>`;
}

export function activityView(section = 'ledger', search = '', reviewPosition = 0) {
  const content = section === 'rules' ? rulesView() : section === 'review' ? reviewView(reviewPosition) : ledgerView(search);
  return `<div class="workspace"><div class="subnav activity-subnav" role="tablist" aria-label="Activity sections">
    <button class="subtab ${section === 'ledger' ? 'active' : ''}" data-activity-section="ledger">Transactions</button>
    <button class="subtab ${section === 'review' ? 'active' : ''}" data-activity-section="review">Review Queue</button>
    <button class="subtab ${section === 'rules' ? 'active' : ''}" data-activity-section="rules">Rules</button>
  </div>${content}</div>`;
}

export function toolsView(section = 'import') {
  const map = { import: importView, exports: exportsView, roadmap: roadmapView };
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
    ['v108', 'Goals & Vault Health', 'goals, sinking funds, score history, and actionable recommendations'],
    ['v109', 'Import Memory & Duplicate Guard', 'duplicate protection, import history, and coverage-gap warnings'],
    ['v110', 'Month Close & Forecasting', 'reconciliation, close snapshots, forecasting, debt, and promotional APR planning'],
    ['v116', 'Planned UI Architecture Review', 'navigation, content, accessibility, and responsive-design overhaul; earlier if thresholds are reached']
  ];
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Every release includes responsive and navigation checks; the next larger architecture review remains scheduled for about v116.</p></div><div class="section-meta">Next: v108</div></div><article class="roadmap-item shipped"><h3>v107 — Review Queue & Performance</h3><p>Persistent navigation shell, cached vault parsing, compact phone month controls, and backup-first transaction review.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}
