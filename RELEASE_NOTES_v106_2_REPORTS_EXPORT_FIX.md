# Gringotts Budget Vault v106.2 — Reports Export Fix

## Root cause

The v106 runtime imported `reportsView` from `src/v106/views.js`, but that module only imported the function from v105 and did not re-export it. Browsers therefore stopped the entire ES module graph with:

`SyntaxError: The requested module './v106/views.js' does not provide an export named 'reportsView'`

## Correction

- Re-exported `reportsView` from `src/v106/views.js`.
- Advanced the boot-safe loader to v106.2.
- Added fresh cache keys for the production shell and runtime import.
- Preserved the v105 rescue page.
- Preserved all browser-local vault data and settings.

## Retest

1. Open the main v106.2 URL.
2. Confirm the app loads and the header shows v106.2.
3. Open Reports and confirm the annual tracker and expanded Vault Workbook controls appear.
4. Continue the v106 navigation, Calendar, Money, Activity, Tools, responsive-layout, backup, and restore checks.
5. Keep the v105 rescue page available until v106.2 is confirmed stable.
