import { MAX_IMPORT_PROFILES, sanitizeStoredProfiles } from '../v117/profile-model.js';
import { detectInstitutionPattern } from './institution-patterns.js';

export const PROFILE_BUNDLE_KIND = 'gringotts-import-profile-bundle';
export const PROFILE_BUNDLE_VERSION = 1;
export const MAX_PROFILE_BUNDLE_BYTES = 256 * 1024;

const PROFILE_FIELDS = [
  'date', 'description', 'amount', 'debit', 'credit', 'status', 'account', 'memo', 'id', 'category', 'type'
];
const OPTION_FIELDS = ['dateOrder', 'signMode', 'accountLabel', 'accountMode', 'useSourceCategory'];
const FORBIDDEN_KEYS = new Set([
  'transactions', 'records', 'directtransactions', 'sourcefingerprint', 'sourcefilename', 'filename',
  'filecontent', 'rawrows', 'rows', 'balances', 'balance', 'credentials', 'credential', 'password',
  'token', 'accountnumber', 'fullaccountnumber'
]);

const clean = (value) => String(value ?? '').trim();
const normalizedName = (value) => clean(value).toLowerCase().replace(/\s+/g, ' ');

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function assertNoForbiddenKeys(value, path = 'bundle') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  Object.entries(value).forEach(([key, child]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (FORBIDDEN_KEYS.has(normalized)) {
      throw new Error(`Profile bundle rejected: ${path}.${key} is not permitted in a metadata-only profile file.`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  });
}

function sanitizePortableProfile(value) {
  const [stored] = sanitizeStoredProfiles({ profiles: [{
    ...value,
    profileId: clean(value?.profileId) || 'portable_profile',
    createdAt: '',
    updatedAt: ''
  }] });
  if (!stored) return null;
  return {
    name: stored.name,
    format: stored.format,
    schemaId: stored.schemaId,
    schemaLabel: stored.schemaLabel,
    delimiter: stored.delimiter,
    headerSignature: stored.headerSignature,
    headerCount: stored.headerCount,
    mapping: { ...stored.mapping },
    options: { ...stored.options }
  };
}

function stableDefinition(profile, { includeName = true } = {}) {
  const portable = sanitizePortableProfile(profile);
  if (!portable) return '';
  return JSON.stringify({
    ...(includeName ? { name: normalizedName(portable.name) } : {}),
    format: portable.format,
    schemaId: portable.schemaId,
    delimiter: portable.delimiter,
    headerSignature: portable.headerSignature,
    headerCount: portable.headerCount,
    mapping: PROFILE_FIELDS.map((field) => [field, portable.mapping[field] || '']),
    options: OPTION_FIELDS.map((field) => [field, portable.options[field]])
  });
}

export function profileIdentityKey(profile) {
  const portable = sanitizePortableProfile(profile);
  if (!portable) return '';
  return [portable.format, portable.schemaId, portable.delimiter, portable.headerSignature].join('|');
}

export function profileDefinitionKey(profile) {
  const stable = stableDefinition(profile, { includeName: false });
  return stable ? `fnv1a-${fnv1a(stable)}` : '';
}

export function portableProfile(profile) {
  return sanitizePortableProfile(profile);
}

export function exportProfileBundle(profiles, { now = new Date().toISOString() } = {}) {
  const portableProfiles = sanitizeStoredProfiles({ profiles })
    .map(sanitizePortableProfile)
    .filter(Boolean)
    .slice(0, MAX_IMPORT_PROFILES);
  return {
    kind: PROFILE_BUNDLE_KIND,
    version: PROFILE_BUNDLE_VERSION,
    generator: 'Gringotts Budget Vault v118',
    exportedAt: now,
    profileCount: portableProfiles.length,
    profiles: portableProfiles
  };
}

export function parseProfileBundle(value) {
  assertNoForbiddenKeys(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Profile bundle must be a JSON object.');
  if (value.kind !== PROFILE_BUNDLE_KIND) throw new Error('This JSON file is not a Gringotts import-profile bundle.');
  if (Number(value.version) !== PROFILE_BUNDLE_VERSION) throw new Error(`Unsupported profile-bundle version: ${clean(value.version) || 'missing'}.`);
  if (!Array.isArray(value.profiles)) throw new Error('Profile bundle does not contain a profiles array.');
  if (value.profiles.length > MAX_IMPORT_PROFILES) throw new Error(`Profile bundle exceeds the ${MAX_IMPORT_PROFILES}-profile limit.`);
  const profiles = value.profiles.map(sanitizePortableProfile).filter(Boolean);
  if (!profiles.length && value.profiles.length) throw new Error('Profile bundle contains no valid sanitized profile definitions.');
  if (profiles.length !== value.profiles.length) throw new Error('Profile bundle contains one or more invalid profile definitions.');
  return {
    kind: PROFILE_BUNDLE_KIND,
    version: PROFILE_BUNDLE_VERSION,
    generator: clean(value.generator),
    exportedAt: clean(value.exportedAt),
    profiles
  };
}

export function profileDifferences(left, right) {
  const a = sanitizePortableProfile(left);
  const b = sanitizePortableProfile(right);
  if (!a || !b) return ['A valid profile definition is unavailable for comparison.'];
  const differences = [];
  if (normalizedName(a.name) !== normalizedName(b.name)) differences.push(`Name differs: “${a.name}” vs “${b.name}”.`);
  if (a.format !== b.format) differences.push(`Format differs: ${a.format} vs ${b.format}.`);
  if (a.schemaId !== b.schemaId) differences.push(`Schema differs: ${a.schemaId} vs ${b.schemaId}.`);
  if (a.delimiter !== b.delimiter) differences.push('Delimiter differs.');
  if (a.headerSignature !== b.headerSignature) differences.push('Ordered header signature differs.');
  PROFILE_FIELDS.forEach((field) => {
    if ((a.mapping[field] || '') !== (b.mapping[field] || '')) differences.push(`Mapped ${field} field differs.`);
  });
  OPTION_FIELDS.forEach((field) => {
    if (a.options[field] !== b.options[field]) differences.push(`${field} option differs.`);
  });
  return differences.length ? differences : ['Definitions are identical.'];
}

function uniqueName(base, usedNames) {
  const source = clean(base).slice(0, 80) || 'Imported profile';
  if (!usedNames.has(normalizedName(source))) return source;
  for (let index = 2; index < 100; index += 1) {
    const suffix = ` (${index})`;
    const candidate = `${source.slice(0, 80 - suffix.length)}${suffix}`;
    if (!usedNames.has(normalizedName(candidate))) return candidate;
  }
  throw new Error('A unique imported profile name could not be generated.');
}

export function inspectProfileBundle(value, existingProfiles = []) {
  const bundle = parseProfileBundle(value);
  const existing = sanitizeStoredProfiles({ profiles: existingProfiles });
  const usedNames = new Set(existing.map((profile) => normalizedName(profile.name)));
  const items = bundle.profiles.map((incoming, index) => {
    const identityKey = profileIdentityKey(incoming);
    const definitionKey = profileDefinitionKey(incoming);
    const exact = existing.find((profile) => normalizedName(profile.name) === normalizedName(incoming.name)
      && profileDefinitionKey(profile) === definitionKey);
    const sameDefinition = existing.filter((profile) => profileDefinitionKey(profile) === definitionKey);
    const identityMatches = existing.filter((profile) => profileIdentityKey(profile) === identityKey);
    const nameMatches = existing.filter((profile) => normalizedName(profile.name) === normalizedName(incoming.name));
    let status = 'new';
    let explanation = 'No saved profile has this name or exact source identity.';
    if (exact) {
      status = 'exact';
      explanation = `An identical saved profile already exists as “${exact.name}”.`;
    } else if (sameDefinition.length) {
      status = 'same-definition';
      explanation = `The same mapping and options already exist as “${sameDefinition[0].name}”.`;
    } else if (identityMatches.length) {
      status = 'identity-conflict';
      explanation = `The source identity matches ${identityMatches.length} saved profile${identityMatches.length === 1 ? '' : 's'}, but mappings or options differ.`;
    } else if (nameMatches.length) {
      status = 'name-conflict';
      explanation = `The name “${incoming.name}” is already used for a different source identity.`;
    }
    const suggestedName = uniqueName(incoming.name, usedNames);
    usedNames.add(normalizedName(suggestedName));
    const comparisonTarget = exact || sameDefinition[0] || identityMatches[0] || nameMatches[0] || null;
    return {
      itemId: `portable_${index + 1}_${fnv1a(stableDefinition(incoming))}`,
      incoming,
      status,
      explanation,
      suggestedName: status === 'new' ? incoming.name : suggestedName,
      defaultAction: status === 'new' ? 'add' : 'skip',
      replaceTargets: identityMatches.map((profile) => ({ profileId: profile.profileId, name: profile.name })),
      differences: comparisonTarget ? profileDifferences(comparisonTarget, incoming) : ['No saved profile has this source identity.']
    };
  });
  return {
    kind: bundle.kind,
    version: bundle.version,
    generator: bundle.generator,
    exportedAt: bundle.exportedAt,
    count: items.length,
    items
  };
}

function localProfileFromPortable(incoming, { profileId, name, createdAt, updatedAt }) {
  const portable = sanitizePortableProfile({ ...incoming, name });
  if (!portable) throw new Error('The reviewed portable profile is invalid.');
  return {
    profileId,
    ...portable,
    createdAt,
    updatedAt
  };
}

export function applyProfileImportPlan(existingProfiles, preview, decisions, {
  now = new Date().toISOString(),
  idFactory = (index) => `profile_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`
} = {}) {
  const existing = sanitizeStoredProfiles({ profiles: existingProfiles });
  const decisionMap = new Map((decisions || []).map((decision) => [clean(decision.itemId), decision]));
  const output = [...existing];
  const counts = { added: 0, replaced: 0, skipped: 0 };
  const items = Array.isArray(preview?.items) ? preview.items : [];
  items.forEach((item, index) => {
    const decision = decisionMap.get(item.itemId);
    if (!decision || !['add', 'replace', 'skip'].includes(decision.action)) {
      throw new Error(`Choose Add, Replace, or Skip for “${item.incoming?.name || `profile ${index + 1}`}”.`);
    }
    if (decision.action === 'skip') {
      counts.skipped += 1;
      return;
    }
    const reviewedName = clean(decision.name || item.suggestedName || item.incoming?.name).slice(0, 80);
    if (!reviewedName) throw new Error('Every added or replaced profile requires a name.');
    if (decision.action === 'add') {
      if (output.some((profile) => normalizedName(profile.name) === normalizedName(reviewedName))) {
        throw new Error(`Profile name “${reviewedName}” is already in use. Choose a unique name before adding it.`);
      }
      output.unshift(localProfileFromPortable(item.incoming, {
        profileId: idFactory(index), name: reviewedName, createdAt: now, updatedAt: now
      }));
      counts.added += 1;
      return;
    }
    const targetId = clean(decision.targetProfileId);
    if (!item.replaceTargets?.some((target) => target.profileId === targetId)) {
      throw new Error(`Replace an identity-matched profile only; choose a compatible saved target for “${reviewedName}”.`);
    }
    const targetIndex = output.findIndex((profile) => profile.profileId === targetId);
    if (targetIndex < 0) throw new Error('The selected replacement target is no longer available.');
    if (output.some((profile, profileIndex) => profileIndex !== targetIndex
      && normalizedName(profile.name) === normalizedName(reviewedName))) {
      throw new Error(`Profile name “${reviewedName}” is already in use.`);
    }
    const target = output[targetIndex];
    output[targetIndex] = localProfileFromPortable(item.incoming, {
      profileId: target.profileId,
      name: reviewedName,
      createdAt: target.createdAt || now,
      updatedAt: now
    });
    counts.replaced += 1;
  });
  if (output.length > MAX_IMPORT_PROFILES) {
    throw new Error(`Reviewed import would exceed the ${MAX_IMPORT_PROFILES}-profile storage limit.`);
  }
  return { profiles: sanitizeStoredProfiles({ profiles: output }), counts };
}

export function profileLibrary(profiles) {
  return sanitizeStoredProfiles({ profiles })
    .map((profile) => ({
      profileId: profile.profileId,
      name: profile.name,
      accountLabel: profile.options.accountLabel,
      schema: detectInstitutionPattern(profile).label,
      identity: `${profile.format.toUpperCase()} · ${profile.headerSignature}`,
      updatedAt: profile.updatedAt
    }))
    .sort((a, b) => a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name));
}
