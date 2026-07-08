# Gringotts Budget Vault v108.1 — Playwright Testing Infrastructure

## Release purpose

v108.1 adds repeatable browser testing before the next feature release. The app runtime remains v108; this release adds repository quality infrastructure and does not change browser-local household data.

## Repository visibility and cost

The repository was confirmed private during setup. Playwright itself is free and open source. GitHub Actions can run in a private repository using the account's included monthly Actions minutes.

Making the repository public later would make standard GitHub-hosted Actions usage free and would not expose real financial data because:

- real vault exports are excluded by `.gitignore`;
- automated tests use only a synthetic fixture;
- no real backup or transaction file is committed by this release.

Repository visibility must be changed through GitHub repository settings; the connected repository tool used for this release does not expose that setting.

## Added infrastructure

- `package.json` and locked Playwright dependencies;
- Playwright configuration for desktop, tablet, and phone projects;
- synthetic multi-month vault fixture;
- shared browser seeding and navigation helpers;
- boot/navigation/privacy tests;
- compact month and month-control tests;
- Review Queue and Goals tests;
- Reports, Backup, and Restore safety tests;
- post-deployment Cloudflare smoke test;
- GitHub Actions workflow;
- local and CI testing documentation;
- Playwright artifact exclusions in `.gitignore`.

## Tested browsers and layouts

- Chromium desktop;
- Firefox desktop;
- WebKit desktop;
- iPad emulation;
- Android phone emulation;
- iPhone/WebKit emulation.

## Regression coverage

The initial suite is designed around failures and usability problems previously observed in this project:

- JavaScript module boot failure;
- missing named exports;
- main and secondary navigation;
- full-page horizontal overflow;
- oversized month controls;
- Previous, Next, selected month, and Latest behavior;
- native Review Queue selects;
- backup-first transaction editing;
- Goals and Vault Health storage;
- report and backup downloads;
- zero-transaction restore blocking;
- service-worker absence;
- no browser-network write requests during normal navigation.

## CI behavior

The workflow runs local-source tests on branch pushes and pull requests. Desktop and responsive projects are separated so failures are easier to diagnose.

After successful local tests on `main`, the workflow runs a smaller Chromium smoke test against Cloudflare Pages and retries while deployment propagates.

Failure artifacts include screenshots, video, traces, result files, and an HTML report retained for 14 days.

## Safety boundaries

- Synthetic data only.
- Isolated browser contexts.
- No access to the user's normal browser storage.
- No transaction upload.
- No service worker or offline cache.
- No production runtime change in v108.1.

## Merge gate

The testing branch should be merged only after GitHub Actions executes the suite and any browser failures are corrected.
