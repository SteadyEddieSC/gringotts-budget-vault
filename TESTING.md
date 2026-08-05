# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, completed real household Workflow Review files, Decision Gate records, or screenshots containing financial data.

## v131 focus

The v131 matrix verifies:

- strict TypeScript decision states, runtime ownership checks, and privacy-filtered rationale contracts;
- workflow-review imports validate kind, version, inventory version, privacy declarations, known unique workflow IDs, and recomputed summary consistency;
- incomplete workflow evidence remains `evidence-incomplete` even when runtime health passes;
- complete workflow evidence remains `runtime-blocked` when current v130 maintenance evidence fails;
- complete evidence plus healthy runtime reaches `decision-ready` but does not select a disposition automatically;
- `hold` preserves the feature freeze;
- `maintenance-only` requires recorded friction or consolidation evidence plus a workflow-only rationale;
- `candidate-proposal` requires an unmet-need or unclear-outcome signal plus a workflow-only rationale and permits a later proposal only;
- likely amounts, account, card, transaction, merchant, balance, and contact details are rejected from rationale;
- exported decision records contain no financial rows or raw workflow observations and explicitly declare no automatic approval;
- the Dashboard startup path loads v128 plus the small v131 boot without preloading Workflow Review, Decision Gate integration, Decision Gate UI, decision contracts, Diagnostics, or the performance evaluator;
- Workflow Review and Decision Gate integration load only when Tools opens and use the v126 coordinator and dispatcher;
- Decision Gate UI and model load only when Decision Gate opens;
- repeated Decision Gate, Workflow Review, Roadmap, Diagnostics, and primary-route transitions settle without continued route cycles, enhancement passes, or observer callbacks;
- imported evidence and disposition remain memory-only and are cleared by reload;
- Decision Gate does not inspect financial data or write browser storage;
- one live observer remains owned by v126 and no service worker is registered;
- Lighthouse remains capped at 45 startup requests and 500,000 startup script bytes;
- the workbook contains exactly 43 sheets and the application retains six primary destinations;
- v105 rescue, guarded import, separate Full Vault Restore, backup-first broad writes, and immutable close history remain intact.

## Local commands

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts, relax Lighthouse budgets, weaken workflow-review validation, or bypass closed-default states to conceal route-lifecycle, observer, action-ownership, mutation-settlement, startup-size, evidence-quality, or readiness defects. Inspect the exact-head artifact and correct the ownership, idempotence, loading boundary, or decision contract instead.