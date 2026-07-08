# Gringotts Budget Vault v102 — Import Restore Gate

## Release summary

v102 adds a guarded **Import / Restore** workflow for Gringotts-compatible JSON vault files while preserving the existing local-first budgeting features and dark Gringotts-inspired interface.

## New import / restore workflow

- Adds a clearly visible **Import / Restore** tab.
- Lets the user choose a local `.json` vault file.
- Parses and validates the file entirely in the browser.
- Requires a non-empty `transactions` array.
- Shows a preview before restore:
  - transaction count
  - earliest transaction date
  - latest transaction date
  - source, when present
  - version, when present
  - declared storage key, when present
  - destination key
- Rejects malformed JSON.
- Rejects missing or empty transaction datasets.
- Requires explicit browser confirmation before writing.
- Writes only to:
  - `gringottsBudgetVault.latest`
- Preserves imported top-level metadata where possible.
- Sets fresh `restoredAt` and `lastSavedAt` timestamps.
- Verifies the saved transaction count before reloading the app.

## Backup-first gate

- Adds a prominent **Download Current Backup** button before restore.
- Strongly warns the user to back up populated data first.
- Keeps the Restore button disabled until:
  - a valid populated vault has been previewed, and
  - the user checks the acknowledgment box.
- Uses the acknowledgment:
  - “I downloaded a current backup and reviewed the restore preview.”
- Clearly explains that checking the box also covers an intentional decision to proceed without downloading a backup.
- Never silently overwrites populated data.

## Local-only privacy boundary

- The selected JSON file is read with browser-local file APIs.
- No transaction JSON is uploaded or transmitted.
- No transaction JSON is committed to GitHub or Cloudflare.
- No private transaction data is included in source code, fixtures, tests, screenshots, or these release notes.
- Full vault backup remains a separate user-triggered download.
- No empty vault is auto-saved to `gringottsBudgetVault.latest`.
- Best-populated-vault selection remains active.

## Preserved features

- Dashboard
- Ledger
- Planning
- Rules priority, preview, and conflict review
- Calendar
- Bills and paydays
- Calendar ICS export
- Full vault backup download
- Exports
- Diagnostics runtime proof
- Best-vault detection
- Roadmap
- Local-only browser storage

## Architecture boundary

- One live runtime file:
  - `src/runtime-v102-import-restore.js?v=102import1`
- No runtime overlay.
- No bridge script.
- No stacked release scripts.
- No service worker registration.
- No PWA install prompt.
- No offline cache changes.

## Test checklist

1. Open:
   - `https://gringotts-budget-vault.pages.dev/?release=102import`
2. Open:
   - `https://gringotts-budget-vault.pages.dev/app.html?release=102import`
3. Confirm the subtitle displays:
   - “Mischief Managed. Money Manged”
4. Open **Import / Restore**.
5. Select `Gringotts_bank_pull_2025-12-01_to_2026-07-06_restore_vault.json` from the local device.
6. Confirm the preview shows:
   - 959 transactions
   - earliest date `2025-12-01`
   - latest date `2026-07-03`
7. Select **Download Current Backup**.
8. Check the acknowledgment box.
9. Select **Confirm Restore** and accept the explicit confirmation prompt.
10. After reload, confirm the Dashboard and Ledger are populated.
11. Confirm Diagnostics shows:
    - `src/runtime-v102-import-restore.js`
12. Confirm Diagnostics reports no active service worker registration or controller.

## Validation completed before release

- JavaScript syntax check passed.
- The restore preview logic was tested locally against the supplied restore vault without committing or exposing its transaction data.
- The supplied vault produced the expected 959-transaction count and date range.
- Empty transaction arrays were rejected.
- The committed runtime Git blob matched the locally tested runtime byte-for-byte before the live shell was updated.
