# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v119 — Profile Versioning & Dry-Run Diagnostics**  
Current quality-infrastructure release: **v119 — Revision, Diagnostic, and Lazy-Route Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## Profile Versioning & Dry-Run Diagnostics

v119 adds two explicit metadata-only safety boundaries to Tools → Import transactions.

### Revision-gated profile updates

Updating an existing mapping profile or replacing one through a portable bundle now pauses before storage and shows every changed mapping and normalization option.

The user must acknowledge and confirm the comparison before metadata is written. Profile and revision-history values are then read back together. A failed write restores both previous raw values.

Revision history is stored separately under `gringottsImportProfileRevisions.v1` and is limited to:

- 60 revision summaries total;
- 8 revision summaries per local profile.

The history stores definition hashes, source, time, and sanitized changed-field descriptions. Local destination-account-label values are represented only as a redacted change indicator. Transaction rows, source files, filenames, fingerprints, balances, credentials, and vault contents are never copied into revision history.

### Explicit local import dry run

After inspecting a supported bank export, the user can prepare an in-memory dry run showing:

- source format and schema;
- selected header mappings;
- non-sensitive normalization options;
- required-field readiness;
- normalization error and warning counts;
- date coverage and overlap;
- exact, fuzzy, fresh, unresolved, insert, and skip counts;
- acknowledgement, backup, and transaction-write readiness.

Preparing the dry run performs no transaction write. A second explicit action downloads the JSON diagnostic.

The diagnostic excludes transaction rows, merchant names, source filenames, source fingerprints, account identifiers, destination account labels, balances, credentials, and household vault contents.

## Profile Portability & Institution Patterns

v118 remains the portable-definition layer below v119.

Tools → Import transactions can export the saved profile library as a versioned JSON bundle. Portable definitions contain profile names, source schema and delimiter metadata, a non-reversible ordered-header signature, mapped source-header names, normalization choices, and destination handling metadata.

Portable files omit local profile IDs and local creation/update timestamps. They never contain transaction rows, source file content, source filenames, source fingerprints, balances, credentials, tokens, or full account numbers. Bundles are limited to 24 definitions and 256 KB.

Selecting a bundle creates an in-memory preview. Every definition is classified as an exact duplicate, same definition under another name, source-identity conflict, name conflict, or new definition. Every item requires Add, Replace, or Skip. Replace is available only for an identity-matched saved profile and is revision-gated by v119.

Synthetic fixtures cover card activity, deposit/withdrawal account ledgers, and digital-wallet activity through the existing v115 parser.

## Import Profiles & Field Validation

v117 remains the mapping-profile layer. Profiles are browser-local metadata under `gringottsImportProfiles.v1`, capped at 24 sanitized records and read-back verified.

A profile applies automatically only when exactly one saved profile matches format, schema, delimiter, ordered headers, and remembered mapped headers. Several exact matches require an explicit choice.

The Map stage explains dates, signed amounts or debit/credit columns, stable transaction IDs, account mapping and masking, pending status, source categories, transaction type, and profile-remembered choices.

Applying, saving, importing, updating, replacing, or deleting profile metadata does not import transactions.

## UI architecture

The six primary destinations remain:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

Reports shows one of eight pages at a time on screen while Print / Save PDF includes all eight. Tools separates incremental transaction import from full vault restore. Activity secondary navigation remains compact on narrow phones.

The initial Dashboard request budget remains protected: v118 portability and v119 revision/diagnostic layers load only when Tools or Reports is opened.

## Bank Export Import & Mapping

v115 remains the guarded local transaction engine under the v117–v119 metadata layers.

Supported local sources:

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon and pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

The transaction workflow provides format and schema inspection, explicit mapping, date-order and signed-amount interpretation, normalized preview, masked accounts, exact and fuzzy duplicate review, coverage warnings, backup-first insertion, rollback, read-back verification, and metadata-only receipts.

Imported rows default to `Other`, unreviewed, and review-required unless source-category use is explicitly selected. Incremental import never replaces the destination vault.

Full restore remains separate and writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

## Privacy and data boundary

Do not commit or attach:

- bank or credit-card exports;
- Gringotts vault backups;
- saved household profiles, revision-history exports, or exported profile bundles;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- bank exports and profile bundles are parsed in browser memory;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- profile bundles, revision history, and dry-run diagnostics retain metadata only;
- filenames are displayed for review but are not stored in the profile library or diagnostic;
- source account identifiers are masked when mapped;
- raw imported rows are not copied into receipts, profiles, revision history, or diagnostics;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Performance and staged release process

The parser/static gate runs before Playwright browser installation:

- active v115–v119 modules are checked with `node --check`;
- parser, profile, portability, revision, diagnostic, malformed-input, size-limit, and deterministic mutation tests use Node's built-in runner;
- desktop and responsive browser jobs cannot begin until preflight passes;
- Chromium runs before Firefox and WebKit installation;
- Android Chromium runs before iPad and iPhone WebKit;
- keyboard and visual contracts run before the longer axe inventory;
- diagnostics upload only on failure;
- draft pull requests skip expensive protected jobs.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Automated testing and security

The final merge gate covers:

- browser-free parser, profile, portability, revision, and diagnostic preflight;
- Chromium, Firefox, and WebKit desktop behavior;
- iPad, Android, and iPhone/WebKit layouts;
- sanitized profile and dry-run downloads;
- Update and Replace revision gates;
- exact, same-definition, identity-conflict, name-conflict, and new-profile review;
- Add, Replace, Skip, duplicate-name blocking, and invalid-target blocking;
- vault byte-for-byte noninterference and filename non-retention;
- field-validation explanations and observer stability;
- all eight report-preview pages and complete print output;
- signed CSV, debit/credit, OFX-family, and legacy JSON imports;
- duplicate, rollback, backup, restore, and verification behavior;
- month close, forecast, debt, goals, Guided Plan, Insights, and Review Queue safeguards;
- axe, keyboard, visual contracts, and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, high/critical npm audit, and CodeQL;
- pinned Actions and least-privilege permissions.

OpenSSF Scorecard findings are triaged in [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md).

## Local testing

Requirements:

- Node.js 24;
- Python 3 for the local static server.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See [`TESTING.md`](TESTING.md) and [`QUALITY_GATES.md`](QUALITY_GATES.md) for the complete matrix.

## Unsupported import formats

PDF statements, Office files, archives, executables, unsupported binaries, files above 5 MB, and transaction imports above the configured row limit remain blocked.

CAMT, MT940, XLSX, institution-specific JSON, OCR, and PDF extraction require separate fixtures and safety review.

## Release documentation

- [`RELEASE_NOTES_v119_PROFILE_VERSIONING_DIAGNOSTICS.md`](RELEASE_NOTES_v119_PROFILE_VERSIONING_DIAGNOSTICS.md)
- [`RELEASE_NOTES_v118_PROFILE_PORTABILITY_PATTERNS.md`](RELEASE_NOTES_v118_PROFILE_PORTABILITY_PATTERNS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
