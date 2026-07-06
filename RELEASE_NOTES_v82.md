# Gringotts Budget Vault v82

## Focus

Vault Health Score.

## Changes

- Adds a Vault Health Score panel under Health.
- Scores local readiness across data load, active-vault consistency, quota-safe storage, executive summary, cash-flow planning, debt/promo readiness, repair readiness, and meeting-pack readiness.
- Keeps Regression Quality Checks from v81.
- Keeps quota-safe behavior: the score is computed at runtime and does not write transaction data or create a new full vault copy.
- Release Sync is bumped to v82 and renders the health score dynamically.
- Core state is bumped to v82 with migration coverage back through prior vault keys and latest.

## Test

1. Update to v82.
2. Open Health.
3. Confirm Vault Health Score appears above Regression Quality Checks.
4. Confirm the score rows show points for data, active vault, quota-safe storage, executive summary, cash flow, debt/promo, repair, and meeting pack.
5. Open Repair and confirm the populated latest vault still shows the expected transaction count.
