import { downloadJson, stamp } from '../v103/core.js';
import * as imports from '../v115/bank-import.js?v=119diagnostics1';
import {
  IMPORT_PROFILES_KEY, MAX_IMPORT_PROFILES, profileFromSession, sanitizeStoredProfiles
} from '../v117/profile-model.js';
import { importProfileSnapshot } from '../v117/import-profiles.js?v=119diagnostics1';
import {
  applyProfileImportPlan, inspectProfileBundle, profileDefinitionKey
} from '../v118/profile-portability-model.js';
import {
  PROFILE_REVISIONS_KEY, MAX_PROFILE_REVISIONS, appendRevisionHistory,
  buildDryRunDiagnostic, createProfileRevisionSummary, dryRunDiagnosticSignature,
  profileRevisionChanges, sanitizeRevisionHistory
} from './profile-versioning-model.js';

let pendingRevision = null;
let rememberedBundle = null;
let dryRun = null;
let dryRunSignature = '';
let handlersInstalled = false;
let refreshQueued = false;
let lastResult = '';

const clean = (value) => String(value ?? '').trim();

function ensureStylesheet() {
  if (document.querySelector('link[data-v119-versioning]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/v119.css?v=119diagnostics1';
  link.dataset.v119Versioning = 'true';
  document.head.append(link);
}

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3800);
}

function rerenderImport() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    document.querySelector('[data-tools-section="import"]')?.click();
  });
}

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(text, id, className = 'btn secondary') {
  const node = element('button', className, text);
  node.type = 'button';
  node.id = id;
  return node;
}

function readProfiles() {
  try {
    return sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{"profiles":[]}'));
  } catch {
    return [];
  }
}

function readRevisions() {
  try {
    return sanitizeRevisionHistory(JSON.parse(localStorage.getItem(PROFILE_REVISIONS_KEY) || '{"revisions":[]}'));
  } catch {
    return [];
  }
}

function verifiedWrite(profiles, summaries) {
  const profilesBefore = localStorage.getItem(IMPORT_PROFILES_KEY);
  const revisionsBefore = localStorage.getItem(PROFILE_REVISIONS_KEY);
  const sanitizedProfiles = sanitizeStoredProfiles({ profiles }).slice(0, MAX_IMPORT_PROFILES);
  let revisions = readRevisions();
  summaries.forEach((summary) => { revisions = appendRevisionHistory({ revisions }, summary); });
  revisions = sanitizeRevisionHistory({ revisions }).slice(0, MAX_PROFILE_REVISIONS);
  try {
    localStorage.setItem(IMPORT_PROFILES_KEY, JSON.stringify({
      profiles: sanitizedProfiles,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem(PROFILE_REVISIONS_KEY, JSON.stringify({
      revisions,
      updatedAt: new Date().toISOString()
    }));
    const verifiedProfiles = sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{}'));
    const verifiedRevisions = sanitizeRevisionHistory(JSON.parse(localStorage.getItem(PROFILE_REVISIONS_KEY) || '{}'));
    if (JSON.stringify(verifiedProfiles) !== JSON.stringify(sanitizedProfiles)) {
      throw new Error('Profile write verification failed.');
    }
    if (JSON.stringify(verifiedRevisions) !== JSON.stringify(revisions)) {
      throw new Error('Profile revision-history verification failed.');
    }
    return { profiles: verifiedProfiles, revisions: verifiedRevisions };
  } catch (error) {
    try {
      if (profilesBefore === null) localStorage.removeItem(IMPORT_PROFILES_KEY);
      else localStorage.setItem(IMPORT_PROFILES_KEY, profilesBefore);
      if (revisionsBefore === null) localStorage.removeItem(PROFILE_REVISIONS_KEY);
      else localStorage.setItem(PROFILE_REVISIONS_KEY, revisionsBefore);
    } catch {}
    throw new Error(`${error?.message || 'Profile revision write failed'} Previous profile and revision metadata were restored.`);
  }
}

function currentProfileCandidate(profileId, name) {
  const state = imports.snapshot();
  const profiles = readProfiles();
  const existing = profiles.find((profile) => profile.profileId === profileId);
  if (!existing) throw new Error('The selected profile is no longer available.');
  if (!state.inspection) throw new Error('Inspect a supported export before updating a profile.');
  const proposed = profileFromSession({
    profileId: existing.profileId,
    name: clean(name) || existing.name,
    inspection: state.inspection,
    options: state.options,
    existingProfile: existing
  });
  const output = profiles.map((profile) => profile.profileId === existing.profileId ? proposed : profile);
  return { existing, proposed, profiles: output };
}

function revisionItem(before, after, source) {
  return {
    before,
    after,
    source,
    changes: profileRevisionChanges(before, after),
    summary: createProfileRevisionSummary(before, after, { source })
  };
}

export function interceptProfileUpdate({ profileId, name } = {}) {
  try {
    const candidate = currentProfileCandidate(clean(profileId), name);
    if (profileDefinitionKey(candidate.existing) === profileDefinitionKey(candidate.proposed)
      && candidate.existing.name === candidate.proposed.name) {
      toast('No profile mapping or normalization changes need to be saved');
      return true;
    }
    pendingRevision = {
      kind: 'local-update',
      profiles: candidate.profiles,
      items: [revisionItem(candidate.existing, candidate.proposed, 'local-update')],
      resultText: `Updated profile “${candidate.proposed.name}” with a verified revision summary.`
    };
    lastResult = '';
    rerenderImport();
    return true;
  } catch (error) {
    toast(error?.message || 'Profile revision comparison could not be prepared');
    return true;
  }
}

export async function rememberBundleFile(file) {
  if (!file) {
    rememberedBundle = null;
    return;
  }
  try {
    rememberedBundle = {
      name: clean(file.name).slice(0, 160),
      text: await file.text()
    };
  } catch {
    rememberedBundle = null;
  }
}

function bundleDecisions(root, preview) {
  return preview.items.map((item) => ({
    itemId: item.itemId,
    action: root.querySelector(`[data-profile-bundle-action="${CSS.escape(item.itemId)}"]`)?.value || '',
    name: root.querySelector(`[data-profile-bundle-name="${CSS.escape(item.itemId)}"]`)?.value || '',
    targetProfileId: root.querySelector(`[data-profile-bundle-target="${CSS.escape(item.itemId)}"]`)?.value || ''
  }));
}

export async function interceptBundleReplace(root = document) {
  try {
    if (!rememberedBundle?.text) throw new Error('The selected profile bundle is no longer available in memory. Choose it again.');
    const existing = readProfiles();
    const preview = inspectProfileBundle(JSON.parse(rememberedBundle.text), existing);
    const result = applyProfileImportPlan(existing, preview, bundleDecisions(root, preview));
    const items = [];
    result.profiles.forEach((after) => {
      const before = existing.find((profile) => profile.profileId === after.profileId);
      if (!before || profileDefinitionKey(before) === profileDefinitionKey(after)) return;
      items.push(revisionItem(before, after, 'bundle-replace'));
    });
    if (!items.length) throw new Error('No reviewed profile replacement is available for revision comparison.');
    pendingRevision = {
      kind: 'bundle-replace',
      profiles: result.profiles,
      items,
      resultText: `Verified profile bundle result: ${result.counts.added} added, ${result.counts.replaced} replaced, ${result.counts.skipped} skipped. Revision summaries were retained for replacements.`
    };
    lastResult = '';
    rerenderImport();
  } catch (error) {
    toast(error?.message || 'Bundle replacement comparison could not be prepared');
  }
  return true;
}

function renderRevisionItem(item, index) {
  const article = element('article', 'profile-revision-item');
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h4', '', `${index + 1}. ${item.after.name}`),
    element('p', '', item.source === 'bundle-replace'
      ? 'Portable definition will replace an identity-matched local profile.'
      : 'Current mapping and normalization choices will update this saved profile.')
  );
  titleRow.append(title, element('div', 'section-meta', `${item.changes.length} change${item.changes.length === 1 ? '' : 's'}`));
  const tableWrap = element('div', 'table-wrap profile-revision-table-wrap');
  tableWrap.tabIndex = 0;
  tableWrap.setAttribute('role', 'region');
  tableWrap.setAttribute('aria-label', `Profile changes for ${item.after.name}`);
  const table = element('table', 'ledger profile-revision-table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Field', 'Saved value', 'Proposed value'].forEach((label) => headRow.append(element('th', '', label)));
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  item.changes.forEach((change) => {
    const row = document.createElement('tr');
    row.append(
      element('td', '', change.label),
      element('td', '', change.before),
      element('td', '', change.after)
    );
    tbody.append(row);
  });
  table.append(thead, tbody);
  tableWrap.append(table);
  article.append(titleRow, tableWrap);
  return article;
}

function renderRevisionGate() {
  if (!pendingRevision) return null;
  const card = element('article', 'card profile-revision-gate warning-card');
  card.id = 'profileRevisionGate';
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h3', '', 'Review profile revision'),
    element('p', '', 'Compare every mapping and normalization change before storage. Revision history stores only bounded metadata; local account-label values are not retained in the history.')
  );
  titleRow.append(title, element('div', 'section-meta', pendingRevision.kind === 'bundle-replace' ? 'Bundle replacement' : 'Local update'));
  card.append(titleRow);
  pendingRevision.items.forEach((item, index) => card.append(renderRevisionItem(item, index)));
  const ackLabel = element('label', 'ack-row');
  const ack = document.createElement('input');
  ack.type = 'checkbox';
  ack.id = 'profileRevisionAck';
  ackLabel.append(ack, element('span', '', 'I reviewed these profile-definition changes. This writes mapping-profile and revision metadata only; it does not import transactions or restore a vault.'));
  const actions = element('div', 'button-row');
  const confirm = button('Confirm Profile Revision', 'confirmProfileRevision', 'btn danger');
  confirm.disabled = true;
  actions.append(confirm, button('Cancel Revision', 'cancelProfileRevision'));
  card.append(ackLabel, actions);
  return card;
}

function renderRevisionHistory() {
  const revisions = readRevisions();
  const card = element('article', 'card profile-revision-history');
  card.id = 'profileRevisionHistory';
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h3', '', 'Profile revision history'),
    element('p', '', 'Bounded metadata-only summaries show what changed without transaction rows, source files, fingerprints, or stored account-label values.')
  );
  titleRow.append(title, element('div', 'section-meta', `${revisions.length} of ${MAX_PROFILE_REVISIONS} retained`));
  card.append(titleRow);
  if (!revisions.length) {
    card.append(element('p', 'muted-note', 'No profile revisions have been confirmed in this browser.'));
    return card;
  }
  const list = element('div', 'profile-revision-history-list');
  revisions.slice(0, 10).forEach((revision) => {
    const details = element('details', 'profile-revision-history-entry');
    const summary = element('summary', '', `${revision.profileName || 'Saved profile'} · ${revision.source.replace('-', ' ')} · ${revision.changeCount} change${revision.changeCount === 1 ? '' : 's'}`);
    const meta = element('p', 'muted-note', `Recorded ${revision.changedAt}. Local account-label values were not stored.`);
    const changes = document.createElement('ul');
    revision.changes.forEach((change) => changes.append(element('li', '', `${change.label}: ${change.before} → ${change.after}`)));
    details.append(summary, meta, changes);
    list.append(details);
  });
  card.append(list);
  return card;
}

function diagnosticCurrentSignature() {
  return dryRunDiagnosticSignature(imports.snapshot(), importProfileSnapshot());
}

function renderDryRunCard() {
  const state = imports.snapshot();
  const card = element('article', 'card import-dry-run-card');
  card.id = 'importDryRunCard';
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h3', '', 'Local import dry run'),
    element('p', '', 'Prepare a metadata-only readiness report before any transaction write. The diagnostic excludes rows, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents.')
  );
  titleRow.append(title, element('div', 'section-meta', state.inspection ? 'Source inspected' : 'Choose a bank export first'));
  const actions = element('div', 'button-row');
  const prepare = button(dryRun ? 'Refresh Dry Run' : 'Prepare Dry Run', 'prepareImportDryRun', 'btn primary');
  prepare.disabled = !state.inspection;
  actions.append(prepare);
  if (dryRun) actions.append(button('Download Diagnostic JSON', 'downloadImportDryRun'));
  card.append(titleRow, actions);
  if (dryRun) {
    const duplicate = dryRun.duplicates;
    const validation = dryRun.validation;
    const summaryGrid = element('div', 'grid three import-dry-run-summary');
    summaryGrid.append(
      element('div', 'summary-box compact', `Source\n${dryRun.source.format.toUpperCase()} · ${dryRun.source.schemaLabel}\n${dryRun.source.inspectedRowCount} inspected rows`),
      element('div', 'summary-box compact', `Validation\n${validation.requiredComplete ? 'Required mapping complete' : 'Required mapping incomplete'}\n${validation.normalizationErrorCount} errors · ${validation.normalizationWarningCount} warnings`),
      element('div', 'summary-box compact', `Reconciliation\n${duplicate.exact} exact · ${duplicate.fuzzy} review candidates\n${duplicate.wouldInsert} would insert · ${duplicate.unresolved} unresolved`)
    );
    const note = element('div', 'note good-note', 'Prepared in memory only. Download requires a separate explicit action and no transaction write has occurred.');
    card.append(summaryGrid, note);
  }
  return card;
}

function commitPendingRevision() {
  if (!pendingRevision) throw new Error('No profile revision is ready to confirm.');
  const summaries = pendingRevision.items.map((item) => item.summary);
  const result = verifiedWrite(pendingRevision.profiles, summaries);
  lastResult = pendingRevision.resultText;
  const wasBundle = pendingRevision.kind === 'bundle-replace';
  pendingRevision = null;
  window.dispatchEvent(new CustomEvent('gringotts:profiles-changed', {
    detail: { revisions: summaries.length, profiles: result.profiles.length }
  }));
  toast(lastResult);
  if (wasBundle) document.getElementById('clearProfileBundlePreview')?.click();
  rerenderImport();
}

function prepareDryRun() {
  const state = imports.snapshot();
  dryRun = buildDryRunDiagnostic(state, { profileSnapshot: importProfileSnapshot() });
  dryRunSignature = dryRunDiagnosticSignature(state, importProfileSnapshot());
  toast('Metadata-only import dry run prepared');
  rerenderImport();
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', (event) => {
    if (event.target?.id === 'profileRevisionAck') {
      const confirm = document.getElementById('confirmProfileRevision');
      if (confirm) confirm.disabled = !event.target.checked;
    }
  }, true);
  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('button');
    if (!target) return;
    try {
      if (target.id === 'confirmProfileRevision') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!document.getElementById('profileRevisionAck')?.checked) throw new Error('Acknowledge the reviewed profile revision before saving.');
        commitPendingRevision();
      } else if (target.id === 'cancelProfileRevision') {
        event.preventDefault();
        event.stopImmediatePropagation();
        pendingRevision = null;
        toast('Profile revision canceled; no metadata changed');
        rerenderImport();
      } else if (target.id === 'prepareImportDryRun') {
        event.preventDefault();
        event.stopImmediatePropagation();
        prepareDryRun();
      } else if (target.id === 'downloadImportDryRun') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!dryRun || dryRunSignature !== diagnosticCurrentSignature()) throw new Error('Refresh the dry run after mapping or reconciliation changes before downloading.');
        downloadJson(`Gringotts_v119_import_dry_run_${stamp()}.json`, dryRun);
        toast('Metadata-only dry-run diagnostic downloaded');
      }
    } catch (error) {
      toast(error?.message || 'The v119 profile action could not be completed');
    }
  }, true);
}

export function enhanceProfileVersioning(page) {
  if (!page || page.dataset.v119Versioning === 'true') return;
  ensureStylesheet();
  installHandlers();
  const signature = diagnosticCurrentSignature();
  if (dryRun && dryRunSignature !== signature) {
    dryRun = null;
    dryRunSignature = '';
  }
  const portability = page.querySelector('#profilePortabilityCard');
  const mapping = page.querySelector('#importProfileCard');
  const anchor = portability || mapping || page.querySelector('.bank-import-progress');
  const gate = renderRevisionGate();
  if (gate && anchor) anchor.after(gate);
  const history = renderRevisionHistory();
  const dryRunCard = renderDryRunCard();
  if (gate) gate.after(history, dryRunCard);
  else if (anchor) anchor.after(history, dryRunCard);
  else page.querySelector('.import-workflow')?.prepend(history, dryRunCard);
  if (lastResult) dryRunCard.after(element('div', 'note good-note v119-result-note', lastResult));
  page.dataset.v119Versioning = 'true';
}

export function installV119ProfileFeatures() {
  ensureStylesheet();
  installHandlers();
  const registry = window.GringottsV119 || (window.GringottsV119 = {});
  Object.assign(registry, {
    interceptProfileUpdate,
    interceptBundleReplace,
    rememberBundleFile,
    enhanceProfileVersioning,
    revisionCount: () => readRevisions().length,
    dryRunReady: () => Boolean(dryRun)
  });
  return registry;
}
