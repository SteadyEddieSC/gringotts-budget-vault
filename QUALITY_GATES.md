# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser and profile correctness, accessibility, performance, responsive layout, and the local-first data boundary across v117 Import Profiles & Field Validation.

The final matrix remains comprehensive while syntax and pure-model defects stop before expensive browser installation.

## Data boundary

All checks use fictional fixtures in isolated Node or Playwright contexts.

The workflows do not:

- read a normal user browser profile;
- upload a household vault, bank export, saved household profile, Guided Plan, or report;
- commit screenshots containing transaction data;
- load remote parser or axe code at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- use a real institution account or identifier.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version. Pure parser and profile tests use Node's built-in runner.

## Parser, profile, and static preflight

Before either browser matrix job begins, GitHub runs:

- `node --check` against v115 parser/import modules and v117 profile, controller, release, and boot modules;
- `npm run test:parser` using synthetic text fixtures, deterministic mutations, and pure profile-model cases.

The gate covers format and delimiter detection, quoted fields, mapping candidates, date and amount validation, sign normalization, OFX-family data, limits, malformed-input termination, profile identity, exact compatibility, sanitization, bounded storage shape, and safe application payloads.

`Local source — desktop` and `Local source — responsive` depend on this gate, so syntax, parser, or profile-model failure prevents browser downloads.

## Staged browser execution

Draft PRs skip protected jobs.

When ready for review:

1. parser/profile/static preflight runs;
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
- Tools → Import transactions before source selection;
- Tools → Import Profile and Field Validation after a synthetic export;
- Tools → Restore full vault;
- Exports & Backup, Diagnostics, and Roadmap.

Targeted phone coverage includes Dashboard, report summary, report insights, report Guided Plan, Activity insights, Activity Plan, responsive navigation, and the profile/field-validation surface.

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
- native report-page, mapping, and profile selects;
- explicit import/restore task buttons with `aria-pressed` state;
- usable profile Save, Update, New, Apply, and Delete controls.

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

The gate also enforces page-weight, script, stylesheet, image, console-error, request-count, and zero-third-party-resource budgets. Profile JavaScript and CSS lazy-load only after Tools → Import opens, so the initial Dashboard request budget is unchanged. Reports upload only on failure.

## Privacy-safe visual contracts

No binary screenshot baseline is committed.

Deterministic v117 contracts cover:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844;
- Tools → Import & Restore phone at 390 × 844;
- Activity phone at 390 × 844.

The contracts verify six primary destinations, eight report pages in the document, one visible report preview, Import visible and Restore hidden initially, compact phone Activity navigation, responsive report controls, minimum card counts, control height, main width, topbar placement, and horizontal overflow.

The profile browser tests separately verify the lazy profile card, field explanations, and profile action containment after a synthetic export is inspected.

Actual geometry and computed colors are temporary JSON diagnostics. Screenshots, traces, and video are retained only when a test fails.

## Observer stability

The v117 release layer uses one idempotent MutationObserver on `#main`. The lazy profile controller marks an enhanced Import page and does not rebuild it on observer callbacks.

Tests require Reports, Import / Restore, profile controls, and field explanations to settle with zero continuing child-list rewrites after initial enhancement and explicit changes.

## Workflow security checks

`tests/repository-security.spec.js` verifies:

- every external Action is pinned to a full commit SHA;
- no privileged PR trigger or broad content-write permission;
- CodeQL least privilege;
- parser/profile/static preflight before browser installation;
- desktop and responsive engine staging;
- quality preflight before axe;
- failure-only diagnostics;
- v115 parser purity and guarded import controls;
- v113 Insights and v114 Guided Plan local-only boundaries;
- the v117 pure profile model has no storage or network channel;
- the v117 controller writes only the bounded profile key and never the vault;
- v117 profile code and CSS are absent from initial HTML;
- v117 release and exports add no transaction-storage channel;
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
