# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v129 — Household Workflow Evidence Review**

## Live application

https://gringotts-budget-vault.pages.dev/

## v129 evidence review

v129 adds a privacy-safe, manual workflow review under **Tools → Workflow Review** so future work is based on observed household use instead of roadmap momentum.

The release provides:

- strict TypeScript contracts for the workflow inventory, structured observations, summaries, and sanitized export bundles;
- a bounded inventory of ten current workflows across the existing six primary destinations;
- session-only ratings for usage, friction, outcome, observed signal, and recommended disposition;
- optional workflow-only notes with rejection of likely account, card, contact, amount, or transaction identifiers;
- a live evidence summary for high-friction workflows, consolidation candidates, unmet needs, and keep candidates;
- explicit local JSON download and clipboard summary actions;
- browser and Node proof that review activity does not read the vault, write browser storage, transmit data, or persist after reload.

The review is intentionally manual. Gringotts does not infer usage from clicks, route history, reports, transactions, or background activity.

## Preserved architecture

- v126 remains the only route coordinator and specialist action dispatcher.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 adds no second runtime, observer, backend, service worker, analytics endpoint, or browser-local store.
- The application retains six primary destinations and adds only one secondary Tools tab.
- The Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain transaction copies.
- Workflow Review does not inspect vault contents, balances, accounts, merchants, reports, provider credentials, or portable-vault bytes.
- Review state exists only in memory for the current tab and is cleared by reload.
- Review exports contain structured workflow choices and validated workflow-only observations.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v130 — Performance & Maintenance Hardening**. Its recommended starting action is to use the v129 household review to identify the highest-friction and highest-maintenance paths before consolidating historical layers or changing performance budgets. See `ROADMAP.md`.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v129_HOUSEHOLD_WORKFLOW_EVIDENCE_REVIEW.md`, and `V129_SECURITY_REVIEW.md`.
