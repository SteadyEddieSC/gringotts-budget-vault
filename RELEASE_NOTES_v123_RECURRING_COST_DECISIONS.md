# v123 — Recurring Cost Decisions & Subscription Review

## Summary

v123 replaces the passive recurring-charge watch with an evidence-backed household decision and follow-up workflow inside **Money → Bills, Recurring & Budgets**.

The release helps the household decide whether to Keep, Cancel, Renegotiate, Investigate, or mark a recurring cost Completed. It records ownership, target dates, follow-up status, and notes. It does not contact a merchant, cancel a service, change a payment, send an email, place a phone call, or connect to an external financial account.

## Evidence-backed recurring costs

The v123 detector groups posted expense transactions by normalized merchant and account. It excludes:

- pending transactions;
- income and transfer-like rows;
- single unsupported one-time purchases;
- merchants explicitly excluded by the existing recurring review preference.

Candidates normally require at least two posted charges across multiple months. A previously confirmed recurring merchant may qualify with same-month cadence evidence.

For each candidate, v123 explains:

- posted occurrence count and month coverage;
- first and latest retained charge dates;
- masked account and detected owner;
- weekly, biweekly, monthly, quarterly, semiannual, annual, irregular, or unknown cadence;
- typical day gap;
- stable, variable, or volatile amount pattern;
- latest and preceding charges;
- material latest-charge increases;
- a simple cadence-based annual footprint;
- a simple annualized latest-price increase.

Annual figures are discussion estimates, not guaranteed future spending or savings.

## Decisions and follow-up

Each candidate can be assigned:

- **Keep**;
- **Cancel outside Gringotts**;
- **Renegotiate outside Gringotts**;
- **Investigate**;
- **Completed**.

Follow-up metadata includes:

- Not started, Planned, Waiting / follow-up, or Done status;
- household owner;
- target date;
- notes.

Open Cancel, Renegotiate, and Investigate decisions appear in the Guided Household Plan. Completed and Keep decisions do not create open plan actions.

## Storage boundary

The browser-local store is:

`gringottsRecurringDecisions.v1`

It is capped at:

- 120 current decision records;
- 240 history entries.

Stored records contain candidate IDs, decision, status, owner, target date, notes, and timestamps. They do not copy merchant names, account labels, amounts, transaction rows, balances, credentials, or external identifiers.

Writes are read-back verified. If a write or verification fails, the prior raw metadata value is restored.

When current transaction evidence no longer produces a candidate, the decision becomes dormant. It is never silently applied to another merchant or account.

## Guided Plan, reports, and meeting preparation

v123 adds recurring follow-up to:

- Activity → Guided Household Plan;
- the Guided Plan report page;
- the Family Meeting report page;
- Guided Plan Markdown downloads;
- Family Meeting Pack Markdown downloads.

Every action includes evidence, owner, target date, a practical next step, and clear external-action boundaries.

## Workbook

The Vault Workbook expands from 37 to **39 sheets**.

New sheets:

- **Recurring Decisions**;
- **Recurring Decision History**.

The existing Receipt Integrity, Batch Lineage, Account Inventory, and Account Cleanup Plan sheets remain.

## Roadmap

The detailed horizon now covers:

- v123 — Recurring Cost Decisions & Subscription Review;
- v124 — Household Scenario Comparison;
- v125 — Close History & Trend Explainability;
- v126 — Data Portability & Long-Term Maintenance;
- v127 — Family Review Cadence & Governance Packs;
- v128 — Household Data Quality & Stewardship Review;
- v129 — Decision Outcome Review & Forecast Calibration.

v124 is the strongest next commitment. v125–v129 remain directional.

## Preserved architecture

- Six primary destinations remain unchanged.
- v123 adds no new top-level navigation destination.
- v123 route code and CSS load only when Money, Reports, Activity, or Tools opens.
- v122 account cleanup remains available inside Tools without activating the v122 presentation observer.
- v121 receipt integrity and batch lineage remain available.
- v115 remains the authoritative parser, guarded writer, and receipt store.
- Full Vault Restore remains a separate task targeting `gringottsBudgetVault.latest`.
- `rescue-v105.html` remains unchanged.
- No service worker, analytics endpoint, remote parser, or institution connection is added.

## Safety boundary

v123 cannot automatically:

- cancel or pause a subscription;
- contact or email a merchant;
- change a payment method or amount;
- connect to an institution;
- modify transaction rows;
- rewrite account labels;
- alter rules, budgets, goals, forecast settings, or debt records;
- claim that an annual estimate is guaranteed savings.

## Validation scope

The release gate includes:

- pure recurring-model tests;
- pending, income, transfer, and one-time exclusion tests;
- cadence, amount stability, price-change, annualization, and account-separation tests;
- bounded store, history, dormant decision, and rollback tests;
- vault byte-for-byte noninterference tests;
- Guided Plan, report, Markdown, and 39-sheet workbook integration;
- Chromium, Firefox, and WebKit desktop;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates;
- privacy, Gitleaks, dependency, supply-chain, and CodeQL checks;
- exact-head Cloudflare preview and production smoke;
- unresolved-review-thread verification.
