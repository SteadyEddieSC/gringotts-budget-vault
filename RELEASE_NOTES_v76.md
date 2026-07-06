# Gringotts Budget Vault v76

## Focus

Core Version Sync + Health Cleanup.

## Fixes

- Updates the core `src/state.js` version and storage key from v63 to v76.
- Expands previous-key migration coverage through v75.
- Cleans the Health panel so release status does not stack duplicate blocks.
- Adds active transaction count and best local vault transaction count to Health.
- Adds checks for Executive Summary and Release Sync modules.
- Updates the service worker cache name to `gringotts-budget-vault-v76`.

## Test

1. Open Safety and verify the best vault transaction count.
2. Download best vault backup.
3. Open Health and run the health check.
4. Confirm Health shows v76, no duplicated release-status block, and best local vault transaction count is present.
