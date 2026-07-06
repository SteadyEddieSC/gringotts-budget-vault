# Gringotts Budget Vault v99

Calendar ICS.

## Purpose

Adds local-only calendar export support while keeping the clean single-runtime architecture from v95 through v98.

## Changes

- Adds `src/runtime-v99-calendar-ics.js` as a full clean runtime file.
- Updates `index.html` and `app.html` to load only `src/runtime-v99-calendar-ics.js?v=99calendar1`.
- Adds a dedicated `Calendar` tab.
- Adds Calendar shortcuts from Dashboard, Tools, and Export Center.
- Generates calendar events from local planning data:
  - bills with due dates
  - paydays with dates
  - promo APR end dates
  - saved calendar prep events, when present
- Adds local-only calendar outputs:
  - Download ICS
  - Copy ICS text
  - Calendar manifest JSON
  - ICS preview
- Preserves Executive Summary II, Export Center, Debug II, safe localStorage inventory, restore guardrails, and rescue page links.
- Improves Debug II runtime proof by treating `loadedRuntimeFromWindow` as valid even when the boot process no longer leaves the original script tag visible.
- Keeps the local-first privacy model. Calendar/support/debug exports do not include full transaction rows.
- Full vault backup remains a separate private export.
- No service workers, PWA install prompt, offline caching, release bridges, or overlays were added.

## Roadmap after v99

- v100 Rules III Rebuild
- v101 Rules IV
- v102 PWA Rebuild Review
- v103 Household Handoff
- v104 Goals and Sinking Funds
- v105 Release Hardening
- v106 Budget Reports II
- v107 Rules + Export Bridge
- v108 Mobile Polish II
- v109 Calendar Prep II

## Test

1. Open `/?release=99calendar`.
2. Confirm the page loads.
3. Confirm the header says `v99 Calendar ICS`.
4. Confirm Dashboard still shows the expected local vault if this browser has the vault loaded.
5. Open the new `Calendar` tab.
6. Confirm the Calendar tab shows event counts and a manifest preview.
7. Add a test bill, payday, or promo date if needed and confirm an event appears.
8. Download the ICS file.
9. Copy ICS text.
10. Download the Calendar manifest JSON.
11. Open Diagnostics and confirm loaded runtime says `src/runtime-v99-calendar-ics.js`.
12. Confirm Diagnostics runtime proof is valid even when script tags are no longer visible after boot.
13. Open Roadmap and confirm Rules III Rebuild is next.
