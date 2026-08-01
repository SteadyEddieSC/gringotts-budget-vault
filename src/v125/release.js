import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import {
  recurringDecisionMarkdownV123,
  recurringDecisionReportModelV123
} from '../v123/reporting.js';
import {
  scenarioMarkdownV124,
  scenarioReportModelV124
} from '../v124/reporting.js';
import {
  closeTrendMarkdownV125,
  closeTrendReportModelV125,
  expandedWorkbookSheetsV125
} from './reporting.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let closeTrendPromise = null;
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
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function requiredFeature(name) {
  const value = window.GringottsV115?.[name];
  if (typeof value !== 'function') throw new Error(`v125 feature dependency is not ready: ${name}`);
  return value;
}

function recurringFeatures() {
  return window.GringottsV123 || {};
}

function scenarioFeatures() {
  return window.GringottsV124 || {};
}

function installCss() {
  if (cssInstalled) return;
  cssInstalled = true;
  [
    ['v120', 'styles/v120.css?v=125close1'],
    ['v121', 'styles/v121.css?v=125close1'],
    ['v122', 'styles/v122.css?v=125close1'],
    ['v123', 'styles/v123.css?v=125close1'],
    ['v124', 'styles/v124.css?v=125close1'],
    ['v125', 'styles/v125.css?v=125close1']
  ].forEach(([version, href]) => {
    if (document.querySelector(`link[data-${version}-styles]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[`${version}Styles`] = 'true';
    document.head.append(link);
  });
}

function loadCloseTrendFeatures() {
  installCss();
  if (!closeTrendPromise) {
    closeTrendPromise = import('./close-trends.js?v=125close1')
      .then((module) => {
        module.installCloseTrendFeatures();
        return module;
      })
      .catch((error) => {
        closeTrendPromise = null;
        throw error;
      });
  }
  return closeTrendPromise;
}

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function familyMeetingMarkdown(model) {
  return [
    requiredFeature('familyMeetingMarkdownV114')(model),
    recurringDecisionMarkdownV123(recurringDecisionReportModelV123(), { heading: 'Recurring Cost Conversation' }),
    scenarioMarkdownV124(scenarioReportModelV124(), { heading: 'Scenario Conversation' }),
    closeTrendMarkdownV125(closeTrendReportModelV125(), { heading: 'Close Trend Conversation' })
  ].join('\n\n');
}

function guidedPlanMarkdown(plan) {
  return [
    requiredFeature('guidedPlanMarkdownV114')(plan),
    recurringDecisionMarkdownV123(recurringDecisionReportModelV123(), { heading: 'Recurring Cost Follow-up' }),
    scenarioMarkdownV124(scenarioReportModelV124(), { heading: 'Household Scenario Discussion' }),
    closeTrendMarkdownV125(closeTrendReportModelV125(), { heading: 'Close Trend Follow-up' })
  ].join('\n\n');
}

function importHistory() {
  return requiredFeature('importHistory')();
}

function downloadBackupV125() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v125_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleDownload(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v125_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV125(getMonth(), model)));
    announce('43-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v125_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v125_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV125();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v125_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v125_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const recurring = recurringDecisionReportModelV123();
  const scenarios = scenarioReportModelV124();
  const closeTrend = closeTrendReportModelV125();
  const cleanup = window.GringottsV122?.accountCleanupAnalysis?.();
  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v125_diagnostics_${stamp()}.json`, {
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
      candidateCount: recurring.candidates.length,
      decidedCount: recurring.decisions.summary.decided,
      openFollowUps: recurring.decisions.summary.open,
      externalMerchantActionAvailable: false,
      transactionWriteAvailable: false
    },
    scenarios: {
      savedCount: scenarios.summary.saved,
      automaticApplyAvailable: false,
      transactionWriteAvailable: false,
      forecastWriteAvailable: false,
      debtWriteAvailable: false,
      goalWriteAvailable: false,
      transactionCopiesStored: false
    },
    closeTrends: {
      selectedMonth: closeTrend.selectedMonth,
      comparisonMonth: closeTrend.comparisonMonth,
      confidence: closeTrend.confidence.level,
      confidenceScore: closeTrend.confidence.score,
      transferNeutral: true,
      pendingExcluded: true,
      aggregateOnly: true,
      automaticWriteAvailable: false,
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
      recurringFollowUps: recurring.actions.length,
      savedScenarios: scenarios.summary.saved
    },
    uiArchitecture: {
      release: 'v125',
      primaryDestinations: 6,
      reportPreviewPages: 9,
      closeTrendSurfaces: 4,
      workbookSheets: 43
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
  if (!section || section.dataset.v125RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  for (const version of ['v120', 'v121', 'v122', 'v123', 'v124', 'v125']) section.dataset[`${version}RoadmapEnhanced`] = 'true';
  section.classList.add('v120-roadmap-page', 'v121-roadmap-page', 'v122-roadmap-page', 'v123-roadmap-page', 'v124-roadmap-page', 'v125-roadmap-page');
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'A detailed release horizon with delivered capabilities, dependencies, safety boundaries, and expected household outcomes.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);
  [...section.children].forEach((child) => { if (child !== titleRow) child.remove(); });
  const note = element('div', 'note warning-note roadmap-horizon-note', 'v126 is the strongest next commitment. Later releases are a directional planning horizon and may move when real household use, testing, or safety findings show a better order.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceReports(root, closeFeatures) {
  const button = root.querySelector('#vaultXlsx');
  const card = button?.closest('.report-option');
  if (card) {
    setText(card.querySelector('h3'), '43-sheet Vault Workbook');
    setText(card.querySelector('p'), 'Includes the existing 41 sheets plus aggregate close trends and driver explainability.');
    let list = card.querySelector('.v125-workbook-sheet-list');
    if (!list) {
      card.querySelector('.v124-workbook-sheet-list')?.remove();
      list = element('ul', 'v125-workbook-sheet-list');
      [
        'Receipt Integrity', 'Batch Lineage', 'Account Inventory', 'Account Cleanup Plan',
        'Recurring Decisions', 'Recurring Decision History', 'Scenario Comparisons', 'Scenario Assumptions',
        'Close Trends', 'Close Drivers'
      ].forEach((name) => list.append(element('li', '', name)));
      button.before(list);
    }
    setText(button, 'Download 43-sheet Workbook');
  }
  recurringFeatures().enhanceRecurringReportPages?.(root);
  scenarioFeatures().enhanceScenarioReportPages?.(root);
  closeFeatures.enhanceCloseTrendReports(root);
}

function enhanceToolsPage(page) {
  const titleRow = page.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('h2'), 'Import & Restore');
  setText(titleRow?.querySelector('p'), 'Review account cleanup and receipt integrity, import missing transactions, or use the separate full-vault restore task.');
  setText(titleRow?.querySelector('.section-meta'), 'Local review · guarded writes');
  window.GringottsV121?.enhanceReceiptTimeline?.(page);
  if (page.querySelector('.account-cleanup-card')) return;
  window.GringottsV122?.loadAccountCleanupFeatures?.()
    .then((module) => module.enhanceAccountCleanup(page))
    .catch((error) => announce(error?.message || 'Account cleanup planning could not be loaded'));
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Close History & Trend Explainability v125'));
  loadCloseTrendFeatures().then((closeFeatures) => {
    const active = root.querySelector('.section.active');
    const heading = active?.querySelector('h2')?.textContent?.trim();
    if (heading === 'Bills, Recurring & Budgets') recurringFeatures().enhanceRecurringDecisionPage?.(active);
    if (heading === 'Close & Forecast') {
      scenarioFeatures().enhanceScenarioPage?.(active);
      closeFeatures.enhanceCloseTrendPage(active);
    }
    if (heading === 'Guided Household Plan') {
      recurringFeatures().enhanceGuidedPlanPage?.(active);
      scenarioFeatures().enhanceScenarioGuidedPlan?.(active);
      closeFeatures.enhanceCloseTrendGuidedPlan(active);
    }
    const toolsPage = root.querySelector('.v116-import-page, .v115-import-page');
    if (toolsPage) enhanceToolsPage(toolsPage);
    enhanceReports(root, closeFeatures);
    enhanceRoadmap(root);
  }).catch((error) => announce(error?.message || 'Close trend features could not be loaded'));
}

function scheduleEnhancement() {
  if (enhancementScheduled) return;
  enhancementScheduled = true;
  queueMicrotask(() => {
    enhancementScheduled = false;
    enhanceMain();
  });
}

export function prepareV125Interceptors() {
  const registry = window.GringottsV125 || (window.GringottsV125 = {});
  registry.release = 'v125';
  installDownloadOverrides();
  return loadCloseTrendFeatures();
}

export function activateV125() {
  Object.assign(BUILD, {
    version: 'v125',
    name: 'Close History & Trend Explainability',
    runtime: 'src/runtime-v111-reporting.js + lazy v115 import + v118 portability + v119 diagnostics + v120 audit + v121 lineage + v122 cleanup + v123 recurring decisions + v124 scenarios + v125 close trends',
    cacheBust: '125close1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV125 || (window.GringottsV125 = {});
  Object.assign(registry, {
    release: 'v125',
    enhance: enhanceMain,
    loadCloseTrendFeatures,
    roadmapHorizon: ROADMAP_HORIZON,
    expandedWorkbookSheetsV125
  });
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.reports = {
      ...(window.GringottsCleanRuntime.reports || {}),
      expandedWorkbookSheetsV125
    };
  }
  return BUILD;
}
