import { test, expect } from './helpers/app.js';
import { currentVersion } from './helpers/release.js';

const retainedRegistry = {
  release: currentVersion,
  featureRelease: 'v133',
  name: 'Local Data Longevity Drills',
  hostRelease: currentVersion,
  lazy: true,
  syntheticOnly: true,
  authoritativeVaultRead: false,
  authoritativeVaultWrite: false
};

test('keeps the retained v133 drill engine outside startup and loads it only on explicit synthetic validation', async ({ app }) => {
  const { page } = app;
  const before = await page.evaluate(() => ({
    storage: Object.fromEntries(Object.entries(localStorage)),
    resources: performance.getEntriesByType('resource').map((entry) => entry.name),
    registry: window.GringottsV133.snapshot()
  }));

  expect(before.registry).toEqual({
    ...retainedRegistry,
    loaded: false,
    lastScenario: null,
    lastDisposition: null
  });
  expect(before.resources.some((name) => /\/src\/v133\/longevity-drills\.js/.test(name))).toBe(false);

  const capacity = await page.evaluate(async () => {
    const vault = {
      syntheticFixture: true,
      transactions: Array.from({ length: 180 }, (_, index) => ({
        id: `synthetic-browser-${index + 1}`,
        date: `2025-${String((index % 12) + 1).padStart(2, '0')}-15`,
        name: `Synthetic Browser ${index % 6}`,
        amount: -((index % 13) + 1) * 100,
        type: 'expense',
        category: 'Synthetic'
      }))
    };
    return window.GringottsV133.runSyntheticDrill('capacity', { vault, metadataRecords: 12 });
  });

  expect(capacity).toMatchObject({
    kind: 'gringotts-local-data-longevity-drill',
    scenario: 'capacity',
    disposition: 'pass',
    safeguards: {
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
    },
    evidence: {
      transactionCount: 180,
      metadataRecords: 12,
      automaticCleanupPerformed: false,
      productionDataLimitDeclared: false
    }
  });

  const after = await page.evaluate(() => ({
    storage: Object.fromEntries(Object.entries(localStorage)),
    resources: performance.getEntriesByType('resource').map((entry) => entry.name),
    registry: window.GringottsV133.snapshot(),
    lifecycle: window.GringottsV126.coordinator.snapshot()
  }));
  expect(after.storage).toEqual(before.storage);
  expect(after.resources.some((name) => /\/src\/v133\/longevity-drills\.js\?v=135longevity1$/.test(name))).toBe(true);
  expect(after.registry).toEqual({
    ...retainedRegistry,
    loaded: true,
    lastScenario: 'capacity',
    lastDisposition: 'pass'
  });
  expect(after.lifecycle.observerCount).toBe(1);
});

test('preserves orphan metadata for manual review without changing browser storage', async ({ app }) => {
  const { page } = app;
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const report = await page.evaluate(() => window.GringottsV133.runSyntheticDrill('orphan', {
    records: [{ id: 'synthetic-known-a' }, { id: 'synthetic-known-b' }],
    references: ['synthetic-known-a', 'synthetic-missing-b', 'synthetic-missing-a']
  }));
  expect(report).toMatchObject({
    scenario: 'orphan',
    disposition: 'manual-review',
    evidence: {
      orphanCount: 2,
      orphanIds: ['synthetic-missing-a', 'synthetic-missing-b'],
      recordsDeleted: 0,
      referencesRewritten: 0
    },
    safeguards: {
      automaticCleanup: false,
      destructiveActionPerformed: false,
      authoritativeVaultWrite: false
    }
  });
  const storageAfter = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  expect(storageAfter).toEqual(storageBefore);
});
