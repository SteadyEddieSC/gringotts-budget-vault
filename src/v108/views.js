import { account, category, esc, flow, getMonth, money, monthLabel, owner, reportAmount, txName } from '../v103/core.js';
import { planningView } from '../v104/views-main.js';
import { intelligenceView } from '../v105/views.js';
import {
  calendarView, compactMonthNavigator, dashboardView, diagnosticsView,
  reportsView as baseReportsView, toolsView
} from '../v107/views.js';
import { reviewOptions, reviewQueue, reviewSession } from '../v107/review.js';
import { ledgerView } from '../v104/views-main.js';
import { rulesView } from '../v104/views-admin.js';
import {
  activeGoals, expandedWorkbookSheetsV108, goalProgress, goalSummary,
  healthHistory, vaultHealth
} from './goals.js';

export { calendarView, dashboardView, diagnosticsView, toolsView };

function selectOptions(values, current, blankLabel = '') {
  const normalized = [...new Set([current, ...values].map((value) => String(value || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  return `${blankLabel ? `<option value="">${esc(blankLabel)}</option>` : ''}${normalized.map((value) => `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(value)}</option>`).join('')}`;
}

export function reviewView(position = 0) {
  const month = getMonth();
  const queue = reviewQueue(month);
  const session = reviewSession();
  const options = reviewOptions();
  const safePosition = queue.length ? Math.min(Math.max(Number(position) || 0, 0), queue.length - 1) : 0;
  const item = queue[safePosition];
  const categorizedBatch = queue.filter((entry) => {
    const value = String(entry.category || '').trim();
    return value && !/^(other|uncategorized)$/i.test(value);
  }).length;

  if (!item) {
    return `<section class="section active review-page"><div class="section-title-row"><div><h2>Review Queue</h2><p>${esc(monthLabel(month))} has no transactions requiring cleanup.</p></div><div class="section-meta">Queue clear</div></div>${compactMonthNavigator()}<article class="card"><h3>Nothing waiting</h3><p>Use the month controls above to review another period.</p></article></section>`;
  }

  const suggestion = item.matches[0];
  const locked = session.editingEnabled ? '' : 'disabled';
  const currentOwner = item.owner === 'Unassigned' ? '' : item.owner;
  return `<section class="section active review-page">
    <div class="section-title-row"><div><h2>Review Queue</h2><p>Review one transaction at a time with normal selection controls.</p></div><div class="section-meta">${safePosition + 1} of ${queue.length} · ${esc(monthLabel(month))}</div></div>
    ${compactMonthNavigator()}
    <article class="card review-safety ${session.editingEnabled ? 'editing-ready' : ''}"><div><h3>${session.editingEnabled ? 'Safe editing enabled' : 'Editing locked'}</h3><p>${session.editingEnabled ? `The current vault is protected by a downloaded backup${session.recoveryStored ? ' and a local recovery snapshot' : ''}.` : 'Enable safe editing to download a backup before any transaction row can change.'}</p></div>${session.editingEnabled ? '' : '<button id="enableReviewEditing" class="btn primary">Enable Safe Editing</button>'}</article>
    <article class="review-card review-workspace">
      <div class="review-heading"><div><span class="review-count">${safePosition + 1} / ${queue.length}</span><h3>${esc(item.name)}</h3><p>${esc(item.date)} · ${esc(item.flow)}</p></div><div class="review-amount ${item.flow === 'Income' ? 'income' : 'outflow'}">${money(item.amount)}</div></div>
      <div class="review-reasons"><strong>Why it is here</strong><ul>${item.reasons.map((reason) => `<li>${esc(reason)}</li>`).join('')}</ul></div>
      ${suggestion ? `<div class="rule-suggestion"><strong>Rule suggestion</strong><p>${esc(suggestion.label || suggestion.find)} suggests ${esc(suggestion.to)}.</p><button id="useReviewSuggestion" class="btn secondary" data-suggestion="${esc(suggestion.to)}">Use Suggestion</button></div>` : ''}
      <div class="review-form">
        <label>Category<select id="reviewCategory" ${locked}>${selectOptions(options.categories, item.category, 'Choose category')}</select></label>
        <label>Owner<select id="reviewOwner" ${locked}>${selectOptions(options.owners, currentOwner, 'Unassigned')}</select></label>
        <label>Account<select id="reviewAccount" ${locked}>${selectOptions(options.accounts, item.account, 'No account selected')}</select></label>
        <label class="review-notes-field">Notes<textarea id="reviewNotes" rows="3" ${locked}>${esc(item.notes)}</textarea></label>
      </div>
      <div class="review-navigation"><button id="reviewPrevious" class="btn secondary" ${safePosition <= 0 ? 'disabled' : ''}>Previous</button><button id="reviewNext" class="btn secondary" ${safePosition >= queue.length - 1 ? 'disabled' : ''}>Next</button></div>
      <div class="review-save-actions"><button id="saveReviewProgress" class="btn secondary" data-row-index="${item.rowIndex}" ${locked}>Save Progress</button><button id="saveReviewAndNext" class="btn primary" data-row-index="${item.rowIndex}" ${locked}>Save & Mark Reviewed</button></div>
    </article>
    <article class="card review-batch-card"><h3>Safe batch action</h3><p>${categorizedBatch} queued transaction${categorizedBatch === 1 ? '' : 's'} already have a specific category. This marks only those rows reviewed.</p><button id="batchReviewCategorized" class="btn secondary" ${!session.editingEnabled || !categorizedBatch ? 'disabled' : ''}>Mark Categorized Rows Reviewed</button></article>
  </section>`;
}

export function activityView(section = 'ledger', search = '', reviewPosition = 0) {
  const content = section === 'rules' ? rulesView() : section === 'review' ? reviewView(reviewPosition) : ledgerView(search);
  return `<div class="workspace"><div class="subnav activity-subnav" role="tablist" aria-label="Activity sections"><button class="subtab ${section === 'ledger' ? 'active' : ''}" data-activity-section="ledger">Transactions</button><button class="subtab ${section === 'review' ? 'active' : ''}" data-activity-section="review">Review Queue</button><button class="subtab ${section === 'rules' ? 'active' : ''}" data-activity-section="rules">Rules</button></div>${content}</div>`;
}

function healthDetails(health) {
  return `<div class="health-score-card"><div class="health-score"><strong>${health.score}</strong><span>${esc(health.label)}</span></div><div class="health-bar"><span style="width:${health.score}%"></span></div><p>Score reflects selected-month review quality, pending activity, budgets, recurring-charge decisions, amount alerts, and active goals.</p></div>`;
}

export function goalsView(editGoalId = '') {
  const month = getMonth();
  const goals = activeGoals();
  const summary = goalSummary();
  const health = vaultHealth(month);
  const history = healthHistory();
  const editing = goals.find((goal) => goal.id === editGoalId) || null;
  return `<section class="section active goals-health-page">
    <div class="section-title-row"><div><h2>Goals & Vault Health</h2><p>Track sinking funds and use an explainable health score to decide what needs attention next.</p></div><div class="section-meta">${esc(monthLabel(month))}</div></div>
    ${compactMonthNavigator()}
    <div class="kpi-grid"><article class="kpi"><strong>${health.score}</strong><span>Vault Health</span></article><article class="kpi"><strong>${summary.count}</strong><span>Active goals</span></article><article class="kpi"><strong>${money(summary.current)}</strong><span>Funded</span></article><article class="kpi"><strong>${money(summary.remaining)}</strong><span>Remaining</span></article></div>
    <div class="grid two">
      <article class="card"><div class="section-title-row"><div><h3>Vault Health</h3><p>Transparent deductions, not a hidden financial rating.</p></div><button id="saveHealthSnapshot" class="btn secondary">Save Snapshot</button></div>${healthDetails(health)}<h4>Current deductions</h4><div class="notes">${health.deductions.map((item) => `<div class="note risk-note"><strong>-${item.points}</strong> ${esc(item.reason)}</div>`).join('') || '<div class="note good-note">No automatic deductions were generated.</div>'}</div><h4>Recommended next actions</h4><ol class="action-list">${health.actions.map((action) => `<li>${esc(action)}</li>`).join('') || '<li>Continue the current review and planning routine.</li>'}</ol></article>
      <article class="card"><h3>${editing ? 'Edit goal' : 'Add goal or sinking fund'}</h3><p>Goal data stays in this browser and is separate from transaction history.</p><input id="goalId" type="hidden" value="${esc(editing?.id || '')}"><label>Name<input id="goalName" value="${esc(editing?.name || '')}" placeholder="Emergency fund, vacation, truck payoff"></label><label>Type<select id="goalType">${['Sinking Fund','Savings','Debt Payoff','Emergency Fund','Other'].map((value) => `<option ${editing?.type === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><div class="grid two"><label>Target amount<input id="goalTarget" type="number" min="0" step="0.01" value="${editing?.target ?? ''}"></label><label>Current amount<input id="goalCurrent" type="number" min="0" step="0.01" value="${editing?.current ?? ''}"></label></div><div class="grid two"><label>Monthly contribution<input id="goalMonthly" type="number" min="0" step="0.01" value="${editing?.monthlyContribution ?? ''}"></label><label>Target date<input id="goalDueDate" type="date" value="${esc(editing?.dueDate || '')}"></label></div><label>Notes<textarea id="goalNotes" rows="3">${esc(editing?.notes || '')}</textarea></label><div class="button-row"><button id="saveGoal" class="btn primary">${editing ? 'Update Goal' : 'Add Goal'}</button>${editing ? '<button id="cancelGoalEdit" class="btn secondary">Cancel</button>' : ''}</div></article>
    </div>
    <article class="card"><div class="section-title-row"><div><h3>Active goals</h3><p>Add contributions manually as money is set aside or debt is reduced.</p></div><div class="section-meta">${goals.length} active</div></div><div class="goal-grid">${goals.map((goal) => { const progress = goalProgress(goal); return `<article class="goal-card"><div class="goal-card-heading"><div><h4>${esc(goal.name)}</h4><p>${esc(goal.type)}${goal.dueDate ? ` · target ${esc(goal.dueDate)}` : ''}</p></div><strong>${Math.round(progress.percent * 100)}%</strong></div><div class="goal-progress"><span style="width:${progress.percent * 100}%"></span></div><div class="goal-amounts"><span>${money(progress.current)} funded</span><span>${money(progress.remaining)} remaining</span></div><div class="goal-contribution"><input type="number" step="0.01" placeholder="Contribution" data-goal-contribution-input="${esc(goal.id)}"><button class="btn secondary" data-goal-contribute="${esc(goal.id)}">Add</button></div><div class="button-row"><button class="btn secondary" data-goal-edit="${esc(goal.id)}">Edit</button><button class="btn secondary" data-goal-archive="${esc(goal.id)}">Archive</button><button class="btn secondary" data-goal-delete="${esc(goal.id)}">Delete</button></div></article>`; }).join('') || '<p>No active goals yet.</p>'}</div></article>
    <article class="card"><h3>Health history</h3><p>Snapshots are recorded only when you select Save Snapshot.</p><div class="table-wrap"><table class="ledger"><thead><tr><th>Captured</th><th>Month</th><th>Score</th><th>Status</th><th>Review queue</th><th>Pending</th></tr></thead><tbody>${history.slice(0, 12).map((snapshot) => `<tr><td>${esc(new Date(snapshot.capturedAt).toLocaleString())}</td><td>${esc(snapshot.month)}</td><td>${snapshot.score}</td><td>${esc(snapshot.label)}</td><td>${snapshot.facts?.review || 0}</td><td>${snapshot.facts?.pending || 0}</td></tr>`).join('') || '<tr><td colspan="6">No saved health snapshots yet.</td></tr>'}</tbody></table></div></article>
  </section>`;
}

export function moneyView(section = 'budget', editGoalId = '') {
  const content = section === 'planning' ? planningView() : section === 'goals' ? goalsView(editGoalId) : intelligenceView();
  return `<div class="workspace"><div class="subnav money-subnav" role="tablist" aria-label="Money sections"><button class="subtab ${section === 'budget' ? 'active' : ''}" data-money-section="budget">Budget & Recurring</button><button class="subtab ${section === 'planning' ? 'active' : ''}" data-money-section="planning">Bills & Paydays</button><button class="subtab ${section === 'goals' ? 'active' : ''}" data-money-section="goals">Goals & Health</button></div>${section === 'goals' ? content : String(content).replace(/<div class="month-nav"[\s\S]*?<\/div>/, compactMonthNavigator())}</div>`;
}

export function reportsView() {
  let html = baseReportsView();
  html = html.replace('Expanded 17-sheet workbook', 'Expanded 20-sheet workbook');
  html = html.replace('Curated 12-sheet workbook', 'Expanded 20-sheet workbook');
  const marker = '<h3>Vault workbook contents</h3><ul class="sheet-list">';
  const start = html.indexOf(marker);
  if (start >= 0) {
    const close = html.indexOf('</ul>', start);
    if (close >= 0 && !html.slice(start, close).includes('<li>Goals</li>')) {
      const names = expandedWorkbookSheetsV108(getMonth()).slice(17).map((sheet) => `<li>${esc(sheet.name)}</li>`).join('');
      html = html.slice(0, close) + names + html.slice(close);
    }
  }
  return html;
}
