import { V130_PERFORMANCE_BUDGETS, evaluatePerformanceBudget } from './performance-contracts.js?v=130perf1';

const RELEASE = Object.freeze({
  version: 'v130',
  name: 'Performance & Maintenance Hardening',
  featureFreeze: true,
  primaryDestinations: 6,
  workbookSheets: 43
});

const CSS = String.raw`
.v130-performance-card{display:grid;gap:.85rem;margin-bottom:1rem}.v130-performance-card h3,.v130-performance-card p{margin:0}.v130-performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem}.v130-performance-grid span{display:grid;gap:.15rem;min-width:0;padding:.7rem;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:.75rem;background:color-mix(in srgb,var(--panel,#111827) 88%,transparent)}.v130-performance-grid strong{overflow-wrap:anywhere}.v130-performance-status{border-inline-start:4px solid var(--green,#6fc49a);padding:.7rem .9rem;border-radius:.65rem;background:color-mix(in srgb,var(--green,#6fc49a) 8%,transparent)}.v130-performance-status.warning{border-inline-start-color:var(--gold,#d7b45b);background:color-mix(in srgb,var(--gold,#d7b45b) 8%,transparent)}
@media(max-width:850px){.v130-performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.v130-performance-grid{grid-template-columns:1fr}}@media print{.v130-performance-card{display:none!important}}
`;

const history = [];
let installed = false;
let runtimeContext = null;
let lastRecordKey = '';
let startupResources = null;

function installStyles() {
  if (document.querySelector('style[data-v130-performance-styles]')) return;
  const style = document.createElement('style');
  style.dataset.v130PerformanceStyles = 'true';
  style.textContent = CSS;
  document.head.append(style);
}

function finite(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
}

function resourceEvidence() {
  const entries = typeof performance?.getEntriesByType === 'function' ? performance.getEntriesByType('resource') : [];
  const scripts = entries.filter((entry) => entry.initiatorType === 'script');
  const scriptBytes = scripts.reduce((sum, entry) => sum + finite(entry.decodedBodySize || entry.transferSize), 0);
  return {
    networkRequests: entries.length + 1,
    scriptBytes,
    scriptMeasurementAvailable: scripts.some((entry) => finite(entry.decodedBodySize || entry.transferSize) > 0)
  };
}

function budgetInput(lifecycle = runtimeContext?.coordinator?.snapshot?.() || {}) {
  const actions = runtimeContext?.dispatcher?.snapshot?.() || {};
  const resources = startupResources || resourceEvidence();
  return {
    routeReadyMs: finite(lifecycle.routeReadyMs),
    enhancementMs: finite(lifecycle.enhancementMs),
    enhancementPasses: finite(lifecycle.enhancementPasses),
    observerCallbacks: finite(lifecycle.observerCallbacks),
    registeredReleases: finite(lifecycle.releaseCount),
    registeredActions: finite(actions.registered),
    networkRequests: finite(resources.networkRequests),
    scriptBytes: finite(resources.scriptBytes),
    workbookSheets: RELEASE.workbookSheets,
    runtimeObservers: finite(lifecycle.observerCount),
    primaryDestinations: document.querySelectorAll('[data-tab]').length,
    dispatcherOwned: window.GringottsV129?.dispatcherOwned === true,
    coordinatorOwned: window.GringottsV129?.coordinatorOwned === true
  };
}

function currentSnapshot(lifecycle = runtimeContext?.coordinator?.snapshot?.() || {}) {
  const input = budgetInput(lifecycle);
  const evaluation = evaluatePerformanceBudget(input);
  const resources = startupResources || resourceEvidence();
  return {
    release: RELEASE.version,
    route: lifecycle.route || 'dashboard',
    subroute: lifecycle.subroute || '',
    cycle: finite(lifecycle.cycle),
    readyAt: lifecycle.readyAt || '',
    status: lifecycle.status || 'unknown',
    input,
    evaluation,
    scriptMeasurementAvailable: resources.scriptMeasurementAvailable,
    lighthouseIsAuthoritativeForAssets: true
  };
}

function recordReady(lifecycle) {
  const snapshot = currentSnapshot(lifecycle);
  const key = `${snapshot.cycle}:${snapshot.readyAt}:${snapshot.route}:${snapshot.subroute}`;
  if (!snapshot.readyAt || key === lastRecordKey) return snapshot;
  lastRecordKey = key;
  history.push(Object.freeze({
    route: snapshot.route,
    subroute: snapshot.subroute,
    cycle: snapshot.cycle,
    readyAt: snapshot.readyAt,
    routeReadyMs: snapshot.input.routeReadyMs,
    enhancementMs: snapshot.input.enhancementMs,
    enhancementPasses: snapshot.input.enhancementPasses,
    observerCallbacks: snapshot.input.observerCallbacks,
    ok: snapshot.evaluation.ok,
    failures: [...snapshot.evaluation.failures]
  }));
  while (history.length > V130_PERFORMANCE_BUDGETS.maxSessionSamples) history.shift();
  return snapshot;
}

function handleRouteReady(event) {
  recordReady(event.detail || runtimeContext?.coordinator?.snapshot?.() || {});
}

function setText(node, value) {
  if (node && node.textContent !== value) node.textContent = value;
}

function metric(label, value) {
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = String(value);
  span.append(strong, document.createTextNode(label));
  return span;
}

function renderDiagnostics(root, routeContext) {
  if (routeContext.route !== 'tools' || routeContext.subroute !== 'diagnostics') return;
  installStyles();
  let card = root.querySelector('[data-v130-performance-card]');
  if (!card) {
    card = document.createElement('article');
    card.className = 'card v130-performance-card';
    card.dataset.v130PerformanceCard = 'true';
    card.innerHTML = '<h3>Performance & maintenance budgets</h3><p class="v130-performance-copy"></p><div class="v130-performance-grid"></div><p class="v130-performance-status" role="status"></p>';
    const existing = root.querySelector('.v126-runtime-health-card');
    if (existing) existing.insertAdjacentElement('afterend', card);
    else root.prepend(card);
  }
  const snapshot = currentSnapshot();
  const copy = card.querySelector('.v130-performance-copy');
  setText(copy, 'Session-only runtime evidence. No household financial data, browser storage, analytics, or remote logging is used. Lighthouse remains authoritative for request and script-byte ceilings.');
  const grid = card.querySelector('.v130-performance-grid');
  const next = [
    metric('Route ready', `${snapshot.input.routeReadyMs} ms / ${V130_PERFORMANCE_BUDGETS.routeReadyMs}`),
    metric('Enhancement', `${snapshot.input.enhancementMs} ms / ${V130_PERFORMANCE_BUDGETS.enhancementMs}`),
    metric('Passes', `${snapshot.input.enhancementPasses} / ${V130_PERFORMANCE_BUDGETS.maxEnhancementPasses}`),
    metric('Observer callbacks', `${snapshot.input.observerCallbacks} / ${V130_PERFORMANCE_BUDGETS.maxObserverCallbacksPerRoute}`),
    metric('Owned observers', `${snapshot.input.runtimeObservers} / ${V130_PERFORMANCE_BUDGETS.maxRuntimeObservers}`),
    metric('Registered actions', `${snapshot.input.registeredActions} / ${V130_PERFORMANCE_BUDGETS.maxRegisteredActions}`),
    metric('Session samples', `${history.length} / ${V130_PERFORMANCE_BUDGETS.maxSessionSamples}`),
    metric('Workbook cap', `${snapshot.input.workbookSheets} / ${V130_PERFORMANCE_BUDGETS.maxWorkbookSheets}`)
  ];
  if (grid.childElementCount !== next.length || grid.textContent !== next.map((node) => node.textContent).join('')) grid.replaceChildren(...next);
  const status = card.querySelector('.v130-performance-status');
  status.classList.toggle('warning', !snapshot.evaluation.ok);
  setText(status, snapshot.evaluation.ok ? 'Current runtime ownership and measured route budgets are within the v130 contract.' : `Review required: ${snapshot.evaluation.failures.join(' ')}`);
  window.GringottsV127?.enhance?.(card);
}

function updateMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, {
    version: RELEASE.version,
    name: RELEASE.name,
    runtime: 'src/runtime-v111-reporting.js + v126 coordinator/dispatcher + v128 UX/typed foundation + shared v129 workflow integration + v130 budget enforcement',
    cacheBust: '130hardening1'
  });
  const title = `Gringotts Budget Vault ${RELEASE.version}`;
  if (document.title !== title) document.title = title;
  const version = document.querySelector('.version-text');
  if (version && version.textContent !== RELEASE.version) version.textContent = RELEASE.version;
}

async function enhanceV130(root, routeContext) {
  updateMetadata();
  renderDiagnostics(root, routeContext);
}

function snapshot() {
  const current = currentSnapshot();
  return {
    release: RELEASE.version,
    name: RELEASE.name,
    featureFreeze: true,
    current,
    history: history.map((entry) => ({ ...entry, failures: [...entry.failures] })),
    historyCount: history.length,
    historyCap: V130_PERFORMANCE_BUDGETS.maxSessionSamples,
    memoryOnlyHistory: true,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    serviceWorkerAdded: false,
    primaryDestinations: RELEASE.primaryDestinations,
    workbookSheets: RELEASE.workbookSheets,
    activeBootImportsV129: false,
    v129CompatibilityBootRetained: true,
    dispatcherOwnedWorkflowReview: window.GringottsV129?.dispatcherOwned === true,
    coordinatorOwnedWorkflowReview: window.GringottsV129?.coordinatorOwned === true,
    budgets: { ...V130_PERFORMANCE_BUDGETS }
  };
}

export function installV130Performance({ coordinator, dispatcher } = {}) {
  if (!coordinator || !dispatcher) throw new Error('v130 performance hardening requires the v126 coordinator and dispatcher.');
  if (installed) return window.GringottsV130;
  installed = true;
  runtimeContext = { coordinator, dispatcher };
  startupResources = resourceEvidence();
  document.addEventListener('gringotts:v126-route-ready', handleRouteReady);
  coordinator.registerRelease({
    id: 'v130',
    title: RELEASE.name,
    order: 130,
    enhance: enhanceV130
  });
  Object.assign(window.GringottsV130 || (window.GringottsV130 = {}), {
    release: RELEASE.version,
    name: RELEASE.name,
    featureFreeze: true,
    memoryOnlyHistory: true,
    financialDataRead: false,
    persistentStoreAdded: false,
    networkImplementationAdded: false,
    observerAdded: false,
    serviceWorkerAdded: false,
    primaryDestinations: RELEASE.primaryDestinations,
    workbookSheets: RELEASE.workbookSheets,
    budgets: V130_PERFORMANCE_BUDGETS,
    evaluate: evaluatePerformanceBudget,
    snapshot
  });
  updateMetadata();
  recordReady(coordinator.snapshot());
  coordinator.queue('v130-install');
  return window.GringottsV130;
}
