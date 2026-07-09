import {
  best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import {
  expandedWorkbookSheetsV114, familyMeetingMarkdownV114, guidedPlanMarkdownV114
} from '../v114/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { importHistory } from './bank-import.js';

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

export function importReceiptSheetV115() {
  const history = importHistory();
  return {
    name: 'Import Receipts',
    rows: [
      ['Imported At', 'Source Filename', 'Format', 'Detected Schema', 'Confidence', 'Encoding', 'Coverage Start', 'Coverage End', 'Incoming', 'Exact Duplicates', 'Fuzzy Candidates', 'Inserted', 'Skipped', 'Destination', 'Before', 'After', 'Verification', 'Warnings', 'Sign Mode', 'Date Order', 'Mapping Summary', 'Source Fingerprint'],
      ...history.map((entry) => [
        entry.timestamp,
        entry.sourceFilename,
        entry.format || 'json',
        entry.detectedSchema || entry.source || 'Legacy import',
        entry.schemaConfidence || '',
        entry.encoding || '',
        entry.earliestDate,
        entry.latestDate,
        entry.transactionCount,
        entry.exactDuplicates,
        entry.fuzzyCandidates,
        entry.insertedCount,
        entry.skippedCount,
        entry.selectedDestinationVault,
        entry.destinationBeforeCount,
        entry.destinationAfterCount,
        entry.verificationResult,
        entry.warningCount ?? '',
        entry.signMode || '',
        entry.dateOrder || '',
        entry.mappingSummary || '',
        entry.sourceFingerprint || ''
      ])
    ]
  };
}

export function expandedWorkbookSheetsV115(month = getMonth(), model = householdReportModel()) {
  return [...expandedWorkbookSheetsV114(month, model), importReceiptSheetV115()];
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function downloadBackupV115() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v115_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV115Download(event) {
  const button = event.target.closest?.('button');
  if (!button) return;
  const id = button.id;
  if (!['vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules', 'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'].includes(id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v115_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV115(getMonth(), model)));
    announce('33-sheet Vault Workbook downloaded');
    return;
  }
  if (id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v115_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdownV114(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return;
  }
  if (id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v115_${plan.month}_${stamp()}.md`, guidedPlanMarkdownV114(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(id)) {
    downloadBackupV115();
    return;
  }
  if (id === 'exportRules') {
    downloadJson(`Gringotts_v115_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (id === 'exportIcs' || id === 'downloadIcs') {
    download(`Gringotts_v115_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return;
  }
  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v115_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: importHistory().length,
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
}

let installed = false;
export function installV115DownloadOverrides() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', handleV115Download, true);
}
