# Gringotts Budget Vault v105 — Bills, Recurring & Budget Intelligence

## Release purpose

v105 adds a dedicated household budget-intelligence workspace while preserving the working v104 month controls, annual tracker workflow, local-only architecture, and guarded restore process.

## Bills & Budget workspace

A new primary navigation tab provides:

- monthly category budgets;
- budget-versus-actual comparison;
- progress and over-budget warnings;
- suggested budgets based on up to three prior months;
- recurring-charge detection;
- Confirm, Exclude, and Reset review controls;
- recurring amount-change alerts;
- category tuning recommendations;
- six-month household spending trends.

The workspace uses the same selected month as Dashboard and Reports and includes Previous, Next, native month/year picker, and Latest controls.

## Category budgets

Budgets are stored locally under `gringottsBudgets.v1` and do not modify transaction rows.

Users can:

- choose an existing spending category or type a new category;
- save or update a monthly target;
- remove a target;
- accept a rounded suggestion based on recent spending;
- review actual spending, remaining amount, and over-budget status.

## Recurring-charge review

Recurring candidates are grouped using normalized merchant names and require at least two occurrences across multiple months unless explicitly confirmed.

User review states are stored locally under `gringottsRecurringPrefs.v1`:

- Candidate — automatically detected and not yet decided.
- Confirmed — intentionally treated as a recurring bill or subscription.
- Excluded — hidden from alerts but retained in the review list so it can be reset.

## Amount-change alerts

A recurring item is flagged when the latest charge differs from the previous charge by either:

- at least $2, or
- at least 5%.

Excluded recurring items do not produce alerts.

## Spending trends and tuning

- Six selected-month-relative months of household spending are displayed.
- Income and transfers are excluded.
- Categories over budget receive direct warnings.
- Categories with targets far below recent averages receive review guidance.
- Unbudgeted categories with recent history receive suggested monthly targets.

## Expanded Vault Workbook

The deeper Vault Workbook grows from 12 to 17 sheets by adding:

1. Budget vs Actual
2. Recurring Watch
3. Amount Changes
4. Spending Trends
5. Category Tuning

The preferred annual spouse-facing tracker from v104 remains unchanged and continues to be filled from a user-selected local template.

## Preserved safety and architecture

- Best-populated readable vault selection.
- No automatic empty-vault save.
- No transaction uploads.
- Budgets and recurring preferences remain browser-local settings.
- No service-worker registration, PWA cache, or offline cache.
- One live ES-module entry runtime.
- Guarded restore with backup warning, populated-array validation, preview, acknowledgment, confirmation, and read-back verification.
- Rules remain preview/review only for transaction rows.

## Source validation completed

- Both production shells were re-fetched and verified to load `src/runtime-v105-budget-intelligence.js?v=105budget1`.
- Runtime imports and event bindings were re-fetched from GitHub.
- Bills & Budget month navigation is bound after the view is rendered.
- Budget save/remove/suggestion and recurring Confirm/Exclude/Reset handlers are present.
- The amount alert threshold was verified as `$2 OR 5%`.
- The expanded workbook export is bound to the Reports Vault Workbook button.
- The roadmap was re-fetched and verified with v105 marked shipped.
- Static review found no transaction-network or service-worker registration code in the new v105 modules.

## Browser test checklist

1. Confirm the header reports v105.
2. Open Bills & Budget.
3. Test Previous, Next, month/year picker, and Latest.
4. Save a category budget.
5. Confirm budget-versus-actual and progress update immediately.
6. Remove the saved budget.
7. Use a suggested budget where available.
8. Confirm, exclude, and reset a recurring candidate.
9. Confirm excluded candidates stop appearing in amount-change alerts.
10. Review the six-month spending trend.
11. Open Reports and download the expanded Vault Workbook.
12. Confirm the workbook contains 17 sheets, including the five v105 intelligence sheets.
13. Confirm the annual household tracker still validates and downloads.
14. Confirm backup and JSON restore still work.
