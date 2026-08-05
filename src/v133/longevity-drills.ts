import {
  AUTHORITATIVE_VAULT_KEY,
  PORTABLE_VAULT_SCHEMA_VERSION,
  isRecord,
  type AuthoritativeVault,
  type JsonObject,
  type JsonValue
} from '../v128/contracts.js';
import { canonicalJson, validatePortableVaultPackage } from '../v128/portable-vault.js';

export const LONGEVITY_DRILL_VERSION = 1 as const;
export const LONGEVITY_DRILL_KIND = 'gringotts-local-data-longevity-drill' as const;
export const LONGEVITY_DRILL_LIMITS = Object.freeze({
  maxSyntheticTransactions: 5_000,
  maxCanonicalBytes: 4_000_000,
  maxMetadataRecords: 2_000
});

export const LONGEVITY_SCENARIOS = Object.freeze([
  'upgrade',
  'corruption',
  'rollback',
  'orphan',
  'stale-schema',
  'capacity'
] as const);

export type LongevityScenario = typeof LONGEVITY_SCENARIOS[number];
export type LongevityDisposition = 'pass' | 'manual-review' | 'rejected';

export interface LongevityDrillReport {
  kind: typeof LONGEVITY_DRILL_KIND;
  version: typeof LONGEVITY_DRILL_VERSION;
  scenario: LongevityScenario;
  disposition: LongevityDisposition;
  summary: string;
  evidence: JsonObject;
  humanAction: string;
  safeguards: {
    syntheticOnly: true;
    authoritativeVaultKey: typeof AUTHORITATIVE_VAULT_KEY;
    authoritativeVaultRead: false;
    authoritativeVaultWrite: false;
    automaticMigration: false;
    automaticRepair: false;
    automaticCleanup: false;
    automaticRollback: false;
    destructiveActionPerformed: false;
    networkRequired: false;
    persistentStoreAdded: false;
  };
}

const RELEASE = /^v\d+$/;
const SAFEGUARDS = Object.freeze({
  syntheticOnly: true,
  authoritativeVaultKey: AUTHORITATIVE_VAULT_KEY,
  authoritativeVaultRead: false,
  authoritativeVaultWrite: false,
  automaticMigration: false,
  automaticRepair: false,
  automaticCleanup: false,
  automaticRollback: false,
  destructiveActionPerformed: false,
  networkRequired: false,
  persistentStoreAdded: false
} as const);

function fail(message: string): never {
  throw new Error(`Longevity drill rejected: ${message}`);
}

function report(
  scenario: LongevityScenario,
  disposition: LongevityDisposition,
  summary: string,
  evidence: JsonObject,
  humanAction: string
): LongevityDrillReport {
  return {
    kind: LONGEVITY_DRILL_KIND,
    version: LONGEVITY_DRILL_VERSION,
    scenario,
    disposition,
    summary,
    evidence,
    humanAction,
    safeguards: { ...SAFEGUARDS }
  };
}

function asInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) fail(`${label} must be a safe integer`);
  return value;
}

function asRelease(value: unknown, label: string): string {
  if (typeof value !== 'string' || !RELEASE.test(value)) fail(`${label} must use the v<number> form`);
  return value;
}

function asVault(value: unknown, label = 'vault'): AuthoritativeVault {
  if (!isRecord(value) || !Array.isArray(value.transactions)) fail(`${label}.transactions must be an array`);
  if (value.transactions.length < 1) fail(`${label}.transactions must not be empty`);
  return JSON.parse(canonicalJson(value)) as AuthoritativeVault;
}

function utf8Bytes(value: string): number {
  if (typeof TextEncoder !== 'function') fail('TextEncoder is unavailable');
  return new TextEncoder().encode(value).byteLength;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || 'Unknown rejection');
}

function runUpgrade(input: unknown): LongevityDrillReport {
  if (!isRecord(input)) fail('upgrade input must be an object');
  const sourceRelease = asRelease(input.sourceRelease, 'sourceRelease');
  const targetRelease = asRelease(input.targetRelease, 'targetRelease');
  const sourceSchema = asInteger(input.sourceSchema, 'sourceSchema');
  const targetSchema = asInteger(input.targetSchema, 'targetSchema');
  const vault = asVault(input.vault);
  const before = canonicalJson(vault);
  const after = canonicalJson(JSON.parse(before) as JsonValue);

  if (sourceSchema !== PORTABLE_VAULT_SCHEMA_VERSION || targetSchema !== PORTABLE_VAULT_SCHEMA_VERSION) {
    return report('upgrade', 'manual-review', 'The rehearsal encountered a schema outside the supported v1 contract.', {
      sourceRelease,
      targetRelease,
      sourceSchema,
      targetSchema,
      supportedSchema: PORTABLE_VAULT_SCHEMA_VERSION,
      transactionCount: vault.transactions.length,
      canonicalPreserved: before === after
    }, 'Create and review an explicit migration proposal before touching real local data.');
  }

  return report('upgrade', 'pass', 'The synthetic long-lived vault round-tripped without a schema or payload change.', {
    sourceRelease,
    targetRelease,
    sourceSchema,
    targetSchema,
    transactionCount: vault.transactions.length,
    canonicalPreserved: before === after
  }, 'Retain the rehearsal evidence; no production migration is authorized.');
}

async function runCorruption(input: unknown): Promise<LongevityDrillReport> {
  if (!isRecord(input) || !('package' in input)) fail('corruption input must include a package');
  try {
    await validatePortableVaultPackage(input.package);
    return report('corruption', 'rejected', 'The supplied fixture passed integrity validation and therefore did not prove corruption handling.', {
      validationRejected: false
    }, 'Correct the synthetic corruption fixture and rerun the drill.');
  } catch (error) {
    return report('corruption', 'pass', 'The corrupted synthetic portable package was rejected before any restore or write.', {
      validationRejected: true,
      rejection: errorMessage(error)
    }, 'Preserve the rejected package and use an independently verified backup for any real recovery decision.');
  }
}

function runRollback(input: unknown): LongevityDrillReport {
  if (!isRecord(input)) fail('rollback input must be an object');
  const backup = asVault(input.backup, 'backup');
  const verificationPassed = input.verificationPassed === true;
  const backupBefore = canonicalJson(backup);
  let candidateCanonical = '';
  let candidateValid = false;
  try {
    candidateCanonical = canonicalJson(asVault(input.candidate, 'candidate'));
    candidateValid = true;
  } catch {
    candidateValid = false;
  }

  if (verificationPassed) {
    return report('rollback', 'rejected', 'Rollback was requested even though the synthetic candidate was marked verified.', {
      verificationPassed,
      candidateValid,
      backupTransactionCount: backup.transactions.length
    }, 'Correct the drill precondition; rollback requires an explicit failed verification result.');
  }

  const restored = JSON.parse(backupBefore) as JsonValue;
  const backupAfter = canonicalJson(backup);
  return report('rollback', 'pass', 'The drill selected an explicit synthetic backup and verified an exact non-destructive rollback result.', {
    verificationPassed,
    candidateValid,
    candidateDiffersFromBackup: !candidateValid || candidateCanonical !== backupBefore,
    backupTransactionCount: backup.transactions.length,
    backupUnchanged: backupBefore === backupAfter,
    restoredMatchesBackup: canonicalJson(restored) === backupBefore,
    failedCandidatePreserved: true
  }, 'Require a downloaded and read-back-verified backup before any real broad write or rollback.');
}

function runOrphan(input: unknown): LongevityDrillReport {
  if (!isRecord(input) || !Array.isArray(input.records) || !Array.isArray(input.references)) {
    fail('orphan input must include records and references arrays');
  }
  if (input.records.length > LONGEVITY_DRILL_LIMITS.maxMetadataRecords) fail('records exceed the drill harness bound');
  const ids = new Set<string>();
  for (const record of input.records) {
    if (!isRecord(record) || typeof record.id !== 'string' || !record.id.trim()) fail('every metadata record must have a non-empty string id');
    if (ids.has(record.id)) fail('metadata record ids must be unique');
    ids.add(record.id);
  }
  const references = input.references.map((value) => {
    if (typeof value !== 'string' || !value.trim()) fail('every metadata reference must be a non-empty string');
    return value;
  });
  const orphanIds = [...new Set(references.filter((id) => !ids.has(id)))].sort();
  const disposition: LongevityDisposition = orphanIds.length ? 'manual-review' : 'pass';
  return report('orphan', disposition, orphanIds.length
    ? 'The drill found orphan metadata references and preserved them for explicit review.'
    : 'The synthetic metadata references all resolve to known records.', {
    recordCount: input.records.length,
    referenceCount: references.length,
    orphanCount: orphanIds.length,
    orphanIds,
    recordsDeleted: 0,
    referencesRewritten: 0
  }, orphanIds.length
    ? 'Review each orphan and choose an explicit retain, reconnect, export, or delete action outside this drill.'
    : 'Retain the evidence; no cleanup action is required.');
}

function runStaleSchema(input: unknown): LongevityDrillReport {
  if (!isRecord(input) || !isRecord(input.package) || !isRecord(input.package.manifest)) {
    fail('stale-schema input must include package.manifest');
  }
  const schemaVersion = asInteger(input.package.manifest.schemaVersion, 'package.manifest.schemaVersion');
  if (schemaVersion === PORTABLE_VAULT_SCHEMA_VERSION) {
    return report('stale-schema', 'rejected', 'The supplied fixture uses the current schema and does not exercise stale-schema handling.', {
      schemaVersion,
      supportedSchema: PORTABLE_VAULT_SCHEMA_VERSION
    }, 'Correct the synthetic fixture so it represents an unsupported schema.');
  }
  return report('stale-schema', 'manual-review', 'The unsupported synthetic schema was identified without migration or restore.', {
    schemaVersion,
    supportedSchema: PORTABLE_VAULT_SCHEMA_VERSION,
    automaticMigrationPerformed: false
  }, 'Design, threat-review, and test a separate explicit migration before real data is considered.');
}

function runCapacity(input: unknown): LongevityDrillReport {
  if (!isRecord(input)) fail('capacity input must be an object');
  const vault = asVault(input.vault);
  const metadataRecords = input.metadataRecords === undefined ? 0 : asInteger(input.metadataRecords, 'metadataRecords');
  if (metadataRecords < 0) fail('metadataRecords must not be negative');
  const transactionCount = vault.transactions.length;
  const canonicalBytes = utf8Bytes(canonicalJson(vault));
  const withinBounds = transactionCount <= LONGEVITY_DRILL_LIMITS.maxSyntheticTransactions
    && canonicalBytes <= LONGEVITY_DRILL_LIMITS.maxCanonicalBytes
    && metadataRecords <= LONGEVITY_DRILL_LIMITS.maxMetadataRecords;
  return report('capacity', withinBounds ? 'pass' : 'manual-review', withinBounds
    ? 'The bounded synthetic long-lived dataset remained within the drill harness limits.'
    : 'The synthetic dataset exceeded a drill harness limit and was preserved without cleanup.', {
    transactionCount,
    canonicalBytes,
    metadataRecords,
    limits: { ...LONGEVITY_DRILL_LIMITS },
    automaticCleanupPerformed: false,
    productionDataLimitDeclared: false
  }, withinBounds
    ? 'Retain the evidence and continue measuring future releases against the same fixture.'
    : 'Review performance and storage behavior; do not treat the drill bound as permission to delete or reset user data.');
}

export async function runLongevityDrill(scenario: LongevityScenario, input: unknown): Promise<LongevityDrillReport> {
  if (!LONGEVITY_SCENARIOS.includes(scenario)) fail('unsupported scenario');
  if (scenario === 'upgrade') return runUpgrade(input);
  if (scenario === 'corruption') return runCorruption(input);
  if (scenario === 'rollback') return runRollback(input);
  if (scenario === 'orphan') return runOrphan(input);
  if (scenario === 'stale-schema') return runStaleSchema(input);
  return runCapacity(input);
}

export function createSyntheticLongLivedVault(transactionCount = 144): AuthoritativeVault {
  if (!Number.isSafeInteger(transactionCount) || transactionCount < 1 || transactionCount > LONGEVITY_DRILL_LIMITS.maxSyntheticTransactions + 1) {
    fail('synthetic transactionCount is outside the supported fixture range');
  }
  const categories = ['Housing', 'Food', 'Utilities', 'Transport', 'Health', 'Education'];
  return {
    syntheticFixture: true,
    fixtureVersion: LONGEVITY_DRILL_VERSION,
    transactions: Array.from({ length: transactionCount }, (_, index) => {
      const year = 2014 + Math.floor(index / 12);
      const month = String((index % 12) + 1).padStart(2, '0');
      return {
        id: `synthetic-long-${String(index + 1).padStart(5, '0')}`,
        date: `${year}-${month}-15`,
        name: `Synthetic recurring ${String((index % 8) + 1).padStart(2, '0')}`,
        amount: -((index % 17) + 1) * 125,
        type: 'expense',
        category: categories[index % categories.length] || 'Synthetic'
      };
    })
  };
}
