# Gringotts Budget Vault Roadmap

The roadmap now prioritizes reliability and simplification over feature count. **v126 is the strongest next commitment.** Later entries are directional and may move when testing or household use shows a better order.

## Current release

### v125 — Close History & Trend Explainability

**Purpose**

Explain month-to-month household change using immutable close snapshots for closed months and currently posted evidence for open months.

**Delivered**

- compares selected and prior months;
- separates income, recurring expenses, variable expenses, and transfer-neutral change;
- ranks aggregate drivers;
- shows close revisions, reopen events, comparison periods, account/date coverage, and confidence reasons;
- excludes pending rows from money totals;
- distinguishes open-month estimates from closed-month evidence;
- lowers confidence when current row coverage differs from a retained snapshot;
- integrates with Guided Plan, Reports, Family Meeting and Guided Plan Markdown, diagnostics, JSON, and two workbook sheets;
- exports aggregates only and stores no new transaction copies.

**Safety**

- no transaction rewrite or silent close-history mutation;
- no automatic reopen or planning change;
- no causation claim from aggregate correlation;
- no raw household financial data in source control, logs, screenshots, or CI artifacts.

## Reliability-first horizon

### v126 — Runtime Consolidation & Reliability

Feature freeze. Establish one explicit route lifecycle, authoritative readiness contract, action/download dispatcher, release registry, idempotent render contract, observer ownership model, storage inventory, recovery behavior, and performance budgets. Add no primary destination and no unrelated household-finance feature.

### v127 — UX Polish & Simplification

Standardize action language, destructive confirmation, success/failure feedback, loading and partial-data states, progressive disclosure, mobile transitions, keyboard flow, focus restoration, table regions, headings, names, and dialogs.

### v128 — Data Portability & Recovery

Version every browser-local metadata domain; document caps, corruption handling, migrations, rollback, orphan handling, and privacy contracts; add one-domain reset without clearing the vault; preserve `gringottsBudgetVault.latest` as the authoritative full-restore destination.

### v129 — Household Workflow Evidence Review

Review real workflow friction, abandoned specialist surfaces, repeated failures, confusing states, and unmet needs using privacy-safe observations. Do not add features from roadmap momentum alone.

### v130 — Performance & Maintenance Hardening

Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets. Consolidate historical release layers without creating a second runtime. Treat 43 workbook sheets as the cap.

### v131 — Observed Needs Decision Gate

Decide whether any new household-finance capability is justified. Feature freeze remains the default. Any proposed metadata store requires a schema, cap, recovery behavior, migration plan, and privacy contract.
