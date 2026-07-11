# Gringotts Budget Vault Roadmap

This roadmap separates delivered work from the forward planning horizon. **v124 is the strongest next commitment.** v125–v129 are directional and may move when real household use, testing, or safety findings reveal a better order.

## Current release

### v123 — Recurring Cost Decisions & Subscription Review

**Purpose**

Turn recurring-charge detection into an explainable household decision and follow-up workflow instead of a passive list.

**Delivered capabilities**

- Group posted recurring expenses by normalized merchant and account.
- Exclude pending charges, income and transfer-like rows, and unsupported one-time purchases.
- Explain occurrence count, month coverage, cadence, typical day gap, amount stability, and latest price changes.
- Show masked account, detected owner, first and latest dates, and simple cadence-based annual footprint.
- Track Keep, Cancel, Renegotiate, Investigate, and Completed decisions.
- Assign household owner, target date, Not Started / Planned / Waiting / Done status, and notes.
- Preserve dormant decisions without applying them to another merchant or account.
- Feed open Cancel, Renegotiate, and Investigate decisions into Guided Plan, report pages, Family Meeting preparation, and Markdown downloads.
- Store bounded read-back-verified metadata under `gringottsRecurringDecisions.v1`.
- Expand the Vault Workbook from 37 to 39 sheets with Recurring Decisions and Recurring Decision History.
- Preserve account cleanup, receipt lineage, guarded import, separate restore, and six primary destinations.

**Dependencies**

- Existing recurring and amount-change evidence.
- Guided Plan and reporting foundations.
- Account masking and cleanup-planning boundaries from v122.

**Safety boundaries**

- No merchant cancellation, payment change, email, phone call, or external account connection.
- Pending transactions and unsupported one-time charges remain outside the decision queue.
- Annual figures are discussion estimates rather than guaranteed savings or forecasts.
- Decision metadata remains separate from transaction rows and restores the prior raw value after write failure.

**Expected household outcome**

The household gains an owned recurring-cost queue with visible evidence, estimated footprint, and practical follow-through while all merchant and payment actions remain outside Gringotts.

## Previously shipped foundation

### v122 — Account Cleanup & Merge Planning

- Added masked account inventory and downstream reference counts.
- Surfaced explainable label drift, spelling drift, possible rename, and possible duplicate candidates.
- Added explicit Keep Separate, Rename Plan, Merge Plan, and Investigate decisions.
- Stored bounded metadata without renaming accounts or rewriting transactions.
- Added separate backup and sanitized cleanup-plan downloads.
- Added Account Inventory and Account Cleanup Plan workbook sheets.

### v121 — Receipt Integrity & Import Batch Reconciliation

- Added receipt sequence, continuity, repeated-source, and optional verified dry-run lineage.
- Added sanitized timeline downloads and Receipt Integrity / Batch Lineage workbook sheets.
- Preserved the v115 guarded writer and separate restore task.

### v120 and earlier

- Added receipt audit and rollback guidance, profile versioning, dry-run diagnostics, profile portability, explicit mapping, guarded import and restore, reports, insights, planning, close history, forecast, goals, debt, and stable rescue behavior.

## Forward horizon

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

- Immutable close revisions.
- Insight evidence rules.
- Scenario and recurring-decision context.

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

Turn reports, closes, decisions, goals, and audit evidence into a repeatable household review rhythm without background automation.

**Planned capabilities**

- Create monthly, quarterly, and annual review checklists from existing local evidence.
- Track which household questions were reviewed, deferred, or assigned.
- Assemble local governance packs containing selected reports, decisions, assumptions, and follow-ups.
- Show stale decisions, overdue review items, and unresolved evidence gaps.
- Keep review-cadence settings separate from transactions and calculations.

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
- Assess backup recency and export coverage using explicit local evidence.
- Generate a stewardship checklist for retain, archive, migrate, or investigate decisions.
- Add privacy-safe maintenance summaries to the workbook and governance pack.

**Dependencies**

- Versioned metadata portability from v126.
- Review cadence and governance packs from v127.
- Stable orphan-detection rules across planning stores.

**Safety boundaries**

- No automatic deletion, compaction, archive, or migration.
- Backup age is reported only from explicit local evidence.
- Orphan labels are review prompts, not proof that data is unnecessary.
- Any cleanup write requires a separate backup-first confirmed workflow.

**Expected household outcome**

The household can maintain a trustworthy local vault over time with visible ownership of every retention or cleanup decision.

### v129 — Decision Outcome Review & Forecast Calibration

**Purpose**

Compare completed household decisions with later posted evidence so assumptions and forecasts can be improved without claiming causation.

**Planned capabilities**

- Review whether completed recurring, scenario, debt, goal, and close decisions are reflected in later posted data.
- Compare estimated and observed changes with clearly labeled timing and attribution limits.
- Capture household explanations for partial, delayed, or unrelated outcomes.
- Suggest forecast-assumption updates for explicit review rather than applying them automatically.
- Add outcome-review summaries to governance packs and family meeting preparation.

**Dependencies**

- Completed recurring decisions from v123.
- Scenario assumptions from v124.
- Close and governance history from v125–v128.

**Safety boundaries**

- Observed changes are not automatically attributed to a prior decision.
- No forecast, transaction, budget, goal, debt, or decision record is silently rewritten.
- Sparse or delayed evidence produces an inconclusive result rather than a success or failure claim.
- Any calibration change requires explicit preview and confirmation.

**Expected household outcome**

The household can learn from completed decisions and improve future assumptions without turning correlation into a financial claim.
