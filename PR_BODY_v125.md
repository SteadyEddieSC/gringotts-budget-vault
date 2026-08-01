## Close History & Trend Explainability

v125 turns immutable month-close history and currently posted open-month evidence into a cautious, transfer-neutral explanation of household change.

### Evidence model
- closed-month totals come from retained immutable close snapshots when complete aggregate metrics are available;
- open months use currently posted rows and remain labeled as estimates;
- pending rows are excluded from all money totals;
- transfers are shown for context but excluded from income, spending, and operating-net comparisons;
- snapshot-versus-current-row coverage mismatches lower confidence rather than rewriting history.

### Explainability
- compares the selected month with the nearest available prior month;
- distinguishes income, recurring expenses, variable expenses, and transfer-neutral operating net;
- ranks meaningful aggregate drivers;
- displays comparison period, close revision, reopen history, evidence source, coverage, and confidence;
- explicitly states that aggregate drivers show correlation, not proof of causation.

### Household workflow
- integrates close narratives into Guided Plan, Reports, Family Meeting preparation, Markdown, diagnostics, and the Vault Workbook;
- expands the workbook from 41 to 43 sheets with Close Trends and Close Drivers;
- treats 43 sheets as the cap entering the reliability phase.

### Safety and privacy
- no transaction or close-history rewrite;
- no automatic reopen;
- no automatic budget, forecast, debt, goal, scenario, or recurring-decision changes;
- aggregate-only exports with no transaction rows, merchants, account labels, credentials, tokens, or vault contents;
- no analytics endpoint, remote parser, institution connection, service worker, or second runtime.

### Strategic shift
The next release is v126 — Runtime Consolidation & Reliability. Feature growth is frozen while route lifecycle, observer ownership, action dispatch, rendering idempotency, recovery, interaction states, accessibility, performance budgets, and maintenance cost are addressed.

### Validation
- browser-free model and ownership contracts;
- parser/static preflight;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates;
- privacy, Gitleaks, Dependency Review, npm audit, supply-chain checks, and CodeQL;
- exact-head Cloudflare preview and unresolved-review-thread verification before merge.
