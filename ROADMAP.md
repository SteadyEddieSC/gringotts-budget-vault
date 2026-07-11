# Gringotts Budget Vault Roadmap

This roadmap separates delivered work from the forward planning horizon. **v123 is the strongest next commitment.** v124–v128 are directional and may move when real household use, testing, or safety findings reveal a better order.

## Current release

### v122 — Account Cleanup & Merge Planning

**Purpose**

Help households understand duplicate or inconsistent account labels and make explicit cleanup decisions without silently combining transaction histories.

**Delivered capabilities**

- Inventory masked account labels, transaction counts, pending counts, owner counts, and retained date ranges.
- Count references across rules, recurring items, budgets, bills and paydays, goals, planning metadata, and other browser-local metadata.
- Detect label drift, spelling differences, possible renames, and possible duplicates with explainable evidence and confidence.
- Explain matching masked final-four values, shared meaningful words, inferred type, text similarity, and overlapping or sequential date ranges.
- Review one candidate at a time with compact native controls.
- Save an explicit Keep Separate, Rename, Merge Plan, or Investigate decision for every current candidate.
- Store bounded metadata under `gringottsAccountCleanupPlan.v1`, capped at 120 decisions.
- Reset stale decisions when the account-inventory signature changes instead of silently applying them to a different inventory.
- Read back every plan write and restore the prior raw metadata value after failure.
- Download a separate populated pre-cleanup vault backup.
- Download a sanitized cleanup-plan package with masked labels, counts, evidence, and decisions.
- Expand the Vault Workbook from 35 to 37 sheets with Account Inventory and Account Cleanup Plan.
- Preserve v121 receipt integrity, batch lineage, profiles, dry runs, guarded import, and separate Full Vault Restore.

**Dependencies**

- v121 receipt integrity and destination continuity evidence.
- Stable account-label behavior from the current transaction and reporting models.
- Synthetic multi-account fixtures covering overlap, renames, spelling drift, and genuinely distinct accounts.

**Safety boundaries**

- No automatic account rename, merge, deletion, or transaction rewrite.
- Similarity evidence never authorizes a write.
- Overlapping date ranges remain an explicit caution that two similar labels may represent distinct accounts.
- The decision store excludes transaction rows, balances, merchants, raw labels, and full account identifiers.
- Rules, budgets, goals, recurring decisions, and planning metadata are never silently rewritten.
- Any future cleanup execution requires a separate populated-backup, preview, acknowledgement, confirmation, read-back verification, and rollback workflow.

**Expected household outcome**

The household gains a clear account inventory and complete decision plan while all transaction history remains unchanged.

## Previously shipped foundation

### v121 — Receipt Integrity & Import Batch Reconciliation

- Replaced the passive receipt list with a filterable import-batch timeline.
- Derived per-destination sequence and before/after-count continuity.
- Added earliest-retained, continuous, legacy-count, untracked-increase, and count-decrease lineage states.
- Added duplicate receipt identity failures and repeated-source information.
- Added an optional verified metadata-only link from explicit Prepare Dry Run to the resulting receipt.
- Stored bounded links under `gringottsImportBatchIndex.v1` with read-back verification and prior-value restoration.
- Added sanitized timeline downloads and Receipt Integrity / Batch Lineage workbook sheets.
- Preserved the v115 guarded writer, separate restore task, six primary destinations, one runtime, and stable v105 rescue.

### v120 — Import Receipt Audit & Rollback Guidance

- Added read-only receipt arithmetic and verification reconciliation.
- Identified expected pre-import backup patterns.
- Added privacy-safe receipt audit downloads and manual rollback guidance.
- Kept Full Vault Restore separate and explicitly confirmed.

### v119 — Profile Versioning & Dry-Run Diagnostics

- Added field-by-field revision review before profile Update or bundle Replace.
- Added bounded redacted revision history.
- Added explicit metadata-only dry-run diagnostics without transaction writes.

### v118 — Profile Portability & Institution Patterns

- Added sanitized portable profile definitions.
- Required explicit Add, Replace, or Skip for every imported definition.
- Added synthetic institution-pattern coverage.

### v117 — Import Profiles & Field Validation

- Added exact-compatible browser-local mapping profiles.
- Added field explanations, safe profile application, and bounded metadata storage.

### v116 and earlier

- Separated transaction import from full-vault restore.
- Established six primary destinations, report preview architecture, local-only workflows, insights, planning, close history, forecast, goals, debt, recurring review, and stable rescue behavior.

## Forward horizon

### v123 — Recurring Cost Decisions & Subscription Review

**Purpose**

Turn recurring-charge detection into an explainable household decision workflow instead of a passive list.

**Planned capabilities**

- Group recurring merchants by cadence, amount stability, account, and recent price changes.
- Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.
- Estimate annualized impact while clearly labeling assumptions and incomplete evidence.
- Assign owner, target date, status, notes, and follow-up.
- Feed selected actions into Guided Plan, reports, and family meeting preparation.

**Dependencies**

- Existing recurring and amount-change detection.
- Guided Plan state and reporting.
- Account inventory and label decisions from v122.

**Safety boundaries**

- No merchant cancellation, payment change, email, or external account connection.
- Savings estimates remain assumptions, not guarantees.
- Pending and one-time charges are not promoted as subscriptions without evidence.
- Decision history remains separate from transaction rows.

**Expected household outcome**

The household receives a manageable recurring-cost queue with owners, estimated impact, and visible follow-through.

### v124 — Household Scenario Comparison

**Purpose**

Compare debt, savings, purchase, income, or recurring-cost choices without editing the real vault.

**Planned capabilities**

- Create temporary what-if scenarios from current forecast settings.
- Compare cash-buffer pressure, goal timing, debt direction, and monthly flexibility.
- Save named scenario assumptions separately from transactions.
- Show side-by-side baselines, changed assumptions, and projected outcomes.
- Produce concise family-discussion summaries and Guided Plan suggestions.

**Dependencies**

- Forecast, debt, goals, and Guided Plan models.
- Recurring-cost decisions from v123.
- Clear assumption, horizon, and uncertainty labels.

**Safety boundaries**

- Scenarios never overwrite transactions, budgets, goals, debt records, or forecast settings.
- Results are projections, not financial guarantees.
- Every comparison shows assumptions and date horizon.
- Applying a scenario requires a separate explicit confirmed workflow.

**Expected household outcome**

Household choices can be discussed with visible trade-offs before changing real payments, plans, or spending.

### v125 — Close History & Trend Explainability

**Purpose**

Use immutable month-close history to explain how the household plan changed and where repeated drift occurs.

**Planned capabilities**

- Compare closed months across spending, income, review readiness, recurring changes, forecast pressure, and goal progress.
- Explain reopen events and differences between original and revised closes.
- Surface repeated categories or accounts driving close drift.
- Distinguish one-time disruptions from recurring patterns.
- Add close-history narratives to reports and family meeting preparation.

**Dependencies**

- Immutable close revisions from v110.
- Insight evidence rules from v113.
- Scenario and recurring-decision context from v123–v124.

**Safety boundaries**

- Closed snapshots remain immutable.
- Trend claims show comparison periods and evidence.
- Sparse history produces cautious language rather than false certainty.
- Reopen events remain explicit and separately recorded.

**Expected household outcome**

The household can see not only what changed month to month, but why the plan repeatedly missed, drifted, or improved.

### v126 — Data Portability & Long-Term Maintenance

**Purpose**

Strengthen recovery, migration, and maintainability after import and planning workflows stabilize through real use.

**Planned capabilities**

- Define versioned exports for non-transaction planning metadata where safe and useful.
- Add migration previews for older vault structures and browser-local metadata stores.
- Consolidate stable release-layer code without creating a second runtime.
- Expand deterministic migration and recovery fixtures.
- Evaluate additional bank formats only against representative validated exports.

**Dependencies**

- Field experience from v121–v125.
- Stable data-boundary contracts and migration fixtures.
- Separate validation for CAMT, MT940, institution JSON, or guarded XLSX.

**Safety boundaries**

- No migration write without backup, preview, acknowledgement, confirmation, and read-back verification.
- PDF and OCR remain outside normal transaction import.
- Real household exports remain prohibited from the public repository and CI artifacts.
- One live runtime, stable rescue, and local-first operation remain non-negotiable.

**Expected household outcome**

The tool remains recoverable and maintainable as browser-local data evolves without sacrificing the single-runtime architecture.

### v127 — Family Review Cadence & Governance Packs

**Purpose**

Turn existing reports, closes, decisions, goals, and audit evidence into a repeatable household review rhythm without background automation.

**Planned capabilities**

- Create monthly, quarterly, and annual review checklists from existing local evidence.
- Track which household questions were reviewed, deferred, or assigned.
- Assemble local governance packs containing selected reports, decisions, assumptions, and follow-ups.
- Show stale decisions, overdue review items, and unresolved evidence gaps.
- Keep review-cadence settings separate from transactions and financial calculations.

**Dependencies**

- Recurring decisions from v123.
- Scenario comparisons from v124.
- Close-history explanations from v125.
- Stable metadata portability from v126.

**Safety boundaries**

- No background notifications, email delivery, or external calendar connection.
- Review completion never changes transactions, balances, or historical closes.
- Governance packs are generated locally and include only user-selected sections.
- Overdue labels remain workflow prompts, not claims of financial risk.

**Expected household outcome**

The household gains a consistent review process connecting evidence, decisions, owners, and follow-up without creating another financial-data source.

### v128 — Household Data Quality & Stewardship Review

**Purpose**

Provide a periodic local review of stale metadata, orphaned decisions, backup readiness, and evidence gaps without automatically deleting or rewriting records.

**Planned capabilities**

- Inventory stale or orphaned planning metadata across account, recurring, scenario, close, and governance stores.
- Explain which records still connect to current transactions and which require household review.
- Assess backup recency and export coverage using explicit local evidence rather than background scanning.
- Generate a stewardship checklist for retain, archive, migrate, or investigate decisions.
- Add privacy-safe maintenance summaries to the workbook and governance pack.

**Dependencies**

- Versioned metadata portability from v126.
- Review cadence and governance packs from v127.
- Stable orphan-detection rules across v122–v127 metadata stores.

**Safety boundaries**

- No automatic deletion, compaction, archive, or migration.
- Backup age is reported only from explicit local evidence and never inferred from remote storage.
- Orphan labels are review prompts, not proof that data is unnecessary.
- Any cleanup write requires a separate backup-first confirmed workflow.

**Expected household outcome**

The household can maintain a trustworthy local vault over time with visible ownership of every retention or cleanup decision.
