# Gringotts Accessibility and Quality Gates

## Purpose

v112 adds repeatable accessibility, performance, best-practice, SEO, keyboard, and responsive-layout checks without changing the local-first household-data boundary.

The visible budgeting application remains v111 — Household Reporting III. v112 is a quality-infrastructure release.

## Data boundary

All automated browser quality checks use `tests/fixtures/synthetic-vault.json` inside isolated Playwright browser contexts.

The quality workflow does not:

- read a user's normal browser profile;
- upload a household vault;
- commit screenshots of household data;
- call a remote axe script at application runtime;
- upload Lighthouse reports to public temporary storage;
- add a service worker or offline cache;
- change the restore destination;
- write transaction data.

`@axe-core/playwright` 4.12.1 and Playwright 1.61.1 are lockfile-pinned development dependencies. Lighthouse CI 0.15.1 is invoked at an exact version in the read-only GitHub Actions runner.

## Axe accessibility gate

`quality-tests/accessibility.spec.js` scans synthetic versions of:

- Dashboard;
- every Money subsection;
- Calendar;
- Reports;
- every Activity subsection;
- every Tools subsection.

The release gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

Each audited surface receives a JSON attachment in the short-lived workflow report. The report contains fictional test data only.

## Keyboard and semantic gate

The quality and cross-browser suites verify:

- Skip to content receives first keyboard focus;
- activating the skip link focuses `#main`;
- primary controls expose visible focus treatment;
- rendered IDs remain unique;
- the mobile menu exposes `aria-expanded` and closes with Escape;
- secondary navigation exposes valid `tablist` and `tab` semantics;
- exactly one secondary tab is selected and keyboard-focusable;
- Arrow Left/Right, Home, and End move and activate the appropriate tab.

The application enhancement is centralized in `src/v112/accessibility.js` and observes main-content rerenders so semantics remain correct after navigation.

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

Speed Index and Time to Interactive remain warning thresholds so they are visible without becoming noisy environment-sensitive blockers.

The Lighthouse gate also enforces:

- total page weight at most 750 KB;
- script transfer at most 500 KB;
- stylesheet transfer at most 150 KB;
- image transfer at most 250 KB;
- zero browser-console errors;
- at most 45 network requests;
- the broader resource-size and resource-count budgets in `lighthouse-budget.json`;
- zero third-party resources.

Reports are written only to `lighthouse-reports/` and retained as short-lived private workflow artifacts.

## Privacy-safe visual regression contracts

Binary screenshot baselines are intentionally not committed. Household-data screenshots are prohibited, and binary baseline changes are difficult to review safely.

`quality-tests/visual-contracts.spec.js` instead compares deterministic visual-layout contracts for:

- Dashboard at 1440 × 1000;
- Reports at 1440 × 1000;
- Reports at 390 × 844.

The committed contract at `quality-baselines/v112-layout-contracts.json` covers:

- required visible and hidden surfaces;
- primary navigation count;
- minimum card and report-page counts;
- one-column versus four-column responsive range controls;
- minimum mobile control height;
- main-content width;
- topbar placement;
- document horizontal overflow.

Actual geometry, computed body colors, visible counts, and responsive state are written to `quality-results/visual-layout-snapshots.json`. Playwright captures screenshots, traces, and video only when a test fails; those diagnostics remain short-lived workflow artifacts rather than repository files.

## Workflow checks

The v112 workflow adds two pull-request jobs:

- `Accessibility and visual contracts`;
- `Lighthouse CI budgets`.

They run alongside desktop/responsive Playwright, privacy/Gitleaks, Dependency Review, npm audit, CodeQL, and repository security-drift gates.

## Local execution

Install locked dependencies and Chromium:

```bash
npm ci --ignore-scripts
npx playwright install chromium
```

Run all v112 browser quality gates:

```bash
npm run test:quality
```

Run only axe and keyboard checks:

```bash
npm run test:a11y
```

Run only visual-layout contracts:

```bash
npm run test:visual
```

Run Lighthouse CI against a local static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
npm exec --yes --package=@lhci/cli@0.15.1 -- lhci autorun --config=lighthouserc.cjs
```

Generated folders such as `quality-report`, `quality-results`, `test-results`, and `lighthouse-reports` must not be committed.
