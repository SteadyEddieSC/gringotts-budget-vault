# Gringotts Budget Vault Roadmap

## Shipped

### v107 — Review Queue & Performance

- Added a compact phone month control that keeps Previous, selected month, Next, Latest, and transaction count in a tighter responsive layout.
- Replaced full-page shell reconstruction with a persistent header/navigation shell and main-content-only rendering.
- Added requestAnimationFrame render coalescing and debounced ledger searching.
- Added parsed-vault caching with explicit invalidation after verified vault writes.
- Added Activity → Review Queue for one-transaction-at-a-time mobile review.
- Added Previous/Next review controls, category/owner/account/notes editing, and rule suggestions.
- Added backup-first editing: enabling edits downloads a JSON backup and attempts a local recovery snapshot.
- Added verified single-row saves and a guarded categorized-only batch review action.
- Preserved the boot-safe error screen and stable v105 rescue page.

### v106.2 — Reports Export Fix

- Corrected the missing `reportsView` re-export that blocked v106 startup.
- Advanced production cache keys while retaining the boot-safe loader.

### v106.1 — Boot-Safe Hotfix

- Added visible loading and exact on-page module error reporting.
- Added Retry and a standalone stable v105 rescue page.

### v106 — Calendar, Cash Flow & UI Consolidation

- Consolidated eleven top-level destinations into Dashboard, Money, Calendar, Reports, Activity, and Tools.
- Added responsive phone/tablet navigation, full calendar day detail, and cash-flow pressure warnings.
- Moved Backup out of the header and Dashboard hero.
- Added project UI governance and scheduled the next deeper architecture review for about v116.

### v105 — Bills, Recurring & Budget Intelligence

- Added category budgets, recurring-charge review, amount-change alerts, trends, and the 17-sheet Vault Workbook.

### v104 — Household Reporting II

- Fixed month controls, removed informational pills, and added local filling of the preferred annual tracker.

### v103 — Reports & Month Navigator

- Added shared month state, executive reporting, meeting packs, and local XLSX generation.

## Next releases

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

Every release includes navigation, content-value, action-placement, responsive-layout, accessibility, and working-control review. Larger UI overhauls should occur about every 10 releases, within a 10–20 release range depending on feature growth.

## Architecture guardrails
- Local-first transaction storage and processing.
- No transaction uploads.
- No service worker, PWA cache, or offline cache.
- One live ES-module entry runtime only.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad write operations.
- Report generation remains local and self-contained.
