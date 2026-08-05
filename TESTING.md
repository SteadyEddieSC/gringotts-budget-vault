# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, completed real household Workflow Review files, Decision Gate records, or screenshots containing financial data.

## v132 focus

The v132 matrix verifies:

- one authoritative browser-compatible current-release manifest;
- package, lockfile, shell, active boot, roadmap, runtime, and shared test expectations remain consistent;
- HTML shell titles and loading copy contain no hard-coded current version;
- the active boot applies the final document title and visible version from the manifest;
- the parser stage reports exact release-consistency mismatches before browser installation;
- protected tests use shared current-release helpers instead of scattered literal assertions;
- v129 Workflow Review, v130 runtime evidence, and v131 Decision Gate remain lazy, local-only, non-persistent, and behaviorally unchanged;
- repeated route transitions preserve manifest metadata after retained specialist integrations run;
- one live observer remains owned by v126 and no service worker is registered;
- six primary destinations and the 43-sheet workbook cap remain unchanged;
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

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts, relax Lighthouse budgets, weaken release consistency, or bypass cross-browser gates to conceal lifecycle, observer, action-ownership, mutation-settlement, startup-size, metadata-drift, evidence-quality, or readiness defects. Correct the source of truth, ownership, idempotence, loading boundary, or test synchronization instead.