# Security Policy

## Supported version

Security fixes are applied to the current `main` branch and production Cloudflare Pages deployment. Older rescue pages exist for data recovery and are not maintained as full-featured releases.

## Reporting a vulnerability privately

Use GitHub's **Report a vulnerability** option on the repository Security tab when available. This creates a private security advisory visible to the repository owner rather than a public issue.

Include:

- a concise description of the security impact;
- synthetic reproduction steps;
- affected browser, parser, import, restore, or workflow;
- the smallest fictional sample needed to demonstrate the issue;
- any suggested mitigation.

Do not include:

- credentials, API keys, or access tokens;
- account or routing numbers;
- real CSV, OFX, QFX, QBO, statement, transaction, or vault exports;
- screenshots containing household financial information;
- personal identifiers or medical, employment, or benefits information.

When reporting a parser, browser-storage, import, or restore issue, use fictional data. Never attach a real household export or backup.

The maintainer will review a private report as availability permits, confirm whether the current release is affected, and coordinate a fix before public disclosure when valid. This personal project does not promise a commercial support SLA.

## Public issue boundary

Public issues may include:

- source-code defects without sensitive data;
- reproduction steps using committed synthetic fixtures;
- screenshots generated from synthetic data;
- browser and operating-system details.

Do not use a public issue for an unpatched vulnerability or sensitive data.

## If sensitive data is accidentally committed

Deleting the file from the latest commit is not sufficient because earlier Git history may remain public.

Immediately:

1. Revoke or rotate any exposed credential.
2. Remove the sensitive object from Git history.
3. Force-update affected branches and tags only after preserving a safe local code backup.
4. Re-run full-history Gitleaks and the privacy-history scanner.
5. Treat financial identifiers as exposed even when no misuse is known.

## Local-first security boundaries

The application is expected to preserve these invariants:

- transaction and bank export files are processed locally in browser memory;
- no transaction upload, remote parser, analytics, or institution-credential endpoint is used;
- unsupported, oversized, malformed, and ambiguous imports are blocked before write;
- source account identifiers are masked when mapped;
- import receipts contain metadata only, not transaction arrays or raw source rows;
- no imported row is written while required mapping, date, sign, or duplicate decisions remain unresolved;
- incremental import requires a populated destination and backup before transaction insertion;
- import failure restores the prior raw destination value;
- successful import requires count and inserted-token read-back verification;
- full restore remains separate, requires a populated preview and acknowledgement, and writes exactly to `gringottsBudgetVault.latest`;
- Guided Plan and insight calculation remain local;
- no service worker or offline cache is registered;
- an empty vault is never automatically saved over a populated vault;
- checklist metadata remains separate from transaction storage;
- automated tests use synthetic data in isolated Node or browser contexts.

A change that weakens one of these boundaries is security-relevant and must be reviewed before merge.
