import * as model from './workflow-evidence.js?v=129evidence2';

const WORKFLOW_SECTION = 'workflow-review';
const CSS = String.raw`
.v129-workflow-review{display:grid;gap:1rem}.v129-review-intro{display:grid;gap:.65rem}.v129-review-intro h2,.v129-review-intro p{margin:0}.v129-privacy-boundary{border-inline-start:4px solid var(--green,#6fc49a)}.v129-review-summary{display:grid;gap:.8rem}.v129-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem}.v129-summary-grid span{display:grid;gap:.2rem;min-width:0;border:1px solid var(--line);border-radius:.75rem;background:#0b1220;padding:.7rem;color:var(--muted)}.v129-summary-grid strong{font-size:1.15rem;color:var(--text)}.v129-next-action{margin:0;border-inline-start:4px solid var(--gold);padding:.75rem 1rem;background:color-mix(in srgb,var(--gold,#d7b45b) 8%,transparent);border-radius:.65rem}.v129-workflow-grid{display:grid;gap:1rem}.v129-workflow-card{display:grid;gap:.85rem}.v129-workflow-card header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.v129-workflow-card h3,.v129-workflow-card p{margin:0}.v129-workflow-meta{display:flex;flex-wrap:wrap;gap:.45rem;color:var(--muted);font-size:.85rem}.v129-review-fields{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem}.v129-review-fields label{min-width:0}.v129-review-fields select,.v129-review-fields textarea{width:100%}.v129-review-note{grid-column:1/-1}.v129-review-note textarea{min-height:4.5rem;resize:vertical}.v129-note-help{display:block;margin-top:.3rem;color:var(--muted);font-size:.8rem}.v129-note-error{min-height:1.25rem;margin:0;color:#ffb4a9}.v129-review-actions{display:flex;flex-wrap:wrap;gap:.7rem}.v129-review-actions .btn{min-height:44px}.v129-review-empty{color:var(--muted)}
@media(max-width:1050px){.v129-review-fields{grid-template-columns:repeat(2,minmax(0,1fr))}.v129-review-note{grid-column:1/-1}}@media(max-width:760px){.v129-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v129-workflow-card header{display:grid}.v129-review-actions{display:grid;grid-template-columns:1fr}.v129-review-actions .btn{width:100%}}@media(max-width:540px){.v129-summary-grid,.v129-review-fields{grid-template-columns:1fr}.v129-review-note{grid-column:auto}}@media print{.v129-workflow-review{display:none!important}}
`;

const USAGE_OPTIONS = Object.freeze([['unreviewed','Not reviewed'],['never','Never used'],['occasional','Occasional'],['regular','Regular'],['essential','Essential']]);
const FRICTION_OPTIONS = Object.freeze([['unreviewed','Not reviewed'],['none','None'],['low','Low'],['medium','Medium'],['high','High']]);
const OUTCOME_OPTIONS = Object.freeze([['unreviewed','Not reviewed'],['successful','Successful'],['partial','Partial'],['blocked','Blocked'],['unclear','Unclear']]);
const SIGNAL_OPTIONS = Object.freeze([['none','No signal selected'],['works-well','Works well'],['repeated-confusion','Repeated confusion'],['slow-path','Slow path'],['abandoned','Often abandoned'],['duplicate-surface','Duplicate surface'],['missing-guidance','Missing guidance'],['failure-recovery','Failure or recovery issue'],['unmet-need','Unmet need']]);
const DISPOSITION_OPTIONS = Object.freeze([['unreviewed','Not reviewed'],['keep','Keep'],['simplify','Simplify'],['consolidate','Consolidate'],['demote','Demote'],['remove','Consider removal'],['investigate','Investigate']]);

const reviewState = new Map();
let active = false;
let installed = false;
let services = { announce() {}, enhance() {} };
let lastSummary = model.summarizeWorkflowReview(model.WORKFLOW_INVENTORY.map((workflow) => model.emptyWorkflowObservation(workflow.id)));

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[character]));
}

function installStyles() {
  if (document.querySelector('style[data-v129-review-styles]')) return;
  const style = document.createElement('style');
  style.dataset.v129ReviewStyles = 'true';
  style.textContent = CSS;
  document.head.append(style);
}

function observations() {
  return model.WORKFLOW_INVENTORY.map((workflow) => reviewState.get(workflow.id) || model.emptyWorkflowObservation(workflow.id));
}

function selectMarkup(field, value, options, workflowId) {
  return `<select data-v129-field="${field}" data-workflow-id="${escapeHtml(workflowId)}">${options.map(([optionValue,label]) => `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>`;
}

function workflowCard(workflow) {
  const observation = reviewState.get(workflow.id) || model.emptyWorkflowObservation(workflow.id);
  return `<article class="card v129-workflow-card" data-v129-workflow="${escapeHtml(workflow.id)}"><header><div><h3>${escapeHtml(workflow.label)}</h3><p>${escapeHtml(workflow.purpose)}</p></div><span class="badge">${escapeHtml(workflow.destination)}</span></header><div class="v129-workflow-meta"><span>Typical cadence: ${escapeHtml(workflow.cadence)}</span><span>Safety: ${escapeHtml(workflow.safetyBoundary)}</span></div><div class="v129-review-fields"><label>Usage${selectMarkup('usage',observation.usage,USAGE_OPTIONS,workflow.id)}</label><label>Friction${selectMarkup('friction',observation.friction,FRICTION_OPTIONS,workflow.id)}</label><label>Outcome${selectMarkup('outcome',observation.outcome,OUTCOME_OPTIONS,workflow.id)}</label><label>Observed signal${selectMarkup('signal',observation.signal,SIGNAL_OPTIONS,workflow.id)}</label><label>Disposition${selectMarkup('disposition',observation.disposition,DISPOSITION_OPTIONS,workflow.id)}</label><label class="v129-review-note">Optional workflow-only observation<textarea maxlength="240" data-v129-field="note" data-workflow-id="${escapeHtml(workflow.id)}" placeholder="Describe the sequence, guidance, clarity, or delay. Do not enter amounts, account details, card details, contacts, or transaction identifiers.">${escapeHtml(observation.note || '')}</textarea><span class="v129-note-help">Maximum 240 characters. Structured workflow evidence only.</span></label><p class="v129-note-error" id="v129-error-${escapeHtml(workflow.id)}" aria-live="polite"></p></div></article>`;
}

function workflowLabels(ids) {
  const labels = new Map(model.WORKFLOW_INVENTORY.map((item) => [item.id,item.label]));
  return ids.map((id) => labels.get(id) || id);
}

function listMarkup(values, emptyText) {
  return values.length ? `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>` : `<p class="v129-review-empty">${escapeHtml(emptyText)}</p>`;
}

function summaryMarkup(summary) {
  return `<div class="v129-summary-grid"><span><strong>${summary.completeCount}/${summary.inventoryCount}</strong>Complete reviews</span><span><strong>${summary.highFrictionWorkflowIds.length}</strong>High-friction workflows</span><span><strong>${summary.consolidationCandidateIds.length}</strong>Consolidation candidates</span><span><strong>${summary.unmetNeedWorkflowIds.length}</strong>Unmet-need signals</span></div><p class="v129-next-action"><strong>Recommended next action:</strong> ${escapeHtml(summary.recommendedNextAction)}</p><details><summary>Current evidence summary</summary><div class="grid two"><section><h4>High friction</h4>${listMarkup(workflowLabels(summary.highFrictionWorkflowIds),'No high-friction workflow is recorded.')}</section><section><h4>Consolidation candidates</h4>${listMarkup(workflowLabels(summary.consolidationCandidateIds),'No consolidation candidate is recorded.')}</section><section><h4>Unmet needs or unclear outcomes</h4>${listMarkup(workflowLabels(summary.unmetNeedWorkflowIds),'No unmet-need signal is recorded.')}</section><section><h4>Keep candidates</h4>${listMarkup(workflowLabels(summary.keepCandidateIds),'No keep candidate has enough evidence yet.')}</section></div></details>`;
}

function updateSummary() {
  lastSummary = model.summarizeWorkflowReview(observations());
  const mount = document.getElementById('workflowReviewSummary');
  if (!mount) return;
  mount.innerHTML = summaryMarkup(lastSummary);
  services.enhance(mount);
}

function setActiveTab() {
  document.querySelectorAll('.tools-subnav [data-tools-section]').forEach((button) => {
    const selected = button.dataset.toolsSection === WORKFLOW_SECTION;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));
    button.setAttribute('tabindex',selected ? '0' : '-1');
  });
}

async function open({ focusHeading = false } = {}) {
  installStyles();
  const subnav = document.querySelector('.tools-subnav');
  const workspace = subnav?.parentElement;
  if (!subnav || !workspace) return false;
  active = true;
  setActiveTab();
  while (subnav.nextSibling) subnav.nextSibling.remove();
  const section = document.createElement('section');
  section.className = 'v129-workflow-review';
  section.dataset.v129WorkflowReview = 'true';
  section.innerHTML = `<article class="card v129-review-intro"><div class="section-title-row"><div><h2 tabindex="-1">Household Workflow Evidence Review</h2><p>Record deliberate household observations before Gringotts adds, removes, or consolidates another surface.</p></div><div class="section-meta">Session only</div></div></article><article class="card v129-privacy-boundary"><h3>Privacy boundary</h3><p>This workspace does not inspect the vault, transactions, accounts, reports, route history, or prior activity. Nothing is saved automatically. Reloading the page clears the in-session review.</p></article><article class="card v129-review-summary" id="workflowReviewSummary" aria-live="polite"></article><div class="v129-workflow-grid">${model.WORKFLOW_INVENTORY.map(workflowCard).join('')}</div><article class="card"><h3>Local review actions</h3><p>Exports contain only the structured workflow choices above and validated workflow-only observations.</p><div class="v129-review-actions"><button type="button" class="btn primary" id="downloadWorkflowReview">Download Local Review JSON</button><button type="button" class="btn secondary" id="copyWorkflowReviewSummary">Copy Review Summary</button><button type="button" class="btn secondary" id="clearWorkflowReview">Clear In-Session Review</button></div><p class="v129-note-error" id="workflowReviewActionError" aria-live="polite"></p></article>`;
  workspace.append(section);
  updateSummary();
  services.enhance(section);
  if (focusHeading) section.querySelector('h2')?.focus({ preventScroll:false });
  services.announce('Workflow Review ready');
  return true;
}

function setActionError(message = '') {
  const node = document.getElementById('workflowReviewActionError');
  if (node) node.textContent = message;
}

function handleChange(event) {
  const target = event.target.closest?.('[data-v129-field][data-workflow-id]');
  if (!target || !active) return;
  const workflowId = target.dataset.workflowId;
  const field = target.dataset.v129Field;
  const candidate = { ...(reviewState.get(workflowId) || model.emptyWorkflowObservation(workflowId)) };
  if (field === 'note') {
    const value = target.value.trim();
    if (value) candidate.note = value;
    else delete candidate.note;
  } else candidate[field] = target.value;
  const errorNode = document.getElementById(`v129-error-${workflowId}`);
  try {
    reviewState.set(workflowId,model.validateWorkflowObservation(candidate));
    target.removeAttribute('aria-invalid');
    if (errorNode) errorNode.textContent = '';
    updateSummary();
  } catch (error) {
    target.setAttribute('aria-invalid','true');
    if (errorNode) errorNode.textContent = error?.message || 'That observation could not be recorded.';
  }
}

function downloadReview() {
  const values = observations();
  const summary = model.summarizeWorkflowReview(values);
  if (!summary.reviewedCount) throw new Error('Review at least one workflow before downloading the local evidence bundle.');
  const createdAt = new Date().toISOString();
  const bundle = model.buildWorkflowReviewBundle(values,createdAt);
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(bundle,null,2)}\n`],{type:'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = model.workflowReviewFilename(createdAt);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url),0);
  services.announce('Local workflow review downloaded');
}

async function copySummary() {
  const values = observations();
  const summary = model.summarizeWorkflowReview(values);
  if (!summary.reviewedCount) throw new Error('Review at least one workflow before copying the summary.');
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser context.');
  await navigator.clipboard.writeText(model.workflowReviewSummaryText(model.buildWorkflowReviewBundle(values)));
  services.announce('Workflow review summary copied');
}

async function handleAction(event) {
  const action = event.target.closest?.('#downloadWorkflowReview,#copyWorkflowReviewSummary,#clearWorkflowReview');
  if (!action || !active) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  setActionError('');
  try {
    if (action.id === 'downloadWorkflowReview') downloadReview();
    else if (action.id === 'copyWorkflowReviewSummary') await copySummary();
    else if (window.confirm('Clear the current in-session workflow review?')) {
      reviewState.clear();
      await open();
      services.announce('In-session workflow review cleared');
    }
  } catch (error) {
    setActionError(error?.message || 'The local workflow review action could not finish.');
  }
}

const controller = Object.freeze({
  open,
  deactivate() { active = false; },
  isActive() { return active; },
  snapshot() {
    return { reviewStateCount:reviewState.size, reviewedCount:lastSummary.reviewedCount, completeCount:lastSummary.completeCount, inventoryCount:lastSummary.inventoryCount };
  }
});

export function installWorkflowReview(nextServices = {}) {
  services = { ...services, ...nextServices };
  if (!installed) {
    installed = true;
    document.addEventListener('change',handleChange,true);
    document.addEventListener('click',handleAction,true);
  }
  return controller;
}
