import { downloadJson, stamp } from '../v103/core.js';
import { IMPORT_PROFILES_KEY, MAX_IMPORT_PROFILES, sanitizeStoredProfiles } from '../v117/profile-model.js';
import {
  MAX_PROFILE_BUNDLE_BYTES, applyProfileImportPlan, exportProfileBundle,
  inspectProfileBundle, profileLibrary
} from './profile-portability-model.js';

let preview = null;
let previewFileName = '';
let handlersInstalled = false;
let refreshQueued = false;
let lastResult = '';

const clean = (value) => String(value ?? '').trim();

function ensureStylesheet() {
  if (document.querySelector('link[data-v118-portability]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/v118.css?v=118portable1';
  link.dataset.v118Portability = 'true';
  document.head.append(link);
}

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3600);
}

function readProfiles() {
  try {
    return sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{"profiles":[]}'));
  } catch {
    return [];
  }
}

function writeProfiles(profiles) {
  const before = localStorage.getItem(IMPORT_PROFILES_KEY);
  const sanitized = sanitizeStoredProfiles({ profiles }).slice(0, MAX_IMPORT_PROFILES);
  const payload = { profiles: sanitized, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(IMPORT_PROFILES_KEY, JSON.stringify(payload));
    const verified = sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{}'));
    if (JSON.stringify(verified) !== JSON.stringify(sanitized)) throw new Error('Profile bundle write verification failed.');
    return verified;
  } catch (error) {
    try {
      if (before === null) localStorage.removeItem(IMPORT_PROFILES_KEY);
      else localStorage.setItem(IMPORT_PROFILES_KEY, before);
    } catch {}
    throw new Error(`${error?.message || 'Profile bundle write failed'} The previous local profile library was restored.`);
  }
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

function option(value, text, selected = false) {
  const node = document.createElement('option');
  node.value = value;
  node.textContent = text;
  node.selected = selected;
  return node;
}

function renderLibrary(profiles) {
  const wrapper = element('div', 'profile-library');
  const heading = element('h4', '', 'Saved profile library');
  const copy = element('p', 'muted-note', profiles.length
    ? 'Use distinct names that include the card, account, or purpose when several exports share one schema.'
    : 'No mapping profiles are saved in this browser yet.');
  wrapper.append(heading, copy);
  if (!profiles.length) return wrapper;

  const tableWrap = element('div', 'table-wrap profile-library-table-wrap');
  tableWrap.tabIndex = 0;
  tableWrap.setAttribute('role', 'region');
  tableWrap.setAttribute('aria-label', 'Saved import profile library');
  const table = element('table', 'ledger profile-library-table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Profile', 'Destination label', 'Pattern', 'Identity'].forEach((label) => headRow.append(element('th', '', label)));
  thead.append(headRow);
  const tbody = document.createElement('tbody');
  profileLibrary(profiles).forEach((row) => {
    const tr = document.createElement('tr');
    tr.append(
      element('td', '', row.name),
      element('td', '', row.accountLabel),
      element('td', '', row.schema),
      element('td', 'profile-identity-cell', row.identity)
    );
    tbody.append(tr);
  });
  table.append(thead, tbody);
  tableWrap.append(table);
  wrapper.append(tableWrap);
  return wrapper;
}

function actionSelect(item) {
  const select = document.createElement('select');
  select.dataset.profileBundleAction = item.itemId;
  select.append(option('skip', 'Skip this profile', item.defaultAction === 'skip'));
  if (!['exact', 'same-definition'].includes(item.status)) {
    select.append(option('add', 'Add as a separate profile', item.defaultAction === 'add'));
  } else {
    select.append(option('add', 'Add a separately named copy', false));
  }
  if (item.replaceTargets.length) select.append(option('replace', 'Replace an identity-matched profile', false));
  return select;
}

function renderPreviewItem(item, index) {
  const article = element('article', `profile-bundle-item status-${item.status}`);
  article.dataset.profileBundleItem = item.itemId;
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h4', '', `${index + 1}. ${item.incoming.name}`),
    element('p', '', item.explanation)
  );
  const meta = element('div', 'section-meta', item.status.replace(/-/g, ' '));
  titleRow.append(title, meta);

  const identity = element('div', 'summary-box compact profile-bundle-identity');
  identity.textContent = [
    `Format: ${item.incoming.format.toUpperCase()}`,
    `Pattern: ${item.incoming.schemaLabel || item.incoming.schemaId}`,
    `Header identity: ${item.incoming.headerSignature}`,
    `Destination label: ${item.incoming.options.accountLabel}`
  ].join('\n');

  const differences = element('details', 'profile-bundle-differences');
  const summary = element('summary', '', 'Identity and definition comparison');
  const list = document.createElement('ul');
  item.differences.forEach((difference) => list.append(element('li', '', difference)));
  differences.append(summary, list);

  const controls = element('div', 'grid three profile-bundle-controls');
  const actionLabel = element('label', '', 'Reviewed action');
  actionLabel.append(actionSelect(item));
  const nameLabel = element('label', '', 'Local profile name');
  const name = document.createElement('input');
  name.type = 'text';
  name.maxLength = 80;
  name.value = item.suggestedName;
  name.dataset.profileBundleName = item.itemId;
  nameLabel.append(name);
  const targetLabel = element('label', 'profile-replace-target', 'Replacement target');
  const target = document.createElement('select');
  target.dataset.profileBundleTarget = item.itemId;
  target.append(option('', 'Choose identity-matched profile'));
  item.replaceTargets.forEach((candidate) => target.append(option(candidate.profileId, candidate.name)));
  targetLabel.append(target);
  targetLabel.hidden = true;
  controls.append(actionLabel, nameLabel, targetLabel);
  article.append(titleRow, identity, differences, controls);
  return article;
}

function renderPreview() {
  if (!preview) return null;
  const section = element('section', 'profile-bundle-preview');
  section.id = 'profileBundlePreview';
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h4', '', 'Reviewed bundle import'),
    element('p', '', 'Every profile has an explicit local action. Nothing is stored until the confirmation below succeeds and is read back.')
  );
  titleRow.append(title, element('div', 'section-meta', `${preview.count} definition${preview.count === 1 ? '' : 's'}`));
  section.append(titleRow);

  const source = element('div', 'summary-box compact');
  source.textContent = [
    `Selected local file: ${previewFileName || 'unnamed JSON file'}`,
    `Generator: ${preview.generator || 'not declared'}`,
    `Exported: ${preview.exportedAt || 'not declared'}`,
    'File name and file contents are not saved after this review.'
  ].join('\n');
  section.append(source);
  preview.items.forEach((item, index) => section.append(renderPreviewItem(item, index)));

  const confirmation = element('article', 'card warning-card profile-bundle-confirmation');
  const ackLabel = element('label', 'ack-row');
  const ack = document.createElement('input');
  ack.type = 'checkbox';
  ack.id = 'profileBundleAck';
  const ackText = element('span', '', 'I reviewed every Add, Replace, and Skip decision. This changes mapping-profile metadata only and does not import transactions or restore a vault.');
  ackLabel.append(ack, ackText);
  const commit = button('Import Reviewed Profiles', 'commitProfileBundle', 'btn danger');
  commit.disabled = true;
  confirmation.append(ackLabel, commit);
  section.append(confirmation);
  return section;
}

function renderPortabilityCard(page) {
  if (page.querySelector('#profilePortabilityCard')) return;
  const profiles = readProfiles();
  const card = element('article', 'card profile-portability-card');
  card.id = 'profilePortabilityCard';
  const titleRow = element('div', 'section-title-row');
  const title = document.createElement('div');
  title.append(
    element('h3', '', 'Profile library and portability'),
    element('p', '', 'Move sanitized mapping definitions between browsers without transaction rows, filenames, source fingerprints, balances, credentials, or full account identifiers.')
  );
  titleRow.append(title, element('div', 'section-meta', `${profiles.length} of ${MAX_IMPORT_PROFILES} saved`));

  const actions = element('div', 'button-row profile-portability-actions');
  const exportButton = button('Export Saved Profiles', 'exportProfileBundle', 'btn primary');
  exportButton.disabled = !profiles.length;
  const fileLabel = element('label', 'file-drop compact-file-drop');
  fileLabel.setAttribute('for', 'profileBundleFile');
  const fileCopy = element('span');
  fileCopy.append(
    element('strong', '', 'Choose Profile Bundle JSON'),
    document.createElement('br'),
    document.createTextNode('Preview and resolve conflicts before saving.')
  );
  const input = document.createElement('input');
  input.id = 'profileBundleFile';
  input.type = 'file';
  input.accept = 'application/json,.json';
  fileLabel.append(fileCopy, input);
  actions.append(exportButton, fileLabel);
  if (preview) actions.append(button('Clear Bundle Preview', 'clearProfileBundlePreview'));

  card.append(titleRow, actions, renderLibrary(profiles));
  if (lastResult) card.append(element('div', 'note good-note', lastResult));
  const previewNode = renderPreview();
  if (previewNode) card.append(previewNode);
  const progress = page.querySelector('.bank-import-progress');
  if (progress) progress.after(card);
  else page.querySelector('.import-workflow')?.prepend(card);
}

function collectDecisions(card) {
  return preview.items.map((item) => ({
    itemId: item.itemId,
    action: card.querySelector(`[data-profile-bundle-action="${CSS.escape(item.itemId)}"]`)?.value || '',
    name: card.querySelector(`[data-profile-bundle-name="${CSS.escape(item.itemId)}"]`)?.value || '',
    targetProfileId: card.querySelector(`[data-profile-bundle-target="${CSS.escape(item.itemId)}"]`)?.value || ''
  }));
}

async function inspectSelectedFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > MAX_PROFILE_BUNDLE_BYTES) throw new Error('Profile bundle is larger than the 256 KB local safety limit.');
  const text = await file.text();
  if (!clean(text)) throw new Error('Profile bundle is empty.');
  preview = inspectProfileBundle(JSON.parse(text), readProfiles());
  previewFileName = clean(file.name).slice(0, 160);
  lastResult = '';
  rerenderImport();
}

function commitReviewedBundle(card) {
  if (!preview) throw new Error('Choose and inspect a profile bundle first.');
  if (!card.querySelector('#profileBundleAck')?.checked) throw new Error('Acknowledge the reviewed profile decisions before saving.');
  const result = applyProfileImportPlan(readProfiles(), preview, collectDecisions(card));
  const verified = writeProfiles(result.profiles);
  if (verified.length !== result.profiles.length) throw new Error('Profile bundle verification returned an unexpected profile count.');
  lastResult = `Verified profile bundle result: ${result.counts.added} added, ${result.counts.replaced} replaced, ${result.counts.skipped} skipped.`;
  preview = null;
  previewFileName = '';
  window.dispatchEvent(new CustomEvent('gringotts:profiles-changed', { detail: result.counts }));
  toast(lastResult);
  rerenderImport();
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', async (event) => {
    const target = event.target;
    try {
      if (target?.id === 'profileBundleFile') {
        await inspectSelectedFile(target);
        return;
      }
      if (target?.matches?.('[data-profile-bundle-action]')) {
        const item = target.closest('[data-profile-bundle-item]');
        const targetLabel = item?.querySelector('.profile-replace-target');
        if (targetLabel) targetLabel.hidden = target.value !== 'replace';
        return;
      }
      if (target?.id === 'profileBundleAck') {
        const commit = target.closest('.profile-bundle-confirmation')?.querySelector('#commitProfileBundle');
        if (commit) commit.disabled = !target.checked;
      }
    } catch (error) {
      preview = null;
      previewFileName = '';
      toast(error?.message || 'Profile bundle could not be inspected');
      rerenderImport();
    }
  }, true);

  document.addEventListener('click', (event) => {
    const target = event.target.closest?.('button');
    if (!target) return;
    try {
      if (target.id === 'exportProfileBundle') {
        event.preventDefault();
        const profiles = readProfiles();
        if (!profiles.length) throw new Error('No saved import profiles are available to export.');
        downloadJson(`Gringotts_v118_import_profiles_${profiles.length}_${stamp()}.json`, exportProfileBundle(profiles));
        toast(`Exported ${profiles.length} sanitized profile definition${profiles.length === 1 ? '' : 's'}`);
      } else if (target.id === 'clearProfileBundlePreview') {
        event.preventDefault();
        preview = null;
        previewFileName = '';
        lastResult = '';
        rerenderImport();
      } else if (target.id === 'commitProfileBundle') {
        event.preventDefault();
        commitReviewedBundle(target.closest('#profilePortabilityCard'));
      }
    } catch (error) {
      toast(error?.message || 'The profile portability action could not be completed');
    }
  }, true);
}

export function enhanceProfilePortability(page) {
  if (!page || page.dataset.v118Portability === 'true') return;
  ensureStylesheet();
  installHandlers();
  renderPortabilityCard(page);
  page.dataset.v118Portability = 'true';
}

export function profilePortabilitySnapshot() {
  return {
    storageKey: IMPORT_PROFILES_KEY,
    profileCount: readProfiles().length,
    previewCount: preview?.count || 0,
    previewFileName,
    lastResult
  };
}
