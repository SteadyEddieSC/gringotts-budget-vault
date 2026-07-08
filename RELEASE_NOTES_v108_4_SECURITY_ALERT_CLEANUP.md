# v108.4 — Security Alert Cleanup

Release type: repository security and quality infrastructure only. The visible application runtime remains **v108 — Goals & Vault Health**.

## Purpose

v108.4 resolves the actionable CodeQL finding, reduces GitHub Actions token permissions, incorporates the current pinned CodeQL Action update, and records an evidence-based disposition for the remaining OpenSSF Scorecard recommendations.

## Changes

### CodeQL finding

- Removed the obsolete `.replace(' ', ' ')` expression from `src/v72-dashboard-month-picker.js`.
- Preserved the existing month-label behavior: localized short month and two-digit year, converted to uppercase.
- Kept the historical v72 source file rather than deleting it merely to silence analysis.

### Workflow least privilege

- Changed `.github/workflows/codeql.yml` to use `permissions: read-all` at the workflow level.
- Limited the CodeQL analysis job to:
  - `actions: read`;
  - `contents: read`;
  - `security-events: write`.
- Removed the unnecessary workflow-level `packages: read` permission.
- Preserved pull-request CodeQL execution and SARIF upload capability.
- Updated CodeQL Action references to the Dependabot-proposed v4.37.0 full commit SHA.
- Updated the Scorecard SARIF uploader to the same pinned CodeQL Action commit.

### Regression protection

- Added a repository-security test that requires CodeQL read-only defaults and limits write access to security events.
- Preserved the existing full-SHA action-pinning test and broad-permission checks.

## Scorecard alert disposition

The pre-release code-scanning view reported nine Scorecard recommendations plus one CodeQL finding. Scorecard findings are posture signals and are not all exploitable vulnerabilities.

| Finding | v108.4 treatment |
| --- | --- |
| Token-Permissions — High | Actionable and corrected by the least-privilege CodeQL workflow change. Await the post-merge Scorecard refresh. |
| Branch-Protection — High | The repository ruleset now targets the default branch and requires the documented PR checks. Await the next Scorecard refresh. |
| Security-Policy — Medium | `SECURITY.md`, security advisories, and private vulnerability reporting are present/enabled. Treat as stale until refreshed. |
| SAST — Medium | Advanced CodeQL runs on pushes, pull requests, manual dispatch, and schedule. Treat as stale until refreshed. |
| Maintained — High | No artificial fix. Continued real maintenance activity may improve this historical metric over time. |
| Code-Review — High | Accepted limitation for a solo-maintainer repository. Pull requests and automated checks are required; impossible self-approval is not required. |
| Fuzzing — Medium | Accepted for now. No meaningful fuzz target justifies adding a low-value framework to this static browser application. |
| CII-Best-Practices — Low | Optional certification-style item; not a release blocker. |
| License — Low | Intentionally unresolved. Public visibility does not grant reuse rights, and no license will be added without an explicit owner decision. |
| Replacement of a substring with itself — Medium | Corrected in `src/v72-dashboard-month-picker.js`. CodeQL should close the alert after analysis of the merged main branch. |

## Privacy and architecture preservation

- No transaction data, vault backup, report, screenshot, or household financial information was added.
- No browser storage key or vault schema changed.
- No localStorage or cache clearing was introduced.
- No service worker, PWA cache, compatibility overlay, bridge runtime, or additional live runtime was added.
- The stable `rescue-v105.html` page was not changed.
- The restore destination remains `gringottsBudgetVault.latest`.
- The exact subtitle typo `Mischief Managed. Money Manged` remains unchanged.

## Verification gate

Before merge, require:

1. Local source — desktop;
2. Local source — responsive;
3. Full history privacy and secret scan;
4. JavaScript security analysis;
5. Dependency Review;
6. npm audit.

After merge, verify the Cloudflare deployment smoke job and inspect the refreshed CodeQL and Scorecard results. Scorecard residual recommendations should remain documented rather than dismissed without support.
