import { esc } from '../v103/core.js';
import { compactMonthNavigator } from '../v107/views.js';
import { guidedPlanData, guidedPlanModel } from './planning.js';

const STATUS_LABELS = {
  'not-started': 'Not started',
  planned: 'Planned',
  done: 'Done',
  dismissed: 'Dismissed'
};

const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  routine: 'Routine'
};

function statusOptions(current) {
  return Object.entries(STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}" ${current === value ? 'selected' : ''}>${esc(label)}</option>`)
    .join('');
}

function actionCard(item, compact = false) {
  const state = item.state;
  const fieldPrefix = `guided_${item.id}`;
  return `<article class="card guided-action-card priority-${esc(item.priority)} ${['done', 'dismissed'].includes(state.status) ? 'resolved' : ''}" data-plan-item="${esc(item.id)}">
    <div class="section-title-row"><div><div class="guided-action-meta"><span class="priority-badge ${esc(item.priority)}">${esc(PRIORITY_LABELS[item.priority])}</span><span>${esc(item.area)}</span></div><h3>${esc(item.title)}</h3></div><div class="section-meta">${esc(STATUS_LABELS[state.status])}</div></div>
    <div class="guided-action-copy"><p><strong>Why this appears:</strong> ${esc(item.why)}</p><p><strong>Recommended next step:</strong> ${esc(item.nextStep)}</p><p class="muted-note"><strong>Evidence:</strong> ${esc(item.evidence)}</p></div>
    ${compact ? '' : `<div class="guided-plan-form">
      <label for="${fieldPrefix}_status">Checklist status<select id="${fieldPrefix}_status" class="plan-status">${statusOptions(state.status)}</select></label>
      <label for="${fieldPrefix}_owner">Owner<input id="${fieldPrefix}_owner" class="plan-owner" maxlength="80" value="${esc(state.owner)}" placeholder="Household or person"></label>
      <label for="${fieldPrefix}_date">Target date<input id="${fieldPrefix}_date" class="plan-date" type="date" value="${esc(state.targetDate)}"></label>
      <label class="guided-notes" for="${fieldPrefix}_notes">Planning notes<textarea id="${fieldPrefix}_notes" class="plan-notes" rows="2" maxlength="800" placeholder="Decision, dependency, or follow-up">${esc(state.notes)}</textarea></label>
    </div><div class="button-row"><button class="btn primary" data-save-plan="${esc(item.id)}">Save Plan Item</button><button class="btn secondary" data-plan-open data-plan-tab="${esc(item.destination.tab)}" data-plan-section="${esc(item.destination.section || '')}">${esc(item.destination.label)}</button></div>`}
  </article>`;
}

function currentResolved(model) {
  if (!model.resolved.length) return '';
  return `<details class="card resolved-plan-items"><summary>Resolved current items (${model.resolved.length})</summary><div class="guided-action-list">${model.resolved.map((item) => actionCard(item)).join('')}</div></details>`;
}

function recentResolved(model) {
  if (!model.recentResolved.length) return '';
  return `<article class="card"><div class="section-title-row"><div><h3>Recently resolved items no longer generated</h3><p>These items disappeared from the current checklist because the underlying condition changed.</p></div><div class="section-meta">${model.recentResolved.length}</div></div><div class="table-wrap"><table class="ledger"><thead><tr><th>Area</th><th>Item</th><th>Status</th><th>Owner</th><th>Target</th><th>Updated</th></tr></thead><tbody>${model.recentResolved.map((item) => `<tr><td>${esc(item.area || 'Planning')}</td><td>${esc(item.title || item.id)}</td><td>${esc(STATUS_LABELS[item.status] || item.status)}</td><td>${esc(item.owner || '—')}</td><td>${esc(item.targetDate || '—')}</td><td>${item.updatedAt ? esc(new Date(item.updatedAt).toLocaleString()) : '—'}</td></tr>`).join('')}</tbody></table></div></article>`;
}

function historyTable() {
  const history = guidedPlanData().history.slice(0, 30);
  return `<article class="card"><div class="section-title-row"><div><h3>Planning decision history</h3><p>Only explicit checklist saves create history. Transaction and account data are not copied here.</p></div><div class="section-meta">${history.length} recent</div></div>${history.length ? `<div class="table-wrap"><table class="ledger"><thead><tr><th>Recorded</th><th>Area</th><th>Item</th><th>Change</th><th>Owner</th><th>Target</th><th>Notes</th></tr></thead><tbody>${history.map((entry) => `<tr><td>${esc(new Date(entry.recordedAt).toLocaleString())}</td><td>${esc(entry.area)}</td><td>${esc(entry.title)}</td><td>${esc(STATUS_LABELS[entry.fromStatus] || entry.fromStatus)} → ${esc(STATUS_LABELS[entry.toStatus] || entry.toStatus)}</td><td>${esc(entry.owner || '—')}</td><td>${esc(entry.targetDate || '—')}</td><td>${esc(entry.notes || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p>No planning decision has been saved yet.</p>'}</article>`;
}

export function guidedPlanningView(model = guidedPlanModel()) {
  return `<section class="section active guided-planning-page"><div class="section-title-row"><div><h2>Guided Household Plan</h2><p>Turn local goals, close readiness, cash pressure, debt priorities, and Household Insights into an explainable checklist.</p></div><div class="section-meta">${esc(model.month)}</div></div>${compactMonthNavigator()}
    <div class="kpi-grid guided-plan-kpis"><article class="kpi"><strong>${model.counts.urgent}</strong><span>Urgent open</span></article><article class="kpi"><strong>${model.counts.high}</strong><span>High open</span></article><article class="kpi"><strong>${model.counts.open}</strong><span>Total open</span></article><article class="kpi"><strong>${model.counts.percentResolved}%</strong><span>Current resolved</span></article></div>
    <article class="card guided-plan-overview"><div class="grid two"><div class="summary-box compact">Generated actions: ${model.counts.total}\nNot started: ${model.counts.notStarted}\nPlanned: ${model.counts.planned}\nDone: ${model.counts.done}\nDismissed: ${model.counts.dismissed}</div><div class="summary-box compact">Selected month: ${esc(model.month)}\nPlanning storage: ${esc(model.storageKey)}\nAutomatic writes: none\nTransaction changes: none\nRemote processing: none</div></div><p class="muted-note">A recommendation is not marked planned, done, or dismissed until Save Plan Item is selected. Owner, target date, notes, and status stay separate from the vault.</p></article>
    <div class="section-title-row subsection-heading"><div><h3>Open checklist</h3><p>Urgent and high-priority items appear first. Every item shows the data condition that generated it.</p></div><div class="section-meta">${model.active.length}</div></div>
    <div class="guided-action-list">${model.active.map((item) => actionCard(item)).join('') || '<article class="card"><h3>No open generated item</h3><p>Every current checklist item is resolved. Review the recently resolved section and the next household meeting date.</p></article>'}</div>
    ${currentResolved(model)}${recentResolved(model)}${historyTable()}
    <article class="card methodology-card"><h3>How Guided Planning works</h3><ul>${model.methodology.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><p class="muted-note">Generated ${esc(new Date(model.generatedAt).toLocaleString())}.</p></article>
  </section>`;
}

export function guidedPlanReportPage(model = guidedPlanModel()) {
  const open = model.active.slice(0, 12);
  return `<section class="printable-report report-page guided-plan-report"><div class="section-title-row"><div><h2>Guided household plan</h2><p>Explainable action checklist for ${esc(model.month)}. Checklist state is separate from transactions and planning calculations.</p></div><div class="section-meta">${model.counts.open} open</div></div><div class="report-metrics"><span><strong>${model.counts.urgent}</strong> Urgent</span><span><strong>${model.counts.high}</strong> High</span><span><strong>${model.counts.planned}</strong> Planned</span><span><strong>${model.counts.percentResolved}%</strong> Resolved</span></div><div class="guided-report-list">${open.map((item, index) => `<article class="card"><div class="guided-report-number">${index + 1}</div><div><h3>${esc(item.title)}</h3><p><strong>${esc(PRIORITY_LABELS[item.priority])} · ${esc(item.area)}</strong></p><p>${esc(item.why)}</p><p><strong>Next:</strong> ${esc(item.nextStep)}</p><p><strong>Plan:</strong> ${esc(STATUS_LABELS[item.state.status])}${item.state.owner ? ` · ${esc(item.state.owner)}` : ''}${item.state.targetDate ? ` · ${esc(item.state.targetDate)}` : ''}</p>${item.state.notes ? `<p><strong>Notes:</strong> ${esc(item.state.notes)}</p>` : ''}</div></article>`).join('') || '<article class="card"><p>No open generated planning item remains.</p></article>'}</div><article class="card"><h3>Method</h3><ul>${model.methodology.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article></section>`;
}
