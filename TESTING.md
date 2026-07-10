# Gringotts Budget Vault Testing

## Data boundary

All automated tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, saved household profile, exported profile bundle, report, screenshot, account identifier, or generated financial artifact.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed CSV;
- separate debit/credit CSV;
- card-activity CSV;
- deposit/withdrawal-ledger CSV;
- digital-wallet CSV;
- QFX/OFX-family data;
- fictional legacy Gringotts JSON packages;
- inline fictional mapping-profile and portable-bundle fixtures;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free parser, profile, and portability gate

Run first:

```bash
npm run test:parser
```

Node's built-in runner covers:

- format detection and delimiters;
- quoted and multiline fields;
- field mapping;
- date and amount validation;
- OFX-family parsing and entity decoding;
- size and row limits;
- deterministic malformed-input mutations;
- profile identities, exact compatibility, sanitization, and safe application payloads;
- portable bundle export, parsing, forbidden-key rejection, and classifications;
- reviewed Add, Replace, and Skip plans;
- duplicate-name and invalid-target blocking;
- fictional institution-pattern recognition through the v115 parser.

GitHub also runs `node --check` against active v115 guarded-import modules, v117 profile modules, and v118 portability, pattern, release, and boot modules before installing a browser.

## Local browser setup

```bash
npm ci --ignore-scripts
npx playwright install chromium
```

Fast release-candidate checks:

```bash
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

Complete local matrix:

```bash
npx playwright install firefox webkit
npm run test:local
```

Additional commands:

```bash
npm run test:a11y
npm run test:visual
npm run test:headed
npm run test:ui
npm run report
```

## v118 portability coverage

### Sanitized export

Tests verify:

- exported files use the versioned Gringotts profile-bundle kind;
- local profile IDs and local creation/update timestamps are omitted;
- transaction rows, raw records, source filenames, source fingerprints, account numbers, balances, credentials, and tokens are absent;
- explicit user action is required before download;
- the household vault is unchanged.

### Imported-file inspection

Tests verify:

- JSON files are limited to 256 KB and 24 definitions;
- unknown bundle kind/version is rejected;
- forbidden transaction-shaped and credential-shaped keys are rejected before preview;
- bundle file name and contents are kept only in memory during review;
- imported bundle filenames are not retained in localStorage.

### Conflict review

Tests verify all five classifications:

- exact;
- same definition;
- identity conflict;
- name conflict;
- new.

Every item requires Add, Replace, or Skip. Exact and same-definition items default to Skip.

### Reviewed metadata writes

Tests verify:

- Add requires a unique local name;
- Replace is offered only for identity-matched saved profiles;
- Replace preserves the existing local profile ID and original creation time;
- invalid or stale replacement targets are blocked;
- all decisions must be reviewed before acknowledgement and confirmation;
- writes remain capped at 24 sanitized records;
- read-back verification is required;
- failed writes restore the previous raw profile-library value;
- Add, Replace, and Skip leave `gringottsBudgetVault.latest` byte-for-byte unchanged.

### Saved-profile library

Tests verify:

- profile name, destination label, pattern, and identity are distinct columns;
- mappings are not exposed in library summaries;
- the table is labeled, focusable, and horizontally scrollable when necessary;
- phone layouts do not create document-level horizontal overflow.

### Fictional institution patterns

Tests exercise:

- card activity with transaction and post dates;
- account ledgers with separate withdrawal and deposit columns;
- digital-wallet activity with net amount, status, transaction ID, type, and note.

All use the existing v115 parser and normalization functions.

## v117 profile coverage

### Metadata-only persistence

Tests verify:

- profiles are stored only under `gringottsImportProfiles.v1`;
- saving, updating, applying, deleting, importing, or replacing a profile does not change `gringottsBudgetVault.latest`;
- profile JSON contains no transaction arrays, raw records, filenames, source fingerprints, or fixture transaction text;
- profiles are capped at 24 sanitized records;
- profile writes and deletion use read-back verification;
- invalid option values normalize to safe defaults.

### Exact compatibility

Tests verify:

- format, schema, delimiter, ordered-header signature, and mapped-header presence must all match;
- exactly one compatible profile applies automatically;
- several exact-compatible profiles require explicit selection;
- reordered or changed headers prevent application;
- compatibility differences are explained;
- remembered settings remain editable after application;
- changed settings are shown as different until explicitly updated.

### Profile controls and field explanations

Tests cover Apply Selected, Save New, Update, New, Delete, native selects/inputs, phone containment, and explanations for dates, amounts, signs, IDs, accounts, pending status, categories, type, and remembered choices.

## Lazy loading and stability

Tests verify:

- v117 mapping-profile code and v118 portability code/CSS are absent from the initial HTML request set;
- both load only through Tools → Import;
- the initial Lighthouse request budget remains unchanged;
- the initial library, portable bundle preview, mapping profile card, field explanations, report preview, and import/restore tasks settle without recursive mutation loops.

## Preserved architecture and functional coverage

The established synthetic suite continues to verify:

- six primary destinations and persistent shell;
- one-page-at-a-time report preview and all eight print pages;
- separate transaction import and full restore tasks;
- signed CSV, separate debit/credit, QFX/OFX, and legacy JSON imports;
- stable-ID, deterministic fingerprint, fuzzy, and pending-to-posted duplicate handling;
- missing-only insertion, metadata-only receipts, populated backups, rollback, and read-back verification;
- restore destination `gringottsBudgetVault.latest` and empty-restore blocking;
- Review Queue backup-first edits;
- goals and Vault Health;
- reconciliation, close, reopen, forecast, bills, paydays, debt, and promotional APR planning;
- Household Insights and Guided Household Planning;
- annual tracker filling;
- backup, CSV, XLSX, ICS, Markdown, diagnostics, and sanitized profile-bundle downloads;
- phone Activity navigation and no document-level horizontal overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Axe inventory includes:

- all primary destinations and secondary sections;
- every report-preview page;
- both Import and Restore tasks;
- saved profile library before source selection;
- portable bundle conflict review on desktop and phone;
- mapping profile controls and field explanations on desktop and phone.

Keyboard coverage includes Skip to content, visible focus, secondary tab semantics, arrow navigation, accessible table regions, mobile-menu Escape, unique IDs, native report/mapping/profile/action/target selects, and explicit profile controls.

Privacy-safe visual contracts cover Dashboard desktop, Reports desktop and phone, Import phone, Activity phone, control columns, main width, topbar placement, control height, portability visibility, and horizontal overflow.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft pull requests skip protected jobs.

When marked ready:

1. Parser and static preflight checks syntax, parser behavior, profile models, portability models, and institution patterns.
2. Desktop installs Chromium and runs it before Firefox/WebKit installation.
3. Responsive installs Chromium and runs Android before iPad/iPhone WebKit installation.
4. Quality runs keyboard and visual contracts before axe.
5. Lighthouse runs independently in parallel.
6. Privacy, supply-chain, and CodeQL jobs run in parallel.

Concurrency cancellation stops superseded runs. Diagnostics upload only on failure.

## Security gates

The final candidate runs:

- full-history financial-data path and identifier scanning;
- full-history Gitleaks;
- Dependency Review;
- locked `npm audit --audit-level=high` with lifecycle scripts disabled;
- CodeQL with `security-extended` queries;
- repository drift checks for action pinning, permissions, headers, parser purity, profile-only storage, portability rollback, guarded transaction writes, lazy loading, staged installs, and required files.

## Production smoke

After merge, the main-branch smoke verifies:

- v118 startup and hardened headers;
- all six primary destinations;
- the profile library and bundle picker before bank-file selection;
- the supported-format import text;
- a synthetic export displays the mapping profile card and 11 field explanations;
- full restore remains separate;
- Activity → Plan;
- report selection for summary, insights, and Guided Plan;
- Import Receipts and report-range controls;
- no page errors.

## Final merge gate

A release is ready only when the final head passes:

1. Parser and static preflight;
2. Local source — desktop;
3. Local source — responsive;
4. Accessibility and visual contracts;
5. Lighthouse CI budgets;
6. Full history privacy and secret scan;
7. JavaScript security analysis;
8. Dependency Review;
9. npm audit;
10. repository security-drift tests.

The Cloudflare production smoke is verified separately after merge.
