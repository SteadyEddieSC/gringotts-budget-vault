import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV115 } from '../v115/reporting.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let receiptPromise = null;
let handlersInstalled = false;
let downloadOverridesInstalled = false;
let enhancementScheduled = false;
let cssInstalled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function requiredFeature(name) {
  const value = window.GringottsV115?.[name];
  if (typeof value !== 'function') throw new Error(`v120 feature dependency is not ready: ${name}`);
  return value;
}

function installCss() {
  if (cssInstalled || document.querySelector('link[data-v120-styles]')) return;
  cssInstalled = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/v120.css?v=120receipts1';
  link.dataset.v120Styles = 'true';
  document.head.append(link);
}

function loadReceiptFeatures() {
  installCss();
  if (!receiptPromise) {
    receiptPromise = import('./import-receipt-audit.js?v=120receipts1')
      .then((module) => {
        module.installReceiptAuditFeatures();
        return module;
      })
      .catch((error) => {
        receiptPromise = null;
        throw error;
      });
  }
  return receiptPromise;
}

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function familyMeetingMarkdown(model) {
  return requiredFeature('familyMeetingMarkdownV114')(model);
}

function guidedPlanMarkdown(plan) {
  return requiredFeature('guidedPlanMarkdownV114')(plan);
}

function importHistory() {
  return requiredFeature('importHistory')();
}

function downloadBackupV120() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v120_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV120Download(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v120_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV115(getMonth(), model)));
    announce('33-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v120_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v120_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV120();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v120_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v120_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v120_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: {
      count: importHistory().length,
      auditAvailable: true,
      automaticRollbackAvailable: false,
      transactionCopiesStored: false
    },
    importProfiles: {
      storageKey: 'gringottsImportProfiles.v1',
      revisionHistoryKey: 'gringottsImportProfileRevisions.v1',
      transactionCopiesStored: false
    },
    roadmap: {
      current: ROADMAP_HORIZON[0].version,
      horizonThrough: ROADMAP_HORIZON.at(-1).version,
      releasesVisible: ROADMAP_HORIZON.length
    },
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open
    },
    uiArchitecture: {
      release: 'v120',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      importRestoreTasks: 2
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
  return true;
}

function installV120DownloadOverrides() {
  if (downloadOverridesInstalled) return;
  downloadOverridesInstalled = true;
  document.addEventListener('click', handleV120Download, true);
}

function roadmapList(title, values) {
  const section = element('section', 'roadmap-note-section');
  section.append(element('h4', '', title));
  const list = element('ul');
  values.forEach((value) => list.append(element('li', '', value)));
  section.append(list);
  return section;
}

function roadmapCard(entry) {
  const article = element('article', `card roadmap-horizon-card ${entry.status}`);
  const row = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h3', '', `${entry.version} — ${entry.title}`),
    element('p', '', entry.purpose)
  );
  row.append(intro, element('div', 'section-meta', entry.status === 'current' ? 'Current release' : 'Planned'));
  article.append(row);

  const notes = element('div', 'roadmap-notes-grid');
  notes.append(
    roadmapList('Planned capabilities', entry.scope),
    roadmapList('Depends on', entry.dependencies),
    roadmapList('Safety boundaries', entry.safeguards)
  );
  article.append(notes);
  const outcome = element('div', 'roadmap-outcome');
  outcome.append(element('strong', '', 'Expected outcome'), element('p', '', entry.outcome));
  article.append(outcome);
  return article;
}

function enhanceRoadmap(root) {
  const section = [...root.querySelectorAll('.section.active')]
    .find((candidate) => candidate.querySelector('h2')?.textContent?.trim() === 'Roadmap');
  if (!section || section.dataset.v120RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  section.dataset.v120RoadmapEnhanced = 'true';
  section.classList.add('v120-roadmap-page');

  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'A detailed release horizon with capabilities, dependencies, safety boundaries, and expected household outcomes.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);

  [...section.children].forEach((child) => {
    if (child !== titleRow) child.remove();
  });
  const note = element('div', 'note warning-note roadmap-horizon-note', 'The next release is the strongest commitment. Later releases are a planning horizon and may move as real household use, testing, or safety findings change priorities.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceImportPage(page) {
  const titleRow = page.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('h2'), 'Import & Restore');
  setText(titleRow?.querySelector('p'), 'Audit prior receipts, compare profile revisions, prepare metadata-only dry runs, import reviewed missing rows, or use the separate full restore task.');
  setText(titleRow?.querySelector('.section-meta'), 'Receipt-audited local workflow');
  loadReceiptFeatures()
    .then((module) => module.enhanceReceiptAudit(page))
    .catch((error) => announce(error?.message || 'Import receipt audit could not be loaded'));
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Import Receipt Audit & Rollback Guidance v120'));
  const importPage = root.querySelector('.v116-import-page, .v115-import-page');
  if (importPage) enhanceImportPage(importPage);
  enhanceRoadmap(root);
}

function scheduleEnhancement() {
  if (enhancementScheduled) return;
  enhancementScheduled = true;
  queueMicrotask(() => {
    enhancementScheduled = false;
    enhanceMain();
  });
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
}

export function prepareV120Interceptors() {
  installV120DownloadOverrides();
}

export function activateV120() {
  Object.assign(BUILD, {
    version: 'v120',
    name: 'Import Receipt Audit & Rollback Guidance',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115 + v118 portability + v119 diagnostics + v120 receipt audit',
    cacheBust: '120receipts1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  installHandlers();
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV120 || (window.GringottsV120 = {});
  Object.assign(registry, {
    release: 'v120',
    enhance: enhanceMain,
    loadReceiptFeatures,
    roadmapHorizon: ROADMAP_HORIZON
  });
  return BUILD;
}
