# v118 — Profile Portability & Institution Patterns

## Summary

v118 lets a household move reviewed bank-export mapping profiles between browsers without moving transaction data or replacing the household vault.

The release adds:

- sanitized profile-bundle export;
- local JSON bundle inspection;
- explicit Add, Replace, or Skip decisions for every imported definition;
- exact-duplicate, same-definition, identity-conflict, name-conflict, and new-profile classifications;
- identity and mapping-difference explanations before acceptance;
- a saved-profile library that distinguishes profile name, destination label, source pattern, and header identity;
- fictional card-activity, deposit/withdrawal-ledger, and digital-wallet fixtures;
- v118 privacy, accessibility, responsive, observer-stability, and browser tests.

## Portable profile file

The portable JSON file contains only sanitized profile definitions:

- profile name;
- source format and detected schema;
- delimiter;
- non-reversible ordered-header signature and header count;
- mapped source header names;
- date-order and amount-sign settings;
- destination account label and account-handling mode;
- source-category preference.

It does not contain:

- transactions or raw source rows;
- bank-export file content;
- source filenames or source fingerprints;
- balances;
- credentials, passwords, tokens, or institution connections;
- full account numbers;
- local profile IDs;
- local creation or update timestamps.

Bundles are limited to 24 definitions and 256 KB.

## Import review

Choosing a profile bundle does not immediately write browser storage. v118 builds an in-memory preview and classifies every definition:

- **Exact** — same name, mappings, options, and source identity;
- **Same definition** — mappings and options already exist under another name;
- **Identity conflict** — format, schema, delimiter, and ordered-header identity match, but mappings or options differ;
- **Name conflict** — the requested name is already used for another source identity;
- **New** — no saved name or source identity conflicts.

Every item requires one reviewed action:

- **Add** creates a separately named local profile;
- **Replace** is available only for an identity-matched saved profile;
- **Skip** leaves the saved profile library unchanged.

Exact and same-definition matches default to Skip. Conflicts never replace a profile silently.

The final metadata write is sanitized and read back. If storage or verification fails, the prior raw profile-library value is restored.

## Institution-pattern coverage

Synthetic fixtures exercise three common export families without using real bank files:

1. card activity with transaction and post dates;
2. checking-style ledgers with separate withdrawal and deposit columns;
3. digital-wallet activity with net amount, status, transaction ID, type, and note.

These fixtures use the existing v115 parser and normalization path. v118 does not add a parallel transaction parser.

## Preserved safeguards

v118 does not change:

- the `gringottsBudgetVault.latest` restore destination;
- best-populated-readable-vault selection;
- missing-only transaction insertion;
- exact and fuzzy duplicate review;
- pending-to-posted handling;
- date coverage and overlap warnings;
- pre-import populated backup requirement;
- acknowledgement and confirmation;
- rollback and read-back verification;
- metadata-only import receipts;
- the stable v105 rescue page;
- the six primary destinations;
- the one-live-runtime architecture.

Profile portability never imports transactions and never restores a vault.

## User-facing files

v118 names current downloads with v118, including:

- full vault backup;
- Vault Workbook;
- family meeting pack;
- Guided Household Plan;
- rules review;
- calendar export;
- diagnostics;
- sanitized import-profile bundle.

The v115 pre-import backup keeps its engine-specific name because the guarded transaction writer remains v115.

## Testing

The v118 matrix covers:

- pure bundle sanitization and classification;
- forbidden-key rejection;
- Add, Replace, and Skip plans;
- duplicate-name and invalid-target blocking;
- profile-ID and creation-time preservation on replacement;
- fictional institution patterns through the v115 parser;
- sanitized browser downloads;
- vault byte-for-byte noninterference;
- filename non-retention;
- unsafe-file rejection;
- desktop and phone containment;
- axe scans of the library and conflict review;
- observer stability;
- Chromium, Firefox, WebKit, Android, iPad, and iPhone projects;
- Lighthouse budgets;
- repository privacy, CodeQL, dependency, supply-chain, and workflow-security gates.

## Next release

Planned: **v119 — Profile Versioning & Dry-Run Diagnostics**.

The proposed focus is explainable profile revision comparison and a local import dry-run package before any transaction write.
