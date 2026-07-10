# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, profile, portability, revision, dry-run, receipt-audit, batch-lineage, roadmap, accessibility, performance, responsive-layout, and local-first data boundaries across v121 Receipt Integrity & Import Batch Reconciliation.

Syntax and pure-model defects stop before browser installation. Draft pull requests skip protected jobs.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

Workflows do not:

- read a normal user browser profile;
- upload a vault, bank export, profile, revision, dry run, receipt, batch index, timeline, backup, or report;
- commit financial screenshots;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

Playwright and axe are lockfile-pinned. Lighthouse CI is invoked at an exact version. Pure parser and metadata models use Node's built-in runner.

## Parser and static preflight

Before browsers install, GitHub runs:

- `node --check` against active v115–v121 modules and `src/boot-v121.js`;
- `npm run test:parser` with parser fixtures, deterministic mutations, profiles, bundles, revisions, dry runs, receipts, audits, batch links, timeline exports, roadmap data, and module-identity contracts.

The gate covers format detection, validation, limits, malformed-input termination, profile compatibility, bundle review, revision bounds, dry-run privacy, receipt arithmetic, backup expectations, dry-run-to-receipt reconciliation, bounded index storage, continuity states, timeline filtering, package privacy, and the v121–v127 Roadmap.

## Staged browser execution

When ready for review:

1. parser and static preflight;
2. Chromium desktop and Android Chromium;
3. Firefox/WebKit desktop after Chromium passes;
4. iPad/iPhone WebKit after Android passes;
5. diagnostics only on failure.

## Axe accessibility gate

The established inventory covers every primary destination, secondary section, all eight report pages, Import and Restore, profiles, bundle conflict review, mapping validation, dry run, revision review, Exports, Diagnostics, and Roadmap.

Fresh v121 scans additionally cover:

- timeline metrics, filters, and table;
- selected batch detail;
- lineage and dry-run cards;
- integrity checks and manual rollback guidance;
- the v121–v127 Roadmap;
- desktop and phone layouts.

The gate fails on serious or critical WCAG/best-practice findings.

## Keyboard and semantics

The suite verifies:

- Skip to content and visible focus;
- unique IDs;
- tab semantics and keyboard navigation;
- labeled focusable scrollable tables;
- native report, mapping, profile, bundle, revision, timeline, and filter controls;
- explicit Import/Restore task buttons;
- explicit dry-run, download, copy, and manual-restore actions;
- mobile-menu Escape behavior.

## Lighthouse CI

Three local desktop runs enforce median thresholds:

- Performance: 0.85;
- Accessibility: 0.95;
- Best Practices: 0.95;
- SEO: 0.90;
- FCP: 2,000 ms;
- LCP: 2,500 ms;
- TBT: 250 ms;
- CLS: 0.10;
- total bytes: 750 KB;
- scripts: 500 KB;
- stylesheets: 150 KB;
- images: 250 KB;
- console errors: zero;
- network requests: maximum 45.

v118–v121 route layers and CSS load only when Tools or Reports opens. The initial Dashboard request budget is unchanged.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic contracts cover Dashboard desktop, Reports desktop and phone, Tools → Import phone, Activity phone, six destinations, eight report pages, one visible preview, Import visible/Restore hidden, profile and dry-run controls, compact phone navigation, control height, main width, topbar placement, and horizontal overflow.

Geometry JSON and browser diagnostics are temporary. Screenshots, traces, video, axe JSON, and Lighthouse reports upload only on failure.

## Observer and route ownership

Route layers use idempotent markers and one observer per release layer.

Tests require:

- v121 interceptors load before inherited controls;
- v121 reuses the authoritative v115 and v117 module instances;
- v120 yields Reports, Import, and Roadmap presentation to v121;
- profiles, bundles, revisions, dry runs, timeline, Roadmap, reports, and task switching settle without recursive mutations.

## v121 batch-lineage contracts

Browser and pure-model tests require:

- existing receipts remain unchanged and authoritative;
- format, schema, normalized, insert, and skip reconciliation before a dry-run link;
- stale or mismatched candidates are rejected;
- `gringottsImportBatchIndex.v1` is capped at 80;
- writes are read-back verified and restored after failure;
- duplicate receipt identities fail integrity review;
- continuity distinguishes origin, linked, legacy, increase, and decrease;
- repeated source use is informational;
- all timeline filters work;
- no automatic receipt repair, rollback, deletion, or transaction change;
- timeline packages omit rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, balances, credentials, and vault contents;
- the guarded writer still requires backup, acknowledgement, confirmation, and verification.

## v121 workbook and Roadmap contracts

Tests require:

- a 35-sheet workbook;
- Receipt Integrity and Batch Lineage sheets;
- the existing Import Receipts sheet;
- seven Roadmap entries from v121 through v127;
- purpose, capabilities, dependencies, safeguards, and outcome for each release;
- v121 current and later entries planned;
- directional-planning disclosure and phone containment.

## Preserved v120–v117 contracts

The suite retains v120 receipt arithmetic/manual rollback, v119 revision/dry-run privacy, v118 bundle sanitization and reviewed decisions, v117 exact-compatible profiles, bounded metadata storage, rollback, and vault noninterference.

## Repository security and supply chain

Protected workflows verify:

- full-history privacy and identifier scanning;
- Gitleaks;
- action SHA pinning and least privilege;
- Dependency Review;
- high/critical npm audit with scripts disabled;
- CodeQL `security-extended`;
- CSP and local-first headers;
- parser/model purity;
- storage-key separation and batch-index privacy;
- active boot chain and lazy loading;
- required files and staged workflow ordering.

## Merge criteria

A final head may merge only after:

1. Parser and static preflight;
2. Local source — desktop;
3. Local source — responsive;
4. Accessibility and visual contracts;
5. Lighthouse CI budgets;
6. Full-history privacy and secret scan;
7. CodeQL;
8. Dependency Review;
9. npm audit;
10. repository drift checks;
11. exact-head Cloudflare preview;
12. no unresolved review threads.
