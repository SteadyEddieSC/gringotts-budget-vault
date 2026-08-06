# v135 Security Review — Cross-Device & Low-Resource Resilience

## Review conclusion

v135 is a maintenance-and-validation release. It adds no financial capability, remote service, persistent data domain, background worker, device-specific application path, or automatic action. The release remains local-first and preserves the existing storage, import, restore, export, recovery, and runtime authority boundaries.

## Threat-boundary changes

No trust boundary is expanded.

- Production remains a static browser application.
- Cloudflare continues to serve application assets only.
- No financial data, resilience evidence, synthetic fixture, credential, token, or identifier is transmitted remotely.
- No backend, API, analytics, telemetry, cloud adapter, cache layer, or service worker is introduced.
- The v135 resilience modules are absent from normal startup and are loaded only by protected tests.

## Synthetic-data review

The large-vault generator is deterministic and fictional.

- Default size: 1,200 transactions.
- Maximum test size: 2,000 transactions.
- Accounts, owners, merchants, IDs, dates, categories, and amounts are synthetic.
- No production export, uploaded fixture, screenshot, artifact, trace, or log should contain household data.
- The generator has no browser-storage, network, cookie, IndexedDB, cache, service-worker, or DOM dependency.

## Device and privacy review

- No user-agent sniffing is permitted.
- No device fingerprinting or capability telemetry is collected.
- Profiles are test-owned declarations, not production branching rules.
- Reduced-motion detection is exercised through the browser's standard media preference in tests only.
- No reduced-function or reduced-safety mode is created for slower devices.

## Runtime hardening review

v135 found a race between the v126 dispatcher and the asynchronous base route renderer during keyboard navigation. The correction is intentionally narrow:

- one normal replay attempt;
- at most one recovery attempt;
- current route button re-query on every attempt;
- two animation-frame waits per attempt;
- observable attempt and recovery counters on the existing v126 registry;
- the existing recovery shell after two misses.

The replay path does not read or write financial data and does not use storage, network, observers, timers, caches, service workers, or background work.

## Preserved data authority

- `gringottsBudgetVault.latest` remains the sole authoritative transaction-copy domain.
- Full Vault Restore remains a separate guarded task.
- Empty transaction arrays remain blocked from full restore.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable close history remains unchanged.
- Workflow Review and Decision Gate remain manual and local.
- v134 export privacy modes and no-retry behavior remain unchanged.

## Denial-of-service and resource review

- Synthetic fixture generation is hard-capped at 2,000 transactions.
- Evidence measurements must be finite and non-negative.
- Route replay is capped at two attempts.
- v130 timing, observer, action, request, script-byte, destination, workbook, and session-history limits remain authoritative.
- No persistent cache is introduced to hide slow behavior.
- Legitimate runtime-budget failure remains blocking evidence.

## Supply-chain and repository controls

Promotion still requires:

- locked npm dependencies and `npm ci --ignore-scripts`;
- full-SHA-pinned GitHub Actions;
- Dependabot, supply-chain, CodeQL, and public-repository security gates;
- full-history privacy and secret scanning;
- strict TypeScript and browser-free tests before browser installation;
- Chromium, Firefox, WebKit, Android, iPad, and iPhone validation;
- accessibility, visual, and Lighthouse gates;
- exact-head Cloudflare preview and zero unresolved review threads.

## Residual risks

- Browser emulation is not a substitute for every physical low-memory device. The governed profiles provide repeatable regression evidence, not a claim of universal hardware certification.
- The application remains browser-local; users must continue to manage backups and browser-profile continuity.
- Synthetic large-vault evidence cannot reproduce every unusual real-world transaction shape. Existing import, restore, longevity, and schema tests remain necessary complements.

## Security decision

Acceptable for promotion only when the exact final head passes every protected workflow and the startup request and 500,000-byte script ceilings remain unchanged. No exception or budget waiver is authorized.
