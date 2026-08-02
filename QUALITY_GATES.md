# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v126 required gates

- parser and static syntax for inherited and v126 runtime modules;
- browser-free coordinator, dispatcher, storage-inventory, roadmap, and release-contract tests;
- Chromium, Firefox, and desktop WebKit;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard and visual contracts;
- axe accessibility for runtime diagnostics and the v126 roadmap;
- Lighthouse budgets;
- public-repository security and full-history privacy/secret scanning;
- dependency review and high/critical npm audit;
- supply-chain checks and CodeQL;
- exact-head Cloudflare preview;
- unresolved review-thread check.

## Release assertions

- current version is v126 in both HTML shells, runtime metadata, tests, and package metadata;
- one coordinator owns rendered-route enhancement readiness;
- one live `MutationObserver` is reported by the coordinator;
- one dispatcher owns specialist capture actions and current-release downloads;
- inherited release observers are suppressed while their tested capabilities remain available;
- route enhancement states and failures are inspectable and retryable without clearing local storage;
- the storage inventory contains the authoritative vault and bounded metadata/history domains;
- only `gringottsBudgetVault.latest` may contain transaction copies;
- workbook labels, filenames, tests, and generated output remain capped at 43 sheets;
- inherited exports preserve historical schemas where intended while current-release filenames belong to v126;
- no second transaction runtime, new financial feature, remote endpoint, service worker, or automatic financial action is introduced;
- empty-vault protection, backup-first broad writes, immutable close history, and stable v105 rescue remain unchanged.
