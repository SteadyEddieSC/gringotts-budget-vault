# Gringotts Budget Vault Roadmap

## Shipped

### v106 — Calendar, Cash Flow & UI Consolidation

- Consolidated eleven top-level destinations into six: Dashboard, Money, Calendar, Reports, Activity, and Tools.
- Added responsive phone/tablet menu behavior instead of a horizontally overflowing navigation strip.
- Moved Backup out of the header and Dashboard hero into Tools → Exports & Backup while retaining the guarded Restore backup action.
- Grouped budgets, recurring charges, bills, and paydays under Money.
- Grouped transactions and rules under Activity.
- Grouped Import/Restore, Exports & Backup, Diagnostics, and Roadmap under Tools.
- Added a full selected-month calendar with clickable day detail.
- Added bills, paydays, transaction activity, scheduled totals, and cash-flow pressure warnings.
- Added a project UI governance standard with a release-level quality gate.
- Scheduled the next deeper UI architecture review for approximately v116, or earlier if complexity thresholds are reached.

### v105 — Bills, Recurring & Budget Intelligence

- Added monthly category budgets, budget-versus-actual progress, and three-month suggestions.
- Added recurring-charge Confirm, Exclude, and Reset controls.
- Added recurring amount-change alerts using a $2 or 5% threshold.
- Added six-month household spending trends and category tuning.
- Expanded the deeper Vault Workbook from 12 to 17 sheets.

### v104 — Household Reporting II

- Fixed Previous, Next, Latest, and native month/year picker controls.
- Removed informational pills and changed the header version to quiet inline text.
- Added local filling of the preferred six-sheet annual income-and-expense tracker template.

### v103 — Reports & Month Navigator

Introduced shared month state, executive summary, family meeting-pack preview, Quick Transactions XLSX, curated Vault Workbook XLSX, and browser-local report generation.

## Next releases

### v107 — Review Queue II
- One-transaction-at-a-time mobile review.
- Forward/back controls.
- Guarded category, owner, account, and notes edits.
- Rule suggestions and backup-first batch review.

### v108 — Goals & Vault Health
- Goals and sinking funds.
- Vault Health score and history.
- Actionable next steps and workbook sheets.

### v109 — Import Memory & Duplicate Guard
- Exact transaction-ID protection.
- Fuzzy duplicate review and import history.
- Date-gap warnings and missing-only incremental imports.

### v110 — Month Close & Forecasting
- Statement reconciliation and close snapshots.
- Reopen workflow, household forecast, debt, and promotional APR planning.

### v116 — Planned UI Architecture Review
- Reassess primary and secondary navigation.
- Audit every page for useful, non-repetitive text.
- Re-test phone portrait, phone landscape, tablet, laptop, and wide desktop layouts.
- Review accessibility, touch targets, content density, and action placement.
- Consolidate or remove features that no longer justify separate surfaces.
- Perform earlier if the thresholds in `UI_GOVERNANCE.md` are reached.

## UI governance

Every release now includes a navigation, content-value, action-placement, responsive-layout, accessibility, and working-control review. Larger UI overhauls should occur approximately every 10 releases, within a 10–20 release range depending on feature growth.

## Architecture guardrails
- Local-first transaction storage and processing.
- No transaction uploads.
- Budgets and recurring preferences remain local browser settings.
- User-selected report templates remain local and are not published by the app.
- No service worker, PWA cache, or offline cache.
- One live ES-module entry runtime only.
- Same-origin helper modules are implementation details, not stacked runtimes.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad write operations.
- Report generation remains local and self-contained.

## Historical roadmap record

Earlier v60–v70 planning included Differential Pull Studio, Rules Engine II, Cash-Flow Command Center, Debt Payoff Planner, Receipt & Evidence Vault, Family Budget Briefing, PWA hardening, UI Overhaul III, Import Connectors, Household Goals, and Shared Household Handoff. Those ideas have been retained, reordered, or superseded by the current v107–v116 plan.
