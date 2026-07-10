# v115 — Bank Export Import & Mapping

## Release purpose

v115 adds a guarded local workflow for importing common bank and credit-card transaction exports without uploading files or weakening the existing restore, duplicate, backup, and read-back safeguards.

## Supported sources

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon-delimited text;
- pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

The release intentionally blocks PDF statements, Office files, archives, executables, unsupported binary formats, oversized files, and excessive row counts.

## Local inspection

The browser displays:

- source filename and byte size;
- UTF-8 or Windows-1252 decoding result;
- detected format and reason;
- detected schema and confidence;
- institution where available;
- source row count;
- a SHA-256 source fingerprint when available;
- a raw or interpreted source preview.

No source content is transmitted or stored as an import receipt.

## Explicit mapping

Delimited files can map:

- transaction date;
- description, merchant, or payee;
- one signed amount;
- separate debit and credit values;
- pending or posted status;
- source account;
- memo or notes;
- stable transaction ID;
- source category;
- transaction type.

Ignored columns are displayed.

Ambiguous dates are blocked until month/day/year or day/month/year is selected. Signed amounts are blocked until the user selects bank-standard, Gringotts-standard, type-assisted, or separate debit/credit handling.

## Normalization

- Bank-standard negative outflows become positive Gringotts expenses.
- Bank-standard positive inflows become negative Gringotts income.
- Separate debit and credit columns are normalized independently.
- OFX-family `TRNAMT` values use the same bank-to-Gringotts conversion.
- OFX-family `FITID` is used as the preferred stable transaction identifier.
- Source account identifiers are masked to their final four characters when mapped-account mode is selected.
- New rows default to `Other`, unreviewed, and review-required unless source-category use is explicitly enabled.
- Pending source statuses remain pending.

## Duplicate and coverage review

v115 retains and extends the v109 safeguards:

- stable transaction IDs;
- deterministic date, amount, merchant, account, and source fingerprints;
- exact duplicate skipping;
- fuzzy merchant/date/amount/account comparison;
- pending-to-posted detection;
- Keep, Skip, and Defer decisions;
- incoming and existing date coverage;
- overlap and missing-month warnings;
- missing-only insertion.

No probable duplicate is discarded automatically.

## Guarded write

A transaction insertion requires:

1. a populated readable destination vault;
2. successful normalization;
3. a completed duplicate review;
4. no deferred probable match;
5. a downloaded populated v115 pre-import backup;
6. explicit acknowledgement;
7. confirmation showing destination counts and planned inserts.

After writing, Gringotts reads the destination back and verifies:

- the expected transaction count;
- each inserted stable-ID or deterministic-fingerprint token.

If writing or verification fails, the prior raw destination value is restored.

A reviewed no-change import can be recorded without downloading another backup because no transaction write occurs.

## Import receipts and reports

Import receipts store metadata only:

- source filename and fingerprint;
- format, schema, confidence, and encoding;
- mapping summary;
- sign and date options;
- warning count;
- coverage;
- incoming, exact, fuzzy, inserted, and skipped counts;
- destination before and after counts;
- verification result.

Imported transaction arrays are not copied into receipt history.

The Vault Workbook adds **Import Receipts**, expanding from 32 to **33 sheets**.

## Restore remains separate

Incremental transaction import does not replace the full restore workflow.

Full restore still:

- accepts a populated Gringotts JSON vault;
- previews transaction count and date coverage;
- requires a current backup acknowledgement and confirmation;
- writes to exactly `gringottsBudgetVault.latest`;
- verifies the read-back;
- blocks empty transaction arrays.

## Faster validation pipeline

v115 adds **Parser and static preflight** before any browser installation.

It uses Node's built-in test runner and checks:

- current release module syntax;
- delimited parsing and delimiter detection;
- quoted commas, escaped quotes, multiline memos, and BOM;
- mapping candidates;
- date and money parsing;
- signed, debit, and credit normalization;
- QFX/OFX parsing, FITIDs, signs, and masked accounts;
- malformed and unsupported files;
- size and row limits;
- deterministic malformed-input mutations.

Desktop and responsive Playwright jobs depend on this fast job. A parser failure therefore stops before `npm ci`, Playwright browser downloads, or duplicate desktop/responsive setup.

## Free tools evaluated

- **Node built-in test runner:** adopted because it adds no dependency and is sufficient for current pure parser tests.
- **fast-check:** deferred until real export diversity justifies a property-based dependency.
- **Semgrep Community Edition:** deferred until useful custom local-first rules can add value beyond CodeQL.
- **Vitest:** not added because the built-in runner covers the current need without another package.

## Synthetic test coverage

No real household export is committed.

Synthetic tests cover:

- signed CSV imports;
- separate debit and credit imports;
- QFX STMTTRN imports;
- legacy JSON imports;
- exact and fuzzy duplicate review;
- pending-to-posted candidates;
- no-change receipts;
- backup-first verified writes;
- rollback boundaries;
- metadata-only receipts;
- unsupported and oversized files;
- responsive layout and accessibility;
- no network writes.

## Preserved safeguards

v115 preserves:

- one live ES-module boot chain;
- the corrected subtitle;
- best-populated-readable-vault selection;
- `gringottsBudgetVault.latest` restore destination;
- backup-first broad transaction writes;
- v109 duplicate protection;
- v110 close, forecast, and debt planning;
- v111 report ranges;
- v112 accessibility and quality gates;
- v113 read-only Household Insights;
- v114 Guided Household Planning;
- `rescue-v105.html`;
- no service worker, PWA cache, remote parser, or transaction upload.

## Next release

v116 — Planned UI Architecture Review, including navigation, page density, usefulness, accessibility, touch targets, and whether the new import workflow benefits from progressive step presentation after real export testing.
