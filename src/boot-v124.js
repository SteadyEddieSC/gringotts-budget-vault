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
      <p>The page shell loaded, but a JavaScript module failed. Your browser-local vault, transactions, scenarios, recurring decisions, account cleanup plan, import profiles, revision history, receipt audits, batch index, Guided Plan, insights, goals, close history, report range, forecast settings, and debt plan have not been cleared or overwritten.</p>
      <div class="boot-actions">
        <button id="bootRetry" type="button">Retry v124</button>
        <a href="rescue-v105.html?release=rescue1051">Open stable v105 rescue</a>
      </div>
      <details open><summary>Technical detail</summary><pre>${escapeHtml(message)}</pre></details>
    </section>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (event) => { if (event?.error) renderFailure(event.error); });
window.addEventListener('unhandledrejection', (event) => renderFailure(event?.reason));

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.matches('[data-bank-option="accountLabel"]')) return;
  window.GringottsV115?.updateBankOption?.('accountLabel', target.value);
}, true);

let routeLayersPromise = null;
let routeLayersReady = false;
let routeLayersPrepared = false;
let routeLayersActivated = false;
let routePreparationPromise = null;
let routeReplayAttached = false;
let pendingRoute = '';

function installRecurringObserverGuard(registry) {
  if (registry.v124RecurringObserverGuard === true) return;
  const inheritedEnhancer = registry.enhanceRecurringDecisionPage;
  if (typeof inheritedEnhancer !== 'function') {
    throw new Error('The recurring decision page enhancer is unavailable.');
  }
  Object.assign(registry, {
    v124RecurringObserverGuard: true,
    enhanceRecurringDecisionPage(page) {
      if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Bills, Recurring & Budgets') return false;
      if (page.dataset.v124RecurringEnhanced === 'true') return true;
      page.dataset.v124RecurringEnhanced = 'true';
      try {
        const enhanced = inheritedEnhancer(page);
        if (!enhanced) delete page.dataset.v124RecurringEnhanced;
        return enhanced;
      } catch (error) {
        delete page.dataset.v124RecurringEnhanced;
        throw error;
      }
    }
  });
}

function registerRouteFeatures(layers) {
  const { accountCleanup, cleanupExport, recurring } = layers;
  cleanupExport.installAccountCleanupExportController();
  accountCleanup.installAccountCleanupFeatures();
  recurring.installRecurringDecisionFeatures();

  const cleanupPromise = Promise.resolve(accountCleanup);
  const v122Registry = window.GringottsV122 || (window.GringottsV122 = {});
  Object.assign(v122Registry, {
    release: 'v122',
    loadAccountCleanupFeatures: () => cleanupPromise
  });

  const recurringPromise = Promise.resolve(recurring);
  const v123Registry = window.GringottsV123 || (window.GringottsV123 = {});
  installRecurringObserverGuard(v123Registry);
  Object.assign(v123Registry, {
    release: 'v123',
    loadFeatures: () => recurringPromise
  });
}

async function prepareRouteLayers(layers) {
  if (routeLayersPrepared) return layers;
  if (!routePreparationPromise) {
    routePreparationPromise = (async () => {
      registerRouteFeatures(layers);
      await layers.v124.prepareV124Interceptors();
      await layers.v121.prepareV121Interceptors();
      layers.v120.prepareV120Interceptors();
      layers.v119.prepareV119Interceptors();
      layers.v118.prepareV118Interceptors();
      routeLayersPrepared = true;
      return layers;
    })().catch((error) => {
      routePreparationPromise = null;
      throw error;
    });
  }
  return routePreparationPromise;
}

function activateRouteLayers(layers) {
  if (routeLayersActivated) return;
  routeLayersActivated = true;
  layers.v118.activateV118();
  layers.v119.activateV119();
  layers.v120.activateV120();
  layers.v121.activateV121();
  layers.v124.activateV124();
}

function prepareAndActivateAfterRender(layers) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      prepareRouteLayers(layers)
        .then(() => activateRouteLayers(layers))
        .catch(renderFailure);
    });
  });
}

function loadRouteLayers() {
  if (!routeLayersPromise) {
    routeLayersPromise = Promise.all([
      import('./v118/release.js?v=124scenario1'),
      import('./v119/release.js?v=124scenario1'),
      import('./v120/release.js?v=124scenario1'),
      import('./v121/release.js?v=124scenario1'),
      import('./v122/account-cleanup.js?v=124scenario1'),
      import('./v122/account-cleanup-export-controller.js?v=124scenario1'),
      import('./v123/recurring-decisions.js?v=124scenario1'),
      import('./v124/release.js?v=124scenario1')
    ]).then(([v118, v119, v120, v121, accountCleanup, cleanupExport, recurring, v124]) => {
      routeLayersReady = true;
      return { v118, v119, v120, v121, accountCleanup, cleanupExport, recurring, v124 };
    }).catch((error) => {
      routeLayersPromise = null;
      routeLayersReady = false;
      throw error;
    });
  }
  return routeLayersPromise;
}

function openPreparedRoute(route) {
  const currentButton = document.querySelector(`[data-tab="${CSS.escape(route)}"]`);
  if (!currentButton) throw new Error(`The prepared route button is unavailable: ${route}`);
  currentButton.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }));
}

document.addEventListener('click', (event) => {
  const routeButton = event.target.closest?.('[data-tab]');
  const route = routeButton?.dataset.tab;
  if (!routeButton || !['money', 'reports', 'activity', 'tools'].includes(route) || routeLayersReady) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  pendingRoute = route;
  if (routeReplayAttached) return;
  routeReplayAttached = true;
  loadRouteLayers()
    .then((layers) => {
      const requestedRoute = pendingRoute || route;
      pendingRoute = '';
      openPreparedRoute(requestedRoute);
      prepareAndActivateAfterRender(layers);
    })
    .catch(renderFailure)
    .finally(() => { routeReplayAttached = false; });
}, true);

import('./runtime-v111-reporting.js?v=124scenario1')
  .then(async () => {
    const [{ activateV115 }, { installAccessibilityEnhancements }] = await Promise.all([
      import('./v115/release.js?v=124scenario1'),
      import('./v112/accessibility.js?v=124scenario1')
    ]);
    const build = activateV115();
    Object.assign(build, {
      version: 'v124',
      name: 'Household Scenario Comparison',
      runtime: 'src/runtime-v111-reporting.js + lazy v115 import + lazy v118 portability + lazy v119 diagnostics + lazy v120 audit + lazy v121 lineage + lazy v122 cleanup + lazy v123 recurring decisions + lazy v124 scenarios',
      cacheBust: '124scenario1'
    });
    if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, build);
    const registry = window.GringottsV124 || (window.GringottsV124 = {});
    Object.assign(registry, { release: 'v124', loadRouteLayers });
    installAccessibilityEnhancements();
    document.title = `Gringotts Budget Vault ${build.version}`;
    const version = document.querySelector('.version-text');
    if (version) version.textContent = build.version;
    if (boot?.isConnected) boot.remove();
  })
  .catch(renderFailure);
