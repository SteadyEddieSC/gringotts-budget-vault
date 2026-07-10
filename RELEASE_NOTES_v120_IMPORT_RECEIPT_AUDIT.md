# Gringotts Budget Vault v120 — Import Receipt Audit & Rollback Guidance

## Release goal

v120 turns existing metadata-only import receipts into a practical local audit trail and expands the Roadmap from a single next-release card into a detailed seven-release horizon.

The release does not change the v115 transaction writer and does not add automatic rollback.

## Import receipt audit

Tools → Import & Restore now upgrades the existing Import Receipts card into a read-only audit workspace.

For each receipt, v120 reviews:

- incoming transaction count;
- inserted and skipped counts;
- destination transaction count before and after the import;
- guarded-writer verification result;
- retained source date coverage;
- warning count;
- current readable destination count when available;
- whether a pre-import backup was expected.

Count differences against the current vault are explanatory notes, not automatic errors, because legitimate household activity may have occurred after an import.

## Backup and rollback guidance

When a receipt inserted transactions, v120 identifies the expected backup filename pattern:

`Gringotts_v115_pre_import_<destination-before-count>_*.json`

The audit explains how to:

1. locate the backup downloaded immediately before the import;
2. open the separate Full vault restore task;
3. verify the backup is readable and populated;
4. confirm its transaction count matches the receipt's pre-import count;
5. restore only when manual rollback is genuinely required;
6. verify the populated vault after restore.

No automatic rollback is available. v120 never locates files, restores a vault, deletes rows, or rewrites transactions on behalf of the user.

## Sanitized audit download

A selected receipt can be downloaded as a metadata-only audit package.

The package may contain:

- format and detected schema;
- schema confidence and encoding;
- retained date coverage;
- incoming, inserted, skipped, duplicate, warning, and destination counts;
- verification state;
- audit check results;
- expected backup pattern and pre-import count;
- manual rollback guidance;
- explicit data-boundary declarations.

It excludes:

- transaction rows;
- source filenames;
- source fingerprints;
- mapping summaries;
- destination storage keys;
- account identifiers;
- merchant names;
- vault contents.

## Detailed roadmap horizon

Tools → Roadmap now shows v120 through v126.

Every release card includes:

- purpose;
- planned capabilities;
- dependencies;
- safety boundaries;
- expected household outcome.

The same horizon is maintained in `ROADMAP.md`.

The in-app page explains that the next release is the strongest commitment and that later releases may move when actual use, testing, or safety findings change priorities.

## Planned horizon

- **v121:** Receipt Integrity & Import Batch Reconciliation
- **v122:** Account Cleanup & Merge Planning
- **v123:** Recurring Cost Decisions & Subscription Review
- **v124:** Household Scenario Comparison
- **v125:** Close History & Trend Explainability
- **v126:** Data Portability & Long-Term Maintenance

## Data safety

v120 preserves:

- best-populated-readable-vault selection;
- `gringottsBudgetVault.latest` as the restore destination;
- v115 missing-only transaction insertion;
- duplicate and pending-to-posted review;
- backup-first writes;
- acknowledgement and confirmation;
- count and inserted-token verification;
- write rollback;
- metadata-only import receipts;
- v117 exact-compatible profiles;
- v118 profile-bundle review;
- v119 bounded revision history and dry-run privacy;
- separate full restore;
- one live ES-module runtime;
- no service worker, remote parser, analytics, or institution connection;
- stable `rescue-v105.html`.

## Validation scope

The release adds synthetic tests for:

- receipt normalization;
- verified and verified-no-change receipts;
- inconsistent count arithmetic;
- backup filename expectations;
- current destination comparisons;
- audit-download privacy;
- vault byte-for-byte noninterference;
- separate restore navigation;
- seven detailed roadmap releases;
- phone containment;
- desktop and phone axe coverage;
- repository security and lazy-route contracts.

The established parser, browser, responsive, accessibility, Lighthouse, privacy, CodeQL, dependency, and supply-chain gates remain required before merge.
