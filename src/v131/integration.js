const DECISION_SECTION = 'decision-gate';

let installed = false;
let controller = null;
let controllerPromise = null;
let context = null;

function normalizeHostRelease(value = {}) {
  const version = /^v\d+$/.test(String(value.version || '')) ? String(value.version) : 'v131';
  return Object.freeze({
    version,
    name: String(value.name || 'Observed Needs Decision Gate'),
    featureFreeze: value.featureFreeze !== false,
    primaryDestinations: 6,
    toolsSections: Number(value.toolsSections) || 6,
    workbookSheets: 43
  });
}

function updateMetadata() {
  const host = context?.hostRelease;
  if (!host) return;
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version:host.version,
    name:host.name,
    runtime:`${build.runtime || 'v130 runtime'} + lazy v131 decision gate`,
    cacheBust:'131decision2'
  });
  const title = `Gringotts Budget Vault ${host.version}`;
  if (document.title !== title) document.title = title;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== host.version) version.textContent = host.version;
}

function ensureDecisionTab() {
  const subnav = document.querySelector('.tools-subnav');
  if (!subnav || subnav.querySelector(`[data-tools-section="${DECISION_SECTION}"]`)) return false;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'subtab';
  button.dataset.toolsSection = DECISION_SECTION;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', 'false');
  button.setAttribute('tabindex', '-1');
  button.textContent = 'Decision Gate';
  subnav.insertBefore(button, subnav.querySelector('[data-tools-section="roadmap"]'));
  return true;
}

function renderLoadFailure() {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return;
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'card error-box';
  section.setAttribute('role', 'alert');
  section.innerHTML = '<h2>Decision Gate could not open</h2><p>The current vault and browser-local data were not changed. Reload the page and try again.</p>';
  workspace.append(section);
  window.GringottsV127?.enhance?.(section);
  window.GringottsV127?.announce?.('Decision Gate could not open');
  controllerPromise = null;
  controller = null;
}

function renderGateShell() {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return false;
  document.querySelectorAll('.tools-subnav [data-tools-section]').forEach((button) => {
    const selected = button.dataset.toolsSection === DECISION_SECTION;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.setAttribute('tabindex', selected ? '0' : '-1');
  });
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'v131-decision-gate';
  section.dataset.v131DecisionGate = 'true';
  section.innerHTML = '<article class="card"><div class="section-title-row"><div><h2 tabindex="-1">Observed Needs Decision Gate</h2><p>Loading the session-only evidence gate…</p></div><div class="section-meta">Session only</div></div><p role="status" aria-live="polite">Loading decision contracts…</p></article>';
  workspace.append(section);
  window.GringottsV127?.enhance?.(section);
  return true;
}

function loadController() {
  if (!controllerPromise) {
    controllerPromise = import('./decision-gate-ui.js?v=131ui2')
      .then((module) => {
        controller = module.installDecisionGate({
          dispatcher:context.dispatcher,
          announce:(message) => window.GringottsV127?.announce?.(message),
          enhance:(root) => window.GringottsV127?.enhance?.(root)
        });
        return controller;
      })
      .catch((error) => {
        renderLoadFailure();
        throw error;
      });
  }
  return controllerPromise;
}

async function openGate(focusHeading = true) {
  ensureDecisionTab();
  if (!renderGateShell()) return false;
  const nextController = await loadController();
  return nextController.open({ focusHeading });
}

function handleRoute(event) {
  const toolsButton = event.target.closest?.('[data-tools-section]');
  if (!toolsButton) return false;
  if (toolsButton.dataset.toolsSection !== DECISION_SECTION) {
    controller?.deactivate();
    return false;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  setTimeout(() => openGate(true).catch(() => {}), 0);
  return true;
}

export async function enhanceDecisionGateIntegration(_root, routeContext = {}) {
  updateMetadata();
  const route = routeContext.route || context.coordinator.route || '';
  if (route !== 'tools') {
    controller?.deactivate();
    return;
  }
  ensureDecisionTab();
  const visible = Boolean(document.querySelector('[data-v131-decision-gate="true"]'));
  if (controller?.isActive() && !visible) await controller.open({ focusHeading:false });
}

function snapshot() {
  const gate = controller?.snapshot() || {
    reviewLoaded:false,
    completeCount:0,
    inventoryCount:10,
    state:'evidence-incomplete',
    disposition:'unselected',
    dispatcherOwned:Boolean(context?.dispatcher),
    memoryOnly:true
  };
  return {
    release:'v131',
    name:'Observed Needs Decision Gate',
    featureFreeze:true,
    ...gate,
    integrationLoaded:true,
    uiLoaded:Boolean(controller),
    manualDecisionOnly:true,
    automaticApproval:false,
    financialDataRead:false,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false,
    primaryDestinations:6,
    toolsSections:context?.hostRelease?.toolsSections || 6,
    workbookSheets:43,
    integrationLazy:true,
    uiLazy:true
  };
}

export function decisionGateSnapshot() {
  return snapshot();
}

export function installDecisionGateIntegration({ coordinator, dispatcher, hostRelease } = {}) {
  if (!coordinator || !dispatcher) throw new Error('Decision Gate integration requires the v126 coordinator and dispatcher.');
  const normalizedHost = normalizeHostRelease(hostRelease);
  if (installed) {
    context.hostRelease = normalizedHost;
    updateMetadata();
    return window.GringottsV131;
  }
  installed = true;
  context = { coordinator, dispatcher, hostRelease:normalizedHost };
  dispatcher.register('click', 'v131-decision-gate-route', handleRoute, 175);
  const existingSnapshot = window.GringottsV131?.snapshot;
  Object.assign(window.GringottsV131 || (window.GringottsV131 = {}), {
    release:'v131',
    name:'Observed Needs Decision Gate',
    featureFreeze:true,
    manualDecisionOnly:true,
    automaticApproval:false,
    financialDataRead:false,
    persistentStoreAdded:false,
    networkImplementationAdded:false,
    observerAdded:false,
    serviceWorkerAdded:false,
    primaryDestinations:6,
    toolsSections:normalizedHost.toolsSections,
    workbookSheets:43,
    integrationLoaded:true,
    uiLoaded:false,
    integrationLazy:true,
    uiLazy:true,
    openGate:() => new Promise((resolve) => setTimeout(() => resolve(openGate(true)), 0)),
    enhance:enhanceDecisionGateIntegration
  });
  if (typeof existingSnapshot !== 'function') window.GringottsV131.snapshot = snapshot;
  updateMetadata();
  return window.GringottsV131;
}
