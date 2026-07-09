# Gringotts Budget Vault Roadmap

## Shipped

### v114 — Guided Household Planning

- Added Activity → Plan without adding another top-level destination.
- Added deterministic checklist generation from goals, close readiness, Vault Health, forecast pressure, debt priorities, recurring-cost changes, and Household Insights.
- Added explicit reasons, evidence, recommended next steps, priority, and source-workflow navigation for every action.
- Added separate browser-local checklist state under `gringottsGuidedPlan.v1`.
- Added Not started, Planned, Done, and Dismissed states with owner, target date, notes, read-back verification, and explicit decision history.
- Kept viewing the checklist read-only; only Save Plan Item creates planning metadata.
- Added an eighth printable Guided Plan report page and fed priority actions into the family meeting brief.
- Added Guided Plan and Planning History workbook sheets, expanding the Vault Workbook from 30 to 32 sheets.
- Added a Guided Plan Markdown export and v114-named local workbook, meeting-pack, backup, calendar, rule-review, and diagnostics files.
- Added synthetic Playwright coverage for action generation, explicit writes, read-back verification, history, source navigation, no transaction changes, no network writes, reports, accessibility, and responsive layouts.
- Added staged release gates: draft PR suppression, Chromium-first browser preflights, quality preflight before axe, and failure-only diagnostics.
- Added `RELEASE_PROCESS.md` and `SCORECARD_ALERTS.md` to reduce release noise and explain OpenSSF findings.

### v113 — Household Insights IV

- Added Activity → Insights with explainable merchant spikes, category increases, large first-seen merchants, and recurring-cost opportunities.
- Excluded pending rows from anomaly comparisons while reporting their count.
- Added visible evidence, baselines, comparison factors, methods, and household decision questions.
- Added a seventh printable report page and Household Insights / Recurring Opportunities workbook sheets, expanding the workbook to 30 sheets.
- Preserved read-only insight generation and all local-first safeguards.

### v112 — Accessibility & Quality Automation

- Added axe, keyboard, visual-contract, and Lighthouse merge gates.
- Added tab semantics, arrow-key navigation, accessible scroll regions, focus treatment, reduced-motion, and high-contrast support.
- Added privacy-safe text/geometry contracts rather than committed financial-data screenshots.
- Added repository security-drift checks for action pinning, permissions, headers, and quality files.

### v111 — Household Reporting III

- Added selected-month, year-to-date, rolling 3/6/12-month, and custom report ranges.
- Added equivalent prior-year comparisons and six printable family-report pages.
- Expanded the workbook to 28 sheets and added range-aware CSV, Markdown, and XLSX exports.

### v110 — Month Close & Forecasting

- Added statement reconciliation, immutable close revisions, reasoned reopen events, recurring bills/paydays, 30/60/90-day forecasts, debt planning, and promotional APR urgency.
- Expanded the workbook to 24 sheets.

### v109 — Import Memory & Duplicate Guard

- Added stable-ID and deterministic fingerprint duplicate protection, fuzzy review, date coverage warnings, missing-only imports, backup-first writes, and verified import history metadata.

### v108.4 — Security Alert Cleanup

- Removed a CodeQL finding, tightened CodeQL permissions, updated pinned CodeQL actions, and documented Scorecard dispositions.

### v108.3 — Security Completion

- Added Dependency Review, npm audit, OpenSSF Scorecard, full action pinning, security-drift tests, hardened Cloudflare headers, and the GitHub settings checklist.

### v108.2 — Public Repository Hardening

- Added full-history privacy and Gitleaks scans, CodeQL, Dependabot, public-data boundaries, and modern Node-compatible workflows.

### v108.1 — Playwright Testing Infrastructure

- Added synthetic browser tests for Chromium, Firefox, WebKit, iPad, Android, and iPhone/WebKit plus deployment smoke coverage.

### v108 — Goals & Vault Health

- Added goals, sinking funds, explicit health snapshots, an explainable Vault Health score, and a 20-sheet workbook.

### v107 — Review Queue & Performance

- Added persistent-shell rendering, vault caching, debounced search, compact mobile month controls, and backup-first Review Queue editing.

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

## Next releases

### v115 — Bank Export Import & Mapping

- Add local import for CSV/delimited files, OFX, QFX, and QBO.
- Detect format and schema from content and extension.
- Add explicit date, description, amount/debit/credit, account, status, memo, and stable-ID mapping preview.
- Reuse v109 overlap, date coverage, stable-ID, fingerprint, pending-to-posted, and fuzzy duplicate review.
- Require backup-first guarded writes, acknowledgement, confirmation, read-back verification, and missing-only insertion.
- Add parser termination, malformed-input, size-limit, and fuzz/property-style tests where valuable.
- Evaluate CAMT.053/CAMT.054, MT940, institution-specific JSON, and XLSX only after parser-safety validation.
- Keep PDF statement extraction outside this release.
- See `BANK_IMPORT_ROADMAP.md`.

### v116 — Planned UI Architecture Review

- Reassess primary and secondary navigation.
- Audit every page for useful, non-repetitive content.
- Re-test phone portrait, phone landscape, tablet, laptop, and wide desktop layouts.
- Review accessibility, touch targets, density, and action placement.
- Consolidate or remove features that no longer justify separate surfaces.

## Release governance

Every release follows `RELEASE_PROCESS.md`:

- build and review on a feature branch;
- use draft PR status for quiet diff review;
- mark ready once the release candidate is stable;
- preserve the full final-head browser, accessibility, Lighthouse, privacy, supply-chain, and CodeQL matrix;
- squash-merge with an expected head SHA;
- verify production separately.

## Architecture guardrails

- Local-first transaction storage, processing, insights, and guided planning.
- No transaction uploads.
- Guided Plan metadata remains separate and never changes the vault or calculation inputs.
- Import and close history store metadata/summaries rather than redundant transaction copies.
- Report-range, forecast, debt, goal, health, and Guided Plan settings remain separate.
- No committed screenshot baselines containing household data.
- No service worker, PWA cache, or offline cache.
- One live ES-module runtime chain.
- Best-populated readable vault selection.
- Never auto-save an empty vault.
- Backup-first before destructive or broad transaction writes.
- Restore destination remains exactly `gringottsBudgetVault.latest`.
