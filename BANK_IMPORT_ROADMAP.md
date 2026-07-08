# Bank Export Import Roadmap

## Planned release

### v115 — Bank Export Import & Mapping

The goal is to import common bank and credit-card exports directly into Gringotts while preserving the existing local-first, duplicate-safe, backup-first transaction workflow.

This should be implemented as a dedicated release rather than a small parser patch because financial institutions vary widely in field names, amount signs, date formats, pending/posted behavior, account identifiers, encodings, and malformed export behavior.

## Initial format scope

### First-class formats

- CSV and delimited text exports;
- OFX;
- QFX;
- QBO.

### Candidate formats after fixture validation

- CAMT.053 and CAMT.054 XML;
- MT940;
- institution-specific JSON or XLSX exports when a safe, local parser is practical.

PDF statements should not be treated as transaction exports in this release. They require a separate extraction and verification workflow because visual statements are not reliable machine-readable ledgers.

## Import stages

1. **Local file inspection**
   - Read the file only inside the browser.
   - Detect format from both extension and content signature.
   - Reject executables, archives, unsupported binaries, and unexpectedly large files.

2. **Institution and schema detection**
   - Detect known header patterns without assuming that every CSV uses the same columns.
   - Show the detected institution or generic schema and confidence.
   - Never silently guess when date, amount, or description fields are ambiguous.

3. **Mapping preview**
   - Preview date, description/payee, signed amount, debit, credit, status, account, memo, transaction ID, and category candidates.
   - Allow explicit user corrections before normalization.
   - Display ignored source columns rather than dropping them invisibly.

4. **Normalization preview**
   - Normalize dates to ISO format only after validation.
   - Normalize debit/credit signs using the detected source convention.
   - Preserve original source values in preview/trace metadata, not as redundant transaction copies after import.
   - Explain pending-to-posted handling.

5. **Duplicate and overlap review**
   - Reuse the v109 stable-ID, deterministic fingerprint, date-coverage, overlap, and fuzzy duplicate workflow.
   - Never discard an ambiguous incoming row automatically.
   - Support Keep, Skip, and Defer/review decisions.

6. **Guarded write**
   - Select the best populated readable vault.
   - Create and verify a backup before broad writes.
   - Require acknowledgement and confirmation.
   - Write only reviewed missing rows.
   - Read back the saved vault and verify inserted transaction tokens and counts.

7. **Import receipt**
   - Record format, detected schema, source filename, date coverage, counts, duplicate decisions, warnings, and verification status.
   - Store metadata only; do not create another full copy of imported transactions.

## Safety requirements

- No bank export or transaction content leaves the browser.
- No remote parsing service, analytics endpoint, or institution credential connection.
- No automatic category overwrite.
- No automatic account merge based only on a similar name.
- No empty-vault overwrite.
- No write when required fields are unresolved.
- No write when amount-sign interpretation is uncertain.
- No write when the backup or read-back verification fails.
- Restore destination remains exactly `gringottsBudgetVault.latest`.

## Testing approach

Use synthetic fixtures only, covering:

- common CSV header variants;
- separate debit and credit columns;
- one signed amount column;
- US and ISO date formats;
- quoted commas and multiline memos;
- UTF-8 BOM and common legacy encodings where supported safely;
- OFX/QFX/QBO stable transaction IDs;
- pending-to-posted duplicates;
- account overlap and missing-month imports;
- invalid XML/SGML, malformed rows, missing amounts, and ambiguous signs;
- very large files and unsupported formats;
- desktop, tablet, and phone preview layouts;
- no network writes;
- backup-first and read-back verification.

Real household exports must never be committed to the public repository or CI artifacts.

## Definition of done

The release is complete only when a user can select a supported bank export, understand exactly how it was interpreted, correct ambiguous mappings, review duplicates, create a verified backup, and import only approved missing transactions without uploading the file or weakening any current restore and vault safeguards.
