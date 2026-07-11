import {
  best, downloadJson, keys, read, recurringCandidates, ruleData, stamp, state, txs
} from '../v103/core.js';
import {
  ACCOUNT_CLEANUP_PLAN_KEY,
  buildAccountCleanupPackage,
  buildAccountInventory,
  buildAccountReferenceImpact,
  detectAccountCandidates,
  inventorySignature,
  reconcileCleanupPlan,
  sanitizeCleanupPlan,
  setCleanupDecision
} from './account-cleanup-model.js';

let handlersInstalled = false;
let selectedCandidateId = '';
let refreshQueued = false;
const filters = { state: 'all', confidence: 'all', query: '' };

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

function localMetadataSources() {
  const current = state();
  const vaultMetadata = Object.fromEntries(Object.entries(current).filter(([key]) => key !== 'transactions' && key !== '_activeKey'));
  const selectedKeys = keys().filter((key) => !key.startsWith('gringottsBudgetVault.')
    && key !== ACCOUNT_CLEANUP_PLAN_KEY
    && /rule|cashflow|guided|goal|close|forecast|debt|recurring|annual|bill|payday|budget|insight/i.test(key));
  const browserMetadata = {};
  selectedKeys.forEach((key) => { browserMetadata[key] = read(key, null); });
  return {
    vaultMetadata,
    browserMetadata,
    rules: ruleData().rules,
    recurring: recurringCandidates()
  };
}

function readPlan() {
  try {
    return sanitizeCleanupPlan(JSON.parse(localStorage.getItem(ACCOUNT_CLEANUP_PLAN_KEY) || '{}'));
  } catch {
    return sanitizeCleanupPlan({});
  }
}

function verifiedWritePlan(nextValue) {
  const previousRaw = localStorage.getItem(ACCOUNT_CLEANUP_PLAN_KEY);
  const next = sanitizeCleanupPlan(nextValue);
  try {
    localStorage.setItem(ACCOUNT_CLEANUP_PLAN_KEY, JSON.stringify(next));
    const verified = sanitizeCleanupPlan(JSON.parse(localStorage.getItem(ACCOUNT_CLEANUP_PLAN_KEY) || '{}'));
    if (JSON.stringify(verified) !== JSON.stringify(next)) throw new Error('Account cleanup plan read-back verification failed.');
    return verified;
  } catch (error) {
    try {
      if (previousRaw === null) localStorage.removeItem(ACCOUNT_CLEANUP_PLAN_KEY);
      else localStorage.setItem(ACCOUNT_CLEANUP_PLAN_KEY, previousRaw);
    } catch {}
    throw new Error(`${error?.message || 'Account cleanup plan write failed.'} The previous metadata plan was restored.`);
  }
}

function currentAnalysis() {
  const inventory = buildAccountInventory(txs());
  const candidates = detectAccountCandidates(inventory);
  const impact = buildAccountReferenceImpact(inventory, localMetadataSources());
  const signature = inventorySignature(inventory);
  const plan = reconcileCleanupPlan(readPlan(), candidates, signature);
  return { inventory, candidates, impact, signature, plan };
}

function decisionMap(plan) {
  return new Map(plan.decisions.map((entry) => [entry.candidateId, entry.decision]));
}

function filteredCandidates(analysis) {
  const decisions = decisionMap(analysis.plan);
  const query = filters.query.trim().toLowerCase();
  return analysis.candidates.filter((candidate) => {
    const decided = decisions.has(candidate.candidateId);
    if (filters.state === 'unresolved' && decided) return false;
    if (filters.state === 'decided' && !decided) return false;
    if (filters.confidence !== 'all' && candidate.confidence !== filters.confidence) return false;
    if (query && ![
      candidate.leftDisplayLabel,
      candidate.rightDisplayLabel,
      candidate.classification,
      candidate.confidence
    ].join(' ').toLowerCase().includes(query)) return false;
    return true;
  });
}

function metric(value, label) {
  const card = element('article', 'kpi account-cleanup-kpi');
  card.append(element('strong', '', Number(value || 0).toLocaleString()), element('span', '', label));
  return card;
}

function option(value, label, selected) {
  const node = element('option', '', label);
  node.value = value;
  node.selected = value === selected;
  return node;
}

function selectControl(label, name, values, selected) {
  const wrapper = element('label', 'account-cleanup-control');
  wrapper.append(element('span', '', label));
  const select = document.createElement('select');
  select.dataset.v122Filter = name;
  values.forEach(([value, text]) => select.append(option(value, text, selected)));
  wrapper.append(select);
  return wrapper;
}

function referenceTotal(impact = {}) {
  return ['rules', 'recurring', 'budgets', 'billsAndPaydays', 'goals', 'planning', 'otherMetadata']
    .reduce((sum, key) => sum + Number(impact[key] || 0), 0);
}

function inventoryTable(analysis) {
  const candidateAccounts = new Map();
  analysis.candidates.forEach((candidate) => {
    candidateAccounts.set(candidate.leftAccountId, (candidateAccounts.get(candidate.leftAccountId) || 0) + 1);
    candidateAccounts.set(candidate.rightAccountId, (candidateAccounts.get(candidate.rightAccountId) || 0) + 1);
  });
  const wrap = element('div', 'table-wrap account-inventory-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Account label inventory');
  const table = element('table', 'ledger account-inventory-table');
  const head = element('thead');
  const row = element('tr');
  ['Account label', 'Type', 'Transactions', 'Coverage', 'Other references', 'Candidates'].forEach((label) => row.append(element('th', '', label)));
  head.append(row);
  const body = element('tbody');
  analysis.inventory.forEach((account) => {
    const item = element('tr');
    [
      account.displayLabel,
      account.kind === 'unknown' ? 'Unclassified' : account.kind,
      String(account.transactionCount),
      account.firstDate && account.lastDate ? `${account.firstDate} through ${account.lastDate}` : 'Date coverage unavailable',
      String(referenceTotal(analysis.impact[account.accountId])),
      String(candidateAccounts.get(account.accountId) || 0)
    ].forEach((value) => item.append(element('td', '', value)));
    body.append(item);
  });
  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function candidateFilterControls(analysis) {
  const section = element('section', 'account-cleanup-filters');
  const grid = element('div', 'account-cleanup-filter-grid');
  grid.append(
    selectControl('Decision state', 'state', [
      ['all', 'All candidates'], ['unresolved', 'Unresolved only'], ['decided', 'Decided only']
    ], filters.state),
    selectControl('Confidence', 'confidence', [
      ['all', 'All confidence levels'], ['high', 'High confidence'], ['medium', 'Medium confidence'], ['low', 'Low confidence']
    ], filters.confidence)
  );
  const search = element('label', 'account-cleanup-control account-cleanup-search');
  search.append(element('span', '', 'Local search'));
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Account label or finding';
  input.value = filters.query;
  input.dataset.v122Search = 'true';
  search.append(input);
  grid.append(search);
  const clear = element('button', 'btn secondary', 'Clear Filters');
  clear.type = 'button';
  clear.id = 'clearAccountCleanupFilters';
  section.append(grid, clear, element('p', 'muted-note', `Showing ${filteredCandidates(analysis).length} of ${analysis.candidates.length} cleanup candidate${analysis.candidates.length === 1 ? '' : 's'}.`));
  return section;
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

function candidatePicker(analysis, selected) {
  const visible = filteredCandidates(analysis);
  const wrapper = element('label', 'account-cleanup-control account-candidate-picker');
  wrapper.append(element('span', '', 'Review candidate'));
  const select = document.createElement('select');
  select.id = 'accountCleanupCandidate';
  visible.forEach((candidate, index) => {
    select.append(option(candidate.candidateId, `${index + 1}. ${candidate.leftDisplayLabel} ↔ ${candidate.rightDisplayLabel}`, selected?.candidateId));
  });
  wrapper.append(select);
  return wrapper;
}

function impactList(title, accountId, analysis) {
  const impact = analysis.impact[accountId] || {};
  const box = element('article', 'card account-impact-card');
  box.append(element('h4', '', title));
  const list = element('ul', 'action-list');
  [
    ['Transaction rows', impact.transactions],
    ['Rules', impact.rules],
    ['Recurring items', impact.recurring],
    ['Budgets', impact.budgets],
    ['Bills and paydays', impact.billsAndPaydays],
    ['Goals', impact.goals],
    ['Planning and close history', impact.planning],
    ['Other local metadata', impact.otherMetadata]
  ].forEach(([label, value]) => list.append(element('li', '', `${label}: ${Number(value || 0).toLocaleString()}`)));
  box.append(list);
  return box;
}

function decisionLabel(value) {
  return ({
    'keep-separate': 'Keep separate',
    'rename-left-to-right': 'Plan rename: left label → right label',
    'rename-right-to-left': 'Plan rename: right label → left label',
    'merge-left-to-right': 'Plan merge: left history → right account',
    'merge-right-to-left': 'Plan merge: right history → left account',
    investigate: 'Investigate before deciding'
  })[value] || 'Choose a decision';
}

function candidateDetail(candidate, analysis) {
  const decisions = decisionMap(analysis.plan);
  const selectedDecision = decisions.get(candidate.candidateId) || '';
  const section = element('section', 'account-candidate-detail');
  section.id = 'accountCleanupCandidateDetail';
  section.setAttribute('aria-live', 'polite');
  const title = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h4', '', `${candidate.leftDisplayLabel} ↔ ${candidate.rightDisplayLabel}`),
    element('p', '', `${candidate.classification.replace(/-/g, ' ')} · ${candidate.confidence} confidence · ${candidate.dateRelationship} date ranges`)
  );
  title.append(intro, element('div', 'section-meta', selectedDecision ? 'Decision saved' : 'Decision required'));
  const evidence = element('article', 'card account-candidate-evidence');
  evidence.append(element('h4', '', 'Why this pair was surfaced'));
  const evidenceList = element('ul');
  candidate.evidence.forEach((entry) => evidenceList.append(element('li', '', entry)));
  evidence.append(evidenceList, element('p', 'muted-note', 'Similarity is evidence for review, not permission to combine histories. Overlapping date ranges may indicate two genuinely separate accounts.'));
  const impacts = element('div', 'grid two account-impact-grid');
  impacts.append(
    impactList(candidate.leftDisplayLabel, candidate.leftAccountId, analysis),
    impactList(candidate.rightDisplayLabel, candidate.rightAccountId, analysis)
  );
  const decision = element('article', 'card account-cleanup-decision');
  decision.append(element('h4', '', 'Cleanup-plan decision'));
  const label = element('label', 'account-cleanup-control');
  label.append(element('span', '', 'Decision for this candidate'));
  const select = document.createElement('select');
  select.id = 'accountCleanupDecision';
  select.append(option('', 'Choose a decision', selectedDecision));
  [
    'keep-separate', 'rename-left-to-right', 'rename-right-to-left',
    'merge-left-to-right', 'merge-right-to-left', 'investigate'
  ].forEach((value) => select.append(option(value, decisionLabel(value), selectedDecision)));
  label.append(select);
  const save = element('button', 'btn primary', 'Save Plan Decision');
  save.type = 'button';
  save.id = 'saveAccountCleanupDecision';
  decision.append(
    label,
    element('p', 'muted-note', 'This saves only the candidate ID and decision in bounded browser-local metadata. It does not rename accounts, merge histories, or change reports.'),
    save
  );
  section.append(title, evidence, impacts, decision);
  return section;
}

function renderCleanupCard(card) {
  const analysis = currentAnalysis();
  const selected = selectedCandidate(analysis);
  card.dataset.v122AccountCleanup = 'true';
  card.classList.add('account-cleanup-card');
  const titleRow = element('div', 'section-title-row');
  const title = element('div');
  title.append(
    element('h3', '', 'Account cleanup & merge planning'),
    element('p', '', 'Inventory account labels, review explainable duplicate or rename candidates, and record a future cleanup decision without changing transaction history.')
  );
  const actions = element('div', 'button-row account-cleanup-actions');
  const backup = element('button', 'btn secondary', 'Download Vault Backup');
  backup.type = 'button';
  backup.id = 'downloadAccountCleanupBackup';
  const download = element('button', 'btn secondary', 'Download Cleanup Plan');
  download.type = 'button';
  download.id = 'downloadAccountCleanupPlan';
  actions.append(backup, download);
  titleRow.append(title, actions);
  const metrics = element('div', 'import-summary-grid account-cleanup-summary');
  metrics.append(
    metric(analysis.inventory.length, 'Account labels'),
    metric(analysis.candidates.length, 'Review candidates'),
    metric(analysis.plan.status.decided, 'Decisions saved'),
    metric(analysis.plan.status.unresolved, 'Unresolved'),
    metric(analysis.inventory.reduce((sum, account) => sum + referenceTotal(analysis.impact[account.accountId]), 0), 'Other references')
  );
  card.replaceChildren(titleRow, metrics);
  if (analysis.plan.status.staleInventoryReset) {
    card.append(element('div', 'note warning-note', 'The account inventory changed, so prior candidate decisions were treated as stale instead of being silently reused.'));
  }
  card.append(
    element('div', 'note warning-note', 'Planning only: v122 cannot automatically rename accounts, merge account histories, rewrite rules or budgets, delete transactions, or apply a cleanup plan.'),
    element('h4', '', 'Account inventory'),
    inventoryTable(analysis),
    element('h4', '', 'Cleanup candidates'),
    candidateFilterControls(analysis)
  );
  if (!analysis.candidates.length) {
    card.append(element('div', 'note good-note', 'No strong duplicate-label or rename candidate was detected. The full account inventory remains available for review.'));
  } else if (!filteredCandidates(analysis).length) {
    card.append(element('div', 'note warning-note', 'No cleanup candidate matches the current filters.'));
  } else {
    card.append(candidatePicker(analysis, selected));
    if (selected) card.append(candidateDetail(selected, analysis));
  }
  card.append(element('p', 'muted-note', analysis.plan.status.complete
    ? 'Every current candidate has an explicit planning decision. Applying those decisions remains unavailable and would require a separate backup-first release.'
    : 'The cleanup plan remains incomplete until every current candidate has an explicit decision.'));
}

function cleanupCard(root = document) {
  return root.querySelector('.account-cleanup-card');
}

export function enhanceAccountCleanup(page) {
  if (!page) return false;
  let card = cleanupCard(page);
  if (!card) {
    card = element('article', 'card account-cleanup-card');
    const switcher = page.querySelector('.v116-task-switcher');
    if (switcher) switcher.before(card);
    else page.prepend(card);
  }
  renderCleanupCard(card);
  return true;
}

function refreshCleanupCard() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    const card = cleanupCard();
    if (card) renderCleanupCard(card);
  });
}

function downloadBackup() {
  const candidate = best();
  if (!candidate?.obj || candidate.transactions < 1) throw new Error('No populated readable vault is available to back up.');
  downloadJson(`Gringotts_v122_pre_cleanup_backup_${candidate.transactions}_${stamp()}.json`, candidate.obj);
}

function downloadPlan() {
  const analysis = currentAnalysis();
  downloadJson(`Gringotts_v122_account_cleanup_plan_${stamp()}.json`, buildAccountCleanupPackage(analysis));
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', (event) => {
    const filter = event.target.closest?.('[data-v122-filter]');
    if (filter) {
      filters[filter.dataset.v122Filter] = filter.value;
      refreshCleanupCard();
      return;
    }
    if (event.target?.id === 'accountCleanupCandidate') {
      selectedCandidateId = event.target.value;
      refreshCleanupCard();
    }
  });
  document.addEventListener('input', (event) => {
    if (!event.target?.matches?.('[data-v122-search]')) return;
    filters.query = event.target.value;
    clearTimeout(installHandlers.queryTimer);
    installHandlers.queryTimer = setTimeout(refreshCleanupCard, 150);
  });
  document.addEventListener('click', (event) => {
    if (event.target.closest?.('#clearAccountCleanupFilters')) {
      event.preventDefault();
      Object.assign(filters, { state: 'all', confidence: 'all', query: '' });
      refreshCleanupCard();
      return;
    }
    if (event.target.closest?.('#downloadAccountCleanupBackup')) {
      event.preventDefault();
      try {
        downloadBackup();
        announce('Pre-cleanup vault backup downloaded');
      } catch (error) {
        announce(error?.message || 'Vault backup could not be downloaded');
      }
      return;
    }
    if (event.target.closest?.('#downloadAccountCleanupPlan')) {
      event.preventDefault();
      try {
        downloadPlan();
        announce('Sanitized account cleanup plan downloaded');
      } catch (error) {
        announce(error?.message || 'Cleanup plan could not be downloaded');
      }
      return;
    }
    if (!event.target.closest?.('#saveAccountCleanupDecision')) return;
    event.preventDefault();
    const analysis = currentAnalysis();
    const candidate = selectedCandidate(analysis);
    const decision = document.getElementById('accountCleanupDecision')?.value || '';
    if (!candidate || !decision) {
      announce('Choose an explicit cleanup-plan decision first');
      return;
    }
    try {
      verifiedWritePlan(setCleanupDecision(analysis.plan, candidate.candidateId, decision, {
        inventorySignature: analysis.signature
      }));
      announce('Cleanup-plan decision saved and verified');
      refreshCleanupCard();
    } catch (error) {
      announce(error?.message || 'Cleanup-plan decision could not be saved');
    }
  });
}

export function installAccountCleanupFeatures() {
  installHandlers();
  const registry = window.GringottsV122 || (window.GringottsV122 = {});
  Object.assign(registry, {
    accountCleanupReady: true,
    enhanceAccountCleanup,
    accountCleanupAnalysis: currentAnalysis,
    accountCleanupPlanCount: () => currentAnalysis().plan.status.decided,
    automaticAccountMergeAvailable: false,
    transactionWriteAvailable: false
  });
  return registry;
}
