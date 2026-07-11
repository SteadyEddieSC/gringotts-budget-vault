# v124 — Household Scenario Comparison

## Summary

v124 adds a local-only what-if comparison workspace inside **Money → Close & Forecast**. It compares the current cash-forecast baseline with temporary household assumptions so trade-offs can be discussed before any real plan is changed.

The feature does not apply a scenario, edit a transaction, rewrite a budget, change forecast settings, alter debt or goal records, or modify recurring-cost decisions.

## Scenario assumptions

A scenario can model:

- a starting-cash increase or decrease;
- a monthly income change;
- monthly recurring-cost savings;
- a monthly flexible-spending change;
- one dated purchase or expense;
- an extra monthly debt payment;
- an extra monthly goal contribution;
- a 30-, 60-, or 90-day horizon.

Saved records can also include a name and household discussion notes.

## Comparison results

The side-by-side comparison shows:

- ending cash;
- lowest modeled cash point and date;
- days below the configured minimum buffer;
- negative-balance days;
- monthly flexible spending;
- modeled debt direction;
- aggregate goal timing;
- differences between the baseline and scenario.

Each comparison displays its date range and assumptions.

## Projection limits

The model is deliberately bounded and explainable:

- monthly assumption changes are prorated across modeled days;
- the one-time expense is applied only on the selected date;
- extra debt payments are modeled as principal reduction only;
- interest, fees, changing minimum payments, and full amortization are not modeled;
- goal timing divides remaining active-goal dollars by recorded monthly contributions plus the scenario contribution;
- outputs are household discussion projections, not guarantees or financial advice.

## Storage boundary

The browser-local metadata store is:

`gringottsScenarioComparisons.v1`

It is capped at:

- 24 saved scenarios;
- 80 history entries.

Stored records contain only:

- scenario ID and name;
- assumption values;
- discussion notes;
- created and updated timestamps.

They do not copy transaction rows, merchant names, account labels, balances, credentials, tokens, or vault contents.

Writes are read-back verified. If a write or verification fails, the prior raw metadata value is restored.

## No Apply Scenario path

v124 intentionally provides no **Apply Scenario** action. Preview and Save Assumptions affect only scenario metadata.

The release cannot automatically:

- modify transactions;
- modify budgets;
- save different forecast settings;
- change debt records or record a debt payment;
- change goals or record a contribution;
- change recurring-cost decisions;
- transfer money, cancel a service, or contact an institution or merchant.

## Guided Plan and reporting

Saved scenarios appear in:

- Activity → Guided Household Plan;
- the planning report page;
- Family Meeting preparation;
- Guided Plan Markdown downloads;
- Family Meeting Pack Markdown downloads.

These surfaces show the scenario name, horizon, modeled differences, notes, and a next step to review whether the assumptions are realistic.

## Workbook

The Vault Workbook expands from 39 to **41 sheets**.

New sheets:

- **Scenario Comparisons**;
- **Scenario Assumptions**.

The existing receipt, lineage, account-cleanup, recurring-decision, and household-planning sheets remain unchanged.

## Roadmap

The detailed horizon now covers:

- v124 — Household Scenario Comparison;
- v125 — Close History & Trend Explainability;
- v126 — Data Portability & Long-Term Maintenance;
- v127 — Family Review Cadence & Governance Packs;
- v128 — Household Data Quality & Stewardship Review;
- v129 — Decision Outcome Review & Forecast Calibration;
- v130 — Household Resilience & Contingency Planning.

v125 is the strongest next commitment. v126–v130 remain directional.

## Architecture preserved

- Six primary destinations remain unchanged.
- Scenario Comparison is inside Money → Close & Forecast.
- v124 code and CSS load only when Money, Reports, Activity, or Tools opens.
- v123 recurring features are reused without activating the v123 release observer.
- v122 account cleanup, v121 receipt lineage, guarded import, and separate Full Vault Restore remain available.
- `gringottsBudgetVault.latest` remains the Full Restore destination.
- `rescue-v105.html` remains unchanged.
- No service worker, analytics, remote parser, institution connection, or second runtime is added.

## Validation scope

The v124 release gate includes:

- pure scenario-model tests;
- assumption sanitization and bounded-store tests;
- cash, pressure-day, debt-direction, and goal-timing comparisons;
- byte-for-byte noninterference with the vault and existing planning stores;
- Guided Plan, report, Markdown, and 41-sheet workbook integration;
- Chromium, Firefox, and WebKit desktop;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates;
- full-history privacy scan, Gitleaks, dependency review, npm audit, supply-chain checks, and CodeQL;
- exact-head Cloudflare preview and post-merge production smoke;
- unresolved-review-thread verification.
