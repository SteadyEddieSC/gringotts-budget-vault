import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV122 } from './reporting.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';
import { ACCOUNT_CLEANUP_PLAN_KEY, sanitizeCleanupPlan } from './account-cleanup-model.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let cleanupPromise = null;
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
  if (typeof value !== 'function') throw new Error(`v122 feature dependency is not ready: ${name}`);
  return value;
}

function installCss() {
  if (cssInstalled) return;
  cssInstalled = true;
  if (!document.querySelector('link[data-v120-styles]')) {
    const inherited = document.createElement('link');
    inherited.rel = 'stylesheet';
    inherited.href = 'styles/v120.css?v=122cleanup1';
    inherited.dataset.v120Styles = 'true';
    document.head.append(inherited);
  }
  if (!document.querySelector('link[data-v121-styles]')) {
    const inherited = document.createElement('link');
    inherited.rel = 'stylesheet';
    inherited.href = 'styles/v121.css?v=122cleanup1';
    inherited.dataset.v121Styles = 'true';
    document.head.append(inherited);
  }
  if (!document.querySelector('link[data-v122-styles]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/v122.css?v=122cleanup1';
    link.dataset.v122Styles = 'true';
    document.head.append(link);
  }
}

function loadAccountCleanupFeatures() {
  installCss();
  if (!cleanupPromise) {
    cleanupPromise = import('./account-cleanup.js?v=122cleanup1')
      .then((module) => {
        module.installAccountCleanupFeatures();
        return module;
      })
      .catch((error) => {
        cleanupPromise = null;
        throw error;
      });
  }
  return cleanupPromise;
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

function cleanupPlanCount() {
  try {
    return sanitizeCleanupPlan(JSON.parse(localStorage.getItem(ACCOUNT_CLEANUP_PLAN_KEY) || '{}')).decisions.length;
  } catch {
    return 0;
  }
}

function downloadBackupV122() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v122_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV122Download(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v122_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV122(getMonth(), model)));
    announce('37-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v122_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v122_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV122();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v122_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v122_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const runtime = window.GringottsCleanRuntime;
  const cleanup = window.GringottsV122?.accountCleanupAnalysis?.();
  downloadJson(`Gringotts_v122_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: {
      count: importHistory().length,
      receiptIntegrityAvailable: true,
      automaticRepairAvailable: false,
      automaticRollbackAvailable: false
    },
    accountCleanup: {
      storageKey: ACCOUNT_CLEANUP_PLAN_KEY,
      accountCount: cleanup?.inventory?.length || 0,
      candidateCount: cleanup?.candidates?.length || 0,
      decisionCount: cleanupPlanCount(),
      unresolvedCount: cleanup?.plan?.status?.unresolved || 0,
      automaticMergeAvailable: false,
      transactionWriteAvailable: false,
      transactionCopiesStored: false,
      balancesStored: false,
      fullIdentifiersStored: false
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
      release: 'v122',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      importRestoreTasks: 2,
      accountCleanupPlanningSurfaces: 1
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
  return true;
}

function installDownloadOverrides() {
  if (downloadOverridesInstalled) return;
  downloadOverridesInstalled = true;
  document.addEventListener('click', handleV122Download, true);
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
    roadmapList(entry.status === 'current' ? 'Delivered capabilities' : 'Planned capabilities', entry.scope),
    roadmapList('Depends on', entry.dependencies),
    roadmapList('Safety boundaries', entry.safeguards)
  );
  const outcome = element('div', 'roadmap-outcome');
  outcome.append(element('strong', '', 'Expected household outcome'), element('p', '', entry.outcome));
  card.append(row, notes, outcome);
  return card;
}

function enhanceRoadmap(root) {
  const section = [...root.querySelectorAll('.section.active')]
    .find((candidate) => candidate.querySelector('h2')?.textContent?.trim() === 'Roadmap');
  if (!section || section.dataset.v122RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  section.dataset.v120RoadmapEnhanced = 'true';
  section.dataset.v121RoadmapEnhanced = 'true';
  section.dataset.v122RoadmapEnhanced = 'true';
  section.classList.add('v120-roadmap-page', 'v121-roadmap-page', 'v122-roadmap-page');
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'A detailed release horizon with delivered capabilities, dependencies, safety boundaries, and expected household outcomes.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);
  [...section.children].forEach((child) => { if (child !== titleRow) child.remove(); });
  const note = element('div', 'note warning-note roadmap-horizon-note', 'The next release is the strongest commitment. Later releases are a directional planning horizon and may move when real household use, testing, or safety findings show a better order.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceToolsPage(page) {
  const titleRow = page.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('h2'), 'Import & Restore');
  setText(titleRow?.querySelector('p'), 'Plan account-label cleanup, review receipt integrity, import missing transactions, or use the separate full-vault restore task.');
  setText(titleRow?.querySelector('.section-meta'), 'Local planning · guarded writes');
  window.GringottsV121?.enhanceReceiptTimeline?.(page);
  if (page.querySelector('.account-cleanup-card')) return;
  loadAccountCleanupFeatures()
    .then((module) => module.enhanceAccountCleanup(page))
    .catch((error) => announce(error?.message || 'Account cleanup planning could not be loaded'));
}

function enhanceReports(root) {
  const button = root.querySelector('#vaultXlsx');
  const card = button?.closest('.report-option');
  if (!card) return;
  setText(card.querySelector('h3'), '37-sheet Vault Workbook');
  setText(card.querySelector('p'), 'Includes the existing 33 sheets plus receipt lineage, account inventory, and cleanup-planning visibility.');
  let list = card.querySelector('.v122-workbook-sheet-list');
  if (!list) {
    list = element('ul', 'v122-workbook-sheet-list');
    list.append(
      element('li', '', 'Receipt Integrity'),
      element('li', '', 'Batch Lineage'),
      element('li', '', 'Account Inventory'),
      element('li', '', 'Account Cleanup Plan')
    );
    button.before(list);
  }
  setText(button, 'Download 37-sheet Workbook');
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Account Cleanup & Merge Planning v122'));
  const toolsPage = root.querySelector('.v116-import-page, .v115-import-page');
  if (toolsPage) enhanceToolsPage(toolsPage);
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

export function prepareV122Interceptors() {
  const registry = window.GringottsV122 || (window.GringottsV122 = {});
  registry.release = 'v122';
  installDownloadOverrides();
  return loadAccountCleanupFeatures();
}

export function activateV122() {
  Object.assign(BUILD, {
    version: 'v122',
    name: 'Account Cleanup & Merge Planning',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115 + v118 portability + v119 diagnostics + v120 audit + v121 receipt lineage + v122 account cleanup planning',
    cacheBust: '122cleanup1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV122 || (window.GringottsV122 = {});
  Object.assign(registry, {
    release: 'v122',
    enhance: enhanceMain,
    loadAccountCleanupFeatures,
    roadmapHorizon: ROADMAP_HORIZON,
    expandedWorkbookSheetsV122
  });
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.reports = {
      ...(window.GringottsCleanRuntime.reports || {}),
      expandedWorkbookSheetsV122
    };
  }
  return BUILD;
}
