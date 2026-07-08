# Gringotts Accessibility and Quality Gates

## Purpose

v112 adds repeatable accessibility, performance, best-practice, SEO, and responsive-layout checks without changing the local-first household-data boundary.

The visible budgeting application remains v111 — Household Reporting III. v112 is a quality-infrastructure release.

## Data boundary

All automated browser quality checks use `tests/fixtures/synthetic-vault.json` inside an isolated Playwright browser context.

The quality workflow does not:

- read a user's normal browser profile;
- upload a household vault;
- commit screenshots of household data;
- call a remote axe or Lighthouse script at application runtime;
- add a service worker or offline cache;
- change the restore destination;
- write transaction data.

Axe and Lighthouse CI are installed only in the GitHub Actions runner using exact versions, `--ignore-scripts`, `--no-save`, and `--package-lock=false`.

## Axe accessibility gate

`quality-tests/accessibility.spec.js` scans these synthetic surfaces:

1. Dashboard;
2. Money — Budget & Recurring;
3. Money — Goals & Health;
4. Money — Close & Forecast;
5. Calendar;
6. Reports — Household Reporting III;
7. Activity — Review Queue;
8. Tools — Import / Restore.

The release gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 AA, or WCAG 2.2 AA tags.

The complete violation report is saved to `quality-results/axe-results.json` and uploaded only as a short-lived workflow artifact.

A separate keyboard smoke test verifies the skip link and accessible names for all primary destinations.

## Lighthouse CI gate

`.lighthouserc.cjs` runs two local audits against the static application. No production URL or household data is required.

Minimum category scores:

- Performance: 0.75;
- Accessibility: 0.95;
- Best Practices: 0.90;
- SEO: 0.90.

Maximum timing budgets:

- First Contentful Paint: 2.5 seconds;
- Largest Contentful Paint: 4.0 seconds;
- Time to Interactive: 5.0 seconds;
- Total Blocking Time: 600 milliseconds;
- Cumulative Layout Shift: 0.10.

`lighthouse-budget.json` also limits total/script/stylesheet/image transfer size, total resource count, script count, stylesheet count, and third-party requests. The third-party request budget is zero.

## Visual regression contracts

Binary screenshot baselines are intentionally not committed because the repository's privacy rules prohibit household-data screenshots and binary images create difficult-to-review churn.

Instead, `quality-tests/visual-contracts.spec.js` compares deterministic visual-layout snapshots for:

- Dashboard at 1440 × 1000;
- Reports at 1440 × 1000;
- Reports at 390 × 844.

The committed baseline at `quality-baselines/v112-layout-contracts.json` covers:

- required visible and hidden surfaces;
- primary navigation count;
- minimum card and report-page counts;
- one-column versus four-column responsive range controls;
- minimum mobile control height;
- main-content width;
- topbar placement;
- document horizontal overflow.

The actual geometry, computed body colors, visible counts, and responsive state are written to `quality-results/visual-layout-snapshots.json`. Playwright still captures a screenshot, trace, and video automatically when a quality test fails, and those diagnostics remain short-lived workflow artifacts rather than repository files.

## Workflow checks

The v112 workflow adds two pull-request checks:

- `Axe accessibility and visual contracts`;
- `Lighthouse quality budgets`.

They run alongside the established desktop/responsive Playwright, privacy/Gitleaks, Dependency Review, npm audit, CodeQL, and security-drift gates.

## Local execution

Install the locked application dependencies and the exact temporary quality tools:

```bash
npm ci --ignore-scripts
npm install --no-save --package-lock=false --ignore-scripts axe-core@4.10.3 @lhci/cli@0.15.1
npx playwright install chromium
```

Run accessibility and visual contracts:

```bash
npx playwright test --config=playwright.quality.config.js --project=quality-chromium
```

Run Lighthouse CI:

```bash
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" \
  npx lhci autorun --config=.lighthouserc.cjs
```

Generated local folders such as `quality-results` and `.lighthouseci` must not be committed.
