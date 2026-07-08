# Gringotts Budget Vault v106 — Calendar, Cash Flow & UI Consolidation

## Release purpose

v106 prevents the interface from becoming a collection of unrelated permanent tabs while delivering the planned calendar and cash-flow release.

The release preserves the working v105 budgets, recurring-charge intelligence, annual tracker, expanded Vault Workbook, rules review, guarded restore, and local-first data model.

## Primary navigation consolidation

Eleven top-level destinations were consolidated into six user-goal destinations:

1. **Dashboard** — selected-month household overview and report-quality signals.
2. **Money** — Budget & Recurring plus Bills & Paydays.
3. **Calendar** — bills, paydays, transaction activity, day details, and cash-flow pressure.
4. **Reports** — annual household tracker, expanded Vault Workbook, executive report, and meeting pack.
5. **Activity** — Transactions and Rules.
6. **Tools** — Import/Restore, Exports & Backup, Diagnostics, and Roadmap.

Secondary navigation keeps related features together without adding more permanent top-level buttons.

## Header and backup placement

- Removed Download Backup from the header.
- Removed the Dashboard backup shortcut.
- Backup remains available under **Tools → Exports & Backup**.
- The backup action remains inside **Tools → Import / Restore** because it is a required safety step in that workflow.

## Phone, tablet, and desktop behavior

- Desktop displays the six primary destinations in a stable navigation row.
- Phone and tablet layouts display a compact header Menu button.
- The responsive menu uses two columns on narrow screens and closes after navigation rerenders.
- Secondary navigation uses rectangular controls rather than informational pills.
- Dense tables scroll inside their own containers.
- Calendar day detail stacks beneath the calendar on tablet-sized screens.
- The phone calendar retains a full seven-day grid inside its own horizontal scroll container instead of forcing the entire page to overflow.
- Touch targets remain large enough for phone and tablet use.

## Calendar and cash-flow features

The new Calendar page includes:

- shared Previous, Next, native month/year picker, and Latest controls;
- full selected-month calendar grid;
- scheduled bills;
- scheduled paydays;
- transaction counts and daily household spending;
- clickable day detail;
- selected-day income, spending, and scheduled net;
- up to 20 selected-day transaction rows;
- scheduled bill and payday totals;
- ICS download and clipboard copy;
- a direct link to Money → Bills & Paydays.

## Cash-flow pressure warnings

Pressure days use saved scheduled bills and paydays only.

The calculation:

1. sorts scheduled bill and payday dates within the selected month;
2. begins with a scheduled balance of zero;
3. adds paydays and subtracts bills by date;
4. flags dates where the running scheduled balance falls below zero.

The interface explicitly states that this does not include an opening bank-account balance, so the warning is planning guidance rather than a definitive overdraft prediction.

## Page-copy cleanup

- Shortened the Dashboard introduction.
- Replaced the longer restore explanation on Dashboard with a concise data-safety explanation.
- Kept detailed restore warnings only inside the Restore workflow.
- Calendar text explains actions, limitations, and next steps rather than restating headings.
- Diagnostics text was reduced to runtime, vault, service-worker, and privacy facts.

## UI governance

Added `UI_GOVERNANCE.md` with a mandatory release-level quality gate covering:

- navigation fit;
- content value;
- action placement;
- responsive behavior;
- feature consolidation;
- accessibility;
- informational-pill avoidance;
- working-control review.

A deeper UI architecture review is scheduled approximately every 10 releases, within the requested 10–20 release range. The next planned review is v116, with earlier review required when complexity or usability thresholds are reached.

## Preserved capabilities

- v105 category budgets and suggestions.
- recurring Confirm, Exclude, and Reset controls.
- recurring amount-change alerts.
- six-month spending trends.
- 17-sheet expanded Vault Workbook.
- preferred annual spouse-facing tracker.
- transaction ledger and rules review.
- guarded local JSON restore.
- best-populated readable vault selection.
- no automatic empty-vault save.

## Architecture and privacy boundaries

- No transaction uploads.
- No service-worker registration or offline cache.
- One live ES-module entry runtime.
- Budgets, recurring preferences, bills, paydays, and navigation state remain local.
- Backup-first restore protections remain intact.

## Validation completed

- New v106 calendar, view, and runtime modules passed JavaScript syntax checks before publication.
- Both production shells were updated to load `src/runtime-v106-calendar-ui.js?v=106calendarui1`.
- Both shells load the shared `styles/main.css` and the responsive `styles/v106.css` layer.
- The Dashboard source removes the backup shortcut rather than redirecting it.
- The Reports page continues to use v105's expanded 17-sheet workbook view and exporter.
- The v106 runtime binds navigation, secondary navigation, month controls, calendar day selection, budgets, recurring review, reports, restore, exports, rules, and diagnostics after rendering.
- Cash-flow pressure logic was refined to flag only negative running scheduled balances.
- The roadmap and UI governance documents were published.

## Browser test checklist

1. Confirm the header shows v106.
2. Confirm the header has no Download Backup button.
3. Confirm the primary destinations are Dashboard, Money, Calendar, Reports, Activity, and Tools.
4. On phone and tablet, open and close the Menu button.
5. Confirm no full-page horizontal overflow occurs.
6. Open Money and switch between Budget & Recurring and Bills & Paydays.
7. Confirm v105 budgets and recurring controls still work.
8. Open Calendar and test Previous, Next, the native month/year picker, and Latest.
9. Select several calendar days and confirm the day-detail panel changes.
10. Confirm bills, paydays, transaction counts, and spending appear on appropriate dates.
11. Add a bill and payday under Money → Bills & Paydays, then confirm they appear on Calendar.
12. Test Download ICS and Copy ICS.
13. Open Activity and switch between Transactions and Rules.
14. Open Tools and switch among Import/Restore, Exports & Backup, Diagnostics, and Roadmap.
15. Confirm Backup downloads from Tools → Exports & Backup.
16. Confirm the Restore backup action still works.
17. Download the expanded Vault Workbook and confirm its 17 sheets.
18. Fill and download the preferred annual household tracker.
19. Check phone portrait, phone landscape, tablet, laptop, and desktop layouts.
