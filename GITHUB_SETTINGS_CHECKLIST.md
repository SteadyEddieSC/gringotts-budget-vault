# GitHub Settings Checklist

This checklist covers repository settings that cannot be enforced completely from files committed to the repository.

## Current visible repository metadata

At the time v108.3 was prepared:

- repository visibility: Public;
- default branch: `main`;
- squash merge: enabled;
- merge commits: enabled;
- rebase merge: enabled;
- automatic branch updating: disabled;
- auto-merge: disabled.

The recommended changes below keep the repository easy to maintain as a solo project while preventing untested direct changes to `main`.

## 1. Main branch ruleset

Open:

**Repository → Settings → Rules → Rulesets → New ruleset → New branch ruleset**

Use:

- Ruleset name: `Protect main`
- Enforcement status: **Active**
- Target branches: **Include default branch**

Enable these rules:

- **Restrict deletions**
- **Require linear history**
- **Require a pull request before merging**
- **Require status checks to pass**
- **Block force pushes**

Under **Require a pull request before merging**:

- Required approvals: **0** while this remains a solo-maintainer repository
- Dismiss stale pull request approvals: optional/off with zero approvals
- Require review from Code Owners: **Off**
- Require approval of the most recent reviewable push: **Off**
- Require conversation resolution before merging: **On**

Under **Require status checks to pass**, add these exact PR checks after each has run at least once:

1. `Local source — desktop`
2. `Local source — responsive`
3. `Full history privacy and secret scan`
4. `JavaScript security analysis`
5. `Dependency Review`
6. `npm audit`

Also enable:

- **Require branches to be up to date before merging**
- **Do not allow status checks to be skipped**

Do not require these as pre-merge checks:

- `Cloudflare deployment smoke` — runs after a change reaches `main`
- `OpenSSF Scorecard analysis` — runs on `main` and on a schedule, not on pull requests

Leave these off for now:

- Require signed commits — GitHub App/API commits may not satisfy this consistently
- Require merge queue — unnecessary for one maintainer
- Required deployments before merging — Cloudflare production deployment occurs after merge
- Required Code Owner review — no independent reviewer is configured

### Bypass recommendation

Prefer no bypass. If an emergency bypass is needed, allow only the repository administrator and select **For pull requests only** when GitHub offers that option. Do not create a bypass that permits force-pushing or deleting `main`.

## 2. Pull request and merge settings

Open:

**Repository → Settings → General → Pull Requests**

Set:

- Allow squash merging: **On**
- Allow merge commits: **Off**
- Allow rebase merging: **Off**
- Always suggest updating pull request branches: **On**
- Automatically delete head branches: **On**
- Allow auto-merge: optional, recommended **On**

Squash-only merging keeps the protected branch linear and makes release rollback easier.

## 3. GitHub Actions permissions

Open:

**Repository → Settings → Actions → General**

### Actions permissions

Recommended restrictive configuration:

- Select **Allow select actions and reusable workflows**
- Allow actions created by GitHub: **On**
- Add these additional allowed patterns when GitHub requests them:
  - `gitleaks/gitleaks-action@*`
  - `ossf/scorecard-action@*`

The other workflows use GitHub-owned actions under `actions/*` and `github/codeql-action/*`.

### Workflow permissions

Set:

- Default workflow permissions: **Read repository contents and packages permissions**
- Allow GitHub Actions to create and approve pull requests: **Off**

### Fork pull request workflows

Set:

- Require approval for fork pull request workflows: **Require approval for all outside collaborators**
- Send write tokens to workflows from pull requests: **Off**
- Send secrets to workflows from pull requests: **Off**

No Gringotts workflow needs a repository write token to test a pull request.

## 4. Code security and analysis

Open:

**Repository → Settings → Security → Code security and analysis**

Confirm these are enabled:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Grouped security updates, when offered
- Secret scanning
- Push protection
- Generic or non-provider secret patterns, when offered
- Secret validity checks, when offered
- Code scanning alerts

The repository already has an advanced CodeQL workflow in `.github/workflows/codeql.yml`. Do not enable a second CodeQL default-setup configuration if GitHub warns that it will duplicate the advanced workflow. The interface should show the repository as using advanced setup.

## 5. Private vulnerability reporting

Open:

**Repository → Settings → Security → Code security and analysis → Private vulnerability reporting**

Set:

- Private vulnerability reporting: **On**

Then open the repository **Security** tab and confirm a **Report a vulnerability** option is visible.

## 6. Security notifications

From the repository page:

**Watch → Custom**

Enable:

- Security alerts

At the account level, confirm GitHub email notifications are enabled for security alerts.

## 7. Secrets, deploy keys, webhooks, and collaborators

Review:

- **Settings → Secrets and variables → Actions**
- **Settings → Deploy keys**
- **Settings → Webhooks**
- **Settings → Collaborators**

Expected state:

- No Actions secrets are required for this static application.
- No deploy key is required.
- Only the expected Cloudflare/GitHub integration should have deployment access.
- Remove any collaborator, webhook, token, key, or integration that is not recognized and required.

Do not store household financial data, bank exports, vault backups, or Cloudflare credentials as repository secrets.

## 8. Account protection

For the GitHub account that owns the repository:

- Enable two-factor authentication.
- Add a passkey or hardware security key when available.
- Save recovery codes somewhere outside GitHub.
- Review active sessions, authorized OAuth apps, GitHub Apps, SSH keys, and personal access tokens.
- Remove old or unrecognized credentials.

## 9. License decision

A public repository without a license remains viewable but does not grant broad permission to reuse the code.

Leave the repository without a license when the intent is to retain normal copyright control. Add a license only after intentionally deciding to make the code open source. MIT is simple and permissive; Apache-2.0 is also permissive and includes an explicit patent grant.

This is a project-policy decision, not a security requirement.

## 10. Settings that should remain off

Unless the architecture changes, do not enable or add:

- GitHub Actions secrets containing real financial data;
- workflow write permissions for routine tests;
- unapproved fork workflows with write tokens or secrets;
- direct force pushes to `main`;
- service-worker or PWA deployment automation;
- production deployment as a pre-merge requirement;
- signed-commit enforcement until all automated commit paths are confirmed compatible.
