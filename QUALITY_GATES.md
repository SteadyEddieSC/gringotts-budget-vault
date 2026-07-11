# Gringotts Accessibility and Quality Gates

## Purpose

The quality system protects parser, profile, portability, revision, dry-run, receipt-audit, batch-lineage, account-cleanup, recurring-decision, roadmap, accessibility, performance, responsive-layout, and local-first data boundaries across v123.

Syntax and pure-model defects stop before browser installation. Draft pull requests skip protected jobs.

## v123 recurring-decision contracts

The release must prove that:

- pending, income, transfer-like, and unsupported one-time rows do not enter the decision queue;
- recurring candidates are separated by normalized merchant and account;
- cadence, amount stability, latest price change, and annualization assumptions are explainable;
- account labels are masked;
- decision metadata is capped at 120 records and history at 240 entries;
- writes are read-back verified and restore the prior raw value after failure;
- dormant decisions are never applied to another candidate;
- saving decisions leaves the vault byte-for-byte unchanged;
- no merchant cancellation, contact, email, payment change, external account connection, or transaction write exists;
- open Cancel, Renegotiate, and Investigate decisions appear in Guided Plan and reports;
- the workbook contains 39 sheets;
- v123 owns presentation without activating the v122 observer.

## Accessibility

Fresh v123 axe coverage scans:

- recurring filters and candidate selection;
- the focusable recurring evidence table;
- decision, status, owner, date, and notes controls;
- Guided Plan recurring follow-up;
- report integration;
- the v123–v129 Roadmap;
- desktop and phone layouts.

The gate blocks serious or critical WCAG and best-practice findings. Existing coverage remains for every primary destination, report page, import/restore task, profiles, dry runs, receipt lineage, account cleanup, Insights, and Guided Plan.

## Responsive and observer stability

The suite verifies:

- Chromium, Firefox, and WebKit desktop;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- no document-level horizontal overflow;
- internal table scrolling on narrow viewports;
- one recurring workspace per Money render;
- one cleanup card per Tools render;
- idempotent report and Roadmap enhancements;
- no mutation-observer ping-pong.

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

v118–v123 route code and CSS remain absent from the initial Dashboard request set and load only when Money, Reports, Activity, or Tools opens.

## Privacy and supply chain

Protected workflows verify:

- full-history financial-data and identifier scanning;
- Gitleaks;
- Dependency Review and high/critical npm audit;
- CodeQL `security-extended`;
- SHA-pinned Actions and least privilege;
- CSP and local-first headers;
- metadata-store separation;
- no raw transaction copies in planning stores;
- no service worker or external financial action.

## Merge criteria

The exact final head may merge only after parser/static, desktop/responsive Playwright, accessibility/visual, Lighthouse, privacy, CodeQL, dependency, supply-chain, exact-head Cloudflare preview, and unresolved-review-thread checks pass.
