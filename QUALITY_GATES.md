# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects accessibility, performance, responsive layout, and the local-first data boundary across the v114 Guided Household Planning application.

v114 also stages expensive checks so obvious failures stop early and draft development does not generate avoidable workflow notifications.

## Data boundary

All automated quality checks use `tests/fixtures/synthetic-vault.json` inside isolated Playwright browser contexts.

The quality workflow does not:

- read a normal user browser profile;
- upload a household vault or Guided Plan;
- commit screenshots containing transaction data;
- load a remote axe script at application runtime;
- publish Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- write transaction data.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned. Lighthouse CI 0.15.1 is invoked at an exact version.

## Staged execution

Draft pull requests skip the expensive quality jobs.

When the PR is marked ready for review:

1. keyboard/tab semantics and deterministic visual contracts run first;
2. the full axe surface inventory runs only after that preflight succeeds;
3. Lighthouse runs independently in parallel;
4. diagnostics are uploaded only when a job fails.

This preserves final coverage while avoiding long axe runs when navigation or layout is already broken.

## Axe accessibility gate

Desktop coverage includes:

- Dashboard;
- every Money subsection;
- Calendar;
- Reports with Household Insights and Guided Plan;
- Transactions, Review Queue, Rules, Insights, and Plan;
- every Tools subsection.

Targeted phone coverage includes Dashboard, Reports, Household Insights, Guided Plan, and mobile navigation.

The gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

Failure artifacts contain fictional test data only.

## Keyboard and semantic gate

The quality and cross-browser suites verify:

- Skip to content receives first keyboard focus;
- activating the skip link focuses `#main`;
- primary controls expose visible focus treatment;
- rendered IDs remain unique;
- the mobile menu exposes `aria-expanded` and closes with Escape;
- secondary navigation uses valid `tablist` and `tab` semantics;
- exactly one secondary tab is selected and keyboard-focusable;
- Arrow Left/Right, Home, and End move and activate tabs;
- scrollable data-table regions are labeled and keyboard-focusable;
- Guided Plan form fields have unique labels and usable focus targets.

The shared enhancement remains in `src/v112/accessibility.js` and observes main-content rerenders.

## Lighthouse CI gate

`lighthouserc.cjs` runs three local desktop audits against `http://127.0.0.1:4173/?quality=lighthouse`.

Minimum median category scores:

- Performance: 0.85;
- Accessibility: 0.95;
- Best Practices: 0.95;
- SEO: 0.90.

Maximum median timing assertions:

- First Contentful Paint: 2.0 seconds;
- Largest Contentful Paint: 2.5 seconds;
- Total Blocking Time: 250 milliseconds;
- Cumulative Layout Shift: 0.10.

The gate also enforces:

- total page weight at most 750 KB;
- script transfer at most 500 KB;
- stylesheet transfer at most 150 KB;
- image transfer at most 250 KB;
- zero browser-console errors;
- at most 45 network requests;
- broader size/count budgets in `lighthouse-budget.json`;
- zero third-party resources.

Speed Index and Time to Interactive remain warning thresholds to avoid environment-sensitive false blockers.

Lighthouse reports are written to `lighthouse-reports/` and uploaded only on failure.

## Privacy-safe visual contracts

Binary screenshot baselines are intentionally not committed.

The deterministic contracts cover:

- Dashboard at 1440 × 1000;
- Reports at 1440 × 1000;
- Reports at 390 × 844.

The v114 contract verifies:

- required visible and hidden surfaces;
- six primary destinations;
- at least eight report pages;
- Household Insights and Guided Plan report visibility;
- one-column versus four-column report-range controls;
- minimum mobile control height;
- main-content width;
- topbar placement;
- document horizontal overflow.

Actual geometry and computed colors are stored as temporary JSON diagnostics. Screenshots, traces, and video are retained only when a test fails.

## Workflow security checks

`tests/repository-security.spec.js` verifies:

- every external GitHub Action is pinned to a full commit SHA;
- no workflow uses `pull_request_target`, `write-all`, or repository-content write permission;
- CodeQL keeps read-only defaults and narrowly scoped security-event upload permission;
- draft PRs skip expensive browser, quality, security, supply-chain, and CodeQL jobs;
- Chromium runs before Firefox/WebKit installation;
- tablet/Android run before mobile WebKit installation;
- quality preflight runs before axe inventory;
- diagnostic artifacts upload only on failure;
- v114 planning code has no remote-write path or direct vault write;
- Cloudflare security headers remain intact.

## Local execution

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

Individual quality commands:

```bash
npm run test:a11y
npm run test:visual
```

Lighthouse:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
npm exec --yes --package=@lhci/cli@0.15.1 -- lhci autorun --config=lighthouserc.cjs
```

Generated `quality-report`, `quality-results`, `test-results`, `playwright-report`, and `lighthouse-reports` folders must not be committed.
