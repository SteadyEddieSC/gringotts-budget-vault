# Gringotts Budget Vault v104 — Household Reporting II

## Corrective release

v104 fixes the non-working month controls from v103 and replaces informational pills with quieter inline status text.

## Month control fix

The v103 root cause was render order: month handlers were attached before the Dashboard or Reports markup had been inserted into the page. v104 now renders the active view first and only then binds Previous, Next, Latest, and native month-picker handlers.

The month input also invokes the browser picker from a direct pointer interaction when `showPicker()` is supported.

## Preferred household tracker

The Reports Center now supports the uploaded six-sheet annual income-and-expense tracker as the preferred spouse-facing report.

For privacy and template ownership, the workbook itself is not embedded in the public repository. The user chooses their local `.xlsx` copy and the app fills a downloaded copy entirely in the browser.

The filler:

- validates Setup, Transactions, Annual Overview, and Month Overview sheets;
- replaces all old transaction values in the template;
- writes up to 10,000 dated transactions;
- updates income and expense categories in Setup;
- uses Income for inflows and Expense for all other cash movement to match the template's two-type design;
- preserves formulas, charts, styling, instructions, validations, and workbook relationships;
- sets Annual Overview to January of the selected year;
- sets Month Overview to the currently selected app month;
- forces workbook recalculation on open;
- removes malformed empty person metadata found in the uploaded workbook;
- never uploads or publishes the selected template.

The existing lightweight five-column report remains available as Quick Transactions Export. The curated 12-sheet Vault Workbook remains available separately.

## UI cleanup

- Removed informational pill treatments from dashboard, reports, ledger, planning, rules, calendar, import, exports, diagnostics, and roadmap views.
- Changed the header version to small inline text rather than a pill.
- Replaced workbook-sheet pills with a normal list.

## Safety boundaries preserved

- Best-populated readable vault selection.
- No empty-vault autosave.
- Guarded JSON restore with backup warning, validation, acknowledgment, confirmation, and read-back verification.
- No transaction uploads.
- No service-worker registration or offline cache.
- One live ES-module entry runtime.

## Validation performed

- Root-cause review confirmed the v103 handler-order defect.
- Annual template parser successfully opened the uploaded workbook locally.
- The test fill wrote 959 dated transactions.
- Generated package passed ZIP integrity validation.
- Required workbook parts, formulas, charts, relationships, and sheets were retained.
- Old person metadata was removed from the generated copy.

## Browser checklist

1. Confirm the page says v104.
2. Test Previous and Next on Dashboard.
3. Tap the displayed month and select another month/year.
4. Test Latest.
5. Repeat all four controls in Reports.
6. Confirm informational pills are gone.
7. In Reports, select the annual tracker `.xlsx` template.
8. Confirm the template validates and shows the transaction count.
9. Download the filled annual tracker.
10. Open it and confirm Transactions, Setup, Annual Overview, Month Overview, formulas, and charts.
11. Confirm backup and JSON restore still work.
