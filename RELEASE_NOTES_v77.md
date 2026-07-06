# Gringotts Budget Vault v77

## Focus

Quota-Safe Storage + Version Authority.

## Fixes

- Stops the storage layer from creating a new full transaction-vault copy for every release version.
- Uses the best existing populated vault key as the active write target instead of blindly writing a new `gringottsBudgetVault.vXX` copy.
- Stops Health and Repair from saving full transaction state just to write diagnostic metadata.
- Removes the old v64 Data Guard version override so Repair no longer reports the app as v64.
- Updates Repair so app-cache reset writes only lightweight metadata and does not trigger quota-heavy vault duplication.
- Updates release status to v77 and prevents repeated Health release blocks from stacking.
- Bumps the service worker cache name to `gringotts-budget-vault-v77`.

## Important

If the browser is already near quota, do not clear site data. First download a Safety backup. v77 should let Health/Repair run without trying to write another large full-vault copy.

## Test

1. Update to v77.
2. Open Safety and download the best vault backup.
3. Open Health and run health check.
4. Confirm Health shows v77 and no duplicate release blocks.
5. Open Repair and confirm Current app version is v77 and the best vault still shows 776 transactions.
6. Tap Clear app cache only. It should not throw the quota error.
