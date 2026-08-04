import { evaluatePerformanceBudget } from './performance-contracts.js?v=130perf2';

const CSS = String.raw`
.v130-performance-card{display:grid;gap:.85rem;margin-bottom:1rem}.v130-performance-card h3,.v130-performance-card p{margin:0}.v130-performance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem}.v130-performance-grid span{display:grid;gap:.15rem;min-width:0;padding:.7rem;border:1px solid var(--line,rgba(255,255,255,.12));border-radius:.75rem;background:color-mix(in srgb,var(--panel,#111827) 88%,transparent)}.v130-performance-grid strong{overflow-wrap:anywhere}.v130-performance-status{border-inline-start:4px solid var(--green,#6fc49a);padding:.7rem .9rem;border-radius:.65rem;background:color-mix(in srgb,var(--green,#6fc49a) 8%,transparent)}.v130-performance-status.warning{border-inline-start-color:var(--gold,#d7b45b);background:color-mix(in srgb,var(--gold,#d7b45b) 8%,transparent)}
@media(max-width:850px){.v130-performance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.v130-performance-grid{grid-template-columns:1fr}}@media print{.v130-performance-card{display:none!important}}
`;

function installStyles() {
  if (document.querySelector('style[data-v130-performance-styles]')) return;
  const style = document.createElement('style');
  style.dataset.v130PerformanceStyles = 'true';
  style.textContent = CSS;
  document.head.append(style);
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

export async function renderV130Diagnostics({ root, routeContext, runtime, budgets, state, currentInput } = {}) {
  if (routeContext?.route !== 'tools' || routeContext?.subroute !== 'diagnostics') return false;
  if (!root || !runtime?.coordinator || !runtime?.dispatcher || !budgets || !state || typeof currentInput !== 'function') {
    throw new Error('v130 Diagnostics requires the existing runtime and bounded session state.');
  }
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
  const lifecycle = runtime.coordinator.snapshot();
  const input = currentInput(lifecycle);
  const evaluation = evaluatePerformanceBudget(input);
  state.lastEvaluation = evaluation;
  setText(card.querySelector('.v130-performance-copy'), 'Session-only runtime evidence. No household financial data, browser storage, analytics, or remote logging is used. Lighthouse remains authoritative for startup request and script-byte ceilings.');
  const next = [
    metric('Route ready', `${input.routeReadyMs} ms / ${budgets.routeReadyMs}`),
    metric('Enhancement', `${input.enhancementMs} ms / ${budgets.enhancementMs}`),
    metric('Passes', `${input.enhancementPasses} / ${budgets.maxEnhancementPasses}`),
    metric('Observer callbacks', `${input.observerCallbacks} / ${budgets.maxObserverCallbacksPerRoute}`),
    metric('Owned observers', `${input.runtimeObservers} / ${budgets.maxRuntimeObservers}`),
    metric('Registered actions', `${input.registeredActions} / ${budgets.maxRegisteredActions}`),
    metric('Session samples', `${state.history.length} / ${budgets.maxSessionSamples}`),
    metric('Workbook cap', `${input.workbookSheets} / ${budgets.maxWorkbookSheets}`)
  ];
  const grid = card.querySelector('.v130-performance-grid');
  if (grid.childElementCount !== next.length || grid.textContent !== next.map((node) => node.textContent).join('')) grid.replaceChildren(...next);
  const status = card.querySelector('.v130-performance-status');
  status.classList.toggle('warning', !evaluation.ok);
  setText(status, evaluation.ok ? 'Current runtime ownership and measured route budgets are within the v130 contract.' : `Review required: ${evaluation.failures.join(' ')}`);
  window.GringottsV127?.enhance?.(card);
  return true;
}
