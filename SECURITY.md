# Security Policy

## Supported version

Security fixes are applied to the current `main` branch and the production Cloudflare Pages deployment. Older rescue pages exist for data recovery and are not maintained as full-featured supported releases.

## Reporting a vulnerability privately

Use GitHub's **Report a vulnerability** option on the repository Security tab when available. This creates a private security advisory visible to the repository owner rather than a public issue.

Include:

- a concise description of the security impact;
- synthetic reproduction steps;
- affected browser or workflow;
- the smallest fictional sample needed to demonstrate the issue;
- any suggested mitigation.

Do not include:

- credentials, API keys, or access tokens;
- account or routing numbers;
- transaction exports or vault backups;
- screenshots containing household financial information;
- personal identifiers or medical, employment, or benefits information.

When reporting a browser-storage, import, or restore issue, use a fictional vault. Never attach a real household backup.

The maintainer will review a private report as availability permits, confirm whether the current release is affected, and coordinate a fix before public disclosure when the report is valid. This personal project does not promise a commercial support SLA.

## Public issue boundary

Public issues may include:

- source-code defects without sensitive data;
- reproduction steps using the committed synthetic fixture;
- screenshots generated from synthetic test data;
- browser and operating-system details.

Do not use a public issue for an unpatched vulnerability or any sensitive data.

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
- Guided Plan and insight calculation remain local;
- no service worker or offline cache is registered;
- an empty vault is never automatically saved over a populated vault;
- restore requires a populated preview and explicit acknowledgement;
- broad transaction edits require a backup and verified storage write;
- checklist metadata remains separate from transaction storage;
- automated tests use synthetic data in isolated browser contexts.

A change that weakens one of these boundaries should be treated as security-relevant and reviewed before merge.
