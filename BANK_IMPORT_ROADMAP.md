# Bank Export Import Roadmap

## Current architecture

### v118 — Profile Portability & Institution Patterns

v118 adds a metadata-only portability layer above the v117 profile model and v115 guarded transaction engine.

Portable bundles may contain:

- profile name;
- source format and detected schema;
- delimiter metadata;
- non-reversible ordered-header signature and header count;
- selected source header names;
- date-order and amount-sign options;
- account handling and destination label;
- explicit source-category preference.

Portable bundles never contain transaction rows, raw records, source file content, source filenames, source fingerprints, balances, credentials, tokens, full account numbers, local profile IDs, or local profile timestamps.

A selected bundle is previewed in memory and every definition is classified as exact, same-definition, identity-conflict, name-conflict, or new. Every item requires Add, Replace, or Skip. Replace is limited to an identity-matched saved profile. Exact and same-definition items default to Skip.

Profile bundle writes remain capped at 24 sanitized records. The saved library is read back, and a failed write or verification restores the prior raw profile-library value.

### v117 — Import Profiles & Field Validation

v117 adds reusable browser-local mapping metadata above the v115 parser and guarded writer.

Profiles may store:

- a user-provided name;
- format and detected schema;
- delimiter metadata;
- a non-reversible ordered-header signature;
- selected source header names;
- date-order and amount-sign options;
- account handling and destination label;
- explicit source-category preference;
- timestamps.

Profiles never store transaction rows, raw records, file content, filenames, source fingerprints, balances, credentials, or full unmasked source account identifiers.

Compatibility is exact. Format, schema, delimiter, ordered headers, and all remembered mapped headers must match. One compatible profile applies automatically. Several compatible profiles require an explicit choice. No match falls back to normal manual mapping with a visible explanation.

### v116 — Import and Restore Task Separation

Tools presents two distinct tasks:

- **Import transactions** adds reviewed missing rows from a supported export;
- **Restore full vault** replaces the destination only through guarded restore.

The bank import path shows Inspect, Map, and Reconcile progress. The restore panel remains hidden until explicitly selected. Its destination remains exactly `gringottsBudgetVault.latest`.

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

- PDF statements;
- OCR and visual table extraction;
- XLS and XLSX transaction exports;
- CAMT.053 and CAMT.054 XML;
- MT940;
- archives and compressed files;
- executables and unsupported binary formats;
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
   - Exercises card activity, deposit/withdrawal ledger, digital-wallet, generic signed-amount, and generic debit/credit families with fictional fixtures.
   - Shows format, schema, confidence, institution, encoding, row count, and source fingerprint.
   - Does not silently accept an ambiguous date or amount convention.

3. **Profile library, portability, and mapping review**
   - Shows saved profile name, destination label, source pattern, and non-reversible identity.
   - Exports sanitized profile definitions without local profile IDs or transaction data.
   - Inspects imported profile bundles before storage.
   - Requires Add, Replace, or Skip for every portable definition.
   - Checks exact-compatible local profiles without retaining source rows.
   - Applies one exact match automatically or requires an explicit selection for several.
   - Maps date, description/payee, signed amount, debit, credit, status, account, memo, stable ID, category, and type.
   - Explains date, amount, ID, account, status, category, and type behavior.
   - Allows immediate correction before duplicate analysis.

4. **Normalization preview**
   - Validates and normalizes dates.
   - Supports bank-standard, Gringotts-standard, separate debit/credit, and type-assisted signs.
   - Masks account identifiers when mapped-account mode is selected.
   - Defaults new rows to `Other` unless source-category use is explicitly enabled.
   - Uses OFX-family FITID as the preferred stable identifier.

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

7. **Import receipt**
   - Records schema, mapping, warnings, coverage, duplicate counts, destination counts, fingerprint, and verification.
   - Stores metadata only and does not copy imported transaction rows.
   - Feeds the Import Receipts sheet in the 33-sheet Vault Workbook.

## Profile bundle review stages

1. **Export**
   - Explicit user download only.
   - Versioned JSON with sanitized definitions.
   - No filenames, transaction rows, local IDs, or local timestamps.

2. **Inspect**
   - JSON only, 256 KB maximum.
   - Rejects unknown bundle kind/version and forbidden transaction-shaped keys.
   - Keeps selected filename and bundle content in memory only during review.

3. **Compare**
   - Explains source identity and mapping/option differences.
   - Suggests a unique local name when needed.
   - Exposes replacement targets only for identity matches.

4. **Confirm**
   - Requires an action for every item and an acknowledgement.
   - Saves profile metadata only.
   - Reads back the sanitized library.
   - Restores the prior raw profile-library value after failure.

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

Profile bundle import is not a vault restore and never writes the restore destination.

## Safety requirements

- No export, bundle, or transaction content leaves the browser.
- No remote parser, analytics endpoint, or institution credential connection.
- No raw source rows, filenames, or source fingerprints in profiles or portable bundles.
- No automatic profile application unless exactly one profile matches.
- No automatic portable-profile replacement.
- No automatic source-category use.
- No unmasked source account identifier stored from mapped data.
- No automatic account merge based only on a similar name.
- No empty-vault overwrite.
- No write with unresolved fields, dates, signs, or duplicate decisions.
- No transaction write without a populated backup.
- No successful result without read-back verification.

## Test coverage

Synthetic fixtures cover:

- portable bundle identity, sanitization, classification, and forbidden-key rejection;
- reviewed Add, Replace, and Skip decisions;
- duplicate-name and invalid-replacement blocking;
- local profile-ID and creation-time preservation after replacement;
- profile bundle download privacy and filename non-retention;
- profile identity, exact compatibility, conflicts, and deletion;
- metadata-only profile persistence and vault noninterference;
- card activity, deposit/withdrawal ledger, and digital-wallet headers;
- field-validation explanations and remembered choices;
- signed and separate debit/credit CSV values;
- quoted and multiline fields;
- BOM and multiple delimiters;
- US, ISO, compact, ambiguous, and invalid dates;
- bank, Gringotts, type-assisted, debit, and credit signs;
- QFX/OFX blocks, FITIDs, entities, and masked accounts;
- exact, fuzzy, and pending-to-posted duplicates;
- coverage gaps and overlap;
- malformed, unsupported, oversized, and excessive-row files;
- deterministic malformed-input mutations;
- legacy JSON compatibility;
- separated import and restore tasks;
- phone, tablet, Android, iPhone, and desktop layouts;
- axe and observer-stability portability coverage;
- no network writes;
- backup, rollback, and verification receipts.

Real household exports, saved profiles, and exported profile bundles must never be committed to the public repository or CI artifacts.

## Next release

### v119 — Profile Versioning & Dry-Run Diagnostics

Planned scope:

- compare saved and proposed profile revisions field by field;
- retain bounded metadata-only revision summaries;
- create an explicit local dry-run diagnostic before a transaction write;
- describe source format, selected mapping, validation, coverage, and duplicate counts without raw rows or household identifiers;
- preserve exact compatibility, v118 bundle safeguards, bounded storage, guarded transaction writes, and vault separation.

## Candidate future formats

After real export testing identifies a concrete need, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX imports;
- a dedicated property-testing dependency;
- a second static-analysis tool when custom rules add real value.
