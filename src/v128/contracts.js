export const AUTHORITATIVE_VAULT_KEY = 'gringottsBudgetVault.latest';
export const PORTABLE_VAULT_FORMAT = 'gringotts-portable-vault';
export const PORTABLE_VAULT_FORMAT_VERSION = 1;
export const PORTABLE_VAULT_SCHEMA_VERSION = 1;
export const PORTABLE_VAULT_INTEGRITY_ALGORITHM = 'SHA-256';
export const PORTABLE_VAULT_CANONICALIZATION = 'json-sorted-v1';

export function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
