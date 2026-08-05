import {
  validateWorkflowReviewBundle,
  evaluateDecisionGate,
  buildDecisionRecord,
  decisionRecordSummaryText
} from './decision-contracts.js?v=131gate2';
import { WORKFLOW_INVENTORY } from '../v129/workflow-evidence.js?v=131labels1';
import { executeLocalExport } from '../v134/local-export.js?v=134export1';

const SECTION = 'decision-gate';
const CSS = String.raw`
.v131-decision-gate{display:grid;gap:1rem}.v131-gate-intro,.v131-gate-status,.v131-gate-panel{display:grid;gap:.8rem}.v131-gate-intro h2,.v131-gate-intro p,.v131-gate-status h3,.v131-gate-status p,.v131-gate-panel h3,.v131-gate-panel p{margin:0}.v131-gate-boundary{border-inline-start:4px solid var(--green,#6fc49a)}.v131-gate-state{border-inline-start:4px solid var(--gold,#d7b45b);padding:.8rem 1rem;border-radius:.65rem;background:color-mix(in srgb,var(--gold,#d7b45b) 8%,transparent)}.v131-gate-state.ready,.v131-gate-state.hold{border-inline-start-color:var(--green,#6fc49a);background:color-mix(in srgb,var(--green,#6fc49a) 8%,transparent)}.v131-gate-state.blocked{border-inline-start-color:#ffb4a9;background:color-mix(in srgb,#ffb4a9 8%,transparent)}.v131-gate-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem}.v131-gate-metrics span{display:grid;gap:.15rem;min-width:0;padding:.7rem;border:1px solid var(--line);border-radius:.75rem;background:#0b1220;color:var(--muted)}.v131-gate-metrics strong{font-size:1.1rem;color:var(--text);overflow-wrap:anywhere}.v131-evidence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.v131-evidence-grid section{min-width:0;border:1px solid var(--line);border-radius:.75rem;padding:.75rem}.v131-evidence-grid h4{margin:0 0 .45rem}.v131-evidence-grid ul{margin:.35rem 0 0;padding-inline-start:1.2rem}.v131-gate-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:.75rem}.v131-gate-controls label{min-width:0}.v131-gate-controls select,.v131-gate-controls textarea{width:100%}.v131-gate-controls textarea{min-height:6rem;resize:vertical}.v131-gate-actions{display:flex;flex-wrap:wrap;gap:.7rem}.v131-gate-actions .btn{min-height:44px}.v131-gate-error{min-height:1.25rem;margin:0;color:#ffb4a9}.v131-gate-note{color:var(--muted);font-size:.9rem}
@media(max-width:850px){.v131-gate-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.v131-gate-controls{grid-template-columns:1fr}}@media(max-width:600px){.v131-gate-metrics,.v131-evidence-grid{grid-template-columns:1fr}.v131-gate-actions{display:grid;grid-template-columns:1fr}.v131-gate-actions .btn{width:100%}}@media print{.v131-decision-gate{display:none!important}}
`;

const labels = new Map(WORKFLOW_INVENTORY.map((workflow) => [workflow.id, workflow.label]));
let reviewBundle = null;
let disposition = 'unselected';
let rationale = '';
let active = false;
let installed = false;
let dispatcher = null;
let services = { announce() {}, enhance() {} };
let lastResult = null;
let evaluatedRuntimeSnapshot = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[character]));
}

function installStyles() {
  if (document.querySelector('style[data-v131-decision-styles]')) return;
  const style = document.createElement('style');
  style.dataset.v131DecisionStyles = 'true';
  style.textContent = CSS;
  document.head.append(style);
}

function setActiveTab() {
  document.querySelectorAll('.tools-subnav [data-tools-section]').forEach((button) => {
    const selected = button.dataset.toolsSection === SECTION;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.setAttribute('tabindex', selected ? '0' : '-1');
  });
}

function listMarkup(ids, emptyText) {
  return ids.length
    ? `<ul>${ids.map((id) => `<li>${escapeHtml(labels.get(id) || id)}</li>`).join('')}</ul>`
    : `<p class="v131-gate-note">${escapeHtml(emptyText)}</p>`;
}

async function runtimeSnapshot() {
  const snapshot = window.GringottsV130?.snapshot?.();
  if (!snapshot) return null;
  const clone = structuredClone(snapshot);
  if (!clone.current?.evaluation && window.GringottsV130?.evaluate && clone.current?.input) {
    try {
      clone.current.evaluation = await window.GringottsV130.evaluate(clone.current.input);
    } catch {
      clone.current.evaluation = { ok:false, failures:['Runtime evaluation could not complete.'] };
    }
  }
  return clone;
}

function stateClass(state) {
  if (state === 'runtime-blocked') return 'blocked';
  if (state === 'decision-ready' || state === 'hold' || state === 'maintenance-only' || state === 'candidate-proposal') return 'ready';
  return '';
}

function statusMarkup(result) {
  const runtimeLabel = result.runtime.ok ? 'Passed' : 'Blocked';
  return `<article class="card v131-gate-status"><h3>Current gate</h3><p class="v131-gate-state ${stateClass(result.state)}" role="status"><strong>${escapeHtml(result.state)}</strong> — ${escapeHtml(result.message)}</p><div class="v131-gate-metrics"><span><strong>${result.summary.completeCount}/${result.summary.inventoryCount}</strong>Complete workflows</span><span><strong>${runtimeLabel}</strong>Runtime evidence</span><span><strong>${result.groups.highFriction.length}</strong>High-friction workflows</span><span><strong>${result.groups.investigate.length}</strong>Unmet-need signals</span></div>${result.runtime.failures.length ? `<details><summary>Runtime blockers</summary>${listMarkup(result.runtime.failures,'No runtime blocker is recorded.')}</details>` : ''}</article>`;
}

function controlsMarkup(result) {
  const ready = ['decision-ready','hold','maintenance-only','candidate-proposal'].includes(result.state);
  const exportable = ['hold','maintenance-only','candidate-proposal'].includes(result.state);
  return `<article class="card v131-gate-panel"><h3>Explicit household disposition</h3><p>The gate does not approve a product change. It records whether scope should stay frozen, maintenance should be scoped, or one proposal may be written for later review.</p><div class="v131-gate-controls"><label>Disposition<select id="v131DecisionDisposition" ${ready ? '' : 'disabled'}><option value="unselected" ${disposition === 'unselected' ? 'selected' : ''}>Select after the gate is ready</option><option value="hold" ${disposition === 'hold' ? 'selected' : ''}>Hold feature freeze</option><option value="maintenance-only" ${disposition === 'maintenance-only' ? 'selected' : ''}>Maintenance or simplification only</option><option value="candidate-proposal" ${disposition === 'candidate-proposal' ? 'selected' : ''}>Allow one proposal for later review</option></select></label><label>Workflow-only rationale<textarea id="v131DecisionRationale" maxlength="320" placeholder="Describe the observed workflow reason only. Do not enter amounts, account, card, transaction, merchant, balance, or contact details." ${ready ? '' : 'disabled'}>${escapeHtml(rationale)}</textarea><span class="v131-gate-note">Required for maintenance-only and candidate-proposal. Maximum 320 characters.</span></label></div><div class="v131-gate-actions"><button type="button" class="btn primary" id="v131DownloadDecision" ${exportable ? '' : 'disabled'}>Download Decision Record</button><button type="button" class="btn secondary" id="v131CopyDecision" ${exportable ? '' : 'disabled'}>Copy Decision Summary</button><button type="button" class="btn secondary" id="v131RefreshRuntime">Refresh Runtime Evidence</button><button type="button" class="btn secondary" id="v131ClearDecision">Clear In-Session Gate</button></div><p class="v131-gate-error" id="v131DecisionError" aria-live="polite"></p></article>`;
}

function evidenceMarkup(result) {
  return `<article class="card v131-gate-panel"><h3>Imported workflow evidence</h3><div class="v131-evidence-grid"><section><h4>Keep candidates</h4>${listMarkup(result.groups.keep,'No keep candidate is recorded.')}</section><section><h4>High friction</h4>${listMarkup(result.groups.highFriction,'No high-friction workflow is recorded.')}</section><section><h4>Consolidate, demote, or remove</h4>${listMarkup(result.groups.consolidate,'No consolidation candidate is recorded.')}</section><section><h4>Investigate or unmet need</h4>${listMarkup(result.groups.investigate,'No unmet-need signal is recorded.')}</section></div></article>`;
}

async function render({ focusHeading = false } = {}) {
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return false;
  installStyles();
  setActiveTab();
  const runtime = await runtimeSnapshot();
  evaluatedRuntimeSnapshot = runtime;
  try {
    lastResult = evaluateDecisionGate({ reviewBundle, runtimeSnapshot:runtime, disposition, rationale });
  } catch (error) {
    disposition = 'unselected';
    lastResult = evaluateDecisionGate({ reviewBundle, runtimeSnapshot:runtime });
    setTimeout(() => setError(error?.message || 'The decision could not be recorded.'), 0);
  }
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'v131-decision-gate';
  section.dataset.v131DecisionGate = 'true';
  section.innerHTML = `<article class="card v131-gate-intro"><div class="section-title-row"><div><h2 tabindex="-1">Observed Needs Decision Gate</h2><p>Use completed household workflow evidence and current runtime health before changing Gringotts product scope.</p></div><div class="section-meta">Session only</div></div><div class="v131-gate-actions"><button type="button" class="btn primary" id="v131ChooseReview">Choose Workflow Review JSON</button><input id="v131ReviewFile" type="file" accept="application/json,.json" hidden><span class="v131-gate-note">${reviewBundle ? `Loaded review from ${escapeHtml(reviewBundle.createdAt || 'local file')}` : 'No workflow review loaded.'}</span></div></article><article class="card v131-gate-boundary"><h3>Privacy and authority boundary</h3><p>This gate reads only a user-selected v129 review bundle and the published v130 runtime snapshot. It does not inspect the vault, transactions, accounts, balances, merchants, reports, credentials, or route history, and it saves nothing automatically.</p></article>${statusMarkup(lastResult)}${evidenceMarkup(lastResult)}${controlsMarkup(lastResult)}`;
  workspace.append(section);
  services.enhance(section);
  if (focusHeading) section.querySelector('h2')?.focus({ preventScroll:false });
  services.announce('Decision Gate ready');
  return true;
}

function setError(message = '') {
  const node = document.getElementById('v131DecisionError');
  if (node) node.textContent = message;
}

async function importReview(file) {
  if (!file) return;
  if (file.size > 1_000_000) throw new Error('Decision gate rejected: workflow review file must be 1 MB or smaller');
  const parsed = JSON.parse(await file.text());
  validateWorkflowReviewBundle(parsed);
  reviewBundle = parsed;
  disposition = 'unselected';
  rationale = '';
  await render();
  services.announce('Workflow review loaded into the session-only Decision Gate');
}

async function handleChange(event) {
  if (!active) return false;
  if (event.target?.id === 'v131ReviewFile') {
    setError('');
    try {
      await importReview(event.target.files?.[0]);
    } catch (error) {
      setError(error?.message || 'The workflow review file could not be loaded.');
      event.target.value = '';
    }
    return true;
  }
  if (event.target?.id === 'v131DecisionDisposition') {
    disposition = event.target.value;
    rationale = document.getElementById('v131DecisionRationale')?.value || rationale;
    await render();
    return true;
  }
  if (event.target?.id === 'v131DecisionRationale') {
    rationale = event.target.value;
    return true;
  }
  return false;
}

async function buildCurrentRecord() {
  const runtime = evaluatedRuntimeSnapshot || await runtimeSnapshot();
  return buildDecisionRecord({ reviewBundle, runtimeSnapshot:runtime, disposition, rationale });
}

async function runAction(action) {
  setError('');
  if (action.id === 'v131ChooseReview') {
    document.getElementById('v131ReviewFile')?.click();
    return;
  }
  if (action.id === 'v131RefreshRuntime') {
    await render();
    return;
  }
  if (action.id === 'v131ClearDecision') {
    if (!window.confirm('Clear the current in-session Decision Gate evidence and disposition?')) return;
    reviewBundle = null;
    disposition = 'unselected';
    rationale = '';
    evaluatedRuntimeSnapshot = null;
    await render();
    services.announce('In-session Decision Gate cleared');
    return;
  }
  const record = await buildCurrentRecord();
  if (action.id === 'v131DownloadDecision') {
    const result = executeLocalExport({
      id:'decision-record',
      payload:record,
      filenameContext:{ createdAt:record.createdAt }
    });
    if (result.status === 'dispatched') services.announce('Decision record downloaded');
  } else if (action.id === 'v131CopyDecision') {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser context.');
    await navigator.clipboard.writeText(decisionRecordSummaryText(record));
    services.announce('Decision summary copied');
  }
}

function handleAction(event) {
  const action = event.target.closest?.('#v131ChooseReview,#v131DownloadDecision,#v131CopyDecision,#v131RefreshRuntime,#v131ClearDecision');
  if (!action || !active) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  runAction(action).catch((error) => setError(error?.message || 'The Decision Gate action could not finish.'));
  return true;
}

const controller = Object.freeze({
  open: async ({ focusHeading = false } = {}) => {
    active = true;
    return render({ focusHeading });
  },
  deactivate() { active = false; },
  isActive() { return active; },
  snapshot() {
    return {
      reviewLoaded:Boolean(reviewBundle),
      completeCount:lastResult?.summary?.completeCount || 0,
      inventoryCount:lastResult?.summary?.inventoryCount || WORKFLOW_INVENTORY.length,
      state:lastResult?.state || 'evidence-incomplete',
      disposition:lastResult?.disposition || 'unselected',
      dispatcherOwned:Boolean(dispatcher),
      memoryOnly:true
    };
  }
});

export function installDecisionGate(nextServices = {}) {
  services = { ...services, ...nextServices };
  if (!installed) {
    if (!nextServices.dispatcher?.register) throw new Error('Decision Gate requires the v126 action dispatcher.');
    installed = true;
    dispatcher = nextServices.dispatcher;
    dispatcher.register('change', 'v131-decision-gate-fields', (event) => {
      handleChange(event).catch((error) => setError(error?.message || 'The Decision Gate field could not be processed.'));
      return false;
    }, 170);
    dispatcher.register('click', 'v131-decision-gate-actions', handleAction, 170);
  }
  return controller;
}
