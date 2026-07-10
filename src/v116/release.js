import {
  BUILD, best, debugReport, download, downloadJson, getMonth, ics, reviewPackage, stamp
} from '../v103/core.js';
import { xlsxBlob } from '../v103/reports.js';
import { householdReportModel } from '../v111/reporting.js';
import { guidedPlanModel } from '../v114/planning.js';
import { expandedWorkbookSheetsV115 } from '../v115/reporting.js';

const REPORT_PAGE_ORDER = [
  ['summary', 'Family summary'],
  ['comparison', 'Year-over-year comparison'],
  ['spending', 'Spending breakdown'],
  ['goals', 'Goals and Vault Health'],
  ['planning', 'Close, forecast, and debt'],
  ['insights', 'Household insights'],
  ['plan', 'Guided household plan'],
  ['meeting', 'Family meeting brief']
];

const DOWNLOAD_IDS = new Set([
  'vaultXlsx', 'meetingMd', 'planMd', 'exportBackup', 'importBackup', 'backupRules',
  'exportRules', 'exportIcs', 'downloadIcs', 'exportDebug', 'downloadDebug'
]);

let selectedReportPage = 'summary';
let selectedImportTask = 'bank';
let observer = null;
let handlersInstalled = false;
let downloadOverridesInstalled = false;
let enhancementScheduled = false;

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

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
  if (!button || !DOWNLOAD_IDS.has(button.id)) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (button.id === 'vaultXlsx') {
    const model = householdReportModel();
    download(`Gringotts_Budget_Vault_v116_${reportSlug(model)}_${stamp()}.xlsx`, xlsxBlob(expandedWorkbookSheetsV115(getMonth(), model)));
    announce('33-sheet Vault Workbook downloaded');
    return;
  }
  if (button.id === 'meetingMd') {
    const model = householdReportModel();
    download(`Gringotts_Family_Meeting_Pack_v116_${reportSlug(model)}_${stamp()}.md`, familyMeetingMarkdown(model), 'text/markdown');
    announce('Family meeting pack downloaded');
    return;
  }
  if (button.id === 'planMd') {
    const plan = guidedPlanModel();
    download(`Gringotts_Guided_Household_Plan_v116_${plan.month}_${stamp()}.md`, guidedPlanMarkdown(plan), 'text/markdown');
    announce('Guided household plan downloaded');
    return;
  }
  if (['exportBackup', 'importBackup', 'backupRules'].includes(button.id)) {
    downloadBackupV116();
    return;
  }
  if (button.id === 'exportRules') {
    downloadJson(`Gringotts_v116_rules_review_${stamp()}.json`, reviewPackage());
    return;
  }
  if (button.id === 'exportIcs' || button.id === 'downloadIcs') {
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

function installV116DownloadOverrides() {
  if (downloadOverridesInstalled) return;
  downloadOverridesInstalled = true;
  document.addEventListener('click', handleV116Download, true);
}

function reportIdFor(index, page) {
  const heading = page.querySelector('h2')?.textContent?.trim().toLowerCase() || '';
  if (heading.includes('family financial')) return 'summary';
  if (heading.includes('year-over-year')) return 'comparison';
  if (heading.includes('spending by category')) return 'spending';
  if (heading.includes('goals and vault health')) return 'goals';
  if (heading.includes('month close')) return 'planning';
  if (heading.includes('household insights')) return 'insights';
  if (heading.includes('guided household plan')) return 'plan';
  if (heading.includes('family meeting')) return 'meeting';
  return REPORT_PAGE_ORDER[index]?.[0] || `page-${index + 1}`;
}

function labelForReportPage(id, page, index) {
  return REPORT_PAGE_ORDER.find(([value]) => value === id)?.[1]
    || page.querySelector('h2')?.textContent?.trim()
    || `Report page ${index + 1}`;
}

function createReportButton(text, attribute) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn secondary';
  button.textContent = text;
  button.setAttribute(attribute, '');
  return button;
}

function createReportToolbar(pages) {
  const toolbar = document.createElement('article');
  toolbar.className = 'card report-preview-toolbar screen-only';

  const intro = document.createElement('div');
  const heading = document.createElement('h3');
  heading.textContent = 'Report preview';
  const copy = document.createElement('p');
  copy.textContent = 'Review one report page at a time on screen. Printing and PDF export still include all eight pages.';
  intro.append(heading, copy);

  const controls = document.createElement('div');
  controls.className = 'report-preview-controls';

  const label = document.createElement('label');
  label.append(document.createTextNode('Preview page'));
  const select = document.createElement('select');
  select.id = 'reportPreviewPage';
  pages.forEach((page, index) => {
    const id = page.dataset.reportPage;
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${index + 1}. ${labelForReportPage(id, page, index)}`;
    select.append(option);
  });
  label.append(select);

  const buttons = document.createElement('div');
  buttons.className = 'button-row report-preview-buttons';
  buttons.append(
    createReportButton('Previous', 'data-report-preview-previous'),
    createReportButton('Next', 'data-report-preview-next')
  );

  const status = document.createElement('p');
  status.id = 'reportPreviewStatus';
  status.className = 'muted-note';
  status.setAttribute('aria-live', 'polite');

  controls.append(label, buttons, status);
  toolbar.append(intro, controls);
  return toolbar;
}

function applyReportSelection(center) {
  const pages = [...center.querySelectorAll('.report-preview-deck > .report-page')];
  if (!pages.length) return;
  if (!pages.some((page) => page.dataset.reportPage === selectedReportPage)) selectedReportPage = pages[0].dataset.reportPage;
  let selectedIndex = 0;
  pages.forEach((page, index) => {
    const selected = page.dataset.reportPage === selectedReportPage;
    page.hidden = !selected;
    page.setAttribute('aria-hidden', selected ? 'false' : 'true');
    if (selected) selectedIndex = index;
  });
  const select = center.querySelector('#reportPreviewPage');
  if (select) select.value = selectedReportPage;
  const status = center.querySelector('#reportPreviewStatus');
  setText(status, `Page ${selectedIndex + 1} of ${pages.length}: ${labelForReportPage(selectedReportPage, pages[selectedIndex], selectedIndex)}`);
  const previous = center.querySelector('[data-report-preview-previous]');
  const next = center.querySelector('[data-report-preview-next]');
  if (previous) previous.disabled = selectedIndex === 0;
  if (next) next.disabled = selectedIndex === pages.length - 1;
}

function enhanceReportCenter(center) {
  if (center.dataset.v116Enhanced !== 'true') {
    center.dataset.v116Enhanced = 'true';
    center.classList.add('v116-report-center');
    const titleRow = center.querySelector(':scope > .section-title-row');
    setText(titleRow?.querySelector('h2'), 'Reports');
    setText(titleRow?.querySelector('p'), 'Choose a date range, preview the family report, and download local exports.');
    setText(titleRow?.querySelector('.section-meta'), '8-page family report');
    center.querySelectorAll('.report-kicker').forEach((node) => setText(node, 'UI Architecture Review v116'));

    const pages = [...center.querySelectorAll(':scope > .report-page')];
    if (pages.length) {
      const deck = document.createElement('div');
      deck.className = 'report-preview-deck';
      pages.forEach((page, index) => {
        const id = reportIdFor(index, page);
        page.dataset.reportPage = id;
        const pageHeading = page.querySelector('h2');
        if (pageHeading && !pageHeading.id) pageHeading.id = `reportPreviewHeading-${id}`;
        if (pageHeading) pageHeading.tabIndex = -1;
        if (pageHeading?.id) page.setAttribute('aria-labelledby', pageHeading.id);
      });
      const toolbar = createReportToolbar(pages);
      pages[0].before(toolbar, deck);
      pages.forEach((page) => deck.appendChild(page));
    }

    const workbookHeading = [...center.querySelectorAll('h3')].find((headingNode) => /Vault workbook contents/i.test(headingNode.textContent || ''));
    workbookHeading?.closest('.card')?.classList.add('workbook-contents-card');
  }
  applyReportSelection(center);
}

function importStepState(page) {
  const inspected = Boolean(page.querySelector('.bank-inspection-summary'));
  const analyzed = Boolean(page.querySelector('.bank-duplicate-review'));
  const verified = Boolean(page.querySelector('.warning-card .good-note[role="status"], .warning-card .good-note'));
  return { inspected, analyzed, verified };
}

function updateImportProgress(page) {
  const progress = page.querySelector('.bank-import-progress');
  if (!progress) return;
  const state = importStepState(page);
  const statuses = state.verified ? ['complete', 'complete', 'complete']
    : state.analyzed ? ['complete', 'complete', 'current']
      : state.inspected ? ['complete', 'current', 'upcoming']
        : ['current', 'upcoming', 'upcoming'];
  [...progress.querySelectorAll('li')].forEach((item, index) => {
    item.dataset.status = statuses[index];
    item.setAttribute('aria-current', statuses[index] === 'current' ? 'step' : 'false');
    const status = item.querySelector('small');
    setText(status, statuses[index] === 'complete' ? 'Complete' : statuses[index] === 'current' ? 'Current step' : 'Not started');
  });
}

function applyImportTask(page, focus = false) {
  const bank = page.querySelector('[data-import-task-panel="bank"]');
  const restore = page.querySelector('[data-import-task-panel="restore"]');
  if (!bank || !restore) return;
  const showBank = selectedImportTask === 'bank';
  bank.hidden = !showBank;
  restore.hidden = showBank;
  page.querySelectorAll('[data-v116-import-task]').forEach((button) => {
    const selected = button.dataset.v116ImportTask === selectedImportTask;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (focus) {
    const target = showBank ? bank.querySelector('#bankExportImportHeading') : restore.querySelector('#fullRestoreHeading');
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function createImportTaskSwitcher() {
  const switcher = document.createElement('div');
  switcher.className = 'v116-task-switcher';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Choose import or restore task');
  switcher.innerHTML = `<button type="button" data-v116-import-task="bank" aria-pressed="true"><strong>Import transactions</strong><span>Add reviewed missing rows from a bank export.</span></button>
    <button type="button" data-v116-import-task="restore" aria-pressed="false"><strong>Restore full vault</strong><span>Replace the destination from a populated Gringotts backup.</span></button>`;
  return switcher;
}

function createImportProgress() {
  const progress = document.createElement('ol');
  progress.className = 'bank-import-progress';
  progress.setAttribute('aria-label', 'Bank import workflow');
  progress.innerHTML = `<li><strong>1. Inspect</strong><span>Choose a local export and confirm how it was detected.</span><small></small></li>
    <li><strong>2. Map</strong><span>Resolve dates, amount signs, account handling, and preview rows.</span><small></small></li>
    <li><strong>3. Reconcile</strong><span>Review duplicates, download a backup, and verify any write.</span><small></small></li>`;
  return progress;
}

function enhanceImportPage(page) {
  if (page.dataset.v116Enhanced !== 'true') {
    page.dataset.v116Enhanced = 'true';
    page.classList.add('v116-import-page');
    const titleRow = page.querySelector(':scope > .section-title-row');
    setText(titleRow?.querySelector('h2'), 'Import & Restore');
    setText(titleRow?.querySelector('p'), 'Add reviewed missing transactions, or switch to full restore when replacing a vault.');
    setText(titleRow?.querySelector('.section-meta'), 'Local files only');

    const bank = page.querySelector(':scope > .import-workflow');
    const restore = page.querySelector(':scope > .restore-workflow');
    if (bank && restore) {
      bank.dataset.importTaskPanel = 'bank';
      restore.dataset.importTaskPanel = 'restore';
      const switcher = createImportTaskSwitcher();
      bank.before(switcher);
      const progress = createImportProgress();
      const bankHeading = bank.querySelector('#bankExportImportHeading');
      if (bankHeading) bankHeading.after(progress);
      else bank.prepend(progress);
    }
  }
  updateImportProgress(page);
  applyImportTask(page);
}

function enhanceRoadmap(root) {
  const section = [...root.querySelectorAll('.section.active')].find((candidate) => candidate.querySelector('h2')?.textContent?.trim() === 'Roadmap');
  if (!section || section.dataset.v116Enhanced === 'true') return;
  section.dataset.v116Enhanced = 'true';
  const titleRow = section.querySelector(':scope > .section-title-row');
  setText(titleRow?.querySelector('p'), 'Shipped releases and the next focused improvement for the local-first application.');
  setText(titleRow?.querySelector('.section-meta'), 'Next: v117');
  const shipped = section.querySelector('.roadmap-item.shipped');
  if (shipped) shipped.innerHTML = '<h3>v116 — UI Architecture Review</h3><p>Task-based report previews, separated import and restore paths, clearer workflow progress, compact mobile subnavigation, and retained print/export completeness.</p>';
  const roadmap = section.querySelector('.roadmap');
  if (roadmap) roadmap.innerHTML = '<article class="roadmap-item"><h3>v117 — Import Profiles & Field Validation</h3><p>Locally remember reviewed mapping choices by source schema, strengthen field-level explanations, and expand synthetic institution-pattern coverage without storing transaction copies.</p></article><article class="roadmap-item"><h3>Future household planning</h3><p>Scenario comparisons, recurring-cost decisions, account cleanup, and close-history analysis remain candidates only after actual household use shows clear value.</p></article>';
}

function enhanceMain(root = document.getElementById('main')) {
  if (!root) return;
  const reportCenter = root.querySelector('.v115-report-center');
  if (reportCenter) enhanceReportCenter(reportCenter);
  const importPage = root.querySelector('.v115-import-page');
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

function installUiHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', (event) => {
    if (event.target?.id !== 'reportPreviewPage') return;
    selectedReportPage = event.target.value;
    const center = event.target.closest('.v116-report-center');
    if (center) applyReportSelection(center);
  });
  document.addEventListener('click', (event) => {
    const task = event.target.closest?.('[data-v116-import-task]');
    if (task) {
      event.preventDefault();
      selectedImportTask = task.dataset.v116ImportTask;
      const page = task.closest('.v116-import-page');
      if (page) applyImportTask(page, true);
      return;
    }
    const previous = event.target.closest?.('[data-report-preview-previous]');
    const next = event.target.closest?.('[data-report-preview-next]');
    if (!previous && !next) return;
    event.preventDefault();
    const center = event.target.closest('.v116-report-center');
    const pages = [...(center?.querySelectorAll('.report-preview-deck > .report-page') || [])];
    const index = pages.findIndex((page) => page.dataset.reportPage === selectedReportPage);
    const targetIndex = previous ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    selectedReportPage = pages[targetIndex].dataset.reportPage;
    applyReportSelection(center);
    pages[targetIndex].querySelector('h2')?.focus({ preventScroll: true });
  });
}

export function prepareV116Interceptors() {
  installV116DownloadOverrides();
}

export function activateV116() {
  Object.assign(BUILD, {
    version: 'v116',
    name: 'UI Architecture Review',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115 + src/v116',
    cacheBust: '116ui1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  installUiHandlers();
  enhanceMain();
  const main = document.getElementById('main');
  if (main && !observer) {
    observer = new MutationObserver(scheduleEnhancement);
    observer.observe(main, { childList: true, subtree: true });
  }
  const registry = window.GringottsV116 || (window.GringottsV116 = {});
  Object.assign(registry, {
    release: 'v116',
    get reportPage() { return selectedReportPage; },
    get importTask() { return selectedImportTask; },
    enhance: enhanceMain
  });
  return BUILD;
}
