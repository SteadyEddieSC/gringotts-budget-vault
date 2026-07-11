# Gringotts Budget Vault Testing

## Data boundary

All tests use fictional fixtures and isolated browser contexts. Tests must never read, commit, upload, or publish a real vault, bank export, scenario store, recurring-decision store, account-cleanup plan, profile, revision history, dry-run diagnostic, import receipt, batch index, timeline package, backup, report, screenshot, or real account identifier.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free preflight

```bash
npm run test:parser
```

The Node suite covers parser behavior plus:

- scenario-assumption sanitization;
- 30-, 60-, and 90-day comparison horizons;
- cash, low-point, pressure-day, and negative-day comparison;
- extra-principal debt direction without interest claims;
- aggregate goal-timing estimates;
- bounded scenario storage and history;
- no copied transaction, merchant, account, balance, credential, or token fields;
- recurring decisions, account cleanup, receipt lineage, profile, and dry-run regressions;
- v124–v130 Roadmap validation;
- module identity and presentation ownership.

GitHub runs `node --check` against active v115–v124 modules and `src/boot-v124.js` before installing browsers.

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

## v124 scenario coverage

Tests verify:

- Preview Scenario is in-memory only;
- Save Assumptions writes only `gringottsScenarioComparisons.v1`;
- the store is capped at 24 scenarios and 80 history entries;
- writes are read-back verified and restore the previous raw value after failure;
- vault, forecast, debt, goals, and recurring-decision stores remain byte-for-byte unchanged;
- there is no Apply Scenario control;
- assumptions and projection limits are visible;
- one-time expenses require a date;
- Guided Plan, planning report, Family Meeting, Markdown, and workbook integration remain local;
- the workbook contains 41 sheets.

## Preserved coverage

The existing suites continue to verify recurring decisions, account cleanup, receipt integrity and lineage, profiles and dry runs, guarded import and separate restore, six primary destinations, eight report pages, close/reopen, forecast, goals, debt, Insights, Guided Plan, no service worker, and no write network requests.

## Accessibility and responsive quality

The quality suite scans scenario controls, focusable comparison table, Guided Plan discussion, report integration, recurring decisions, account cleanup, receipt lineage, and the v124–v130 Roadmap on desktop and phone.

The full matrix includes Chromium, Firefox, and WebKit desktop; Android Chromium; iPad and iPhone WebKit; keyboard and tab semantics; visual contracts; serious/critical axe gates; and the original Lighthouse performance, accessibility, best-practice, SEO, byte, timing, console, and request budgets.

## Final merge gate

The exact final head must pass parser/static, desktop and responsive Playwright, accessibility and visual contracts, Lighthouse, full-history privacy and secret scan, CodeQL, Dependency Review, npm audit, repository security drift, exact-head Cloudflare preview, and unresolved-review-thread checks.
