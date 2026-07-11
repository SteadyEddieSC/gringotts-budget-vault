# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, profile, portability, revision, dry-run, receipt-audit, batch-lineage, account-cleanup, recurring-decision, scenario-comparison, roadmap, accessibility, performance, responsive-layout, and local-first data boundaries across v124.

Syntax and pure-model defects stop before browser installation. Draft pull requests skip protected jobs.

## v124 scenario contracts

The release must prove that:

- scenario assumptions are sanitized and limited to 30-, 60-, or 90-day horizons;
- starting cash, monthly income, recurring savings, flexible spending, one-time expense, extra debt payment, and extra goal contribution remain temporary assumptions;
- cash, low point, buffer pressure, negative days, debt direction, goal timing, and flexibility are explainable;
- debt direction excludes interest, fees, amortization, and minimum-payment recalculation;
- scenario metadata is capped at 24 records and history at 80 entries;
- writes are read-back verified and restore the prior raw value after failure;
- saving a scenario leaves vault, forecast, debt, goal, and recurring stores byte-for-byte unchanged;
- no Apply Scenario control, external account connection, or financial write exists;
- Guided Plan and reports identify projections and assumptions;
- the workbook contains 41 sheets;
- v124 owns presentation without activating the v123 release observer.

## Accessibility

Fresh v124 axe coverage scans:

- scenario assumptions and native controls;
- the labeled focusable comparison table;
- Guided Plan scenario discussion;
- planning and Family Meeting report integration;
- the v124–v130 Roadmap;
- desktop and phone layouts.

The gate blocks serious or critical WCAG and best-practice findings. Existing coverage remains for every primary destination, report page, import/restore task, profiles, dry runs, receipt lineage, account cleanup, recurring decisions, Insights, and Guided Plan.

## Responsive and observer stability

The suite verifies Chromium, Firefox, and WebKit desktop; Android Chromium, iPad WebKit, and iPhone WebKit; no document-level overflow; internal table scrolling; one scenario workspace per Close & Forecast render; one recurring workspace per Money render; one cleanup card per Tools render; idempotent report and Roadmap enhancements; and no observer ping-pong.

## Lighthouse

The original budgets remain:

- Performance 0.85;
- Accessibility 0.95;
- Best Practices 0.95;
- SEO 0.90;
- FCP 2,000 ms;
- LCP 2,500 ms;
- TBT 250 ms;
- CLS 0.10;
- total bytes 750 KB;
- scripts 500 KB;
- stylesheets 150 KB;
- images 250 KB;
- console errors zero;
- network requests maximum 45.

v118–v124 route code and CSS remain absent from the initial Dashboard request set and load only when Money, Reports, Activity, or Tools opens.

## Privacy and supply chain

Protected workflows verify full-history financial-data and identifier scanning, Gitleaks, Dependency Review and high/critical npm audit, CodeQL `security-extended`, SHA-pinned Actions and least privilege, CSP and local-first headers, metadata-store separation, no raw transaction copies in planning stores, no service worker, and no external financial action.

## Merge criteria

The exact final head may merge only after parser/static, desktop/responsive Playwright, accessibility/visual, Lighthouse, privacy, CodeQL, dependency, supply-chain, exact-head Cloudflare preview, and unresolved-review-thread checks pass.
