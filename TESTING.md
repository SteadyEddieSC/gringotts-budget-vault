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

The security workflow checks the full repository history for hardcoded credentials, API keys, tokens, and similar secrets.

### CodeQL

CodeQL performs JavaScript security analysis and publishes findings to GitHub's Security area.

### Dependabot

Dependabot checks npm and GitHub Actions dependencies monthly and opens grouped update pull requests.

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

`.github/workflows/codeql.yml` runs JavaScript security analysis on:

- pushes to `main`;
- pull requests targeting `main`;
- manual workflow dispatch;
- a weekly schedule.

Desktop and responsive Playwright projects run as separate jobs. Failure artifacts retain screenshots, video, traces, test results, and the HTML report for 14 days.

## Live Cloudflare smoke test

After a successful local Playwright suite on `main`, a Chromium smoke test checks the deployed Cloudflare Pages site. It retries for up to approximately three minutes to allow deployment propagation.

The live test verifies:

- the app boots without a module error;
- v108 is served;
- all six primary destinations open.

The live test also uses synthetic localStorage inside an isolated GitHub runner browser.

## Release gate

Future releases should not be described as fully verified until:

1. local Playwright desktop and responsive jobs pass;
2. full-history privacy and Gitleaks jobs pass;
3. CodeQL completes without an unresolved release-blocking finding;
4. the Cloudflare smoke job passes after production deployment;
5. any intentionally unautomated manual checks are clearly listed.
