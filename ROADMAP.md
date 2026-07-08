# Gringotts Budget Vault Roadmap

## Shipped

### v108.2 — Public Repository Hardening

- Updated the repository documentation for public visibility and clarified the local-first data boundary.
- Added a security policy that forbids public disclosure of household financial data.
- Added a full-history privacy scanner for sensitive filenames and high-confidence financial identifiers.
- Added Gitleaks full-history secret scanning.
- Added CodeQL JavaScript security analysis.
- Added Dependabot for npm and GitHub Actions.
- Modernized GitHub Actions to Node 24-compatible action versions.
- Expanded future release gates to include Playwright, privacy-history, Gitleaks, CodeQL, and Cloudflare deployment smoke results.

### v108.1 — Playwright Testing Infrastructure

- Added locked Playwright dependencies and browser configuration.
- Added synthetic multi-month test data that never uses real household transactions.
- Added automated boot, navigation, responsive-layout, month-control, Review Queue, Goals, Reports, Backup, and Restore-safety tests.
- Added desktop Chromium, Firefox, WebKit, iPad, Android-phone, and iPhone/WebKit projects.
- Added GitHub Actions local-source testing and a retried post-deployment Cloudflare smoke test.
- Added failure screenshots, video, traces, HTML reports, and 14-day artifact retention.
- Established passing local and deployment browser tests as a future release gate.

### v108 — Goals & Vault Health

- Added Money → Goals & Health without creating another top-level destination.
- Added goals and sinking funds with target, current amount, monthly contribution, due date, notes, contribution updates, editing, archiving, and deletion.
- Added an explainable Vault Health score with visible deductions and actionable next steps.
- Added explicit Save Snapshot history; no health history is written merely by viewing the page.
- Added Goals, Vault Health, and Health History sheets to the deeper workbook, expanding it from 17 to 20 sheets.
- Changed Review Queue category, owner, and account fields to native select controls.
- Constrained the month selector to a compact desktop toolbar while preserving the compact phone layout.
- Preserved the persistent-shell performance improvements and parsed-vault cache from v107.

### v107 — Review Queue & Performance

- Added a compact phone month control.
- Replaced full-page shell reconstruction with persistent navigation and main-content-only rendering.
- Added parsed-vault caching, render coalescing, and debounced ledger searching.
- Added Activity → Review Queue with backup-first editing and verified transaction saves.

### v106.2 — Reports Export Fix

- Corrected the missing `reportsView` re-export that blocked v106 startup.

### v106.1 — Boot-Safe Hotfix

- Added visible loading, exact module error reporting, Retry, and the stable v105 rescue page.

### v106 — Calendar, Cash Flow & UI Consolidation

- Consolidated eleven top-level destinations into Dashboard, Money, Calendar, Reports, Activity, and Tools.
- Added responsive navigation, calendar day detail, cash-flow pressure warnings, and UI governance.

### v105 — Bills, Recurring & Budget Intelligence

- Added category budgets, recurring-charge review, amount-change alerts, trends, and the 17-sheet Vault Workbook.

### v104 — Household Reporting II

- Fixed month controls, removed informational pills, and added local filling of the preferred annual tracker.

### v103 — Reports & Month Navigator

- Added shared month state, executive reporting, meeting packs, and local XLSX generation.

## Next releases

### v109 — Import Memory & Duplicate Guard
- Exact transaction-ID protection.
- Fuzzy duplicate review and import history.
- Date-gap warnings and missing-only incremental imports.

### v110 — Month Close & Forecasting
- Statement reconciliation and close snapshots.
- Reopen workflow, household forecast, debt, and promotional APR planning.

### v111 — Household Reporting III
- Goal and health sections in family meeting packs.
- Custom report date ranges.
- Year-over-year reporting and cleaner PDF pagination.

### v116 — Planned UI Architecture Review
- Reassess primary and secondary navigation.
- Audit every page for useful, non-repetitive text.
- Re-test phone portrait, phone landscape, tablet, laptop, and wide desktop layouts.
- Review accessibility, touch targets, content density, and action placement.
- Consolidate or remove features that no longer justify separate surfaces.
- Perform earlier if the thresholds in `UI_GOVERNANCE.md` are reached.

## UI governance

Every release includes navigation, content-value, action-placement, responsive-layout, accessibility, and working-control review. Larger UI overhauls should occur about every 10 releases, within a 10–20 release range depending on feature growth.

## Testing governance

Future releases should pass:

- local Playwright desktop and responsive jobs before merge;
- full-history privacy and Gitleaks checks before merge;
- CodeQL without an unresolved release-blocking finding;
- the Cloudflare smoke test after production deployment.

Any intentionally unautomated manual checks must be listed explicitly.

## Architecture guardrails
- Local-first transaction storage and processing.
- No transaction uploads.
- Goal and health data remain separate browser-local settings.
- Health history is explicit, not automatically written by page views.
- Automated tests use synthetic browser-local data only.
- No service worker, PWA cache, or offline cache.
- One live ES-module entry runtime only.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad transaction writes.
- Report generation remains local and self-contained.
