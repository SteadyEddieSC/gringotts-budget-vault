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
      <p>The page shell loaded, but a JavaScript module failed. Your browser-local vault, transactions, recurring decisions, account cleanup plan, import profiles, revision history, receipt audits, batch index, Guided Plan, insights, goals, close history, report range, forecast settings, and debt plan have not been cleared or overwritten.</p>
      <div class="boot-actions">
        <button id="bootRetry" type="button">Retry v123</button>
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

function loadRouteLayers() {
  if (!routeLayersPromise) {
    routeLayersPromise = Promise.all([
      import('./v118/release.js?v=123recurring1'),
      import('./v119/release.js?v=123recurring1'),
      import('./v120/release.js?v=123recurring1'),
      import('./v121/release.js?v=123recurring1'),
      import('./v122/account-cleanup.js?v=123recurring1'),
      import('./v122/account-cleanup-export-controller.js?v=123recurring1'),
      import('./v123/release.js?v=123recurring1')
    ]).then(async ([v118, v119, v120, v121, accountCleanup, cleanupExport, v123]) => {
      cleanupExport.installAccountCleanupExportController();
      accountCleanup.installAccountCleanupFeatures();
      const cleanupPromise = Promise.resolve(accountCleanup);
      const v122Registry = window.GringottsV122 || (window.GringottsV122 = {});
      Object.assign(v122Registry, {
        release: 'v122',
        loadAccountCleanupFeatures: () => cleanupPromise
      });

      await v123.prepareV123Interceptors();
      await v121.prepareV121Interceptors();
      v120.prepareV120Interceptors();
      v119.prepareV119Interceptors();
      v118.prepareV118Interceptors();
      v118.activateV118();
      v119.activateV119();
      v120.activateV120();
      v121.activateV121();
      const build = v123.activateV123();
      routeLayersReady = true;
      return build;
    }).catch((error) => {
      routeLayersPromise = null;
      throw error;
    });
  }
  return routeLayersPromise;
}

document.addEventListener('click', (event) => {
  const routeButton = event.target.closest?.('[data-tab]');
  const route = routeButton?.dataset.tab;
  if (!routeButton || !['money', 'reports', 'activity', 'tools'].includes(route) || routeLayersReady) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  loadRouteLayers()
    .then(() => routeButton.click())
    .catch(renderFailure);
}, true);

import('./runtime-v111-reporting.js?v=123recurring1')
  .then(async () => {
    const [{ activateV115 }, { installAccessibilityEnhancements }] = await Promise.all([
      import('./v115/release.js?v=123recurring1'),
      import('./v112/accessibility.js?v=123recurring1')
    ]);
    const build = activateV115();
    Object.assign(build, {
      version: 'v123',
      name: 'Recurring Cost Decisions & Subscription Review',
      runtime: 'src/runtime-v111-reporting.js + lazy v115 import + lazy v118 portability + lazy v119 diagnostics + lazy v120 audit + lazy v121 lineage + lazy v122 cleanup modules + lazy v123 recurring decisions',
      cacheBust: '123recurring1'
    });
    if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, build);
    const registry = window.GringottsV123 || (window.GringottsV123 = {});
    Object.assign(registry, { release: 'v123', loadRouteLayers });
    installAccessibilityEnhancements();
    document.title = `Gringotts Budget Vault ${build.version}`;
    const version = document.querySelector('.version-text');
    if (version) version.textContent = build.version;
    if (boot?.isConnected) boot.remove();
  })
  .catch(renderFailure);
