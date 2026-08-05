import './boot-v128.js?v=132base1';
import {
  CURRENT_RELEASE as RELEASE,
  CURRENT_RELEASE_TITLE,
  validateCurrentReleaseManifest
} from './release-manifest.js';

validateCurrentReleaseManifest();

const BUDGETS = RELEASE.budgets;
const state = { history:[], lastKey:'', startupResources:null, lastEvaluation:null, workflowLoaded:false, diagnosticsLoaded:false, decisionIntegrationLoaded:false };
let runtime = null;
let workflowPromise = null;
let diagnosticsPromise = null;
let decisionPromise = null;
let decisionModule = null;

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

function finite(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
}

function resourceEvidence() {
  const entries = typeof performance?.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
  const scripts = entries.filter((entry) => entry.initiatorType === 'script');
  return Object.freeze({
    networkRequests:entries.length + 1,
    scriptBytes:scripts.reduce((sum, entry) => sum + finite(entry.decodedBodySize || entry.transferSize), 0),
    scriptMeasurementAvailable:scripts.some((entry) => finite(entry.decodedBodySize || entry.transferSize) > 0)
  });
}

function currentInput(lifecycle = runtime?.coordinator?.snapshot?.() || {}) {
  const actions = runtime?.dispatcher?.snapshot?.() || {};
  const resources = state.startupResources || { networkRequests:0, scriptBytes:0, scriptMeasurementAvailable:false };
  return {
    routeReadyMs:finite(lifecycle.routeReadyMs),
    enhancementMs:finite(lifecycle.enhancementMs),
    enhancementPasses:finite(lifecycle.enhancementPasses),
    observerCallbacks:finite(lifecycle.observerCallbacks),
    registeredReleases:finite(lifecycle.releaseCount),
    registeredActions:finite(actions.registered),
    networkRequests:finite(resources.networkRequests),
    scriptBytes:finite(resources.scriptBytes),
    workbookSheets:RELEASE.workbookSheets,
    runtimeObservers:finite(lifecycle.observerCount),
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
    route:lifecycle.route || 'dashboard',
    subroute:lifecycle.subroute || '',
    cycle:finite(lifecycle.cycle),
    readyAt:lifecycle.readyAt,
    routeReadyMs:finite(lifecycle.routeReadyMs),
    enhancementMs:finite(lifecycle.enhancementMs),
    enhancementPasses:finite(lifecycle.enhancementPasses),
    observerCallbacks:finite(lifecycle.observerCallbacks)
  }));
  while (state.history.length > BUDGETS.maxSessionSamples) state.history.shift();
}

function updateMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version:RELEASE.version,
    name:RELEASE.name,
    runtime:RELEASE.runtimeLabel,
    cacheBust:RELEASE.cacheBust
  });
  if (document.title !== CURRENT_RELEASE_TITLE) document.title = CURRENT_RELEASE_TITLE;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== RELEASE.version) version.textContent = RELEASE.version;
}

function handleRouteReady(event) {
  recordReady(event.detail || {});
  updateMetadata();
}

function placeholderWorkflowSnapshot() {
  return {
    release:'v129', hostRelease:RELEASE.version, inventoryCount:10, reviewStateCount:0, reviewedCount:0, completeCount:0,
    integrationLoaded:false, manualReviewOnly:true, automaticTelemetry:false, financialDataRead:false, persistentStoreAdded:false,
    networkImplementationAdded:false, observerAdded:false, dispatcherOwned:false, coordinatorOwned:true, registeredAsRelease:false,
    standaloneClickListener:false, standaloneRouteReadyListener:false, primaryDestinations:RELEASE.primaryDestinations,
    toolsSections:RELEASE.toolsSections, workbookSheets:RELEASE.workbookSheets, networkBudgetDelta:0, lazyController:true
  };
}

function placeholderDecisionSnapshot() {
  return {
    release:'v131', hostRelease:RELEASE.version, name:'Observed Needs Decision Gate', featureFreeze:true,
    reviewLoaded:false, completeCount:0, inventoryCount:10, state:'evidence-incomplete', disposition:'unselected',
    integrationLoaded:false, uiLoaded:false, manualDecisionOnly:true, automaticApproval:false, financialDataRead:false,
    persistentStoreAdded:false, networkImplementationAdded:false, observerAdded:false, serviceWorkerAdded:false,
    primaryDestinations:RELEASE.primaryDestinations, toolsSections:RELEASE.toolsSections, workbookSheets:RELEASE.workbookSheets,
    integrationLazy:true, uiLazy:true, memoryOnly:true
  };
}

Object.assign(window.GringottsV129 || (window.GringottsV129 = {}), { ...placeholderWorkflowSnapshot(), snapshot:placeholderWorkflowSnapshot });
Object.assign(window.GringottsV131 || (window.GringottsV131 = {}), { ...placeholderDecisionSnapshot(), snapshot:() => decisionModule?.decisionGateSnapshot?.() || placeholderDecisionSnapshot() });

async function loadWorkflow(root, routeContext) {
  if (!workflowPromise) workflowPromise = import(`./v129/integration.js?v=${RELEASE.assets.workflow}`);
  const module = await workflowPromise;
  module.installWorkflowReviewIntegration({ ...runtime, hostRelease:RELEASE, registerWithCoordinator:false });
  state.workflowLoaded = true;
  await module.enhanceWorkflowIntegration(root, routeContext);
}

async function loadDecisionIntegration(root, routeContext) {
  if (!decisionPromise) decisionPromise = import(`./v131/integration.js?v=${RELEASE.assets.decisionIntegration}`);
  decisionModule = await decisionPromise;
  decisionModule.installDecisionGateIntegration({ ...runtime, hostRelease:RELEASE });
  state.decisionIntegrationLoaded = true;
  await decisionModule.enhanceDecisionGateIntegration(root, routeContext);
}

async function loadDiagnostics(root, routeContext) {
  if (!diagnosticsPromise) diagnosticsPromise = import(`./v130/runtime-health.js?v=${RELEASE.assets.diagnostics}`);
  const module = await diagnosticsPromise;
  state.diagnosticsLoaded = true;
  await module.renderV130Diagnostics({ root, routeContext, runtime, release:RELEASE, budgets:BUDGETS, state, currentInput });
}

async function enhanceV132(root, routeContext = {}) {
  updateMetadata();
  if (routeContext.route === 'tools') {
    await loadWorkflow(root, routeContext);
    await loadDecisionIntegration(root, routeContext);
  } else {
    if (state.workflowLoaded) {
      const module = await workflowPromise;
      await module.enhanceWorkflowIntegration(root, routeContext);
    }
    if (state.decisionIntegrationLoaded && decisionModule) await decisionModule.enhanceDecisionGateIntegration(root, routeContext);
  }
  if (routeContext.route === 'tools' && routeContext.subroute === 'diagnostics') await loadDiagnostics(root, routeContext);
  updateMetadata();
}

function performanceSnapshot() {
  const lifecycle = runtime?.coordinator?.snapshot?.() || {};
  return {
    release:'v130', hostRelease:RELEASE.version, name:'Performance & Maintenance Hardening', featureFreeze:true,
    current:{ route:lifecycle.route || 'dashboard', subroute:lifecycle.subroute || '', status:lifecycle.status || 'unknown', input:currentInput(lifecycle), evaluation:state.lastEvaluation },
    history:state.history.map((entry) => ({ ...entry })), historyCount:state.history.length, historyCap:BUDGETS.maxSessionSamples,
    memoryOnlyHistory:true, financialDataRead:false, persistentStoreAdded:false, networkImplementationAdded:false,
    observerAdded:false, serviceWorkerAdded:false, primaryDestinations:RELEASE.primaryDestinations, workbookSheets:RELEASE.workbookSheets,
    activeBootImportsV129:false, workflowIntegrationLazy:true, workflowIntegrationLoaded:state.workflowLoaded,
    diagnosticsLazy:true, diagnosticsLoaded:state.diagnosticsLoaded, v129CompatibilityBootRetained:true,
    dispatcherOwnedWorkflowReview:window.GringottsV129?.dispatcherOwned === true, coordinatorOwnedWorkflowReview:true,
    budgets:{ ...BUDGETS }, startupResources:{ ...(state.startupResources || {}) }
  };
}

function infrastructureSnapshot() {
  const gate = decisionModule?.decisionGateSnapshot?.() || placeholderDecisionSnapshot();
  return {
    release:RELEASE.version, name:RELEASE.name, featureFreeze:RELEASE.featureFreeze,
    manifestVersion:RELEASE.version, packageVersion:RELEASE.packageVersion, bootSpecifier:RELEASE.bootSpecifier,
    currentTitle:CURRENT_RELEASE_TITLE, centralizedReleaseManifest:true, centralizedVersionAssertions:true,
    versionlessShellTitles:true, decisionGate:gate, decisionIntegrationLoaded:state.decisionIntegrationLoaded,
    workflowIntegrationLoaded:state.workflowLoaded, diagnosticsLoaded:state.diagnosticsLoaded,
    runtimeEvidenceRelease:RELEASE.runtimeEvidenceRelease, activeBootImportsV131:false, activeBootImportsV130:false,
    activeBootImportsV129:false, startupLight:true, financialDataRead:false, persistentStoreAdded:false,
    networkImplementationAdded:false, observerAdded:false, serviceWorkerAdded:false,
    primaryDestinations:RELEASE.primaryDestinations, toolsSections:RELEASE.toolsSections,
    workbookSheets:RELEASE.workbookSheets, budgets:{ ...BUDGETS }
  };
}

async function start() {
  runtime = await waitForRuntime();
  state.startupResources = resourceEvidence();
  document.addEventListener('gringotts:v126-route-ready', handleRouteReady);
  runtime.coordinator.registerRelease({ id:RELEASE.version, title:RELEASE.name, order:RELEASE.number, enhance:enhanceV132 });
  Object.assign(window.GringottsV130 || (window.GringottsV130 = {}), {
    release:'v130', hostRelease:RELEASE.version, name:'Performance & Maintenance Hardening', featureFreeze:true,
    memoryOnlyHistory:true, financialDataRead:false, persistentStoreAdded:false, networkImplementationAdded:false,
    observerAdded:false, serviceWorkerAdded:false, primaryDestinations:RELEASE.primaryDestinations,
    workbookSheets:RELEASE.workbookSheets, budgets:BUDGETS,
    evaluate:(input) => import(`./v130/performance-contracts.js?v=${RELEASE.assets.evaluator}`).then((module) => module.evaluatePerformanceBudget(input)),
    snapshot:performanceSnapshot
  });
  Object.assign(window.GringottsV132 || (window.GringottsV132 = {}), {
    release:RELEASE.version, name:RELEASE.name, featureFreeze:RELEASE.featureFreeze,
    centralizedReleaseManifest:true, centralizedVersionAssertions:true, financialDataRead:false,
    persistentStoreAdded:false, networkImplementationAdded:false, observerAdded:false, serviceWorkerAdded:false,
    primaryDestinations:RELEASE.primaryDestinations, toolsSections:RELEASE.toolsSections,
    workbookSheets:RELEASE.workbookSheets, snapshot:infrastructureSnapshot
  });
  updateMetadata();
  recordReady(runtime.coordinator.snapshot());
  runtime.coordinator.queue('v132-install');
}

start();
