# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v125 required gates

- parser and static syntax;
- browser-free close-history model and release-contract tests;
- Chromium, Firefox, and desktop WebKit;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard and visual contracts;
- axe accessibility;
- Lighthouse budgets;
- public-repository security and full-history privacy/secret scanning;
- dependency review and high/critical npm audit;
- supply-chain checks and CodeQL;
- exact-head Cloudflare preview;
- unresolved review-thread check.

## Release assertions

- current version is v125 in both HTML shells, runtime metadata, tests, and package metadata;
- workbook labels, filenames, tests, and generated output agree on 43 sheets;
- inherited exports preserve historical schemas where intended while current-release filenames belong to v125;
- close-trend exports are aggregate-only;
- closed figures use immutable close snapshots;
- open-month estimates are labeled as open and exclude pending rows;
- no financial or close-history write is introduced;
- `gringottsBudgetVault.latest`, empty-vault protection, backup-first broad writes, and stable rescue remain unchanged.
