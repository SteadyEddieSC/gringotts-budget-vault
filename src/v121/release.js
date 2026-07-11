import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV121 } from './reporting.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';
import { IMPORT_BATCH_INDEX_KEY, sanitizeBatchIndex } from './receipt-integrity-model.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let integrityPromise = null;
let downloadOverridesInstalled = false;
let enhancementScheduled = false;
let cssInstalled = false;

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
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
  if (typeof value !== 'function') throw new Error(`v121 feature dependency is not ready: ${name}`);
  return value;
}

function v122OwnsPresentation() {
  return window.GringottsV122?.release === 'v122';
}

function installCss() {
  if (cssInstalled) return;
  cssInstalled = true;
  if (!document.querySelector('link[data-v120-styles]')) {
    const inherited = document.createElement('link');
    inherited.rel = 'stylesheet';
    inherited.href = 'styles/v120.css?v=121batch1';
    inherited.dataset.v120Styles = 'true';
    document.head.append(inherited);
  }
  if (!document.querySelector('link[data-v121-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/v121.css?v=121batch1';
    link.dataset.v121Styles = 'true';
    document.head.append(link);
  }
}

function loadIntegrityFeatures() {
  installCss();
  if (!integrityPromise) {
    integrityPromise = import('./receipt-integrity.js?v=121batch1')
      .then((module) => {
        module.installReceiptIntegrityFeatures();
        return module;
      })
      .catch((error) => {
        integrityPromise = null;
        throw error;
      });
  }
  return integrityPromise;
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

function batchIndexCount() {
  try {
    return sanitizeBatchIndex(JSON.parse(localStorage.getItem(IMPORT_BATCH_INDEX_KEY) || '{"links":[]}')).links.length;
  } catch {
    return 0;
  }
}

function downloadBackupV121() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v121_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV121Download(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v121_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV121(getMonth(), model)));
    announce('35-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v121_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v121_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV121();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v121_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v121_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const runtime = window.GringottsCleanRuntime;
  const timeline = window.GringottsV121?.buildReceiptTimeline?.();
  downloadJson(`Gringotts_v121_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: {
      count: importHistory().length,
      timelineAvailable: true,
      integritySummary: timeline?.summary || null,
      automaticRepairAvailable: false,
      automaticRollbackAvailable: false,
      transactionCopiesStored: false
    },
    importBatchIndex: {
      storageKey: IMPORT_BATCH_INDEX_KEY,
      linkCount: batchIndexCount(),
      transactionCopiesStored: false,
      filenamesStored: false,
      fingerprintsStored: false,
      destinationKeysStored: false
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
      release: 'v121',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      importRestoreTasks: 2
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
  return true;
}

function installDownloadOverrides() {
  if (downloadOverridesInstalled) return;
  downloadOverridesInstalled = true;
  document.addEventListener('click', handleV121Download, true);
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
  const card = element('article', `card roadmap-horizon-card ${entry.status}`);
  const row = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(element('h3', '', `${entry.version} — ${entry.title}`), element('p', '', entry.purpose));
  row.append(intro, element('div', 'section-meta', entry.status === 'current' ? 'Current release' : 'Planned'));
  const notes = element('div', 'roadmap-notes-grid');
  notes.append(
    roadmapList('Planned capabilities', entry.scope),
    roadmapList('Depends on', entry.dependencies),
    roadmapList('Safety boundaries', entry.safeguards)
  );
  const outcome = element('div', 'roadmap-outcome');
  outcome.append(element('strong', '', 'Expected outcome'), element('p', '', entry.outcome));
  card.append(row, notes, outcome);
  return card;
}

function enhanceRoadmap(root) {
  const section = [...root.querySelectorAll('.section.active')]
    .find((candidate) => candidate.querySelector('h2')?.textContent?.trim() === 'Roadmap');
  if (!section || section.dataset.v121RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  section.dataset.v120RoadmapEnhanced = 'true';
  section.dataset.v121RoadmapEnhanced = 'true';
  section.classList.add('v120-roadmap-page', 'v121-roadmap-page');
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'A detailed release horizon with capabilities, dependencies, safety boundaries, and expected household outcomes.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);
  [...section.children].forEach((child) => { if (child !== titleRow) child.remove(); });
  const note = element('div', 'note warning-note roadmap-horizon-note', 'The next release is the strongest commitment. Later releases are a planning horizon and may move as real household use, testing, or safety findings change priorities.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceImportPage(page) {
  const titleRow = page.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('h2'), 'Import & Restore');
  setText(titleRow?.querySelector('p'), 'Review receipt integrity and batch continuity, compare profile revisions, prepare metadata-only dry runs, import reviewed missing rows, or use the separate full restore task.');
  setText(titleRow?.querySelector('.section-meta'), 'Receipt lineage · local only');
  loadIntegrityFeatures()
    .then((module) => module.enhanceReceiptTimeline(page))
    .catch((error) => announce(error?.message || 'Receipt integrity timeline could not be loaded'));
}

function enhanceReports(root) {
  const button = root.querySelector('#vaultXlsx');
  const card = button?.closest('.report-option');
  if (!card) return;
  setText(card.querySelector('h3'), '35-sheet Vault Workbook');
  setText(card.querySelector('p'), 'Includes all existing reporting sheets plus two receipt-lineage additions.');
  let list = card.querySelector('.v121-workbook-sheet-list');
  if (!list) {
    list = element('ul', 'v121-workbook-sheet-list');
    list.append(element('li', '', 'Receipt Integrity'), element('li', '', 'Batch Lineage'));
    button.before(list);
  }
  setText(button, 'Download 35-sheet Workbook');
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root || v122OwnsPresentation()) return;
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Receipt Integrity & Import Batch Reconciliation v121'));
  const importPage = root.querySelector('.v116-import-page, .v115-import-page');
  if (importPage) enhanceImportPage(importPage);
  enhanceReports(root);
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

export function prepareV121Interceptors() {
  const registry = window.GringottsV121 || (window.GringottsV121 = {});
  registry.release = 'v121';
  installDownloadOverrides();
  return loadIntegrityFeatures();
}

export function activateV121() {
  Object.assign(BUILD, {
    version: 'v121',
    name: 'Receipt Integrity & Import Batch Reconciliation',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115 + v118 portability + v119 diagnostics + v120 audit + v121 receipt lineage',
    cacheBust: '121batch1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV121 || (window.GringottsV121 = {});
  Object.assign(registry, {
    release: 'v121',
    enhance: enhanceMain,
    loadIntegrityFeatures,
    roadmapHorizon: ROADMAP_HORIZON,
    expandedWorkbookSheetsV121
  });
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.reports = {
      ...(window.GringottsCleanRuntime.reports || {}),
      expandedWorkbookSheetsV121
    };
  }
  return BUILD;
}
