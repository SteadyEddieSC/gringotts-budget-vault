# v132 Implementation Scope

Issue: #41 — Release & Test Infrastructure Simplification

## In scope

- one authoritative browser-compatible current-release manifest;
- manifest-driven production boot metadata and protected budgets;
- versionless HTML shell titles and loading copy;
- shared current-release expectations for Playwright and quality tests;
- exact release-consistency diagnostics before browser installation;
- structured parser failure artifacts;
- migration of inherited current-release assertions without changing historical release contracts;
- exact-head browser, accessibility, performance, privacy, security, supply-chain, CodeQL, Cloudflare preview, and review-thread validation.

## Out of scope

- household-finance capability;
- financial schema, report sheet, migration, persistence, telemetry, analytics, remote endpoint, cloud adapter, service worker, backend, automatic export, or financial action;
- changing v129 Workflow Review, v130 runtime evidence, or v131 Decision Gate behavior;
- relaxing any protected performance, action, observer, destination, workbook, browser, accessibility, security, or deployment gate.

## Promotion rule

Only the exact final PR head may be promoted, and only after every required gate passes with no unresolved review threads.