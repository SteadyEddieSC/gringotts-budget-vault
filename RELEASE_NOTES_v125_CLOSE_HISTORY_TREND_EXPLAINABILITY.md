# v125 — Close History & Trend Explainability

## Release purpose

v125 explains month-to-month household changes from immutable close history and currently posted open-month evidence. It adds no new primary destination and performs no automatic financial action.

## Close-history comparison

Inside **Money → Close & Forecast**, the release compares the selected month with the nearest available prior month. It distinguishes:

- income;
- recurring expenses;
- variable expenses;
- transfer-neutral operating net;
- account and date coverage;
- close revision and reopen history.

Closed-month totals are read from the immutable close snapshot when complete aggregate metrics are available. Later transaction edits do not silently rewrite those historical totals. Open months remain clearly labeled estimates based on posted rows.

## Explainability and confidence

The release ranks the largest aggregate drivers and shows the comparison period, evidence source, coverage, and confidence level. Confidence falls when:

- a month is still open;
- pending or unreviewed rows exist;
- snapshot category detail is incomplete;
- account coverage changes;
- current posted-row coverage differs from the retained close snapshot;
- a comparable prior month is unavailable.

Drivers show aggregate correlation. The application does not claim that one event caused a change unless the evidence can establish that relationship.

## Household workflow integration

Close-history narratives are integrated into:

- Guided Plan;
- Reports;
- Family Meeting preparation;
- local Markdown downloads;
- local diagnostics;
- the Vault Workbook.

The workbook expands from 41 to **43 sheets** with:

- **Close Trends**;
- **Close Drivers**.

The 43-sheet count becomes the workbook cap for the reliability phase. A future sheet requires consolidation or removal of an existing sheet unless a strong household need is documented.

## Safety and privacy

v125:

- excludes pending transactions from final money claims;
- keeps transfers neutral in operating comparisons;
- exports aggregates only;
- does not copy raw transaction rows into metadata;
- does not rewrite transactions or close history;
- does not reopen a month;
- does not change forecasts, budgets, debts, goals, scenarios, or recurring decisions;
- adds no analytics, remote parser, institution credentials, service worker, or second runtime.

`gringottsBudgetVault.latest` remains the authoritative Full Vault Restore destination.

## Strategic shift

The next release is **v126 — Runtime Consolidation & Reliability**. It is a feature freeze focused on explicit route lifecycle, observer reduction, action ownership, idempotent rendering, storage recovery, predictable application states, mobile and keyboard polish, performance budgets, and reduced maintenance cost.
