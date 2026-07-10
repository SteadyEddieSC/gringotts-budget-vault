# Bank Export Import Roadmap

## Shipped release

### v115 — Bank Export Import & Mapping

v115 implements local import for common bank and credit-card transaction exports while preserving the existing duplicate-safe, backup-first workflow.

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

### Explicitly outside v115

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
   - Blocks executables, archives, Office files, PDFs, unsupported formats, files over 5 MB, and exports over 25,000 normalized rows.
   - Uses UTF-8 first and a Windows-1252 fallback with a visible warning.

2. **Institution and schema detection**
   - Detects OFX-family transaction blocks and generic CSV header patterns.
   - Shows the format, schema label, confidence, institution where available, encoding, row count, and a source fingerprint.
   - Does not silently accept an ambiguous date or signed-amount convention.

3. **Mapping preview**
   - Maps transaction date, description/payee, signed amount, debit, credit, status, account, memo, stable transaction ID, category, and transaction type.
   - Allows explicit user correction before duplicate analysis.
   - Displays ignored source columns.

4. **Normalization preview**
   - Normalizes validated dates to ISO format.
   - Supports:
     - bank-standard signed values: negative outflow and positive inflow;
     - Gringotts-standard values: positive expense and negative income;
     - separate debit and credit columns;
     - explicit transaction-type-assisted interpretation.
   - Masks source account identifiers to the final four characters when mapped-account mode is selected.
   - Uses `Other` by default so imported rows enter Review Queue unless source-category use is explicitly enabled.
   - Converts OFX-family amounts to Gringotts signs and uses FITID as the preferred stable identifier.

5. **Duplicate and overlap review**
   - Reuses stable IDs, deterministic fingerprints, date coverage, overlap, fuzzy matching, and pending-to-posted detection.
   - Skips exact matches automatically with an explanation.
   - Requires Keep, Skip, or Defer decisions for every probable match.
   - Displays missing-month and historical-period warnings.

6. **Guarded write**
   - Requires a populated readable destination vault.
   - Requires a downloaded v115 pre-import backup before any transaction insertion.
   - Requires acknowledgement and confirmation.
   - Writes only approved missing rows.
   - Restores the prior raw vault value when a write or verification fails.
   - Reads the saved vault back and verifies transaction counts and inserted stable-ID/fingerprint tokens.

7. **Import receipt**
   - Records format, schema, confidence, encoding, mapping summary, sign and date options, warnings, coverage, duplicate counts, destination counts, source fingerprint, and verification result.
   - Stores metadata only and does not copy imported transaction rows.
   - Adds an Import Receipts sheet to the 33-sheet Vault Workbook.

## Preserved restore boundary

Incremental bank export import and full vault restore remain separate workflows.

Full restore still:

- accepts populated Gringotts JSON only;
- shows a restore preview;
- requires acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- performs read-back verification;
- blocks an empty transaction array.

## Safety requirements

- No bank export or transaction content leaves the browser.
- No remote parser, analytics endpoint, or institution credential connection.
- No automatic source-category use without an explicit option.
- No unmasked source account number stored from mapped CSV or OFX-family data.
- No automatic account merge based only on a similar name.
- No empty-vault overwrite.
- No write when required fields, dates, signs, or duplicate decisions remain unresolved.
- No transaction write without a populated backup.
- No successful result without read-back verification.
- Restore destination remains exactly `gringottsBudgetVault.latest`.

## Test coverage

Synthetic fixtures cover:

- signed CSV values;
- separate debit and credit columns;
- quoted commas, escaped quotes, and multiline memos;
- UTF-8 BOM;
- comma, tab, semicolon, and pipe delimiters;
- US, ISO, and compact dates;
- ambiguous date blocking;
- bank, Gringotts, type-assisted, debit, and credit signs;
- QFX/OFX STMTTRN blocks and FITIDs;
- masked accounts;
- stable-ID and fingerprint duplicates;
- fuzzy and pending-to-posted review;
- coverage gaps and overlap;
- malformed delimited and OFX-family data;
- unsupported and oversized files;
- deterministic malformed-input mutations;
- legacy Gringotts JSON compatibility;
- desktop, tablet, Android, and iPhone layouts;
- no network writes;
- backup-first writes, rollback, and verification receipts.

The pure parser and mutation suite uses Node's built-in test runner before any Playwright browser is installed.

Real household exports must never be committed to the public repository or CI artifacts.

## Candidate future formats

After real export testing identifies a concrete need, evaluate separately:

- CAMT.053 and CAMT.054;
- MT940;
- institution-specific JSON;
- guarded XLSX imports;
- a dedicated property-based testing dependency such as fast-check;
- a second static-analysis tool such as Semgrep Community Edition.

These should be added only when their value exceeds maintenance time, dependency weight, and duplicate-alert noise.
