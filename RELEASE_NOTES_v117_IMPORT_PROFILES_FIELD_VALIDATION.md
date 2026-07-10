# v117 — Import Profiles & Field Validation

## Release purpose

v117 reduces repetitive bank-export setup without weakening the guarded v115 import engine. It adds browser-local mapping profiles that remember reviewed field choices and normalization options, then explains the current field interpretation before duplicate review.

## Exact-compatible profiles

A profile may remember:

- a user-provided profile name;
- detected format and schema identifiers;
- delimiter metadata;
- a non-reversible ordered-header signature;
- selected source header names;
- date-order and signed-amount interpretation;
- account handling and destination account label;
- whether source categories were explicitly enabled;
- created and updated timestamps.

A profile never stores:

- transaction rows or normalized transactions;
- raw source records or file contents;
- source filenames or source fingerprints;
- balances, credentials, or routing information;
- complete unmasked source account identifiers.

Profiles are capped at 24 local records and are read-back verified after save, update, or deletion.

## Compatibility behavior

A profile is compatible only when all of the following match:

1. source format;
2. detected schema ID;
3. delimiter;
4. ordered normalized-header signature;
5. every remembered mapped header remains present.

When exactly one profile is compatible, v117 applies it automatically. When multiple profiles are compatible, the application requires an explicit selection. When no profile matches, the current export remains under normal manual mapping and v117 explains the first compatibility difference rather than guessing.

## Profile controls

Tools → Import transactions now provides:

- Apply Selected Profile;
- Save New Profile;
- Update Profile;
- New Profile;
- Delete Profile.

Profile application changes only the in-memory import session. Saving or deleting a profile changes only `gringottsImportProfiles.v1`. Neither action changes the household vault.

## Field validation explanations

The existing mapping controls now explain:

- whether sampled dates validate and which date order is active;
- whether sampled amount values are numeric;
- whether signed amounts or separate debit/credit columns control direction;
- why a stable transaction ID helps duplicate detection;
- how account labels or masked mapped accounts are handled;
- whether pending status is available;
- whether source categories are enabled;
- whether transaction type controls amount direction or only transfer classification;
- whether an applied profile supplied the current remembered field choice.

These explanations supplement the existing normalized preview and do not bypass parser errors or unresolved-field blocking.

## Preserved guarded import behavior

v117 preserves:

- local-only CSV, TSV, delimited, OFX, QFX, QBO, and Gringotts JSON parsing;
- explicit date and amount interpretation;
- stable-ID, deterministic fingerprint, fuzzy, and pending-to-posted duplicate review;
- date coverage and overlap warnings;
- missing-only insertion;
- populated backup requirements;
- acknowledgement and confirmation;
- rollback after failed write or verification;
- transaction-count and inserted-token read-back verification;
- metadata-only import receipts;
- full restore as a separate task targeting exactly `gringottsBudgetVault.latest`.

The v115 guarded writer was not replaced or broadened.

## Performance and loading

The initial application request budget remains unchanged:

- v117 replaces the v116 release-layer request rather than stacking another release runtime;
- the profile controller loads only when Tools → Import is rendered;
- `styles/v117.css` loads only with the profile surface;
- the Dashboard and other primary destinations do not load profile code or CSS until needed.

## Testing

Synthetic coverage includes:

- pure profile identity, compatibility, sanitization, and application tests;
- metadata-only persistence and vault noninterference;
- single exact-match automatic application;
- multiple exact-match conflict handling;
- reordered-header incompatibility;
- verified profile deletion;
- field-validation explanations;
- phone containment;
- observer stability;
- axe scans on desktop and phone profile surfaces;
- live Cloudflare profile smoke coverage;
- unchanged v109–v116 import, reporting, planning, restore, and responsive regressions;
- CodeQL, privacy history, Dependency Review, npm audit, and supply-chain gates.

No real household export, profile, backup, screenshot, or generated report is used.

## Next release

v118 — Profile Portability & Institution Patterns

The planned release will add guarded export/import of sanitized profile definitions with conflict review, broaden fictional institution-pattern fixtures, and improve compatibility explanations without storing source rows.
