# Bank Export Import Roadmap

## Current release relationship

v124 — Household Scenario Comparison does not replace or extend the transaction parser, duplicate engine, guarded writer, receipt store, batch lineage, account-cleanup planning, or Full Vault Restore.

Scenario Comparison reads existing forecast, debt, goal, and planning models. It stores bounded assumptions under `gringottsScenarioComparisons.v1` and cannot write transaction rows, import receipts, profiles, account labels, forecast settings, debt records, goals, or recurring decisions.

The v124 Vault Workbook contains 41 sheets, including the existing Import Receipts, Receipt Integrity, Batch Lineage, Account Inventory, and Account Cleanup Plan sheets plus recurring-decision and scenario sheets.

## Authoritative import architecture

### v122 — Account Cleanup & Merge Planning

- derives masked account inventory and explainable cleanup candidates;
- stores bounded planning decisions under `gringottsAccountCleanupPlan.v1`;
- excludes rows, raw labels, full identifiers, merchants, balances, files, credentials, tokens, and vault contents;
- never renames, merges, deletes, or rewrites account history.

### v121 — Receipt Integrity & Import Batch Reconciliation

- derives destination-family sequence, receipt integrity, count continuity, duplicate identities, repeated-source notes, and optional verified dry-run lineage;
- stores bounded metadata links under `gringottsImportBatchIndex.v1`;
- never rewrites, repairs, deletes, or rolls back a receipt.

### v120 — Import Receipt Audit & Rollback Guidance

- reconciles incoming, inserted, skipped, before, after, verification, date coverage, warnings, current destination count, and expected backup pattern;
- provides manual recovery guidance only.

### v119 — Profile Versioning & Dry-Run Diagnostics

- retains bounded revision history;
- prepares metadata-only readiness diagnostics;
- separates Prepare Dry Run from Download Dry Run.

### v118 — Profile Portability & Institution Patterns

- portable definitions require explicit Add, Replace, or Skip;
- Replace remains identity-matched and revision-gated.

### v117 — Import Profiles & Field Validation

- browser-local profiles are capped at 24 sanitized records;
- automatic use requires exactly one compatible profile.

### v116 — Import and Restore Task Separation

- Import transactions and Restore full vault remain separate tasks;
- restore targets exactly `gringottsBudgetVault.latest`.

### v115 — Bank Export Import & Mapping

v115 remains the authoritative local parser, reconciliation engine, guarded writer, and receipt store.

## Implemented format scope

First-class formats:

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon-delimited text;
- pipe-delimited text;
- OFX, QFX, and QBO;
- existing Gringotts JSON transaction packages.

Outside normal import:

- PDF statements and OCR;
- XLS and XLSX transaction exports;
- CAMT.053 and CAMT.054;
- MT940;
- archives, executables, and unsupported binaries;
- direct institution credentials or account connections.

## Implemented import stages

1. Local browser-only inspection with file and row limits.
2. Schema detection without silent date or sign guesses.
3. Profile, portability, revision, and explicit mapping review.
4. Normalization and optional metadata-only dry run.
5. Exact, fuzzy, pending-to-posted, coverage, and overlap review.
6. Backup-first acknowledged and confirmed missing-only write.
7. Raw-value rollback and read-back verification.
8. Metadata-only receipt.
9. Read-only receipt audit and manual recovery guidance.
10. Receipt integrity and optional verified batch lineage.
11. Read-only account cleanup planning.

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

Profiles, bundles, revisions, dry runs, receipts, audits, batch links, cleanup plans, recurring decisions, and scenario assumptions are not restore operations.

## Safety requirements

- No import content leaves the browser except an explicit download.
- No remote parser, analytics, or institution connection.
- No raw rows in profiles, revisions, bundles, dry runs, receipts, audits, batch links, cleanup plans, recurring decisions, or scenario metadata.
- No automatic profile replacement, account merge, account rename, receipt repair, rollback, or scenario application.
- No empty-vault overwrite.
- No write with unresolved mapping, date, sign, or duplicate decisions.
- No transaction write without a populated backup.
- No successful write without read-back verification.

## Test coverage

Synthetic coverage includes parser formats and malformed input, mapping/profile/versioning/dry-run cases, duplicate and overlap review, receipt arithmetic and lineage, cleanup planning, scenario noninterference, 41-sheet workbook generation, desktop and responsive browsers, accessibility, observer stability, repository security, and no-network-write contracts.

Real household exports, profiles, revisions, dry runs, receipts, timelines, cleanup plans, scenario stores, backups, and reports must never be committed or uploaded to CI artifacts.

## Next planned release

### v125 — Close History & Trend Explainability

v125 is planned to explain immutable month-close history and repeated drift. It will not replace the v115 import architecture or rewrite closed snapshots.

See `ROADMAP.md` for the detailed v124–v130 horizon.

## Candidate future formats

After representative validation, separately evaluate CAMT, MT940, institution JSON, guarded XLSX, and additional property-testing support.
