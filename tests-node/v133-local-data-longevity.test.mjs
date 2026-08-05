import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LONGEVITY_DRILL_KIND,
  LONGEVITY_DRILL_LIMITS,
  LONGEVITY_SCENARIOS,
  createSyntheticLongLivedVault,
  runLongevityDrill
} from '../src/v133/longevity-drills.js';
import {
  canonicalJson,
  createPortableVaultPackage
} from '../src/v128/portable-vault.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function assertSafe(report, scenario, disposition) {
  assert.equal(report.kind, LONGEVITY_DRILL_KIND);
  assert.equal(report.scenario, scenario);
  assert.equal(report.disposition, disposition);
  assert.deepEqual(report.safeguards, {
    syntheticOnly: true,
    authoritativeVaultKey: 'gringottsBudgetVault.latest',
    authoritativeVaultRead: false,
    authoritativeVaultWrite: false,
    automaticMigration: false,
    automaticRepair: false,
    automaticCleanup: false,
    automaticRollback: false,
    destructiveActionPerformed: false,
    networkRequired: false,
    persistentStoreAdded: false
  });
}

test('publishes exactly the six v133 longevity scenarios', () => {
  assert.deepEqual([...LONGEVITY_SCENARIOS], [
    'upgrade', 'corruption', 'rollback', 'orphan', 'stale-schema', 'capacity'
  ]);
  assert.deepEqual(LONGEVITY_DRILL_LIMITS, {
    maxSyntheticTransactions: 5000,
    maxCanonicalBytes: 4000000,
    maxMetadataRecords: 2000
  });
});

test('rehearses a supported release upgrade without changing canonical synthetic data', async () => {
  const vault = createSyntheticLongLivedVault(144);
  const before = canonicalJson(vault);
  const first = await runLongevityDrill('upgrade', {
    sourceRelease: 'v128',
    targetRelease: 'v133',
    sourceSchema: 1,
    targetSchema: 1,
    vault
  });
  const second = await runLongevityDrill('upgrade', {
    sourceRelease: 'v128',
    targetRelease: 'v133',
    sourceSchema: 1,
    targetSchema: 1,
    vault
  });
  assertSafe(first, 'upgrade', 'pass');
  assert.equal(first.evidence.transactionCount, 144);
  assert.equal(first.evidence.canonicalPreserved, true);
  assert.equal(canonicalJson(vault), before);
  assert.deepEqual(second, first);
});

test('proves a corrupted portable package is rejected before restore', async () => {
  const vault = createSyntheticLongLivedVault(24);
  const portable = await createPortableVaultPackage(vault, {
    createdAt: '2026-08-05T12:00:00.000Z',
    sourceRelease: 'v133'
  });
  const corrupted = JSON.parse(JSON.stringify(portable));
  corrupted.vault.transactions[0].amount = 999999;
  const result = await runLongevityDrill('corruption', { package: corrupted });
  assertSafe(result, 'corruption', 'pass');
  assert.equal(result.evidence.validationRejected, true);
  assert.match(result.evidence.rejection, /integrity verification failed/i);
});

test('verifies an explicit rollback result while preserving backup and failed candidate evidence', async () => {
  const backup = createSyntheticLongLivedVault(36);
  const candidate = createSyntheticLongLivedVault(37);
  const backupBefore = canonicalJson(backup);
  const candidateBefore = canonicalJson(candidate);
  const result = await runLongevityDrill('rollback', {
    backup,
    candidate,
    verificationPassed: false
  });
  assertSafe(result, 'rollback', 'pass');
  assert.equal(result.evidence.backupUnchanged, true);
  assert.equal(result.evidence.restoredMatchesBackup, true);
  assert.equal(result.evidence.failedCandidatePreserved, true);
  assert.equal(result.evidence.candidateDiffersFromBackup, true);
  assert.equal(canonicalJson(backup), backupBefore);
  assert.equal(canonicalJson(candidate), candidateBefore);
});

test('detects orphan metadata and requires explicit review without deletion or rewrite', async () => {
  const result = await runLongevityDrill('orphan', {
    records: [{ id: 'profile-a' }, { id: 'profile-b' }],
    references: ['profile-a', 'missing-z', 'missing-a', 'missing-z']
  });
  assertSafe(result, 'orphan', 'manual-review');
  assert.deepEqual(result.evidence.orphanIds, ['missing-a', 'missing-z']);
  assert.equal(result.evidence.recordsDeleted, 0);
  assert.equal(result.evidence.referencesRewritten, 0);
});

test('keeps unsupported schemas closed without automatic migration', async () => {
  const result = await runLongevityDrill('stale-schema', {
    package: { manifest: { schemaVersion: 0 } }
  });
  assertSafe(result, 'stale-schema', 'manual-review');
  assert.equal(result.evidence.schemaVersion, 0);
  assert.equal(result.evidence.supportedSchema, 1);
  assert.equal(result.evidence.automaticMigrationPerformed, false);
});

test('treats capacity bounds as drill limits rather than production cleanup authority', async () => {
  const bounded = await runLongevityDrill('capacity', {
    vault: createSyntheticLongLivedVault(LONGEVITY_DRILL_LIMITS.maxSyntheticTransactions),
    metadataRecords: LONGEVITY_DRILL_LIMITS.maxMetadataRecords
  });
  assertSafe(bounded, 'capacity', 'pass');
  assert.equal(bounded.evidence.productionDataLimitDeclared, false);
  assert.equal(bounded.evidence.automaticCleanupPerformed, false);

  const exceeded = await runLongevityDrill('capacity', {
    vault: createSyntheticLongLivedVault(LONGEVITY_DRILL_LIMITS.maxSyntheticTransactions + 1),
    metadataRecords: 0
  });
  assertSafe(exceeded, 'capacity', 'manual-review');
  assert.equal(exceeded.evidence.transactionCount, LONGEVITY_DRILL_LIMITS.maxSyntheticTransactions + 1);
  assert.equal(exceeded.evidence.productionDataLimitDeclared, false);
  assert.equal(exceeded.evidence.automaticCleanupPerformed, false);
});

test('keeps the drill engine pure, local-only, non-persistent, and non-destructive', () => {
  for (const file of ['src/v133/longevity-drills.js', 'src/v133/longevity-drills.ts']) {
    const source = read(file);
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(source, /serviceWorker\.register|new MutationObserver/);
    assert.doesNotMatch(source, /\.removeItem\s*\(|\.clear\s*\(|deleteDatabase\s*\(/);
    assert.doesNotMatch(source, /localStorage\.setItem\s*\(/);
    assert.match(source, /authoritativeVaultWrite:\s*false/);
    assert.match(source, /automaticCleanup:\s*false/);
    assert.match(source, /destructiveActionPerformed:\s*false/);
  }
});
