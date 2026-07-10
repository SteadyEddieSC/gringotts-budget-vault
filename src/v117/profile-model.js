export const IMPORT_PROFILES_KEY = 'gringottsImportProfiles.v1';
export const MAX_IMPORT_PROFILES = 24;

const PROFILE_FIELDS = [
  'date', 'description', 'amount', 'debit', 'credit', 'status', 'account', 'memo', 'id', 'category', 'type'
];
const DATE_ORDERS = new Set(['auto', 'mdy', 'dmy']);
const SIGN_MODES = new Set(['', 'bank', 'vault', 'type', 'separate']);
const ACCOUNT_MODES = new Set(['label', 'mapped-masked']);
const clean = (value) => String(value ?? '').trim();
const normalizeHeader = (value) => clean(value).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function fnv1a(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function inspectionIdentity(inspection) {
  if (!inspection || typeof inspection !== 'object') return null;
  const format = clean(inspection.format).toLowerCase();
  const schemaId = clean(inspection.schema?.id || 'unknown');
  const delimiter = format === 'delimited' ? clean(inspection.delimiter || '') : '';
  const normalizedHeaders = Array.isArray(inspection.headers)
    ? inspection.headers.map(normalizeHeader)
    : [];
  const signatureSource = [format, schemaId, delimiter, ...normalizedHeaders].join('|');
  return {
    format,
    schemaId,
    schemaLabel: clean(inspection.schema?.label || 'Unknown schema'),
    delimiter,
    headerSignature: `fnv1a-${fnv1a(signatureSource)}`,
    headerCount: normalizedHeaders.length
  };
}

function sanitizeMapping(mapping, headers = []) {
  const allowed = new Set(headers.map(clean));
  const result = {};
  PROFILE_FIELDS.forEach((field) => {
    const header = clean(mapping?.[field]);
    if (!header || allowed.has(header)) result[field] = header;
  });
  return result;
}

function sanitizeOptions(options = {}) {
  const dateOrder = clean(options.dateOrder).toLowerCase();
  const signMode = clean(options.signMode).toLowerCase();
  const accountMode = clean(options.accountMode).toLowerCase();
  return {
    dateOrder: DATE_ORDERS.has(dateOrder) ? dateOrder : 'auto',
    signMode: SIGN_MODES.has(signMode) ? signMode : '',
    accountLabel: clean(options.accountLabel).slice(0, 100) || 'Imported account',
    accountMode: ACCOUNT_MODES.has(accountMode) ? accountMode : 'label',
    useSourceCategory: options.useSourceCategory === true
  };
}

export function profileFromSession({ profileId = '', name = '', inspection, options = {}, existingProfile = null, now = new Date().toISOString() } = {}) {
  const identity = inspectionIdentity(inspection);
  if (!identity) throw new Error('A supported inspected export is required before saving a mapping profile.');
  if (identity.format === 'json') throw new Error('Gringotts JSON imports preserve source fields and do not use mapping profiles.');
  const headers = Array.isArray(inspection.headers) ? inspection.headers : [];
  const sanitizedName = clean(name).slice(0, 80);
  if (!sanitizedName) throw new Error('Enter a profile name before saving.');
  const id = clean(profileId) || `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    profileId: id,
    name: sanitizedName,
    ...identity,
    mapping: identity.format === 'delimited' ? sanitizeMapping(options.mapping, headers) : {},
    options: sanitizeOptions(options),
    createdAt: existingProfile?.createdAt || now,
    updatedAt: now
  };
}

export function sanitizeStoredProfiles(value) {
  const profiles = Array.isArray(value?.profiles) ? value.profiles : [];
  return profiles.filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile))
    .map((profile) => ({
      profileId: clean(profile.profileId),
      name: clean(profile.name).slice(0, 80),
      format: clean(profile.format).toLowerCase(),
      schemaId: clean(profile.schemaId),
      schemaLabel: clean(profile.schemaLabel),
      delimiter: clean(profile.delimiter),
      headerSignature: clean(profile.headerSignature),
      headerCount: Number(profile.headerCount) || 0,
      mapping: sanitizeMapping(profile.mapping),
      options: sanitizeOptions(profile.options),
      createdAt: clean(profile.createdAt),
      updatedAt: clean(profile.updatedAt)
    }))
    .filter((profile) => profile.profileId && profile.name && profile.format && profile.schemaId && profile.headerSignature)
    .slice(0, MAX_IMPORT_PROFILES);
}

export function compatibility(profile, inspection) {
  const identity = inspectionIdentity(inspection);
  if (!identity || !profile) return { compatible: false, reasons: ['No inspected export is available.'] };
  const reasons = [];
  if (profile.format !== identity.format) reasons.push(`Format changed from ${profile.format || 'unknown'} to ${identity.format || 'unknown'}.`);
  if (profile.schemaId !== identity.schemaId) reasons.push(`Schema changed from ${profile.schemaId || 'unknown'} to ${identity.schemaId || 'unknown'}.`);
  if (profile.delimiter !== identity.delimiter) reasons.push('Delimiter changed.');
  if (profile.headerSignature !== identity.headerSignature) reasons.push('The ordered header signature changed.');
  const headers = new Set((inspection.headers || []).map(clean));
  const missingHeaders = Object.values(profile.mapping || {}).filter(Boolean).filter((header) => !headers.has(header));
  if (missingHeaders.length) reasons.push(`Mapped header${missingHeaders.length === 1 ? '' : 's'} no longer present: ${missingHeaders.join(', ')}.`);
  if (!reasons.length) reasons.push('Format, schema, delimiter, ordered headers, and mapped fields match exactly.');
  return { compatible: reasons.length === 1 && reasons[0].startsWith('Format, schema'), reasons, identity };
}

export function compatibleProfiles(profiles, inspection) {
  return sanitizeStoredProfiles({ profiles })
    .map((profile) => ({ profile, compatibility: compatibility(profile, inspection) }))
    .filter((item) => item.compatibility.compatible)
    .map((item) => item.profile);
}

export function profileApplication(profile, inspection) {
  const result = compatibility(profile, inspection);
  if (!result.compatible) throw new Error(result.reasons.join(' '));
  return {
    profileId: profile.profileId,
    profileName: profile.name,
    mapping: { ...(profile.mapping || {}) },
    options: sanitizeOptions(profile.options),
    reason: result.reasons[0]
  };
}

export function profileSummary(profile) {
  const mappedFields = Object.entries(profile?.mapping || {}).filter(([, header]) => header);
  return {
    name: clean(profile?.name),
    identity: `${clean(profile?.format).toUpperCase()} · ${clean(profile?.schemaLabel || profile?.schemaId)} · ${clean(profile?.headerSignature)}`,
    mappings: mappedFields.map(([field, header]) => `${field}: ${header}`),
    options: [
      `Date order: ${profile?.options?.dateOrder || 'auto'}`,
      `Amount signs: ${profile?.options?.signMode || 'not selected'}`,
      `Account handling: ${profile?.options?.accountMode || 'label'}`,
      `Account label: ${profile?.options?.accountLabel || 'Imported account'}`,
      `Source categories: ${profile?.options?.useSourceCategory ? 'enabled' : 'disabled'}`
    ]
  };
}
