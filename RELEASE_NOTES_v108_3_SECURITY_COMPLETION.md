# Gringotts Budget Vault v108.3 — Security Completion

## Release purpose

v108.3 completes the free repository, browser, and software-supply-chain protections that are useful for the current public, static, local-first application.

The visible application remains v108 Goals & Vault Health. This release does not change transaction storage, goal storage, restore behavior, reporting logic, or the user interface.

## Dependency Review

Pull requests now run GitHub's Dependency Review action.

The merge gate fails when a proposed dependency change introduces a known High or Critical vulnerability. License changes are also evaluated and shown in the check result.

## npm audit

The locked npm dependency graph is installed with lifecycle scripts disabled and checked with:

```bash
npm audit --audit-level=high
```

The job runs on pull requests, pushes to `main`, and manual dispatch.

## OpenSSF Scorecard

OpenSSF Scorecard now evaluates public repository supply-chain practices after changes reach `main` and on a weekly schedule.

Results are:

- published through Scorecard's public result service;
- uploaded to GitHub code scanning as SARIF;
- retained as a short-lived five-day workflow artifact.

Scorecard is used as a continuing improvement signal rather than a pull-request merge gate.

## Full GitHub Action SHA pinning

Every external GitHub Action is now pinned to a complete 40-character commit SHA, including:

- checkout;
- Node setup;
- artifact upload;
- Dependency Review;
- CodeQL;
- Gitleaks;
- OpenSSF Scorecard.

Readable version comments remain beside each SHA. Dependabot can propose controlled SHA updates.

## Workflow hardening

- Checkout credentials are not persisted.
- Routine workflows retain read-only repository-content permission.
- Pull-request workflows do not receive repository-content write permission.
- Gitleaks does not create public comments or upload possible secret-result artifacts.
- Fork contributions do not require repository secrets.

## Repository security drift tests

Playwright now includes repository-level tests that fail when:

- an Action is not pinned to a full SHA;
- `pull_request_target` is introduced;
- a workflow requests `write-all` or repository-content write permission;
- a required security file is removed;
- Cloudflare security headers are weakened.

These tests run in every desktop, tablet, and phone Playwright project.

## Cloudflare browser security headers

The `_headers` policy now adds:

- Content Security Policy;
- clickjacking protection through `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
- worker blocking through `worker-src 'none'`;
- same-origin script, connection, font, and resource restrictions;
- object, frame, and media blocking;
- MIME-sniffing protection;
- no-referrer policy;
- expanded Permissions Policy;
- Cross-Origin-Opener-Policy;
- Cross-Origin-Resource-Policy;
- automatic insecure-request upgrading.

Inline style support remains permitted because the application uses controlled inline progress-bar widths. JavaScript remains restricted to same-origin module files.

## Live deployment validation

The post-deployment Cloudflare smoke test now verifies the actual response headers in addition to:

- application startup;
- v108 runtime availability;
- absence of a boot error;
- all six primary destinations.

This detects a missing, malformed, or unapplied `_headers` deployment.

## GitHub settings checklist

`GITHUB_SETTINGS_CHECKLIST.md` permanently records the recommended manual settings for:

- a protected `main` ruleset;
- exact required check names;
- squash-only merging;
- GitHub Actions restrictions;
- fork workflow approval;
- Code security and analysis toggles;
- private vulnerability reporting;
- security notifications;
- secrets, deploy keys, webhooks, and collaborators;
- account two-factor authentication and credential review;
- the optional license decision.

## Required pre-merge checks

The recommended protected-branch checks are:

1. `Local source — desktop`
2. `Local source — responsive`
3. `Full history privacy and secret scan`
4. `JavaScript security analysis`
5. `Dependency Review`
6. `npm audit`

Do not require `Cloudflare deployment smoke` before merge because it runs after production changes. Do not require Scorecard before merge because it runs on `main` and on a schedule.

## Preserved privacy and architecture boundaries

- synthetic test data only;
- no transaction upload;
- no service worker or offline cache;
- no automatic empty-vault overwrite;
- best-populated readable vault selection;
- backup-first broad transaction changes;
- explicit restore acknowledgement;
- verified transaction writes;
- no new repository secret.

## Validation plan

Before merge:

- Playwright desktop must pass;
- Playwright responsive must pass;
- repository security-drift tests must pass;
- full-history privacy and Gitleaks must pass;
- Dependency Review must pass;
- `npm audit` must pass;
- CodeQL must pass.

After merge:

- Cloudflare deployment smoke must pass with the new security headers;
- OpenSSF Scorecard should complete and publish its initial result.
