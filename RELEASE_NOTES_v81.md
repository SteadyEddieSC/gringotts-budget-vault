# Gringotts Budget Vault v81

## Focus

Regression Quality Panel.

## Changes

- Adds a runtime quality panel under Health through Release Sync.
- The panel checks core version, storage key, quota-safe storage helpers, best local vault, active vault match, executive summary, Cash Flow II, Debt Planner II, Family Meeting Pack, Repair tools, and cache visibility.
- The panel is safe: it displays runtime status and does not write transaction data or create another full vault copy.
- Core state is bumped to v81 and roadmap moves Vault Health Score to v82.
- Release Sync is bumped to v81.

## Service worker note

The service worker cache bump was attempted but blocked by the connector safety layer during this pass. The v81 runtime still updates through the network-first app shell and Release Sync, but the cache file may remain at v80 until the next shell-only cleanup pass.

## Test

1. Update to v81.
2. Open Health.
3. Confirm Regression Quality Checks appears.
4. Confirm the panel shows PASS/WARN rows for core version, best vault, active data, executive summary, Cash Flow II, Debt Planner II, Family Meeting Pack, Repair tools, and cache visibility.
5. Open Repair and confirm the populated latest vault still shows the expected transaction count.
