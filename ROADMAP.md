# Gringotts Budget Vault Roadmap

This roadmap separates shipped work from the forward planning horizon. The next planned release is the strongest commitment. Later releases are directional and may move when real household use, testing, or safety findings reveal a better order.

## Shipped

### v120 — Import Receipt Audit & Rollback Guidance

- Added a read-only audit view over existing metadata-only import receipts.
- Reconciled incoming, inserted, skipped, destination-before, and destination-after counts.
- Added verification-result, source-date-range, warning-count, and current-destination comparison checks.
- Identified whether the guarded writer required a pre-import backup and showed the expected `Gringotts_v115_pre_import_<count>_*.json` filename pattern.
- Added a sanitized receipt-audit download that excludes transaction rows, filenames, fingerprints, mappings, destination keys, account identifiers, merchants, and vault contents.
- Added copyable manual rollback guidance and a link into the separate full-restore task.
- Explicitly kept automatic rollback unavailable.
- Replaced the single-next-release Roadmap screen with a detailed v120–v126 horizon containing capabilities, dependencies, safety boundaries, and expected outcomes.
- Preserved the v115 guarded writer, v119 revision and dry-run safeguards, six primary destinations, one live runtime, and stable v105 rescue.

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

### v117 — Import Profiles & Field Validation

- Added browser-local, metadata-only mapping profiles under Tools → Import transactions.
- Keyed compatibility to format, schema, delimiter, a non-reversible ordered-header signature, and remembered mapped headers.
- Automatically applies only one exact-compatible profile and requires an explicit choice when several match.
- Added explicit Save New, Update, New, Apply, and Delete profile controls.
- Capped profile storage at 24 sanitized records with read-back verification.
- Added field-level explanations for dates, amounts, stable IDs, accounts, status, category, and type.
- Kept profile application in the in-memory import session and profile persistence separate from the household vault.
- Lazy-loaded profile code and CSS only after Tools → Import opens, preserving the initial request budget.

### v116 — UI Architecture Review

- Reconfirmed Dashboard, Money, Calendar, Reports, Activity, and Tools as the six durable primary destinations.
- Preserved the persistent shell and one live ES-module runtime.
- Changed Reports from an eight-page continuous screen preview to one selected report page at a time.
- Added a native report-page select plus Previous and Next controls.
- Preserved all eight pages for Print / Save PDF.
- Separated Tools → Import / Restore into explicit Import transactions and Restore full vault tasks.
- Added Inspect, Map, and Reconcile progress to bank import without adding storage or changing the v115 writer.
- Compacted Activity secondary navigation on narrow phones.

### v115 — Bank Export Import & Mapping

- Added local CSV, TSV, semicolon, pipe, OFX, QFX, QBO, and existing Gringotts JSON inspection.
- Added content and extension detection with unsupported PDF, Office, archive, executable, binary, oversized, malformed, and excessive-row blocking.
- Added explicit date, description, signed amount, debit, credit, status, account, memo, stable-ID, category, and type mapping.
- Added explicit date-order and signed-amount interpretation rather than silent guessing.
- Reused stable-ID, deterministic fingerprint, fuzzy, pending-to-posted, date coverage, and overlap review.
- Added backup-first, acknowledgement, confirmation, missing-only insertion, rollback, count verification, and inserted-token verification.
- Preserved full restore as a separate replacement workflow targeting `gringottsBudgetVault.latest`.
- Added metadata-only import receipts and expanded the Vault Workbook to 33 sheets.

### v114 through v103

- **v114 — Guided Household Planning:** explainable actions from goals, close readiness, Vault Health, forecast, debt, recurring changes, and insights; checklist state stored separately after explicit Save actions.
- **v113 — Household Insights IV:** explainable merchant/category anomalies and recurring-cost opportunities with visible evidence and pending-row exclusions.
- **v112 — Accessibility & Quality Automation:** axe, keyboard, visual-contract, Lighthouse, focus, reduced-motion, and high-contrast merge gates.
- **v111 — Household Reporting III:** reusable report ranges, prior-year comparisons, printable family reports, and range-aware exports.
- **v110 — Month Close & Forecasting:** statement reconciliation, immutable closes, controlled reopen events, bills/paydays, forecasts, and debt planning.
- **v109 — Import Memory & Duplicate Guard:** stable-ID/fingerprint duplicate protection, fuzzy review, coverage warnings, backup-first missing-only writes, and receipt metadata.
- **v108.4–v108.1:** security alert cleanup, dependency and Scorecard controls, privacy scanning, CodeQL, Dependabot, and cross-browser Playwright infrastructure.
- **v108 — Goals & Vault Health:** goals, sinking funds, health snapshots, an explainable score, and workbook expansion.
- **v107 — Review Queue & Performance:** persistent shell, vault caching, debounced search, compact month controls, and backup-first review edits.
- **v106.2–v106:** reports and boot fixes, visible failure recovery, stable rescue, Calendar/Cash Flow, and consolidated navigation.
- **v105 — Bills, Recurring & Budget Intelligence:** budgets, recurring review, amount-change alerts, trends, and workbook expansion.
- **v104 — Household Reporting II:** month-navigation correction and local annual-tracker filling.
- **v103 — Reports & Month Navigator:** shared month state, executive reporting, meeting packs, and local XLSX generation.

## Forward planning horizon

## v121 — Receipt Integrity & Import Batch Reconciliation

**Purpose:** Make it easier to confirm that every completed import has a coherent receipt and that sequential imports can be followed without copying transaction rows into audit storage.

**Planned capabilities**

- Add metadata-only batch lineage and receipt-timeline filters.
- Identify missing, duplicated, legacy, or internally inconsistent receipt fields.
- Relate a v119 dry-run readiness signature to the resulting receipt where a safe metadata link is available.
- Expand the workbook receipt sheet with integrity state, batch ordering, and plain-language explanations.
- Add filters for verified, verified-with-notes, needs-review, no-change, and backup-expected receipts.

**Depends on**

- v120 receipt arithmetic and backup guidance.
- v119 dry-run signatures and privacy boundaries.
- Real household feedback from reviewing multiple imports over time.

**Safety boundaries**

- No automatic receipt repair or inferred transaction changes.
- No row-level transaction history duplicated into receipt storage.
- Legacy receipts remain readable and clearly labeled when fields are unavailable.
- Batch links must use metadata identities rather than source rows or merchant contents.

**Expected outcome:** A household can follow multiple imports over time and quickly see which receipt records are complete, legacy, duplicated, or require manual review.

## v122 — Account Cleanup & Merge Planning

**Purpose:** Help households resolve duplicate or inconsistent account labels without silently combining transaction histories.

**Planned capabilities**

- Inventory account labels, masked identifiers, transaction counts, and date ranges.
- Detect likely duplicates, spelling drift, and renamed accounts using explainable evidence.
- Preview rename or merge effects before any write.
- Show affected transaction counts, report labels, recurring items, rules, budgets, and planning references.
- Generate a backup-first cleanup plan with explicit decisions for every candidate account.

**Depends on**

- v121 batch and receipt integrity.
- Stable account-label behavior from v117–v120.
- Synthetic multi-account fixtures and validation against real household usage patterns.

**Safety boundaries**

- No automatic merge based on similar names alone.
- Every rename or merge remains backup-first, previewed, acknowledged, confirmed, and read-back verified.
- Full source account identifiers remain masked or excluded.
- A cleanup plan cannot silently rewrite rules, goals, budgets, or recurring decisions.

**Expected outcome:** Account lists become easier to understand while preserving transaction history and requiring explicit household decisions for every change.

## v123 — Recurring Cost Decisions & Subscription Review

**Purpose:** Turn recurring-charge detection into an explainable household decision workflow instead of a passive list.

**Planned capabilities**

- Group recurring merchants by cadence, amount stability, and recent price changes.
- Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.
- Estimate annualized impact while clearly labeling assumptions.
- Assign owner, target date, notes, and follow-up status.
- Feed selected actions into Guided Plan, reports, and the family meeting pack.

**Depends on**

- Existing recurring and amount-change detection.
- Guided Plan state and reporting.
- Account cleanup and labeling improvements from v122.

**Safety boundaries**

- No merchant cancellation, payment change, email, or external account connection.
- Savings estimates remain labeled assumptions rather than guarantees.
- Pending and one-time charges are not promoted as subscriptions without supporting evidence.
- Decision history stays separate from transaction rows.

**Expected outcome:** The household receives a manageable recurring-cost decision queue with owners, estimated impact, and visible follow-through.

## v124 — Household Scenario Comparison

**Purpose:** Compare choices such as debt payments, savings contributions, purchases, income changes, or recurring-cost reductions without editing the real vault.

**Planned capabilities**

- Create temporary what-if scenarios from current forecast settings.
- Compare cash-buffer pressure, goal timing, debt direction, and monthly flexibility.
- Save named scenario assumptions separately from transactions.
- Show side-by-side baselines, changed assumptions, and projected outcomes.
- Produce concise family-discussion summaries and Guided Plan suggestions.

**Depends on**

- Forecast, debt, goals, and Guided Plan models.
- Recurring-cost decisions from v123.
- Clear assumption, horizon, and uncertainty labels.

**Safety boundaries**

- Scenarios never overwrite transactions, budgets, goals, debt records, or forecast settings.
- Results are projections, not financial guarantees.
- Every comparison shows its assumptions and date horizon.
- Applying a scenario, if ever added, would require a separate explicit confirmed workflow.

**Expected outcome:** Household decisions can be discussed with visible trade-offs before changing real plans, payments, or spending.

## v125 — Close History & Trend Explainability

**Purpose:** Use immutable month-close history to explain how the household plan changed and where repeated drift occurs.

**Planned capabilities**

- Compare closed months across spending, income, review readiness, recurring changes, forecast pressure, and goal progress.
- Explain reopen events and differences between original and revised closes.
- Surface repeated categories or accounts driving close drift.
- Distinguish one-time disruptions from recurring patterns.
- Add close-history narratives to reports and family meeting preparation.

**Depends on**

- Immutable close revisions from v110.
- Insight evidence rules from v113.
- Scenario and recurring-decision context from v123–v124.

**Safety boundaries**

- Closed snapshots remain immutable; explanations do not rewrite history.
- Trend claims show comparison periods and evidence.
- Sparse history produces cautious language rather than false certainty.
- Reopen events remain explicit and separately recorded.

**Expected outcome:** The household can see not only what changed month to month, but why the plan repeatedly missed, drifted, or improved.

## v126 — Data Portability & Long-Term Maintenance

**Purpose:** Strengthen recovery, migration, and maintainability after the import and planning workflows have stabilized through real use.

**Planned capabilities**

- Define versioned exports for non-transaction planning metadata where safe and useful.
- Add migration previews for older vault structures and browser-local metadata stores.
- Consolidate stable release-layer code without stacking a second runtime.
- Expand deterministic migration and recovery fixtures.
- Evaluate additional bank formats only against representative validated exports.

**Depends on**

- Field experience from v120–v125.
- Stable data-boundary contracts and migration fixtures.
- Separate validation for CAMT, MT940, institution JSON, or guarded XLSX.

**Safety boundaries**

- No migration write without backup, preview, acknowledgement, confirmation, and read-back verification.
- PDF/OCR remains outside normal transaction import.
- Real household exports remain prohibited from the public repository and CI artifacts.
- One live runtime, stable rescue, and local-first operation remain non-negotiable.

**Expected outcome:** The tool remains recoverable and maintainable as browser-local data evolves, without sacrificing its single-runtime or local-first architecture.

## Candidate future import formats

After representative real-export validation, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX transaction exports;
- a dedicated parser property-testing dependency when format diversity justifies it.

PDF statement extraction remains outside normal transaction import because OCR and table interpretation require a separate review model.
