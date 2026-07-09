import {
  best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { expandedWorkbookSheetsV113, familyMeetingMarkdownV113 } from '../v113/reporting.js';
import { guidedPlanModel, guidedPlanningSheetsV114 } from './planning.js';

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function markdownList(values, emptyText = 'No item was generated.') {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : `- ${emptyText}`;
}

export function guidedPlanMarkdownV114(plan = guidedPlanModel()) {
  return `# Gringotts Guided Household Plan — ${plan.month}\n\nGenerated: ${plan.generatedAt}\n\n## Checklist summary\n- Open items: ${plan.counts.open}\n- Urgent open: ${plan.counts.urgent}\n- High open: ${plan.counts.high}\n- Planned: ${plan.counts.planned}\n- Done: ${plan.counts.done}\n- Dismissed: ${plan.counts.dismissed}\n- Current resolved: ${plan.counts.percentResolved}%\n\n## Open actions\n${markdownList(plan.active.map((item, index) => `${index + 1}. [${item.priority.toUpperCase()}] ${item.title} — ${item.why} Next: ${item.nextStep} Status: ${item.state.status}${item.state.owner ? `; owner ${item.state.owner}` : ''}${item.state.targetDate ? `; target ${item.state.targetDate}` : ''}${item.state.notes ? `; notes ${item.state.notes}` : ''}`), 'No open generated planning item remains.')}\n\n## Resolved current actions\n${markdownList(plan.resolved.map((item) => `${item.title}: ${item.state.status}${item.state.owner ? `; owner ${item.state.owner}` : ''}${item.state.notes ? `; notes ${item.state.notes}` : ''}`), 'No current generated item is resolved.')}\n\n## Methodology\n${markdownList(plan.methodology)}\n`;
}

export function familyMeetingMarkdownV114(model = householdReportModel(), plan = guidedPlanModel()) {
  const base = familyMeetingMarkdownV113(model);
  return `${base}\n## Guided Household Plan\n- Open items: ${plan.counts.open}\n- Urgent open: ${plan.counts.urgent}\n- High open: ${plan.counts.high}\n- Planned: ${plan.counts.planned}\n- Current resolved: ${plan.counts.percentResolved}%\n\n### Priority actions\n${markdownList(plan.active.slice(0, 12).map((item) => `[${item.priority.toUpperCase()}] ${item.title}: ${item.nextStep}${item.state.owner ? ` Owner: ${item.state.owner}.` : ''}${item.state.targetDate ? ` Target: ${item.state.targetDate}.` : ''}`), 'No open generated planning item remains.')}\n`;
}

export function expandedWorkbookSheetsV114(month = getMonth(), model = householdReportModel()) {
  return [...expandedWorkbookSheetsV113(month, model), ...guidedPlanningSheetsV114(month)];
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function downloadBackupV114() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v114_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV114Download(event) {
  const button = event.target.closest?.('button');
  if (!button) return;
  const id = button.id;
  if (!['vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules', 'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'].includes(id)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v114_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV114(getMonth(), model)));
    announce('32-sheet Vault Workbook downloaded');
    return;
  }
  if (id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v114_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdownV114(model), 'text/markdown');
    announce('Guided household meeting pack downloaded');
    return;
  }
  if (id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v114_${plan.month}_${stamp()}.md`, guidedPlanMarkdownV114(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(id)) {
    downloadBackupV114();
    return;
  }
  if (id === 'exportRules') {
    downloadJson(`Gringotts_v114_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (id === 'exportIcs' || id === 'downloadIcs') {
    download(`Gringotts_v114_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return;
  }
  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v114_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
}

let installed = false;
export function installV114DownloadOverrides() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', handleV114Download, true);
}
