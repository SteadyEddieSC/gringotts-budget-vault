import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LARGE_VAULT_TRANSACTION_COUNT,
  MAX_SYNTHETIC_TRANSACTIONS,
  RESILIENCE_PROFILES,
  createSyntheticLargeVault,
  evaluateResilienceEvidence,
  getResilienceProfile,
  validateResilienceProfiles,
  validateSyntheticLargeVault
} from '../src/v135/resilience-contracts.js';
import { V130_PERFORMANCE_BUDGETS } from '../src/v130/performance-contracts.js';

function validEvidence(profile) {
  return {
    completedWorkflows:6,
    expectedWorkflows:6,
    routeReadyMs:500,
    enhancementMs:200,
    horizontalOverflowPx:0,
    minimumTargetPx:44,
    storageWriteDelta:0,
    networkRequestDelta:0,
    observerDelta:0,
    duplicateDispatches:0,
    syntheticTransactionCount:profile.syntheticTransactionCount,
    safetyMessagingVisible:true,
    focusVisible:true,
    reducedMotionRespected:true,
    deviceForkUsed:false,
    persistentCacheUsed:false
  };
}

test('publishes six guarded profiles covering every supported browser project', () => {
  assert.equal(validateResilienceProfiles(),true);
  assert.equal(RESILIENCE_PROFILES.length,6);
  assert.deepEqual(
    [...new Set(RESILIENCE_PROFILES.flatMap((profile) => profile.projects))].sort(),
    ['chromium','firefox','mobile-chromium','mobile-webkit','tablet','webkit']
  );
  for (const profile of RESILIENCE_PROFILES) {
    assert.equal(profile.maxRouteReadyMs,V130_PERFORMANCE_BUDGETS.routeReadyMs);
    assert.equal(profile.maxEnhancementMs,V130_PERFORMANCE_BUDGETS.enhancementMs);
    assert.equal(profile.deviceForkAllowed,false);
    assert.equal(profile.persistentCacheAllowed,false);
    assert.equal(profile.safetyMessagingRequired,true);
  }
  assert.equal(getResilienceProfile('reduced-motion').projects.length,6);
  assert.equal(getResilienceProfile('large-vault-low-resource').syntheticTransactionCount,LARGE_VAULT_TRANSACTION_COUNT);
});

test('creates a deterministic bounded synthetic large vault using only fictional identities', () => {
  const first = createSyntheticLargeVault();
  const second = createSyntheticLargeVault();
  assert.equal(validateSyntheticLargeVault(first,LARGE_VAULT_TRANSACTION_COUNT),true);
  assert.deepEqual(first,second);
  assert.equal(first.transactions.length,1_200);
  assert.equal(new Set(first.transactions.map((transaction) => transaction.id)).size,1_200);
  assert.ok(first.transactions.every((transaction) => transaction.account.startsWith('Synthetic Account ')));
  assert.ok(first.transactions.every((transaction) => transaction.owner.startsWith('Synthetic Owner ')));
  assert.throws(() => createSyntheticLargeVault(0),/between 1 and/);
  assert.throws(() => createSyntheticLargeVault(MAX_SYNTHETIC_TRANSACTIONS + 1),/between 1 and/);
  assert.throws(() => createSyntheticLargeVault(1.5),/whole number/);
});

test('accepts complete evidence for every profile without weakening v130 authority', () => {
  for (const profile of RESILIENCE_PROFILES) {
    const result = evaluateResilienceEvidence(profile.id,validEvidence(profile));
    assert.equal(result.release,'v135');
    assert.equal(result.profileId,profile.id);
    assert.equal(result.ok,true);
    assert.deepEqual(result.failures,[]);
  }
});

test('reports every unsafe or incomplete resilience condition explicitly', () => {
  const profile = getResilienceProfile('reduced-motion');
  const result = evaluateResilienceEvidence(profile.id,{
    ...validEvidence(profile),
    completedWorkflows:5,
    routeReadyMs:751,
    enhancementMs:301,
    horizontalOverflowPx:3,
    minimumTargetPx:43,
    storageWriteDelta:1,
    networkRequestDelta:1,
    observerDelta:1,
    duplicateDispatches:1,
    safetyMessagingVisible:false,
    focusVisible:false,
    reducedMotionRespected:false,
    deviceForkUsed:true,
    persistentCacheUsed:true,
    syntheticTransactionCount:1
  });
  assert.equal(result.ok,false);
  assert.equal(result.failures.length,15);
  assert.ok(result.failures.some((failure) => failure.includes('retained v130 ceiling')));
  assert.ok(result.failures.some((failure) => failure.includes('reduced-motion')));
  assert.ok(result.failures.some((failure) => failure.includes('device-specific')));
  assert.ok(result.failures.some((failure) => failure.includes('persistent cache')));
});

test('rejects malformed measurements and unknown profiles instead of coercing evidence', () => {
  const profile = getResilienceProfile('desktop-keyboard');
  assert.throws(() => evaluateResilienceEvidence('unknown',validEvidence(profile)),/unknown profile/);
  assert.throws(() => evaluateResilienceEvidence(profile.id,{ ...validEvidence(profile),routeReadyMs:Number.NaN }),/finite non-negative/);
  assert.throws(() => evaluateResilienceEvidence(profile.id,{ ...validEvidence(profile),observerDelta:-1 }),/finite non-negative/);
});

test('keeps v135 contracts pure, local-only, and free of device detection or persistence', () => {
  const source = fs.readFileSync(new URL('../src/v135/resilience-contracts.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(source,/serviceWorker|CacheStorage|caches\.|new MutationObserver/);
  assert.doesNotMatch(source,/navigator\.userAgent|userAgentData|matchMedia|window\.|document\./);
  assert.doesNotMatch(source,/setTimeout|setInterval|requestAnimationFrame/);
});
