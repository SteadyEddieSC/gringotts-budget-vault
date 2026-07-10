# Gringotts Budget Vault Testing

## Data boundary

All automated tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, saved household profile, report, screenshot, account identifier, or generated financial artifact.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed CSV;
- separate debit/credit CSV;
- QFX/OFX-family data;
- fictional legacy Gringotts JSON packages;
- inline fictional profile fixtures;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free parser and profile-model gate

Run first:

```bash
npm run test:parser
```

Node's built-in runner covers format detection, delimiters, quoting, field mapping, date and amount validation, OFX-family parsing, limits, malformed-input mutations, profile identities, exact compatibility, profile sanitization, and safe application payloads.

GitHub also runs `node --check` against the v115 guarded import modules and the v117 profile model, lazy controller, release layer, and boot entry before installing a browser.

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

## v117 profile coverage

### Metadata-only persistence

Tests verify:

- profiles are stored only under `gringottsImportProfiles.v1`;
- saving, updating, applying, or deleting a profile does not change `gringottsBudgetVault.latest`;
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
- changed settings are shown as different from the applied profile until explicitly updated.

### Profile controls

Tests cover:

- Apply Selected Profile;
- Save New Profile;
- Update Profile;
- New Profile;
- Delete Profile;
- verified deletion confirmation;
- native profile select and name input;
- phone containment and touch-friendly actions.

### Field explanations

Tests verify explanations for:

- date parsing and ambiguity handling;
- numeric amount sampling;
- signed-amount or separate debit/credit interpretation;
- stable-ID duplicate value;
- account label or masked account handling;
- pending status;
- source category behavior;
- transaction type behavior;
- choices remembered from an applied profile.

### Lazy loading and stability

Tests verify:

- profile code and CSS are absent from the initial HTML request set;
- profile code loads through the existing Import route only;
- the profile surface is idempotent;
- Reports, Import / Restore, profile controls, and field explanations settle without recursive mutation loops;
- the initial Lighthouse request budget remains unchanged.

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
- backup, CSV, XLSX, ICS, Markdown, and diagnostics downloads;
- phone Activity navigation and no document-level horizontal overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Axe inventory includes:

- all primary destinations and secondary sections;
- every report-preview page;
- both Import and Restore tasks;
- profile controls and field explanations on desktop;
- profile controls and field explanations on phone.

Keyboard coverage includes Skip to content, visible focus, secondary tab semantics, arrow navigation, accessible table regions, mobile-menu Escape, unique IDs, native report/mapping/profile selects, and profile action controls.

Privacy-safe visual contracts cover Dashboard desktop, Reports desktop and phone, Import phone, Activity phone, control columns, main width, topbar placement, control height, and horizontal overflow.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft pull requests skip protected jobs.

When marked ready:

1. Parser and static preflight checks syntax, parser behavior, and the pure profile model.
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
- repository drift checks for action pinning, permissions, headers, parser purity, profile-only storage, guarded transaction writes, lazy loading, staged installs, and required files.

## Production smoke

After merge, the main-branch smoke verifies:

- v117 startup and hardened headers;
- all six primary destinations;
- the supported-format import text;
- a synthetic export displays the profile card and 11 field explanations;
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
