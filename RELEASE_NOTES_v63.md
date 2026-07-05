# Gringotts Budget Vault v63

## Focus

Update Repair + Data Preservation.

## Changes

- Added an in-app Repair tab so the cache rescue workflow no longer requires visiting a separate page.
- Added local vault preflight showing app version, storage key, transaction count, rule count, and last saved time.
- Added Download repair backup.
- Added Clear app cache only and Repair and reload controls.
- Added `src/update-repair.js` for service-worker/cache reset while preserving localStorage.
- Updated service worker cache to v63.
- Changed the service worker navigation strategy to network-first for HTML so future versions are less likely to get stuck on old cached app shells.
- Updated storage key to `gringottsBudgetVault.v63` and migration from prior versions.

## Data safety

The repair workflow unregisters Gringotts service workers and deletes Gringotts CacheStorage entries only. It does not call localStorage.clear(). Imported transaction data should remain available after repair.
