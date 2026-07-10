# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, mapping-profile, portability, accessibility, performance, responsive layout, and local-first data boundaries across v118 Profile Portability & Institution Patterns.

The final matrix remains comprehensive while syntax and pure-model defects stop before expensive browser installation.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

The workflows do not:

- read a normal user browser profile;
- upload a household vault, bank export, saved household profile, exported profile bundle, Guided Plan, or report;
- commit screenshots containing transaction data;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version. Pure parser, profile, portability, and pattern tests use Node's built-in runner.

## Parser, profile, portability, and static preflight

Before either browser matrix job begins, GitHub runs:

- `node --check` against active v115 parser/import modules, v117 profile modules, and v118 portability, pattern, release, and boot modules;
- `npm run test:parser` using synthetic text fixtures, deterministic mutations, pure profile-model cases, portable bundle cases, and fictional institution-pattern cases.

The gate covers:

- format and delimiter detection;
- quoted and multiline fields;
- mapping candidates;
- date and amount validation;
- sign normalization;
- OFX-family data and entities;
- size and row limits;
- malformed-input termination;
- profile identity and exact compatibility;
- portable bundle sanitization and forbidden-key rejection;
- exact, same-definition, identity-conflict, name-conflict, and new classifications;
- reviewed Add, Replace, and Skip planning;
- duplicate-name and invalid-replacement blocking;
- card-activity, deposit/withdrawal, and digital-wallet patterns.

`Local source — desktop` and `Local source — responsive` depend on this gate, so syntax or pure-model failure prevents browser downloads.

## Staged browser execution

Draft PRs skip protected jobs.

When ready for review:

1. parser/profile/portability/static preflight runs;
2. Chromium desktop and Android Chromium run after preflight;
3. Firefox/WebKit install only after desktop Chromium passes;
4. iPad/iPhone WebKit install only after Android passes;
5. diagnostics upload only on failure.

## Axe accessibility gate

Desktop coverage includes:

- Dashboard;
- every Money subsection;
- Calendar;
- all eight report-preview pages;
- Transactions, Review Queue, Rules, Insights, and Plan;
- Tools → profile library and bank import before source selection;
- Tools → portable bundle conflict review;
- Tools → mapping profile and field validation after a synthetic export;
- Tools → Restore full vault;
- Exports & Backup, Diagnostics, and Roadmap.

Targeted phone coverage includes Dashboard, report summary, report insights, report Guided Plan, Activity insights, Activity Plan, responsive navigation, portable bundle conflict review, and the mapping-profile/field-validation surface.

The gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

## Keyboard and semantic gate

The quality and cross-browser suites verify:

- Skip to content;
- visible focus treatment;
- unique rendered IDs;
- mobile menu state and Escape behavior;
- valid secondary tab semantics;
- Arrow Left/Right, Home, and End navigation;
- labeled and focusable scrollable tables;
- native report-page, mapping, profile, bundle-action, and replacement-target selects;
- explicit import/restore task buttons with `aria-pressed` state;
- usable profile Save, Update, New, Apply, Delete, Export, Add, Replace, Skip, and Clear controls;
- explicit bundle acknowledgement before storage.

The shared enhancement remains in `src/v112/accessibility.js` and observes main-content rerenders.

## Lighthouse CI gate

`lighthouserc.cjs` runs three local desktop audits.

Minimum median scores:

- Performance: 0.85;
- Accessibility: 0.95;
- Best Practices: 0.95;
- SEO: 0.90.

Maximum median timing assertions:

- FCP: 2.0 seconds;
- LCP: 2.5 seconds;
- TBT: 250 milliseconds;
- CLS: 0.10.

The gate also enforces page-weight, script, stylesheet, image, console-error, request-count, and zero-third-party-resource budgets. v117 mapping-profile JavaScript, v118 portability JavaScript, and their CSS load only after Tools → Import opens, so the initial Dashboard request budget is unchanged. Reports upload only on failure.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic v118 contracts cover:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844;
- Tools → Import & Restore phone at 390 × 844;
- Activity phone at 390 × 844.

The contracts verify six primary destinations, eight report pages in the document, one visible report preview, Import visible and Restore hidden initially, the portability card and bundle picker visible on Import, compact phone Activity navigation, responsive report controls, minimum card counts, control height, main width, topbar placement, and horizontal overflow.

Targeted browser tests separately verify bundle action/name/target controls, library containment, and field validation after synthetic files are inspected.

Actual geometry and computed colors are temporary JSON diagnostics. Screenshots, traces, and video are retained only when a test fails.

## Observer stability

The v118 release layer uses one idempotent MutationObserver on `#main`. The lazy v117 profile controller and v118 portability controller each mark the current Import page and do not rebuild it on observer callbacks.

Tests require Reports, the initial profile library, portable bundle preview, mapping profile controls, field explanations, Import / Restore task changes, and explicit report selections to settle with zero continuing child-list rewrites.

## Portability safety contracts

Browser and pure-model tests require:

- exported bundles omit local profile IDs and local timestamps;
- files containing transaction-shaped or credential-shaped keys are rejected before preview;
- selected filenames are not stored in the profile library;
- exact and same-definition imports default to Skip;
- replacements target only identity-matched saved profiles;
- replacements preserve local profile ID and original creation time;
- reviewed Add/Replace/Skip writes leave the household vault byte-for-byte unchanged;
- profile writes are sanitized, capped, read back, and rolled back on failure.

## Workflow security checks

`tests/repository-security.spec.js` verifies:

- every external Action is pinned to a full commit SHA;
- no privileged PR trigger or broad content-write permission;
- CodeQL least privilege;
- parser/profile/portability/static preflight before browser installation;
- desktop and responsive engine staging;
- quality preflight before axe;
- failure-only diagnostics;
- v115 parser purity and guarded transaction controls;
- v113 Insights and v114 Guided Plan local-only boundaries;
- the v117 pure profile model has no storage or network channel;
- the v117 controller writes only the bounded profile key and never the vault;
- v118 pure portability and institution-pattern models have no storage or network channel;
- the v118 controller writes only the profile key and includes rollback/read-back verification;
- v118 profile and portability code/CSS are absent from initial HTML;
- v118 release and exports add no transaction-storage channel;
- Cloudflare security headers.

## Local execution

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

Individual commands:

```bash
npm run test:a11y
npm run test:visual
```

Lighthouse:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
npm exec --yes --package=@lhci/cli@0.15.1 -- lhci autorun --config=lighthouserc.cjs
```

Generated parser output, quality reports, test results, Playwright reports, and Lighthouse reports must not be committed.
