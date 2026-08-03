export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export const AUTHORITATIVE_VAULT_KEY = 'gringottsBudgetVault.latest' as const;
export const PORTABLE_VAULT_FORMAT = 'gringotts-portable-vault' as const;
export const PORTABLE_VAULT_FORMAT_VERSION = 1 as const;
export const PORTABLE_VAULT_SCHEMA_VERSION = 1 as const;
export const PORTABLE_VAULT_INTEGRITY_ALGORITHM = 'SHA-256' as const;
export const PORTABLE_VAULT_CANONICALIZATION = 'json-sorted-v1' as const;

export interface TransactionRecord extends JsonObject {
  id?: JsonValue;
  date?: JsonValue;
  name?: JsonValue;
  amount?: JsonValue;
  type?: JsonValue;
  category?: JsonValue;
}

export interface AuthoritativeVault extends JsonObject {
  transactions: TransactionRecord[];
}

export interface PortableVaultIntegrity {
  algorithm: typeof PORTABLE_VAULT_INTEGRITY_ALGORITHM;
  canonicalization: typeof PORTABLE_VAULT_CANONICALIZATION;
  digest: string;
}

export interface PortableVaultPrivacyBoundary {
  deviceLocal: true;
  networkRequired: false;
  cloudStored: false;
  encryption: 'none-foundation-only';
}

export interface PortableVaultManifest {
  format: typeof PORTABLE_VAULT_FORMAT;
  formatVersion: typeof PORTABLE_VAULT_FORMAT_VERSION;
  schemaVersion: typeof PORTABLE_VAULT_SCHEMA_VERSION;
  createdAt: string;
  sourceRelease: string;
  destinationKey: typeof AUTHORITATIVE_VAULT_KEY;
  transactionCount: number;
  payloadEncoding: 'json';
  integrity: PortableVaultIntegrity;
  privacy: PortableVaultPrivacyBoundary;
}

export interface PortableVaultPackage {
  manifest: PortableVaultManifest;
  vault: AuthoritativeVault;
}

export interface PortableVaultCreateOptions {
  createdAt?: string;
  sourceRelease?: string;
  destinationKey?: typeof AUTHORITATIVE_VAULT_KEY;
}

export interface PortableVaultValidationResult {
  valid: true;
  package: PortableVaultPackage;
  canonicalVault: string;
}

export interface BackupReceipt {
  destination: 'device-file' | 'google-drive' | 'onedrive' | 'dropbox' | 'webdav';
  fileName: string;
  savedAt: string;
  transactionCount: number;
  digest: string;
  verified: boolean;
}

export interface VaultStorageAdapter {
  readonly kind: BackupReceipt['destination'];
  saveEncryptedCopy(data: Uint8Array): Promise<BackupReceipt>;
  readBack(receipt: BackupReceipt): Promise<Uint8Array>;
  disconnect?(): Promise<void>;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
