import { esc } from '../v103/core.js';
export { calendarView, diagnosticsView, exportsView, importView, rulesView } from '../v104/views-admin.js';

export const roadmap = [
  ['v106', 'Calendar & Cash-Flow II', 'month/week/day calendar, clickable day detail, bills, paydays, and cash-flow warnings'],
  ['v107', 'Review Queue II', 'mobile review, guarded edits, rule suggestions, and safe batch review'],
  ['v108', 'Goals & Vault Health', 'goals, sinking funds, score history, and actionable recommendations'],
  ['v109', 'Import Memory & Duplicate Guard', 'exact/fuzzy duplicate protection, import history, and date-gap warnings'],
  ['v110', 'Month Close & Forecasting', 'reconciliation, close snapshots, household forecast, debt, and promotional APR planning']
];

export function roadmapView() {
  return `<section class="section active"><div class="section-title-row"><div><h2>Roadmap</h2><p>Planned releases after v105 Bills, Recurring & Budget Intelligence.</p></div><div class="section-meta">Next: v106</div></div><article class="roadmap-item shipped"><h3>v105 — Bills, Recurring & Budget Intelligence</h3><p>Category budgets, budget-versus-actual tracking, recurring-charge confirmation and exclusion, amount-change alerts, six-month spending trends, tuning guidance, and an expanded Vault Workbook.</p></article><div class="roadmap">${roadmap.map((item) => `<article class="roadmap-item"><h3>${esc(item[0])} — ${esc(item[1])}</h3><p>${esc(item[2])}</p></article>`).join('')}</div></section>`;
}
