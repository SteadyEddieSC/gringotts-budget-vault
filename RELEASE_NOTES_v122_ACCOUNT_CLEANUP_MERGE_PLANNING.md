# v122 — Account Cleanup & Merge Planning

## Summary

v122 adds a planning-first account cleanup workflow inside **Tools → Import & Restore**. It inventories account labels used by the current readable vault, identifies explainable duplicate-label or rename candidates, shows the likely effect on downstream household metadata, and records an explicit decision for each candidate.

The release does **not** rename an account, combine transaction histories, delete transactions, rewrite rules, alter budgets, change recurring decisions, or apply a cleanup plan.

## Account inventory

The inventory derives from the current browser-local transaction set and shows:

- a masked account label;
- inferred account type when recognizable;
- transaction and pending counts;
- first and last retained transaction dates;
- number of retained owner values;
- counts of references in rules, recurring items, budgets, bills and paydays, goals, planning metadata, and other local metadata.

Raw transaction rows are never copied into the cleanup-plan store or cleanup-plan download.

## Explainable cleanup candidates

Candidate pairs may be surfaced when local evidence indicates:

- punctuation, spacing, capitalization, or `account` / `acct` drift;
- spelling drift;
- shared meaningful label words;
- matching masked final-four digits;
- matching inferred account type;
- sequential date ranges consistent with a possible rename;
- overlapping date ranges requiring caution because the accounts may be distinct.

Similarity is review evidence only. It never authorizes a write.

## Explicit decision plan

Each current candidate requires one explicit planning decision:

- Keep separate;
- Plan rename from the left label to the right label;
- Plan rename from the right label to the left label;
- Plan merge from the left history to the right account;
- Plan merge from the right history to the left account;
- Investigate before deciding.

These values describe household intent only. No rename or merge operation exists in v122.

The metadata store is:

`gringottsAccountCleanupPlan.v1`

It is capped at 120 decisions. Stored entries contain only candidate IDs, decisions, timestamps, and the current account-inventory signature. When the inventory signature changes, old decisions are treated as stale instead of being silently applied to a different account set.

Writes are read-back verified. If a write or verification fails, the prior raw metadata value is restored.

## Downloads

### Pre-cleanup vault backup

The account cleanup card can download the current populated readable vault using:

`Gringotts_v122_pre_cleanup_backup_<transaction-count>_<timestamp>.json`

Downloading the backup does not apply a cleanup decision.

### Sanitized cleanup plan

The cleanup-plan package includes:

- masked account summaries;
- account-type and date-range metadata;
- reference counts;
- candidate classifications, confidence, and evidence;
- explicit decisions;
- declarations that automatic merge and transaction writes are unavailable.

It excludes:

- transaction rows;
- raw account labels;
- full account identifiers;
- balances;
- merchant names;
- source files;
- credentials and tokens;
- vault contents.

## Workbook

The Vault Workbook expands from 35 to **37 sheets**.

New sheets:

- **Account Inventory**;
- **Account Cleanup Plan**.

The existing Import Receipts, Receipt Integrity, and Batch Lineage sheets remain.

## Roadmap

The detailed horizon now covers:

- v122 — Account Cleanup & Merge Planning;
- v123 — Recurring Cost Decisions & Subscription Review;
- v124 — Household Scenario Comparison;
- v125 — Close History & Trend Explainability;
- v126 — Data Portability & Long-Term Maintenance;
- v127 — Family Review Cadence & Governance Packs;
- v128 — Household Data Quality & Stewardship Review.

v123 is the strongest next commitment. v124–v128 remain directional.

## Architecture and preserved behavior

- Six primary destinations remain unchanged.
- Account cleanup remains inside Tools → Import & Restore.
- v122 is lazy-loaded only after Tools or Reports opens.
- v121 still owns receipt integrity and batch lineage behavior beneath the v122 presentation layer.
- v119 profile revisions and dry runs remain active.
- v115 remains the authoritative parser, duplicate-review engine, guarded writer, and receipt store.
- Full Vault Restore remains a separate task targeting `gringottsBudgetVault.latest`.
- `rescue-v105.html` remains unchanged.
- No service worker, analytics, remote parser, institution connection, or second runtime is added.

## Safety boundary

v122 cannot automatically:

- rename accounts;
- merge account histories;
- delete accounts or transactions;
- rewrite receipts;
- repair import history;
- modify rules, budgets, goals, recurring decisions, or planning metadata;
- roll back an import;
- restore a vault.

Any future cleanup execution must be a separate workflow with a populated backup, preview, acknowledgement, confirmation, read-back verification, and restoration of the prior raw value after failure.

## Validation scope

The v122 release gate includes:

- syntax checks for all active v122 modules;
- Node pure-model tests;
- account masking and candidate-classification tests;
- stale inventory and bounded-plan tests;
- sanitized package tests;
- browser workflow and vault-byte noninterference tests;
- Chromium, Firefox, and WebKit desktop;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard and visual contracts;
- desktop and phone axe scans;
- Lighthouse original budgets;
- full-history privacy scan and Gitleaks;
- Public Repository Security, Dependency Review, npm audit, Supply Chain, and CodeQL;
- Cloudflare exact-head preview;
- unresolved-review-thread verification.
