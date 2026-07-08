# Gringotts Budget Vault Roadmap

## Shipped

### v111 — Household Reporting III

- Added selected-month, year-to-date, rolling 3/6/12-month, and custom report ranges.
- Added a separate browser-local report-range key that never copies or mutates transactions.
- Added equivalent prior-year comparison metrics and aligned monthly rows.
- Rebuilt the Reports Center around six complete family-report pages.
- Added goals, Vault Health, close status, forecast pressure, debt priority, promotional payoff gaps, questions, wins, risks, and actions to family reports.
- Added print-only page breaks, print-safe colors, reduced table density, and card break protection.
- Expanded the Vault Workbook from 24 to 28 sheets with Report Range, Range Transactions, Year over Year, and Family Meeting Brief.
- Added range-aware CSV, Executive Markdown, Family Meeting Markdown, and XLSX filenames.
- Preserved selected-month quick XLSX and annual-tracker workflows.
- Added synthetic Playwright coverage for ranges, prior-year rows, full family context, print media, downloads, no network writes, and responsive layouts.

### v110 — Month Close & Forecasting

- Corrected the live subtitle to `Mischief Managed. Money Managed`.
- Added account-level statement reconciliation with posted counts, signed activity, explained differences, and stale-signature detection.
- Added close blockers for pending, unreviewed, missing, stale, and unexplained reconciliation conditions.
- Added immutable close revisions containing summary data and transaction signatures without redundant full transaction copies.
- Added controlled reopen events that require a reason and preserve prior close revisions.
- Added one-time, weekly, biweekly, and monthly bill/payday schedules.
- Added 30-, 60-, and 90-day cash forecasts with starting cash, minimum buffer, flexible spending, pressure days, and projected monthly balances.
- Added debt and promotional APR planning with payoff-pace, interest, urgency, priority, and local payment tracking.
- Expanded the Vault Workbook from 20 to 24 sheets with Month Close, Reconciliations, Cash Forecast, and Debt Plan.
- Added synthetic Playwright coverage for close, reopen, forecast, debt, no transaction mutation, and responsive layouts.

### v109 — Import Memory & Duplicate Guard

- Added exact duplicate protection using stable transaction IDs and deterministic fallback fingerprints.
- Added explainable fuzzy duplicate review for near-date merchant matches and pending-to-posted candidates.
- Added native Keep incoming, Skip incoming, and Defer/review decisions; ambiguous matches are never discarded automatically.
- Added date coverage, overlap, and missing-month warnings before any write.
- Added missing-only incremental import into a selected populated readable vault.
- Added required pre-import backup, explicit acknowledgement, confirmation, read-back count verification, and inserted-token verification.
- Added browser-local import history metadata without redundant transaction copies.
- Added synthetic Playwright coverage for all-new, exact, mixed fuzzy/new, invalid, empty, metadata, network, and responsive cases.
- Preserved guarded full restore, best-populated-readable-vault selection, the v105 rescue page, and all existing browser-local data.

### v108.4 — Security Alert Cleanup

- Removed the obsolete no-op month-label replacement identified by CodeQL while preserving label behavior.
- Changed the CodeQL workflow to read-only defaults with job-scoped `security-events: write` access.
- Updated the pinned CodeQL Action and Scorecard SARIF uploader to v4.37.0 by full commit SHA.
- Added a regression test that enforces least-privilege CodeQL permissions.
- Documented which OpenSSF Scorecard findings were corrected, stale pending refresh, or accepted for this solo-maintainer project.
- Preserved the visible v108 application runtime and all browser-local data safeguards.

### v108.3 — Security Completion

- Added Dependency Review for vulnerable dependency changes in pull requests.
- Added a High/Critical `npm audit` merge gate with lifecycle scripts disabled during installation.
- Added OpenSSF Scorecard supply-chain analysis and code-scanning publication.
- Pinned every external GitHub Action to a full trusted commit SHA.
- Added automated action-pinning, workflow-permission, required-file, and security-header drift tests.
- Added a restrictive Cloudflare Content Security Policy, clickjacking protection, worker blocking, cross-origin policies, and expanded Permissions Policy.
- Extended the live Cloudflare smoke test to validate deployed security headers.
- Added an exact manual GitHub settings checklist for rulesets, Actions, security toggles, integrations, and account protection.

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

### v112 — Accessibility & Quality Automation
- Add axe-core accessibility scans to Playwright.
- Add Lighthouse CI performance, accessibility, best-practice, and SEO budgets.
- Add selective visual regression snapshots for the most important desktop and phone layouts.
- Keep synthetic data and local-first boundaries in every quality check.

### v113 — Household Insights IV
- Add explainable anomaly and unusual-spending review.
- Add recurring-cost opportunity summaries and household decision prompts.
- Feed insights into the report center without silently changing categories or transactions.

### v116 — Planned UI Architecture Review
- Reassess primary and secondary navigation.
- Audit every page for useful, non-repetitive text.
- Re-test phone portrait, phone landscape, tablet, laptop, and wide desktop layouts.
- Review accessibility, touch targets, content density, and action placement.
- Consolidate or remove features that no longer justify separate surfaces.
- Perform earlier if the thresholds in `UI_GOVERNANCE.md` are reached.

## UI governance

Every release includes navigation, content-value, action-placement, responsive-layout, accessibility, and working-control review. Larger UI overhauls should occur about every 10 releases, within a 10–20 release range depending on feature growth.

## Testing and security governance

Future releases should pass:

- local Playwright desktop and responsive jobs before merge;
- repository security-drift tests before merge;
- full-history privacy and Gitleaks checks before merge;
- Dependency Review and `npm audit` before merge;
- CodeQL without an unresolved release-blocking finding;
- the Cloudflare smoke test after production deployment.

OpenSSF Scorecard is reviewed as a continuing supply-chain improvement signal. Any intentionally unautomated manual checks must be listed explicitly.

## Architecture guardrails
- Local-first transaction storage and processing.
- No transaction uploads.
- Import history stores metadata only under a separate browser-local key.
- Report-range settings remain separate and never contain transaction copies.
- Month-close history stores summaries and deterministic signatures rather than redundant transactions.
- Forecast and debt planning remain separate browser-local data.
- Goal and health data remain separate browser-local settings.
- Health history is explicit, not automatically written by page views.
- Automated tests use synthetic browser-local data only.
- No service worker, PWA cache, or offline cache.
- One live ES-module entry runtime only.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad transaction writes.
- Report generation remains local and self-contained.
