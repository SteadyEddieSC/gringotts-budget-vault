# Gringotts Budget Vault Testing

## Browser regression testing

Gringotts uses Playwright to test the browser application against a synthetic vault. Automated tests never use or upload a real household transaction file.

## Synthetic data boundary

`tests/fixtures/synthetic-vault.json` contains invented transactions across May, June, and July 2026. Tests place this fixture in an isolated browser context under `gringottsBudgetVault.latest` before the app starts.

The fixture includes:

- income;
- household expenses;
- a transfer;
- a pending transaction;
- an Other/unreviewed transaction;
- a source-review-required transaction;
- recurring charges with an amount change;
- multiple fictional accounts and owners.

Each Playwright test receives fresh browser storage. It cannot see or alter the user's normal browser profile.

## Local setup

Requirements:

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history available when running the privacy-history scan.

Install the locked dependencies and browsers:

```bash
npm ci
npx playwright install chromium firefox webkit
```

Run the local-source suite:

```bash
npm run test:local
```

Run the full-history privacy check:

```bash
npm run privacy:history
```

Run the npm vulnerability gate:

```bash
npm audit --audit-level=high
```

Run with a visible browser:

```bash
npm run test:headed
```

Open Playwright's interactive UI:

```bash
npm run test:ui
```

Open the last HTML report:

```bash
npm run report
```

## What Playwright tests

### Boot and architecture

- application boots without module or JavaScript errors;
- version and six primary destinations are present;
- no service worker is registered;
- normal navigation makes no network write requests.

### Navigation and responsive layout

- Dashboard, Money, Calendar, Reports, Activity, and Tools open;
- mobile Menu navigation works;
- each tested viewport avoids full-page horizontal overflow;
- the desktop month toolbar remains compact;
- Previous, Next, native month value changes, and Latest work.

### Review Queue

- Category, Owner, and Account are native select controls;
- editing begins locked;
- Enable Safe Editing initiates a JSON backup download;
- a reviewed transaction is written and verified in the synthetic vault.

### Goals and Vault Health

- a synthetic goal can be created;
- contributions update funded progress;
- a health snapshot is saved only after the explicit action.

### Reports and safety

- the v108 Vault Workbook download starts;
- the annual tracker file input is present;
- an empty JSON restore is blocked;
- the populated synthetic vault remains intact;
- Backup is available under Tools and absent from the header.

### Repository security drift

`tests/repository-security.spec.js` fails when:

- an external GitHub Action is not pinned to a full 40-character commit SHA;
- a workflow uses `pull_request_target`;
- a workflow requests `write-all` or repository-content write permission;
- the CodeQL workflow does not use read-only defaults and narrowly scoped security-event upload permission;
- required public security files disappear;
- the Cloudflare Content Security Policy or local-first browser headers are weakened.

## Browser projects

The GitHub Actions suite runs:

- desktop Chromium;
- desktop Firefox;
- desktop WebKit;
- iPad emulation;
- Android phone emulation;
- iPhone/WebKit emulation.

## Public-repository security tests

### Privacy-history scanner

`scripts/privacy-history-scan.mjs` scans all reachable Git history for:

- bank and transaction JSON export filenames;
- backup and generated-vault JSON filenames;
- transaction or ledger CSV files;
- QFX, OFX, QBO, XLSX, XLS, DOCX, and PDF files;
- SSN-formatted values;
- labeled routing, ABA, account, and full payment-card numbers.

The committed synthetic fixture is the only allowed vault-shaped data file.

### Gitleaks

The security workflow checks full repository history for hardcoded credentials, API keys, tokens, and similar secrets. Public comments and secret-result artifacts are disabled.

### Dependency Review

Pull requests are checked for newly introduced vulnerable dependencies. The check fails when a new dependency has a High or Critical known vulnerability.

### npm audit

The locked npm dependency graph is installed without lifecycle scripts and fails CI on High or Critical audit findings.

### CodeQL

CodeQL performs extended JavaScript security analysis and publishes findings to GitHub's Security area. The workflow uses read-only defaults and grants `security-events: write` only to the analysis job that uploads results.

### OpenSSF Scorecard

OpenSSF Scorecard evaluates repository supply-chain practices weekly and after changes reach `main`. Results are published to GitHub code scanning and retained as a short-lived SARIF artifact.

### Dependabot

Dependabot checks npm and GitHub Actions dependencies monthly and opens grouped update pull requests.

### Action pinning

Every external GitHub Action is referenced by a full commit SHA. Version comments remain next to the SHA for maintainability, and Dependabot can propose controlled updates.

## GitHub Actions

`.github/workflows/playwright.yml` runs browser tests on:

- pushes to `main`;
- pull requests targeting `main`;
- manual workflow dispatch.

`.github/workflows/security.yml` runs full-history privacy and secret scanning on:

- pushes to `main`;
- pull requests targeting `main`;
- manual workflow dispatch;
- a weekly schedule.

`.github/workflows/supply-chain.yml` runs:

- Dependency Review on pull requests;
- `npm audit` on pull requests and `main`;
- manual workflow dispatch.

`.github/workflows/codeql.yml` runs JavaScript security analysis on:

- pushes to `main`;
- pull requests targeting `main`;
- manual workflow dispatch;
- a weekly schedule.

`.github/workflows/scorecard.yml` runs OpenSSF Scorecard on:

- pushes to `main`;
- manual workflow dispatch;
- a weekly schedule.

Desktop and responsive Playwright projects run as separate jobs. Failure artifacts retain screenshots, video, traces, test results, and the HTML report for 14 days.

## Live Cloudflare smoke test

After a successful local Playwright suite on `main`, a Chromium smoke test checks the deployed Cloudflare Pages site. It retries for up to approximately three minutes to allow deployment propagation.

The live test verifies:

- the app boots without a module error;
- v108 is served;
- all six primary destinations open;
- Content Security Policy is active;
- clickjacking protection is active;
- MIME sniffing is disabled;
- referrer leakage is disabled;
- cross-origin opener and resource policies are active.

The live test also uses synthetic localStorage inside an isolated GitHub runner browser.

## Release gate

Future releases should not be described as fully verified until:

1. local Playwright desktop and responsive jobs pass;
2. full-history privacy and Gitleaks jobs pass;
3. Dependency Review and `npm audit` pass;
4. CodeQL completes without an unresolved release-blocking finding;
5. repository security-drift tests pass;
6. the Cloudflare smoke job passes after production deployment;
7. any intentionally unautomated manual checks are clearly listed.

OpenSSF Scorecard is monitored as a continuing improvement signal. It is not a pull-request merge gate because it runs after changes reach `main` and on a schedule.
