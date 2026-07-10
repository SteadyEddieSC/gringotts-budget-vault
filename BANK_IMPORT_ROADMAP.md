# Bank Export Import Roadmap

## Current architecture

### v116 — Import and Restore Task Separation

v116 keeps the v115 parser and guarded writer unchanged while presenting two distinct Tools tasks:

- **Import transactions** adds reviewed missing rows from a supported export;
- **Restore full vault** replaces the destination only through guarded restore.

The bank import path now shows Inspect, Map, and Reconcile progress. This progress is derived from the in-memory import session and creates no new transaction or metadata storage.

The restore panel is hidden until explicitly selected. Its destination remains exactly `gringottsBudgetVault.latest`.

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
   - Detects OFX-family transaction blocks and generic delimited header patterns.
   - Shows format, schema, confidence, institution, encoding, row count, and source fingerprint.
   - Does not silently accept an ambiguous date or amount convention.

3. **Mapping preview**
   - Maps date, description/payee, signed amount, debit, credit, status, account, memo, stable ID, category, and type.
   - Allows explicit correction before duplicate analysis.
   - Displays ignored source columns.

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

## Preserved restore boundary

Full restore:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

## Safety requirements

- No export or transaction content leaves the browser.
- No remote parser, analytics endpoint, or institution credential connection.
- No automatic source-category use.
- No unmasked source account identifier stored from mapped data.
- No automatic account merge based only on a similar name.
- No empty-vault overwrite.
- No write with unresolved fields, dates, signs, or duplicate decisions.
- No transaction write without a populated backup.
- No successful result without read-back verification.

## Test coverage

Synthetic fixtures cover:

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
- no network writes;
- backup, rollback, and verification receipts.

Real household exports must never be committed to the public repository or CI artifacts.

## Next release

### v117 — Import Profiles & Field Validation

Planned scope:

- remember reviewed mapping choices by local schema and header signature;
- store mappings and options only, never transaction copies;
- reapply a profile only when format and headers still match;
- show why every field was remembered;
- allow correction before normalization;
- expand synthetic institution-pattern fixtures;
- strengthen field-level validation messages;
- preserve explicit duplicate review and backup-first verified writes.

## Candidate future formats

After real export testing identifies a concrete need, separately evaluate:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX imports;
- a dedicated property-testing dependency;
- a second static-analysis tool when custom rules add real value.
