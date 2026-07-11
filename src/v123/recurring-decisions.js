import { money, read, txs } from '../v103/core.js';
import {
  RECURRING_DECISION_KEY,
  buildRecurringCandidates,
  reconcileRecurringDecisions,
  recurringPlanActions,
  sanitizeRecurringDecisionStore,
  setRecurringDecision
} from './recurring-decisions-model.js';

const LEGACY_PREF_KEY = 'gringottsRecurringPrefs.v1';

let installed = false;
let selectedCandidateId = '';
let renderQueued = false;
const filters = { state: 'all', cadence: 'all', query: '' };

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function legacyStatuses() {
  const stored = read(LEGACY_PREF_KEY, { statuses: {} });
  return stored?.statuses && typeof stored.statuses === 'object' && !Array.isArray(stored.statuses)
    ? stored.statuses
    : {};
}

function readStore() {
  try {
    return sanitizeRecurringDecisionStore(JSON.parse(localStorage.getItem(RECURRING_DECISION_KEY) || '{}'));
  } catch {
    return sanitizeRecurringDecisionStore({});
  }
}

function verifiedWrite(nextValue) {
  const previousRaw = localStorage.getItem(RECURRING_DECISION_KEY);
  const next = sanitizeRecurringDecisionStore(nextValue);
  try {
    localStorage.setItem(RECURRING_DECISION_KEY, JSON.stringify(next));
    const verified = sanitizeRecurringDecisionStore(JSON.parse(localStorage.getItem(RECURRING_DECISION_KEY) || '{}'));
    if (JSON.stringify(verified) !== JSON.stringify(next)) {
      throw new Error('Recurring decision read-back verification failed.');
    }
    return verified;
  } catch (error) {
    try {
      if (previousRaw === null) localStorage.removeItem(RECURRING_DECISION_KEY);
      else localStorage.setItem(RECURRING_DECISION_KEY, previousRaw);
    } catch {}
    throw new Error(`${error?.message || 'Recurring decision write failed.'} The previous decision metadata was restored.`);
  }
}

export function recurringDecisionAnalysis() {
  const detection = buildRecurringCandidates(txs(), { legacyStatuses: legacyStatuses() });
  const decisions = reconcileRecurringDecisions(readStore(), detection.candidates);
  return { ...detection, decisions };
}

function decisionLabel(value) {
  return ({
    keep: 'Keep',
    cancel: 'Cancel outside Gringotts',
    renegotiate: 'Renegotiate outside Gringotts',
    investigate: 'Investigate',
    completed: 'Completed'
  })[value] || 'Choose a decision';
}

function statusLabel(value) {
  return ({
    'not-started': 'Not started',
    planned: 'Planned',
    waiting: 'Waiting / follow-up',
    done: 'Done'
  })[value] || 'Not started';
}

function candidateState(candidate, analysis) {
  return analysis.decisions.activeItems[candidate.candidateId] || null;
}

function filteredCandidates(analysis) {
  const query = filters.query.trim().toLowerCase();
  return analysis.candidates.filter((candidate) => {
    const state = candidateState(candidate, analysis);
    if (filters.state === 'unresolved' && state?.decision) return false;
    if (filters.state === 'decided' && !state?.decision) return false;
    if (filters.state === 'open' && (!state?.decision || state.status === 'done')) return false;
    if (filters.state === 'done' && state?.status !== 'done') return false;
    if (filters.cadence !== 'all' && candidate.cadence !== filters.cadence) return false;
    if (query && ![
      candidate.displayName,
      candidate.category,
      candidate.accountDisplay,
      candidate.owner,
      candidate.cadence,
      candidate.amountStability,
      state?.decision,
      state?.owner,
      state?.notes
    ].join(' ').toLowerCase().includes(query)) return false;
    return true;
  });
}

function selectedCandidate(analysis) {
  const visible = filteredCandidates(analysis);
  if (!analysis.candidates.some((candidate) => candidate.candidateId === selectedCandidateId)) {
    selectedCandidateId = visible[0]?.candidateId || analysis.candidates[0]?.candidateId || '';
  }
  return visible.find((candidate) => candidate.candidateId === selectedCandidateId)
    || analysis.candidates.find((candidate) => candidate.candidateId === selectedCandidateId)
    || visible[0]
    || analysis.candidates[0]
    || null;
}

function metric(value, label) {
  const card = element('article', 'kpi recurring-decision-kpi');
  card.append(element('strong', '', value), element('span', '', label));
  return card;
}

function option(value, label, selected) {
  const node = element('option', '', label);
  node.value = value;
  node.selected = value === selected;
  return node;
}

function control(labelText, controlNode, className = '') {
  const label = element('label', `recurring-decision-control ${className}`.trim());
  label.append(element('span', '', labelText), controlNode);
  return label;
}

function select(values, selected = '') {
  const node = document.createElement('select');
  values.forEach(([value, label]) => node.append(option(value, label, selected)));
  return node;
}

function filterPanel(analysis) {
  const section = element('section', 'recurring-decision-filters');
  const grid = element('div', 'recurring-decision-filter-grid');
  const state = select([
    ['all', 'All candidates'],
    ['unresolved', 'Unresolved only'],
    ['decided', 'Decided only'],
    ['open', 'Open follow-up'],
    ['done', 'Done']
  ], filters.state);
  state.dataset.v123RecurringFilter = 'state';
  const cadence = select([
    ['all', 'All cadences'],
    ['weekly', 'Weekly'],
    ['biweekly', 'Biweekly'],
    ['monthly', 'Monthly'],
    ['quarterly', 'Quarterly'],
    ['semiannual', 'Semiannual'],
    ['annual', 'Annual'],
    ['irregular', 'Irregular'],
    ['unknown', 'Unknown']
  ], filters.cadence);
  cadence.dataset.v123RecurringFilter = 'cadence';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Merchant, account, owner, or note';
  search.value = filters.query;
  search.dataset.v123RecurringSearch = 'true';
  grid.append(
    control('Decision state', state),
    control('Cadence', cadence),
    control('Local search', search, 'recurring-decision-search')
  );
  const clear = element('button', 'btn secondary', 'Clear Filters');
  clear.type = 'button';
  clear.id = 'clearRecurringDecisionFilters';
  section.append(
    grid,
    clear,
    element('p', 'muted-note', `Showing ${filteredCandidates(analysis).length} of ${analysis.candidates.length} evidence-backed recurring candidate${analysis.candidates.length === 1 ? '' : 's'}.`)
  );
  return section;
}

function candidatePicker(analysis, selected) {
  const visible = filteredCandidates(analysis);
  const picker = select(visible.map((candidate, index) => [
    candidate.candidateId,
    `${index + 1}. ${candidate.displayName} · ${candidate.cadence} · ${money(candidate.latestAmount)}`
  ]), selected?.candidateId || '');
  picker.id = 'recurringDecisionCandidate';
  return control('Review recurring cost', picker, 'recurring-candidate-picker');
}

function summaryTable(candidate) {
  const wrap = element('div', 'table-wrap recurring-evidence-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', `Recurring evidence for ${candidate.displayName}`);
  const table = element('table', 'ledger recurring-evidence-table');
  const body = element('tbody');
  [
    ['Category', candidate.category],
    ['Account', candidate.accountDisplay],
    ['Detected owner', candidate.owner || 'Unassigned'],
    ['Posted evidence', `${candidate.occurrences} charges across ${candidate.months} months`],
    ['Coverage', `${candidate.firstDate} through ${candidate.latestDate}`],
    ['Cadence', candidate.typicalDays ? `${candidate.cadence} · about ${candidate.typicalDays} days` : candidate.cadence],
    ['Amount pattern', `${candidate.amountStability} · ${money(candidate.minAmount)} to ${money(candidate.maxAmount)}`],
    ['Latest charge', money(candidate.latestAmount)],
    ['Previous charge', candidate.previousAmount ? money(candidate.previousAmount) : 'Unavailable'],
    ['Simple annual footprint', candidate.annualCost ? money(candidate.annualCost) : 'Not estimated'],
    ['Annualized latest increase', candidate.annualIncrease ? money(candidate.annualIncrease) : 'None detected']
  ].forEach(([label, value]) => {
    const row = element('tr');
    row.append(element('th', '', label), element('td', '', value));
    body.append(row);
  });
  table.append(body);
  wrap.append(table);
  return wrap;
}

function evidenceCard(candidate) {
  const card = element('article', 'card recurring-evidence-card');
  card.append(element('h4', '', 'Why this cost was surfaced'));
  const list = element('ul');
  candidate.evidence.forEach((entry) => list.append(element('li', '', entry)));
  card.append(
    list,
    element('p', 'muted-note', 'Only posted expense rows provide evidence. Pending transactions and single-month one-time charges are not promoted into this decision queue.')
  );
  return card;
}

function decisionForm(candidate, analysis) {
  const saved = candidateState(candidate, analysis) || {};
  const form = element('article', 'card recurring-decision-form');
  form.append(element('h4', '', 'Household decision and follow-up'));

  const decision = select([
    ['', 'Choose a decision'],
    ['keep', decisionLabel('keep')],
    ['cancel', decisionLabel('cancel')],
    ['renegotiate', decisionLabel('renegotiate')],
    ['investigate', decisionLabel('investigate')],
    ['completed', decisionLabel('completed')]
  ], saved.decision || '');
  decision.id = 'recurringDecisionChoice';

  const status = select([
    ['not-started', statusLabel('not-started')],
    ['planned', statusLabel('planned')],
    ['waiting', statusLabel('waiting')],
    ['done', statusLabel('done')]
  ], saved.status || 'not-started');
  status.id = 'recurringDecisionStatus';

  const owner = document.createElement('input');
  owner.id = 'recurringDecisionOwner';
  owner.type = 'text';
  owner.maxLength = 80;
  owner.value = saved.owner || candidate.owner || '';
  owner.placeholder = 'Household owner';

  const targetDate = document.createElement('input');
  targetDate.id = 'recurringDecisionTargetDate';
  targetDate.type = 'date';
  targetDate.value = saved.targetDate || '';

  const notes = document.createElement('textarea');
  notes.id = 'recurringDecisionNotes';
  notes.maxLength = 800;
  notes.rows = 4;
  notes.value = saved.notes || '';
  notes.placeholder = 'Terms to check, alternatives, call result, final billing date, or next follow-up.';

  const grid = element('div', 'recurring-decision-form-grid');
  grid.append(
    control('Decision', decision),
    control('Follow-up status', status),
    control('Owner', owner),
    control('Target date', targetDate)
  );
  const save = element('button', 'btn primary', 'Save Recurring Decision');
  save.type = 'button';
  save.id = 'saveRecurringDecision';
  form.append(
    grid,
    control('Notes', notes, 'recurring-decision-notes'),
    element('div', 'note warning-note', 'Gringotts records the household plan only. It cannot cancel a service, change a payment, contact a merchant, send an email, or connect to an external account.'),
    element('p', 'muted-note', 'Open Cancel, Renegotiate, and Investigate decisions automatically appear in the Guided Household Plan. Annual amounts are simple cadence-based discussion estimates, not guaranteed savings.'),
    save
  );
  return form;
}

function candidateDetail(candidate, analysis) {
  const saved = candidateState(candidate, analysis);
  const section = element('section', 'recurring-candidate-detail');
  section.id = 'recurringCandidateDetail';
  section.setAttribute('aria-live', 'polite');
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h4', '', candidate.displayName),
    element('p', '', `${candidate.cadence} cadence · ${candidate.amountStability} amounts · ${candidate.accountDisplay}`)
  );
  titleRow.append(title, element('div', 'section-meta', saved?.decision
    ? `${decisionLabel(saved.decision)} · ${statusLabel(saved.status)}`
    : 'Decision required'));
  const evidence = element('div', 'grid two recurring-evidence-grid');
  evidence.append(summaryTable(candidate), evidenceCard(candidate));
  section.append(titleRow, evidence, decisionForm(candidate, analysis));
  return section;
}

function renderWorkspace(workspace) {
  const analysis = recurringDecisionAnalysis();
  const selected = selectedCandidate(analysis);
  workspace.dataset.v123RecurringWorkspace = 'true';
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h3', '', 'Recurring cost decisions'),
    element('p', '', 'Turn posted recurring-charge evidence into owned household decisions and visible follow-up without contacting merchants or changing payments.')
  );
  titleRow.append(title, element('div', 'section-meta', `${analysis.summary.pendingExcluded} pending excluded`));
  const metrics = element('div', 'import-summary-grid recurring-decision-summary');
  metrics.append(
    metric(String(analysis.candidates.length), 'Evidence-backed costs'),
    metric(money(analysis.summary.annualFootprint), 'Simple annual footprint'),
    metric(money(analysis.summary.annualizedIncreases), 'Annualized increases'),
    metric(String(analysis.decisions.summary.open), 'Open follow-ups'),
    metric(money(analysis.decisions.summary.potentialCancellation), 'Cancellation decisions')
  );
  workspace.replaceChildren(
    titleRow,
    metrics,
    element('div', 'note warning-note', 'Planning only: savings estimates are assumptions. Pending charges and unsupported one-time purchases are excluded, and no decision causes an external merchant or payment action.'),
    filterPanel(analysis)
  );
  if (!analysis.candidates.length) {
    workspace.append(element('div', 'note good-note', 'No evidence-backed recurring cost is available yet. At least two posted charges across multiple months are normally required.'));
    return;
  }
  if (!filteredCandidates(analysis).length) {
    workspace.append(element('div', 'note warning-note', 'No recurring cost matches the current filters.'));
    return;
  }
  workspace.append(candidatePicker(analysis, selected));
  if (selected) workspace.append(candidateDetail(selected, analysis));
  if (analysis.decisions.summary.dormant) {
    workspace.append(element('p', 'muted-note', `${analysis.decisions.summary.dormant} retained decision record${analysis.decisions.summary.dormant === 1 ? '' : 's'} no longer match current recurring evidence. They remain in bounded local history and are not applied to another merchant.`));
  }
}

function legacyRecurringGrid(page) {
  const heading = [...page.querySelectorAll('h3')]
    .find((node) => node.textContent?.trim() === 'Recurring-charge watch');
  return heading?.closest('.grid.two') || null;
}

export function enhanceRecurringDecisionPage(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Bills, Recurring & Budgets') return false;
  let workspace = page.querySelector('.recurring-decision-workspace');
  const legacy = legacyRecurringGrid(page);
  if (legacy) {
    legacy.hidden = true;
    legacy.dataset.v123LegacyRecurringHidden = 'true';
  }
  if (!workspace) {
    workspace = element('article', 'card recurring-decision-workspace');
    if (legacy) legacy.before(workspace);
    else page.append(workspace);
  }
  renderWorkspace(workspace);
  return true;
}

function actionList(actions) {
  const list = element('div', 'recurring-plan-action-list');
  actions.forEach((action) => {
    const card = element('article', 'card recurring-plan-action');
    const row = element('div', 'section-title-row');
    const title = element('div');
    title.append(element('h4', '', action.title), element('p', '', action.evidence));
    row.append(title, element('div', 'section-meta', action.targetDate || statusLabel(action.status)));
    const details = element('ul');
    details.append(
      element('li', '', `Owner: ${action.owner || 'Unassigned'}`),
      element('li', '', `Next step: ${action.nextStep}`),
      element('li', '', `Simple annual footprint: ${action.annualCost ? money(action.annualCost) : 'Not estimated'}`)
    );
    if (action.annualIncrease) details.append(element('li', '', `Annualized latest increase: ${money(action.annualIncrease)}`));
    if (action.notes) details.append(element('li', '', `Notes: ${action.notes}`));
    card.append(row, details);
    list.append(card);
  });
  return list;
}

export function enhanceGuidedPlanPage(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Guided Household Plan') return false;
  if (page.querySelector('.v123-recurring-plan-section')) return true;
  const analysis = recurringDecisionAnalysis();
  const actions = recurringPlanActions(analysis.candidates, analysis.decisions);
  const section = element('section', 'v123-recurring-plan-section');
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h3', '', 'Recurring-cost follow-up'),
    element('p', '', 'Open Cancel, Renegotiate, and Investigate decisions from Money, shown here without editing transactions or contacting merchants.')
  );
  titleRow.append(title, element('div', 'section-meta', `${actions.length} open`));
  section.append(titleRow);
  section.append(actions.length
    ? actionList(actions)
    : element('div', 'note good-note', 'No actionable recurring-cost decision is currently open.'));
  page.append(section);
  return true;
}

function reportSection(titleText, description, actions, summary) {
  const section = element('section', 'report-section v123-recurring-report-section');
  section.append(element('h3', '', titleText), element('p', '', description));
  if (actions.length) {
    const list = element('ul');
    actions.slice(0, 8).forEach((action) => {
      list.append(element('li', '', `${action.title}${action.owner ? ` — ${action.owner}` : ''}${action.targetDate ? ` by ${action.targetDate}` : ''}. ${action.nextStep}`));
    });
    section.append(list);
  } else {
    section.append(element('p', '', 'No open recurring-cost follow-up is recorded.'));
  }
  section.append(element('p', 'muted-note', `Simple annual footprint across detected candidates: ${money(summary.annualFootprint)}. Potential cancellation decisions: ${money(summary.potentialCancellation)}. These are discussion estimates, not guaranteed savings.`));
  return section;
}

export function enhanceRecurringReportPages(root) {
  const analysis = recurringDecisionAnalysis();
  const actions = recurringPlanActions(analysis.candidates, analysis.decisions);
  const summary = {
    ...analysis.summary,
    ...analysis.decisions.summary
  };
  const planPage = root?.querySelector('.guided-plan-report');
  if (planPage && !planPage.querySelector('.v123-recurring-report-section')) {
    planPage.append(reportSection(
      'Recurring-cost decisions',
      'Selected household follow-up from the recurring decision queue.',
      actions,
      summary
    ));
  }
  const meetingHeading = [...(root?.querySelectorAll('.report-page h2, .report-page h3') || [])]
    .find((node) => node.textContent?.trim() === 'Family meeting brief');
  const meetingPage = meetingHeading?.closest('.report-page');
  if (meetingPage && !meetingPage.querySelector('.v123-recurring-report-section')) {
    meetingPage.append(reportSection(
      'Recurring-cost conversation',
      'Decide who owns each follow-up and whether the evidence supports keeping, cancelling, renegotiating, investigating, or completing the item.',
      actions,
      summary
    ));
  }
  return Boolean(planPage || meetingPage);
}

function refreshWorkspace() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    const workspace = document.querySelector('.recurring-decision-workspace');
    if (workspace) renderWorkspace(workspace);
  });
}

function saveCurrentDecision() {
  const analysis = recurringDecisionAnalysis();
  const candidate = selectedCandidate(analysis);
  if (!candidate) throw new Error('No recurring candidate is selected.');
  const decision = document.getElementById('recurringDecisionChoice')?.value || '';
  const status = document.getElementById('recurringDecisionStatus')?.value || 'not-started';
  const owner = document.getElementById('recurringDecisionOwner')?.value || '';
  const targetDate = document.getElementById('recurringDecisionTargetDate')?.value || '';
  const notes = document.getElementById('recurringDecisionNotes')?.value || '';
  return verifiedWrite(setRecurringDecision(analysis.decisions, candidate.candidateId, {
    decision, status, owner, targetDate, notes
  }));
}

function installHandlers() {
  if (installed) return;
  installed = true;
  document.addEventListener('change', (event) => {
    const filter = event.target.closest?.('[data-v123-recurring-filter]');
    if (filter) {
      filters[filter.dataset.v123RecurringFilter] = filter.value;
      refreshWorkspace();
      return;
    }
    if (event.target?.id === 'recurringDecisionCandidate') {
      selectedCandidateId = event.target.value;
      refreshWorkspace();
    }
  });
  document.addEventListener('input', (event) => {
    if (!event.target?.matches?.('[data-v123-recurring-search]')) return;
    filters.query = event.target.value;
    clearTimeout(installHandlers.searchTimer);
    installHandlers.searchTimer = setTimeout(refreshWorkspace, 150);
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('#clearRecurringDecisionFilters')) {
      event.preventDefault();
      Object.assign(filters, { state: 'all', cadence: 'all', query: '' });
      refreshWorkspace();
      return;
    }
    if (!event.target.closest?.('#saveRecurringDecision')) return;
    event.preventDefault();
    try {
      saveCurrentDecision();
      announce('Recurring decision saved and verified');
      refreshWorkspace();
    } catch (error) {
      announce(error?.message || 'Recurring decision could not be saved');
    }
  });
}

export function installRecurringDecisionFeatures() {
  installHandlers();
  const registry = window.GringottsV123 || (window.GringottsV123 = {});
  Object.assign(registry, {
    recurringDecisionsReady: true,
    recurringDecisionAnalysis,
    enhanceRecurringDecisionPage,
    enhanceGuidedPlanPage,
    enhanceRecurringReportPages,
    externalMerchantActionAvailable: false,
    transactionWriteAvailable: false,
    emailActionAvailable: false,
    paymentChangeAvailable: false
  });
  return registry;
}
