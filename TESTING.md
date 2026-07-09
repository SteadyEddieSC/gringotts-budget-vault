# Gringotts Budget Vault Testing

## Data boundary

All automated tests use `tests/fixtures/synthetic-vault.json` and additional fictional rows created in isolated browser contexts.

Tests must never read, commit, upload, or publish a real household vault, bank export, statement, report, screenshot, or account identifier.

The synthetic suite covers income, expenses, transfers, pending rows, review-required rows, recurring amount changes, multiple fictional accounts, goals, forecasts, debt plans, Guided Plan state, and prior-year comparison rows.

## Local setup

Requirements:

- Node.js 24 or newer;
- Python 3;
- Git history for the privacy-history scan.

```bash
npm ci --ignore-scripts
npx playwright install chromium
```

## Fast release-candidate preflight

Run before opening or marking a PR ready:

```bash
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

`test:preflight` covers:

- v114 startup and consolidated navigation;
- Activity → Insights and Activity → Plan;
- Guided Plan generation, explicit local saves, history, and source navigation;
- repository workflow and security-control drift.

When browser installation is available, run the complete local matrix:

```bash
npx playwright install firefox webkit
npm run test:local
```

Additional commands:

```bash
npm run test:a11y
npm run test:visual
npm run test:headed
npm run test:ui
npm run report
```

## v114 browser coverage

### Boot and architecture

- the application boots as v114 without module errors;
- the corrected `Mischief Managed. Money Managed` subtitle remains visible;
- Dashboard, Money, Calendar, Reports, Activity, and Tools remain the six primary destinations;
- no service worker is registered;
- normal navigation creates no network write request.

### Guided Household Planning

Synthetic tests verify:

- actions are generated from review items, pending rows, missing bill/payday schedules, goal pace, forecast pressure, debt promotion gaps, and Household Insights;
- each action shows its reason, evidence, and next step;
- viewing Activity → Plan does not create `gringottsGuidedPlan.v1`;
- explicit Save Plan Item stores only status, owner, target date, notes, and history metadata;
- the populated vault remains byte-for-byte unchanged after a checklist save;
- the saved checklist record is read back and verified;
- done and dismissed current items move into the resolved section;
- source buttons open the relevant Review Queue, Money, Insights, or Reports surface;
- Guided Plan makes no network write request;
- desktop, tablet, Android, and iPhone layouts remain inside the viewport.

### Household reports

- selected-month, year-to-date, rolling, and custom report ranges persist separately;
- prior-year comparisons use equivalent fictional dates;
- goals, Vault Health, close, forecast, debt, insights, and Guided Plan appear in the family report;
- the 32-sheet workbook contains Guided Plan and Planning History;
- Guided Plan and family meeting Markdown downloads use v114 filenames;
- print media hides screen-only controls and exposes eight report pages;
- report rendering settles without a recursive mutation loop.

### Existing safeguards

The established suite continues to cover:

- Review Queue backup-first verified edits;
- goals, contributions, and explicit health snapshots;
- exact and fuzzy duplicate import review;
- missing-only imports and import-history metadata;
- malformed and empty import/restore blocking;
- statement reconciliation, close blockers, verified close, and reasoned reopen;
- recurring bills/paydays and 30/60/90-day forecasting;
- debt and promotional APR planning;
- backup, CSV, XLSX, ICS, Markdown, and diagnostics downloads;
- service-worker absence and local-only network behavior.

## Accessibility and visual quality

The quality suite scans all primary destinations and important secondary workflows, including:

- every Money subsection;
- Review Queue, Rules, Household Insights, and Guided Plan;
- every Tools subsection;
- the Reports Center with Insights and Guided Plan;
- key mobile Dashboard, Reports, Insights, Plan, and menu states.

It blocks serious or critical axe violations associated with the configured WCAG and best-practice tags.

Keyboard tests verify:

- Skip to content;
- focus visibility;
- secondary-navigation tab semantics;
- Arrow Left/Right, Home, and End navigation;
- keyboard-accessible scroll regions;
- mobile menu Escape behavior;
- unique rendered IDs.

Privacy-safe visual contracts cover:

- Dashboard desktop at 1440 × 1000;
- Reports desktop at 1440 × 1000;
- Reports phone at 390 × 844;
- eight report pages;
- Household Insights and Guided Plan visibility;
- responsive report-range columns;
- control height, main width, topbar placement, and horizontal overflow.

No PNG baseline is committed. Screenshots, traces, videos, axe JSON, and Lighthouse files are uploaded only when a job fails.

## Lighthouse

Lighthouse CI 0.15.1 runs three local desktop audits and enforces the thresholds in `lighthouserc.cjs` and `lighthouse-budget.json`, including:

- Performance at least 0.85;
- Accessibility at least 0.95;
- Best Practices at least 0.95;
- SEO at least 0.90;
- FCP, LCP, TBT, CLS, size, console-error, request-count, and third-party-resource budgets.

## Staged GitHub Actions

Draft pull requests skip expensive protected jobs.

When a PR is marked ready for review:

### Desktop Playwright

1. Install Chromium.
2. Run Chromium.
3. Install Firefox and WebKit only after Chromium passes.
4. Run Firefox and WebKit.

### Responsive Playwright

1. Install Chromium.
2. Run Android/Pixel Chromium.
3. Install WebKit only after Android Chromium passes.
4. Run the iPad and iPhone WebKit projects together.

### Quality

1. Run keyboard semantics and visual contracts.
2. Run the longer axe inventory only after the preflight passes.
3. Run Lighthouse independently in parallel.

Concurrency cancellation stops superseded runs. Diagnostics are uploaded only on failure.

See `RELEASE_PROCESS.md` for the complete workflow.

## Security gates

The final release candidate also runs:

- full-history financial-data path and identifier scanning;
- full-history Gitleaks;
- Dependency Review for newly introduced High/Critical vulnerabilities;
- locked `npm audit --audit-level=high` with lifecycle scripts disabled;
- CodeQL JavaScript analysis with `security-extended` queries;
- repository drift checks for action pinning, permissions, browser headers, draft gating, staged browser installs, and local-only v114 behavior.

OpenSSF Scorecard runs on `main`, manually, and weekly. Its findings are triaged in `SCORECARD_ALERTS.md` rather than treated automatically as exploitable vulnerabilities.

## Production smoke

After merge, the main-branch Cloudflare smoke verifies:

- v114 startup;
- all six primary destinations;
- Activity → Plan;
- Insights and Guided Plan report pages;
- hardened CSP, clickjacking, MIME-sniffing, referrer, and cross-origin headers;
- no page errors.

If the available connector cannot expose the main-push workflow run, the release handoff must state that limitation.

## Final merge gate

A release is ready to merge only when the final head passes:

1. Local source — desktop;
2. Local source — responsive;
3. Accessibility and visual contracts;
4. Lighthouse CI budgets;
5. Full history privacy and secret scan;
6. JavaScript security analysis;
7. Dependency Review;
8. npm audit;
9. repository security-drift tests.

The post-merge Cloudflare smoke is verified separately on `main`.
