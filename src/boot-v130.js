import './boot-v128.js?v=130base2';

const RELEASE = Object.freeze({ version:'v130', name:'Performance & Maintenance Hardening', featureFreeze:true, primaryDestinations:6, toolsSections:5, workbookSheets:43 });
const BUDGETS = Object.freeze({ routeReadyMs:750, enhancementMs:300, maxEnhancementPasses:3, maxObserverCallbacksPerRoute:12, maxRegisteredReleases:12, maxRegisteredActions:40, maxNetworkRequests:45, maxScriptBytes:500_000, maxWorkbookSheets:43, maxRuntimeObservers:1, maxPrimaryDestinations:6, maxSessionSamples:12 });
const state = { history:[], lastKey:'', startupResources:null, lastEvaluation:null, workflowLoaded:false, diagnosticsLoaded:false };
let runtime = null;
let workflowPromise = null;
let diagnosticsPromise = null;

function waitForRuntime() {
  const ready = () => window.GringottsV126?.coordinator && window.GringottsV126?.dispatcher;
  if (ready()) return Promise.resolve({ coordinator:window.GringottsV126.coordinator, dispatcher:window.GringottsV126.dispatcher });
  return new Promise((resolve) => {
    const handle = () => {
      if (!ready()) return;
      document.removeEventListener('gringotts:v126-route-ready', handle);
      resolve({ coordinator:window.GringottsV126.coordinator, dispatcher:window.GringottsV126.dispatcher });
    };
    document.addEventListener('gringotts:v126-route-ready', handle);
  });
}

function finite(value) { return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0; }

function resourceEvidence() {
  const entries = typeof performance?.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
  const scripts = entries.filter((entry) => entry.initiatorType === 'script');
  return Object.freeze({
    networkRequests: entries.length + 1,
    scriptBytes: scripts.reduce((sum, entry) => sum + finite(entry.decodedBodySize || entry.transferSize), 0),
    scriptMeasurementAvailable: scripts.some((entry) => finite(entry.decodedBodySize || entry.transferSize) > 0)
  });
}

function currentInput(lifecycle = runtime?.coordinator?.snapshot?.() || {}) {
  const actions = runtime?.dispatcher?.snapshot?.() || {};
  const resources = state.startupResources || { networkRequests:0, scriptBytes:0, scriptMeasurementAvailable:false };
  return {
    routeReadyMs:finite(lifecycle.routeReadyMs), enhancementMs:finite(lifecycle.enhancementMs),
    enhancementPasses:finite(lifecycle.enhancementPasses), observerCallbacks:finite(lifecycle.observerCallbacks),
    registeredReleases:finite(lifecycle.releaseCount), registeredActions:finite(actions.registered),
    networkRequests:finite(resources.networkRequests), scriptBytes:finite(resources.scriptBytes),
    workbookSheets:RELEASE.workbookSheets, runtimeObservers:finite(lifecycle.observerCount),
    primaryDestinations:document.querySelectorAll('[data-tab]').length,
    dispatcherOwned:window.GringottsV129?.dispatcherOwned === true,
    coordinatorOwned:true
  };
}

function recordReady(lifecycle = {}) {
  const key = `${lifecycle.cycle || 0}:${lifecycle.readyAt || ''}:${lifecycle.route || ''}:${lifecycle.subroute || ''}`;
  if (!lifecycle.readyAt || key === state.lastKey) return;
  state.lastKey = key;
  state.history.push(Object.freeze({
    route:lifecycle.route || 'dashboard', subroute:lifecycle.subroute || '', cycle:finite(lifecycle.cycle), readyAt:lifecycle.readyAt,
    routeReadyMs:finite(lifecycle.routeReadyMs), enhancementMs:finite(lifecycle.enhancementMs),
    enhancementPasses:finite(lifecycle.enhancementPasses), observerCallbacks:finite(lifecycle.observerCallbacks)
  }));
  while (state.history.length > BUDGETS.maxSessionSamples) state.history.shift();
}

function updateMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version:RELEASE.version, name:RELEASE.name,
    runtime:'src/runtime-v111-reporting.js + v126 coordinator/dispatcher + v128 UX/typed foundation + lazy v129 workflow integration + lazy v130 diagnostics',
    cacheBust:'130hardening3'
  });
  const title = `Gringotts Budget Vault ${RELEASE.version}`;
  if (document.title !== title) document.title = title;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== RELEASE.version) version.textContent = RELEASE.version;
}

function handleRouteReady(event) {
  recordReady(event.detail || {});
  updateMetadata();
}

function placeholderWorkflowSnapshot() {
  return { release:'v129', hostRelease:'v130', inventoryCount:10, reviewStateCount:0, reviewedCount:0, completeCount:0,
    integrationLoaded:false, manualReviewOnly:true, automaticTelemetry:false, financialDataRead:false, persistentStoreAdded:false,
    networkImplementationAdded:false, observerAdded:false, dispatcherOwned:false, coordinatorOwned:true, registeredAsRelease:false,
    standaloneClickListener:false, standaloneRouteReadyListener:false, primaryDestinations:6, toolsSections:5, workbookSheets:43,
    networkBudgetDelta:0, lazyController:true };
}

Object.assign(window.GringottsV129 || (window.GringottsV129 = {}), { ...placeholderWorkflowSnapshot(), snapshot:placeholderWorkflowSnapshot });

async function loadWorkflow(root, routeContext) {
  if (!workflowPromise) workflowPromise = import('./v129/integration.js?v=130workflow2');
  const module = await workflowPromise;
  module.installWorkflowReviewIntegration({ ...runtime, hostRelease:RELEASE, registerWithCoordinator:false });
  state.workflowLoaded = true;
  await module.enhanceWorkflowIntegration(root, routeContext);
}

async function loadDiagnostics(root, routeContext) {
  if (!diagnosticsPromise) diagnosticsPromise = import('./v130/runtime-health.js?v=130diagnostics2');
  const module = await diagnosticsPromise;
  state.diagnosticsLoaded = true;
  await module.renderV130Diagnostics({ root, routeContext, runtime, release:RELEASE, budgets:BUDGETS, state, currentInput });
}

async function enhanceV130(root, routeContext = {}) {
  updateMetadata();
  if (routeContext.route === 'tools') await loadWorkflow(root, routeContext);
  else if (state.workflowLoaded) {
    const module = await workflowPromise;
    await module.enhanceWorkflowIntegration(root, routeContext);
  }
  if (routeContext.route === 'tools' && routeContext.subroute === 'diagnostics') await loadDiagnostics(root, routeContext);
}

function snapshot() {
  const lifecycle = runtime?.coordinator?.snapshot?.() || {};
  return {
    release:RELEASE.version, name:RELEASE.name, featureFreeze:true,
    current:{ route:lifecycle.route || 'dashboard', subroute:lifecycle.subroute || '', status:lifecycle.status || 'unknown', input:currentInput(lifecycle), evaluation:state.lastEvaluation },
    history:state.history.map((entry) => ({ ...entry })), historyCount:state.history.length, historyCap:BUDGETS.maxSessionSamples,
    memoryOnlyHistory:true, financialDataRead:false, persistentStoreAdded:false, networkImplementationAdded:false,
    observerAdded:false, serviceWorkerAdded:false, primaryDestinations:RELEASE.primaryDestinations, workbookSheets:RELEASE.workbookSheets,
    activeBootImportsV129:false, workflowIntegrationLazy:true, workflowIntegrationLoaded:state.workflowLoaded,
    diagnosticsLazy:true, diagnosticsLoaded:state.diagnosticsLoaded, v129CompatibilityBootRetained:true,
    dispatcherOwnedWorkflowReview:window.GringottsV129?.dispatcherOwned === true,
    coordinatorOwnedWorkflowReview:true, budgets:{ ...BUDGETS }, startupResources:{ ...(state.startupResources || {}) }
  };
}

async function start() {
  runtime = await waitForRuntime();
  state.startupResources = resourceEvidence();
  document.addEventListener('gringotts:v126-route-ready', handleRouteReady);
  runtime.coordinator.registerRelease({ id:'v130', title:RELEASE.name, order:130, enhance:enhanceV130 });
  Object.assign(window.GringottsV130 || (window.GringottsV130 = {}), {
    release:RELEASE.version, name:RELEASE.name, featureFreeze:true, memoryOnlyHistory:true, financialDataRead:false,
    persistentStoreAdded:false, networkImplementationAdded:false, observerAdded:false, serviceWorkerAdded:false,
    primaryDestinations:RELEASE.primaryDestinations, workbookSheets:RELEASE.workbookSheets, budgets:BUDGETS,
    evaluate:(input) => import('./v130/performance-contracts.js?v=130evaluate2').then((module) => module.evaluatePerformanceBudget(input)), snapshot
  });
  updateMetadata();
  recordReady(runtime.coordinator.snapshot());
  runtime.coordinator.queue('v130-install');
}

start();
