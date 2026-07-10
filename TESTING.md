# Gringotts Budget Vault Testing

## Data boundary

All automated tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, report, screenshot, account identifier, or generated financial artifact.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed CSV;
- separate debit/credit CSV;
- QFX/OFX-family data;
- fictional legacy Gringotts JSON packages;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free parser gate

Run first:

```bash
npm run test:parser
```

This uses Node's built-in test runner and does not install Playwright browsers or another test package.

It covers:

- supported and unsupported format detection;
- comma, tab, semicolon, and pipe delimiters;
- BOM, quoted commas, escaped quotes, and multiline fields;
- common header mapping;
- signed, debit, credit, and type-assisted normalization;
- ambiguous date blocking and explicit MDY/DMY selection;
- currency, comma, and parentheses amount parsing;
- QFX/OFX STMTTRN blocks, FITIDs, signs, and account masking;
- malformed or empty OFX-family files;
- size and row limits;
- conflicting debit and credit values;
- deterministic malformed-input mutation termination.

GitHub also runs `node --check` on current v115 modules before this suite.

## Local browser setup

```bash
npm ci --ignore-scripts
npx playwright install chromium
```

Fast release-candidate preflight:

```bash
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

Complete browser matrix:

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

## v115 browser coverage

### Boot and architecture

- the app boots as v115 without module errors;
- `Mischief Managed. Money Managed` remains visible;
- Dashboard, Money, Calendar, Reports, Activity, and Tools remain the six primary destinations;
- one v115 boot entry is used;
- the stable v105 rescue page remains linked;
- no service worker is registered;
- normal navigation makes no network write request.

### Bank export inspection and mapping

Synthetic browser tests verify:

- signed CSV inspection and automatic field candidates;
- required date-order and sign decisions;
- source and normalized previews;
- separate debit and credit columns;
- explicit source-category use;
- masked mapped accounts;
- QFX STMTTRN interpretation and FITIDs;
- blocked PDF and oversized input;
- no write during inspection, mapping, or preview;
- responsive tables and mapping controls.

### Duplicate and guarded-write flow

Tests verify:

- stable-ID exact matches;
- deterministic fingerprint matches;
- probable and pending-to-posted candidates;
- Keep, Skip, and Defer decisions;
- date overlap and missing-month warnings;
- disabled commit while decisions remain unresolved;
- required populated backup before insertion;
- explicit acknowledgement and confirmation;
- missing-only insertion;
- destination count verification;
- inserted stable-ID/fingerprint token verification;
- rollback boundaries;
- metadata-only receipts;
- reviewed no-change receipts;
- no network write requests.

### Legacy JSON compatibility

The former v109 import scenarios now run through the v115 UI:

- all-new Gringotts JSON rows;
- exact duplicate no-change imports;
- fuzzy duplicate decisions;
- malformed, missing-array, and empty-array blocking;
- receipt metadata without copied transactions.

### Restore safeguards

- full restore remains separate from incremental import;
- an empty restore is blocked;
- restore preview, acknowledgement, confirmation, destination, and read-back behavior remain covered;
- the existing populated vault remains intact after blocked restores.

### Reports and prior functionality

The established suite continues to cover:

- the 33-sheet Vault Workbook and Import Receipts sheet;
- eight printable report pages;
- custom ranges and prior-year comparisons;
- Guided Household Planning;
- Household Insights;
- Review Queue backup-first edits;
- goals and Vault Health;
- month reconciliation, close, and reopen;
- forecasts and recurring bills/paydays;
- debt and promotional APR planning;
- annual tracker filling;
- backups, CSV, XLSX, ICS, Markdown, and diagnostics downloads.

## Accessibility and visual quality

The quality suite scans all primary destinations and important secondary workflows, including the initial v115 Bank Export Import / Restore surface.

It blocks serious or critical axe violations for configured WCAG and best-practice tags.

Keyboard tests verify:

- Skip to content;
- visible focus;
- tab semantics and arrow navigation;
- keyboard-accessible table regions;
- mobile menu Escape behavior;
- unique rendered IDs.

Privacy-safe visual contracts cover:

- Dashboard desktop;
- Reports desktop;
- Reports phone;
- v115 Import / Restore phone layout;
- report pages and range-control columns;
- required surfaces, main width, topbar placement, and horizontal overflow.

No PNG baseline is committed. Diagnostic screenshots, traces, videos, axe JSON, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft pull requests skip protected jobs.

When marked ready:

1. **Parser and static preflight** checks syntax and pure parser behavior without browser installation.
2. **Desktop** installs Chromium, runs Chromium, then installs and runs Firefox/WebKit.
3. **Responsive** installs Chromium, runs Android, then installs WebKit and runs iPad/iPhone.
4. **Quality** runs keyboard and visual contracts before axe.
5. **Lighthouse** runs independently in parallel.
6. Privacy, supply-chain, and CodeQL jobs run in parallel.

Concurrency cancellation stops superseded runs. Diagnostics upload only on failure.

## Security gates

The final candidate also runs:

- full-history financial-data path and identifier scanning;
- full-history Gitleaks;
- Dependency Review;
- locked `npm audit --audit-level=high` with lifecycle scripts disabled;
- CodeQL with `security-extended` queries;
- repository drift checks for action pinning, permissions, headers, parser purity, guarded writes, staged installs, and required files.

## Production smoke

After merge, the main-branch smoke verifies:

- v115 startup;
- all primary destinations;
- the bank import file control and supported-format text;
- Activity → Plan;
- Reports, Insights, Guided Plan, and Import Receipts;
- hardened headers;
- no page errors.

If available tooling cannot expose the main-push workflow run, the release handoff must state that limitation.

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

The Cloudflare smoke is verified separately after merge.
