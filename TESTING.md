# Gringotts Budget Vault Testing

## Data boundary

All automated tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, profile, profile revision history, profile bundle, dry-run diagnostic, import receipt, receipt-audit package, backup, report, screenshot, account identifier, or generated financial artifact.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed and separate debit/credit CSV;
- card-activity, deposit/withdrawal-ledger, and digital-wallet CSV;
- QFX/OFX-family data;
- fictional legacy Gringotts JSON packages;
- inline fictional profile, revision, dry-run, bundle, receipt, and audit fixtures;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free preflight

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
- profile identity, exact compatibility, sanitization, and safe application;
- portable bundle parsing, classification, and reviewed Add/Replace/Skip plans;
- fictional institution-pattern recognition through the v115 parser;
- field-by-field profile revisions, redaction, and bounded history;
- dry-run privacy, safety declarations, and stale-signature detection;
- receipt normalization and verified/no-change handling;
- incoming and destination count reconciliation;
- backup filename expectations and manual rollback guidance;
- receipt-audit download privacy;
- the detailed v120–v126 roadmap structure;
- module-instance contracts preventing a second import session.

GitHub also runs `node --check` against active v115–v120 modules before installing browsers.

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

## v120 receipt-audit coverage

Tests verify:

- existing metadata-only receipts are normalized without copying transaction rows;
- verified and verified-no-change receipts produce the correct audit state;
- incoming rows reconcile as inserted plus skipped;
- destination before plus inserted reconciles to destination after;
- inconsistent arithmetic is labeled Needs review;
- current destination differences are explanatory notes rather than automatic rollback triggers;
- insertion receipts derive the expected `Gringotts_v115_pre_import_<count>_*.json` pattern;
- no-change receipts do not invent a backup requirement;
- receipt review leaves `gringottsBudgetVault.latest` byte-for-byte unchanged;
- downloaded audits exclude filenames, fingerprints, mappings, destination keys, identifiers, merchants, rows, and vault contents;
- the restore button only opens the separate guarded Full vault restore task;
- no automatic rollback action exists;
- receipt audit fits phone, tablet, and desktop layouts;
- fresh-render desktop and phone axe tests scan the selected audit state.

## v120 detailed-roadmap coverage

Tests verify:

- the Roadmap displays seven releases from v120 through v126;
- every release contains purpose, capabilities, dependencies, safety boundaries, and an expected outcome;
- v120 is marked current and later releases are marked planned;
- the page explains that later releases are directional;
- roadmap enhancement is idempotent and does not create mutation loops;
- desktop and phone layouts remain inside the document viewport;
- fresh-render desktop and phone axe scans cover the complete horizon.

## v119 revision and dry-run coverage

Tests continue to verify:

- existing profile Update and identity-matched portable Replace cannot write before comparison;
- mappings and normalization changes are displayed field by field;
- destination-account-label changes are retained only as redacted indicators;
- acknowledgement and confirmation are required;
- profile and revision metadata are read back together;
- failed writes restore prior metadata;
- revision history remains capped at 60 records total and 8 per profile;
- dry-run preparation performs no transaction write;
- dry-run downloads exclude rows, merchants, filenames, fingerprints, identifiers, labels, balances, credentials, and vault contents;
- profile and dry-run operations leave the vault unchanged.

## v118 and v117 profile coverage

Tests continue to verify:

- sanitized portable bundle export;
- omission of local IDs, timestamps, filenames, source rows, credentials, and full account numbers;
- exact, same-definition, identity-conflict, name-conflict, and new classifications;
- reviewed Add, Replace, and Skip decisions;
- unique names and identity-matched replacement;
- read-back verification and rollback;
- exact-compatible mapping profiles, one-match automatic application, several-match selection, deletion, field explanations, phone containment, and vault noninterference.

## Lazy loading and stability

Tests verify:

- v118 portability, v119 revision/dry-run, and v120 receipt/roadmap CSS and controllers are absent from the initial Dashboard request set;
- route-specific layers load before Tools or Reports renders;
- the initial Lighthouse request budget remains at 45;
- v120 reads the active v115 registry rather than importing another bank session;
- handler ordering preserves v119 Update/Replace interception;
- receipt cards, roadmap cards, profile libraries, previews, revision gates, dry runs, mappings, reports, and Import/Restore tasks settle without recursive mutation loops.

## Preserved functional coverage

The established synthetic suite continues to verify:

- six primary destinations and persistent shell;
- one-page-at-a-time report preview and all eight print pages;
- separate transaction import and full restore tasks;
- signed CSV, debit/credit, QFX/OFX, and legacy JSON imports;
- stable-ID, fingerprint, fuzzy, and pending-to-posted duplicate handling;
- missing-only insertion, metadata-only receipts, populated backups, rollback, and read-back verification;
- restore destination `gringottsBudgetVault.latest` and empty-restore blocking;
- Review Queue backup-first edits;
- goals, Vault Health, close, reopen, forecast, bills, paydays, debt, Insights, and Guided Plan;
- annual tracker filling;
- backup, CSV, XLSX, ICS, Markdown, diagnostics, profile-bundle, dry-run, and receipt-audit downloads;
- phone navigation and no document-level horizontal overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Axe inventory includes:

- all primary destinations and secondary sections;
- every report-preview page;
- both Import and Restore tasks;
- saved profiles, portability conflict review, mappings, dry run, and profile revision review;
- selected receipt audit on desktop and phone;
- the detailed seven-release roadmap on desktop and phone.

Keyboard coverage includes Skip to content, visible focus, secondary tab semantics, arrow navigation, accessible table regions, mobile-menu Escape, unique IDs, native selects, acknowledgement controls, and explicit profile actions.

Privacy-safe visual contracts cover Dashboard, Reports, Import, Activity, control columns, main width, topbar placement, control height, route-specific surfaces, and horizontal overflow.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft pull requests skip protected jobs. When marked ready:

1. Parser/static preflight checks syntax and pure models.
2. Desktop runs Chromium before Firefox/WebKit installation.
3. Responsive runs Android Chromium before iPad/iPhone WebKit installation.
4. Quality runs keyboard and visual contracts before axe.
5. Lighthouse runs independently with unchanged budgets.
6. Privacy, supply-chain, and CodeQL jobs run in parallel.

Concurrency cancellation stops superseded runs. Diagnostics upload only on failure.

## Security gates

The final candidate runs:

- full-history financial-data path and identifier scanning;
- full-history Gitleaks;
- Dependency Review;
- locked `npm audit --audit-level=high` with lifecycle scripts disabled;
- CodeQL with `security-extended` queries;
- repository drift checks for action pinning, permissions, headers, parser purity, profile-only storage, receipt-audit read-only behavior, manual rollback, guarded writes, lazy loading, staged installs, and required files.

## Production smoke

After merge, the main-branch smoke verifies:

- v120 startup and hardened headers;
- all six primary destinations;
- receipt audit, profile library, revision history, dry-run card, and bundle picker;
- supported-format text and synthetic mapping controls;
- full restore remains separate;
- the seven-release roadmap;
- Activity → Plan;
- report summary, insights, Guided Plan, Import Receipts, and report ranges;
- no page errors.

## Final merge gate

A release is ready only when the exact final head passes:

1. Parser and static preflight;
2. Local source — desktop;
3. Local source — responsive;
4. Accessibility and visual contracts;
5. Lighthouse CI budgets;
6. Full-history privacy and secret scan;
7. CodeQL;
8. Dependency Review;
9. npm audit;
10. repository security-drift tests.

The Cloudflare production smoke is verified separately after merge when available through connected workflow tools.
