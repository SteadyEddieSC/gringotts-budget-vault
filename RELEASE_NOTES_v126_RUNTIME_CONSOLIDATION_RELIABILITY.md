# v126 — Runtime Consolidation & Reliability

## Summary

v126 freezes feature growth and consolidates the live lifecycle behind the existing household-budgeting application. It replaces overlapping release observers, implicit route timing, and distributed specialist action ownership with one inspectable coordinator and one action dispatcher.

## Runtime ownership

- one route-enhancement coordinator;
- one live `MutationObserver` owned by that coordinator;
- one priority-ordered capture dispatcher for specialist `click`, `change`, and `input` actions;
- one consolidated release registry for inherited v118–v125 enhancers;
- deterministic rendering, enhancing, ready, and failed states;
- bounded stabilization passes and observer/readiness metrics;
- explicit route retry and stable v105 rescue.

Historical release modules still provide their tested capabilities. Their observer construction is suppressed during activation, and their global specialist listeners are adapted into the v126 dispatcher.

## Storage and recovery

v126 inventories 18 browser-local domains and their recovery boundaries.

- `gringottsBudgetVault.latest` remains authoritative and is the only domain allowed to contain transaction copies.
- month-close history remains immutable evidence.
- bounded metadata stores retain their existing sanitizer, cap, rollback, and read-back behavior.
- Full Vault Restore remains separate, targets the authoritative vault key, and blocks empty transaction arrays.
- no all-storage reset or automatic migration is introduced.

## Preserved product surface

The release preserves close-history explainability, scenarios, recurring decisions, cleanup planning, receipt integrity, import/restore, reports, Guided Plan, and current exports.

The Vault Workbook remains capped at 43 sheets. No sheet or primary destination was added.

## Safety boundaries

v126 introduces no:

- new household-finance feature;
- second transaction runtime;
- transaction or close-history rewrite;
- automatic plan, payment, transfer, debt, goal, scenario, recurring-decision, account, merchant, or institution action;
- analytics endpoint, remote parser, or service worker;
- new metadata store.

## Validation

The release requires exact-head parser/static, browser-free contracts, full desktop and responsive Playwright coverage, keyboard/visual/axe/Lighthouse, privacy/security, dependency and supply-chain checks, CodeQL, Cloudflare preview, and unresolved-thread verification before merge.
