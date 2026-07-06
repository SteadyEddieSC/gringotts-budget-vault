# Gringotts Budget Vault v94

Import Helper II + Due Date Fix.

## Changes

- Keeps the clean runtime architecture: no service worker, no legacy release bridges, no PWA install prompt.
- Fixes Cash Flow bill entry:
  - Label now says `Due date`.
  - Field is a real date picker: `<input type="date">`.
  - New bills store `dueDate`.
  - Older bills that only have `dueDay` still display safely.
- Restores Import Helper II in the clean runtime under Tools:
  - Analyze JSON transaction packs before importing.
  - Shows row count, coverage dates, accounts, inflow/outflow totals, pending rows, duplicate estimate, warnings, and top categories.
  - Stores only a small helper summary in `gringottsImportHelper.v2`; it does not store the uploaded file or transaction rows.
  - Adds copy helper summary.
- Updates Diagnostics for v94 and adds checks for the due-date picker and Import Helper II.
- Updates Roadmap to exactly the next 10 releases: v95 through v104.

## Test

1. Open `/?clean=94` or `/app.html?clean=94`.
2. Confirm header shows v94 Import Helper II + Due Date Fix.
3. Confirm Dashboard still shows 776 transactions.
4. Open Planning.
5. In Cash Flow editor, confirm bill field says Due date and opens a date picker.
6. Add and delete a test bill.
7. Open Tools.
8. Analyze a JSON transaction pack with Import Helper II.
9. Copy the helper summary.
10. Open Diagnostics and confirm runtime self-tests pass.
11. Open Roadmap and confirm v95 through v104.
