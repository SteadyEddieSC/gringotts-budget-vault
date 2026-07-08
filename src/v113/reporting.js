import {
  best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import {
  expandedWorkbookSheetsV111, familyMeetingMarkdownV111, householdReportModel
} from '../v111/reporting.js';
import { buildHouseholdInsights } from './insights.js';

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function insightsForModel(model) {
  return buildHouseholdInsights({
    rows: model.currentRows,
    start: model.settings.start,
    end: model.settings.end,
    label: model.label
  });
}

function markdownList(values, emptyText) {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : `- ${emptyText}`;
}

export function familyMeetingMarkdownV113(model = householdReportModel()) {
  const insights = insightsForModel(model);
  const base = familyMeetingMarkdownV111(model);
  return `${base}\n## Household Insights\n- Unusual-spending signals: ${insights.counts.unusual}\n- High-attention signals: ${insights.counts.high}\n- Recurring-cost review items: ${insights.counts.recurring}\n- Approximate annualized recurring increases: ${insights.annualizedIncrease.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}\n\n### Explainable signals\n${markdownList(insights.signals.slice(0, 12).map((item) => `${item.title}: ${item.summary} Method: ${item.method}`), 'No threshold-based unusual-spending signal was generated.')}\n\n### Recurring-cost opportunities\n${markdownList(insights.recurring.slice(0, 12).map((item) => `${item.name}: ${item.explanation}`), 'No recurring-cost review item met the current thresholds.')}\n\n### Questions to decide together\n${markdownList(insights.prompts.map((item) => item.question), 'No additional insight question was generated.')}\n\n### Methodology\n${markdownList(insights.methodology, 'No methodology details were generated.')}\n`;
}

export function insightSheetsV113(model = householdReportModel()) {
  const insights = insightsForModel(model);
  return [
    {
      name: 'Household Insights',
      rows: [
        ['Household Insights IV', insights.label],
        ['Generated', insights.generatedAt],
        ['Selected Start', insights.start],
        ['Selected End', insights.end],
        ['Comparison Start', insights.comparisonStart],
        ['Comparison End', insights.comparisonEnd],
        ['Merchant History Start', insights.historyStart],
        ['Merchant History End', insights.historyEnd],
        ['Unusual Signals', insights.counts.unusual],
        ['High Attention', insights.counts.high],
        ['Pending Excluded', insights.counts.pending],
        [],
        ['Severity', 'Type', 'Title', 'Selected Amount', 'Baseline Amount', 'Delta', 'Factor', 'Baseline Rows', 'Date', 'Merchant', 'Category', 'Account', 'Owner', 'Method'],
        ...insights.signals.map((item) => [item.severity, item.type, item.title, item.amount, item.baselineAmount, item.delta, item.factor ?? '', item.baselineCount, item.date, item.merchant, item.category, item.account, item.owner, item.method]),
        [],
        ['Decision Questions'],
        ...insights.prompts.map((item) => [item.question, item.reason, item.source]),
        [],
        ['Methodology'],
        ...insights.methodology.map((item) => [item])
      ]
    },
    {
      name: 'Recurring Opportunities',
      rows: [
        ['Merchant', 'Category', 'Status', 'Review Type', 'Occurrences', 'Months', 'Latest Date', 'Latest Amount', 'Previous Amount', 'Average', 'Annual Footprint', 'Annualized Increase', 'Explanation', 'Decision Question'],
        ...insights.recurring.map((item) => [item.name, item.category, item.status, item.kind, item.occurrences, item.months, item.latestDate, item.latestAmount, item.previousAmount, item.average, item.annualCost, item.annualIncrease, item.explanation, item.question])
      ]
    }
  ];
}

export function expandedWorkbookSheetsV113(month = getMonth(), model = householdReportModel()) {
  return [...expandedWorkbookSheetsV111(month, model), ...insightSheetsV113(model)];
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function downloadBackupV113() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v113_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV113Download(event) {
  const button = event.target.closest?.('button');
  if (!button) return;
  const id = button.id;
  if (!['vaultXlsx', 'meetingMd', 'exportBackup', 'importBackup', 'backupRules', 'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'].includes(id)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v113_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV113(getMonth(), model)));
    announce('30-sheet Vault Workbook downloaded');
    return;
  }
  if (id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v113_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdownV113(model), 'text/markdown');
    announce('Household Insights meeting pack downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(id)) {
    downloadBackupV113();
    return;
  }
  if (id === 'exportRules') {
    downloadJson(`Gringotts_v113_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (id === 'exportIcs' || id === 'downloadIcs') {
    download(`Gringotts_v113_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return;
  }
  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v113_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
}

let installed = false;
export function installV113DownloadOverrides() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', handleV113Download, true);
}
