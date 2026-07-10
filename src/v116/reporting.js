import {
  best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV115 } from '../v115/reporting.js';

function requiredFeature(name) {
  const value = window.GringottsV115?.[name];
  if (typeof value !== 'function') throw new Error(`v116 feature dependency is not ready: ${name}`);
  return value;
}

function importHistory() {
  return requiredFeature('importHistory')();
}

function familyMeetingMarkdown(model) {
  return requiredFeature('familyMeetingMarkdownV114')(model);
}

function guidedPlanMarkdown(plan) {
  return requiredFeature('guidedPlanMarkdownV114')(plan);
}

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function downloadBackupV116() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v116_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV116Download(event) {
  const button = event.target.closest?.('button');
  if (!button) return;
  const id = button.id;
  if (!['vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules', 'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'].includes(id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v116_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV115(getMonth(), model)));
    announce('33-sheet Vault Workbook downloaded');
    return;
  }
  if (id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v116_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return;
  }
  if (id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v116_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(id)) {
    downloadBackupV116();
    return;
  }
  if (id === 'exportRules') {
    downloadJson(`Gringotts_v116_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (id === 'exportIcs' || id === 'downloadIcs') {
    download(`Gringotts_v116_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return;
  }

  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v116_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: importHistory().length,
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open
    },
    uiArchitecture: {
      release: 'v116',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      importRestoreTasks: 2
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
}

let installed = false;
export function installV116DownloadOverrides() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', handleV116Download, true);
}
