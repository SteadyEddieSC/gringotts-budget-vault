# Gringotts Budget Vault v96

Executive Summary II.

## Purpose

This release restores the richer paragraph-style executive summary requested by the user while preserving the clean recovery-gate runtime model from v95.

## Changes

- Adds `src/runtime-v96-executive-summary.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v96-executive-summary.js?v=96summary1`.
- Restores Executive Summary II on the Dashboard.
- Executive Summary II includes:
  - current month income, spending, net cash flow, and transaction count
  - last month comparison
  - current-versus-last-month income/spending deltas
  - year-to-date income, spending, net cash flow, and transaction count
  - eating-out spend for current month and year to date
  - category with greatest increase
  - category with greatest decrease
- Adds copy/download options for the executive summary.
- Adds Diagnostics proof for:
  - loaded runtime file
  - Executive Summary II paragraph count
  - eating-out spend calculation
  - category increase/decrease calculation
  - active vault and best vault matching
  - no service worker registration/controller
- Keeps local-first privacy model: no transaction JSON is embedded, uploaded, pushed, or exposed.
- Keeps `rescue.html` standalone and independent from the main runtime.
- Does not add service workers, PWA install prompt, offline caching, release bridges, or overlays.

## Eating-out detection note

Eating-out spend is detected from category, merchant, and description text using common dining/restaurant/food-delivery terms. It is intentionally transparent and conservative enough for a family budget summary, but it may need later refinement when Rules rebuild returns.

## Roadmap after v96

- v97 Export Center
- v98 Debug II
- v99 Calendar ICS as a clean full runtime release
- v100 Rules III Rebuild
- v101 Rules IV
- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II

## Test

1. Open `/?release=96summary`.
2. Confirm the page loads.
3. Confirm the header says `v96 Executive Summary II`.
4. Confirm Dashboard still shows the populated local vault, expected best-known count: 776 transactions.
5. Confirm the Executive Summary II card has paragraph-style text for current month, last month, YTD, eating out, greatest increase, and greatest decrease.
6. Use Copy executive summary.
7. Use Download summary.
8. Open Diagnostics.
9. Confirm loaded runtime says `src/runtime-v96-executive-summary.js`.
10. Confirm Diagnostics includes Executive Summary II paragraph count and eating-out/category movement checks.
11. Open Roadmap and confirm Export Center is next.
