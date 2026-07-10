# Bank Export Import Roadmap

## Current architecture

### v121 — Receipt Integrity & Import Batch Reconciliation

v121 adds a derived timeline above the existing v115 metadata-only receipt history. Existing receipts remain authoritative and are never rewritten, repaired, or deleted.

The timeline derives:

- destination-family sequence;
- receipt integrity status;
- before/after-count continuity;
- predecessor and successor batch references;
- duplicate receipt identities;
- repeated source-fingerprint notes;
- optional verified dry-run lineage.

Continuity states are earliest retained, continuous, legacy counts, untracked increase, and count decrease. They are review evidence only and never trigger a write, restore, deletion, or repair.

#### Verified dry-run links

The v121 route layer observes the existing explicit Prepare Dry Run and Confirm Missing-Only Import actions. It does not replace the v119 diagnostic generator or v115 writer.

A link is stored only when the resulting receipt reconciles to the staged dry run on:

- source format;
- schema label;
- normalized row count;
- would-insert count;
- would-skip count.

Links are stored under `gringottsImportBatchIndex.v1`, capped at 80 records, read-back verified, and restored to the prior raw value after failure.

The index stores references, timestamps, a non-reversible signature, format/schema labels, counts, readiness flags, and explicit privacy declarations. It excludes transaction rows, filenames, fingerprints, mappings, destination keys, account identifiers, merchants, balances, credentials, and vault contents.

A missing link does not invalidate an older import. v121 does not infer or backfill dry-run history.

#### Timeline outputs

The user can:

- filter by integrity, result, lineage, dry-run state, destination family, and local search;
- download a sanitized full timeline;
- download a sanitized selected batch;
- copy a local batch summary;
- open the separate Full vault restore task.

The workbook now contains 35 sheets, adding Receipt Integrity and Batch Lineage while preserving Import Receipts.

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

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

Profiles, bundles, revisions, dry runs, receipts, audits, and batch links are not restore operations.

## Safety requirements

- No import content leaves the browser except an explicit download.
- No remote parser, analytics, or institution connection.
- No raw rows in profiles, revisions, bundles, dry runs, receipts, audits, or batch links.
- No automatic profile replacement, account merge, receipt repair, or rollback.
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
- bounded index storage and rollback;
- continuous, legacy, increase, and decrease lineage;
- timeline filters and privacy-safe downloads;
- 35-sheet workbook generation;
- desktop, phone, tablet, Android, iPhone, axe, and observer-stability checks;
- repository security and no-network-write contracts.

Real household exports, profiles, revisions, dry runs, receipts, timelines, backups, and reports must never be committed or uploaded to CI artifacts.

## Next planned release

### v122 — Account Cleanup & Merge Planning

Planned focus:

- inventory account labels, masked identifiers, counts, and date ranges;
- explain likely duplicates and naming drift;
- preview rename/merge effects before any write;
- require backup, acknowledgement, confirmation, and read-back verification;
- never merge accounts automatically.

See `ROADMAP.md` for the detailed v122–v127 horizon.

## Candidate future formats

After representative validation, separately evaluate CAMT, MT940, institution JSON, guarded XLSX, and additional property-testing support.
