# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, completed real household Workflow Review files, Decision Gate records, receipts, close-history records, import profiles, or screenshots containing financial data.

## v133 focus

The v133 matrix verifies:

- one authoritative browser-compatible current-release manifest and versionless production shells;
- package, lockfile, shell, active entry, roadmap, runtime, and shared test expectations remain consistent;
- strict TypeScript contracts for the longevity engine;
- exactly six supported drill scenarios: upgrade, corruption, rollback, orphan, stale-schema, and capacity;
- deterministic synthetic long-lived vault generation and deterministic reports;
- supported-schema rehearsal preserves canonical input without migration;
- corrupted synthetic portable packages fail retained SHA-256 integrity validation;
- rollback uses an explicit populated synthetic backup, reproduces it exactly, preserves the backup, and retains the failed candidate;
- orphan metadata is reported with zero deletion and zero rewrite;
- unsupported schemas remain closed for manual review with no automatic migration;
- capacity limits are harness bounds only and never authorize cleanup or declare a production limit;
- every drill report declares the full no-authority-write, no-migration, no-repair, no-cleanup, no-rollback, no-destructive-action, no-network, and no-persistence safeguards;
- source contracts contain no browser-storage, network, service-worker, observer, or destructive storage operation;
- the compact `window.GringottsV133` registry reports lazy-load state and authoritative-vault read/write status while the drill implementation stays outside startup;
- explicit browser drill execution leaves browser storage unchanged and adds no observer;
- v129 Workflow Review, v130 runtime evidence, v131 Decision Gate, and v132 manifest infrastructure remain behaviorally unchanged;
- one live observer remains owned by v126 and no service worker is registered;
- six primary destinations, six Tools sections, and the 43-sheet workbook cap remain unchanged;
- Lighthouse remains capped at 45 startup requests and 500,000 startup script bytes;
- the authoritative vault, guarded import, separate Full Vault Restore, backup-first broad writes, immutable close history, and stable v105 rescue remain intact.

## Local commands

```bash
npm ci --ignore-scripts
npm run release:check
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

`npm run release:check` prints a JSON consistency report. On failure, it identifies the exact file, field, expected value, and actual value. Do not bypass this gate by adding files to the allowlist unless the file is intentionally release-specific and separately protected.

The browser-free suite directly exercises both bounded and exceeded capacity fixtures, integrity corruption, canonical round-trip behavior, rollback preservation, orphan sorting, stale-schema closure, deterministic output, and source-level local-only restrictions.

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts, relax Lighthouse budgets, weaken release consistency, replace a closed disposition with implicit success, or bypass cross-browser gates to conceal lifecycle, observer, startup-size, metadata-drift, integrity, authority-boundary, or readiness defects. Correct the source contract, loading boundary, fixture, or test synchronization instead.
