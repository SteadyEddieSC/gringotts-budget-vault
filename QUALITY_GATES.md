# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, profile, portability, revision, dry-run, receipt-audit, batch-lineage, account-cleanup planning, roadmap, accessibility, performance, responsive-layout, and local-first data boundaries across v122 Account Cleanup & Merge Planning.

Syntax and pure-model defects stop before browser installation. Draft pull requests skip protected jobs.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

Workflows do not:

- read a normal user browser profile;
- upload a vault, bank export, cleanup plan, profile, revision, dry run, receipt, batch index, timeline, backup, or report;
- commit financial screenshots;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

Playwright and axe are lockfile-pinned. Lighthouse CI is invoked at an exact version. Pure parser and metadata models use Node's built-in runner.

## Parser and static preflight

Before browsers install, GitHub runs:

- `node --check` against active v115–v122 modules and `src/boot-v122.js`;
- `npm run test:parser` with parser fixtures, deterministic mutations, profiles, bundles, revisions, dry runs, receipts, audits, batch links, account inventory, cleanup decisions, privacy packages, roadmap data, and module-identity contracts.

The v122 model gate covers:

- masked account inventory;
- account type, count, owner, and date-range derivation;
- explainable duplicate-label, spelling-drift, and possible-rename candidates;
- downstream reference counts without copied values;
- bounded metadata storage;
- explicit decisions and stale-inventory reset;
- sanitized export privacy;
- v122–v128 Roadmap validation.

## Staged browser execution

When ready for review:

1. parser and static preflight;
2. Chromium desktop and Android Chromium;
3. Firefox/WebKit desktop after Chromium passes;
4. iPad/iPhone WebKit after Android passes;
5. diagnostics only on failure.

## Axe accessibility gate

The established inventory covers every primary destination, secondary section, all eight report pages, Import and Restore, profiles, bundle conflict review, mapping validation, dry run, revision review, Exports, Diagnostics, receipt timeline, and Roadmap.

Fresh v122 scans additionally cover:

- account inventory metrics and table;
- decision-state, confidence, and search filters;
- candidate selection and evidence;
- account-reference impact cards;
- native decision control and explicit save action;
- the v122–v128 Roadmap;
- desktop and phone layouts.

The gate fails on serious or critical WCAG/best-practice findings.

## Keyboard and semantics

The suite verifies:

- Skip to content and visible focus;
- unique IDs;
- tab semantics and keyboard navigation;
- labeled focusable scrollable tables;
- native report, mapping, profile, bundle, revision, timeline, cleanup, and filter controls;
- explicit Import/Restore task buttons;
- explicit dry-run, backup, plan-download, copy, and manual-restore actions;
- mobile-menu Escape behavior.

## Lighthouse CI

Three local desktop runs enforce the original median thresholds:

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

v118–v122 route layers and CSS load only when Tools or Reports opens. The initial Dashboard request budget is unchanged.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic contracts cover Dashboard desktop, Reports desktop and phone, Tools → Import phone, Activity phone, six destinations, eight report pages, one visible preview, Import visible/Restore hidden, profile and dry-run controls, account cleanup, compact phone navigation, control height, main width, topbar placement, and horizontal overflow.

Geometry JSON and browser diagnostics are temporary. Screenshots, traces, video, axe JSON, and Lighthouse reports upload only on failure.

## Observer and route ownership

Route layers use idempotent markers and one observer per release layer.

Tests require:

- v122 interceptors load before inherited controls;
- v121 continues to reuse the authoritative v115 and v117 module instances;
- v122 reads current core state without importing a second transaction engine;
- v120 yields receipt presentation to v121;
- v121 yields page presentation to v122;
- v122 explicitly invokes the v121 timeline enhancer;
- the cleanup card is created once per rendered Tools page;
- profiles, bundles, revisions, dry runs, timeline, cleanup, Roadmap, reports, and task switching settle without recursive mutations.

## v122 account-cleanup contracts

Browser and pure-model tests require:

- account labels are masked before display or export;
- raw transaction rows never enter cleanup metadata;
- candidates include visible evidence and confidence;
- similar names alone never trigger a write;
- overlapping date ranges remain cautionary;
- the decision store is `gringottsAccountCleanupPlan.v1` and is capped at 120;
- plan writes are read-back verified and restore the previous raw value after failure;
- inventory changes invalidate stale decisions;
- saving a decision leaves the vault byte-for-byte unchanged;
- no automatic merge, rename, deletion, or transaction-write path exists;
- cleanup packages omit rows, raw labels, full identifiers, balances, merchants, files, credentials, tokens, and vault contents;
- the separate populated backup remains available.

## Preserved v121 batch-lineage contracts

The suite retains:

- authoritative unchanged receipts;
- dry-run format, schema, normalized, insert, and skip reconciliation;
- stale-candidate rejection;
- bounded batch-index storage and restoration after failure;
- origin, linked, legacy, increase, and decrease continuity;
- repeated-source information;
- all timeline filters;
- no automatic receipt repair or rollback;
- sanitized timeline packages;
- the unchanged guarded writer and separate Full Vault Restore.

## v122 workbook and Roadmap contracts

Tests require:

- a 37-sheet workbook;
- Account Inventory and Account Cleanup Plan sheets;
- retained Import Receipts, Receipt Integrity, and Batch Lineage sheets;
- seven Roadmap entries from v122 through v128;
- purpose, capabilities, dependencies, safeguards, and outcome for every release;
- v122 current and later entries planned;
- directional-planning disclosure and phone containment.

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
- storage-key separation and metadata privacy;
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
