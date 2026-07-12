# Gringotts Budget Vault Roadmap

This roadmap separates delivered work from the forward planning horizon. **v125 is the strongest next commitment.** v126–v130 are directional and may move when real household use, testing, or safety findings reveal a better order.

## Current release

### v124 — Household Scenario Comparison

**Purpose**

Compare debt, savings, purchase, income, recurring-cost, and flexibility choices without editing the real vault.

**Delivered capabilities**

- Build temporary baseline-versus-scenario projections from current forecast settings and planning events.
- Model starting cash, monthly income, recurring savings, flexible spending, one-time expense, debt-payment, and goal-contribution assumptions.
- Compare ending cash, low point, buffer pressure, negative days, debt direction, goal timing, and monthly flexibility.
- Save bounded named assumption sets separately from transactions and existing planning records.
- Add scenario summaries to Guided Plan, reports, Family Meeting preparation, Markdown, and two workbook sheets.

**Dependencies**

- Cash forecast and planning events from v110.
- Active goals, debt plan, and Guided Plan foundations.
- Recurring-cost decision context from v123.

**Safety boundaries**

- No scenario changes transactions, budgets, forecast settings, debts, goals, or recurring decisions.
- No Apply Scenario control or automatic plan mutation exists.
- Debt direction excludes interest, fees, amortization, and minimum-payment recalculation.
- Every result shows the modeled horizon and explicit assumptions and is labeled as a discussion projection.

**Expected household outcome**

The household can compare visible trade-offs before deciding whether any separate real-world plan change is appropriate.

## Previously shipped foundation

### v123 — Recurring Cost Decisions & Subscription Review

- Added posted recurring-cost evidence, cadence and price-change explanations.
- Added Keep, Cancel, Renegotiate, Investigate, and Completed decisions.
- Added owner, status, target date, notes, Guided Plan, reports, and workbook integration.
- Preserved external merchant and payment actions outside Gringotts.

### v122 and earlier

- Added masked account-cleanup planning, receipt lineage, guarded import and restore, profiles, dry runs, reporting, Insights, Guided Plan, close history, forecasting, goals, and debt planning.

## Forward horizon

### v125 — Close History & Trend Explainability

**Purpose**

Use immutable month-close history to explain how the household plan changed and where repeated drift occurs.

**Planned capabilities**

- Compare closed months across spending, income, review readiness, recurring changes, forecast pressure, and goal progress.
- Explain reopen events and differences between original and revised closes.
- Surface repeated categories or accounts driving close drift.
- Distinguish one-time disruptions from recurring patterns.
- Add close-history narratives to reports and Family Meeting preparation.

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

Turn reports, closes, decisions, goals, scenarios, and audit evidence into a repeatable household review rhythm without background automation.

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

The household gains a consistent review process connecting evidence, decisions, owners, assumptions, and follow-up.

### v128 — Household Data Quality & Stewardship Review

**Purpose**

Provide a periodic local review of stale metadata, orphaned decisions, backup readiness, and evidence gaps without automatically deleting or rewriting records.

**Planned capabilities**

- Inventory stale or orphaned planning metadata across account, recurring, scenario, close, and governance stores.
- Explain which records still connect to current evidence and which require household review.
- Assess backup recency and export coverage using explicit local evidence.
- Generate a stewardship checklist for retain, archive, migrate, or investigate decisions.
- Add privacy-safe maintenance summaries to the workbook and governance pack.

**Dependencies**

- Versioned metadata portability from v126.
- Review cadence and governance packs from v127.
- Stable orphan-detection rules across v122–v127 metadata stores.

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
- Add outcome-review summaries to governance packs and Family Meeting preparation.

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

### v130 — Household Resilience & Contingency Planning

**Purpose**

Translate established scenarios and review history into local contingency playbooks for income interruption, major expense, or cash-buffer stress.

**Planned capabilities**

- Create named contingency playbooks from reviewed scenario assumptions.
- Rank optional household responses by cash-buffer impact, timing, and reversibility.
- Identify prerequisite backups, account information, and family decisions without storing credentials.
- Generate local emergency-review checklists and printable discussion summaries.
- Keep contingency status visible in governance packs and Guided Plan.

**Dependencies**

- Reviewed scenarios and outcome evidence from v124–v129.
- Governance packs and household review cadence.
- Stable local metadata portability and stewardship controls.

**Safety boundaries**

- No automatic transfer, payment, cancellation, borrowing, or account connection.
- Playbooks are planning records rather than emergency guarantees or professional advice.
- Credentials, full account numbers, and transaction copies remain prohibited.
- Executing any financial action remains outside Gringotts and requires separate household confirmation.

**Expected household outcome**

The household gains a practical local playbook for discussing difficult financial conditions before an urgent decision is required.
