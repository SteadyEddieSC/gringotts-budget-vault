# Gringotts Budget Vault Roadmap

## Shipped

### v104 — Household Reporting II

- Fixed Previous, Next, Latest, and native month/year picker controls by correcting render/bind order.
- Removed informational pills and changed the header version to quiet inline text.
- Added local filling of the preferred six-sheet annual income-and-expense tracker template.
- Preserved formulas, charts, styling, category setup, annual overview, and monthly overview.
- Kept the Quick Transactions export and the curated Vault Workbook as separate reports.

### v103 — Reports & Month Navigator

Introduced shared month state, executive summary, family meeting-pack preview, Quick Transactions XLSX, curated 12-sheet Vault Workbook XLSX, and browser-local report generation. Its month control binding defect was corrected in v104.

## Next releases

### v105 — Bills, Recurring & Budget Intelligence
- Bill and subscription amount-change alerts.
- Budget versus actual tracking.
- Category tuning suggestions.
- Recurring-charge confirmation and exclusion controls.
- Spending trend cards.

### v106 — Calendar & Cash-Flow II
- Full month/week/day calendar.
- Clickable day detail.
- Bills, paydays, and selected transaction events.
- Improved ICS controls and cash-flow warning days.

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

## Architecture guardrails
- Local-first transaction storage and processing.
- No transaction uploads.
- User-selected report templates remain local and are not published by the app.
- No service worker, PWA cache, or offline cache.
- One live ES-module entry runtime only.
- Same-origin helper modules are implementation details, not stacked runtimes.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad write operations.
- Report generation remains local and self-contained.

## Historical roadmap record

Earlier v60–v70 planning included Differential Pull Studio, Rules Engine II, Cash-Flow Command Center, Debt Payoff Planner, Receipt & Evidence Vault, Family Budget Briefing, PWA hardening, UI Overhaul III, Import Connectors, Household Goals, and Shared Household Handoff. Those ideas have been retained, reordered, or superseded by the current v105–v110 plan.
