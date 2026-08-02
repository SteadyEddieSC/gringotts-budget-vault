export const ROUTE_BUDGETS = Object.freeze({
  renderMs: 500,
  enhancementMs: 300,
  totalReadyMs: 750,
  maxEnhancementPasses: 3,
  maxObserverCallbacksPerRender: 12,
  maxRegisteredReleases: 12,
  maxRegisteredActions: 40
});

const EVENT_TYPES = ['click', 'change', 'input'];

function now(performanceApi) {
  return typeof performanceApi?.now === 'function' ? performanceApi.now() : Date.now();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeHandled(result) {
  return result === true || result?.handled === true;
}

export function createActionDispatcher({ target, performanceApi = globalThis.performance } = {}) {
  const eventTarget = target || globalThis.document;
  const handlers = new Map(EVENT_TYPES.map((type) => [type, []]));
  const listeners = new Map();
  const metrics = {
    installed: false,
    dispatched: 0,
    handled: 0,
    errors: 0,
    registered: 0,
    lastAction: null,
    lastDurationMs: 0
  };

  function register(type, name, handler, { priority = 0 } = {}) {
    if (!handlers.has(type)) throw new Error(`Unsupported action event type: ${type}`);
    if (!name || typeof handler !== 'function') throw new Error('Action registration requires a name and handler.');
    const list = handlers.get(type);
    const existing = list.find((entry) => entry.name === name);
    if (existing) return () => unregister(type, name);
    list.push({ name, handler, priority: Number(priority) || 0 });
    list.sort((left, right) => right.priority - left.priority || left.name.localeCompare(right.name));
    metrics.registered += 1;
    return () => unregister(type, name);
  }

  function unregister(type, name) {
    const list = handlers.get(type);
    if (!list) return false;
    const index = list.findIndex((entry) => entry.name === name);
    if (index < 0) return false;
    list.splice(index, 1);
    metrics.registered = Math.max(0, metrics.registered - 1);
    return true;
  }

  function dispatch(type, event) {
    metrics.dispatched += 1;
    const started = now(performanceApi);
    for (const entry of handlers.get(type) || []) {
      try {
        const result = entry.handler(event);
        if (!normalizeHandled(result)) continue;
        metrics.handled += 1;
        metrics.lastAction = `${type}:${entry.name}`;
        metrics.lastDurationMs = Math.round((now(performanceApi) - started) * 10) / 10;
        return true;
      } catch (error) {
        metrics.errors += 1;
        metrics.lastAction = `${type}:${entry.name}:error`;
        eventTarget?.dispatchEvent?.(new CustomEvent('gringotts:v126-action-error', {
          detail: { type, name: entry.name, message: error?.message || String(error) }
        }));
        throw error;
      }
    }
    metrics.lastDurationMs = Math.round((now(performanceApi) - started) * 10) / 10;
    return false;
  }

  function install() {
    if (metrics.installed || !eventTarget?.addEventListener) return api;
    EVENT_TYPES.forEach((type) => {
      const listener = (event) => dispatch(type, event);
      listeners.set(type, listener);
      eventTarget.addEventListener(type, listener, true);
    });
    metrics.installed = true;
    return api;
  }

  function dispose() {
    if (!metrics.installed || !eventTarget?.removeEventListener) return;
    listeners.forEach((listener, type) => eventTarget.removeEventListener(type, listener, true));
    listeners.clear();
    metrics.installed = false;
  }

  function snapshot() {
    return {
      ...metrics,
      handlers: Object.fromEntries([...handlers.entries()].map(([type, entries]) => [
        type,
        entries.map(({ name, priority }) => ({ name, priority }))
      ]))
    };
  }

  const api = { register, unregister, install, dispose, dispatch, snapshot };
  return api;
}

export function createRuntimeCoordinator({
  target,
  rootProvider = () => globalThis.document?.getElementById('main'),
  performanceApi = globalThis.performance,
  budgets = ROUTE_BUDGETS
} = {}) {
  const eventTarget = target || globalThis.document;
  const releases = new Map();
  const waiters = new Map();
  let observer = null;
  let installed = false;
  let enhancementQueued = false;
  let enhancing = false;
  let dirty = false;
  let cycle = 0;

  const state = {
    release: 'v126',
    route: 'dashboard',
    subroute: '',
    status: 'idle',
    renderToken: 0,
    renderMs: 0,
    enhancementMs: 0,
    totalReadyMs: 0,
    enhancementPasses: 0,
    observerCallbacks: 0,
    observerOwner: 'v126-runtime-coordinator',
    actionOwner: 'v126-action-dispatcher',
    readyAt: null,
    lastReason: '',
    errors: [],
    budget: {}
  };

  function budgetStatus() {
    return {
      render: state.renderMs <= budgets.renderMs,
      enhancement: state.enhancementMs <= budgets.enhancementMs,
      totalReady: state.totalReadyMs <= budgets.totalReadyMs,
      passes: state.enhancementPasses <= budgets.maxEnhancementPasses,
      observers: state.observerCallbacks <= budgets.maxObserverCallbacksPerRender,
      releases: releases.size <= budgets.maxRegisteredReleases
    };
  }

  function publish(name, extra = {}) {
    state.budget = budgetStatus();
    eventTarget?.dispatchEvent?.(new CustomEvent(name, { detail: { ...snapshot(), ...extra } }));
  }

  function resolveWaiters() {
    const keys = [state.route, '*'];
    keys.forEach((key) => {
      const pending = waiters.get(key) || [];
      waiters.delete(key);
      pending.forEach(({ resolve }) => resolve(snapshot()));
    });
  }

  function rejectWaiters(error) {
    const keys = [state.route, '*'];
    keys.forEach((key) => {
      const pending = waiters.get(key) || [];
      waiters.delete(key);
      pending.forEach(({ reject }) => reject(error));
    });
  }

  function registerRelease(entry) {
    if (!entry?.id || typeof entry.enhance !== 'function') {
      throw new Error('Release registration requires an id and enhance function.');
    }
    if (releases.has(entry.id)) return releases.get(entry.id);
    const record = {
      id: entry.id,
      title: entry.title || entry.id,
      enhance: entry.enhance,
      storageDomains: Array.isArray(entry.storageDomains) ? [...entry.storageDomains] : [],
      order: Number(entry.order) || 0,
      runs: 0,
      errors: 0,
      lastDurationMs: 0
    };
    releases.set(record.id, record);
    return record;
  }

  function releaseList() {
    return [...releases.values()].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  }

  async function runEnhancers(reason = 'render') {
    const root = rootProvider();
    if (!root || enhancing) {
      dirty = true;
      return snapshot();
    }
    if (state.enhancementPasses >= budgets.maxEnhancementPasses) {
      state.status = 'ready';
      state.lastReason = 'stabilization-cap';
      publish('gringotts:v126-route-ready');
      resolveWaiters();
      return snapshot();
    }

    enhancementQueued = false;
    enhancing = true;
    dirty = false;
    state.status = 'enhancing';
    state.lastReason = reason;
    state.enhancementPasses += 1;
    const started = now(performanceApi);
    publish('gringotts:v126-route-state');

    try {
      for (const release of releaseList()) {
        const releaseStarted = now(performanceApi);
        await release.enhance(root, {
          route: state.route,
          subroute: state.subroute,
          renderToken: state.renderToken,
          pass: state.enhancementPasses,
          reason
        });
        release.runs += 1;
        release.lastDurationMs = Math.round((now(performanceApi) - releaseStarted) * 10) / 10;
      }
      state.enhancementMs = Math.round((now(performanceApi) - started) * 10) / 10;
      state.totalReadyMs = Math.round((state.renderMs + state.enhancementMs) * 10) / 10;
      state.status = 'ready';
      state.readyAt = new Date().toISOString();
      state.errors = [];
      publish('gringotts:v126-route-ready');
      resolveWaiters();
    } catch (error) {
      const activeRelease = releaseList().find((release) => release.lastDurationMs === 0 && release.runs === 0);
      if (activeRelease) activeRelease.errors += 1;
      state.status = 'failed';
      state.errors = [{ message: error?.message || String(error), reason }];
      publish('gringotts:v126-route-failed');
      rejectWaiters(error);
      throw error;
    } finally {
      enhancing = false;
      if (dirty && state.status !== 'failed' && state.enhancementPasses < budgets.maxEnhancementPasses) {
        queueEnhancement('stabilize');
      }
    }
    return snapshot();
  }

  function queueEnhancement(reason = 'mutation') {
    if (enhancementQueued || state.status === 'failed') return;
    enhancementQueued = true;
    queueMicrotask(() => runEnhancers(reason).catch(() => {}));
  }

  function handleRenderStart(event) {
    cycle += 1;
    const detail = event?.detail || {};
    state.route = detail.route || state.route || 'dashboard';
    state.subroute = detail.subroute || '';
    state.renderToken = Number(detail.renderToken) || cycle;
    state.status = 'rendering';
    state.renderMs = 0;
    state.enhancementMs = 0;
    state.totalReadyMs = 0;
    state.enhancementPasses = 0;
    state.observerCallbacks = 0;
    state.readyAt = null;
    state.errors = [];
    state.lastReason = 'render-start';
    publish('gringotts:v126-route-state');
  }

  function handleRendered(event) {
    const detail = event?.detail || {};
    state.route = detail.route || state.route;
    state.subroute = detail.subroute || state.subroute;
    state.renderToken = Number(detail.renderToken) || state.renderToken || cycle;
    state.renderMs = Number(detail.renderMs) || 0;
    state.status = 'rendered';
    state.lastReason = 'rendered';
    publish('gringotts:v126-route-state');
    queueEnhancement('route-rendered');
  }

  function installObserver() {
    const root = rootProvider();
    if (!root || observer || typeof MutationObserver !== 'function') return;
    observer = new MutationObserver(() => {
      state.observerCallbacks += 1;
      if (enhancing) dirty = true;
      else if (state.status === 'ready' || state.status === 'rendered') queueEnhancement('mutation');
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function install() {
    if (installed) return api;
    installed = true;
    eventTarget?.addEventListener?.('gringotts:route-render-start', handleRenderStart);
    eventTarget?.addEventListener?.('gringotts:route-rendered', handleRendered);
    installObserver();
    return api;
  }

  function dispose() {
    if (!installed) return;
    eventTarget?.removeEventListener?.('gringotts:route-render-start', handleRenderStart);
    eventTarget?.removeEventListener?.('gringotts:route-rendered', handleRendered);
    observer?.disconnect();
    observer = null;
    installed = false;
  }

  function retry(reason = 'manual-retry') {
    state.status = 'rendered';
    state.errors = [];
    state.enhancementPasses = 0;
    return runEnhancers(reason);
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

  function snapshot() {
    return {
      ...clone(state),
      installed,
      releaseCount: releases.size,
      releases: releaseList().map(({ enhance, ...release }) => ({ ...release })),
      budgets: { ...budgets }
    };
  }

  const api = {
    registerRelease,
    install,
    dispose,
    retry,
    whenReady,
    runEnhancers,
    queueEnhancement,
    snapshot,
    get observerCount() { return observer ? 1 : 0; },
    get status() { return state.status; },
    get route() { return state.route; }
  };
  return api;
}
