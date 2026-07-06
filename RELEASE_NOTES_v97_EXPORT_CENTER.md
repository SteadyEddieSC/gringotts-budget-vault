# Gringotts Budget Vault v97

Export Center.

## Purpose

This release adds a local-only Export Center while preserving the clean runtime model from v95/v96 and the Executive Summary II work from v96.

## Changes

- Adds `src/runtime-v97-export-center.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v97-export-center.js?v=97export1`.
- Adds a dedicated `Exports` tab.
- Adds a Tools shortcut to Export Center.
- Adds local-only exports:
  - Executive Summary markdown
  - Monthly briefing JSON
  - Planning pack JSON
  - Vault health JSON
  - Debug report JSON
  - Support bundle JSON
  - Export manifest copy/download fallback
  - Full private vault backup as a separate clearly labeled export
- Support bundle intentionally excludes full transaction rows.
- Full vault backup remains a separate user action and should be treated as private.
- Preserves Executive Summary II:
  - current month
  - last month
  - comparison
  - year-to-date totals
  - eating-out spend
  - greatest category increase
  - greatest category decrease
- Keeps local-first privacy model: no transaction JSON is embedded, uploaded, pushed, or exposed.
- Keeps `rescue.html` standalone and independent from the main runtime.
- Does not add service workers, PWA install prompt, offline caching, release bridges, or overlays.

## Export Center privacy behavior

The Export Center creates files locally in the browser. Aggregate/support exports exclude full transaction rows. The full vault backup button still exports the local transaction vault, so it is clearly labeled as private and separate from the support bundle.

## Roadmap after v97

- v98 Debug II
- v99 Calendar ICS as a clean full runtime release
- v100 Rules III Rebuild
- v101 Rules IV
- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II
- v107 Rules + Export Bridge

## Test

1. Open `/?release=97export`.
2. Confirm the page loads.
3. Confirm the header says `v97 Export Center`.
4. Confirm Dashboard still shows the populated local vault, expected best-known count: 776 transactions.
5. Open the new `Exports` tab.
6. Download Executive Summary markdown.
7. Download Monthly briefing JSON.
8. Download Planning pack JSON.
9. Download Vault health JSON.
10. Download Support bundle JSON and confirm it is labeled as excluding full transaction rows.
11. Confirm full private vault backup remains a separate button.
12. Open Diagnostics and confirm loaded runtime says `src/runtime-v97-export-center.js`.
13. Confirm Diagnostics shows Export manifest entries and support bundle row-exclusion checks.
14. Open Roadmap and confirm Debug II is next.
