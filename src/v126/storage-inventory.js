export const STORAGE_INVENTORY = Object.freeze([
  {
    key: 'gringottsBudgetVault.latest',
    domain: 'vault',
    authority: 'authoritative',
    contents: 'Household transaction vault',
    recovery: 'Full Vault Restore targets this key only; empty transaction arrays are blocked; broad writes require backup and read-back verification.',
    transactionCopies: true,
    resettable: false
  },
  {
    key: 'gringottsRulesIII.preview.v1',
    domain: 'rules',
    authority: 'metadata',
    contents: 'Local categorization rules and priority order',
    recovery: 'Invalid JSON falls back to an empty rule set. Export review remains available.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsCashflowManual.v1',
    domain: 'planning-events',
    authority: 'metadata',
    contents: 'Manual bills and payday planning events',
    recovery: 'Invalid JSON falls back to an empty planning-event set.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsCleanMonth.v1',
    domain: 'navigation',
    authority: 'preference',
    contents: 'Selected reporting month',
    recovery: 'Invalid values fall back to the latest available month.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsGoals.v1',
    domain: 'goals',
    authority: 'metadata',
    contents: 'Household goals and contributions',
    recovery: 'Invalid JSON falls back to an empty goal collection.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsVaultHealthHistory.v1',
    domain: 'health-history',
    authority: 'metadata',
    contents: 'Bounded Vault Health snapshots',
    recovery: 'Invalid JSON falls back to empty history without changing the vault.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsMonthClose.v1',
    domain: 'month-close',
    authority: 'immutable-history',
    contents: 'Reconciliations, close snapshots, revisions, and reopen events',
    recovery: 'Malformed records are sanitized; close snapshots are never recomputed or silently rewritten.',
    transactionCopies: false,
    resettable: false
  },
  {
    key: 'gringottsForecastSettings.v1',
    domain: 'forecast',
    authority: 'metadata',
    contents: 'Cash forecast assumptions',
    recovery: 'Invalid values are sanitized to bounded defaults.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsDebtPlan.v1',
    domain: 'debt-plan',
    authority: 'metadata',
    contents: 'Local debt planning entries and recorded planning payments',
    recovery: 'Invalid JSON falls back to an empty plan; transactions are not changed.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsReportRange.v1',
    domain: 'reports',
    authority: 'preference',
    contents: 'Report date-range and comparison preference',
    recovery: 'Invalid ranges fall back to a valid selected-month range.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsGuidedPlan.v1',
    domain: 'guided-plan',
    authority: 'metadata',
    contents: 'Bounded household action status, owner, date, and notes',
    recovery: 'Unknown or stale actions are reconciled without changing transactions.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsImportProfiles.v1',
    domain: 'import-profiles',
    authority: 'metadata',
    contents: 'Sanitized import mapping profiles',
    recovery: 'Profiles are capped and sanitized; replacement requires explicit review.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsImportProfileRevisions.v1',
    domain: 'profile-revisions',
    authority: 'metadata-history',
    contents: 'Bounded sanitized profile revision history',
    recovery: 'Invalid entries are discarded without touching profiles or the vault.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsImportReceipts.v1',
    domain: 'import-receipts',
    authority: 'metadata-history',
    contents: 'Metadata-only verified import receipts',
    recovery: 'Read-only audit and manual rollback guidance; no automatic receipt repair.',
    transactionCopies: false,
    resettable: false
  },
  {
    key: 'gringottsImportBatchIndex.v1',
    domain: 'import-batch-index',
    authority: 'metadata-history',
    contents: 'Bounded receipt lineage links and continuity metadata',
    recovery: 'Invalid links are sanitized; receipts and transactions are never rewritten.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsAccountCleanupPlan.v1',
    domain: 'account-cleanup',
    authority: 'metadata',
    contents: 'Bounded account cleanup planning decisions',
    recovery: 'Read-back verification restores the previous raw value after write failure.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsRecurringDecisions.v1',
    domain: 'recurring-decisions',
    authority: 'metadata',
    contents: 'Bounded recurring-cost decisions and follow-up notes',
    recovery: 'Read-back verification restores the previous raw value after write failure.',
    transactionCopies: false,
    resettable: true
  },
  {
    key: 'gringottsScenarioComparisons.v1',
    domain: 'scenarios',
    authority: 'metadata',
    contents: 'Bounded what-if assumptions and discussion notes',
    recovery: 'Read-back verification restores the previous raw value after write failure.',
    transactionCopies: false,
    resettable: true
  }
]);

export function validateStorageInventory(inventory = STORAGE_INVENTORY) {
  const keys = new Set();
  for (const entry of inventory) {
    if (!entry?.key || !entry.domain || !entry.authority || !entry.contents || !entry.recovery) {
      throw new Error('Every storage domain requires a key, domain, authority, contents, and recovery contract.');
    }
    if (keys.has(entry.key)) throw new Error(`Duplicate storage key in inventory: ${entry.key}`);
    keys.add(entry.key);
  }
  const vault = inventory.find((entry) => entry.key === 'gringottsBudgetVault.latest');
  if (!vault || vault.authority !== 'authoritative' || vault.resettable !== false) {
    throw new Error('The authoritative vault must remain non-resettable.');
  }
  if (inventory.filter((entry) => entry.transactionCopies === true).length !== 1) {
    throw new Error('Only the authoritative vault may contain transaction copies.');
  }
  return true;
}

export function storageInventorySummary(inventory = STORAGE_INVENTORY) {
  validateStorageInventory(inventory);
  return {
    domains: inventory.length,
    authoritativeKeys: inventory.filter((entry) => entry.authority === 'authoritative').map((entry) => entry.key),
    immutableHistoryKeys: inventory.filter((entry) => entry.authority === 'immutable-history').map((entry) => entry.key),
    resettableDomains: inventory.filter((entry) => entry.resettable).length,
    transactionCopyDomains: inventory.filter((entry) => entry.transactionCopies).map((entry) => entry.key),
    inventory: inventory.map((entry) => ({ ...entry }))
  };
}
