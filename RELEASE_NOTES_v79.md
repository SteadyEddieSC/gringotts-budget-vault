# Gringotts Budget Vault v79

## Focus

Cash Flow II + Manual Planning.

## Changes

- Adds a manual planning layer to the Cash Flow tab.
- Adds manual bill overrides with name, amount, due day, and category.
- Adds payday markers with amount, next date, and monthly repeat option.
- Adds an adjusted planning estimate that combines the existing safe-to-spend estimate with manual bills and payday markers.
- Stores manual cash-flow planning data in a small separate key: `gringottsCashflowManual.v1`.
- Keeps quota-safe storage intact; this release does not create another full transaction-vault copy.
- Release Sync dynamically loads the v79 Cash Flow II module so the existing app shell can activate it even before a full index-shell cleanup.
- Health now checks for Cash Flow II.

## Test

1. Update to v79.
2. Open Cash Flow.
3. Add one manual bill override.
4. Add one payday marker.
5. Confirm the adjusted planning estimate changes.
6. Open Health and confirm Cash Flow II is OK.
7. Open Repair and confirm the populated `latest` vault remains active with the expected transaction count.
