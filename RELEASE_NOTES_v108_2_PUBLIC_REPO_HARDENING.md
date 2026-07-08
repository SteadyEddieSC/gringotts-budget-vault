# Gringotts Budget Vault v108.2 — Public Repository Hardening

## Release purpose

The repository is now public. v108.2 hardens the repository, documentation, automation, and release gates for public development while preserving the v108 application runtime and all browser-local data boundaries.

## Public repository status

- Repository visibility is public.
- The application source is public.
- Real household transaction data remains excluded from the repository.
- Automated tests use only fictional browser-local data.
- No application runtime or localStorage schema change is included in v108.2.

## README and security documentation

The README now:

- describes the repository as public and local-first;
- links to the live Cloudflare Pages application;
- documents prohibited financial-data files;
- summarizes Playwright and security automation;
- explains local test commands and deployment configuration;
- includes an unofficial-project affiliation disclaimer.

`SECURITY.md` now defines:

- private vulnerability-reporting expectations;
- information that must never appear in public issues;
- the synthetic-data boundary for reproductions;
- incident steps when sensitive information is accidentally committed;
- local-first application security invariants.

## Full-history privacy scanner

`scripts/privacy-history-scan.mjs` checks every reachable historical path and text blob.

It blocks historical paths matching:

- Navy Federal or other transaction-pack JSON exports;
- vault backup and generated-export JSON files;
- transaction and ledger CSV exports;
- QFX, OFX, QBO, XLSX, XLS, DOCX, and PDF files.

It also checks historical text for high-confidence patterns representing:

- SSN-formatted values;
- labeled routing or ABA numbers;
- labeled account numbers;
- labeled full payment-card numbers.

The committed fictional Playwright vault is explicitly allowed.

## Gitleaks

The new public-repository security workflow checks complete Git history for hardcoded credentials, API keys, tokens, passwords, and similar secrets using Gitleaks v3.

The repository belongs to a personal GitHub account, so the action does not require a Gitleaks organization license key.

## CodeQL

CodeQL v4 now analyzes JavaScript and TypeScript source using the extended security query set.

Findings are published to GitHub's Security area and run on:

- pushes to `main`;
- pull requests targeting `main`;
- manual dispatch;
- a weekly schedule.

## Dependabot

Dependabot now checks monthly for:

- Playwright/npm dependency updates;
- GitHub Actions updates.

Updates are grouped to reduce pull-request noise.

## GitHub Actions modernization

The Playwright workflow now uses:

- `actions/checkout@v6`;
- `actions/setup-node@v6`;
- Node.js 24;
- `actions/upload-artifact@v7`.

The retired v108.1 development-branch push trigger was removed. Pull requests continue to run the complete local browser suite.

## Release gates

Future releases should not be described as fully verified until:

1. Playwright desktop and responsive jobs pass.
2. Full-history privacy scanning passes.
3. Gitleaks passes.
4. CodeQL has no unresolved release-blocking finding.
5. The Cloudflare post-deployment smoke test passes.
6. Remaining manual tests are explicitly listed.

## Preserved application boundaries

- local-only transaction processing;
- no transaction upload;
- no service worker or offline cache;
- no automatic empty-vault overwrite;
- best-populated readable vault selection;
- backup-first broad transaction changes;
- verified restore and review writes;
- synthetic automated testing only.

## Validation plan

The v108.2 pull request must run:

- desktop Playwright projects;
- tablet and phone Playwright projects;
- full-history privacy scanning;
- Gitleaks;
- CodeQL.

The branch should not be merged until all available checks complete successfully or a documented false positive is resolved safely.
