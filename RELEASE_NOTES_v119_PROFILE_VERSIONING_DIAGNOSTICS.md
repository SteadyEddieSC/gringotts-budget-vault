# v119 — Profile Versioning & Dry-Run Diagnostics

## Summary

v119 adds an explicit review boundary before an existing mapping profile is updated or replaced and adds a metadata-only local dry-run diagnostic before any transaction write.

## Profile revision review

- Existing-profile Update is paused before storage.
- Portable-bundle Replace is paused before storage.
- Every changed mapping and normalization option is shown field by field.
- Local account-label values are displayed only as a redacted change indicator.
- Confirmation and acknowledgement are required before writing metadata.
- Profile and revision-history writes are read back together.
- Failed writes restore the previous raw profile library and revision history.

## Bounded revision history

Revision summaries are stored under `gringottsImportProfileRevisions.v1`.

The history is capped at:

- 60 revisions total;
- 8 revisions per local profile.

Summaries retain profile identity, source, timestamp, definition hashes, and sanitized changed-field descriptions. They do not contain transaction rows, source files, filenames, source fingerprints, balances, credentials, or stored account-label values.

## Local import dry run

After inspecting a supported export, the user can explicitly prepare an in-memory dry run showing:

- source format and schema;
- selected source-header mappings;
- non-sensitive normalization options;
- required-field readiness;
- normalization error and warning counts;
- date coverage and overlap;
- exact, fuzzy, fresh, unresolved, insert, and skip counts;
- acknowledgement, backup, and transaction-write readiness.

A second explicit action downloads the JSON diagnostic. The file excludes transaction rows, merchant names, source filenames, source fingerprints, account identifiers, destination account labels, balances, credentials, and household vault contents.

## Preserved safeguards

- The v115 transaction writer remains unchanged.
- Transaction insertion remains missing-only, backup-first, acknowledged, confirmed, rollback-protected, and read-back verified.
- Full restore remains separate and still targets exactly `gringottsBudgetVault.latest`.
- v117 exact-compatible profile application remains unchanged.
- v118 Add and Skip bundle decisions remain on the existing path.
- The stable v105 rescue page remains available.
- The app continues to use one live ES-module runtime with no service worker, remote parser, analytics, or institution connection.

## Validation

v119 adds pure-model and browser coverage for:

- field-by-field revision comparison;
- account-label redaction;
- bounded revision storage;
- local Update gating;
- bundle Replace gating;
- atomic profile/revision rollback behavior;
- dry-run preparation and explicit download;
- diagnostic privacy boundaries;
- phone containment;
- existing parser, browser, accessibility, Lighthouse, privacy, CodeQL, dependency, and supply-chain regression gates.

## Next release

**v120 — Import Receipt Audit & Rollback Guidance** will strengthen receipt review, relate imported batches to verified backups, and provide clearer local rollback guidance without automatic destructive changes.
