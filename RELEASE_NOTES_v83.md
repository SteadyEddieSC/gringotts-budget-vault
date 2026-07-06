# Gringotts Budget Vault v83

## Focus

Import Helper.

## Changes

- Adds an Import Helper panel under the Import tab.
- Lets you analyze a JSON transaction pack before importing it.
- Shows row count, date range, accounts, inflow/outflow totals, pending rows, duplicate estimate, warnings, and top categories.
- Stores only a small helper summary in `gringottsImportHelper.v1`.
- Adds Import Helper readiness into Vault Health Score and Regression Quality Checks.
- Release Sync dynamically loads the helper and bumps runtime status to v83.
- Service worker cache was bumped to v83 and includes the helper module.

## Test

1. Update to v83.
2. Open Import.
3. Use Import Helper to analyze a JSON transaction pack.
4. Confirm it shows coverage, warnings, duplicate estimate, and top categories.
5. Copy the helper summary.
6. Open Health and confirm Import Helper appears in Health Score and Regression Quality Checks.
7. Open Repair and confirm the populated latest vault still shows the expected transaction count.
