# v133 Implementation Scope

Issue: #43 — Local Data Longevity Drills

## In scope

- strict TypeScript and JavaScript contracts for synthetic local-data longevity drills;
- deterministic long-lived synthetic vault generation;
- exactly six scenarios: supported upgrade rehearsal, corrupted portable package, rollback verification, orphan metadata, stale or unsupported schema, and bounded capacity;
- deterministic privacy-safe reports with disposition, evidence, safeguards, and explicit human action;
- a lazy runtime hook used only after explicit synthetic invocation;
- parser-stage, browser-free, browser, privacy, security, accessibility, performance, supply-chain, CodeQL, Cloudflare preview, and unresolved-thread validation;
- advancing the authoritative release manifest, package metadata, roadmap, documentation, and shared current-release expectations to v133.

## Out of scope

- reading, writing, migrating, repairing, compacting, cleaning, rolling back, overwriting, resetting, or replacing real browser-local household data;
- changing `gringottsBudgetVault.latest` or adding another authoritative transaction-copy domain;
- production migration logic or a user-facing migration, cleanup, repair, rollback, or reset control;
- new financial schema, report, workbook sheet, primary destination, Tools section, export, import, restore, backend, service worker, telemetry, analytics, network endpoint, cloud adapter, persistent store, or automatic financial action;
- changing v129 Workflow Review, v130 runtime evidence, v131 Decision Gate, or v132 release-manifest behavior;
- relaxing any route, enhancement, action, observer, request, script-byte, destination, workbook, browser, accessibility, security, deployment, or review gate.

## Safety rules

- all drill inputs and committed fixtures must be visibly synthetic;
- drill reports must declare that no authoritative-vault read or write occurred;
- unsupported or ambiguous scenarios remain closed as `manual-review` or `rejected`;
- orphan metadata is reported but never deleted or rewritten;
- rollback requires an explicit synthetic backup and failed verification result, preserves the failed candidate, and leaves the backup unchanged;
- capacity limits are harness bounds only and cannot authorize production deletion, reset, truncation, or compaction;
- no drill result authorizes action against real data.

## Promotion rule

Only the exact final PR head may be promoted, and only after every required gate passes with no unresolved review threads. Any failure involving integrity, authority boundaries, browser storage, startup budgets, route settlement, or synthetic-data privacy must be corrected at the source rather than hidden with retries, relaxed assertions, or expanded limits.
