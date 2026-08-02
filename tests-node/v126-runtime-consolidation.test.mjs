import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RUNTIME_BUDGETS,
  createActionDispatcher,
  createRuntimeCoordinator
} from '../src/v126/runtime.js';
import {
  STORAGE_INVENTORY,
  storageInventorySummary,
  validateStorageInventory,
  ROADMAP_HORIZON,
  validateRoadmapHorizon
} from '../src/v126/release.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

class FakeDocument extends EventTarget {
  constructor() {
    super();
    this.root = {
      querySelector() { return null; }
    };
  }
  getElementById(id) { return id === 'main' ? this.root : null; }
  querySelector() { return null; }
}

test('v126 dispatcher provides one priority-ordered action owner', () => {
  const target = new FakeDocument();
  const calls = [];
  const dispatcher = createActionDispatcher({ target, performanceApi: { now: () => 1 } });
  assert.equal(dispatcher.register('click', 'legacy', () => { calls.push('legacy'); return true; }, 10), true);
  assert.equal(dispatcher.register('click', 'current', () => { calls.push('current'); return true; }, 100), true);
  assert.equal(dispatcher.register('click', 'current', () => true, 100), false);
  dispatcher.install();
  target.dispatchEvent(new Event('click'));
  assert.deepEqual(calls, ['current']);
  const snapshot = dispatcher.snapshot();
  assert.equal(snapshot.installed, true);
  assert.equal(snapshot.registered, 2);
  assert.equal(snapshot.handled, 1);
  assert.equal(snapshot.lastAction, 'click:current');
  dispatcher.dispose();
  assert.equal(dispatcher.snapshot().installed, false);
});

test('v126 coordinator runs registered release enhancers in deterministic order', async () => {
  const target = new FakeDocument();
  let now = 0;
  const calls = [];
  const coordinator = createRuntimeCoordinator({
    documentRef: target,
    rootProvider: () => target.root,
    performanceApi: { now: () => ++now }
  });
  coordinator.registerRelease({ id: 'v125', order: 125, enhance: () => calls.push('v125') });
  coordinator.registerRelease({ id: 'v118', order: 118, enhance: () => calls.push('v118') });
  coordinator.registerRelease({ id: 'v126', order: 126, enhance: () => calls.push('v126') });
  await coordinator.enhanceExistingRoute();
  assert.deepEqual(calls, ['v118', 'v125', 'v126']);
  const snapshot = coordinator.snapshot();
  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.releaseCount, 3);
  assert.equal(snapshot.observerOwner, 'v126-runtime-coordinator');
  assert.equal(snapshot.actionOwner, 'v126-action-dispatcher');
  assert.equal(snapshot.enhancementPasses, 1);
  assert.equal(snapshot.budget.passes, true);
});

test('v126 storage inventory preserves one authoritative transaction-copy domain', () => {
  assert.equal(validateStorageInventory(), true);
  const summary = storageInventorySummary();
  assert.deepEqual(summary.authoritativeKeys, ['gringottsBudgetVault.latest']);
  assert.deepEqual(summary.transactionCopyDomains, ['gringottsBudgetVault.latest']);
  assert.ok(summary.immutableHistoryKeys.includes('gringottsMonthClose.v1'));
  assert.ok(STORAGE_INVENTORY.some((entry) => entry.key === 'gringottsImportHistory.v1'));
  assert.ok(STORAGE_INVENTORY.every((entry) => entry.recovery));
});

test('v126 roadmap and runtime budgets retain the reliability-first feature freeze', () => {
  assert.equal(validateRoadmapHorizon(), true);
  assert.equal(ROADMAP_HORIZON[0].version, 'v126');
  assert.equal(ROADMAP_HORIZON[0].status, 'current');
  assert.match(ROADMAP_HORIZON[0].title, /Runtime Consolidation/);
  assert.equal(RUNTIME_BUDGETS.maxEnhancementPasses, 3);
  assert.equal(RUNTIME_BUDGETS.maxRegisteredActions, 40);
});

test('v126 boot suppresses historical observers and owns current downloads', () => {
  const boot = read('src/boot-v126.js');
  const runtime = read('src/v126/runtime.js');
  const release = read('src/v126/release.js');
  assert.match(boot, /createActionDispatcher/);
  assert.match(boot, /createRuntimeCoordinator/);
  assert.match(boot, /installLegacyLayer/);
  assert.match(boot, /v126-route-lifecycle/);
  assert.match(runtime, /V126SuppressedObserver/);
  assert.match(runtime, /dispatcher\.register/);
  assert.match(release, /v126-current-downloads/);
  assert.match(release, /43-sheet reliability-capped Vault Workbook/);
  assert.match(release, /V126_CSS/);
  assert.doesNotMatch(release, /new MutationObserver/);
});
