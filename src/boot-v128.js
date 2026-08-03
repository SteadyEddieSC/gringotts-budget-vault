import './boot-v126.js?v=128base1';

const RELEASE = Object.freeze({
  version: 'v128',
  name: 'TypeScript & Portable Vault Foundation',
  featureFreeze: true,
  primaryDestinations: 6,
  workbookSheets: 43
});

const ACTION_INTENTS = Object.freeze([
  'primary', 'preview', 'export', 'recovery', 'destructive', 'cancel', 'secondary'
]);

const PATTERNS = Object.freeze({
  destructive: /\b(delete|remove|reset|clear|discard|replace|overwrite|purge|forget|reopen)\b/i,
  recovery: /\b(retry|restore|recover|rescue|rollback|undo)\b/i,
  cancel: /\b(cancel|dismiss|never mind|go back)\b/i,
  export: /\b(export|download|print|copy|calendar file|workbook|backup)\b/i,
  preview: /\b(preview|review|compare|check|validate|inspect|diagnostic|dry run)\b/i,
  primary: /\b(save|apply|add|create|update|continue|confirm|finish|close month|import)\b/i
});

const ROADMAP = Object.freeze([
  ['v127', 'shipped', 'UX Polish & Simplification', 'Reduce visible complexity and make every action, state, and advanced control easier to understand across desktop, keyboard, phone, and tablet use.', ['Consistent action intent and hierarchy', 'Loading, empty, partial, failure, and success feedback', 'Progressive disclosure', 'Mobile and keyboard polish', 'Focus restoration and accessible dialogs'], ['v126 lifecycle and dispatcher contracts', 'Cross-browser interaction evidence'], ['No new primary destination', 'Planning actions never resemble financial execution', 'Critical safety boundaries remain visible', '43-sheet workbook cap'], 'The application feels calmer, clearer, and more responsive without adding household-finance features.'],
  ['v128', 'current', 'TypeScript & Portable Vault Foundation', 'Begin the typed architecture transition and define a provider-neutral portable vault package without rewriting the static application or sending financial data across the network.', ['Strict TypeScript domain contracts', 'Authoritative vault and storage-adapter interfaces', 'Deterministic JSON canonicalization', 'SHA-256 integrity verification', 'Portable .gringotts package round-trip', 'Corruption, empty-vault, schema, and authority-boundary rejection'], ['v126 storage inventory and runtime ownership', 'v127 interaction policy', 'Existing backup-first and empty-vault safeguards'], ['Cloudflare serves assets only', 'No network or storage implementation in the package core', 'Preserve gringottsBudgetVault.latest', 'No automatic migration or restore', 'Encryption and cloud adapters require later review'], 'Gringotts gains a typed and tested portability foundation while its deployed runtime and household-finance surface remain unchanged.'],
  ['v129', 'directional', 'Household Workflow Evidence Review', 'Review real household use and identify repeated confusion, abandoned surfaces, slow paths, and unmet needs before approving more product scope.', ['Workflow-friction review', 'Feature-use evidence', 'Support and failure patterns', 'Consolidation candidates'], ['v126–v128 stabilized runtime, UX, and portability foundation'], ['No analytics endpoint', 'No private financial data in repository evidence', 'No feature approved from roadmap momentum alone'], 'Future work is based on observed household needs instead of a longer feature list.'],
  ['v130', 'directional', 'Performance & Maintenance Hardening', 'Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets while reducing historical maintenance cost.', ['Performance-budget enforcement', 'Historical layer consolidation', 'Workbook restraint', 'Dependency and supply-chain review', 'Recovery timing'], ['v126 lifecycle metrics', 'v129 workflow evidence'], ['No eager historical loading', 'No service worker without separate review', 'No new sheet without consolidation'], 'The application stays fast, supportable, and recoverable over time.'],
  ['v131', 'directional', 'Observed Needs Decision Gate', 'Decide whether any new household-finance capability is justified after reliability, simplicity, portability, and maintenance goals are met.', ['Unmet-needs evidence', 'Consolidate-or-remove review', 'Safety and privacy impact', 'Release-size and maintenance-cost estimate'], ['v126–v130 evidence and protected quality gates'], ['Feature freeze remains the default', 'No automatic financial action', 'No new store without schema, cap, migration, recovery, and privacy contracts'], 'New features resume only when a clear household need outweighs added complexity.'],
  ['v132', 'directional', 'Release & Test Infrastructure Simplification', 'Reduce release ceremony and duplicated test ownership while preserving exact-head cross-browser, accessibility, security, and deployment gates.', ['Shared release metadata', 'Centralized version assertions', 'Reduced duplicate fixtures', 'Faster failure diagnostics', 'Protected-gate documentation'], ['v130 maintenance evidence', 'Stable protected workflow history'], ['No weaker gate coverage', 'No hidden retry-only success', 'No production promotion before exact-head validation'], 'Releases remain rigorous but become easier to understand, repair, and audit.'],
  ['v133', 'directional', 'Local Data Longevity Drills', 'Exercise upgrade, corruption, rollback, orphan, capacity, and stale-schema scenarios against synthetic long-lived household data.', ['Migration rehearsal fixtures', 'Corruption recovery tests', 'Capacity and cap checks', 'Orphan metadata handling', 'Rollback verification'], ['v128 schema and recovery contracts', 'v132 release-test simplification'], ['Synthetic data only', 'No automatic destructive cleanup', 'Authoritative vault remains non-resettable'], 'Long-lived local data remains understandable and recoverable across future releases.'],
  ['v134', 'directional', 'Reporting & Export Contract Consolidation', 'Reduce duplicated report assembly and filename logic while preserving every tested household output and the 43-sheet workbook cap.', ['Shared export metadata', 'Consistent filenames and labels', 'Aggregate-only privacy checks', 'Workbook ownership map', 'Failure and cancellation behavior'], ['v130 performance evidence', 'v133 data-longevity fixtures'], ['No new report destination', 'No added workbook sheet', 'No transaction detail in aggregate-only outputs'], 'Reports and exports become more consistent and less expensive to maintain.'],
  ['v135', 'directional', 'Cross-Device & Low-Resource Resilience', 'Verify complete household workflows on small screens, reduced-memory devices, slower CPUs, keyboard-only input, touch, and reduced-motion settings.', ['Low-resource test profiles', 'Touch and keyboard completion', 'Responsive overflow review', 'Reduced-motion verification', 'Large-vault interaction budgets'], ['v127 UX contracts', 'v130 performance budgets', 'v134 export consolidation'], ['No device-specific fork', 'No reduced safety messaging', 'No persistent cache or service worker'], 'Core workflows remain usable and predictable across supported devices and input modes.'],
  ['v136', 'directional', 'Architecture Baseline & Next-Horizon Decision', 'Document the maintained architecture after the reliability horizon and decide whether to continue consolidation, hold steady, or approve a narrowly evidenced capability.', ['Architecture ownership map', 'Retirement candidates', 'Maintenance-cost review', 'Privacy and threat-boundary review', 'Next-horizon decision record'], ['v127–v135 evidence', 'Observed household needs', 'Protected release history'], ['One live runtime', 'Local-first data boundary', 'Stable rescue retained', 'No feature approval without a full safety and recovery contract'], 'The following roadmap begins from evidence and an explicit maintained baseline rather than accumulated release layers.']
].map(([version, status, title, purpose, scope, dependencies, safeguards, outcome]) => Object.freeze({ version, status, title, purpose, scope, dependencies, safeguards, outcome })));

const V127_CSS = String.raw`
/* Retained v113 household-insight styles are consolidated here to keep the network budget flat. */
.household-insights-page{display:grid;gap:1rem}.insight-kpis{margin-top:0}.insight-period-card .summary-box{min-height:100%}.insight-signal-list{display:grid;gap:1rem}.insight-card{border-inline-start:4px solid color-mix(in srgb,var(--accent,#d7b45b) 62%,transparent)}.insight-card.high{border-inline-start-color:#ef8d7b}.insight-card.review{border-inline-start-color:#e6bd65}.insight-card.watch{border-inline-start-color:#7eb8d8}.insight-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem;margin:.85rem 0}.insight-facts span{display:grid;gap:.15rem;min-width:0;padding:.7rem;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:.75rem;background:color-mix(in srgb,var(--panel,#111827) 88%,transparent)}.insight-facts strong{font-size:1.05rem;overflow-wrap:anywhere}.insight-evidence{margin-top:.8rem}.insight-evidence summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:700}.insight-prompts{display:grid;gap:.75rem;padding-left:1.4rem}.insight-prompts li{padding-left:.25rem}.insight-prompts span{display:block;margin-top:.25rem;color:var(--muted,#a9b4c5)}.methodology-card ul,.household-insights-report ul,.household-insights-report ol{display:grid;gap:.5rem}.recurring-insights-table td:last-child{min-width:18rem}.household-insights-report .card{break-inside:avoid}.insight-report-grid small{color:var(--muted,#a9b4c5)}
.v127-status-region{position:fixed;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}[data-action-intent]{min-height:2.75rem;touch-action:manipulation}.v127-action-primary{font-weight:700}.v127-action-preview,.v127-action-export,.v127-action-recovery{font-weight:650}.v127-action-destructive{border-style:solid;border-width:1px}.v127-action-cancel{opacity:.92}[data-action-intent]:focus-visible,[data-v127-table-region]:focus-visible,.v127-disclosure>summary:focus-visible{outline:3px solid currentColor;outline-offset:3px}[data-v127-table-region]{max-width:100%;overflow:auto;scroll-padding:1rem}[data-v127-dialog]{max-width:min(44rem,calc(100vw - 2rem));max-height:min(48rem,calc(100dvh - 2rem));overflow:auto;overscroll-behavior:contain}.v127-disclosure>summary{cursor:pointer;min-height:2.75rem;display:flex;align-items:center}.v127-roadmap-page .roadmap-horizon{display:grid;gap:1rem;grid-template-columns:repeat(2,minmax(0,1fr))}.v127-roadmap-page .roadmap-horizon-card,.v127-roadmap-page .roadmap-card-header,.v127-roadmap-page .roadmap-card-section{min-width:0}.v127-roadmap-page .roadmap-horizon-card{display:grid;align-content:start;gap:.85rem}.v127-roadmap-page .roadmap-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}.v127-roadmap-page .roadmap-card-header h3,.v127-roadmap-page .roadmap-card-section h4,.v127-roadmap-page .roadmap-horizon-card p{margin:0}.v127-roadmap-page .v127-roadmap-details{margin:0}.v127-roadmap-page .roadmap-card-section+.roadmap-card-section{margin-top:.75rem}
@media(max-width:900px){.insight-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.v127-roadmap-page .roadmap-horizon{grid-template-columns:1fr}.v127-roadmap-page .roadmap-card-header{display:grid}.button-row,.modal-actions,[data-v127-dialog] .button-row{gap:.65rem}.button-row>[data-action-intent],.modal-actions>[data-action-intent],[data-v127-dialog] .button-row>[data-action-intent]{width:100%}}@media(max-width:600px){.insight-facts{grid-template-columns:1fr}.household-insights-page .section-title-row{align-items:flex-start}.recurring-insights-table td:last-child{min-width:14rem}}@media(prefers-reduced-motion:reduce){[data-action-intent],[data-v127-dialog],.v127-disclosure{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}@media print{.household-insights-report{break-before:page}.household-insights-report .card{box-shadow:none}.v127-status-region,[data-v127-disclosure="advanced"]{display:none!important}.v127-roadmap-page .roadmap-horizon{display:block}.v127-roadmap-page .roadmap-horizon-card{break-inside:avoid;margin-bottom:1rem}}
`;

const ACTION_SELECTOR = 'button, a.btn, [role="button"], input[type="button"], input[type="submit"]';
const dialogOpeners = new WeakMap();
let installed = false;
let pendingRouteFocus = null;
let generatedId = 0;

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().replace(/[.…]+$/u, '').trimEnd();
}

function descriptor(control) {
  return [
    normalize(control.getAttribute?.('aria-label') || control.textContent || control.value || control.title || ''),
    normalize(control.id).replace(/[-_]+/g, ' '),
    normalize(control.getAttribute?.('name')).replace(/[-_]+/g, ' '),
    normalize(control.getAttribute?.('href')).replace(/[-_/?=&.]+/g, ' ')
  ].filter(Boolean).join(' ');
}

function classify(control) {
  const value = descriptor(control);
  if (!value) return 'secondary';
  for (const intent of ['cancel', 'destructive', 'recovery', 'export', 'preview', 'primary']) {
    if (PATTERNS[intent].test(value)) return intent;
  }
  return 'secondary';
}

function verb(intent) {
  return ({ primary: 'Commit', preview: 'Review', export: 'Export', recovery: 'Recover', destructive: 'Destructive', cancel: 'Cancel', secondary: 'Secondary' })[intent] || 'Secondary';
}

function installStyles() {
  if (document.querySelector('style[data-v127-styles]')) return;
  const style = document.createElement('style');
  style.dataset.v127Styles = 'true';
  style.textContent = V127_CSS;
  document.head.append(style);
}

function ensureStatusRegion() {
  let region = document.getElementById('v127Status');
  if (region) return region;
  region = document.createElement('div');
  region.id = 'v127Status';
  region.className = 'v127-status-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.append(region);
  return region;
}

function announce(message) {
  const text = normalize(message);
  if (!text) return;
  const region = ensureStatusRegion();
  region.textContent = '';
  queueMicrotask(() => { region.textContent = text; });
}

function enhanceAction(control) {
  if (!(control instanceof Element) || control.matches('[data-tab], [role="tab"]')) return;
  const intent = classify(control);
  control.dataset.actionIntent = intent;
  control.dataset.actionVerb = verb(intent);
  for (const candidate of ACTION_INTENTS) control.classList.toggle(`v127-action-${candidate}`, candidate === intent);
  if (!normalize(control.getAttribute('aria-label') || control.textContent || control.value) && control.title) control.setAttribute('aria-label', control.title);
  if (intent === 'destructive') control.dataset.confirmationIntent = 'destructive';
  else delete control.dataset.confirmationIntent;
}

function nearestHeading(node) {
  return (node.closest('section, article, .card, main') || document.getElementById('main'))?.querySelector('h1, h2, h3, h4') || null;
}

function enhanceTable(table) {
  if (!(table instanceof HTMLTableElement)) return;
  const label = normalize(table.caption?.textContent || nearestHeading(table)?.textContent || 'Household data table');
  const wrapper = table.closest('.table-wrap, .table-scroll, [data-table-region]');
  if (wrapper) {
    wrapper.dataset.v127TableRegion = 'true';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', label);
    if (!wrapper.hasAttribute('tabindex')) wrapper.setAttribute('tabindex', '0');
  } else {
    table.dataset.v127TableRegion = 'true';
    table.setAttribute('aria-label', label);
    if (!table.hasAttribute('tabindex')) table.setAttribute('tabindex', '0');
  }
}

function enhanceDialog(dialog) {
  if (!(dialog instanceof Element)) return;
  dialog.dataset.v127Dialog = 'true';
  const heading = dialog.querySelector('h1, h2, h3');
  if (heading) {
    if (!heading.id) heading.id = `v127-dialog-title-${++generatedId}`;
    if (!dialog.hasAttribute('aria-labelledby')) dialog.setAttribute('aria-labelledby', heading.id);
  } else if (!dialog.hasAttribute('aria-label')) dialog.setAttribute('aria-label', 'Dialog');
  dialog.querySelectorAll(ACTION_SELECTOR).forEach(enhanceAction);
}

function renderList(title, items) {
  const section = document.createElement('section');
  section.className = 'roadmap-card-section';
  const heading = document.createElement('h4');
  heading.textContent = title;
  const list = document.createElement('ul');
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    list.append(li);
  }
  section.append(heading, list);
  return section;
}

function roadmapCard(entry) {
  const card = document.createElement('article');
  card.className = 'roadmap-horizon-card';
  card.dataset.roadmapVersion = entry.version;
  card.dataset.roadmapStatus = entry.status;
  const header = document.createElement('div');
  header.className = 'roadmap-card-header';
  const title = document.createElement('h3');
  title.textContent = `${entry.version} — ${entry.title}`;
  const status = document.createElement('span');
  status.className = 'badge';
  status.textContent = entry.status === 'current' ? 'Current release' : entry.status === 'planned' ? 'Next planned' : entry.status === 'shipped' ? 'Shipped' : 'Directional';
  header.append(title, status);
  const purpose = document.createElement('p');
  purpose.textContent = entry.purpose;
  const details = document.createElement('details');
  details.className = 'v127-roadmap-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Scope, dependencies, and safeguards';
  details.append(summary, renderList('Scope', entry.scope), renderList('Dependencies', entry.dependencies), renderList('Safeguards', entry.safeguards));
  const outcome = document.createElement('p');
  outcome.className = 'muted-note';
  outcome.textContent = `Expected outcome: ${entry.outcome}`;
  card.append(header, purpose, details, outcome);
  return card;
}

function enhanceRoadmap(root) {
  const page = root.querySelector?.('.v126-roadmap-page, .roadmap-page') || (root.matches?.('.v126-roadmap-page, .roadmap-page') ? root : null);
  if (!page) return;
  const horizon = page.querySelector('.roadmap-horizon');
  if (!horizon || horizon.dataset.v128Roadmap === 'true') return;
  horizon.dataset.v128Roadmap = 'true';
  horizon.replaceChildren(...ROADMAP.map(roadmapCard));
  page.classList.add('v127-roadmap-page');
  const heading = page.querySelector('h1, h2');
  if (heading && /roadmap/i.test(heading.textContent || '')) heading.textContent = 'v127–v136 Reliability Roadmap';
}

function enhance(root = document) {
  root.querySelectorAll?.(ACTION_SELECTOR).forEach(enhanceAction);
  root.querySelectorAll?.('table').forEach(enhanceTable);
  root.querySelectorAll?.('dialog, [role="dialog"]').forEach(enhanceDialog);
  root.querySelectorAll?.('details').forEach((details) => {
    details.classList.add('v127-disclosure');
    const summary = details.querySelector(':scope > summary');
    if (summary && !normalize(summary.textContent)) summary.textContent = 'More details';
  });
  root.querySelectorAll?.('.v126-runtime-health-card, [data-diagnostics], .diagnostics-card').forEach((section) => { section.dataset.v127Disclosure = 'advanced'; });
  enhanceRoadmap(root);
}

function routeLabel(route) {
  return ({ dashboard: 'Dashboard', money: 'Money', calendar: 'Calendar', reports: 'Reports', activity: 'Activity', tools: 'Tools' })[route] || 'Page';
}

function focusRouteHeading(route) {
  const request = pendingRouteFocus;
  pendingRouteFocus = null;
  if (!request || request.route !== route) return;
  const active = document.activeElement;
  if (active && active !== document.body && active !== request.control && !active.matches?.('[data-tab], [role="tab"]')) return;
  const heading = document.querySelector('#main h1, #main h2');
  if (!heading) return;
  const hadTabIndex = heading.hasAttribute('tabindex');
  if (!hadTabIndex) heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: false });
  if (!hadTabIndex) heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
}

function updateMetadata() {
  const build = window.GringottsCleanRuntime?.BUILD;
  if (build) Object.assign(build, { version: RELEASE.version, name: RELEASE.name, runtime: `${build.runtime || 'v126 runtime'} + v127 interaction policy + v128 typed portable-vault foundation`, cacheBust: '128typed1' });
  document.title = `Gringotts Budget Vault ${RELEASE.version}`;
  const version = document.querySelector('.version-text');
  if (version) version.textContent = RELEASE.version;
}

function handleRouteReady(event) {
  updateMetadata();
  enhance(document.getElementById('main') || document);
  const route = event.detail?.route || window.GringottsV126?.coordinator?.route || '';
  focusRouteHeading(route);
  announce(`${routeLabel(route)} ready`);
}

function rememberRouteFocus(event) {
  const control = event.target.closest?.('[data-tab], [role="tab"]');
  if (control?.dataset.tab) pendingRouteFocus = { route: control.dataset.tab, control };
}

function rememberDialogOpener(event) {
  const control = event.target.closest?.(ACTION_SELECTOR);
  if (!control) return;
  queueMicrotask(() => document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden])').forEach((dialog) => {
    if (!dialogOpeners.has(dialog)) dialogOpeners.set(dialog, control);
    enhanceDialog(dialog);
  }));
}

function restoreDialogFocus(event) {
  const dialog = event.target.closest?.('dialog, [role="dialog"]') || event.target;
  const opener = dialogOpeners.get(dialog);
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  dialogOpeners.delete(dialog);
}

function actionFeedback(event) {
  const control = event.target.closest?.(ACTION_SELECTOR);
  if (!control || control.matches('[data-tab], [role="tab"]')) return;
  enhanceAction(control);
  if (control.dataset.actionIntent === 'export') announce('Preparing the local export');
  else if (control.dataset.actionIntent === 'recovery') announce('Recovery action requested');
  else if (control.dataset.actionIntent === 'destructive') announce('Review the confirmation before continuing');
}

function install() {
  if (installed) return window.GringottsV128;
  installed = true;
  installStyles();
  ensureStatusRegion();
  window.addEventListener('click', rememberRouteFocus, true);
  window.addEventListener('click', rememberDialogOpener, true);
  window.addEventListener('click', actionFeedback, true);
  document.addEventListener('close', restoreDialogFocus, true);
  document.addEventListener('cancel', restoreDialogFocus, true);
  document.addEventListener('gringotts:v126-route-ready', handleRouteReady);
  document.addEventListener('gringotts:v126-route-failed', () => {
    enhance(document.getElementById('main') || document);
    announce('Page enhancements failed. The base page and browser-local data remain available.');
  });
  Object.assign(window.GringottsV127 || (window.GringottsV127 = {}), {
    release: 'v127',
    name: 'UX Polish & Simplification',
    featureFreeze: true,
    actionIntents: ACTION_INTENTS,
    roadmap: ROADMAP,
    enhance,
    announce,
    snapshot() {
      return {
        release: 'v127',
        actionsClassified: document.querySelectorAll('[data-action-intent]').length,
        tableRegions: document.querySelectorAll('[data-v127-table-region]').length,
        dialogsLabeled: document.querySelectorAll('[data-v127-dialog]').length,
        roadmapReleases: ROADMAP.length,
        observerAdded: false,
        storageWritesAdded: false,
        primaryDestinations: RELEASE.primaryDestinations,
        workbookSheets: RELEASE.workbookSheets,
        networkBudgetDelta: 0
      };
    }
  });
  Object.assign(window.GringottsV128 || (window.GringottsV128 = {}), {
    release: RELEASE.version,
    name: RELEASE.name,
    featureFreeze: true,
    typeScriptStrict: true,
    portableFormat: 'gringotts-portable-vault',
    portableFormatVersion: 1,
    portableSchemaVersion: 1,
    integrityAlgorithm: 'SHA-256',
    encryptionReady: false,
    cloudAdaptersEnabled: false,
    roadmap: ROADMAP,
    snapshot() {
      return {
        release: RELEASE.version,
        typeScriptStrict: true,
        portableFormat: 'gringotts-portable-vault',
        portableFormatVersion: 1,
        portableSchemaVersion: 1,
        integrityAlgorithm: 'SHA-256',
        encryptionReady: false,
        cloudAdaptersEnabled: false,
        networkImplementationAdded: false,
        observerAdded: false,
        storageWritesAdded: false,
        primaryDestinations: RELEASE.primaryDestinations,
        workbookSheets: RELEASE.workbookSheets,
        networkBudgetDelta: 0
      };
    }
  });
  const start = () => { updateMetadata(); enhance(document); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else queueMicrotask(start);
  return window.GringottsV128;
}

install();
