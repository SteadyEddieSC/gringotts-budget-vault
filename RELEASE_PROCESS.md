# Release Process

## Goals

The release process must protect household data and application stability without creating avoidable GitHub Actions failures, repeated browser downloads, or notification noise.

The final merge gate remains comprehensive. The efficiency changes affect **when** expensive checks run and **how quickly** obvious failures stop later work; they do not remove required coverage.

## 1. Build on a feature branch

Create the release branch from the current verified `main` branch.

Do not push application development directly to `main`.

Before opening a pull request:

- implement the feature and its tests;
- update inherited version, filename, workbook-count, and report-page assertions;
- update accessibility and responsive-layout contracts;
- update release notes, roadmap, security-drift tests, and documentation;
- review the complete branch diff for personal-data files and architecture regressions.

Keeping this work outside an open PR avoids sending a workflow-failure email for every normal development correction.

## 2. Run the release-candidate preflight

The minimum local preflight is:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

`test:preflight` focuses on startup, navigation, the current release feature, and repository security controls.

When the environment permits, also run:

```bash
npm run test:local
```

A tooling environment that cannot install or execute browsers must not claim that local browser tests passed. In that case, review the branch completely and use the draft/ready workflow below.

## 3. Open a draft PR

A draft PR is useful for reviewing the complete diff without launching the expensive protected gates.

The v114 workflows skip draft pull requests for:

- desktop and responsive Playwright;
- accessibility and visual contracts;
- Lighthouse;
- full-history privacy and Gitleaks;
- Dependency Review and npm audit;
- CodeQL.

Draft status is not a substitute for testing. It is a quiet review stage before the release candidate is declared ready.

## 4. Mark ready for review once

After the branch has been reviewed as a release candidate, mark the PR ready for review.

The `ready_for_review` event launches one complete protected matrix.

### Browser staging

Desktop:

1. Install Chromium and shared system dependencies.
2. Run Chromium as the functional preflight.
3. Only after Chromium passes, install Firefox and WebKit.
4. Run Firefox and WebKit.

Responsive:

1. Install Chromium and shared system dependencies.
2. Run tablet and Android projects.
3. Only after those pass, install WebKit.
4. Run iPhone/WebKit.

This prevents an obvious Chromium failure from wasting time downloading and running two additional engines.

### Quality staging

1. Run keyboard semantics and deterministic visual-layout contracts.
2. Only after those pass, run the longer axe surface inventory.
3. Run Lighthouse independently in parallel.

### Diagnostics

Screenshots, traces, videos, accessibility JSON, and Lighthouse reports are uploaded only when the corresponding job fails.

Successful jobs keep their concise GitHub summary and do not spend time packaging large diagnostic artifacts.

## 5. Handle a failure precisely

When a final-gate job fails:

1. Read the exact job log and failure artifact.
2. Decide whether it is an application defect, accessibility defect, security issue, responsive issue, or stale assertion.
3. Fix the root cause.
4. Run the narrowest relevant local/preflight check before pushing.
5. Push one coherent correction rather than several speculative commits.

Do not weaken a threshold, disable a test, or bypass branch protection merely to obtain a green result.

Concurrency cancellation remains enabled, so a newer commit cancels superseded runs.

## 6. Merge only after final-head success

Required final-head checks:

- Local source — desktop;
- Local source — responsive;
- Accessibility and visual contracts;
- Lighthouse CI budgets;
- Full history privacy and secret scan;
- JavaScript security analysis;
- Dependency Review;
- npm audit.

Squash-merge with the expected final head SHA to prevent a moving-target merge.

## 7. Verify production

After merge:

- confirm the production page reports the new release;
- open every primary destination;
- open the new feature surface;
- verify the security headers;
- confirm no browser errors;
- verify the main-branch Cloudflare smoke job when the available GitHub tooling exposes it.

If the connector cannot expose the main-push run, state that limitation explicitly instead of claiming the smoke passed.

## Notification expectations

GitHub can still send a failure notification when the final release candidate uncovers a genuine issue. The goal is not zero failures at any cost; it is to keep normal development failures out of the PR notification stream and make each remaining failure specific and actionable.
