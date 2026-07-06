# Gringotts Budget Vault v98

Debug II.

## Purpose

This release deepens runtime and storage diagnostics while preserving the clean single-runtime architecture from v95-v97.

## Changes

- Adds `src/runtime-v98-debug-ii.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v98-debug-ii.js?v=98debug1`.
- Adds Debug II proof and exports:
  - loaded-shell proof
  - loaded-runtime proof
  - expected runtime script check
  - safe localStorage inventory
  - support handoff report
  - release-gate report
  - smoke-test checklist markdown
- Extends Export Center with Debug II handoff and release-gate downloads.
- Extends Diagnostics with:
  - document title
  - external script list
  - runtime/cache-bust proof
  - service worker registration/controller status
  - safe localStorage inventory table
  - support bundle no-full-rows check
- Preserves Export Center from v97.
- Preserves Executive Summary II from v96.
- Keeps local-first privacy model: no transaction JSON is embedded, uploaded, pushed, or exposed.
- Keeps `rescue.html` standalone and independent from the main runtime.
- Does not add service workers, PWA install prompt, offline caching, release bridges, or overlays.

## Debug II privacy behavior

Debug II reports summarize localStorage keys and parsed top-level metadata only. They do not include raw localStorage values or full transaction rows. Full private vault backup remains a separate clearly labeled action.

## Why test both root and app URLs

`index.html` and `app.html` are separate static entry files. They should point at the same runtime, but checking both catches shell mismatches before more feature work continues.

## Roadmap after v98

- v99 Calendar ICS as a clean full runtime release
- v100 Rules III Rebuild
- v101 Rules IV
- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II
- v107 Rules + Export Bridge
- v108 Mobile Polish II

## Test

1. Open `/?release=98debug`.
2. Confirm the page loads.
3. Confirm the header says `v98 Debug II`.
4. Confirm Dashboard still shows the populated local vault, expected best-known count: 776 transactions.
5. Open Diagnostics.
6. Confirm loaded runtime says `src/runtime-v98-debug-ii.js`.
7. Confirm Diagnostics shows external script proof and safe localStorage inventory.
8. Download Debug II handoff JSON.
9. Download release-gate report JSON.
10. Download smoke-test checklist from Exports.
11. Confirm support/debug exports are labeled as excluding raw localStorage values and full transaction rows.
12. Open `app.html?release=98debug` and confirm it also loads v98.
13. Open Roadmap and confirm Calendar ICS is next.
