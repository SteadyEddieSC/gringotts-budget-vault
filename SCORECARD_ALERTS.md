# OpenSSF Scorecard Alert Triage

## Purpose

OpenSSF Scorecard findings are supply-chain posture signals. They are not all exploitable vulnerabilities, and a finding should not be closed merely to improve a numeric score.

Classifications used here:

- **Implemented control / refresh needed**;
- **Manual repository setting**;
- **Owner decision**;
- **Accepted project tradeoff**;
- **Future improvement**.

## Finding review

### Branch-Protection — High

**Classification:** Implemented control / refresh needed, plus manual verification.

Evidence:

- direct writes to `main` are rejected by repository rules;
- releases use feature branches and pull requests;
- required checks must pass before squash merge;
- merge uses the expected final head SHA;
- force-push and deletion protections are expected on the default branch ruleset.

Scorecard may interpret GitHub rulesets differently from classic branch protection. Confirm the `main` ruleset requires a pull request and required checks, blocks force pushes and deletion, and applies to administrators where appropriate.

Do not weaken branch protection to make releases faster.

### Code-Review — High

**Classification:** Accepted solo-maintainer limitation with compensating controls.

The project currently has one active maintainer, so an independent human approval cannot be manufactured honestly.

Compensating controls:

- all releases use a PR;
- complete diffs are reviewed before ready-for-review;
- protected browser, accessibility, security, and supply-chain checks gate merge;
- expected-head SHA prevents a moving-target merge;
- release notes and architecture guardrails are committed.

This finding can improve only when a genuine second maintainer or reviewer participates. Do not add self-approval or a token reviewer merely to satisfy a score.

### Maintained — High

**Classification:** Ongoing repository-history signal.

The repository actively receives releases, dependency updates, security scans, documentation, and defect corrections. Scorecard's heuristic may lag or require a longer public history.

Continue normal maintenance. Do not create artificial commits or issues solely to change the score.

### Token-Permissions — High

**Classification:** Implemented control / refresh needed.

Workflows use read-only defaults or explicit `contents: read`. CodeQL uses top-level `permissions: read-all` and grants only `actions: read`, `contents: read`, and `security-events: write` to the analysis job.

Repository tests reject `write-all`, content-write permission, privileged `pull_request_target`, and unpinned external Actions.

If this remains after a fresh scan, inspect the exact workflow and Scorecard evidence before changing permissions.

### SAST — Medium

**Classification:** Implemented control / refresh needed.

The repository has:

- CodeQL JavaScript/TypeScript analysis;
- `security-extended` queries;
- code-scanning SARIF publication;
- least-privilege `security-events: write` permission scoped to analysis;
- JavaScript security analysis as a required merge gate.

If the finding remains, confirm GitHub recognizes the default-branch CodeQL result and that code scanning remains enabled.

### Security-Policy — Medium

**Classification:** Implemented control / refresh needed.

`SECURITY.md` documents supported versions, private vulnerability reporting, prohibited sensitive-data disclosure, public-issue boundaries, accidental-exposure response, and local-first invariants.

Private vulnerability reporting and security advisories are enabled. If the finding remains, verify GitHub recognizes `SECURITY.md` on the default branch.

### Fuzzing — Medium

**Classification:** Partially addressed with meaningful local mutation coverage; dedicated service not currently justified.

v115 added deterministic malformed-input mutation tests for the bank-export parser, including delimiter, quote, date, amount, OFX, size, row-limit, and termination behavior. These run before browser installation.

The project does not claim a dedicated fuzzing service. A property-testing dependency or continuous fuzzing service should be added only when additional source-format diversity provides meaningful targets and maintenance value.

Do not add a superficial fuzzing badge or unused harness merely to silence Scorecard.

### License — Low

**Classification:** Owner legal decision.

The repository intentionally does not declare an open-source license. Public visibility alone does not grant permission to copy, modify, or redistribute the code.

Do not add MIT, Apache-2.0, GPL, or another license automatically. The owner should make a deliberate legal and project decision, including consideration of fan-themed names and third-party trademarks.

Until that choice is made, this remains an accepted unresolved item.

### CII-Best-Practices — Low

**Classification:** Accepted project-profile tradeoff.

The Best Practices badge program is valuable for reusable public software with a broader contributor and release ecosystem. This repository is a solo-maintained personal budgeting application with no package distribution or hosted transaction service.

The project already documents security policy, testing, dependency controls, release gates, privacy boundaries, incident handling, and architecture governance. Reconsider certification if the project gains external maintainers or users.

## Refresh and closure rules

After each meaningful security or workflow release:

1. Wait for or manually dispatch the next OpenSSF Scorecard run.
2. Confirm findings against the current default branch.
3. Close only alerts that the refreshed SARIF no longer reports or GitHub marks fixed.
4. Do not dismiss an accepted tradeoff as fixed.
5. Record manual repository-setting changes in `GITHUB_SETTINGS_CHECKLIST.md`.

## Current disposition summary

| Finding | Disposition |
|---|---|
| Branch-Protection | Implemented; verify ruleset and refresh |
| Code-Review | Accepted solo-maintainer limitation |
| Maintained | Continue normal maintenance; refresh |
| Token-Permissions | Least privilege implemented; refresh |
| SAST | CodeQL implemented; refresh and verify recognition |
| Security-Policy | `SECURITY.md` and private reporting implemented; refresh |
| Fuzzing | Deterministic parser mutation coverage implemented; dedicated service deferred |
| License | Await explicit owner legal decision |
| CII-Best-Practices | Accepted current project-profile tradeoff |
