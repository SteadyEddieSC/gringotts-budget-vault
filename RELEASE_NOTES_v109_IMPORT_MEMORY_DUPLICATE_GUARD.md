# v109 — Import Memory & Duplicate Guard

## Release purpose

v109 adds a safe incremental transaction-import workflow under **Tools → Import / Restore**. It does not add another top-level destination and does not weaken the existing full-vault restore workflow.

The feature is local-first. Selected JSON files are read and reconciled in the browser and are never uploaded.

## Duplicate-safe import

### Exact duplicate protection

- Prefers stable source transaction IDs when present.
- Detects repeated stable IDs inside the selected file.
- For rows without stable IDs, builds a deterministic local fingerprint from:
  - date;
  - signed amount;
  - normalized merchant or transaction name;
  - account identifier or account name;
  - source identifier when available.
- Exact duplicates are explained and skipped automatically.

### Fuzzy duplicate review

- Looks for the same signed amount within a narrow date window.
- Requires a similar normalized merchant and a compatible account.
- Identifies possible pending-to-posted transitions.
- Displays the incoming row, existing candidate, reasons, and confidence.
- Uses a native select with:
  - Defer / keep under review;
  - Keep incoming;
  - Skip incoming.
- Blocks confirmation until every fuzzy candidate has an explicit decision.
- Never deletes or modifies the existing fuzzy candidate. Keeping the incoming row adds it as a separate reviewed row.

### Date coverage warnings

The preview displays:

- incoming earliest and latest dates;
- existing earliest and latest dates;
- overlapping range;
- missing months inside the incoming file;
- obvious month-level gaps between current coverage and incoming coverage;
- a warning when a historical file ends before the current vault begins.

The warnings describe observed coverage rather than claiming that a month is definitively incomplete.

## Missing-only write safeguards

Before a transaction write, v109 requires:

1. a valid populated `transactions` array;
2. a populated readable destination vault;
3. complete duplicate reconciliation;
4. a downloaded full destination-vault backup;
5. acknowledgement of the backup and preview;
6. explicit confirmation showing counts and destination.

After storage, v109:

- reads the destination back;
- verifies the expected transaction count;
- verifies that every expected inserted ID or fingerprint is present;
- invalidates the parsed-vault cache only after verification;
- restores the previous raw destination value if verification or history recording fails;
- never writes an empty vault.

A reviewed file containing no new rows performs no vault write. The user may explicitly record the verified no-change review in import history.

## Import memory

Import history is stored separately under:

`gringottsImportHistory.v1`

Each history entry contains metadata only:

- import ID and timestamp;
- source filename when provided;
- source-file fingerprint;
- incoming transaction count;
- earliest and latest dates;
- exact duplicate count;
- fuzzy candidate count;
- inserted and skipped counts;
- selected destination vault;
- destination before/after counts;
- verification result.

Import history does not store redundant full transaction copies.

## Restore preservation

The existing full restore remains a separate workflow on the same page and still requires:

- a readable file;
- a populated transaction array;
- preview;
- acknowledgement;
- explicit confirmation;
- read-back verification.

The restore destination remains:

`gringottsBudgetVault.latest`

## Runtime and interface

- Added one live boot path: `src/boot-v109.js`.
- Added one live runtime: `src/runtime-v109-import-memory.js`.
- Added the consolidated v109 Tools view and responsive import layout.
- Preserved the v107 persistent shell; navigation does not reconstruct the whole page.
- Preserved compact month controls and the existing six primary destinations.
- Updated local backup, diagnostics, calendar, rules-review, and Vault Workbook filenames to v109.
- Preserved the exact subtitle typo: `Mischief Managed. Money Manged`.
- Preserved `rescue-v105.html` unchanged.

## Synthetic automated coverage

Playwright adds fictional-only cases for:

- all-new import;
- exact stable-ID duplicate;
- exact fallback-fingerprint duplicate;
- mixed fuzzy and new import;
- near-date merchant candidate;
- pending-to-posted candidate;
- unresolved fuzzy blocking;
- Keep incoming and Skip incoming decisions;
- missing-month warning;
- malformed JSON;
- missing transaction array;
- empty transaction array;
- metadata-only import history;
- verified transaction-count increase;
- no empty-vault overwrite;
- no network upload or write request;
- phone, tablet, and desktop overflow.

Existing boot, navigation, month, Review Queue, Goals, Reports, Backup, Restore, security-drift, and Cloudflare smoke tests remain required.

## Privacy and architecture preservation

- No real transaction data, bank export, vault backup, report, screenshot, or household financial information was committed.
- No XLSX, PDF, DOCX, QFX, OFX, QBO, filled report, or backup was added.
- No service worker, PWA cache, compatibility overlay, bridge runtime, or stacked runtime was added.
- Existing transaction, rule, budget, recurring, bill, payday, goal, health-history, selected-month, and annual-tracker browser-local data remain compatible.
- Best-populated-readable-vault selection remains the default.
- Browser localStorage and cache are never cleared by the application update.

## Release gate

Before merge, require:

1. Local source — desktop;
2. Local source — responsive;
3. Full history privacy and secret scan;
4. JavaScript security analysis;
5. Dependency Review;
6. npm audit.

After merge, require the Cloudflare deployment smoke test and re-fetch the deployed v109 entry and runtime files.
