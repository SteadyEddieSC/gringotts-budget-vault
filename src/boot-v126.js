const boot = document.getElementById('bootStatus');

if (!globalThis.CSS) globalThis.CSS = {};
if (typeof globalThis.CSS.escape !== 'function') {
  globalThis.CSS.escape = (value) => String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function renderFailure(error) {
  const message = error?.stack || error?.message || String(error || 'Unknown module-loading error');
  if (!boot) return;
  if (!boot.isConnected) document.body.replaceChildren(boot);
  boot.innerHTML = `
    <section class="boot-card" role="alert">
      <h1>Gringotts could not start</h1>
      <p>The v126 reliability shell stopped without clearing or overwriting the browser-local vault, close history, goals, planning metadata, profiles, receipts, account cleanup plan, recurring decisions, scenarios, or report settings.</p>
      <div class="boot-actions">
        <button id="bootRetry" type="button">Retry v126</button>
        <a href="rescue-v105.html?release=rescue1051">Open stable v105 rescue</a>
      </div>
      <details open><summary>Technical detail</summary><pre>${escapeHtml(message)}</pre></details>
    </section>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (event) => { if (event?.error) renderFailure(event.error); });
window.addEventListener('unhandledrejection', (event) => renderFailure(event?.reason));

const lazyRoutes = new Set(['money', 'reports', 'activity', 'tools']);
let dispatcher = null;
let coordinator = null;
let installLegacyLayer = null;
let installV126Runtime = null;
let routeLayersPromise = null;
let routeLayersReady = false;
let routeReplayInProgress = false;
let pendingRoute = '';
let legacyAdapters = [];

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function registerRouteFeatures({ accountCleanup, recurring, scenario }) {
  const cleanupPromise = Promise.resolve(accountCleanup);
  Object.assign(window.GringottsV122 || (window.GringottsV122 = {}), {
    release: 'v122',
    loadAccountCleanupFeatures: () => cleanupPromise
  });

  const recurringPromise = Promise.resolve(recurring);
  Object.assign(window.GringottsV123 || (window.GringottsV123 = {}), {
    release: 'v123',
    loadFeatures: () => recurringPromise,
    enhanceRecurringDecisionPage: recurring.enhanceRecurringDecisionPage,
    enhanceGuidedPlanPage: recurring.enhanceGuidedPlanPage,
    enhanceRecurringReportPages: recurring.enhanceRecurringReportPages
  });

  const scenarioPromise = Promise.resolve(scenario);
  Object.assign(window.GringottsV124 || (window.GringottsV124 = {}), {
    release: 'v124',
    loadScenarioFeatures: () => scenarioPromise,
    enhanceScenarioPage: scenario.enhanceScenarioPage,
    enhanceScenarioReportPages: scenario.enhanceScenarioReportPages,
    enhanceScenarioGuidedPlan: scenario.enhanceScenarioGuidedPlan
  });
}

function registerLegacyEnhancer(id, title, order) {
  const registry = window[`Gringotts${id.toUpperCase()}`];
  if (typeof registry?.enhance !== 'function') return;
  coordinator.registerRelease({ id, title, order, enhance: registry.enhance });
}

async function installLayer(name, priority, install) {
  const result = await installLegacyLayer({ name, dispatcher, priority, install });
  legacyAdapters.push({
    name: result.name,
    capturedActions: result.capturedActions,
    delegatedListeners: result.delegatedListeners,
    observerSuppressed: result.observerSuppressed
  });
  return result.result;
}

async function prepareRouteLayers(modules) {
  const { v118, v119, v120, v121, accountCleanup, recurring, scenario, v125 } = modules;

  await installLayer('v118', 20, () => v118.activateV118());
  registerLegacyEnhancer('v118', 'Profile Portability & Institution Patterns', 118);

  await installLayer('v119', 30, async () => {
    v119.prepareV119Interceptors();
    return v119.activateV119();
  });
  registerLegacyEnhancer('v119', 'Profile Versioning & Dry-Run Diagnostics', 119);

  await installLayer('v120', 10, async () => {
    v120.prepareV120Interceptors();
    return v120.activateV120();
  });
  registerLegacyEnhancer('v120', 'Import Receipt Audit & Rollback Guidance', 120);

  await installLayer('v121', 10, async () => {
    await v121.prepareV121Interceptors();
    return v121.activateV121();
  });
  registerLegacyEnhancer('v121', 'Receipt Integrity & Import Batch Reconciliation', 121);

  registerRouteFeatures({ accountCleanup, recurring, scenario });
  await installLayer('v122-account-cleanup', 40, () => accountCleanup.installAccountCleanupFeatures());
  await installLayer('v123-recurring-decisions', 40, () => recurring.installRecurringDecisionFeatures());
  await installLayer('v124-scenario-comparison', 40, () => scenario.installScenarioComparisonFeatures());

  await installLayer('v125', 10, async () => {
    await v125.prepareV125Interceptors();
    return v125.activateV125();
  });
  registerLegacyEnhancer('v125', 'Close History & Trend Explainability', 125);

  installV126Runtime({ coordinator, dispatcher, legacyAdapters });
  window.GringottsV126.loadRouteLayers = loadRouteLayers;
  routeLayersReady = true;
  return modules;
}

function loadRouteLayers() {
  if (!routeLayersPromise) {
    routeLayersPromise = Promise.all([
      import('./v118/release.js?v=126runtime1'),
      import('./v119/release.js?v=126runtime1'),
      import('./v120/release.js?v=126runtime1'),
      import('./v121/release.js?v=126runtime1'),
      import('./v122/account-cleanup.js?v=126runtime1'),
      import('./v123/recurring-decisions.js?v=126runtime1'),
      import('./v124/scenario-comparison.js?v=126runtime1'),
      import('./v125/release.js?v=126runtime1')
    ]).then(([v118, v119, v120, v121, accountCleanup, recurring, scenario, v125]) =>
      prepareRouteLayers({ v118, v119, v120, v121, accountCleanup, recurring, scenario, v125 })
    ).catch((error) => {
      routeLayersPromise = null;
      routeLayersReady = false;
      throw error;
    });
  }
  return routeLayersPromise;
}

function replayRoute(route) {
  const button = document.querySelector(`[data-tab="${CSS.escape(route)}"]`);
  if (!button) throw new Error(`The prepared route button is unavailable: ${route}`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
}

function handleRouteAction(event) {
  const button = event.target.closest?.('[data-tab]');
  const route = button?.dataset.tab;
  if (!button || !route) return false;
  coordinator.beginRoute(route, routeLayersReady ? 'navigation' : 'lazy-navigation');
  if (!lazyRoutes.has(route) || routeLayersReady) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  pendingRoute = route;
  if (routeReplayInProgress) return true;
  routeReplayInProgress = true;
  loadRouteLayers()
    .then(() => {
      const requestedRoute = pendingRoute || route;
      pendingRoute = '';
      replayRoute(requestedRoute);
    })
    .catch(renderFailure)
    .finally(() => { routeReplayInProgress = false; });
  return true;
}

function handleAccountLabelInput(event) {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches('[data-bank-option="accountLabel"]')) return false;
  window.GringottsV115?.updateBankOption?.('accountLabel', target.value);
  return true;
}

function handleRouteFailure(event) {
  const detail = event.detail || {};
  const main = document.getElementById('main');
  if (!main || main.querySelector('.v126-route-failure')) return;
  const card = document.createElement('article');
  card.className = 'card error-box v126-route-failure';
  card.setAttribute('role', 'alert');
  card.innerHTML = `<h3>Route enhancements could not finish</h3>
    <p>The base route remains available and browser-local data was not cleared. Retry the enhancement pass or open the stable rescue shell.</p>
    <p class="muted-note">${escapeHtml(detail.errors?.[0]?.message || 'Unknown enhancement error')}</p>
    <div class="button-row"><button type="button" class="btn secondary" id="retryV126Enhancements">Retry Route Enhancements</button><a class="btn secondary" href="rescue-v105.html?release=rescue1051">Open Stable v105 Rescue</a></div>`;
  main.prepend(card);
}

document.addEventListener('gringotts:v126-route-ready', () => {
  document.querySelector('.v126-route-failure')?.remove();
  const registry = window.GringottsV126 || (window.GringottsV126 = {});
  registry.routeEnhancementsReady = true;
});
document.addEventListener('gringotts:v126-route-failed', handleRouteFailure);

Promise.all([
  import('./runtime-v111-reporting.js?v=126runtime1'),
  import('./v126/runtime.js?v=126runtime1'),
  import('./v126/release.js?v=126runtime1'),
  import('./v115/release.js?v=126runtime1'),
  import('./v112/accessibility.js?v=126runtime1')
]).then(async ([, runtimeModule, releaseModule, v115, accessibility]) => {
  const build = v115.activateV115();
  dispatcher = runtimeModule.createActionDispatcher({ target: document }).install();
  coordinator = runtimeModule.createRuntimeCoordinator({ documentRef: document }).install();
  installLegacyLayer = runtimeModule.installLegacyLayer;
  installV126Runtime = releaseModule.installV126Runtime;

  dispatcher.register('click', 'v126-route-lifecycle', handleRouteAction, 1000);
  dispatcher.register('input', 'v115-account-label', handleAccountLabelInput, 60);
  installV126Runtime({ coordinator, dispatcher, legacyAdapters });

  Object.assign(build, {
    version: 'v126',
    name: 'Runtime Consolidation & Reliability',
    runtime: 'src/runtime-v111-reporting.js + one v126 route coordinator + one v126 action dispatcher + lazy v115-v125 capabilities',
    cacheBust: '126runtime1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, build);
  accessibility.installAccessibilityEnhancements();
  document.title = `Gringotts Budget Vault ${build.version}`;
  const version = document.querySelector('.version-text');
  if (version) version.textContent = build.version;
  Object.assign(window.GringottsV126 || (window.GringottsV126 = {}), {
    release: 'v126',
    loadRouteLayers,
    routeEnhancementsReady: false
  });
  await coordinator.enhanceExistingRoute();
  if (boot?.isConnected) boot.remove();
}).catch(renderFailure);
