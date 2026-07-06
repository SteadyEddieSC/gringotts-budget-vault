# Gringotts Budget Vault v101

Rules IV Review.

## Purpose

This release builds on v100 Rules III Preview by adding conflict review, rule priority controls, and a review-package export while keeping transaction-row editing disabled.

## Changes

- Adds `src/runtime-v101-rules-review.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v101-rules-review.js?v=101review1`.
- Preserves local saved rule definitions under `gringottsRulesIII.preview.v1`.
- Adds rule priority ordering.
- Adds Up and Down controls for rule order.
- Adds conflict review when more than one enabled rule matches the same transaction.
- Adds a review-package JSON export containing:
  - runtime proof
  - active vault metadata
  - rule counts
  - suggestion count
  - conflict count
  - conflicts
  - suggestions
- Preserves the simplified Dashboard, Ledger, Planning, Calendar, Exports, Diagnostics, and Roadmap flow.
- Keeps full private vault backup separate.
- Does not edit transaction rows in v101.
- Does not add service workers, PWA install prompt, offline caching, release bridges, or overlays.

## Boundary

v101 is still review-only for Rules. It helps decide which rules should win before any future guarded edit flow exists. v111 is now reserved for studying a final safe-write flow with undo before enabling any row edits.

## Roadmap after v101

- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II
- v107 Rules + Export Bridge
- v108 Mobile Polish II
- v109 Calendar Prep II
- v110 Rule Review Reports
- v111 Rules Safe Write Study

## Test

1. Open `/?release=101review`.
2. Confirm the page loads.
3. Confirm the header says `v101 Rules IV Review`.
4. Open the Rules tab.
5. Confirm existing v100 preview rules still appear.
6. Add two rules that match the same merchant or phrase.
7. Confirm the conflict count updates.
8. Use Up and Down to change rule priority.
9. Download review package JSON.
10. Confirm the review package includes suggestions and conflicts but no transaction-row edits.
11. Open Diagnostics and confirm loaded runtime says `src/runtime-v101-rules-review.js`.
12. Open Roadmap and confirm v102 PWA Rebuild Review is next.
