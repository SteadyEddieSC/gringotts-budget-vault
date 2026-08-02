const domain = (key, name, authority, recovery, options = {}) => Object.freeze({
  key,
  domain: name,
  authority,
  recovery,
  transactionCopies: options.transactionCopies === true,
  resettable: options.resettable !== false
});

export const STORAGE_INVENTORY = Object.freeze([
  domain('gringottsBudgetVault.latest', 'vault', 'authoritative', 'Full Vault Restore targets this key only. Empty transaction arrays are blocked; broad writes require backup, rollback, and read-back verification.', { transactionCopies: true, resettable: false }),
  domain('gringottsRulesIII.preview.v1', 'rules', 'metadata', 'Invalid JSON falls back to an empty rule set.'),
  domain('gringottsCashflowManual.v1', 'planning-events', 'metadata', 'Invalid JSON falls back to an empty planning-event set.'),
  domain('gringottsCleanMonth.v1', 'navigation', 'preference', 'Invalid values fall back to the latest available month.'),
  domain('gringottsGoals.v1', 'goals', 'metadata', 'Invalid JSON falls back to an empty goal collection.'),
  domain('gringottsVaultHealthHistory.v1', 'health-history', 'metadata-history', 'Invalid JSON falls back to empty history without changing the vault.'),
  domain('gringottsMonthClose.v1', 'month-close', 'immutable-history', 'Malformed records are sanitized; close snapshots are never recomputed or silently rewritten.', { resettable: false }),
  domain('gringottsForecastSettings.v1', 'forecast', 'metadata', 'Invalid values are sanitized to bounded defaults.'),
  domain('gringottsDebtPlan.v1', 'debt-plan', 'metadata', 'Invalid JSON falls back to an empty plan; transactions are not changed.'),
  domain('gringottsReportRange.v1', 'reports', 'preference', 'Invalid ranges fall back to a valid selected-month range.'),
  domain('gringottsGuidedPlan.v1', 'guided-plan', 'metadata', 'Unknown or stale actions are reconciled without changing transactions.'),
  domain('gringottsImportProfiles.v1', 'import-profiles', 'metadata', 'Profiles are capped and sanitized; replacement requires explicit review.'),
  domain('gringottsImportProfileRevisions.v1', 'profile-revisions', 'metadata-history', 'Invalid entries are discarded without touching profiles or the vault.'),
  domain('gringottsImportHistory.v1', 'import-receipts', 'metadata-history', 'Read-only audit and manual rollback guidance remain available; no automatic receipt repair.', { resettable: false }),
  domain('gringottsImportBatchIndex.v1', 'import-batch-index', 'metadata-history', 'Invalid links are sanitized; receipts and transactions are never rewritten.'),
  domain('gringottsAccountCleanupPlan.v1', 'account-cleanup', 'metadata', 'Read-back verification restores the previous raw value after write failure.'),
  domain('gringottsRecurringDecisions.v1', 'recurring-decisions', 'metadata', 'Read-back verification restores the previous raw value after write failure.'),
  domain('gringottsScenarioComparisons.v1', 'scenarios', 'metadata', 'Read-back verification restores the previous raw value after write failure.')
]);

export function validateStorageInventory(inventory = STORAGE_INVENTORY) {
  const keys = new Set();
  for (const entry of inventory) {
    if (!entry?.key || !entry.domain || !entry.authority || !entry.recovery) {
      throw new Error('Every storage domain requires a key, domain, authority, and recovery contract.');
    }
    if (keys.has(entry.key)) throw new Error(`Duplicate storage key in inventory: ${entry.key}`);
    keys.add(entry.key);
  }
  const vault = inventory.find((entry) => entry.key === 'gringottsBudgetVault.latest');
  if (!vault || vault.authority !== 'authoritative' || vault.resettable !== false) {
    throw new Error('The authoritative vault must remain non-resettable.');
  }
  if (inventory.filter((entry) => entry.transactionCopies).length !== 1) {
    throw new Error('Only the authoritative vault may contain transaction copies.');
  }
  if (!keys.has('gringottsImportHistory.v1')) throw new Error('The import receipt history key must remain inventoried.');
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
