# Security Policy

## Supported version

Security fixes are applied to the current `main` branch and the production Cloudflare Pages deployment. Older rescue pages exist for data recovery and are not maintained as full-featured supported releases.

## Reporting a vulnerability privately

Do not open a public issue containing:

- credentials, API keys, or access tokens;
- account or routing numbers;
- transaction exports or vault backups;
- screenshots containing household financial information;
- personal identifiers or medical, employment, or benefits information.

Use GitHub's **Report a vulnerability** option on the repository Security tab when available. Include only the minimum synthetic information needed to reproduce the problem.

When reporting a browser-storage or restore issue, use a fictional vault. Never attach a real household backup.

## Public issue boundary

Public issues may include:

- source-code defects without sensitive data;
- reproduction steps using the committed synthetic fixture;
- screenshots generated from synthetic test data;
- browser and operating-system details.

## If sensitive data is accidentally committed

Deleting the file from the latest commit is not sufficient because earlier Git history may remain public.

Immediately:

1. Revoke or rotate any exposed credential.
2. Remove the sensitive object from Git history.
3. Force-update affected branches and tags only after preserving a safe local backup of the code.
4. Re-run full-history Gitleaks and the repository privacy-history scanner.
5. Treat financial identifiers as exposed even when no misuse is known.

## Local-first security boundaries

The application is expected to preserve these invariants:

- transaction files are processed locally in the browser;
- no transaction upload endpoint is used;
- no service worker or offline cache is registered;
- an empty vault is never automatically saved over a populated vault;
- restore requires a populated preview and explicit acknowledgement;
- broad transaction edits require a backup and verified storage write;
- automated tests use synthetic data in isolated browser contexts.

A change that weakens one of these boundaries should be treated as a security-relevant change and reviewed before merge.
