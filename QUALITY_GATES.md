# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser correctness, accessibility, performance, responsive layout, and the local-first data boundary across v116 UI Architecture Review.

The final matrix remains comprehensive while syntax and pure parser defects stop before expensive browser installation.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

The workflows do not:

- read a normal user browser profile;
- upload a household vault, bank export, Guided Plan, or report;
- commit screenshots containing transaction data;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version. Pure parser tests use Node's built-in runner.

## Parser and static preflight

Before either browser matrix job begins, GitHub runs:

- `node --check` against v115 parser/import modules and v116 reporting, presentation, and boot modules;
- `npm run test:parser` using synthetic text fixtures and deterministic mutations.

The parser gate covers format and delimiter detection, quoted fields, mapping candidates, date and amount validation, sign normalization, OFX-family data, limits, and expected malformed-input termination.

`Local source — desktop` and `Local source — responsive` depend on this gate, so syntax or parser failure prevents browser downloads.

## Staged browser execution

Draft PRs skip protected jobs.

When ready for review:

1. parser/static preflight runs;
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
- Tools → Import transactions;
- Tools → Restore full vault;
- Exports & Backup, Diagnostics, and Roadmap.

Targeted phone coverage includes Dashboard, report summary, report insights, report Guided Plan, Activity insights, Activity Plan, and responsive navigation.

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
- native report-page and mapping selects;
- explicit import/restore task buttons with `aria-pressed` state.

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

The gate also enforces page-weight, script, stylesheet, image, console-error, request-count, and zero-third-party-resource budgets. Reports upload only on failure.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic contracts cover:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844;
- Tools → Import & Restore phone at 390 × 844;
- Activity phone at 390 × 844.

The v116 contracts verify:

- six primary destinations;
- eight report pages remain in the document;
- only Family Summary is visible initially on screen;
- nonselected comparison, insights, and Guided Plan pages are hidden initially;
- report-page select and toolbar visibility;
- bank import is visible initially and full restore is hidden;
- import progress and task switcher visibility;
- compact Activity phone navigation;
- one-column and four-column report controls;
- minimum card counts, control height, main width, topbar placement, and horizontal overflow.

Actual geometry and computed colors are temporary JSON diagnostics. Screenshots, traces, and video are retained only when a test fails.

## Observer stability

The v116 presentation layer uses one idempotent MutationObserver on `#main`.

Tests require Reports and Import / Restore to settle with zero continuing child-list rewrites after initial enhancement and after explicit page/task changes.

## Workflow security checks

`tests/repository-security.spec.js` verifies:

- every external Action is pinned to a full commit SHA;
- no privileged PR trigger or broad content-write permission;
- CodeQL least privilege;
- parser/static preflight before browser installation;
- desktop and responsive engine staging;
- quality preflight before axe;
- failure-only diagnostics;
- v115 parser purity and guarded import controls;
- v113 Insights and v114 Guided Plan local-only boundaries;
- v116 presentation and reporting add no storage or network channel;
- v116 boot entry, style, and module chain;
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
