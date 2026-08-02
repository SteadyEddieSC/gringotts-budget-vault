import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { ROADMAP_HORIZON, validateRoadmapHorizon } from './roadmap-horizon.js';
import { STORAGE_INVENTORY, storageInventorySummary, validateStorageInventory } from './storage-inventory.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug', 'copyDebug'
]);

let runtimeContext = null;
let cssInstalled = false;
let reportingPromise = null;

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

function installCss() {
  if (cssInstalled || document.querySelector('link[data-v126-styles]')) return;
  cssInstalled = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/v126.css?v=126runtime1';
  link.dataset.v126Styles = 'true';
  document.head.append(link);
}

function requiredFeature(name) {
  const value = window.GringottsV115?.[name];
  if (typeof value !== 'function') throw new Error(`v126 feature dependency is not ready: ${name}`);
  return value;
}

function loadReporting() {
  if (!reportingPromise) {
    reportingPromise = Promise.all([
      import('../v103/reports.js'),
      import('../v111/reporting.js'),
      import('../v114/planning.js'),
      import('../v123/reporting.js'),
      import('../v124/reporting.js'),
      import('../v125/reporting.js')
    ]).then(([reports, household, planning, recurring, scenario, closeTrend]) => ({
      xlsxBlob: reports.xlsxBlob,
      householdReportModel: household.householdReportModel,
      guidedPlanModel: planning.guidedPlanModel,
      recurringDecisionMarkdownV123: recurring.recurringDecisionMarkdownV123,
      recurringDecisionReportModelV123: recurring.recurringDecisionReportModelV123,
      scenarioMarkdownV124: scenario.scenarioMarkdownV124,
      scenarioReportModelV124: scenario.scenarioReportModelV124,
      closeTrendMarkdownV125: closeTrend.closeTrendMarkdownV125,
      closeTrendReportModelV125: closeTrend.closeTrendReportModelV125,
      expandedWorkbookSheetsV125: closeTrend.expandedWorkbookSheetsV125
    }));
  }
  return reportingPromise;
}

function reportSlug(model) {
  return `${model.settings.start}_to_${model.settings.end}`;
}

function downloadBackup() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v126_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function importHistory() {
  const feature = window.GringottsV115?.importHistory;
  return typeof feature === 'function' ? feature() : [];
}

function diagnosticsPackage() {
  const cleanup = window.GringottsV122?.accountCleanupAnalysis?.();
  const runtime = runtimeContext?.coordinator?.snapshot?.() || null;
  const actions = runtimeContext?.dispatcher?.snapshot?.() || null;
  return {
    ...debugReport(),
    release: {
      version: 'v126',
      name: 'Runtime Consolidation & Reliability',
      featureFreeze: true,
      primaryDestinations: 6,
      workbookSheets: 43
    },
    runtimeConsolidation: {
      lifecycle: runtime,
      actions,
      legacyAdapters: runtimeContext?.legacyAdapters || [],
      oneObserverOwned: runtime?.observerCount === 1,
      historicalObserverSuppression: true,
      timeoutReadinessAvailable: false,
      stableRescue: 'rescue-v105.html'
    },
    storage: storageInventorySummary(),
    importReceipts: {
      count: importHistory().length,
      automaticRepairAvailable: false,
      automaticRollbackAvailable: false
    },
    accountCleanup: {
      accountCount: cleanup?.inventory?.length || 0,
      candidateCount: cleanup?.candidates?.length || 0,
      automaticMergeAvailable: false,
      transactionWriteAvailable: false
    },
    preservedV125Capabilities: {
      closeTrendExplainability: true,
      scenarioComparison: true,
      recurringDecisions: true,
      aggregateOnlyExports: true,
      automaticFinancialActionAvailable: false
    },
    roadmap: {
      current: ROADMAP_HORIZON[0].version,
      horizonThrough: ROADMAP_HORIZON.at(-1).version,
      releasesVisible: ROADMAP_HORIZON.length
    }
  };
}

async function performDownload(id) {
  if (id === 'vaultXlsx') {
    const reporting = await loadReporting();
    const model = reporting.householdReportModel();
    download(
      `Gringotts_Budget_Vault_v126_${reportSlug(model)}_${stamp()}.xlsx`,
      reporting.xlsxBlob(reporting.expandedWorkbookSheetsV125(getMonth(), model))
    );
    announce('43-sheet reliability-capped Vault Workbook downloaded');
    return;
  }
  if (id === 'meetingMd') {
    const reporting = await loadReporting();
    const model = reporting.householdReportModel();
    const markdown = [
      requiredFeature('familyMeetingMarkdownV114')(model),
      reporting.recurringDecisionMarkdownV123(reporting.recurringDecisionReportModelV123(), { heading: 'Recurring Cost Conversation' }),
      reporting.scenarioMarkdownV124(reporting.scenarioReportModelV124(), { heading: 'Scenario Conversation' }),
      reporting.closeTrendMarkdownV125(reporting.closeTrendReportModelV125(), { heading: 'Close Trend Conversation' })
    ].join('\n\n');
    download(`Gringotts_Family_Meeting_Pack_v126_${reportSlug(model)}_${stamp()}.md`, markdown, 'text/markdown');
    announce('Family meeting pack downloaded');
    return;
  }
  if (id === 'planMd') {
    const reporting = await loadReporting();
    const plan = reporting.guidedPlanModel();
    const markdown = [
      requiredFeature('guidedPlanMarkdownV114')(plan),
      reporting.recurringDecisionMarkdownV123(reporting.recurringDecisionReportModelV123(), { heading: 'Recurring Cost Follow-up' }),
      reporting.scenarioMarkdownV124(reporting.scenarioReportModelV124(), { heading: 'Household Scenario Discussion' }),
      reporting.closeTrendMarkdownV125(reporting.closeTrendReportModelV125(), { heading: 'Close Trend Follow-up' })
    ].join('\n\n');
    download(`Gringotts_Guided_Household_Plan_v126_${plan.month}_${stamp()}.md`, markdown, 'text/markdown');
    announce('Guided household plan downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(id)) {
    downloadBackup();
    return;
  }
  if (id === 'exportRules') {
    downloadJson(`Gringotts_v126_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (id === 'exportIcs' || id === 'downloadIcs') {
    download(`Gringotts_v126_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return;
  }
  if (id === 'copyDebug') {
    await navigator.clipboard?.writeText?.(JSON.stringify(diagnosticsPackage(), null, 2));
    announce('v126 runtime diagnostics copied');
    return;
  }
  downloadJson(`Gringotts_v126_diagnostics_${stamp()}.json`, diagnosticsPackage());
}

function handleDownload(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  performDownload(button.id).catch((error) => announce(error?.message || 'Download could not be prepared'));
  return true;
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
  row.append(intro, element('div', 'section-meta', entry.status === 'current' ? 'Current release' : entry.status === 'planned' ? 'Planned' : 'Directional'));
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
  if (!section || section.dataset.v126RoadmapEnhanced === 'true') return;
  validateRoadmapHorizon();
  section.dataset.v126RoadmapEnhanced = 'true';
  section.classList.add('v126-roadmap-page');
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'Reliability-first release history and the evidence-gated path ahead.');
  setText(titleRow?.querySelector('.section-meta'), `Horizon: ${ROADMAP_HORIZON[0].version}–${ROADMAP_HORIZON.at(-1).version}`);
  [...section.children].forEach((child) => { if (child !== titleRow) child.remove(); });
  const note = element('div', 'note good-note roadmap-horizon-note', 'v126 completed the runtime consolidation commitment. Feature freeze remains in place while v127 focuses on simplifying the existing experience.');
  const horizon = element('div', 'roadmap-horizon');
  ROADMAP_HORIZON.forEach((entry) => horizon.append(roadmapCard(entry)));
  section.append(note, horizon);
}

function enhanceReports(root) {
  const button = root.querySelector('#vaultXlsx');
  const card = button?.closest('.report-option');
  if (!card) return;
  setText(card.querySelector('h3'), '43-sheet Vault Workbook');
  setText(card.querySelector('p'), 'The v125 reporting model is preserved at the 43-sheet cap; v126 changes runtime ownership, not report scope.');
  let note = card.querySelector('.v126-workbook-cap-note');
  if (!note) {
    note = element('div', 'note good-note v126-workbook-cap-note', 'Reliability cap: no workbook sheet was added in v126.');
    button.before(note);
  }
  setText(button, 'Download 43-sheet Workbook');
}

function renderRuntimeHealth(root) {
  const heading = root.querySelector('.section.active h2')?.textContent?.trim();
  if (heading !== 'Diagnostics') return;
  let card = root.querySelector('.v126-runtime-health-card');
  if (!card) {
    card = element('article', 'card v126-runtime-health-card');
    root.querySelector('.section.active')?.prepend(card);
  }
  const runtime = runtimeContext?.coordinator?.snapshot?.();
  const actions = runtimeContext?.dispatcher?.snapshot?.();
  const budget = runtime?.budget || {};
  card.replaceChildren(
    element('h3', '', 'Runtime ownership & recovery'),
    element('p', '', 'One coordinator owns route enhancement readiness. One dispatcher owns specialist capture actions and current-release downloads.'),
    element('div', 'import-summary-grid v126-runtime-metrics')
  );
  const metrics = card.querySelector('.v126-runtime-metrics');
  [
    [String(runtime?.observerCount ?? 0), 'Owned observers'],
    [String(runtime?.releaseCount ?? 0), 'Registered release layers'],
    [String(actions?.registered ?? 0), 'Registered actions'],
    [runtime?.status || 'unknown', 'Current lifecycle'],
    [Object.values(budget).every(Boolean) ? 'Within budget' : 'Review budget', 'Runtime budget']
  ].forEach(([value, label]) => {
    const item = element('article', 'kpi');
    item.append(element('strong', '', value), element('span', '', label));
    metrics.append(item);
  });
  const actionsRow = element('div', 'button-row');
  const retry = element('button', 'btn secondary', 'Retry Route Enhancements');
  retry.type = 'button';
  retry.id = 'retryV126Enhancements';
  const rescue = element('a', 'btn secondary', 'Open Stable v105 Rescue');
  rescue.href = 'rescue-v105.html?release=rescue1051';
  actionsRow.append(retry, rescue);
  card.append(
    element('p', 'muted-note', `${STORAGE_INVENTORY.length} browser-local domains are inventoried. Only gringottsBudgetVault.latest may contain transaction copies.`),
    actionsRow
  );
}

export async function enhanceV126(root = document.getElementById('main')) {
  if (!root) return;
  installCss();
  root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Runtime Consolidation & Reliability v126'));
  enhanceReports(root);
  enhanceRoadmap(root);
  renderRuntimeHealth(root);
}

function handleRetry(event) {
  if (!event.target.closest?.('#retryV126Enhancements')) return false;
  event.preventDefault();
  runtimeContext?.coordinator?.retry?.()
    .then(() => announce('Route enhancements retried successfully'))
    .catch((error) => announce(error?.message || 'Route enhancements could not be retried'));
  return true;
}

export function installV126Runtime({ coordinator, dispatcher, legacyAdapters = [] }) {
  if (!coordinator || !dispatcher) throw new Error('v126 requires the runtime coordinator and action dispatcher.');
  validateRoadmapHorizon();
  validateStorageInventory();
  runtimeContext = { coordinator, dispatcher, legacyAdapters };
  dispatcher.register('click', 'v126-current-downloads', handleDownload, 100);
  dispatcher.register('click', 'v126-retry-enhancements', handleRetry, 200);
  coordinator.registerRelease({
    id: 'v126',
    title: 'Runtime Consolidation & Reliability',
    order: 126,
    storageDomains: STORAGE_INVENTORY.map((entry) => entry.domain),
    enhance: enhanceV126
  });
  Object.assign(BUILD, {
    version: 'v126',
    name: 'Runtime Consolidation & Reliability',
    runtime: 'src/runtime-v111-reporting.js + one v126 route coordinator + one v126 action dispatcher + lazy v115-v125 capabilities',
    cacheBust: '126runtime1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  Object.assign(window.GringottsV126 || (window.GringottsV126 = {}), {
    release: 'v126',
    coordinator,
    dispatcher,
    enhance: enhanceV126,
    diagnostics: diagnosticsPackage,
    loadReporting,
    roadmapHorizon: ROADMAP_HORIZON,
    storageInventory: STORAGE_INVENTORY,
    stableRescue: 'rescue-v105.html',
    featureFreeze: true,
    workbookSheetCap: 43
  });
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.runtimeV126 = {
      coordinator,
      dispatcher,
      storageInventory: STORAGE_INVENTORY,
      diagnostics: diagnosticsPackage
    };
  }
  return BUILD;
}
