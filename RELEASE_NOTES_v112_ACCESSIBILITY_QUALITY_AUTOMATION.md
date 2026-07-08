# v112 — Accessibility & Quality Automation

## Release purpose

v112 adds automated accessibility, performance, best-practice, SEO, keyboard, and responsive-layout release gates around the existing v111 Household Reporting III application.

This is intentionally a quality-infrastructure release. It does not create another application runtime, top-level destination, browser-storage key, service worker, compatibility layer, or transaction-upload path.

## Accessibility automation

The lockfile-pinned Playwright quality suite uses `@axe-core/playwright` 4.12.1 and scans synthetic versions of Dashboard, every Money subsection, Calendar, Reports, every Activity subsection, and every Tools subsection.

The pull-request gate fails on serious or critical violations associated with WCAG 2.0 A/AA, WCAG 2.1 A/AA, and axe best-practice tags.

Each audited surface receives a JSON result attachment retained for 14 days as a private workflow artifact. The data is entirely fictional.

## Accessibility improvements

v112 also fixes application behavior rather than merely adding scanners:

- `#main` is explicitly focusable for Skip to content;
- secondary navigators expose valid `tablist` and `tab` semantics;
- exactly one secondary tab exposes `aria-selected="true"` and `tabindex="0"`;
- inactive tabs use roving `tabindex="-1"`;
- Arrow Left/Right, Home, and End move and activate tabs;
- main-content rerenders are observed so semantics remain current after navigation;
- Escape closes mobile navigation and returns focus to the Menu button;
- visible focus, reduced-motion, high-contrast, and forced-colors behavior is covered;
- local file inputs retain keyboard access and minimum touch-target treatment.

The established desktop Chromium, Firefox, WebKit, tablet, Android-phone, and iPhone/WebKit suite verifies the semantic behavior in addition to the dedicated Chromium quality jobs.

## Lighthouse CI

Lighthouse CI 0.15.1 runs three local desktop audits and enforces median thresholds:

- Performance score at least 0.85;
- Accessibility score at least 0.95;
- Best Practices score at least 0.95;
- SEO score at least 0.90;
- First Contentful Paint at most 2.0 seconds;
- Largest Contentful Paint at most 2.5 seconds;
- Total Blocking Time at most 250 milliseconds;
- Cumulative Layout Shift at most 0.10;
- total page weight at most 750 KB;
- script transfer at most 500 KB;
- stylesheet transfer at most 150 KB;
- image transfer at most 250 KB;
- zero browser-console errors;
- at most 45 network requests;
- zero third-party resources through `lighthouse-budget.json`.

Speed Index and Time to Interactive remain warning thresholds to expose regressions without turning normal hosted-runner variability into false release blockers.

Lighthouse reports are written only to `lighthouse-reports/` and retained as short-lived private workflow artifacts. Temporary public report storage is not used.

## Privacy-safe visual regression

The repository does not commit PNG screenshot baselines because screenshots can accidentally capture household data and binary baseline changes are difficult to review.

Instead, v112 adds deterministic text-based visual-layout contracts for:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844.

The contracts compare required visible and hidden surfaces, primary-tab count, card and report-page counts, responsive range-control columns, mobile control height, main-content width, topbar placement, and horizontal overflow.

Actual geometry and computed colors are saved as JSON diagnostics. Playwright screenshots, traces, and video are generated only when a test fails and remain workflow artifacts rather than repository files.

## Supply-chain and workflow safety

The new workflow:

- uses read-only repository permission;
- pins every external GitHub Action to a full commit SHA;
- installs the locked dependency graph with lifecycle scripts disabled;
- invokes Lighthouse CI at an exact version;
- does not use `pull_request_target`;
- does not bootstrap or commit binary visual baselines;
- does not upload reports to public temporary storage;
- uses the existing synthetic Playwright vault helper.

Repository security-drift tests enforce these requirements and require every v112 quality control file to remain present.

## Future bank import roadmap

This release also records a dedicated future **v115 — Bank Export Import & Mapping** release in `BANK_IMPORT_ROADMAP.md` and `ROADMAP.md`.

The planned first-class formats are CSV/delimited files, OFX, QFX, and QBO. The future release must include content-aware format/schema detection, explicit mapping preview, amount-sign validation, v109 duplicate review, backup-first guarded writes, and read-back verification. CAMT, MT940, institution-specific JSON, and XLSX remain candidates only after parser and synthetic-fixture validation. PDF statements remain outside that release because they require a separate extraction and verification workflow.

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
- `lighthouse-budget.json`
- `lighthouserc.cjs`
- `playwright.quality.config.js`
- `quality-baselines/v112-layout-contracts.json`
- `quality-tests/accessibility.spec.js`
- `quality-tests/tab-semantics.spec.js`
- `quality-tests/visual-contracts.spec.js`
- `src/v112/accessibility.js`
- `styles/v112.css`
- `QUALITY_GATES.md`
- `BANK_IMPORT_ROADMAP.md`

## Updated files

- `README.md`
- `ROADMAP.md`
- `TESTING.md`
- `src/boot-v111.js`
- `tests/accessibility-semantics.spec.js`
- `tests/helpers/app.js`
- `tests/repository-security.spec.js`

## Required release checks

Before merge:

1. Local source — desktop;
2. Local source — responsive;
3. Accessibility and visual contracts;
4. Lighthouse CI budgets;
5. Full history privacy and secret scan;
6. JavaScript security analysis;
7. Dependency Review;
8. npm audit.

After merge, confirm the main-branch quality jobs and Cloudflare deployment smoke when the available tooling exposes those runs.
