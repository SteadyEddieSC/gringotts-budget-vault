# Gringotts Budget Vault v121 — Receipt Integrity & Import Batch Reconciliation

## Release goal

v121 turns retained metadata-only import receipts into a filterable batch timeline and adds an optional, verified metadata-only link between an explicitly prepared dry run and the receipt produced by the following guarded import.

The release does not rewrite receipts, repair history, merge accounts, change transactions automatically, or alter the v115 writer.

## Import batch timeline

Tools → Import & Restore now presents **Import batch timeline**.

For each retained receipt, v121 derives:

- destination-family sequence;
- receipt integrity status;
- inserted, skipped, and incoming counts;
- destination count before and after the import;
- predecessor and successor batch identities;
- receipt-to-receipt count continuity;
- repeated source-fingerprint notes;
- optional dry-run lineage;
- existing v120 receipt checks and manual rollback guidance.

Continuity states are:

- **Earliest retained:** no earlier receipt exists for that destination family.
- **Continuous:** the previous after-count matches the next before-count.
- **Legacy counts:** retained fields are insufficient for a complete comparison.
- **Untracked increase:** additional transactions appeared between receipts; this may be ordinary household activity or an unrecorded import.
- **Count decrease:** the next receipt begins below the prior after-count; a restore, cleanup, deletion, or older-vault switch may have occurred.

Continuity notes do not trigger a write, repair, restore, or deletion.

## Filters and local review

The timeline can be filtered by:

- Verified, Verified with notes, or Needs review;
- inserted rows, no change, or unknown result;
- continuous, earliest, legacy, or broken lineage;
- linked, unlinked, ready, or not-ready dry runs;
- destination family;
- local receipt, filename, schema, or format search.

Filenames, fingerprints, and local destination keys appear only in the current browser review. They are not included in timeline downloads.

## Verified dry-run lineage

v121 observes two explicit existing actions without replacing either engine:

1. **Prepare Dry Run** stages the current sanitized v119 readiness metadata in memory.
2. **Confirm Missing-Only Import** allows the unchanged v115 guarded writer to create its normal receipt.

After a receipt is verified, v121 links the staged dry run only when all of the following match:

- source format;
- detected schema label;
- normalized row count;
- would-insert count;
- would-skip count.

The link is stored under `gringottsImportBatchIndex.v1`, capped at 80 entries, written with read-back verification, and rolled back to the prior raw value after failure.

A missing link does not make an older import invalid. v121 does not backfill or infer dry runs after the fact.

## Metadata boundary

The batch index stores only:

- local link and receipt references;
- timestamps;
- a non-reversible dry-run signature;
- source format and schema labels;
- normalized, insert, skip, error, and warning counts;
- readiness and verified-count flags;
- explicit privacy-boundary declarations.

It excludes:

- transaction rows;
- source filenames;
- source fingerprints;
- mapping summaries;
- destination storage keys;
- account identifiers and labels;
- merchant names;
- balances;
- credentials and tokens;
- vault contents.

## Timeline downloads

v121 adds:

- **Download Full Timeline**;
- **Download Selected Batch**;
- **Copy Batch Summary**.

Downloads include sanitized receipt metadata, count checks, continuity, dry-run readiness, and lineage. They exclude local source and household identifiers.

## Workbook expansion

The Vault Workbook grows from 33 to **35 sheets**.

New sheets:

- **Receipt Integrity** — one row per retained receipt with integrity, result, continuity, counts, warnings, and dry-run state.
- **Batch Lineage** — predecessor/successor relationships, continuity detail, dry-run signature/count metadata, and orphan-link notes.

The existing Import Receipts sheet remains unchanged.

## Detailed Roadmap

Tools → Roadmap now shows v121 through v127:

- v121 — Receipt Integrity & Import Batch Reconciliation
- v122 — Account Cleanup & Merge Planning
- v123 — Recurring Cost Decisions & Subscription Review
- v124 — Household Scenario Comparison
- v125 — Close History & Trend Explainability
- v126 — Data Portability & Long-Term Maintenance
- v127 — Family Review Cadence & Governance Packs

Every release includes purpose, planned capabilities, dependencies, safeguards, and expected outcome.

## Preserved safeguards

v121 preserves:

- the v115 guarded missing-only writer;
- populated pre-import backup requirements;
- acknowledgement and confirmation;
- count and inserted-token verification;
- write rollback;
- metadata-only receipts;
- separate full restore targeting `gringottsBudgetVault.latest`;
- v117 exact-compatible profiles;
- v118 portable-definition review;
- v119 revision history and dry-run privacy;
- v120 receipt auditing and manual rollback guidance;
- best-populated-readable-vault selection;
- one live ES-module runtime;
- no service worker, analytics, remote parser, or institution connection;
- stable `rescue-v105.html`.

## Validation scope

Synthetic tests cover:

- dry-run-to-receipt reconciliation;
- stale and mismatched candidate rejection;
- bounded and deduplicated batch-index storage;
- continuous, legacy, increase, and decrease lineage;
- duplicate receipt identities and repeated source use;
- every timeline filter;
- sanitized timeline and selected-batch downloads;
- real guarded import plus verified metadata linkage;
- vault count and writer-safeguard preservation;
- 35-sheet workbook generation;
- desktop and phone timeline accessibility;
- v121–v127 Roadmap accessibility and containment;
- module-instance, route-ownership, privacy, security, and lazy-load contracts.
