# Gringotts Budget Vault Roadmap

This roadmap separates shipped work from the forward planning horizon. The next planned release is the strongest commitment. Later releases are directional and may move when real household use, testing, or safety findings reveal a better order.

## Shipped

### v121 — Receipt Integrity & Import Batch Reconciliation

- Replaced the passive receipt list with a filterable import batch timeline.
- Derived per-destination receipt sequence from retained timestamps and destination before/after counts.
- Added continuous, earliest-retained, legacy-count, untracked-increase, and count-decrease lineage states.
- Added duplicate receipt-ID failures and repeated source-fingerprint information without copying source data into exports.
- Added filters for integrity, import result, lineage, dry-run state, destination family, and local search.
- Added an optional verified metadata-only link between explicit Prepare Dry Run and the following verified receipt.
- Stored links under `gringottsImportBatchIndex.v1`, capped at 80, with read-back verification and rollback.
- Excluded rows, filenames, fingerprints, mappings, destination keys, account identifiers, merchants, balances, credentials, and vault contents from the index.
- Added sanitized full-timeline and selected-batch downloads.
- Expanded the Vault Workbook from 33 to 35 sheets with Receipt Integrity and Batch Lineage.
- Advanced the detailed in-app and project roadmap through v127.
- Preserved the v115 guarded writer, separate restore workflow, six primary destinations, one live runtime, and stable v105 rescue.

### v120 — Import Receipt Audit & Rollback Guidance

- Added read-only receipt arithmetic, verification, date-range, warning, destination-count, and backup-expectation checks.
- Added sanitized receipt-audit downloads and manual rollback guidance.
- Explicitly kept automatic rollback unavailable.
- Replaced the single-next-release roadmap with a detailed multi-release horizon.

### v119 — Profile Versioning & Dry-Run Diagnostics

- Added field-by-field review before profile Update or portable Replace.
- Added bounded redacted revision history.
- Added explicit metadata-only dry-run diagnostics before transaction writes.
- Preserved the guarded writer and profile portability safeguards.

### v118 — Profile Portability & Institution Patterns

- Added sanitized profile-definition export/import with explicit Add, Replace, or Skip decisions.
- Rejected transaction-shaped, credential, balance, filename, fingerprint, and full-account fields.
- Added fictional institution-pattern fixtures and rollback-verified metadata writes.

### v117 — Import Profiles & Field Validation

- Added bounded browser-local mapping profiles with exact compatibility checks.
- Added field-level explanations and explicit profile actions.
- Kept profile storage separate from transaction data.

### v116 — UI Architecture Review

- Reconfirmed Dashboard, Money, Calendar, Reports, Activity, and Tools as the six primary destinations.
- Added one-page-at-a-time report preview while preserving all eight print pages.
- Separated incremental import from full vault restore.

### v115 — Bank Export Import & Mapping

- Added local CSV, TSV, delimited text, OFX, QFX, QBO, and Gringotts JSON import.
- Added explicit mapping, validation, duplicate review, backup-first missing-only writes, rollback, and verification.
- Added metadata-only import receipts.

### v114 through v103

- **v114 — Guided Household Planning:** explainable actions and separately saved checklist state.
- **v113 — Household Insights IV:** explainable merchant, category, and recurring-cost evidence.
- **v112 — Accessibility & Quality Automation:** axe, keyboard, visual, Lighthouse, focus, and contrast gates.
- **v111 — Household Reporting III:** reusable ranges, prior-year comparisons, and local family reports.
- **v110 — Month Close & Forecasting:** reconciliation, immutable closes, reopen history, forecast, and debt planning.
- **v109 — Import Memory & Duplicate Guard:** stable-ID, fingerprint, fuzzy, pending-to-posted, and receipt safeguards.
- **v108.4–v108.1:** security, dependency, privacy, CodeQL, and cross-browser infrastructure.
- **v108 — Goals & Vault Health:** goals, sinking funds, health evidence, and workbook expansion.
- **v107 — Review Queue & Performance:** persistent shell, caching, compact controls, and backup-first edits.
- **v106.2–v106:** startup recovery, stable rescue, Calendar/Cash Flow, and consolidated navigation.
- **v105 — Bills, Recurring & Budget Intelligence:** budgets, recurring review, change alerts, and trends.
- **v104 — Household Reporting II:** month correction and annual-tracker filling.
- **v103 — Reports & Month Navigator:** shared month state, executive reporting, meeting packs, and local XLSX.

## Forward planning horizon

## v122 — Account Cleanup & Merge Planning

**Purpose:** Help households resolve duplicate or inconsistent account labels without silently combining transaction histories.

**Planned capabilities**

- Inventory account labels, masked identifiers, transaction counts, and date ranges.
- Detect likely duplicates, spelling drift, and renamed accounts with explainable evidence.
- Preview rename or merge effects on transactions, reports, recurring items, rules, budgets, and planning references.
- Generate a backup-first cleanup plan with an explicit decision for every candidate account.

**Depends on**

- v121 destination-family and batch-continuity evidence.
- Stable account-label behavior from v117–v121.
- Synthetic multi-account fixtures and real household validation.

**Safety boundaries**

- No automatic merge based on similar names alone.
- Every write remains backup-first, previewed, acknowledged, confirmed, and read-back verified.
- Full source account identifiers remain masked or excluded.
- Cleanup cannot silently rewrite rules, goals, budgets, or recurring decisions.

**Expected outcome:** Account lists become easier to understand while every transaction-history change remains explicit, reviewable, and recoverable.

## v123 — Recurring Cost Decisions & Subscription Review

**Purpose:** Turn recurring-charge detection into an explainable household decision workflow rather than a passive list.

**Planned capabilities**

- Group recurring merchants by cadence, amount stability, and recent price changes.
- Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.
- Estimate annualized impact while visibly labeling assumptions.
- Assign owner, target date, notes, and follow-up status.
- Feed selected actions into Guided Plan, reports, and the family meeting pack.

**Depends on**

- Existing recurring and amount-change detection.
- Guided Plan state and reporting.
- Account cleanup and labeling improvements from v122.

**Safety boundaries**

- No merchant cancellation, payment change, email, or external account connection.
- Savings estimates remain assumptions rather than guarantees.
- Pending and one-time charges are not promoted as subscriptions without evidence.
- Decision history remains separate from transaction rows.

**Expected outcome:** The household receives a manageable recurring-cost queue with owners, estimated impact, and visible follow-through.

## v124 — Household Scenario Comparison

**Purpose:** Compare debt, savings, purchase, income, or recurring-cost choices without editing the real vault.

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
- Applying a scenario would require a separate explicit confirmed workflow.

**Expected outcome:** Household choices can be discussed with visible trade-offs before changing real payments, plans, or spending.

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

**Purpose:** Strengthen recovery, migration, and maintainability after import and planning workflows stabilize through real use.

**Planned capabilities**

- Define versioned exports for non-transaction planning metadata where safe and useful.
- Add migration previews for older vault structures and browser-local metadata stores.
- Consolidate stable release-layer code without stacking another runtime.
- Expand deterministic migration and recovery fixtures.
- Evaluate additional bank formats only against representative validated exports.

**Depends on**

- Field experience from v121–v125.
- Stable data-boundary contracts and migration fixtures.
- Separate validation for CAMT, MT940, institution JSON, or guarded XLSX.

**Safety boundaries**

- No migration write without backup, preview, acknowledgement, confirmation, and read-back verification.
- PDF and OCR remain outside normal transaction import.
- Real household exports remain prohibited from the public repository and CI artifacts.
- One live runtime, stable rescue, and local-first operation remain non-negotiable.

**Expected outcome:** The tool remains recoverable and maintainable as browser-local data evolves without sacrificing the single-runtime architecture.

## v127 — Family Review Cadence & Governance Packs

**Purpose:** Turn existing reports, closes, decisions, goals, and audit evidence into a repeatable household review rhythm without background automation.

**Planned capabilities**

- Create monthly, quarterly, and annual review checklists from existing local evidence.
- Track which household questions were reviewed, deferred, or assigned.
- Assemble local governance packs containing selected reports, decisions, assumptions, and follow-ups.
- Show stale decisions, overdue review items, and unresolved evidence gaps.
- Keep review-cadence settings separate from transactions and financial calculations.

**Depends on**

- Recurring decisions from v123.
- Scenario comparisons from v124.
- Close-history explanations from v125.
- Stable metadata portability from v126.

**Safety boundaries**

- No background notifications, email delivery, or external calendar connection.
- Review completion never changes transactions, balances, or historical closes.
- Governance packs are generated locally and include only user-selected sections.
- Overdue labels remain workflow prompts, not claims of financial risk.

**Expected outcome:** The household gains a consistent review process connecting evidence, decisions, owners, and follow-up without creating another financial-data source.

## Candidate future import formats

After representative real-export validation, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX transaction exports;
- a dedicated parser property-testing dependency when format diversity justifies it.

PDF statement extraction remains outside normal transaction import because OCR and table interpretation require a separate review model.
