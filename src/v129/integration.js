const WORKFLOW_SECTION = 'workflow-review';
const ROADMAP_FIRST = 127;
const ROADMAP_LAST = 136;

let installed = false;
let registeredWithCoordinator = false;
let controller = null;
let controllerPromise = null;
let context = null;

function normalizeHostRelease(value = {}) {
  const version = /^v\d+$/.test(String(value.version || '')) ? String(value.version) : 'v129';
  return Object.freeze({
    version,
    name: String(value.name || 'Household Workflow Evidence Review'),
    featureFreeze: value.featureFreeze !== false,
    primaryDestinations: 6,
    toolsSections: 5,
    workbookSheets: 43
  });
}

function roadmapNumber(version) {
  const value = Number(String(version || '').replace(/^v/, ''));
  return Number.isInteger(value) ? value : 129;
}

function setRoadmapStatus(version, status, label) {
  const card = document.querySelector(`[data-roadmap-version="${version}"]`);
  if (!card) return false;
  let changed = false;
  if (card.dataset.roadmapStatus !== status) {
    card.dataset.roadmapStatus = status;
    changed = true;
  }
  const badge = card.querySelector('.badge');
  if (badge && badge.textContent !== label) {
    badge.textContent = label;
    changed = true;
  }
  return changed;
}

function enhanceRoadmapStatus(currentVersion) {
  const current = roadmapNumber(currentVersion);
  for (let release = ROADMAP_FIRST; release <= ROADMAP_LAST; release += 1) {
    const version = `v${release}`;
    if (release < current) setRoadmapStatus(version, 'shipped', 'Shipped');
    else if (release === current) setRoadmapStatus(version, 'current', 'Current release');
    else setRoadmapStatus(version, 'directional', 'Directional');
  }
}

function updateMetadata() {
  const host = context?.hostRelease;
  if (!host) return;
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version: host.version,
    name: host.name,
    runtime: `${build.runtime || 'v128 runtime'} + coordinator-owned v129 workflow review`,
    cacheBust: host.version === 'v129' ? '129integration2' : '130hardening2'
  });
  const title = `Gringotts Budget Vault ${host.version}`;
  if (document.title !== title) document.title = title;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== host.version) version.textContent = host.version;
}

function ensureWorkflowTab() {
  const subnav = document.querySelector('.tools-subnav');
  if (!subnav || subnav.querySelector(`[data-tools-section="${WORKFLOW_SECTION}"]`)) return false;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'subtab';
  button.dataset.toolsSection = WORKFLOW_SECTION;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', 'false');
  button.setAttribute('tabindex', '-1');
  button.textContent = 'Workflow Review';
  subnav.insertBefore(button, subnav.querySelector('[data-tools-section="roadmap"]'));
  return true;
}

function renderLoadFailure(error) {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return error;
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'card error-box';
  section.setAttribute('role', 'alert');
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
    controllerPromise = import('./workflow-review.js?v=130ownership2')
      .then((module) => {
        controller = module.installWorkflowReview({
          dispatcher: context.dispatcher,
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

function handleWorkflowAction(event) {
  const toolsButton = event.target.closest?.('[data-tools-section]');
  if (!toolsButton) return false;
  if (toolsButton.dataset.toolsSection !== WORKFLOW_SECTION) {
    controller?.deactivate();
    return false;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  setTimeout(() => openReview(true).catch(() => {}), 0);
  return true;
}

export async function enhanceWorkflowIntegration(_root, routeContext = {}) {
  updateMetadata();
  enhanceRoadmapStatus(context.hostRelease.version);
  const route = routeContext.route || context.coordinator.route || '';
  if (route !== 'tools') {
    controller?.deactivate();
    return;
  }
  ensureWorkflowTab();
  const reviewVisible = Boolean(document.querySelector('[data-v129-workflow-review="true"]'));
  if (controller?.isActive() && !reviewVisible) await controller.open({ focusHeading: false });
}

function snapshot() {
  const review = controller?.snapshot() || { reviewStateCount: 0, reviewedCount: 0, completeCount: 0, inventoryCount: 10 };
  return {
    release: 'v129',
    hostRelease: context?.hostRelease?.version || 'v129',
    ...review,
    integrationLoaded: true,
    manualReviewOnly: true,
    automaticTelemetry: false,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    dispatcherOwned: true,
    coordinatorOwned: true,
    registeredAsRelease: registeredWithCoordinator,
    standaloneClickListener: false,
    standaloneRouteReadyListener: false,
    primaryDestinations: 6,
    toolsSections: 5,
    workbookSheets: 43,
    networkBudgetDelta: 0,
    lazyController: true
  };
}

export function waitForV126Runtime() {
  const ready = () => window.GringottsV126?.coordinator && window.GringottsV126?.dispatcher;
  if (ready()) return Promise.resolve({ coordinator: window.GringottsV126.coordinator, dispatcher: window.GringottsV126.dispatcher });
  return new Promise((resolve) => {
    const handle = () => {
      if (!ready()) return;
      document.removeEventListener('gringotts:v126-route-ready', handle);
      resolve({ coordinator: window.GringottsV126.coordinator, dispatcher: window.GringottsV126.dispatcher });
    };
    document.addEventListener('gringotts:v126-route-ready', handle);
  });
}

export function installWorkflowReviewIntegration({ coordinator, dispatcher, hostRelease, registerWithCoordinator = true } = {}) {
  if (!coordinator || !dispatcher) throw new Error('Workflow Review integration requires the v126 coordinator and dispatcher.');
  const normalizedHost = normalizeHostRelease(hostRelease);
  if (installed) {
    context.hostRelease = normalizedHost;
    updateMetadata();
    return window.GringottsV129;
  }
  installed = true;
  context = { coordinator, dispatcher, hostRelease: normalizedHost };
  dispatcher.register('click', 'v129-workflow-review-route', handleWorkflowAction, 180);
  if (registerWithCoordinator) {
    registeredWithCoordinator = true;
    coordinator.registerRelease({
      id: 'v129',
      title: 'Household Workflow Evidence Review',
      order: 129,
      enhance: enhanceWorkflowIntegration
    });
  }
  Object.assign(window.GringottsV129 || (window.GringottsV129 = {}), {
    release: 'v129',
    name: 'Household Workflow Evidence Review',
    featureFreeze: true,
    inventoryCount: 10,
    manualReviewOnly: true,
    automaticTelemetry: false,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    integrationLoaded: true,
    dispatcherOwned: true,
    coordinatorOwned: true,
    registeredAsRelease: registeredWithCoordinator,
    standaloneClickListener: false,
    standaloneRouteReadyListener: false,
    primaryDestinations: 6,
    toolsSections: 5,
    workbookSheets: 43,
    openReview: () => new Promise((resolve) => setTimeout(() => resolve(openReview(true)), 0)),
    enhance: enhanceWorkflowIntegration,
    snapshot
  });
  updateMetadata();
  if (registerWithCoordinator) coordinator.queue('v129-integration-install');
  return window.GringottsV129;
}
