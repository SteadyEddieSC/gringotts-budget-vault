# v111 — Household Reporting III

## Release purpose

v111 turns the Reports Center into a range-aware household reporting workspace while preserving selected-month exports, the annual tracker workflow, the v110 month-close and planning features, and all local-first safeguards.

No new top-level destination is added.

## Report ranges

The Reports Center supports:

- selected month;
- year to date through the selected month;
- rolling 3 months;
- rolling 6 months;
- rolling 12 months;
- custom start and end dates.

The chosen range is stored separately under `gringottsReportRange.v1`. Saving or changing a report range does not alter transactions, selected-month data, goals, close history, forecasts, or debt plans.

Custom ranges validate both dates, prevent reversed ranges, and limit a report to ten years.

## Year-over-year reporting

An optional comparison uses the equivalent prior-year dates. Leap-day ranges are clamped safely when the prior year has no February 29.

The report compares:

- transactions;
- income;
- household spending;
- net household cash flow;
- pending transactions;
- review-queue items.

Monthly rows align each current month with the matching prior-year month. Reports explicitly distinguish higher, lower, unchanged, and missing prior baselines.

## Complete family report

The on-screen and printable report now includes six logical report pages:

1. family financial executive summary;
2. year-over-year comparison and monthly trend;
3. category, merchant, account/owner, and report-quality breakdowns;
4. goals and Vault Health;
5. month-close, forecast, and debt planning;
6. family meeting questions, wins, risks, and action items.

The family meeting logic uses report-range metrics plus goals, Vault Health, close drift, forecast pressure, negative-balance days, debt priority, promotional payoff gaps, and year-over-year spending direction.

## PDF and print layout

Print controls and navigation are excluded from printed output. Report pages use explicit page breaks, print-safe colors, reduced table density, and break-inside protection for cards and meeting sections.

The existing Print / Save PDF browser action remains local and does not upload report content.

## Downloads

- The Vault Workbook expands from 24 to 28 sheets.
- New sheets:
  1. Report Range;
  2. Range Transactions;
  3. Year over Year;
  4. Family Meeting Brief.
- Range CSV uses the active report dates.
- Executive Markdown uses the active report dates and prior-year context.
- Family Meeting Markdown includes goals, health, close, forecast, and debt sections.
- The quick XLSX and preferred annual tracker remain selected-month workflows.

## Runtime and architecture

- One live boot path: `src/boot-v111.js`.
- One live runtime: `src/runtime-v111-reporting.js`.
- One new local settings key: `gringottsReportRange.v1`.
- The corrected subtitle remains `Mischief Managed. Money Managed`.
- Existing transactions, import history, close history, goals, health snapshots, forecasts, debts, rules, budgets, bills, and paydays remain compatible.
- The guarded restore destination remains `gringottsBudgetVault.latest`.
- `rescue-v105.html` remains unchanged.
- No service worker, PWA cache, bridge runtime, compatibility overlay, transaction upload, or report upload was added.

## Synthetic automated coverage

Playwright covers:

- v111 boot and corrected subtitle;
- complete report-page rendering;
- custom range persistence;
- year-to-date resolution from the selected month;
- equivalent prior-year comparisons using fictional rows generated in test memory;
- goals, Vault Health, forecast, and debt context;
- 28-sheet workbook and range CSV downloads;
- print-media control hiding and report-page visibility;
- no network writes from report-range actions;
- phone, tablet, and desktop overflow;
- all existing import, restore, close, forecast, debt, review, goal, security, and privacy tests.

## Release gate

Before merge, require:

1. Local source — desktop;
2. Local source — responsive;
3. Full history privacy and secret scan;
4. JavaScript security analysis;
5. Dependency Review;
6. npm audit.

After merge, require the Cloudflare deployment smoke test and re-fetch the deployed v111 entry, runtime, reporting engine, and stylesheet.
