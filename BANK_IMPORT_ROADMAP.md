# Bank Export Import Roadmap

## Current architecture

### v122 — Account Cleanup & Merge Planning

v122 adds a planning layer above the existing transaction, profile, receipt, and batch-lineage architecture. It does not replace the parser, duplicate engine, writer, receipt history, or restore task.

The cleanup surface derives:

- masked account-label inventory;
- transaction, pending, owner, and date-range counts;
- likely label drift, spelling drift, possible renames, and possible duplicates;
- explainable confidence evidence;
- reference counts across recurring items, rules, budgets, bills and paydays, goals, planning, and other metadata;
- explicit household cleanup decisions.

Decision metadata is stored under `gringottsAccountCleanupPlan.v1`, capped at 120 records, read-back verified, and restored to the previous raw value after failure.

The plan store contains candidate IDs, decisions, timestamps, and an inventory signature. It excludes transaction rows, raw labels, full account identifiers, merchants, balances, source files, credentials, tokens, and vault contents.

v122 has no account-write engine. A Merge Plan or Rename Plan is household intent only. No account history, rule, budget, receipt, or transaction is changed.

The workbook contains 37 sheets, adding Account Inventory and Account Cleanup Plan while preserving Import Receipts, Receipt Integrity, and Batch Lineage.

### v121 — Receipt Integrity & Import Batch Reconciliation

v121 derives a timeline above the v115 metadata-only receipt history. Existing receipts remain authoritative and are never rewritten, repaired, or deleted.

The timeline derives:

- destination-family sequence;
- receipt integrity state;
- before/after-count continuity;
- predecessor and successor references;
- duplicate receipt identities;
- repeated source-fingerprint notes;
- optional verified dry-run lineage.

A dry-run link is stored only when format, schema, normalized row count, would-insert count, and would-skip count reconcile to the resulting receipt.

Links are stored under `gringottsImportBatchIndex.v1`, capped at 80, read-back verified, and restored after failure. They exclude transaction rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, balances, credentials, and vault contents.

### v120 — Import Receipt Audit & Rollback Guidance

v120 remains the receipt-arithmetic and manual-recovery layer. It checks incoming, inserted, skipped, before, after, verification, date coverage, warning counts, current destination count, and expected backup pattern.

No automatic rollback is available. Restore remains a separate confirmed task.

### v119 — Profile Versioning & Dry-Run Diagnostics

v119 retains bounded revision history and explicit metadata-only readiness diagnostics. Preparing a dry run performs no transaction write. Downloading is a separate action.

### v118 — Profile Portability & Institution Patterns

Portable definitions remain sanitized metadata requiring explicit Add, Replace, or Skip. Replace remains identity-matched and revision-gated.

### v117 — Import Profiles & Field Validation

Browser-local profiles remain capped at 24 sanitized records and apply automatically only when exactly one source is compatible.

### v116 — Import and Restore Task Separation

Tools presents separate Import transactions and Restore full vault tasks. Restore targets exactly `gringottsBudgetVault.latest`.

### v115 — Bank Export Import & Mapping

v115 remains the authoritative local parser, reconciliation engine, guarded writer, and receipt store.

## Implemented format scope

### First-class formats

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon-delimited text;
- pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

### Outside normal import

- PDF statements and OCR;
- XLS and XLSX transaction exports;
- CAMT.053 and CAMT.054;
- MT940;
- archives, executables, and unsupported binaries;
- direct institution credentials or account connections.

## Implemented import stages

1. **Local inspection**
   - Browser-only file read.
   - Extension and content detection.
   - 5 MB and 25,000-row limits.
   - UTF-8 with visible Windows-1252 fallback.

2. **Schema detection**
   - OFX-family and delimited-header recognition.
   - Fictional card, deposit, wallet, signed-amount, and debit/credit fixtures.
   - No silent date or sign guesses.

3. **Profile and mapping review**
   - Exact-compatible profile handling.
   - Sanitized portable definitions.
   - Revision-gated Update and Replace.
   - Explicit field mapping and explanations.

4. **Normalization and dry run**
   - Date/amount validation.
   - Explicit sign modes.
   - Masked account identifiers.
   - Optional metadata-only readiness diagnostic.

5. **Duplicate and overlap review**
   - Stable IDs and deterministic fingerprints.
   - Fuzzy and pending-to-posted review.
   - Date coverage and overlap warnings.

6. **Guarded write**
   - Populated readable destination.
   - Downloaded populated pre-import backup.
   - Acknowledgement and confirmation.
   - Missing-only insertion.
   - Raw-value rollback after failure.
   - Count and inserted-token read-back verification.

7. **Metadata-only receipt**
   - Records source metadata, mappings, counts, coverage, duplicates, destination counts, and verification.
   - Does not copy transaction rows.

8. **Receipt audit and rollback guidance**
   - Reconciles counts and verification.
   - Shows expected backup pattern.
   - Produces sanitized audit output.
   - Never performs rollback.

9. **Receipt integrity and batch lineage**
   - Derives sequence and continuity from retained receipts.
   - Optionally links a reconciled explicit dry run.
   - Produces sanitized timeline outputs.
   - Never repairs receipts or changes transactions.

10. **Account cleanup planning**
    - Inventories masked account labels and downstream references.
    - Surfaces explainable cleanup candidates.
    - Records planning decisions only.
    - Never renames, merges, deletes, or rewrites account history.

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

Profiles, bundles, revisions, dry runs, receipts, audits, batch links, and cleanup plans are not restore operations.

## Safety requirements

- No import content leaves the browser except an explicit download.
- No remote parser, analytics, or institution connection.
- No raw rows in profiles, revisions, bundles, dry runs, receipts, audits, batch links, or cleanup plans.
- No automatic profile replacement, account merge, account rename, receipt repair, or rollback.
- No empty-vault overwrite.
- No write with unresolved mapping, date, sign, or duplicate decisions.
- No transaction write without a populated backup.
- No successful write without read-back verification.

## Test coverage

Synthetic coverage includes:

- parser formats, malformed input, size, and row limits;
- mapping profiles, bundle decisions, revisions, and dry runs;
- exact, fuzzy, pending-to-posted, coverage, and overlap cases;
- verified/no-change receipt arithmetic;
- dry-run-to-receipt reconciliation and mismatch rejection;
- bounded batch-index storage and rollback;
- continuous, legacy, increase, and decrease lineage;
- timeline filters and privacy-safe downloads;
- masked account inventory, candidate evidence, and downstream reference counts;
- bounded cleanup decisions, stale-plan reset, vault noninterference, and privacy-safe cleanup downloads;
- 37-sheet workbook generation;
- desktop, phone, tablet, Android, iPhone, axe, and observer-stability checks;
- repository security and no-network-write contracts.

Real household exports, profiles, revisions, dry runs, receipts, timelines, cleanup plans, backups, and reports must never be committed or uploaded to CI artifacts.

## Next planned release

### v123 — Recurring Cost Decisions & Subscription Review

Planned focus:

- group recurring merchants by cadence, account, amount stability, and price changes;
- track Keep, Cancel, Renegotiate, Investigate, and Completed decisions;
- estimate annualized impact with visible assumptions;
- assign owners and follow-up dates;
- feed selected actions into Guided Plan and reports;
- never contact merchants or change payments automatically.

See `ROADMAP.md` for the detailed v122–v128 horizon.

## Candidate future formats

After representative validation, separately evaluate CAMT, MT940, institution JSON, guarded XLSX, and additional property-testing support.
