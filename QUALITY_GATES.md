# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, mapping-profile, portability, revision-history, dry-run diagnostic, receipt-audit, detailed-roadmap, accessibility, performance, responsive-layout, and local-first data boundaries across v120 Import Receipt Audit & Rollback Guidance.

Syntax and pure-model defects stop before expensive browser installation. Draft pull requests skip protected jobs.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

The workflows do not:

- read a normal user browser profile;
- upload a household vault, bank export, profile, revision history, bundle, dry run, receipt, receipt audit, Guided Plan, backup, or report;
- commit financial screenshots;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version. Pure parser, profile, portability, revision, diagnostic, receipt-audit, roadmap, and institution-pattern tests use Node's built-in runner.

## Parser and static preflight

Before either browser matrix job begins, GitHub runs:

- `node --check` against active v115–v120 modules and `src/boot-v120.js`;
- `npm run test:parser` using synthetic parser fixtures, deterministic mutations, profile models, bundles, revision histories, dry runs, receipts, audit packages, roadmap data, and module-identity contracts.

The gate covers format/delimiter detection, field mapping, date/amount/sign validation, OFX-family data, limits, malformed-input termination, exact profile compatibility, bundle review, revision redaction/bounds, dry-run privacy, receipt arithmetic and verification, backup expectations, audit-package privacy, and the v120–v126 roadmap structure.

Desktop and responsive browser jobs depend on this gate.

## Staged browser execution

When ready for review:

1. parser/profile/portability/revision/diagnostic/receipt/roadmap preflight runs;
2. Chromium desktop and Android Chromium run;
3. Firefox/WebKit install only after desktop Chromium passes;
4. iPad/iPhone WebKit install only after Android passes;
5. diagnostics upload only on failure.

## Axe accessibility gate

The established inventory covers every primary destination, all Money and Activity subsections, all eight report pages, Import and Restore, profile library, portability conflict review, mapping validation, prepared dry runs, revision review, Exports, Diagnostics, and Roadmap.

A focused v120 inventory starts from fresh renders and additionally scans:

- a selected receipt-audit detail on desktop;
- the seven-release roadmap horizon on desktop;
- receipt audit and roadmap on the phone layout.

The gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

## Keyboard and semantics

The suite verifies:

- Skip to content and visible focus;
- unique IDs;
- secondary tab semantics and Arrow Left/Right/Home/End navigation;
- labeled and focusable scrollable tables;
- native report, mapping, profile, bundle, replacement, and revision controls;
- explicit Import/Restore task buttons;
- explicit revision, dry-run, receipt-audit, and manual-restore actions;
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
- total byte weight: 750 KB;
- scripts: 500 KB;
- stylesheets: 150 KB;
- images: 250 KB;
- console errors: zero;
- network requests: maximum 45.

The v118 portability, v119 revision/dry-run, and v120 receipt/roadmap route layers and their CSS load only when Tools or Reports is opened. The initial Dashboard request budget is not increased.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic contracts cover Dashboard desktop, Reports desktop and phone, Tools → Import phone, Activity phone, and route-specific controls. Contracts verify six primary destinations, eight report pages, one visible report preview, Import visible/Restore hidden initially, portability, revision history, dry run, receipt audit, compact phone navigation, control height, main width, topbar placement, and horizontal overflow.

Geometry and computed-color JSON is temporary. Screenshots, traces, video, axe JSON, and Lighthouse reports upload only on failure.

## Observer stability

The route layers use idempotent enhancement markers and one observer per release layer. Tests require Reports, profiles, bundle preview, mappings, revision gate/history, dry-run summary, receipt audit, detailed roadmap, and Import/Restore changes to settle without continuing child-list rewrites.

## v120 receipt-audit safety contracts

Browser and pure-model tests require:

- verified and verified-no-change receipt handling;
- incoming = inserted + skipped reconciliation;
- destination before + inserted = destination after reconciliation;
- inconsistent receipts classified for review;
- current destination differences treated as notes rather than destructive triggers;
- correct backup filename expectation;
- no invented backup for no-change receipts;
- no transaction write or storage cleanup;
- no automatic rollback;
- a separate explicit audit download;
- no transaction rows, filenames, fingerprints, mappings, destination keys, account identifiers, merchants, or vault contents in downloaded audits;
- the household vault remains byte-for-byte unchanged.

## v120 roadmap contracts

Tests require:

- at least six future-facing releases and seven current entries from v120 through v126;
- distinct version identifiers;
- purpose, capabilities, dependencies, safety boundaries, and expected outcome for every release;
- v120 marked current;
- directional-planning disclosure for later releases;
- idempotent rendering and phone containment.

## Preserved v119–v117 contracts

The suite retains revision-gated Update/Replace, bounded redacted revision history, dry-run privacy, bundle sanitization and reviewed Add/Replace/Skip, exact-compatible profile application, bounded profile storage, field explanations, metadata rollback, and vault noninterference.

## Repository security and supply chain

Protected workflows verify:

- full-history privacy and financial-identifier scanning;
- Gitleaks;
- action SHA pinning and least-privilege permissions;
- Dependency Review;
- high/critical npm audit with scripts disabled;
- CodeQL `security-extended` analysis;
- CSP and local-first boundary headers;
- parser purity and storage-key separation;
- receipt-audit read-only behavior and manual rollback;
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
11. exact-head Cloudflare preview deployment;
12. no unresolved review threads.
