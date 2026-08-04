export const V130_PERFORMANCE_BUDGETS = Object.freeze({
  routeReadyMs: 750,
  enhancementMs: 300,
  maxEnhancementPasses: 3,
  maxObserverCallbacksPerRoute: 12,
  maxRegisteredReleases: 12,
  maxRegisteredActions: 40,
  maxNetworkRequests: 45,
  maxScriptBytes: 500_000,
  maxWorkbookSheets: 43,
  maxRuntimeObservers: 1,
  maxPrimaryDestinations: 6,
  maxSessionSamples: 12
});

function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a finite non-negative number.`);
  return value;
}

function numericCheck(name, actual, limit, unit) {
  return Object.freeze({ name, actual: finiteNonNegative(actual, name), limit, ok: actual <= limit, unit });
}

function booleanCheck(name, actual) {
  return Object.freeze({ name, actual, limit: true, ok: actual === true, unit: 'boolean' });
}

export function evaluatePerformanceBudget(input) {
  const checks = [
    numericCheck('routeReadyMs', input.routeReadyMs, V130_PERFORMANCE_BUDGETS.routeReadyMs, 'ms'),
    numericCheck('enhancementMs', input.enhancementMs, V130_PERFORMANCE_BUDGETS.enhancementMs, 'ms'),
    numericCheck('enhancementPasses', input.enhancementPasses, V130_PERFORMANCE_BUDGETS.maxEnhancementPasses, 'count'),
    numericCheck('observerCallbacks', input.observerCallbacks, V130_PERFORMANCE_BUDGETS.maxObserverCallbacksPerRoute, 'count'),
    numericCheck('registeredReleases', input.registeredReleases, V130_PERFORMANCE_BUDGETS.maxRegisteredReleases, 'count'),
    numericCheck('registeredActions', input.registeredActions, V130_PERFORMANCE_BUDGETS.maxRegisteredActions, 'count'),
    numericCheck('networkRequests', input.networkRequests, V130_PERFORMANCE_BUDGETS.maxNetworkRequests, 'count'),
    numericCheck('scriptBytes', input.scriptBytes, V130_PERFORMANCE_BUDGETS.maxScriptBytes, 'bytes'),
    numericCheck('workbookSheets', input.workbookSheets, V130_PERFORMANCE_BUDGETS.maxWorkbookSheets, 'count'),
    numericCheck('runtimeObservers', input.runtimeObservers, V130_PERFORMANCE_BUDGETS.maxRuntimeObservers, 'count'),
    numericCheck('primaryDestinations', input.primaryDestinations, V130_PERFORMANCE_BUDGETS.maxPrimaryDestinations, 'count'),
    booleanCheck('dispatcherOwned', input.dispatcherOwned),
    booleanCheck('coordinatorOwned', input.coordinatorOwned)
  ];
  const failures = checks.filter((check) => !check.ok).map((check) => `${check.name} exceeded its v130 contract.`);
  return Object.freeze({
    release: 'v130',
    ok: failures.length === 0,
    checks: Object.freeze(checks),
    failures: Object.freeze(failures),
    budgets: V130_PERFORMANCE_BUDGETS
  });
}
