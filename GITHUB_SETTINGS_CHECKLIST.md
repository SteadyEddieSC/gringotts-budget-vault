# GitHub Settings Checklist

This checklist covers repository settings that cannot be enforced completely from committed files.

## Current repository profile

- Visibility: Public
- Default branch: `main`
- Release method: feature branch → pull request → required checks → squash merge
- Maintainer profile: solo maintainer
- Deployment: Cloudflare Pages after merge

During v114 development, a direct file write to `main` was rejected by repository rules. That confirms a protection rule is active, but the settings below should still be reviewed because OpenSSF Scorecard may evaluate individual rule fields.

## 1. Main branch ruleset

Open:

**Repository → Settings → Rules → Rulesets**

Confirm an active ruleset targeting the default branch with:

- Restrict deletions: **On**
- Require linear history: **On**
- Require a pull request before merging: **On**
- Require status checks to pass: **On**
- Block force pushes: **On**

Pull-request settings for a solo-maintainer repository:

- Required approvals: **0**
- Require conversation resolution before merging: **On**
- Require Code Owner review: **Off** until a genuine independent reviewer exists
- Require approval of the most recent push: **Off** with zero required approvals

Required status checks:

1. `Local source — desktop`
2. `Local source — responsive`
3. `Accessibility and visual contracts`
4. `Lighthouse CI budgets`
5. `Full history privacy and secret scan`
6. `JavaScript security analysis`
7. `Dependency Review`
8. `npm audit`

Also enable:

- Require branches to be up to date before merging
- Do not allow required checks to be skipped

Do not require before merge:

- `Cloudflare deployment smoke` — it runs on `main` after deployment
- `OpenSSF Scorecard analysis` — it runs on `main`, manually, and weekly

Prefer no bypass. An emergency bypass should be limited to the repository administrator and should not permit force pushes or deletion of `main`.

## 2. Pull request and merge settings

Open:

**Repository → Settings → General → Pull Requests**

Recommended:

- Allow squash merging: **On**
- Allow merge commits: **Off**
- Allow rebase merging: **Off**
- Always suggest updating pull request branches: **On**
- Automatically delete head branches: **On**
- Allow auto-merge: optional

Draft pull requests are used for quiet release diff review. The expensive workflows intentionally skip draft PRs and run when the PR is marked ready for review.

## 3. GitHub Actions permissions

Open:

**Repository → Settings → Actions → General**

Recommended actions policy:

- Allow GitHub-created actions
- Allow `gitleaks/gitleaks-action@*`
- Allow `ossf/scorecard-action@*`

Workflow permissions:

- Default: Read repository contents and packages
- Allow GitHub Actions to create and approve pull requests: **Off**

Fork pull requests:

- Require approval for all outside collaborators
- Send write tokens: **Off**
- Send secrets: **Off**

No Gringotts test workflow requires a repository write token.

## 4. Code security and analysis

Open:

**Repository → Settings → Security → Code security and analysis**

Confirm:

- Dependency graph: **On**
- Dependabot alerts: **On**
- Dependabot security updates: **On**
- Secret scanning: **On**
- Push protection: **On**
- Generic/non-provider secret patterns: **On** when available
- Secret validity checks: **On** when available
- Code scanning alerts: **On**

The repository uses advanced CodeQL setup in `.github/workflows/codeql.yml`. Do not enable a duplicate default CodeQL setup.

## 5. Private vulnerability reporting

Open:

**Repository → Settings → Security → Code security and analysis → Private vulnerability reporting**

Set to **On** and confirm **Report a vulnerability** appears on the Security tab.

This helps OpenSSF recognize the repository security policy together with `SECURITY.md`.

## 6. OpenSSF Scorecard refresh

After v114 reaches `main`:

1. Open **Actions → OpenSSF Scorecard**.
2. Dispatch the workflow manually or wait for the next scheduled run.
3. Confirm the run analyzes the current default branch.
4. Review the refreshed SARIF alerts.
5. Close only findings no longer present in the new result.

See `SCORECARD_ALERTS.md` for the disposition of Branch Protection, Code Review, Maintained, SAST, Security Policy, License, Fuzzing, and CII Best Practices.

## 7. Notifications

Repository:

**Watch → Custom**

Enable security alerts.

Workflow failure emails may still occur for a genuine final release-candidate defect. v114 reduces avoidable notifications by skipping expensive jobs on drafts and staging browsers/quality checks.

GitHub notification preferences can also be adjusted at the account level, but do not disable security-alert notifications merely to hide unresolved findings.

## 8. Secrets, deploy keys, webhooks, and collaborators

Review:

- Settings → Secrets and variables → Actions
- Settings → Deploy keys
- Settings → Webhooks
- Settings → Collaborators

Expected:

- no Actions secret containing financial data;
- no unnecessary deploy key;
- only expected Cloudflare/GitHub deployment integration;
- only recognized collaborators and applications.

## 9. Account protection

For the repository owner account:

- enable two-factor authentication;
- add a passkey or hardware security key when available;
- store recovery codes outside GitHub;
- review sessions, OAuth apps, GitHub Apps, SSH keys, and personal access tokens;
- remove unrecognized credentials.

## 10. License decision

A public repository without a license remains viewable but does not grant broad reuse permission.

Do not add a license solely to clear a Scorecard alert. The owner should intentionally choose whether to:

- retain normal copyright control with no open-source license;
- use MIT for broad permissive reuse;
- use Apache-2.0 for permissive reuse with an express patent grant;
- use a reciprocal license when derivative sharing is desired.

The fan-themed presentation and third-party trademarks should be considered separately from the code-license choice.

## Settings that should remain off

Unless the architecture changes, do not enable:

- workflow secrets containing real financial data;
- routine workflow write permissions;
- unapproved fork workflows with write tokens or secrets;
- direct force pushes to `main`;
- service-worker/PWA deployment automation;
- production deployment as a pre-merge requirement;
- signed-commit enforcement until every automated commit path is confirmed compatible.
