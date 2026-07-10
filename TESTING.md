# Gringotts Budget Vault Testing

## Data boundary

All automated tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, saved household profile, profile revision history, exported profile bundle, dry-run diagnostic, report, screenshot, account identifier, or generated financial artifact.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed and separate debit/credit CSV;
- card-activity, deposit/withdrawal-ledger, and digital-wallet CSV;
- QFX/OFX-family data;
- fictional legacy Gringotts JSON packages;
- inline fictional mapping-profile, revision, diagnostic, and portable-bundle fixtures;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free parser, profile, portability, revision, and diagnostic gate

Run first:

```bash
npm run test:parser
```

Node's built-in runner covers:

- format detection, delimiters, quoted and multiline fields;
- field mapping, date and amount validation;
- OFX-family parsing and entity decoding;
- size and row limits;
- deterministic malformed-input mutations;
- profile identities, exact compatibility, sanitization, and safe application payloads;
- portable bundle export, parsing, forbidden-key rejection, and classifications;
- reviewed Add, Replace, and Skip plans;
- duplicate-name and invalid-target blocking;
- fictional institution-pattern recognition through the v115 parser;
- field-by-field profile revision comparison;
- destination-label redaction in revision summaries;
- 60-total and 8-per-profile revision-history bounds;
- dry-run diagnostic privacy, safety declarations, and stale-signature detection.

GitHub also runs `node --check` against active v115–v119 modules before installing browsers.

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

## v119 profile-versioning coverage

Tests verify:

- an existing profile Update cannot write before the comparison gate;
- an identity-matched portable Replace cannot write before the comparison gate;
- changed mappings and normalization options are displayed field by field;
- destination-account-label values are displayed and retained only as redacted indicators;
- acknowledgement and explicit confirmation are required;
- profile and revision metadata are read back together;
- failed writes restore both previous raw metadata values;
- revision history is stored only under `gringottsImportProfileRevisions.v1`;
- history is capped at 60 records total and 8 per profile;
- profile revision operations leave `gringottsBudgetVault.latest` byte-for-byte unchanged.

## v119 dry-run coverage

Tests verify:

- a dry run requires an inspected supported export;
- preparation occurs in memory and performs no transaction write;
- the summary includes source schema, mapping, non-sensitive options, validation, coverage, duplicate counts, and readiness;
- a separate explicit action is required for download;
- a dry run becomes stale after mapping or reconciliation changes;
- downloaded JSON excludes transaction rows, merchant names, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents;
- declared data-boundary fields remain false;
- phone layouts do not create document-level horizontal overflow.

## v118 portability coverage

Tests continue to verify:

- versioned sanitized bundle export;
- omission of local profile IDs and timestamps;
- rejection of transaction-shaped, credential-shaped, oversized, and wrong-version files;
- exact, same-definition, identity-conflict, name-conflict, and new classifications;
- reviewed Add, Replace, and Skip decisions;
- unique-name and identity-matched replacement rules;
- profile-ID and original-creation-time preservation;
- filename non-retention;
- read-back verification and rollback;
- saved-profile library columns and phone containment;
- fictional institution-pattern handling through the existing v115 parser.

Replace proceeds through the v119 revision gate. Add and Skip remain on the established v118 path.

## v117 profile coverage

Tests continue to verify metadata-only persistence under `gringottsImportProfiles.v1`, exact compatibility, one-match automatic application, several-match explicit selection, reordered-header rejection, editable remembered settings, field explanations, native controls, deletion, phone containment, and vault noninterference.

## Lazy loading and stability

Tests verify:

- v118 portability and v119 revision/diagnostic modules and CSS are absent from the initial Dashboard request set;
- route-specific layers load before Tools or Reports renders;
- the initial Lighthouse request budget remains at 45;
- handler registration order preserves v119 Update/Replace interception;
- library, bundle preview, revision gate, revision history, dry run, mapping controls, report preview, and import/restore tasks settle without recursive mutation loops.

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
- backup, CSV, XLSX, ICS, Markdown, diagnostics, profile-bundle, and dry-run downloads;
- phone navigation and no document-level horizontal overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Axe inventory includes:

- all primary destinations and secondary sections;
- every report-preview page;
- both Import and Restore tasks;
- saved profile library and dry-run card before source selection;
- portable bundle conflict review on desktop and phone;
- mapping profile controls and field explanations on desktop and phone;
- prepared dry-run summaries;
- profile revision comparison and confirmation controls.

Keyboard coverage includes Skip to content, visible focus, secondary tab semantics, arrow navigation, accessible table regions, mobile-menu Escape, unique IDs, native report/mapping/profile/action/target selects, revision acknowledgement, and explicit profile controls.

Privacy-safe visual contracts cover Dashboard desktop, Reports desktop and phone, Import phone, Activity phone, control columns, main width, topbar placement, control height, portability/revision/dry-run visibility, and horizontal overflow.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft pull requests skip protected jobs. When marked ready:

1. Parser/static preflight checks syntax and pure models.
2. Desktop runs Chromium before Firefox/WebKit installation.
3. Responsive runs Android Chromium before iPad/iPhone WebKit installation.
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
- repository drift checks for action pinning, permissions, headers, parser purity, profile-only storage, portability rollback, revision/dry-run boundaries, guarded transaction writes, lazy loading, staged installs, and required files.

## Production smoke

After merge, the main-branch smoke verifies:

- v119 startup and hardened headers;
- all six primary destinations;
- profile library, revision history, dry-run card, and bundle picker;
- supported-format import text;
- a synthetic export displays mapping controls, 11 field explanations, and an enabled dry-run action;
- full restore remains separate;
- Activity → Plan;
- report summary, insights, and Guided Plan;
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

The Cloudflare production smoke is verified separately after merge when available through the connected workflow tools.
