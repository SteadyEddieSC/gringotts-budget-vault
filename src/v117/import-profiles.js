import {
  parseMappedDate, parseMoneyValue
} from '../v115/parser.js';
import * as imports from '../v115/bank-import.js?v=115bankimport2';
import {
  IMPORT_PROFILES_KEY, MAX_IMPORT_PROFILES, compatibility, compatibleProfiles,
  inspectionIdentity, profileApplication, profileFromSession, profileSummary,
  sanitizeStoredProfiles
} from './profile-model.js';

let activeSourceKey = '';
let selectedProfileId = '';
let appliedProfileId = '';
let draftName = '';
let autoApplyAttempted = false;
let handlersInstalled = false;
let refreshQueued = false;

const clean = (value) => String(value ?? '').trim();

function ensureStylesheet() {
  if (document.querySelector('link[data-v117-profiles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/v117.css?v=117profiles1';
  link.dataset.v117Profiles = 'true';
  document.head.append(link);
}

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
}

function readProfiles() {
  try {
    return sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{"profiles":[]}'));
  } catch {
    return [];
  }
}

function writeProfiles(profiles) {
  const sanitized = sanitizeStoredProfiles({ profiles }).slice(0, MAX_IMPORT_PROFILES);
  const payload = { profiles: sanitized, updatedAt: new Date().toISOString() };
  localStorage.setItem(IMPORT_PROFILES_KEY, JSON.stringify(payload));
  const verified = sanitizeStoredProfiles(JSON.parse(localStorage.getItem(IMPORT_PROFILES_KEY) || '{}'));
  if (JSON.stringify(verified) !== JSON.stringify(sanitized)) {
    throw new Error('Import profile verification failed. No profile change was accepted.');
  }
  return verified;
}

function sourceKey(state) {
  const identity = inspectionIdentity(state.inspection);
  return state.inspection ? `${identity?.headerSignature || ''}|${state.sourceFingerprint || ''}` : '';
}

function resetControllerForSource(state) {
  const nextKey = sourceKey(state);
  if (nextKey === activeSourceKey) return;
  activeSourceKey = nextKey;
  selectedProfileId = '';
  appliedProfileId = '';
  draftName = '';
  autoApplyAttempted = false;
}

function rerenderImport() {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => {
    refreshQueued = false;
    document.querySelector('[data-tools-section="import"]')?.click();
  });
}

function applyProfileById(profileId, { automatic = false } = {}) {
  const state = imports.snapshot();
  const profile = readProfiles().find((candidate) => candidate.profileId === profileId);
  if (!profile || !state.inspection) throw new Error('The selected compatible profile is no longer available.');
  const application = profileApplication(profile, state.inspection);
  Object.entries(application.mapping).forEach(([field, header]) => imports.updateBankMapping(field, header));
  Object.entries(application.options).forEach(([name, value]) => imports.updateBankOption(name, value));
  selectedProfileId = profile.profileId;
  appliedProfileId = profile.profileId;
  draftName = profile.name;
  toast(`${automatic ? 'Automatically applied' : 'Applied'} profile “${profile.name}”`);
  rerenderImport();
}

function autoApplyCompatibleProfile(state) {
  if (!state.inspection || autoApplyAttempted || state.inspection.format === 'json') return false;
  autoApplyAttempted = true;
  const matches = compatibleProfiles(readProfiles(), state.inspection);
  if (matches.length !== 1) return false;
  try {
    applyProfileById(matches[0].profileId, { automatic: true });
    return true;
  } catch (error) {
    toast(error?.message || 'Compatible profile could not be applied');
    return false;
  }
}

function profileDirty(state, profile) {
  if (!profile) return false;
  const currentMapping = JSON.stringify(state.options?.mapping || {});
  const savedMapping = JSON.stringify(profile.mapping || {});
  const currentOptions = JSON.stringify({
    dateOrder: state.options?.dateOrder || 'auto',
    signMode: state.options?.signMode || '',
    accountLabel: state.options?.accountLabel || 'Imported account',
    accountMode: state.options?.accountMode || 'label',
    useSourceCategory: state.options?.useSourceCategory === true
  });
  return currentMapping !== savedMapping || currentOptions !== JSON.stringify(profile.options || {});
}

function saveCurrentProfile(name) {
  const state = imports.snapshot();
  if (!state.inspection) throw new Error('Inspect a supported export before saving a profile.');
  if (state.inspection.format === 'json') throw new Error('Gringotts JSON imports do not need a mapping profile.');
  const profiles = readProfiles();
  const existing = profiles.find((profile) => profile.profileId === selectedProfileId) || null;
  const profile = profileFromSession({
    profileId: existing?.profileId || '', name, inspection: state.inspection,
    options: state.options, existingProfile: existing
  });
  const remaining = profiles.filter((candidate) => candidate.profileId !== profile.profileId);
  const verified = writeProfiles([profile, ...remaining]);
  const saved = verified.find((candidate) => candidate.profileId === profile.profileId);
  if (!saved) throw new Error('Saved profile could not be verified.');
  selectedProfileId = saved.profileId;
  appliedProfileId = saved.profileId;
  draftName = saved.name;
  toast(`${existing ? 'Updated' : 'Saved'} profile “${saved.name}”`);
  rerenderImport();
}

function deleteSelectedProfile() {
  const profile = readProfiles().find((candidate) => candidate.profileId === selectedProfileId);
  if (!profile) throw new Error('Choose a saved profile to delete.');
  if (!window.confirm(`Delete local import profile “${profile.name}”?\n\nNo transaction data will be changed.`)) return;
  const verified = writeProfiles(readProfiles().filter((candidate) => candidate.profileId !== profile.profileId));
  if (verified.some((candidate) => candidate.profileId === profile.profileId)) throw new Error('Profile deletion could not be verified.');
  selectedProfileId = '';
  appliedProfileId = '';
  draftName = '';
  toast(`Deleted profile “${profile.name}”`);
  rerenderImport();
}

function sampleValues(state, field, limit = 12) {
  const header = state.options?.mapping?.[field];
  if (!header) return [];
  return (state.inspection?.records || []).map((record) => clean(record?.[header])).filter(Boolean).slice(0, limit);
}

function countMappedValues(state, field) {
  const header = state.options?.mapping?.[field];
  if (!header) return { present: 0, total: state.inspection?.records?.length || 0 };
  const records = state.inspection?.records || [];
  return { present: records.filter((record) => clean(record?.[header])).length, total: records.length };
}

function fieldValidation(state, field) {
  const mapping = state.options?.mapping || {};
  const header = mapping[field];
  if (!header) {
    if (field === 'date') return { status: 'error', text: 'Required: choose the transaction date column.' };
    if (field === 'description' && !mapping.memo) return { status: 'error', text: 'Required: map a description or memo column.' };
    if (field === 'amount' && !mapping.debit && !mapping.credit) return { status: 'error', text: 'Required: map a signed amount or separate debit and credit columns.' };
    if (['debit', 'credit'].includes(field) && (mapping.debit || mapping.credit)) return { status: 'info', text: 'Separate debit/credit mode is active; blank values are allowed on the opposite side.' };
    return { status: 'optional', text: 'Optional field is not mapped.' };
  }

  if (field === 'date') {
    const values = sampleValues(state, field);
    const results = values.map((value) => parseMappedDate(value, state.options.dateOrder));
    const invalid = results.filter((result) => result.error);
    return invalid.length
      ? { status: 'error', text: `${values.length - invalid.length} of ${values.length} sampled dates validate. ${invalid[0].error}` }
      : { status: 'good', text: `${values.length} sampled dates validate using ${state.options.dateOrder === 'auto' ? 'automatic ambiguity blocking' : state.options.dateOrder.toUpperCase()} order.` };
  }

  if (['amount', 'debit', 'credit'].includes(field)) {
    const values = sampleValues(state, field);
    const invalid = values.map(parseMoneyValue).filter((result) => result.error || result.value === null);
    const mode = mapping.debit || mapping.credit ? 'separate debit/credit columns' : `${state.options.signMode || 'unselected'} signed-amount interpretation`;
    return invalid.length
      ? { status: 'error', text: `${values.length - invalid.length} of ${values.length} sampled values are numeric; review ${invalid[0].error || 'blank amount'}.` }
      : { status: state.options.signMode || mapping.debit || mapping.credit ? 'good' : 'error', text: `${values.length} sampled values are numeric; using ${mode}.` };
  }

  const coverage = countMappedValues(state, field);
  const purpose = field === 'id' ? 'Stable IDs strengthen exact duplicate detection.'
    : field === 'account' ? `Account handling is ${state.options.accountMode === 'mapped-masked' ? 'masked final-four mapping' : 'the destination label for every row'}.`
      : field === 'category' ? `Source categories are ${state.options.useSourceCategory ? 'explicitly enabled' : 'disabled; new rows use Other'}.`
        : field === 'status' ? 'Pending-like values are kept out of posted comparisons.'
          : field === 'type' ? `Transaction type ${state.options.signMode === 'type' ? 'controls amount direction' : 'is used for transfer classification only'}.`
            : 'Mapped values are retained only in normalized transaction fields.';
  return { status: coverage.present ? 'good' : 'warning', text: `${coverage.present} of ${coverage.total} rows contain a value. ${purpose}` };
}

function addValidationNotes(page, state, appliedProfile) {
  page.querySelectorAll('[data-bank-mapping]').forEach((select) => {
    const field = select.dataset.bankMapping;
    const label = select.closest('label');
    if (!label || label.querySelector('.field-validation')) return;
    const validation = fieldValidation(state, field);
    const note = document.createElement('small');
    note.className = `field-validation ${validation.status}`;
    const remembered = appliedProfile && appliedProfile.mapping?.[field] === select.value
      ? ` Remembered from “${appliedProfile.name}” after an exact profile match.` : '';
    note.textContent = `${validation.text}${remembered}`;
    label.append(note);
  });
}

function createButton(text, id, className = 'btn secondary') {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = className;
  button.textContent = text;
  return button;
}

function renderProfileCard(page, state) {
  if (!state.inspection || state.inspection.format === 'json') return;
  const profiles = readProfiles();
  const matches = compatibleProfiles(profiles, state.inspection);
  const selected = profiles.find((profile) => profile.profileId === selectedProfileId) || null;
  const applied = profiles.find((profile) => profile.profileId === appliedProfileId) || null;
  const card = document.createElement('article');
  card.id = 'importProfileCard';
  card.className = 'card import-profile-card';

  const titleRow = document.createElement('div');
  titleRow.className = 'section-title-row';
  const title = document.createElement('div');
  const heading = document.createElement('h3');
  heading.textContent = 'Mapping profile';
  const intro = document.createElement('p');
  intro.textContent = 'Profiles remember reviewed field mappings and normalization options only. Transaction rows, filenames, and source fingerprints are never stored.';
  title.append(heading, intro);
  const meta = document.createElement('div');
  meta.className = 'section-meta';
  meta.textContent = `${matches.length} compatible · ${profiles.length} saved`;
  titleRow.append(title, meta);

  const grid = document.createElement('div');
  grid.className = 'grid two import-profile-grid';
  const selectLabel = document.createElement('label');
  selectLabel.append(document.createTextNode('Compatible saved profile'));
  const select = document.createElement('select');
  select.id = 'bankImportProfileSelect';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = matches.length ? 'Choose a compatible profile' : 'No compatible profile for these headers';
  select.append(empty);
  matches.forEach((profile) => {
    const option = document.createElement('option');
    option.value = profile.profileId;
    option.textContent = profile.name;
    option.selected = profile.profileId === selectedProfileId;
    select.append(option);
  });
  selectLabel.append(select);

  const nameLabel = document.createElement('label');
  nameLabel.append(document.createTextNode('Profile name'));
  const name = document.createElement('input');
  name.id = 'bankImportProfileName';
  name.maxLength = 80;
  name.placeholder = 'Example: Household card CSV';
  name.value = draftName || selected?.name || '';
  nameLabel.append(name);
  grid.append(selectLabel, nameLabel);

  const actions = document.createElement('div');
  actions.className = 'button-row import-profile-actions';
  const apply = createButton('Apply Selected Profile', 'applyBankImportProfile', 'btn primary');
  apply.disabled = !selectedProfileId || selectedProfileId === appliedProfileId;
  const save = createButton(selected ? 'Update Profile' : 'Save New Profile', 'saveBankImportProfile', 'btn primary');
  const fresh = createButton('New Profile', 'newBankImportProfile');
  const remove = createButton('Delete Profile', 'deleteBankImportProfile', 'btn danger');
  remove.disabled = !selected;
  actions.append(apply, save, fresh, remove);

  const status = document.createElement('div');
  status.className = 'import-profile-status';
  if (applied) {
    const dirty = profileDirty(state, applied);
    const summary = profileSummary(applied);
    const note = document.createElement('div');
    note.className = `note ${dirty ? 'warning-note' : 'good-note'}`;
    note.textContent = dirty
      ? `Profile “${applied.name}” was applied, but the current mapping or options have changed. Update it explicitly to remember the changes.`
      : `Profile “${applied.name}” is applied. ${summary.identity}.`;
    status.append(note);
  } else if (matches.length > 1) {
    const note = document.createElement('div');
    note.className = 'note warning-note';
    note.textContent = 'More than one exact-compatible profile exists. Choose one explicitly; v117 will not guess between them.';
    status.append(note);
  } else if (!matches.length && profiles.length) {
    const nearest = profiles.map((profile) => ({ profile, result: compatibility(profile, state.inspection) }))[0];
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = `No profile was applied because compatibility is exact-only. ${nearest?.result?.reasons?.[0] || 'The format or headers differ.'}`;
    status.append(note);
  }

  card.append(titleRow, grid, actions, status);
  const mappingCard = page.querySelector('.bank-mapping-card') || page.querySelector('.bank-file-card')?.nextElementSibling;
  if (mappingCard) mappingCard.before(card);
  else page.querySelector('.import-workflow')?.prepend(card);
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.id === 'bankImportProfileSelect') {
      selectedProfileId = target.value;
      const profile = readProfiles().find((candidate) => candidate.profileId === selectedProfileId);
      draftName = profile?.name || '';
      rerenderImport();
    }
    if (target.id === 'bankImportFile') {
      activeSourceKey = '';
      selectedProfileId = '';
      appliedProfileId = '';
      draftName = '';
      autoApplyAttempted = false;
    }
  }, true);

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'bankImportProfileName') draftName = event.target.value;
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if (!button) return;
    try {
      if (button.id === 'applyBankImportProfile') {
        event.preventDefault();
        applyProfileById(selectedProfileId);
      } else if (button.id === 'saveBankImportProfile') {
        event.preventDefault();
        saveCurrentProfile(document.getElementById('bankImportProfileName')?.value || draftName);
      } else if (button.id === 'newBankImportProfile') {
        event.preventDefault();
        selectedProfileId = '';
        appliedProfileId = '';
        draftName = '';
        rerenderImport();
      } else if (button.id === 'deleteBankImportProfile') {
        event.preventDefault();
        deleteSelectedProfile();
      }
    } catch (error) {
      toast(error?.message || 'The import profile action could not be completed');
    }
  }, true);
}

export function enhanceImportProfiles(page) {
  if (!page || page.dataset.v117Profiles === 'true') return;
  ensureStylesheet();
  installHandlers();
  const state = imports.snapshot();
  resetControllerForSource(state);
  if (autoApplyCompatibleProfile(state)) return;
  renderProfileCard(page, state);
  const applied = readProfiles().find((profile) => profile.profileId === appliedProfileId) || null;
  addValidationNotes(page, state, applied);
  page.dataset.v117Profiles = 'true';
}

export function importProfileSnapshot() {
  return {
    storageKey: IMPORT_PROFILES_KEY,
    profiles: readProfiles(),
    selectedProfileId,
    appliedProfileId,
    activeSourceKey
  };
}
