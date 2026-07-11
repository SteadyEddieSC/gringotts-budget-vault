# Gringotts Budget Vault Testing

## Data boundary

All tests use fictional fixtures and isolated browser contexts. Tests must never read, commit, upload, or publish a real vault, bank export, recurring-decision store, account-cleanup plan, profile, revision history, dry-run diagnostic, import receipt, batch index, timeline package, backup, report, screenshot, or real account identifier.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free preflight

```bash
npm run test:parser
```

The Node suite covers parser behavior plus:

- recurring candidate grouping by normalized merchant and account;
- pending, income, transfer-like, and one-time exclusions;
- cadence and amount-stability evidence;
- latest-charge and annualized-increase evidence;
- masked account labels;
- bounded recurring decisions and history;
- completed and dormant decision behavior;
- Guided Plan action generation;
- account cleanup, receipt lineage, profile, and dry-run regressions;
- v123–v129 Roadmap validation;
- module identity and presentation ownership.

GitHub runs `node --check` against active v115–v123 modules and `src/boot-v123.js` before installing browsers.

## Local commands

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:parser
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

Complete cross-browser matrix:

```bash
npx playwright install firefox webkit
npm run test:local
```

## v123 recurring-decision coverage

Tests verify:

- only posted expense evidence enters the decision queue;
- pending charges and unsupported one-time purchases remain excluded;
- the same merchant on two accounts remains two candidates;
- cadence and annualization assumptions are visible;
- Keep, Cancel, Renegotiate, Investigate, and Completed decisions are explicit;
- owner, status, target date, and notes persist separately from transactions;
- the store is capped at 120 records and 240 history entries;
- writes are read-back verified and restore the previous raw value after failure;
- dormant decisions are never applied to another candidate;
- saving a decision leaves the vault byte-for-byte unchanged;
- no cancel-service, contact-merchant, payment-change, email, or external-account action exists;
- open actionable decisions appear in Guided Plan, reports, and meeting preparation;
- the workbook contains 39 sheets.

## Preserved coverage

The existing suites continue to verify:

- account cleanup planning and sanitized exports;
- receipt arithmetic, continuity, and dry-run lineage;
- profile portability, revisions, and diagnostics;
- guarded missing-only import and separate full restore;
- six primary destinations and eight report pages;
- goals, forecast, debt, close/reopen, Insights, Guided Plan, and annual tracking;
- no service worker and no write network requests.

## Accessibility and responsive quality

The quality suite scans recurring evidence, filters, decision controls, Guided Plan follow-up, report integration, account cleanup, receipt lineage, and the v123–v129 Roadmap on desktop and phone.

The full matrix includes:

- Chromium, Firefox, and WebKit desktop;
- Android Chromium;
- iPad and iPhone WebKit;
- keyboard and tab semantics;
- visual layout contracts;
- serious/critical axe gates;
- Lighthouse performance, accessibility, best-practice, SEO, byte, and request budgets.

## Final merge gate

The exact final head must pass:

1. parser and static preflight;
2. desktop and responsive Playwright matrices;
3. accessibility and visual contracts;
4. Lighthouse budgets;
5. full-history privacy and secret scan;
6. CodeQL;
7. Dependency Review and npm audit;
8. repository security-drift tests;
9. exact-head Cloudflare preview;
10. no unresolved review threads.
