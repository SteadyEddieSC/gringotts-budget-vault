import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { V130_PERFORMANCE_BUDGETS, evaluatePerformanceBudget } from '../src/v130/performance-contracts.js';

const passing = Object.freeze({ routeReadyMs:250, enhancementMs:90, enhancementPasses:2, observerCallbacks:4,
  registeredReleases:8, registeredActions:24, networkRequests:40, scriptBytes:420_000, workbookSheets:43,
  runtimeObservers:1, primaryDestinations:6, dispatcherOwned:true, coordinatorOwned:true });

test('retains the v126 and Lighthouse ceilings as strict v130 contracts', () => {
  assert.deepEqual(V130_PERFORMANCE_BUDGETS, {
    routeReadyMs:750, enhancementMs:300, maxEnhancementPasses:3, maxObserverCallbacksPerRoute:12,
    maxRegisteredReleases:12, maxRegisteredActions:40, maxNetworkRequests:45, maxScriptBytes:500_000,
    maxWorkbookSheets:43, maxRuntimeObservers:1, maxPrimaryDestinations:6, maxSessionSamples:12
  });
});

test('accepts a runtime snapshot within every performance and ownership budget', () => {
  const result = evaluatePerformanceBudget(passing);
  assert.equal(result.release,'v130');
  assert.equal(result.ok,true);
  assert.equal(result.failures.length,0);
  assert.equal(result.checks.length,13);
  assert.ok(result.checks.every((check) => check.ok));
});

test('reports every exceeded budget without mutating the input', () => {
  const input = { ...passing, routeReadyMs:751, observerCallbacks:13, networkRequests:46, scriptBytes:500_001, dispatcherOwned:false };
  const before = structuredClone(input);
  const result = evaluatePerformanceBudget(input);
  assert.equal(result.ok,false);
  assert.deepEqual(input,before);
  assert.deepEqual(result.failures,[
    'routeReadyMs exceeded its v130 contract.', 'observerCallbacks exceeded its v130 contract.',
    'networkRequests exceeded its v130 contract.', 'scriptBytes exceeded its v130 contract.',
    'dispatcherOwned exceeded its v130 contract.'
  ]);
});

test('rejects malformed negative or non-finite measurements', () => {
  assert.throws(() => evaluatePerformanceBudget({ ...passing, enhancementMs:-1 }),/finite non-negative number/i);
  assert.throws(() => evaluatePerformanceBudget({ ...passing, registeredActions:Number.NaN }),/finite non-negative number/i);
});

test('v130 sources remain local, startup-light, memory-only, and free of financial-data reads', () => {
  const contracts = fs.readFileSync(new URL('../src/v130/performance-contracts.js',import.meta.url),'utf8');
  const diagnostics = fs.readFileSync(new URL('../src/v130/runtime-health.js',import.meta.url),'utf8');
  const integration = fs.readFileSync(new URL('../src/v129/integration.js',import.meta.url),'utf8');
  const boot = fs.readFileSync(new URL('../src/boot-v130.js',import.meta.url),'utf8');
  for (const [label,source] of [['contracts',contracts],['diagnostics',diagnostics],['integration',integration],['boot',boot]]) {
    assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|document\.cookie)\b/,`${label} must not add network or persistence`);
    assert.doesNotMatch(source,/gringottsBudgetVault\.latest|merchant_name|account_id|transaction_id/,`${label} must not read financial data`);
  }
  assert.match(integration,/dispatcher\.register\('click', 'v129-workflow-review-route'/);
  assert.match(integration,/registerWithCoordinator = true/);
  assert.doesNotMatch(integration,/window\.addEventListener\('click'/);
  assert.match(boot,/import '\.\/boot-v128\.js\?v=130base2'/);
  assert.doesNotMatch(boot,/^import .*v129\/integration|^import .*v130\/runtime-health|^import .*v130\/performance-contracts/gm);
  assert.match(boot,/import\('\.\/v129\/integration\.js\?v=130workflow2'\)/);
  assert.match(boot,/import\('\.\/v130\/runtime-health\.js\?v=130diagnostics2'\)/);
  assert.match(boot,/workflowIntegrationLazy:true/);
  assert.match(boot,/diagnosticsLazy:true/);
  assert.match(boot,/maxSessionSamples:12/);
  assert.match(diagnostics,/renderV130Diagnostics/);
  assert.doesNotMatch(diagnostics,/registerRelease|new MutationObserver|addEventListener\('gringotts:v126-route-ready'/);
  assert.doesNotMatch(boot,/boot-v129/);
});
