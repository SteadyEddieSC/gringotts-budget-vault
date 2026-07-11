import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import {
  expandedWorkbookSheetsV123,
  recurringDecisionMarkdownV123,
  recurringDecisionReportModelV123
} from './reporting.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';
import { RECURRING_DECISION_KEY } from './recurring-decisions-model.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let featuresPromise = null;
let downloadsInstalled = false;
let enhancementScheduled = false;
let cssInstalled = false;

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
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
  if (typeof value !== 'function') throw new Error(`v123 feature dependency is not ready: ${name}`);
  return value;
}

function installCss() {
  if (cssInstalled) return;
  cssInstalled = true;
  [
    ['v120', 'styles/v120.css?v=123recurring1'],
    ['v121', 'styles/v121.css?v=123recurring1'],
    ['v122', 'styles/v122.css?v=123recurring1'],
    ['v123', 'styles/v123.css?v=123recurring1']
  ].forEach(([version, href]) => {
    if (document.querySelector(`link[data-${version}-styles]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[`${version}Styles`] = 'true';
    document.head.append(link);
  });
}

function loadFeatures() {
  installCss();
  if (!featuresPromise) {
    featuresPromise = import('./recurring-decisions.js?v=123recurring1')
      .then((module) => {
        module.installRecurringDecisionFeatures();
        return module;
      })
      .catch((error) => {
        featuresPromise = null;
        throw error;
      });
  }
  return featuresPromise;
}

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function familyMeetingMarkdown(model) {
  return `${requiredFeature('familyMeetingMarkdownV114')(model)}\n\n${recurringDecisionMarkdownV123(recurringDecisionReportModelV123(), { heading: 'Recurring Cost Conversation' })}`;
}

function guidedPlanMarkdown(plan) {
  return `${requiredFeature('guidedPlanMarkdownV114')(plan)}\n\n${recurringDecisionMarkdownV123(recurringDecisionReportModelV123(), { heading: 'Recurring Cost Follow-up' })}`;
}

function importHistory() {
  return requiredFeature('importHistory')();
}

function downloadBackupV123() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v123_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleDownload(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v123_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV123(getMonth(), model)));
    announce('39-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v123_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v123_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV123();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v123_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v123_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const recurring = recurringDecisionReportModelV123();
  const cleanup = window.GringottsV122?.accountCleanupAnalysis?.();
  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v123_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: {
      count: importHistory().length,
      receiptIntegrityAvailable: true,
      automaticRepairAvailable: false,
      automaticRollbackAvailable: false
    },
    accountCleanup: {
      accountCount: cleanup?.inventory?.length || 0,
      candidateCount: cleanup?.candidates?.length || 0,
      automaticMergeAvailable: false,
      transactionWriteAvailable: false
    },
    recurringDecisions: {
      storageKey: RECURRING_DECISION_KEY,
      candidateCount: recurring.candidates.length,
      decidedCount: recurring.decisions.summary.decided,
      openFollowUps: recurring.decisions.summary.open,
      pendingRowsExcluded: recurring.summary.pendingExcluded,
      externalMerchantActionAvailable: false,
      paymentChangeAvailable: false,
      emailActionAvailable: false,
      transactionWriteAvailable: false,
      transactionCopiesStored: false
    },
    roadmap: {
      current: ROADMAP_HORIZON[0].version,
      horizonThrough: ROADMAP_HORIZON.at(-1).version,
      releasesVisible: ROADMAP_HORIZON.length
    },
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open,
      recurringFollowUps: recurring.actions.length
    },
    uiArchitecture: {
      release: 'v123',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      recurringDecisionSurfaces: 4,
      workbookSheets: 39
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
  return true;
}

function installDownloadOverrides() {
  if (downloadsInstalled) return;
  downloadsInstalled = true;
  document.addEventListener('click', handleDownload, true);
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
  if (!section || section.dataset.v123RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  section.dataset.v120RoadmapEnhanced = 'true';
  section.dataset.v121RoadmapEnhanced = 'true';
  section.dataset.v122RoadmapEnhanced = 'true';
  section.dataset.v123RoadmapEnhanced = 'true';
  section.classList.add('v120-roadmap-page', 'v121-roadmap-page', 'v122-roadmap-page', 'v123-roadmap-page');
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'A detailed release horizon with delivered capabilities, dependencies, safety boundaries, and expected household outcomes.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);
  [...section.children].forEach((child) => { if (child !== titleRow) child.remove(); });
  const note = element('div', 'note warning-note roadmap-horizon-note', 'v124 is the strongest next commitment. Later releases are a directional planning horizon and may move when real household use, testing, or safety findings show a better order.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceReports(root, features) {
  const button = root.querySelector('#vaultXlsx');
  const card = button?.closest('.report-option');
  if (card) {
    setText(card.querySelector('h3'), '39-sheet Vault Workbook');
    setText(card.querySelector('p'), 'Includes the existing 37 sheets plus recurring decisions and follow-up history.');
    let list = card.querySelector('.v123-workbook-sheet-list');
    if (!list) {
      card.querySelector('.v122-workbook-sheet-list')?.remove();
      list = element('ul', 'v123-workbook-sheet-list');
      [
        'Receipt Integrity', 'Batch Lineage', 'Account Inventory', 'Account Cleanup Plan',
        'Recurring Decisions', 'Recurring Decision History'
      ].forEach((name) => list.append(element('li', '', name)));
      button.before(list);
    }
    setText(button, 'Download 39-sheet Workbook');
  }
  features.enhanceRecurringReportPages(root);
}

function enhanceToolsPage(page) {
  const titleRow = page.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('h2'), 'Import & Restore');
  setText(titleRow?.querySelector('p'), 'Review account cleanup and receipt integrity, import missing transactions, or use the separate full-vault restore task.');
  setText(titleRow?.querySelector('.section-meta'), 'Local review · guarded writes');
  window.GringottsV121?.enhanceReceiptTimeline?.(page);
  window.GringottsV122?.loadAccountCleanupFeatures?.()
    .then((module) => module.enhanceAccountCleanup(page))
    .catch((error) => announce(error?.message || 'Account cleanup planning could not be loaded'));
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Recurring Cost Decisions & Subscription Review v123'));
  loadFeatures().then((features) => {
    const active = root.querySelector('.section.active');
    if (active?.querySelector('h2')?.textContent?.trim() === 'Bills, Recurring & Budgets') {
      features.enhanceRecurringDecisionPage(active);
    }
    if (active?.querySelector('h2')?.textContent?.trim() === 'Guided Household Plan') {
      features.enhanceGuidedPlanPage(active);
    }
    const toolsPage = root.querySelector('.v116-import-page, .v115-import-page');
    if (toolsPage) enhanceToolsPage(toolsPage);
    enhanceReports(root, features);
    enhanceRoadmap(root);
  }).catch((error) => announce(error?.message || 'Recurring decision features could not be loaded'));
}

function scheduleEnhancement() {
  if (enhancementScheduled) return;
  enhancementScheduled = true;
  queueMicrotask(() => {
    enhancementScheduled = false;
    enhanceMain();
  });
}

export function prepareV123Interceptors() {
  const registry = window.GringottsV123 || (window.GringottsV123 = {});
  registry.release = 'v123';
  installDownloadOverrides();
  return loadFeatures();
}

export function activateV123() {
  Object.assign(BUILD, {
    version: 'v123',
    name: 'Recurring Cost Decisions & Subscription Review',
    runtime: 'src/runtime-v111-reporting.js + lazy v115 import + v118 portability + v119 diagnostics + v120 audit + v121 lineage + v122 cleanup modules + v123 recurring decisions',
    cacheBust: '123recurring1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV123 || (window.GringottsV123 = {});
  Object.assign(registry, {
    release: 'v123',
    enhance: enhanceMain,
    loadFeatures,
    roadmapHorizon: ROADMAP_HORIZON,
    expandedWorkbookSheetsV123
  });
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.reports = {
      ...(window.GringottsCleanRuntime.reports || {}),
      expandedWorkbookSheetsV123
    };
  }
  return BUILD;
}
