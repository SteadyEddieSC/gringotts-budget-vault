import {
  AUTHORITATIVE_VAULT_KEY,
  PORTABLE_VAULT_CANONICALIZATION,
  PORTABLE_VAULT_FORMAT,
  PORTABLE_VAULT_FORMAT_VERSION,
  PORTABLE_VAULT_INTEGRITY_ALGORITHM,
  PORTABLE_VAULT_SCHEMA_VERSION,
  isRecord,
  type AuthoritativeVault,
  type JsonObject,
  type JsonValue,
  type PortableVaultCreateOptions,
  type PortableVaultManifest,
  type PortableVaultPackage,
  type PortableVaultValidationResult
} from './contracts.js';

const HEX_DIGEST = /^[a-f0-9]{64}$/;
const RELEASE = /^v\d+$/;

function fail(message: string): never {
  throw new Error(`Portable vault rejected: ${message}`);
}

function asJsonValue(value: unknown, path = '$'): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`${path} contains a non-finite number`);
    return value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => asJsonValue(entry, `${path}[${index}]`));
  if (!isRecord(value)) fail(`${path} is not JSON-compatible`);
  const result: JsonObject = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] === undefined) fail(`${path}.${key} is undefined`);
    result[key] = asJsonValue(value[key], `${path}.${key}`);
  }
  return result;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(asJsonValue(value));
}

function cloneVault(value: unknown): AuthoritativeVault {
  const normalized = asJsonValue(value, '$.vault');
  if (!isRecord(normalized)) fail('vault must be an object');
  if (!Array.isArray(normalized.transactions)) fail('vault.transactions must be an array');
  if (normalized.transactions.length < 1) fail('empty transaction arrays cannot become portable vaults');
  return normalized as AuthoritativeVault;
}

function textEncoder(): TextEncoder {
  if (typeof TextEncoder !== 'function') fail('TextEncoder is unavailable');
  return new TextEncoder();
}

async function sha256(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) fail('Web Crypto SHA-256 is unavailable');
  const digest = await subtle.digest(PORTABLE_VAULT_INTEGRITY_ALGORITHM, textEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isoDate(value: string | undefined): string {
  const candidate = value || new Date().toISOString();
  const parsed = new Date(candidate);
  if (!candidate || Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== candidate) fail('createdAt must be an exact ISO timestamp');
  return candidate;
}

function sourceRelease(value: string | undefined): string {
  const candidate = value || 'v128';
  if (!RELEASE.test(candidate)) fail('sourceRelease must use the v<number> form');
  return candidate;
}

function manifestObject(value: unknown): PortableVaultManifest {
  if (!isRecord(value)) fail('manifest must be an object');
  if (value.format !== PORTABLE_VAULT_FORMAT) fail('unsupported package format');
  if (value.formatVersion !== PORTABLE_VAULT_FORMAT_VERSION) fail('unsupported format version');
  if (value.schemaVersion !== PORTABLE_VAULT_SCHEMA_VERSION) fail('unsupported schema version');
  if (value.destinationKey !== AUTHORITATIVE_VAULT_KEY) fail('destination must remain the authoritative vault key');
  if (value.payloadEncoding !== 'json') fail('unsupported payload encoding');
  if (typeof value.createdAt !== 'string') fail('manifest createdAt is required');
  isoDate(value.createdAt);
  if (typeof value.sourceRelease !== 'string' || !RELEASE.test(value.sourceRelease)) fail('manifest sourceRelease is invalid');
  if (typeof value.transactionCount !== 'number' || !Number.isSafeInteger(value.transactionCount) || value.transactionCount < 1) fail('manifest transactionCount must be a positive integer');
  if (!isRecord(value.integrity)) fail('manifest integrity is required');
  if (value.integrity.algorithm !== PORTABLE_VAULT_INTEGRITY_ALGORITHM) fail('unsupported integrity algorithm');
  if (value.integrity.canonicalization !== PORTABLE_VAULT_CANONICALIZATION) fail('unsupported canonicalization');
  if (typeof value.integrity.digest !== 'string' || !HEX_DIGEST.test(value.integrity.digest)) fail('integrity digest must be lowercase SHA-256 hex');
  if (!isRecord(value.privacy)) fail('privacy boundary is required');
  if (value.privacy.deviceLocal !== true || value.privacy.networkRequired !== false || value.privacy.cloudStored !== false) fail('privacy boundary cannot permit network or cloud storage');
  if (value.privacy.encryption !== 'none-foundation-only') fail('unexpected encryption declaration');
  return value as unknown as PortableVaultManifest;
}

export async function createPortableVaultPackage(
  vaultInput: unknown,
  options: PortableVaultCreateOptions = {}
): Promise<PortableVaultPackage> {
  if ((options.destinationKey || AUTHORITATIVE_VAULT_KEY) !== AUTHORITATIVE_VAULT_KEY) fail('non-authoritative destination keys are forbidden');
  const vault = cloneVault(vaultInput);
  const canonicalVault = canonicalJson(vault);
  const digest = await sha256(canonicalVault);
  return {
    manifest: {
      format: PORTABLE_VAULT_FORMAT,
      formatVersion: PORTABLE_VAULT_FORMAT_VERSION,
      schemaVersion: PORTABLE_VAULT_SCHEMA_VERSION,
      createdAt: isoDate(options.createdAt),
      sourceRelease: sourceRelease(options.sourceRelease),
      destinationKey: AUTHORITATIVE_VAULT_KEY,
      transactionCount: vault.transactions.length,
      payloadEncoding: 'json',
      integrity: {
        algorithm: PORTABLE_VAULT_INTEGRITY_ALGORITHM,
        canonicalization: PORTABLE_VAULT_CANONICALIZATION,
        digest
      },
      privacy: {
        deviceLocal: true,
        networkRequired: false,
        cloudStored: false,
        encryption: 'none-foundation-only'
      }
    },
    vault
  };
}

export function serializePortableVaultPackage(value: PortableVaultPackage): string {
  return `${canonicalJson(value)}\n`;
}

export async function validatePortableVaultPackage(value: unknown): Promise<PortableVaultValidationResult> {
  if (!isRecord(value)) fail('package must be an object');
  const manifest = manifestObject(value.manifest);
  const vault = cloneVault(value.vault);
  if (manifest.transactionCount !== vault.transactions.length) fail('transaction count does not match the payload');
  const canonicalVault = canonicalJson(vault);
  const digest = await sha256(canonicalVault);
  if (digest !== manifest.integrity.digest) fail('integrity verification failed');
  return { valid: true, package: { manifest, vault }, canonicalVault };
}

export async function parsePortableVaultPackage(text: string): Promise<PortableVaultValidationResult> {
  if (typeof text !== 'string' || !text.trim()) fail('package text is empty');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('package text is not valid JSON');
  }
  return validatePortableVaultPackage(parsed);
}

export function portableVaultFilename(createdAt = new Date().toISOString()): string {
  const safe = isoDate(createdAt).replace(/[:.]/g, '-');
  return `Gringotts_Vault_${safe}.gringotts`;
}
