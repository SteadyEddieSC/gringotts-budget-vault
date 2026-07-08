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
- multiple accounts and owners.

Each Playwright test receives fresh browser storage. It cannot see or alter the user's normal browser profile.

## Local setup

Requirements:

- Node.js 20 or newer;
- Python 3 for the local static server.

Install the locked dependencies and browsers:

```bash
npm ci
npx playwright install chromium firefox webkit
```

Run the local-source suite:

```bash
npm run test:local
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

## What is tested

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

The local GitHub Actions suite runs:

- desktop Chromium;
- desktop Firefox;
- desktop WebKit;
- iPad emulation;
- Android phone emulation;
- iPhone/WebKit emulation.

## GitHub Actions

`.github/workflows/playwright.yml` runs the local-source suite on:

- pushes to `main`;
- pushes to the testing-infrastructure branch;
- pull requests targeting `main`;
- manual workflow dispatch.

Desktop and responsive projects run as separate jobs. Failure artifacts retain screenshots, video, traces, test results, and the HTML report for 14 days.

## Live Cloudflare smoke test

After a successful local suite on `main`, a Chromium smoke test checks the deployed Cloudflare Pages site. It retries for up to approximately three minutes to allow deployment propagation.

The live test verifies:

- the app boots without a module error;
- v108 is served;
- all six primary destinations open.

The live test also uses synthetic localStorage inside an isolated GitHub runner browser.

## Release gate

Future releases should not be described as browser-verified until:

1. the local Playwright jobs pass;
2. the Cloudflare smoke job passes after the production push;
3. any intentionally unautomated manual checks are clearly listed.
