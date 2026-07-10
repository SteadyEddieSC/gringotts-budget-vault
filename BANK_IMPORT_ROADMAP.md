# Bank Export Import Roadmap

## Current architecture

### v120 — Import Receipt Audit & Rollback Guidance

v120 adds a read-only audit layer above the existing metadata-only v115 receipts. It does not alter the parser, reconciliation rules, transaction writer, profile stores, or restore operation.

The audit reviews:

- incoming, inserted, and skipped count arithmetic;
- destination transaction count before and after the import;
- guarded-writer verification result;
- retained source date coverage and warning count;
- the currently readable destination count when available;
- whether a populated pre-import backup was expected;
- the expected `Gringotts_v115_pre_import_<count>_*.json` filename pattern.

Current-vault differences are notes rather than automatic failures because valid household activity may have occurred after the receipt was created.

The selected audit can be downloaded as sanitized JSON containing counts, format/schema metadata, checks, backup expectations, and manual guidance. It excludes transaction rows, source filenames, source fingerprints, mappings, destination storage keys, account identifiers, merchant names, and vault contents.

No automatic rollback is available. The audit can copy a manual checklist or open the separate Full vault restore task, but it never scans files, restores a vault, deletes rows, or rewrites transactions.

### v119 — Profile Versioning & Dry-Run Diagnostics

v119 adds a metadata-only revision and readiness layer above the v118 portability controller, v117 profile model, and v115 guarded transaction engine.

Existing profile Update and portable-bundle Replace pause before storage. The user sees every changed mapping and normalization option, acknowledges the comparison, and confirms the revision. Profile and revision metadata are written together, read back, and rolled back to both prior raw values after failure.

Revision summaries are stored separately under `gringottsImportProfileRevisions.v1`, capped at 60 total and 8 per profile. Destination-account-label values are redacted. No transaction rows, source files, filenames, fingerprints, balances, credentials, or vault contents are retained.

The Import screen also offers an explicit local dry run after source inspection. Preparing it performs no transaction write. Download requires a second explicit action and excludes rows, merchants, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents.

### v118 — Profile Portability & Institution Patterns

Portable profile definitions contain mapping metadata only. Bundles omit transaction rows, raw source content, filenames, fingerprints, balances, credentials, tokens, full account numbers, local profile IDs, and local profile timestamps.

Every selected bundle is reviewed in memory and every definition requires Add, Replace, or Skip. Replace is limited to an identity-matched saved profile and is revision-gated by v119.

### v117 — Import Profiles & Field Validation

Browser-local profiles remember reviewed mapping metadata and apply automatically only when exactly one profile matches format, schema, delimiter, ordered headers, and remembered mapped headers. Several exact matches require an explicit choice.

### v116 — Import and Restore Task Separation

Tools presents two distinct tasks:

- **Import transactions** adds reviewed missing rows from a supported export;
- **Restore full vault** replaces the destination only through guarded restore.

The restore destination remains exactly `gringottsBudgetVault.latest`.

### v115 — Bank Export Import & Mapping

v115 implements local import for common bank and credit-card transaction exports while preserving duplicate-safe, backup-first writes.

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

### Explicitly outside normal import

- PDF statements and OCR;
- XLS and XLSX transaction exports;
- CAMT.053 and CAMT.054 XML;
- MT940;
- archives, executables, and unsupported binaries;
- direct institution credentials or account connections.

PDF statements require a separate extraction and verification workflow because visual statements are not reliable machine-readable ledgers.

## Implemented import stages

1. **Local file inspection**
   - Reads the file only inside the browser.
   - Detects format from extension and content signature.
   - Blocks unsupported formats, files over 5 MB, and exports over 25,000 normalized rows.
   - Uses UTF-8 first and Windows-1252 fallback with a visible warning.

2. **Institution and schema detection**
   - Detects OFX-family transaction blocks and delimited header patterns.
   - Exercises card, deposit/withdrawal, wallet, signed-amount, and debit/credit families with fictional fixtures.
   - Shows format, schema, confidence, encoding, row count, and an in-memory source fingerprint.
   - Does not silently accept ambiguous dates or amount signs.

3. **Profile, revision, portability, and mapping review**
   - Shows saved profile identity and destination handling.
   - Exports and imports sanitized definitions.
   - Requires Add, Replace, or Skip for every portable definition.
   - Requires field-by-field revision confirmation before Update or Replace.
   - Maps date, description, amounts, status, account, memo, stable ID, category, and type.
   - Explains date, sign, ID, account, status, category, and type behavior.

4. **Normalization preview and local dry run**
   - Validates dates and amounts.
   - Supports bank-standard, Gringotts-standard, separate debit/credit, and type-assisted signs.
   - Masks mapped account identifiers.
   - Defaults new rows to `Other` unless source-category use is explicitly enabled.
   - Uses OFX-family FITID as the preferred stable identifier.
   - Creates an optional metadata-only readiness diagnostic without transaction rows or household identifiers.

5. **Duplicate and overlap review**
   - Uses stable IDs, deterministic fingerprints, date coverage, fuzzy matching, and pending-to-posted detection.
   - Skips exact matches with an explanation.
   - Requires Keep, Skip, or Defer for probable matches.
   - Displays overlap and missing-period warnings.

6. **Guarded write**
   - Requires a populated readable destination.
   - Requires a downloaded populated pre-import backup before insertion.
   - Requires acknowledgement and confirmation.
   - Writes only approved missing rows.
   - Restores the prior raw value after failed write or verification.
   - Reads back counts and inserted stable-ID/fingerprint tokens.

7. **Metadata-only receipt**
   - Records format/schema, mapping summary, warnings, coverage, duplicate counts, destination counts, source metadata, and verification.
   - Does not copy imported transaction rows.
   - Feeds the Import Receipts workbook sheet.

8. **Receipt audit and manual rollback guidance**
   - Reconciles retained counts and verification state.
   - Identifies whether a pre-import backup was expected.
   - Produces a sanitized audit package after an explicit download action.
   - Offers manual guidance only; it never performs rollback.

## Receipt audit stages

1. **Select**
   - Choose a retained receipt in the local browser.
   - Source filename and fingerprint may be shown on screen for local identification only.

2. **Audit**
   - Check receipt timestamp, writer result, incoming arithmetic, destination arithmetic, date range, warnings, and current destination comparison.
   - Classify the result as Verified, Verified with notes, or Needs review.

3. **Identify backup expectation**
   - An insertion receipt expects the v115 pre-import backup matching the retained pre-import transaction count.
   - A verified no-change receipt does not invent a backup requirement.
   - v120 does not know or scan the backup's storage location.

4. **Download or copy guidance**
   - Download a sanitized JSON audit or copy the manual checklist.
   - Exclude rows, filenames, fingerprints, mappings, destination keys, account identifiers, merchants, and vault contents.

5. **Optional separate restore**
   - Open the Full vault restore task.
   - Preview and verify the chosen backup manually.
   - Acknowledge and confirm only when rollback is genuinely necessary.

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

Profile metadata, bundle import, revision history, dry runs, receipts, and receipt audits are not vault restore operations.

## Safety requirements

- No import content leaves the browser except an explicit local download.
- No remote parser, analytics endpoint, or institution credential connection.
- No raw source rows in profiles, revision history, bundles, dry runs, receipts, or audits.
- No automatic profile replacement, account merge, source-category use, or receipt repair.
- No profile Update or Replace without revision review.
- No empty-vault overwrite.
- No transaction write with unresolved mapping, date, sign, or duplicate decisions.
- No transaction write without a populated backup.
- No successful result without read-back verification.
- No automatic rollback from receipt review.

## Test coverage

Synthetic coverage includes:

- receipt normalization, verified imports, verified no-change imports, and inconsistent arithmetic;
- current-destination comparison and backup filename expectations;
- privacy-safe audit downloads and vault byte-for-byte noninterference;
- separate restore navigation and disabled restore before a valid preview;
- profile revisions, dry runs, bundle decisions, and field validation;
- card, ledger, wallet, signed-amount, debit/credit, and OFX-family fixtures;
- exact, fuzzy, pending-to-posted, coverage, malformed, oversized, and excessive-row cases;
- phone, tablet, Android, iPhone, desktop, axe, and observer-stability coverage;
- no network writes and repository security boundaries.

Real household exports, profiles, revisions, bundles, dry runs, receipts, receipt audits, backups, and reports must never be committed to the public repository or CI artifacts.

## Next planned release

### v121 — Receipt Integrity & Import Batch Reconciliation

Planned focus:

- metadata-only batch lineage and receipt timeline filters;
- missing, duplicated, legacy, and inconsistent receipt identification;
- safe relation between dry-run readiness metadata and resulting receipts;
- workbook receipt integrity status and explanations;
- no automatic receipt repair or transaction change.

See `ROADMAP.md` for the detailed v121–v126 planning horizon.

## Candidate future formats

After representative real-export validation, separately evaluate CAMT, MT940, institution JSON, guarded XLSX, and additional property-testing support.
