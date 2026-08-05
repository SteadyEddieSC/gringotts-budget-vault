# v131 — Observed Needs Decision Gate

## Summary

v131 converts the feature freeze into an explicit evidence gate. It does not add household-finance capability. Instead, it requires a completed privacy-filtered v129 Household Workflow Review and healthy v130 runtime evidence before a human may record even a limited product-scope disposition.

## Closed by default

The gate starts in `evidence-incomplete`. It cannot infer household use from routes, clicks, transactions, reports, accounts, balances, merchants, or telemetry.

The state sequence is bounded:

- `evidence-incomplete` when fewer than all ten workflow observations are complete;
- `runtime-blocked` when workflow evidence is complete but current runtime evidence fails;
- `decision-ready` when both evidence sources pass, with no disposition selected automatically;
- `hold` when a person explicitly preserves the feature freeze;
- `maintenance-only` when recorded friction or consolidation evidence supports scoped simplification or repair;
- `candidate-proposal` when an unmet-need or unclear-outcome signal supports writing one narrow proposal for later review.

`candidate-proposal` does not approve, implement, schedule, or fund a feature.

## Workflow evidence validation

**Tools → Decision Gate** accepts only a user-selected local JSON file. It validates:

- v129 workflow-review kind and version;
- workflow inventory version;
- manual-review, no-telemetry, no-financial-data, no-persistence, and no-remote-transmission declarations;
- known unique workflow IDs;
- structured observation values and privacy-filtered notes;
- summary counts and evidence groups recomputed from the observations.

A mismatched summary, duplicate workflow, unknown workflow, weakened privacy declaration, or unsupported value is rejected.

## Runtime evidence

The gate reads current maintenance evidence only through `window.GringottsV130.snapshot()` and the published v130 evaluator. It requires:

- bounded memory-only runtime evidence;
- no financial-data reading, persistent store, network implementation, extra observer, or service worker;
- one v126-owned observer;
- six primary destinations;
- the 43-sheet workbook cap;
- coordinator and dispatcher ownership;
- a passing current performance evaluation.

No protected v130 budget is relaxed.

## Explicit local decision record

A person may download or copy a decision record only after selecting an eligible disposition. The record contains:

- the explicit gate state and workflow-only rationale;
- aggregate workflow identifiers by evidence category;
- review and runtime pass metadata;
- declarations that the action was manual and included no financial data, persistence, telemetry, remote transmission, or automatic approval.

It does not contain transaction rows, balances, accounts, merchants, credentials, raw workflow observations, or portable-vault bytes.

## Startup and runtime ownership

The production shells load `src/boot-v131.js?v=131decision2`.

The active entry statically imports v128 only. It retains v130 runtime evidence without loading the v130 boot wrapper. Specialist code remains route-lazy:

- v129 Workflow Review integration loads after Tools opens;
- v131 Decision Gate integration loads after Tools opens;
- v131 Decision Gate UI and contracts load only after Decision Gate opens;
- v130 Diagnostics and the performance evaluator remain lazy.

v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.

## Preserved boundaries

v131 adds no:

- transaction, account, budget, forecasting, debt, import, recurring-cost, calendar, report, workbook, or cloud capability;
- persistent store or migration;
- remote logging, telemetry, analytics, beacon, provider adapter, Pages Function, Worker, backend, or service worker;
- primary destination, report sheet, financial export schema, or automatic financial action;
- second runtime or additional observer.

`gringottsBudgetVault.latest`, guarded import, separate Full Vault Restore, empty-vault protection, backup-first broad writes, immutable close history, stable v105 rescue, six primary destinations, and the 43-sheet workbook cap remain unchanged.

## Validation requirement

Promotion requires the exact final head to pass strict TypeScript, browser-free decision and privacy contracts, Chromium/Firefox/WebKit desktop, Android Chromium, iPad/iPhone WebKit, repeated-route settlement, keyboard, visual, axe, Lighthouse, public-repository security, supply-chain, CodeQL, exact-head Cloudflare preview, and unresolved-thread verification.

## Next direction

v132 remains **Release & Test Infrastructure Simplification**. Its purpose is to reduce duplicated release metadata and test ownership while preserving every protected gate. The feature freeze remains active unless a later, separately reviewed proposal is justified and approved.