export const RUNTIME_BUDGETS = Object.freeze({
  routeReadyMs: 750,
  enhancementMs: 300,
  maxEnhancementPasses: 3,
  maxObserverCallbacksPerRoute: 12,
  maxRegisteredReleases: 12,
  maxRegisteredActions: 40
});

const ACTION_TYPES = ['click', 'change', 'input'];
const ACTION_TYPE_SET = new Set(ACTION_TYPES);
const clean = (value) => String(value ?? '').trim();
const clock = (performanceApi) => typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();

function handled(value) {
  return value === true || value?.handled === true;
}

function eventDetail(target, detail) {
  if (typeof CustomEvent === 'function') target?.dispatchEvent?.(new CustomEvent(detail.name, { detail: detail.value }));
}

export function createActionDispatcher({ target = globalThis.document, performanceApi = globalThis.performance } = {}) {
  const registrations = new Map(ACTION_TYPES.map((type) => [type, []]));
  const listeners = new Map();
  let suspended = false;
  const metrics = {
    installed: false,
    suspended: false,
    registered: 0,
    dispatched: 0,
    handled: 0,
    errors: 0,
    lastAction: '',
    lastDurationMs: 0
  };

  function register(type, name, handler, priority = 0) {
    if (!registrations.has(type)) throw new Error(`Unsupported dispatcher event type: ${type}`);
    if (!clean(name) || typeof handler !== 'function') throw new Error('Dispatcher registrations require a unique name and handler.');
    const entries = registrations.get(type);
    if (entries.some((entry) => entry.name === name)) return false;
    entries.push({ name, handler, priority: Number(priority) || 0 });
    entries.sort((left, right) => right.priority - left.priority || left.name.localeCompare(right.name));
    metrics.registered += 1;
    return true;
  }

  function dispatch(type, event) {
    if (suspended) return false;
    metrics.dispatched += 1;
    const started = clock(performanceApi);
    for (const entry of registrations.get(type) || []) {
      try {
        if (!handled(entry.handler(event))) continue;
        metrics.handled += 1;
        metrics.lastAction = `${type}:${entry.name}`;
        metrics.lastDurationMs = Math.round((clock(performanceApi) - started) * 10) / 10;
        return true;
      } catch (error) {
        metrics.errors += 1;
        metrics.lastAction = `${type}:${entry.name}:error`;
        eventDetail(target, {
          name: 'gringotts:v126-action-error',
          value: { type, name: entry.name, message: error?.message || String(error) }
        });
        throw error;
      }
    }
    metrics.lastDurationMs = Math.round((clock(performanceApi) - started) * 10) / 10;
    return false;
  }

  function install() {
    if (metrics.installed) return api;
    ACTION_TYPES.forEach((type) => {
      const listener = (event) => dispatch(type, event);
      listeners.set(type, listener);
      target?.addEventListener?.(type, listener, true);
    });
    metrics.installed = true;
    return api;
  }

  function suspend() {
    suspended = true;
    metrics.suspended = true;
    return api;
  }

  function resume() {
    suspended = false;
    metrics.suspended = false;
    return api;
  }

  function dispose() {
    listeners.forEach((listener, type) => target?.removeEventListener?.(type, listener, true));
    listeners.clear();
    suspended = false;
    metrics.suspended = false;
    metrics.installed = false;
  }

  function snapshot() {
    return {
      ...metrics,
      handlers: Object.fromEntries([...registrations.entries()].map(([type, entries]) => [
        type,
        entries.map(({ name, priority }) => ({ name, priority }))
      ]))
    };
  }

  const api = { register, dispatch, install, suspend, resume, dispose, snapshot };
  return api;
}

function activeRoute(documentRef) {
  return documentRef?.querySelector?.('[data-tab].active')?.dataset?.tab || 'dashboard';
}

function activeSubroute(root) {
  const activeButton = root?.querySelector?.('[data-money-section].active, [data-activity-section].active, [data-tools-section].active');
  return activeButton?.dataset?.moneySection || activeButton?.dataset?.activitySection || activeButton?.dataset?.toolsSection || '';
}

export function createRuntimeCoordinator({
  documentRef = globalThis.document,
  rootProvider = () => documentRef?.getElementById?.('main'),
  performanceApi = globalThis.performance,
  budgets = RUNTIME_BUDGETS
} = {}) {
  const releases = new Map();
  const waiters = new Map();
  let observer = null;
  let installed = false;
  let queued = false;
  let running = false;
  let dirty = false;
  let cycle = 0;
  let routeStartedAt = 0;

  const state = {
    release: 'v126',
    route: 'dashboard',
    subroute: '',
    status: 'idle',
    cycle: 0,
    enhancementPasses: 0,
    observerCallbacks: 0,
    enhancementMs: 0,
    routeReadyMs: 0,
    readyAt: '',
    reason: '',
    observerOwner: 'v126-runtime-coordinator',
    actionOwner: 'v126-action-dispatcher',
    errors: []
  };

  function releaseList() {
    return [...releases.values()].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  }

  function budgetStatus() {
    return {
      ready: state.routeReadyMs <= budgets.routeReadyMs,
      enhancement: state.enhancementMs <= budgets.enhancementMs,
      passes: state.enhancementPasses <= budgets.maxEnhancementPasses,
      observerCallbacks: state.observerCallbacks <= budgets.maxObserverCallbacksPerRoute,
      releases: releases.size <= budgets.maxRegisteredReleases
    };
  }

  function snapshot() {
    return {
      ...state,
      installed,
      observerCount: observer ? 1 : 0,
      releaseCount: releases.size,
      budgets: { ...budgets },
      budget: budgetStatus(),
      releases: releaseList().map(({ enhance, ...entry }) => ({ ...entry }))
    };
  }

  function publish(name) {
    eventDetail(documentRef, { name, value: snapshot() });
  }

  function resolveReady() {
    for (const key of [state.route, '*']) {
      const pending = waiters.get(key) || [];
      waiters.delete(key);
      pending.forEach(({ resolve }) => resolve(snapshot()));
    }
  }

  function rejectReady(error) {
    for (const key of [state.route, '*']) {
      const pending = waiters.get(key) || [];
      waiters.delete(key);
      pending.forEach(({ reject }) => reject(error));
    }
  }

  function beginRoute(route = activeRoute(documentRef), reason = 'navigation') {
    cycle += 1;
    routeStartedAt = clock(performanceApi);
    state.route = clean(route) || 'dashboard';
    state.subroute = '';
    state.status = 'rendering';
    state.cycle = cycle;
    state.enhancementPasses = 0;
    state.observerCallbacks = 0;
    state.enhancementMs = 0;
    state.routeReadyMs = 0;
    state.readyAt = '';
    state.reason = reason;
    state.errors = [];
    publish('gringotts:v126-route-state');
    return cycle;
  }

  function registerRelease({ id, title, enhance, order = 0, storageDomains = [] }) {
    if (!clean(id) || typeof enhance !== 'function') throw new Error('Release registration requires id and enhance.');
    if (releases.has(id)) return releases.get(id);
    const entry = {
      id,
      title: clean(title) || id,
      enhance,
      order: Number(order) || 0,
      storageDomains: [...storageDomains],
      runs: 0,
      errors: 0,
      lastDurationMs: 0
    };
    releases.set(id, entry);
    return entry;
  }

  function alignRouteCycle(reason) {
    const route = activeRoute(documentRef);
    if (state.status === 'idle') beginRoute(route, reason || 'observed-render');
    else if (route !== state.route) beginRoute(route, reason || 'observed-route-change');
  }

  async function enhance(reason = 'rendered') {
    const root = rootProvider();
    if (!root) return snapshot();
    if (running) {
      dirty = true;
      return snapshot();
    }
    alignRouteCycle('observed-route-change');
    if (state.enhancementPasses >= budgets.maxEnhancementPasses) {
      state.status = 'ready';
      state.reason = 'stabilization-cap';
      publish('gringotts:v126-route-ready');
      resolveReady();
      return snapshot();
    }

    queued = false;
    running = true;
    dirty = false;
    state.status = 'enhancing';
    state.subroute = activeSubroute(root);
    state.enhancementPasses += 1;
    state.reason = reason;
    const started = clock(performanceApi);
    publish('gringotts:v126-route-state');

    try {
      for (const release of releaseList()) {
        const releaseStarted = clock(performanceApi);
        try {
          await release.enhance(root, {
            route: state.route,
            subroute: state.subroute,
            cycle: state.cycle,
            pass: state.enhancementPasses,
            reason
          });
          release.runs += 1;
        } catch (error) {
          release.errors += 1;
          throw new Error(`${release.id} enhancement failed: ${error?.message || String(error)}`);
        } finally {
          release.lastDurationMs = Math.round((clock(performanceApi) - releaseStarted) * 10) / 10;
        }
      }
      state.enhancementMs = Math.round((clock(performanceApi) - started) * 10) / 10;
      state.routeReadyMs = Math.round((clock(performanceApi) - routeStartedAt) * 10) / 10;
      state.status = 'ready';
      state.readyAt = new Date().toISOString();
      state.errors = [];
      publish('gringotts:v126-route-ready');
      resolveReady();
    } catch (error) {
      state.status = 'failed';
      state.errors = [{ message: error?.message || String(error), reason }];
      publish('gringotts:v126-route-failed');
      rejectReady(error);
      throw error;
    } finally {
      running = false;
      if (dirty && state.status !== 'failed' && state.enhancementPasses < budgets.maxEnhancementPasses) queue('stabilize');
    }
    return snapshot();
  }

  function queue(reason = 'mutation') {
    if (queued || state.status === 'failed') return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      enhance(reason).catch(() => {});
    });
  }

  function observe() {
    const root = rootProvider();
    if (!root || observer || typeof MutationObserver !== 'function') return;
    observer = new MutationObserver((records) => {
      state.observerCallbacks += 1;
      const route = activeRoute(documentRef);
      const baseRender = records.some((record) => record.target === root);

      if (route !== state.route) beginRoute(route, 'observed-route-change');
      else if (baseRender && state.status === 'ready') beginRoute(route, 'observed-base-render');

      if (running) {
        dirty = true;
        return;
      }
      if (state.status === 'failed') return;
      state.status = 'rendered';
      queue(baseRender ? 'base-rendered' : 'dom-stabilize');
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function install() {
    if (installed) return api;
    installed = true;
    observe();
    return api;
  }

  function enhanceExistingRoute() {
    if (state.status === 'idle') beginRoute(activeRoute(documentRef), 'boot-existing-route');
    state.status = 'rendered';
    return enhance('boot-existing-route');
  }

  function retry() {
    state.status = 'rendered';
    state.errors = [];
    state.enhancementPasses = 0;
    routeStartedAt = clock(performanceApi);
    return enhance('retry');
  }

  function whenReady(route = state.route) {
    if (state.status === 'ready' && (route === '*' || route === state.route)) return Promise.resolve(snapshot());
    return new Promise((resolve, reject) => {
      const key = route || '*';
      const pending = waiters.get(key) || [];
      pending.push({ resolve, reject });
      waiters.set(key, pending);
    });
  }

  function dispose() {
    observer?.disconnect();
    observer = null;
    installed = false;
  }

  const api = {
    registerRelease,
    beginRoute,
    enhance,
    enhanceExistingRoute,
    queue,
    retry,
    whenReady,
    install,
    dispose,
    snapshot,
    get observerCount() { return observer ? 1 : 0; },
    get route() { return state.route; },
    get status() { return state.status; }
  };
  return api;
}

function setGlobalObserver(value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'MutationObserver');
  try {
    Object.defineProperty(globalThis, 'MutationObserver', {
      configurable: true,
      writable: true,
      value
    });
  } catch {
    globalThis.MutationObserver = value;
  }
  return descriptor;
}

function restoreGlobalObserver(descriptor, fallback) {
  try {
    if (descriptor) Object.defineProperty(globalThis, 'MutationObserver', descriptor);
    else globalThis.MutationObserver = fallback;
  } catch {
    globalThis.MutationObserver = fallback;
  }
}

function wrapLegacyListener(listener, documentRef) {
  return function v126LegacyAction(event) {
    let immediateStopped = false;
    const original = event?.stopImmediatePropagation?.bind(event);
    let patched = false;
    if (event && original) {
      try {
        Object.defineProperty(event, 'stopImmediatePropagation', {
          configurable: true,
          value() {
            immediateStopped = true;
            original();
          }
        });
        patched = true;
      } catch {}
    }
    try {
      const result = listener.call(documentRef, event);
      return result === true || result?.handled === true || immediateStopped;
    } finally {
      if (patched) {
        try {
          Object.defineProperty(event, 'stopImmediatePropagation', {
            configurable: true,
            value: original
          });
        } catch {}
      }
    }
  };
}

export async function installLegacyLayer({
  name,
  dispatcher,
  priority = 0,
  documentRef = globalThis.document,
  install
}) {
  if (!name || !dispatcher || typeof install !== 'function') {
    throw new Error('Legacy layer installation requires a name, dispatcher, and install function.');
  }

  const originalAddEventListener = documentRef.addEventListener;
  const OriginalMutationObserver = globalThis.MutationObserver;
  const originalObserverDescriptor = setGlobalObserver(class V126SuppressedObserver {
    constructor(callback) {
      this.callback = callback;
      this.suppressedBy = 'v126-runtime-coordinator';
    }
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  });

  let capturedActions = 0;
  let delegatedListeners = 0;
  let sequence = 0;

  documentRef.addEventListener = function v126CaptureLegacyListener(type, listener, options) {
    if (ACTION_TYPE_SET.has(type) && typeof listener === 'function') {
      sequence += 1;
      dispatcher.register(type, `${name}:${type}:${sequence}`, wrapLegacyListener(listener, documentRef), priority);
      capturedActions += 1;
      return;
    }
    delegatedListeners += 1;
    return originalAddEventListener.call(documentRef, type, listener, options);
  };

  try {
    const result = await install();
    return {
      name,
      result,
      capturedActions,
      delegatedListeners,
      observerSuppressed: true
    };
  } finally {
    documentRef.addEventListener = originalAddEventListener;
    restoreGlobalObserver(originalObserverDescriptor, OriginalMutationObserver);
  }
}
