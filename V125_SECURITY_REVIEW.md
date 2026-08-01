# v125 Security and Privacy Review

## Release boundary

v125 is a read-only explanation layer over immutable month-close snapshots and currently posted open-month rows. It adds no transaction writer, migration, remote parser, analytics endpoint, service worker, institution connection, or background financial action.

## Evidence handling

- Closed-month totals come from retained close snapshots when the required aggregate metrics are available.
- Open-month estimates come from currently posted rows.
- Pending rows are excluded from all money totals.
- Transfers are excluded from operating comparisons.
- Snapshot-versus-current-row coverage mismatches lower confidence instead of rewriting history.
- Ranked drivers describe aggregate correlation only and never claim causation.

## Export boundary

The JSON package, Markdown, diagnostics, and workbook additions contain aggregate values only. They do not export transaction rows, merchants, account labels, owners, filenames, fingerprints, credentials, tokens, raw vault data, or counterparty details.

## Mutation boundary

v125 does not:

- rewrite transactions;
- mutate close or reopen history;
- reopen a month;
- change forecasts, budgets, debts, goals, scenarios, or recurring decisions;
- apply a financial action;
- clear browser storage.

## Recovery and compatibility

- `gringottsBudgetVault.latest` remains the authoritative full-restore destination.
- Stable v105 rescue behavior remains available.
- Separate Import transactions and Full Vault Restore workflows remain unchanged.
- Existing metadata stores are read without adding a new v125 store.

## Repository privacy

All tests use synthetic rows and aggregate close snapshots. No real household export, screenshot, filled workbook, local backup, account identifier, or transaction data belongs in source control, CI artifacts, PR descriptions, or public logs.
