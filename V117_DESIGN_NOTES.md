# v117 Import Profiles & Field Validation — Design Notes

This release is intentionally limited to local import mapping metadata.

Profiles may store:

- a user-supplied profile name;
- detected format and schema identifiers;
- delimiter metadata;
- a non-reversible ordered-header signature;
- selected source header names used for mapping;
- date-order, amount-sign, account-handling, account-label, and source-category options;
- created and updated timestamps.

Profiles must not store:

- transaction rows;
- raw source records;
- direct transaction arrays;
- file contents;
- source fingerprints;
- source filenames;
- balances;
- account or routing credentials;
- full unmasked account identifiers.

A profile is compatible only when format, schema, delimiter, ordered-header signature, and every remembered mapped header match the newly inspected export. Exactly one compatible profile may auto-apply. Multiple compatible profiles require an explicit choice.

Profile writes are explicit, browser-local, bounded, sanitized, and read-back verified. Profile application changes only the in-memory import session and never writes transaction data.
