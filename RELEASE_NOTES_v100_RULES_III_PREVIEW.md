# Gringotts Budget Vault v100

Rules III Preview.

## Purpose

This release rebuilds the Rules workflow foundation without adding a transaction-row update path yet.

## Changes

- Adds `src/runtime-v100-rules-preview.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v100-rules-preview.js?v=100preview1`.
- Adds a dedicated `Rules` tab.
- Adds local saved rule definitions under `gringottsRulesIII.preview.v1`.
- Adds rule matching scopes:
  - all text
  - name only
  - current category
  - account
- Adds suggestion preview from the active local vault.
- Adds suggestion export JSON.
- Adds rules export JSON.
- Keeps full private vault backup separate.
- Preserves a simplified Dashboard, Ledger, Planning, Calendar, Exports, Diagnostics, and Roadmap flow.
- Does not update transaction rows in v100.
- Does not add service workers, PWA install prompt, offline caching, release bridges, or overlays.

## Boundary

v100 is intentionally preview-only for Rules III. It can save rules and show/export suggestions, but it does not change transaction rows. v101 Rules IV is reserved for conflict review, confirmation, and undo history.

## Roadmap after v100

- v101 Rules IV
- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II
- v107 Rules + Export Bridge
- v108 Mobile Polish II
- v109 Calendar Prep II
- v110 Rule Review Reports

## Test

1. Open `/?release=100preview`.
2. Confirm the page loads.
3. Confirm the header says `v100 Rules III Preview`.
4. Confirm Dashboard still shows the expected local transaction count if this browser has the vault loaded.
5. Open the Rules tab.
6. Add a rule with Find text and Suggested category.
7. Confirm the suggestion count updates if matching transactions exist.
8. Download suggestions JSON.
9. Download rules JSON.
10. Confirm no transaction rows are changed by v100.
11. Open Diagnostics and confirm loaded runtime says `src/runtime-v100-rules-preview.js`.
12. Open Roadmap and confirm v101 Rules IV is next.
