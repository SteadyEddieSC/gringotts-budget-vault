# Gringotts Budget Vault v95 Recovery Gate

Recovery Gate + Diagnostics Proof.

## Purpose

This is a cautious recovery-gate release after the v96 break and the failed v95 rollback. It continues from the last user-confirmed-good runtime behavior in v94 and does not attempt feature work.

## Changes

- Adds `src/runtime-v95-recovery.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v95-recovery.js?v=95recovery1`.
- Keeps the local-first privacy model: no transaction JSON is embedded, uploaded, pushed, or exposed.
- Keeps active vault behavior based on best-populated local vaults and `gringottsBudgetVault.latest`.
- Does not register service workers.
- Does not add PWA install prompts.
- Does not use stacked release bridges or overlay scripts.
- Preserves v94-era Dashboard, Ledger, Planning editors, Import Helper II, backup, restore, Diagnostics, and Roadmap.
- Adds stronger runtime proof in Dashboard and Diagnostics:
  - loaded runtime file
  - cache-bust token
  - active vault key
  - active transaction count
  - service worker registration/controller status
  - roadmap proof that Executive Summary II is queued
- Restore remains guarded by transaction-row detection and user confirmation.
- `rescue.html` remains standalone and independent from the main runtime.

## Roadmap preserved

The next release candidate is Executive Summary II. It should restore paragraph-style reporting for:

- current month
- last month
- comparison between current and last month
- year-to-date totals
- eating-out spend
- category with greatest increase
- category with greatest decrease

Calendar ICS, Rules III / Rules IV, Export Center, Debug II, and PWA Rebuild Review remain queued, but should only proceed after this recovery gate is confirmed stable.

## Test

1. Open `/?release=95recovery`.
2. Confirm the page loads.
3. Confirm the header says `v95 Recovery Gate + Diagnostics Proof`.
4. Confirm Dashboard still shows the populated local vault, expected best-known count: 776 transactions.
5. Open Diagnostics.
6. Confirm loaded runtime says `src/runtime-v95-recovery.js`.
7. Confirm runtime self-tests show the active vault and no service worker registrations/controller.
8. Open Tools and confirm the rescue page button is present.
9. Open Roadmap and confirm Executive Summary II is next.
10. Do not move to feature work until the user confirms the page loads on the live device.
