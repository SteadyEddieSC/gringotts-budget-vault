import './boot-v128.js?v=129base2';

const RELEASE = Object.freeze({
  version: 'v129',
  name: 'Household Workflow Evidence Review',
  featureFreeze: true,
  primaryDestinations: 6,
  toolsSections: 5,
  workbookSheets: 43
});
const WORKFLOW_SECTION = 'workflow-review';
let installed = false;
let controller = null;
let controllerPromise = null;

function updateMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version: RELEASE.version,
    name: RELEASE.name,
    runtime: `${build.runtime || 'v128 runtime'} + lazy v129 manual workflow evidence review`,
    cacheBust: '129evidence2'
  });
  const title = `Gringotts Budget Vault ${RELEASE.version}`;
  if (document.title !== title) document.title = title;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== RELEASE.version) version.textContent = RELEASE.version;
}

function setRoadmapStatus(version, status, label) {
  const card = document.querySelector(`[data-roadmap-version="${version}"]`);
  if (!card) return;
  if (card.dataset.roadmapStatus !== status) card.dataset.roadmapStatus = status;
  const badge = card.querySelector('.badge');
  if (badge && badge.textContent !== label) badge.textContent = label;
}

function enhanceRoadmapStatus() {
  for (const version of ['v127','v128']) setRoadmapStatus(version,'shipped','Shipped');
  setRoadmapStatus('v129','current','Current release');
  for (const version of ['v130','v131','v132','v133','v134','v135','v136']) setRoadmapStatus(version,'directional','Directional');
}

function handleWorkflowClick(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  setTimeout(() => openReview(true).catch(() => {}), 0);
}

function ensureWorkflowTab() {
  const subnav = document.querySelector('.tools-subnav');
  if (!subnav || subnav.querySelector(`[data-tools-section="${WORKFLOW_SECTION}"]`)) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'subtab';
  button.dataset.toolsSection = WORKFLOW_SECTION;
  button.setAttribute('role','tab');
  button.setAttribute('aria-selected','false');
  button.textContent = 'Workflow Review';
  button.addEventListener('click', handleWorkflowClick);
  subnav.insertBefore(button,subnav.querySelector('[data-tools-section="roadmap"]'));
}

function renderLoadFailure(error) {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return;
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'card error-box';
  section.setAttribute('role','alert');
  section.innerHTML = '<h2>Workflow Review could not open</h2><p>The current vault and browser-local data were not changed. Reload the page and try again.</p>';
  workspace.append(section);
  window.GringottsV127?.enhance?.(section);
  window.GringottsV127?.announce?.('Workflow Review could not open');
  controllerPromise = null;
  controller = null;
  return error;
}

function renderReviewShell() {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return false;
  document.querySelectorAll('.tools-subnav [data-tools-section]').forEach((button) => {
    const selected = button.dataset.toolsSection === WORKFLOW_SECTION;
    button.classList.toggle('active', selected);
    if (button.getAttribute('aria-selected') !== String(selected)) button.setAttribute('aria-selected', String(selected));
    const tabIndex = selected ? '0' : '-1';
    if (button.getAttribute('tabindex') !== tabIndex) button.setAttribute('tabindex', tabIndex);
  });
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'v129-workflow-review';
  section.dataset.v129WorkflowReview = 'true';
  section.innerHTML = '<article class="card"><div class="section-title-row"><div><h2 tabindex="-1">Household Workflow Evidence Review</h2><p>Record deliberate household observations before changing product scope.</p></div><div class="section-meta">Session only</div></div><p id="v129WorkflowLoading" role="status" aria-live="polite">Loading the local workflow inventory…</p></article>';
  workspace.append(section);
  window.GringottsV127?.enhance?.(section);
  return true;
}

function loadController() {
  if (!controllerPromise) {
    controllerPromise = import('./v129/workflow-review.js?v=129evidence2')
      .then((module) => {
        controller = module.installWorkflowReview({
          announce: (message) => window.GringottsV127?.announce?.(message),
          enhance: (root) => window.GringottsV127?.enhance?.(root)
        });
        return controller;
      })
      .catch((error) => {
        renderLoadFailure(error);
        throw error;
      });
  }
  return controllerPromise;
}

async function openReview(focusHeading = true) {
  ensureWorkflowTab();
  if (!renderReviewShell()) return false;
  const nextController = await loadController();
  return nextController.open({ focusHeading });
}

function handleClick(event) {
  const primary = event.target.closest?.('[data-tab]');
  if (primary) controller?.deactivate();
  const toolsButton = event.target.closest?.('[data-tools-section]');
  if (!toolsButton || toolsButton.dataset.toolsSection === WORKFLOW_SECTION) return;
  controller?.deactivate();
}

function handleRouteReady(event) {
  updateMetadata();
  ensureWorkflowTab();
  enhanceRoadmapStatus();
  const route = event.detail?.route || window.GringottsV126?.coordinator?.route || '';
  if (route !== 'tools') {
    controller?.deactivate();
    return;
  }
  const reviewVisible = Boolean(document.querySelector('[data-v129-workflow-review="true"]'));
  if (controller?.isActive() && !reviewVisible) controller.open().catch(() => {});
}

function snapshot() {
  const review = controller?.snapshot() || { reviewStateCount:0, reviewedCount:0, completeCount:0, inventoryCount:10 };
  return {
    release: RELEASE.version,
    ...review,
    manualReviewOnly: true,
    automaticTelemetry: false,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    primaryDestinations: RELEASE.primaryDestinations,
    toolsSections: RELEASE.toolsSections,
    workbookSheets: RELEASE.workbookSheets,
    networkBudgetDelta: 0,
    lazyController: true
  };
}

function install() {
  if (installed) return window.GringottsV129;
  installed = true;
  window.addEventListener('click',handleClick,true);
  document.addEventListener('gringotts:v126-route-ready',handleRouteReady);
  Object.assign(window.GringottsV129 || (window.GringottsV129 = {}), {
    release: RELEASE.version,
    name: RELEASE.name,
    featureFreeze: true,
    inventoryCount: 10,
    manualReviewOnly: true,
    automaticTelemetry: false,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    primaryDestinations: RELEASE.primaryDestinations,
    toolsSections: RELEASE.toolsSections,
    workbookSheets: RELEASE.workbookSheets,
    openReview: () => new Promise((resolve) => setTimeout(() => resolve(openReview(true)), 0)),
    snapshot
  });
  const start = () => { updateMetadata(); ensureWorkflowTab(); enhanceRoadmapStatus(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else queueMicrotask(start);
  return window.GringottsV129;
}

install();
