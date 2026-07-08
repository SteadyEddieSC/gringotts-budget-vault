# v110 — Month Close & Forecasting

## Release purpose

v110 adds a controlled household month-close and forward-planning workspace under **Money → Close & Forecast**. It also corrects the live subtitle to:

`Mischief Managed. Money Managed`

No new top-level navigation destination is added.

## Statement reconciliation

For every account represented in the selected month, v110 shows:

- total and posted transaction counts;
- pending count;
- selected-month date coverage;
- vault signed activity;
- inflows, outflows, and transfers.

The user may enter the statement posted count and statement signed activity. A reconciliation is classified as matched, difference remains, or accepted difference with an explanatory note.

A transaction-signature check marks saved reconciliation data stale whenever selected-month transactions change.

## Controlled month close

A month cannot close while it has no transactions, pending transactions, unreviewed or nonspecific-category transactions, an account without a saved reconciliation, a stale reconciliation, or an unexplained reconciliation difference.

Closing appends an immutable local event containing summary metrics, category totals, account summaries, reconciliation results, the selected vault key, and a deterministic transaction signature. Full transaction copies are not stored in close history.

Reopening requires a specific reason and explicit confirmation. It appends a separate reopen event, preserves the prior close revision, and requires new reconciliation and a later close revision.

Month close and reopen never alter transaction rows.

## Cash-flow forecast

v110 extends local bill and payday planning with one-time, weekly, biweekly, and monthly schedules, optional account labels, native frequency selects, deletion of saved planning events, and backward-compatible handling of older one-time entries.

The forecast uses user-entered starting available cash, a minimum buffer, a flexible monthly spending estimate, saved bill and payday schedules, and a 30-, 60-, or 90-day horizon.

It displays projected ending cash, the lowest projected balance and date, days below the selected buffer, negative-balance days, monthly totals, and scheduled occurrences. The forecast is explicitly described as a planning estimate rather than a prediction of unscheduled income or purchases.

## Debt and promotional APR planning

Debt entries remain separate from transactions and goals. Each entry may include current balance, standard APR, minimum and target payments, promotional APR and end date, notes, and locally recorded planning payments.

v110 estimates monthly interest, promotional months remaining, a simple monthly payoff pace before promo expiration, and any gap between that pace and the target payment. Priority ordering favors promotional periods expiring within six months, then higher effective APR.

These are planning estimates and do not model new charges or lender-specific compounding rules.

## Reports

The Vault Workbook expands from 20 to 24 sheets by adding:

1. Month Close;
2. Reconciliations;
3. Cash Forecast;
4. Debt Plan.

## Runtime and architecture

- One live boot path: `src/boot-v110.js`.
- One live runtime: `src/runtime-v110-month-close.js`.
- New local metadata keys:
  - `gringottsMonthClose.v1`;
  - `gringottsForecastSettings.v1`;
  - `gringottsDebtPlan.v1`.
- Existing import history, goals, health history, rules, bills, paydays, budgets, transactions, and restore data remain compatible.
- The guarded restore destination remains `gringottsBudgetVault.latest`.
- `rescue-v105.html` remains unchanged.
- No service worker, PWA cache, bridge runtime, compatibility overlay, or transaction upload was added.

## Synthetic automated coverage

Playwright covers the corrected subtitle and v110 runtime, close blockers, account reconciliation, verified close and reopen events, unchanged transaction counts, no full transaction copies in close snapshots, recurring bills and paydays, saved forecast settings, promotional APR debt planning, planning payments without transaction changes, responsive overflow, and the existing import, restore, report, security, and network-boundary suites.

## Release gate

Before merge, require:

1. Local source — desktop;
2. Local source — responsive;
3. Full history privacy and secret scan;
4. JavaScript security analysis;
5. Dependency Review;
6. npm audit.

After merge, require the Cloudflare deployment smoke test and re-fetch the deployed v110 entry, runtime, and stylesheet.
