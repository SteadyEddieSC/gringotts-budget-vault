# Gringotts Budget Vault Roadmap

## Shipped

### v119 — Profile Versioning & Dry-Run Diagnostics

- Added field-by-field comparison before an existing profile Update or portable-bundle Replace.
- Required explicit acknowledgement and confirmation before revision metadata is written.
- Added bounded metadata-only revision history under `gringottsImportProfileRevisions.v1`.
- Limited revision history to 60 total records and 8 per profile.
- Redacted local destination-account-label values from retained revision summaries.
- Added a local in-memory dry-run diagnostic before transaction writes.
- Excluded transaction rows, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents from dry-run downloads.
- Added rollback and read-back verification across profile and revision metadata.
- Preserved the v115 guarded writer, v117 exact profile compatibility, v118 bundle safeguards, six primary destinations, and stable v105 rescue page.

### v118 — Profile Portability & Institution Patterns

- Added versioned export of sanitized browser-local import-profile definitions.
- Removed local profile IDs and local creation/update timestamps from portable files.
- Rejected profile bundles containing transaction-shaped rows, source filenames, source fingerprints, balances, credentials, tokens, or full account-number fields.
- Added an in-memory import preview with exact, same-definition, identity-conflict, name-conflict, and new classifications.
- Required reviewed Add, Replace, or Skip decisions for every imported definition.
- Limited Replace to identity-matched saved profiles and preserved their local profile ID and original creation time.
- Restored the prior raw profile-library value if write or read-back verification fails.
- Added a saved-profile library that distinguishes profile name, destination label, pattern, and non-reversible header identity.
- Added fictional card-activity, deposit/withdrawal-ledger, and digital-wallet fixtures through the existing v115 parser.
- Added browser, Node, accessibility, responsive, observer-stability, privacy, and repository-security contracts.
- Preserved the six primary destinations, v115 guarded transaction writer, separate full restore, and stable v105 rescue page.

### v117 — Import Profiles & Field Validation

- Added browser-local, metadata-only mapping profiles under Tools → Import transactions.
- Keyed compatibility to format, schema, delimiter, a non-reversible ordered-header signature, and remembered mapped headers.
- Automatically applies only one exact-compatible profile and requires an explicit choice when several match.
- Added explicit Save New, Update, New, Apply, and Delete profile controls.
- Capped profile storage at 24 sanitized records with read-back verification.
- Added field-level explanations for dates, amounts, stable IDs, accounts, status, category, and type.
- Kept profile application in the in-memory import session and profile persistence separate from the household vault.
- Lazy-loaded profile code and CSS only after Tools → Import opens, preserving the initial request budget.
- Preserved the v115 parser, duplicate review, backup-first writer, rollback, read-back verification, restore destination, and v105 rescue page.

### v116 — UI Architecture Review

- Reconfirmed Dashboard, Money, Calendar, Reports, Activity, and Tools as the six durable primary destinations.
- Preserved the persistent shell and one live ES-module runtime.
- Changed Reports from an eight-page continuous screen preview to one selected report page at a time.
- Added a native report-page select plus Previous and Next controls.
- Preserved all eight pages for Print / Save PDF.
- Separated Tools → Import / Restore into explicit Import transactions and Restore full vault tasks.
- Added Inspect, Map, and Reconcile progress to bank import without adding storage or changing the v115 writer.
- Compacted Activity secondary navigation on narrow phones.
- Improved report-download and import layout across phone, tablet, laptop, and wide desktop sizes.

### v115 — Bank Export Import & Mapping

- Added local CSV, TSV, semicolon, pipe, OFX, QFX, QBO, and existing Gringotts JSON inspection.
- Added content and extension detection with unsupported PDF, Office, archive, executable, binary, oversized, malformed, and excessive-row blocking.
- Added explicit date, description, signed amount, debit, credit, status, account, memo, stable-ID, category, and type mapping.
- Added explicit date-order and signed-amount interpretation rather than silent guessing.
- Reused stable-ID, deterministic fingerprint, fuzzy, pending-to-posted, date coverage, and overlap review.
- Added backup-first, acknowledgement, confirmation, missing-only insertion, rollback, count verification, and inserted-token verification.
- Preserved full restore as a separate replacement workflow targeting `gringottsBudgetVault.latest`.
- Added metadata-only import receipts and expanded the Vault Workbook to 33 sheets.

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

### v120 — Import Receipt Audit & Rollback Guidance

Planned scope:

- provide a clearer local audit view for prior import receipts;
- relate each receipt to transaction counts, source metadata, and the backup requirement without storing transaction rows;
- explain which local backup should be used when manual rollback is necessary;
- add explicit verification guidance rather than automatic destructive rollback;
- preserve v119 revision history, dry-run privacy, v118 bundle safeguards, the v115 writer, and the stable v105 rescue page.

## Future import candidates

After field use is validated with real exports, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX transaction exports;
- a dedicated parser property-testing dependency when format diversity justifies it.

PDF statement extraction remains outside normal transaction import because OCR and table interpretation require a different review model.

## Future release themes

Potential later releases include scenario comparisons, recurring-cost decisions, account cleanup, close-history analysis, and other household-planning improvements supported by actual use.
