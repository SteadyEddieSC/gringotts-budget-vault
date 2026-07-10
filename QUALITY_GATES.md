# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, mapping-profile, portability, revision-history, dry-run diagnostic, accessibility, performance, responsive-layout, and local-first data boundaries across v119 Profile Versioning & Dry-Run Diagnostics.

Syntax and pure-model defects stop before expensive browser installation. Draft pull requests skip protected jobs.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

The workflows do not:

- read a normal user browser profile;
- upload a household vault, bank export, saved profile, revision history, exported bundle, dry-run diagnostic, Guided Plan, or report;
- commit financial screenshots;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version. Pure parser, profile, portability, revision, diagnostic, and institution-pattern tests use Node's built-in runner.

## Parser, profile, portability, revision, diagnostic, and static preflight

Before either browser matrix job begins, GitHub runs:

- `node --check` against active v115–v119 modules and `src/boot-v119.js`;
- `npm run test:parser` using synthetic text fixtures, deterministic mutations, profile models, portable bundles, revision histories, dry-run diagnostics, and fictional institution patterns.

The gate covers format/delimiter detection, quoted fields, mapping candidates, date/amount/sign validation, OFX-family data, limits, malformed-input termination, exact profile compatibility, portable bundle sanitization/classification, Add/Replace/Skip planning, revision comparison/redaction/bounds, diagnostic privacy/signatures, and fictional institution patterns.

Desktop and responsive browser jobs depend on this gate.

## Staged browser execution

When ready for review:

1. parser/profile/portability/revision/diagnostic preflight runs;
2. Chromium desktop and Android Chromium run;
3. Firefox/WebKit install only after desktop Chromium passes;
4. iPad/iPhone WebKit install only after Android passes;
5. diagnostics upload only on failure.

## Axe accessibility gate

Desktop inventory includes every primary destination, all Money and Activity subsections, all eight report pages, Tools before source selection, profile library, portability conflicts, profile field validation, prepared dry runs, profile revision comparison, full restore, Exports & Backup, Diagnostics, and Roadmap.

Phone inventory includes Dashboard, Reports summary/insights/Guided Plan, Activity Insights/Plan, portable bundle review, profile field validation, prepared dry run, and revision review.

The gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

## Keyboard and semantics

The suite verifies:

- Skip to content and visible focus;
- unique IDs;
- secondary tab semantics and Arrow Left/Right/Home/End navigation;
- labeled and focusable scrollable tables;
- native report, mapping, profile, bundle-action, replacement-target, and revision controls;
- explicit import/restore task buttons;
- explicit revision and dry-run actions;
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

The v118 portability and v119 revision/diagnostic route layers and their CSS load only when Tools or Reports is opened. The initial Dashboard request budget is not increased.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic contracts cover Dashboard desktop, Reports desktop and phone, Tools → Import phone, and Activity phone. Contracts verify six primary destinations, eight report pages, one visible report preview, Import visible/Restore hidden initially, profile portability, revision history, dry-run controls, compact phone navigation, control height, main width, topbar placement, and horizontal overflow.

Geometry and computed-color JSON is temporary. Screenshots, traces, video, axe JSON, and Lighthouse reports upload only on failure.

## Observer stability

The v118 and v119 route layers use idempotent enhancement markers and one observer per release layer. Tests require Reports, profile library, bundle preview, mapping controls, revision gate, revision history, dry-run summary, and import/restore changes to settle with zero continuing child-list rewrites.

## v119 revision safety contracts

Browser and pure-model tests require:

- existing Update and portable Replace are intercepted before metadata writes;
- every changed mapping and option is shown;
- destination-label values are redacted in retained history;
- acknowledgement and confirmation are required;
- history remains capped at 60 total and 8 per profile;
- profile and revision writes are jointly read back;
- both prior raw metadata values are restored after failure;
- the household vault is unchanged.

## v119 dry-run safety contracts

Tests require:

- source inspection before preparation;
- preparation in memory only;
- no transaction write;
- explicit separate download;
- stale diagnostic rejection after mapping/reconciliation changes;
- no transaction rows, merchants, filenames, fingerprints, account identifiers, destination labels, balances, credentials, or vault contents;
- explicit false data-boundary declarations.

## Preserved v118 and v117 contracts

The suite retains sanitized bundle export/import, forbidden-key rejection, exact/same-definition/identity-conflict/name-conflict/new classification, reviewed Add/Replace/Skip decisions, identity-matched replacement, profile-ID preservation, exact-compatible application, bounded profile storage, field explanations, rollback, and vault noninterference.

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
