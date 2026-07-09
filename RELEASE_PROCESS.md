# Release Process

## Goals

The release process must protect household data and application stability without creating avoidable workflow failures, repeated browser downloads, or notification noise.

The final merge gate remains comprehensive. Efficiency changes affect **when** expensive checks run and **how quickly** obvious failures stop later work; they do not remove required coverage.

## 1. Build on a feature branch

Create the release branch from the current verified `main` branch. Do not push application development directly to `main`.

Before opening a pull request:

- implement the feature and synthetic tests;
- update inherited version, filename, workbook-count, and report-page assertions;
- update accessibility and responsive-layout contracts;
- update release notes, roadmap, security-drift tests, and documentation;
- review the complete branch diff for personal-data files and architecture regressions;
- freeze application code, tests, and release documentation before the final matrix whenever possible.

Keeping this work outside an open PR avoids sending a workflow-failure email for every normal development correction.

## 2. Run the cheapest checks first

Pure logic should be tested before browser installation.

For v115 and later parser-heavy releases:

```bash
npm run test:parser
```

The GitHub `Parser and static preflight` job:

- checks current release modules with `node --check`;
- runs Node's built-in parser tests;
- uses no Playwright browser;
- uses no additional test dependency;
- must pass before desktop or responsive jobs can begin.

The broader local preflight is:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

When the environment permits, also run:

```bash
npm run test:local
```

A tooling environment that cannot install or execute browsers must not claim local browser tests passed.

## 3. Open a draft PR

A draft PR is used for complete diff review without launching the expensive protected gates.

The workflows skip draft pull requests for:

- parser/static and desktop/responsive Playwright;
- accessibility and visual contracts;
- Lighthouse;
- full-history privacy and Gitleaks;
- Dependency Review and npm audit;
- CodeQL.

Draft status is not a substitute for testing. It is a quiet review stage before the release candidate is declared ready.

## 4. Mark ready for review once

After the branch has been reviewed as a frozen release candidate, mark the PR ready for review. The `ready_for_review` event launches one complete protected matrix.

### Parser and static staging

1. Check current release JavaScript module syntax.
2. Run browser-free parser and deterministic malformed-input tests.
3. Start browser jobs only after this job succeeds.

### Browser staging

Desktop:

1. Install Chromium and shared system dependencies.
2. Run Chromium as the functional preflight.
3. Only after Chromium passes, install Firefox and WebKit.
4. Run Firefox and WebKit.

Responsive:

1. Install Chromium and shared system dependencies.
2. Run Android/Pixel Chromium.
3. Only after Android Chromium passes, install WebKit.
4. Run iPad and iPhone WebKit together.

This prevents parser or Chromium defects from wasting time downloading additional engines.

### Quality staging

1. Run keyboard semantics and deterministic visual-layout contracts.
2. Only after those pass, run the longer axe surface inventory.
3. Run Lighthouse independently in parallel.

### Diagnostics

Screenshots, traces, videos, accessibility JSON, and Lighthouse reports are uploaded only when the corresponding job fails.

## 5. Handle a failure precisely

When a final-gate job fails:

1. Read the exact job log and failure artifact.
2. Classify it as parser, application, accessibility, security, responsive, dependency, or stale assertion.
3. Fix the root cause.
4. Run the narrowest relevant parser or browser preflight before pushing.
5. Push one coherent correction rather than several speculative commits.

Do not weaken a threshold, disable a test, or bypass branch protection merely to obtain a green result. Concurrency cancellation remains enabled so newer commits cancel superseded runs.

## 6. Merge only after final-head success

Required final-head checks:

- Parser and static preflight, through the Playwright job dependency;
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

- confirm production reports the new release;
- open every primary destination;
- open the new feature surface;
- verify security headers;
- confirm no browser errors;
- verify the main-branch Cloudflare smoke job when available.

If the connector cannot expose the main-push run, state that limitation instead of claiming the smoke passed.

## Tools considered

Free tools should be added only when they provide distinct value without uploading financial data or creating duplicate noise.

- **Node built-in test runner:** adopted in v115 for pure parser tests.
- **fast-check:** useful later for broader property-based parser testing if real format diversity justifies another dependency.
- **Semgrep Community Edition:** useful as a second SAST perspective if custom local-first rules are added; not included merely to duplicate CodeQL alerts.
- **Vitest:** unnecessary while Node's built-in runner covers pure modules without another dependency.

## Notification expectations

A genuine release-candidate defect can still generate a failure notification. The goal is to keep normal development failures out of the PR notification stream and ensure each remaining failure is early, specific, and actionable.
