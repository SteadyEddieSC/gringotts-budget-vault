import { sanitizeStoredProfiles } from '../v117/profile-model.js';
import {
  portableProfile, profileDefinitionKey, profileIdentityKey
} from '../v118/profile-portability-model.js';

export const PROFILE_REVISIONS_KEY = 'gringottsImportProfileRevisions.v1';
export const MAX_PROFILE_REVISIONS = 60;
export const MAX_REVISIONS_PER_PROFILE = 8;
export const DRY_RUN_DIAGNOSTIC_KIND = 'gringotts-import-dry-run-diagnostic';
export const DRY_RUN_DIAGNOSTIC_VERSION = 1;

const PROFILE_FIELDS = [
  'date', 'description', 'amount', 'debit', 'credit', 'status', 'account', 'memo', 'id', 'category', 'type'
];
const OPTION_FIELDS = ['dateOrder', 'signMode', 'accountLabel', 'accountMode', 'useSourceCategory'];
const ALLOWED_SOURCES = new Set(['local-update', 'bundle-replace']);
const clean = (value) => String(value ?? '').trim();

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function labelForPath(path) {
  if (path === 'name') return 'Profile name';
  if (path === 'format') return 'Source format';
  if (path === 'schemaId') return 'Detected schema';
  if (path === 'delimiter') return 'Delimiter';
  if (path === 'headerSignature') return 'Ordered header identity';
  if (path.startsWith('mapping.')) return `${path.slice(8)} mapping`;
  if (path === 'options.dateOrder') return 'Date order';
  if (path === 'options.signMode') return 'Amount-sign interpretation';
  if (path === 'options.accountLabel') return 'Destination account label';
  if (path === 'options.accountMode') return 'Account handling';
  if (path === 'options.useSourceCategory') return 'Source-category preference';
  return path;
}

function displayValue(path, value) {
  if (path === 'options.accountLabel') return clean(value) ? '[local label changed]' : '[no local label]';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  return clean(value) || 'Not set';
}

function normalizedProfile(value) {
  const portable = portableProfile(value);
  if (!portable) throw new Error('A valid profile definition is required for revision comparison.');
  return portable;
}

export function profileRevisionChanges(beforeValue, afterValue) {
  const before = normalizedProfile(beforeValue);
  const after = normalizedProfile(afterValue);
  const changes = [];
  const add = (path, left, right) => {
    if (left === right) return;
    changes.push({
      path,
      label: labelForPath(path),
      before: displayValue(path, left),
      after: displayValue(path, right),
      sensitive: path === 'options.accountLabel'
    });
  };
  add('name', before.name, after.name);
  add('format', before.format, after.format);
  add('schemaId', before.schemaId, after.schemaId);
  add('delimiter', before.delimiter, after.delimiter);
  add('headerSignature', before.headerSignature, after.headerSignature);
  PROFILE_FIELDS.forEach((field) => add(`mapping.${field}`, before.mapping[field] || '', after.mapping[field] || ''));
  OPTION_FIELDS.forEach((field) => add(`options.${field}`, before.options[field], after.options[field]));
  return changes;
}

export function createProfileRevisionSummary(beforeValue, afterValue, {
  source = 'local-update',
  now = new Date().toISOString(),
  revisionId = ''
} = {}) {
  if (!ALLOWED_SOURCES.has(source)) throw new Error('Unsupported profile revision source.');
  const beforeProfiles = sanitizeStoredProfiles({ profiles: [beforeValue] });
  const afterProfiles = sanitizeStoredProfiles({ profiles: [afterValue] });
  const before = beforeProfiles[0];
  const after = afterProfiles[0];
  if (!before || !after || before.profileId !== after.profileId) {
    throw new Error('Profile revisions must preserve one local profile identity.');
  }
  const changes = profileRevisionChanges(before, after);
  if (!changes.length) throw new Error('No profile mapping or normalization changes are available to record.');
  const id = clean(revisionId) || `revision_${fnv1a(`${before.profileId}|${now}|${profileDefinitionKey(after)}`)}`;
  return {
    revisionId: id,
    profileId: before.profileId,
    profileName: after.name,
    source,
    changedAt: now,
    beforeDefinition: profileDefinitionKey(before),
    afterDefinition: profileDefinitionKey(after),
    identity: profileIdentityKey(after),
    changeCount: changes.length,
    changes: changes.map((change) => ({
      path: change.path,
      label: change.label,
      before: change.before,
      after: change.after,
      sensitiveValueStored: false
    }))
  };
}

export function sanitizeRevisionHistory(value) {
  const revisions = Array.isArray(value?.revisions) ? value.revisions : [];
  const valid = revisions.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => ({
      revisionId: clean(entry.revisionId).slice(0, 100),
      profileId: clean(entry.profileId).slice(0, 120),
      profileName: clean(entry.profileName).slice(0, 80),
      source: ALLOWED_SOURCES.has(clean(entry.source)) ? clean(entry.source) : '',
      changedAt: clean(entry.changedAt).slice(0, 40),
      beforeDefinition: clean(entry.beforeDefinition).slice(0, 40),
      afterDefinition: clean(entry.afterDefinition).slice(0, 40),
      identity: clean(entry.identity).slice(0, 240),
      changeCount: Math.max(0, Number(entry.changeCount) || 0),
      changes: (Array.isArray(entry.changes) ? entry.changes : []).slice(0, 24).map((change) => ({
        path: clean(change?.path).slice(0, 80),
        label: clean(change?.label).slice(0, 100),
        before: clean(change?.before).slice(0, 120),
        after: clean(change?.after).slice(0, 120),
        sensitiveValueStored: false
      })).filter((change) => change.path && change.label)
    }))
    .filter((entry) => entry.revisionId && entry.profileId && entry.source && entry.changedAt
      && /^fnv1a-[0-9a-f]{8}$/.test(entry.beforeDefinition)
      && /^fnv1a-[0-9a-f]{8}$/.test(entry.afterDefinition));
  const perProfile = new Map();
  const output = [];
  for (const entry of valid) {
    const count = perProfile.get(entry.profileId) || 0;
    if (count >= MAX_REVISIONS_PER_PROFILE) continue;
    perProfile.set(entry.profileId, count + 1);
    output.push(entry);
    if (output.length >= MAX_PROFILE_REVISIONS) break;
  }
  return output;
}

export function appendRevisionHistory(current, summary) {
  const existing = sanitizeRevisionHistory(current);
  return sanitizeRevisionHistory({ revisions: [summary, ...existing.filter((entry) => entry.revisionId !== summary.revisionId)] });
}

function mappingSummary(state) {
  const mapping = state?.options?.mapping || {};
  return Object.fromEntries(PROFILE_FIELDS.map((field) => [field, clean(mapping[field])]).filter(([, header]) => header));
}

function validationSummary(state) {
  const mapping = state?.options?.mapping || {};
  const errors = Array.isArray(state?.normalization?.errors) ? state.normalization.errors.length : 0;
  const warnings = Array.isArray(state?.normalization?.warnings) ? state.normalization.warnings.length : 0;
  const required = {
    date: Boolean(mapping.date),
    description: Boolean(mapping.description || mapping.memo),
    amount: Boolean(mapping.amount || mapping.debit || mapping.credit),
    amountDirection: Boolean(mapping.debit || mapping.credit || clean(state?.options?.signMode))
  };
  return {
    required,
    requiredComplete: Object.values(required).every(Boolean),
    normalizationErrorCount: errors,
    normalizationWarningCount: warnings,
    normalizedRowCount: Array.isArray(state?.normalization?.transactions) ? state.normalization.transactions.length : 0
  };
}

function coverageSummary(state) {
  const coverage = state?.analysis?.coverage || {};
  return {
    incomingEarliest: clean(coverage.incomingEarliest) || 'Not available',
    incomingLatest: clean(coverage.incomingLatest) || 'Not available',
    existingEarliest: clean(coverage.existingEarliest) || 'Not available',
    existingLatest: clean(coverage.existingLatest) || 'Not available',
    overlap: clean(coverage.overlap) || 'Not prepared',
    missingIncomingMonths: (Array.isArray(coverage.missingIncomingMonths) ? coverage.missingIncomingMonths : [])
      .map(clean).filter((value) => /^\d{4}-\d{2}$/.test(value)).slice(0, 60)
  };
}

function duplicateSummary(state) {
  const counts = state?.counts || {};
  return {
    exact: Math.max(0, Number(counts.exact) || 0),
    fuzzy: Math.max(0, Number(counts.fuzzy) || 0),
    fresh: Math.max(0, Number(counts.fresh) || 0),
    fuzzyKeep: Math.max(0, Number(counts.fuzzyKeep) || 0),
    fuzzySkip: Math.max(0, Number(counts.fuzzySkip) || 0),
    unresolved: Math.max(0, Number(counts.unresolved) || 0),
    wouldInsert: Math.max(0, Number(counts.inserted) || 0),
    wouldSkip: Math.max(0, Number(counts.skipped) || 0)
  };
}

export function buildDryRunDiagnostic(state, {
  profileSnapshot = null,
  now = new Date().toISOString()
} = {}) {
  if (!state?.inspection) throw new Error('Inspect a supported bank export before preparing a dry-run diagnostic.');
  const inspection = state.inspection;
  const schema = inspection.schema || {};
  const profiles = sanitizeStoredProfiles({ profiles: profileSnapshot?.profiles || [] });
  const applied = profiles.find((profile) => profile.profileId === profileSnapshot?.appliedProfileId) || null;
  const diagnostic = {
    kind: DRY_RUN_DIAGNOSTIC_KIND,
    version: DRY_RUN_DIAGNOSTIC_VERSION,
    generator: 'Gringotts Budget Vault v119',
    createdAt: now,
    source: {
      format: clean(inspection.format),
      schemaId: clean(schema.id || 'unknown'),
      schemaLabel: clean(schema.label || 'Unknown schema'),
      delimiter: clean(inspection.delimiter),
      encoding: clean(state.encoding),
      headerCount: Array.isArray(inspection.headers) ? inspection.headers.length : 0,
      inspectedRowCount: Math.max(0, Number(inspection.rowCount) || (Array.isArray(inspection.records) ? inspection.records.length : 0))
    },
    profile: {
      applied: Boolean(applied),
      exactCompatibleDefinition: applied ? profileDefinitionKey(applied) : '',
      localProfileNameIncluded: false,
      localProfileIdIncluded: false
    },
    mapping: mappingSummary(state),
    options: {
      dateOrder: clean(state.options?.dateOrder) || 'auto',
      signMode: clean(state.options?.signMode),
      accountMode: clean(state.options?.accountMode) || 'label',
      useSourceCategory: state.options?.useSourceCategory === true,
      destinationAccountLabelIncluded: false
    },
    validation: validationSummary(state),
    coverage: coverageSummary(state),
    duplicates: duplicateSummary(state),
    readiness: {
      inspected: state.inspected === true,
      normalized: state.normalized === true,
      duplicateReviewPrepared: Boolean(state.analysis),
      acknowledged: state.acknowledged === true,
      backupPrepared: state.backupPrepared === true,
      transactionWriteReady: state.ready === true,
      transactionWritePerformed: false
    },
    dataBoundary: {
      transactionRowsIncluded: false,
      sourceFileNameIncluded: false,
      sourceFingerprintIncluded: false,
      accountIdentifiersIncluded: false,
      destinationAccountLabelIncluded: false,
      balancesIncluded: false,
      vaultContentsIncluded: false,
      credentialsIncluded: false
    }
  };
  assertDryRunDiagnosticSafe(diagnostic);
  return diagnostic;
}

export function dryRunDiagnosticSignature(state, profileSnapshot = null) {
  if (!state?.inspection) return '';
  return `fnv1a-${fnv1a(JSON.stringify({
    format: state.inspection.format,
    schema: state.inspection.schema?.id,
    delimiter: state.inspection.delimiter,
    headers: state.inspection.headers,
    mapping: mappingSummary(state),
    options: {
      dateOrder: state.options?.dateOrder,
      signMode: state.options?.signMode,
      accountMode: state.options?.accountMode,
      useSourceCategory: state.options?.useSourceCategory === true
    },
    counts: duplicateSummary(state),
    validation: validationSummary(state),
    appliedDefinition: (() => {
      const profiles = sanitizeStoredProfiles({ profiles: profileSnapshot?.profiles || [] });
      const applied = profiles.find((profile) => profile.profileId === profileSnapshot?.appliedProfileId);
      return applied ? profileDefinitionKey(applied) : '';
    })()
  }))}`;
}

export function assertDryRunDiagnosticSafe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Dry-run diagnostic must be an object.');
  if (value.kind !== DRY_RUN_DIAGNOSTIC_KIND || Number(value.version) !== DRY_RUN_DIAGNOSTIC_VERSION) {
    throw new Error('Dry-run diagnostic kind or version is invalid.');
  }
  const serialized = JSON.stringify(value).toLowerCase();
  const forbidden = [
    'transactions', 'records', 'directtransactions', 'filename', 'sourcefingerprint', 'accountlabel',
    'accountnumber', 'fullaccountnumber', 'credential', 'password', 'token', 'vaultcontents', 'balances'
  ];
  const hit = forbidden.find((term) => serialized.includes(`\"${term}\":`));
  if (hit) throw new Error(`Dry-run diagnostic contains forbidden field: ${hit}.`);
  if (value.dataBoundary?.transactionRowsIncluded !== false
    || value.dataBoundary?.sourceFileNameIncluded !== false
    || value.dataBoundary?.sourceFingerprintIncluded !== false
    || value.dataBoundary?.accountIdentifiersIncluded !== false
    || value.dataBoundary?.destinationAccountLabelIncluded !== false
    || value.dataBoundary?.vaultContentsIncluded !== false) {
    throw new Error('Dry-run diagnostic data-boundary declaration is incomplete.');
  }
  return true;
}
