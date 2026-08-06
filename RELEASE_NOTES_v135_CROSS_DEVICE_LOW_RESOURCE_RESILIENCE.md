# Gringotts Budget Vault v135 — Cross-Device & Low-Resource Resilience

## Summary

v135 strengthens the existing local-first application across desktop, phone, and tablet profiles without adding household-finance features or a device-specific product mode. It adds deterministic resilience contracts, synthetic large-vault evidence, keyboard and touch workflow validation, reduced-motion checks, and a narrowly bounded correction for a keyboard-navigation race discovered during release testing.

## Delivered

- Six governed resilience profiles covering:
  - Chromium;
  - Firefox;
  - desktop WebKit;
  - Android Chromium;
  - iPad WebKit;
  - iPhone WebKit.
- Keyboard-only completion evidence across desktop browser engines.
- Touch completion evidence across Android, iPad, and iPhone projects.
- Reduced-motion verification across all supported projects.
- Responsive-overflow checks with a two-pixel maximum allowance.
- Minimum 44-pixel target checks for representative navigation controls.
- A deterministic fictional 1,200-transaction large-vault generator with a hard 2,000-transaction test limit.
- Large-vault navigation evidence for Activity, Reports, Tools, and guarded Full Vault Restore.
- Strict evidence evaluation for timing, completion, focus, safety messaging, storage, network, observers, duplicate dispatch, device forks, and persistent caches.
- Exact inheritance of the v130 750 ms route-ready and 300 ms enhancement ceilings.
- Bounded v126 base-route replay: one normal attempt and at most one recovery attempt.
- Observable route-replay attempt and recovery counters.
- Synchronized v135 manifest, package identity, compatibility boot, roadmap, tests, workflows, release controls, implementation scope, security review, and documentation.

## Navigation reliability correction

The new keyboard-only contract exposed a race in which the v126 dispatcher could request Tools while the asynchronous base renderer had not completed its route handoff. v135 corrects this by re-querying the live route control and allowing one bounded recovery attempt. Two misses still enter the existing recovery shell.

This correction:

- does not retry indefinitely;
- does not hide a failed route;
- does not read or write financial data;
- adds no storage, network, observer, cache, service worker, or background process;
- preserves the existing recovery path.

## Unchanged behavior and boundaries

- No new household-finance capability.
- No new primary destination, Tools section, report destination, or workbook sheet.
- No user-agent sniffing or device-specific application fork.
- No persistent cache or service worker.
- No telemetry, analytics, API, backend, cloud adapter, or remote transmission.
- No transaction, import, restore, backup, close-history, export, Workflow Review, or Decision Gate schema change.
- `gringottsBudgetVault.latest` remains the only authoritative transaction-copy domain.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad writes remain backup-first, rollback-capable, and read-back verified.
- v126 remains the sole route, dispatcher, and observer owner.
- Stable v105 rescue remains available.
- Six primary destinations, six Tools sections, and the 43-sheet workbook cap remain unchanged.
- Startup limits remain 45 requests and 500,000 script bytes.
- Legitimate v130 runtime failures remain blocking evidence.

## Validation required for promotion

The exact final commit must pass:

- JavaScript syntax and strict TypeScript;
- release consistency and browser-free contracts;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard-only, touch, reduced-motion, overflow, target-size, and large-vault evidence;
- unchanged import, restore, export, privacy, recovery, and workbook contracts;
- accessibility, visual, and Lighthouse gates;
- public-repository security, full-history privacy, supply chain, and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Next governed direction

v136 — Architecture Baseline & Next-Horizon Decision remains directional. It should document the maintained architecture and decide whether to consolidate further, hold steady, or approve one narrowly evidenced capability. v135 does not authorize new product scope.
