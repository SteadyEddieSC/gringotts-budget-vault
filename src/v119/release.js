import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV115 } from '../v115/reporting.js';

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let observer = null;
let featurePromise = null;
let handlersInstalled = false;
let downloadOverridesInstalled = false;
let enhancementScheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
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
  if (typeof value !== 'function') throw new Error(`v119 feature dependency is not ready: ${name}`);
  return value;
}

function v120OwnsPresentation() {
  return window.GringottsV120?.release === 'v120';
}

function loadProfileFeatures() {
  if (!featurePromise) {
    featurePromise = import('./profile-versioning.js?v=119diagnostics1')
      .then((module) => {
        module.installV119ProfileFeatures();
        return module;
      })
      .catch((error) => {
        featurePromise = null;
        throw error;
      });
  }
  return featurePromise;
}

function profileCount() {
  try {
    const value = JSON.parse(localStorage.getItem('gringottsImportProfiles.v1') || '{"profiles":[]}');
    return Array.isArray(value?.profiles) ? value.profiles.length : 0;
  } catch {
    return 0;
  }
}

function revisionCount() {
  try {
    const value = JSON.parse(localStorage.getItem('gringottsImportProfileRevisions.v1') || '{"revisions":[]}');
    return Array.isArray(value?.revisions) ? value.revisions.length : 0;
  } catch {
    return 0;
  }
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

function downloadBackupV119() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) {
    announce('No populated readable vault is available to back up');
    return;
  }
  downloadJson(`Gringotts_v119_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
  announce('Current vault backup downloaded');
}

function handleV119Download(event) {
  const button = event.target.closest?.('button');
  if (!button || !DOWNLOAD_IDS.has(button.id)) return false;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v119_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV115(getMonth(), model)));
    announce('33-sheet Vault Workbook downloaded');
    return true;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v119_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return true;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v119_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return true;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV119();
    return true;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v119_rules_review_${stamp()}.json`, reviewPackage());
    return true;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
    download(`Gringotts_v119_calendar_${stamp()}.ics`, ics(), 'text/calendar');
    return true;
  }

  const runtime = window.GringottsCleanRuntime;
  downloadJson(`Gringotts_v119_diagnostics_${stamp()}.json`, {
    ...debugReport(),
    importReceipts: requiredFeature('importHistory')().length,
    importProfiles: {
      storageKey: 'gringottsImportProfiles.v1',
      count: profileCount(),
      portableDefinitions: true,
      revisionHistoryKey: 'gringottsImportProfileRevisions.v1',
      revisionCount: revisionCount(),
      transactionCopiesStored: false
    },
    importDryRun: {
      generatorAvailable: true,
      transactionRowsIncluded: false,
      sourceFileNamesIncluded: false,
      accountIdentifiersIncluded: false,
      vaultContentsIncluded: false
    },
    guidedPlan: {
      storageKey: 'gringottsGuidedPlan.v1',
      openItems: guidedPlanModel().counts.open
    },
    uiArchitecture: {
      release: 'v119',
      primaryDestinations: 6,
      reportPreviewPages: 8,
      importRestoreTasks: 2
    },
    performance: { lastRenderMs: runtime?.performance?.lastRenderMs ?? null }
  });
  return true;
}

function handleEarlyChange(event) {
  const target = event.target;
  if (target?.id !== 'profileBundleFile') return;
  loadProfileFeatures()
    .then((module) => module.rememberBundleFile(target.files?.[0] || null))
    .catch((error) => announce(error?.message || 'Profile bundle could not be retained for revision review'));
}

function handleEarlyClick(event) {
  if (handleV119Download(event)) return;
  const button = event.target.closest?.('button');
  if (!button) return;

  if (button.id === 'saveBankImportProfile') {
    const profileId = document.getElementById('bankImportProfileSelect')?.value || '';
    if (!profileId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const name = document.getElementById('bankImportProfileName')?.value || '';
    loadProfileFeatures()
      .then((module) => module.interceptProfileUpdate({ profileId, name }))
      .catch((error) => announce(error?.message || 'Profile revision comparison could not be loaded'));
    return;
  }

  if (button.id === 'commitProfileBundle') {
    const replacementSelected = [...document.querySelectorAll('[data-profile-bundle-action]')]
      .some((select) => select.value === 'replace');
    if (!replacementSelected) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    loadProfileFeatures()
      .then((module) => module.interceptBundleReplace(document))
      .catch((error) => announce(error?.message || 'Bundle replacement comparison could not be loaded'));
  }
}

function installEarlyInterceptors() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', handleEarlyChange, true);
  document.addEventListener('click', handleEarlyClick, true);
}

function installV119DownloadOverrides() {
  if (downloadOverridesInstalled) return;
  downloadOverridesInstalled = true;
  installEarlyInterceptors();
}

function enhanceImportPage(page) {
  if (!v120OwnsPresentation()) {
    const titleRow = page.querySelector(':scope > .section-title-row');
    setText(titleRow?.querySelector('h2'), 'Import & Restore');
    setText(titleRow?.querySelector('p'), 'Compare profile revisions, prepare a metadata-only dry run, move sanitized profile definitions, add reviewed missing transactions, or switch to full restore.');
    setText(titleRow?.querySelector('.section-meta'), 'Revision-gated profile metadata');
  }
  loadProfileFeatures()
    .then((module) => module.enhanceProfileVersioning(page))
    .catch((error) => announce(error?.message || 'Profile versioning and dry-run diagnostics could not be loaded'));
}

function enhanceRoadmap(root) {
  if (v120OwnsPresentation()) return;
  const section = [...root.querySelectorAll('.section.active')]
    .find((candidate) => candidate.querySelector('h2')?.textContent?.trim() === 'Roadmap');
  if (!section || section.dataset.v119RoadmapEnhanced === 'true') return;

  // Mark the rendered section before DOM writes so observer callbacks cannot re-enter this enhancement.
  section.dataset.v119RoadmapEnhanced = 'true';
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'Shipped releases and the next focused improvement for the local-first application.');
  setText(titleRow?.querySelector('.section-meta'), 'Next: v120');
  const shipped = section.querySelector('.roadmap-item.shipped');
  if (shipped) shipped.innerHTML = '<h3>v119 — Profile Versioning & Dry-Run Diagnostics</h3><p>Field-by-field revision review before Update or Replace, bounded metadata-only revision history, and explicit local dry-run diagnostics before transaction writes.</p>';
  const roadmap = section.querySelector('.roadmap');
  if (roadmap) roadmap.innerHTML = '<article class="roadmap-item"><h3>v120 — Import Receipt Audit & Rollback Guidance</h3><p>Strengthen receipt review, reconcile imported batches to verified backups, and provide clear local rollback guidance without automatic destructive changes.</p></article><article class="roadmap-item"><h3>Future import formats</h3><p>CAMT, MT940, institution JSON, and guarded XLSX remain candidates only after real export validation.</p></article>';
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  if (!v120OwnsPresentation()) {
    root.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'Profile Versioning & Dry-Run Diagnostics v119'));
  }
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

export function prepareV119Interceptors() {
  installV119DownloadOverrides();
}

export function activateV119() {
  Object.assign(BUILD, {
    version: 'v119',
    name: 'Profile Versioning & Dry-Run Diagnostics',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115 + v117 profiles + v118 portability + v119 revision diagnostics',
    cacheBust: '119diagnostics1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  installEarlyInterceptors();
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV119 || (window.GringottsV119 = {});
  Object.assign(registry, {
    release: 'v119',
    enhance: enhanceMain,
    loadProfileFeatures
  });
  return BUILD;
}
