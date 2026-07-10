# Gringotts Budget Vault Roadmap

## Shipped

### v116 — UI Architecture Review

- Reconfirmed Dashboard, Money, Calendar, Reports, Activity, and Tools as the six durable primary destinations.
- Preserved the persistent shell and one live ES-module runtime.
- Changed Reports from an eight-page continuous screen preview to one selected report page at a time.
- Added a native report-page select plus Previous and Next controls.
- Preserved all eight pages for Print / Save PDF.
- Separated Tools → Import / Restore into explicit **Import transactions** and **Restore full vault** tasks.
- Added Inspect, Map, and Reconcile progress to bank import without adding storage or changing the v115 writer.
- Compacted Activity secondary navigation on narrow phones.
- Improved report-download and import layout across phone, tablet, laptop, and wide desktop sizes.
- Added v116 export names, synthetic architecture tests, every-page axe coverage, visual contracts, and observer-stability checks.
- Preserved local data, restore destination, backup-first writes, rollback, read-back verification, and v105 rescue behavior.

### v115 — Bank Export Import & Mapping

- Added local CSV, TSV, semicolon, pipe, OFX, QFX, QBO, and existing Gringotts JSON inspection.
- Added content and extension detection with unsupported PDF, Office, archive, executable, binary, oversized, malformed, and excessive-row blocking.
- Added explicit date, description, signed amount, debit, credit, status, account, memo, stable-ID, category, and type mapping.
- Added explicit date-order and signed-amount interpretation rather than silent guessing.
- Reused stable-ID, deterministic fingerprint, fuzzy, pending-to-posted, date coverage, and overlap review.
- Added backup-first, acknowledgement, confirmation, missing-only insertion, rollback, count verification, and inserted-token verification.
- Preserved full restore as a separate replacement workflow targeting `gringottsBudgetVault.latest`.
- Added metadata-only import receipts and expanded the Vault Workbook to 33 sheets.
- Added browser-free Node parser tests and deterministic malformed-input mutations before browser installation.

### v114 — Guided Household Planning

- Added Activity → Plan without another primary destination.
- Added explainable actions from goals, close readiness, Vault Health, forecast pressure, debt, recurring changes, and insights.
- Stored checklist state separately under `gringottsGuidedPlan.v1` after explicit Save actions.
- Added an eighth printable report page and Planning History workbook content.

### v113 — Household Insights IV

- Added explainable merchant spikes, category increases, large first-seen merchants, and recurring-cost opportunities.
- Excluded pending rows from anomaly comparisons while reporting their count.
- Added visible evidence, baselines, comparison methods, and household decision questions.

### v112 — Accessibility & Quality Automation

- Added axe, keyboard, visual-contract, and Lighthouse merge gates.
- Added tab semantics, arrow-key navigation, accessible scroll regions, focus treatment, reduced motion, and high-contrast support.
- Added privacy-safe text and geometry contracts instead of committed financial screenshots.

### v111 — Household Reporting III

- Added selected-month, year-to-date, rolling 3/6/12-month, and custom report ranges.
- Added prior-year comparisons and six printable family-report pages.
- Expanded the workbook to 28 sheets and added range-aware exports.

### v110 — Month Close & Forecasting

- Added statement reconciliation, immutable close revisions, controlled reopen events, recurring bills/paydays, cash forecasts, debt planning, and promotional APR urgency.

### v109 — Import Memory & Duplicate Guard

- Added stable-ID and deterministic fingerprint duplicate protection, fuzzy review, coverage warnings, missing-only imports, backup-first writes, and verified import history metadata.

### v108.4 — Security Alert Cleanup

- Removed a CodeQL finding, tightened CodeQL permissions, updated pinned CodeQL Actions, and documented Scorecard dispositions.

### v108.3 — Security Completion

- Added Dependency Review, npm audit, OpenSSF Scorecard, full action pinning, security-drift tests, hardened Cloudflare headers, and the GitHub settings checklist.

### v108.2 — Public Repository Hardening

- Added full-history privacy and Gitleaks scans, CodeQL, Dependabot, public-data boundaries, and modern Node-compatible workflows.

### v108.1 — Playwright Testing Infrastructure

- Added synthetic browser tests for Chromium, Firefox, WebKit, iPad, Android, and iPhone/WebKit plus deployment smoke coverage.

### v108 — Goals & Vault Health

- Added goals, sinking funds, explicit health snapshots, an explainable Vault Health score, and a 20-sheet workbook.

### v107 — Review Queue & Performance

- Added persistent-shell rendering, vault caching, debounced search, compact month controls, and backup-first Review Queue editing.

### v106.2 — Reports Export Fix

- Corrected the missing `reportsView` re-export.

### v106.1 — Boot-Safe Hotfix

- Added visible boot failures, Retry, and the stable v105 rescue page.

### v106 — Calendar, Cash Flow & UI Consolidation

- Consolidated navigation into Dashboard, Money, Calendar, Reports, Activity, and Tools.

### v105 — Bills, Recurring & Budget Intelligence

- Added budgets, recurring review, amount-change alerts, trends, and the 17-sheet workbook.

### v104 — Household Reporting II

- Fixed month navigation and added local filling of the preferred annual tracker.

### v103 — Reports & Month Navigator

- Added shared month state, executive reporting, meeting packs, and local XLSX generation.

## Next release

### v117 — Import Profiles & Field Validation

- Store reviewed mapping preferences by local source schema and fingerprint family, not by transaction contents.
- Reapply prior mapping choices only when headers and format still match.
- Explain every remembered field choice and allow immediate correction.
- Improve field-level validation for dates, amount signs, IDs, account handling, status, category, and type.
- Add more synthetic institution-pattern fixtures without committing real exports.
- Preserve explicit duplicate review, backup-first writes, and read-back verification.

## Future import candidates

After field use is validated with real exports, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX transaction exports;
- a dedicated parser property-testing dependency when format diversity justifies it.

PDF statement extraction remains outside normal transaction import because OCR and table interpretation require a different review model.

## Future release themes

Potential later releases include:

- household scenario planning and what-if comparisons;
- recurring-cost decision tracking;
- account and merchant cleanup assistance;
- expanded close-history comparisons;
- selective performance profiling based on real browser diagnostics.

These are themes rather than commitments and must be validated against actual household use.

## Release governance

Every release follows `RELEASE_PROCESS.md`:

- build and review on a feature branch;
- freeze code, tests, and release documentation before the final matrix;
- use draft PR status for quiet development;
- run pure parser/static checks before browser installation;
- mark ready only when the release candidate is stable;
- preserve the final-head browser, accessibility, Lighthouse, privacy, supply-chain, and CodeQL matrix;
- squash-merge with an expected head SHA;
- verify production separately.

## Architecture guardrails

- Local-first transaction storage, parsing, processing, insights, planning, and UI preferences.
- No transaction uploads.
- Import source contents remain in memory and are not copied into receipts or profiles.
- Guided Plan metadata remains separate and never changes transaction calculations.
- Import and close history store metadata rather than redundant transaction copies.
- No committed screenshot baseline containing household data.
- No service worker, PWA cache, or offline cache.
- One live ES-module runtime chain.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad transaction writes.
- Restore destination remains exactly `gringottsBudgetVault.latest`.
