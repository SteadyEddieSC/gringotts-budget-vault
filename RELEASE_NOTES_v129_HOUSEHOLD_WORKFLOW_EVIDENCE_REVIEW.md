# v129 — Household Workflow Evidence Review

## Summary

v129 adds a privacy-safe, manual review workspace so Gringotts can evaluate its existing household workflows before adding, removing, or consolidating product scope. The release records deliberate structured observations only; it does not infer usage from application activity.

## Workflow Review

A new **Tools → Workflow Review** secondary tab inventories ten existing workflows across the six current primary destinations.

Each workflow can be reviewed for:

- usage frequency;
- friction level;
- outcome quality;
- observed signal;
- recommended disposition;
- an optional short workflow-only observation.

The summary identifies:

- high-friction workflows;
- consolidation candidates;
- unmet needs or unclear outcomes;
- evidence-supported keep candidates;
- the next recommended product action.

## Privacy model

Workflow Review is deliberately not analytics.

It does not:

- log clicks, routes, timings, or background activity;
- inspect the vault, transactions, balances, accounts, merchants, reports, credentials, or portable-vault bytes;
- write localStorage, sessionStorage, IndexedDB, cookies, or another persistent store;
- transmit evidence to Gringotts, Cloudflare, or another service;
- retain review state after reload.

Optional observations are limited to 240 characters and reject likely amounts, account details, card details, transaction identifiers, and contact information.

## Local review outputs

After explicit user action, the workspace can:

- download a versioned local JSON review bundle;
- copy a short review summary to the clipboard;
- clear the current in-session review.

The JSON bundle contains structured workflow choices and validated workflow-only observations. It declares that the review is manual, contains no financial data, uses no persistent store, and performs no remote transmission.

## Architecture and performance

- v126 remains the only route coordinator and specialist action dispatcher.
- v127 remains the retained UX and accessibility policy.
- v128 remains the typed portable-vault foundation.
- v129 adds no second runtime or `MutationObserver`.
- v106 and v107 styles are consolidated into one asset so importing the v128 shell from the v129 bootstrap does not increase the initial request ceiling.
- Six primary destinations and the 43-sheet workbook cap remain unchanged.

## Deliberate limits

v129 does not:

- add a household-finance capability;
- automatically recommend deleting a workflow;
- perform consolidation or removal;
- create analytics or remote support telemetry;
- add encrypted file UI or a cloud provider adapter;
- change import, restore, month-close, report, export, or recovery behavior.

## Recommended next action

Complete the structured review across all ten workflows using real household observations. Use the resulting local bundle to select the highest-friction or highest-maintenance path for **v130 — Performance & Maintenance Hardening**. An incomplete review should not be treated as evidence to remove a workflow.

## Validation

Promotion requires the exact final head to pass:

- strict TypeScript and browser-free workflow-evidence contracts;
- no-persistence, no-network-write, private-note rejection, sanitized-export, reload-clearing, and mobile browser tests;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates with the existing request ceiling;
- public-repository privacy/security, dependency review, npm audit, supply-chain checks, and CodeQL;
- exact-head Cloudflare preview and unresolved-thread verification.
