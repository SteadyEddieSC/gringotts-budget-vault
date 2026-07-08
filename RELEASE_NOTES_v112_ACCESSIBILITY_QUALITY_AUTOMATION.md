# v112 — Accessibility & Quality Automation

## Release purpose

v112 adds automated accessibility, performance, best-practice, SEO, and visual-layout release gates around the existing v111 Household Reporting III application.

This is intentionally a quality-infrastructure release. It does not create another application runtime, top-level destination, browser-storage key, service worker, or compatibility layer.

## Axe accessibility scanning

A dedicated Playwright quality suite installs axe-core 4.10.3 at an exact version and scans eight synthetic household workflows:

1. Dashboard;
2. Money — Budget & Recurring;
3. Money — Goals & Health;
4. Money — Close & Forecast;
5. Calendar;
6. Reports — Household Reporting III;
7. Activity — Review Queue;
8. Tools — Import / Restore.

The pull-request gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 AA, or WCAG 2.2 AA tags.

The suite also verifies keyboard entry through the skip link and accessible names for all six primary destinations.

A complete JSON result is retained for 14 days as a workflow artifact. It contains only fictional Playwright data.

## Lighthouse CI

Lighthouse CI 0.15.1 runs two local static audits and enforces:

- Performance score of at least 0.75;
- Accessibility score of at least 0.95;
- Best Practices score of at least 0.90;
- SEO score of at least 0.90;
- First Contentful Paint at most 2.5 seconds;
- Largest Contentful Paint at most 4.0 seconds;
- Time to Interactive at most 5.0 seconds;
- Total Blocking Time at most 600 milliseconds;
- Cumulative Layout Shift at most 0.10;
- explicit total, script, stylesheet, and image transfer budgets;
- explicit total, script, and stylesheet request-count budgets;
- zero third-party requests;
- zero browser-console errors.

The Lighthouse report is retained as a short-lived workflow artifact and is not uploaded to a public Lighthouse server.

## Privacy-safe visual regression

The repository does not commit PNG screenshot baselines because screenshots can accidentally capture household data and binary baseline changes are difficult to review.

Instead, v112 adds deterministic text-based visual-layout snapshots for:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844.

The snapshots compare required visible and hidden surfaces, primary-tab count, card and report-page counts, responsive range-control columns, mobile control height, main-content width, topbar placement, and horizontal overflow.

Actual geometry and computed colors are saved as JSON diagnostics. Playwright screenshots, traces, and video are generated only when a quality test fails and remain workflow artifacts rather than repository files.

## Supply-chain and workflow safety

The new workflow:

- uses read-only repository permission;
- pins every external GitHub Action to a full commit SHA;
- installs axe-core and Lighthouse CI at exact versions;
- uses `--ignore-scripts`, `--no-save`, and `--package-lock=false`;
- does not change the locked application dependency graph;
- does not use `pull_request_target`;
- does not download remote browser scripts with curl or wget;
- uses the existing synthetic Playwright vault helper.

Repository security-drift tests enforce these requirements and require every v112 quality control file to remain present.

## Architecture and data preservation

v112 preserves:

- the visible v111 runtime and single ES-module entry chain;
- the corrected `Mischief Managed. Money Managed` subtitle;
- `gringottsBudgetVault.latest` as the restore destination;
- best-populated-readable-vault selection;
- preview, acknowledgement, confirmation, and read-back restore verification;
- backup-first verified broad transaction writes;
- v109 import memory and duplicate guard;
- v110 close, forecast, and debt planning;
- v111 report ranges and 28-sheet workbook;
- separate goals, health, close, forecast, debt, and report-range storage;
- `rescue-v105.html`;
- no service worker, PWA cache, bridge runtime, stacked runtime, or transaction upload.

No new browser-local data key is introduced.

## New files

- `.github/workflows/quality.yml`
- `.lighthouserc.cjs`
- `lighthouse-budget.json`
- `playwright.quality.config.js`
- `quality-baselines/v112-layout-contracts.json`
- `quality-tests/accessibility.spec.js`
- `quality-tests/visual-contracts.spec.js`
- `QUALITY_GATES.md`

## Updated files

- `README.md`
- `ROADMAP.md`
- `TESTING.md`
- `tests/repository-security.spec.js`

## Required release checks

Before merge:

1. Local source — desktop;
2. Local source — responsive;
3. Axe accessibility and visual contracts;
4. Lighthouse quality budgets;
5. Full history privacy and secret scan;
6. JavaScript security analysis;
7. Dependency Review;
8. npm audit.

After merge, confirm the main-branch quality jobs and Cloudflare deployment smoke when the available tooling exposes those runs.
