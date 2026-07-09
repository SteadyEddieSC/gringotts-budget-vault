# OpenSSF Scorecard Alert Triage

## Purpose

OpenSSF Scorecard findings are supply-chain posture signals. They are not all exploitable vulnerabilities, and a finding should not be closed merely to improve a numeric score.

This document classifies the findings visible after the v113 release as:

- **Implemented control / refresh needed**;
- **Manual repository setting**;
- **Owner decision**;
- **Accepted project tradeoff**;
- **Future release improvement**.

The next Scorecard run should be reviewed after v114 merges because some findings may reflect an earlier repository snapshot.

## Finding review

### Branch-Protection — High

**Classification:** Implemented control / refresh needed, plus manual verification.

Evidence:

- direct writes to `main` are rejected by repository rules;
- releases use feature branches and pull requests;
- required checks must pass before squash merge;
- merge uses the expected final head SHA.

Manual verification remains necessary because Scorecard may evaluate specific branch-protection fields differently from GitHub rulesets. Confirm the `main` ruleset requires a pull request and required status checks, blocks force pushes and deletion, and applies to administrators where appropriate.

Do not disable branch protection to make releases faster.

### Code-Review — High

**Classification:** Accepted solo-maintainer limitation with compensating controls.

The project currently has one active maintainer, so an independent human approval cannot be manufactured honestly.

Compensating controls:

- all releases use a PR;
- complete diffs are reviewed before ready-for-review;
- protected browser, accessibility, security, and supply-chain checks gate merge;
- expected-head SHA prevents a moving-target merge;
- release notes and architecture guardrails are committed.

This finding can improve only when a genuine second maintainer or reviewer participates. Self-approval or a token reviewer should not be added merely to satisfy the score.

### Maintained — High

**Classification:** Ongoing repository-history signal.

The repository is actively receiving releases, dependency updates, security scans, and documentation. Scorecard's maintained heuristic may lag or require a longer public activity history.

Continue normal maintenance. Do not create artificial commits or issues solely to affect this score.

### SAST — Medium

**Classification:** Implemented control / refresh needed.

The repository has:

- CodeQL JavaScript/TypeScript analysis;
- `security-extended` queries;
- code-scanning SARIF publication;
- least-privilege `security-events: write` permission scoped to the analysis job;
- a required JavaScript security-analysis merge gate.

If the finding remains after a fresh Scorecard run, inspect whether GitHub is recognizing the CodeQL result on the default branch and whether repository code-scanning settings are enabled.

### Security-Policy — Medium

**Classification:** Implemented control / refresh needed.

`SECURITY.md` documents:

- the supported version;
- private vulnerability reporting through GitHub Security Advisories;
- prohibited sensitive-data disclosure;
- public-issue boundaries;
- accidental-data-exposure response;
- local-first security invariants.

If the finding remains, verify that GitHub recognizes `SECURITY.md` on the default branch and that private vulnerability reporting is enabled in repository settings.

### License — Low

**Classification:** Owner legal decision.

The repository currently does not declare an open-source license. Public visibility alone does not grant others permission to copy, modify, or redistribute the code.

Do not add a license automatically. The owner should deliberately choose among options such as:

- retaining all rights with no open-source license;
- MIT for broad permissive reuse;
- Apache-2.0 for permissive reuse with an express patent grant;
- GPL-family licensing when reciprocal sharing is desired.

The fan-themed nature and third-party trademarks should also be considered. The project disclaimer does not replace a software license decision.

Until the owner chooses, this alert remains an accepted unresolved item.

### Fuzzing — Medium

**Classification:** Accepted current tradeoff; future parser improvement.

The current application is a static browser application with deterministic local data transformations and synthetic malformed-input tests. It does not yet include a dedicated fuzzing service.

v115 Bank Export Import & Mapping will add parsers for CSV, OFX/QFX/QBO, and potentially other structured formats. Parser fuzz and property-based tests would provide more value there than adding a superficial fuzzing badge now.

Planned v115 review:

- malformed delimiters and quoting;
- oversized fields and files;
- invalid OFX/SGML/XML structures;
- ambiguous debit/credit signs;
- duplicate identifiers and date edge cases;
- parser termination and memory limits.

### CII-Best-Practices — Low

**Classification:** Accepted project-profile tradeoff.

The OpenSSF Best Practices badge program is valuable for reusable public software projects with a broader contributor and release ecosystem. This repository is a solo-maintained personal budgeting application with no package distribution or hosted transaction service.

The project already documents security policy, testing, dependency controls, release gates, privacy boundaries, and incident handling. Pursuing a badge may be reconsidered if the project gains external maintainers or users.

## Refresh and closure rules

After v114 merges:

1. Wait for or manually dispatch the next OpenSSF Scorecard run.
2. Confirm findings against the current default branch.
3. Close only alerts that the new SARIF result no longer reports or that GitHub marks fixed.
4. Do not dismiss an alert as fixed when it is merely an accepted tradeoff.
5. Record any manual repository-setting change in `GITHUB_SETTINGS_CHECKLIST.md`.

## Current disposition summary

| Finding | Disposition |
|---|---|
| Branch-Protection | Implemented; verify ruleset and refresh |
| Code-Review | Accepted solo-maintainer limitation |
| Maintained | Continue normal maintenance; refresh |
| SAST | CodeQL implemented; refresh and verify recognition |
| Security-Policy | `SECURITY.md` implemented; refresh and verify settings |
| License | Await explicit owner legal decision |
| Fuzzing | Defer meaningful parser fuzzing to v115 |
| CII-Best-Practices | Accepted current project-profile tradeoff |
