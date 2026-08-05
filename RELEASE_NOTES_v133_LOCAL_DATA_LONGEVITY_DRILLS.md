# v133 — Local Data Longevity Drills

## Summary

v133 is a maintenance-only release that adds repeatable synthetic longevity drills for long-lived browser-local data. It does not inspect, migrate, repair, clean, roll back, overwrite, reset, or replace real household data. It changes no household-finance capability, financial schema, import, restore, report, workbook, or decision authority.

## Six explicit drill scenarios

The pure drill engine supports exactly six scenarios:

1. **Supported upgrade rehearsal** — canonicalizes and round-trips a synthetic populated vault between release labels while requiring the current portable schema. A schema mismatch remains `manual-review`; no migration is performed.
2. **Corrupted portable package** — supplies a deliberately modified synthetic package to the retained v128 integrity validator. The drill passes only when validation rejects the package before restore or write.
3. **Rollback verification** — requires an explicit synthetic backup and a failed verification result, verifies an exact restoration candidate from the backup, preserves the failed candidate, and proves the backup itself remained unchanged.
4. **Orphan metadata detection** — compares synthetic record identifiers and references, returns sorted orphan identifiers, and records zero deletions and zero rewrites. Orphans require explicit human review.
5. **Stale or unsupported schema** — identifies a non-current synthetic schema and remains closed as `manual-review`. It performs no automatic migration.
6. **Bounded capacity** — measures synthetic transaction count, canonical byte size, and metadata count against stable drill-harness limits. Exceeding a harness limit triggers review, not cleanup, truncation, compaction, reset, or a production-data limit.

## Deterministic synthetic evidence

`createSyntheticLongLivedVault()` produces visibly synthetic, deterministic transaction records across multiple years. Browser-free tests verify:

- identical input produces identical drill reports;
- canonical source data remains unchanged;
- corrupted packages are rejected by SHA-256 integrity validation;
- rollback preserves backup and failed-candidate evidence;
- orphan identifiers are deterministic and sorted;
- stale schemas remain closed;
- both bounded and exceeded capacity cases perform no cleanup.

No real bank export, portable vault, report, close record, import profile, receipt, planning metadata, or household screenshot is committed.

## Runtime loading

The production shells continue loading only `src/release-manifest.js`. v133 publishes a small registry at `window.GringottsV133`, but the drill implementation itself stays outside startup. `src/v133/longevity-drills.js` loads only when `runSyntheticDrill(...)` is explicitly called.

The runtime snapshot declares:

- synthetic-only operation;
- no authoritative-vault read or write;
- no persistence or network implementation;
- no automatic migration, repair, cleanup, or rollback;
- no observer or service worker;
- unchanged primary-destination, Tools-section, and workbook counts.

`window.GringottsV132` remains the retained release-infrastructure alias used to report current manifest identity and loading state. v126 remains the only route coordinator, dispatcher, and live `MutationObserver` owner.

## Preserved data and recovery boundaries

v133 preserves:

- `gringottsBudgetVault.latest` as the only authoritative transaction-copy domain;
- guarded import and separate Full Vault Restore;
- empty-vault protection;
- backup-first broad writes with read-back verification and rollback capability;
- immutable month-close history;
- stable `rescue-v105.html`;
- six primary destinations;
- six Tools sections;
- one v126-owned observer;
- the 43-sheet Vault Workbook cap.

The drill engine contains no browser-storage API, network API, service-worker registration, observer creation, or destructive storage operation.

## Protected limits

The following limits remain unchanged:

- route ready: 750 ms;
- enhancement: 300 ms;
- enhancement passes: 3;
- observer callbacks per route: 12;
- registered actions: 40;
- startup requests: 45;
- startup script bytes: 500,000;
- runtime observers: 1;
- primary destinations: 6;
- workbook sheets: 43.

The drill-harness bounds—5,000 synthetic transactions, 4,000,000 canonical bytes, and 2,000 metadata records—exist only to keep repeatable test inputs bounded. They are not production limits and never authorize automatic deletion, reset, truncation, or compaction.

## Validation requirement

Promotion requires the exact final head to pass:

- strict TypeScript and JavaScript syntax;
- release consistency before browser installation;
- browser-free contracts for all six scenarios;
- proof of no browser-storage, network, observer, service-worker, or destructive implementation;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- repeated-route settlement;
- keyboard, visual, axe, and unchanged Lighthouse budgets;
- public-repository security and full-history privacy checks;
- supply-chain and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Next direction

v134 remains **Reporting & Export Contract Consolidation**. It should reduce duplicated report metadata, labels, filenames, and assembly ownership while preserving every tested output, aggregate-only privacy boundary, cancellation behavior, and the 43-sheet workbook cap.
