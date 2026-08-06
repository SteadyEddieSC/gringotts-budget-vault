# v135 Implementation Scope — Cross-Device & Low-Resource Resilience

## In scope

- strict TypeScript and browser-compatible resilience contracts;
- exactly six governed validation profiles covering Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard-only, touch, reduced-motion, responsive-overflow, and deterministic large-vault evidence;
- exact inheritance of the v130 route-ready and enhancement ceilings;
- a deterministic fictional 1,200-transaction vault fixture with a hard 2,000-transaction test cap;
- finite, non-negative measurement validation and explicit pass/fail evidence;
- minimum 44-pixel interactive targets and no more than two pixels of root overflow;
- zero unexpected storage writes, remote requests, observer additions, duplicate dispatches, persistent caches, or device-specific forks;
- visible safety messaging and focus evidence;
- bounded v126 base-route replay hardening with one initial attempt and at most one recovery attempt;
- observable route-replay attempt and recovery counters;
- synchronized manifest, compatibility boot, package identity, roadmap, test helpers, parser workflow, release consistency, repository security, release notes, security review, and maintained documentation.

## Explicitly out of scope

- new household-finance functionality;
- new primary destination, Tools section, report destination, or workbook sheet;
- user-agent sniffing or device-specific application code;
- alternate phone, tablet, reduced-motion, or low-resource product modes;
- reduced safety messaging or hidden reduced-function behavior;
- localStorage, sessionStorage, IndexedDB, cookies, cache storage, service worker, telemetry, analytics, endpoint, cloud adapter, backend, or new persistent store;
- production loading of the v135 resilience-contract module;
- weakening or bypassing a legitimate v130 runtime failure;
- automatic cleanup, migration, restore, export, financial action, or Decision Gate approval;
- changes to transaction, import, restore, backup, close-history, Workflow Review, Decision Gate, or export schemas.

## Governed profiles

1. Desktop keyboard completion — Chromium, Firefox, and desktop WebKit.
2. Android touch completion — Android Chromium.
3. iPad touch completion — iPad WebKit.
4. iPhone touch completion — iPhone WebKit.
5. Reduced-motion completion — all six supported projects.
6. Large-vault low-resource completion — Chromium, Android Chromium, and iPad WebKit.

## Large-vault contract

The deterministic fixture:

- contains exactly 1,200 transactions by default;
- rejects counts below 1 or above 2,000;
- uses only fictional IDs, accounts, owners, merchants, categories, dates, and amounts;
- is reproducible byte-for-byte from the same generator version;
- uses the existing supported vault shape;
- is stored only in the test browser's local storage for the duration of the test;
- is never derived from or combined with real household data.

## Route-replay contract

The v126 primary-route lifecycle may:

1. invoke the existing base route renderer;
2. wait two animation frames;
3. accept success when the requested route is active;
4. make at most one additional bounded attempt when the first renderer handoff misses;
5. record the number of attempts and any recovery;
6. enter the existing recovery shell if the route still does not activate.

The replay path performs no data, storage, network, observer, cache, service-worker, or financial operation.

## Preserved authority and budgets

- `gringottsBudgetVault.latest` remains the only authoritative transaction-copy domain;
- Full Vault Restore remains separate and rejects empty transaction arrays;
- broad writes remain backup-first, read-back verified, and rollback-capable;
- immutable close history and stable v105 rescue remain unchanged;
- v126 remains sole route, action-dispatcher, and observer owner;
- six primary destinations and six Tools sections remain unchanged;
- workbook sheets remain capped at 43;
- startup requests remain capped at 45;
- startup script transfer remains capped at 500,000 bytes;
- route-ready remains capped at 750 ms;
- enhancement work remains capped at 300 ms;
- legitimate v130 `runtime-blocked` evidence remains authoritative.

## Promotion contract

The exact final head must pass:

- JavaScript syntax, strict TypeScript, and release consistency;
- browser-free profile, fixture, evidence, and bounded replay tests;
- keyboard-only completion in Chromium, Firefox, and desktop WebKit;
- touch completion in Android Chromium, iPad WebKit, and iPhone WebKit;
- reduced-motion evidence in all six supported projects;
- large-vault evidence on all governed low-resource projects;
- horizontal-overflow, minimum-target, safety-message, focus, observer, storage, request, and duplicate-dispatch checks;
- unchanged import, restore, backup, export, privacy, close-history, and Decision Gate contracts;
- accessibility, visual, and Lighthouse budgets;
- public-repository security, full-history privacy, supply chain, and CodeQL;
- a successful exact-head Cloudflare preview and post-merge live smoke;
- zero unresolved review threads.
