import { V130_PERFORMANCE_BUDGETS } from '../v130/performance-contracts.js';

export const RESILIENCE_RELEASE = 'v135';
export const MAX_SYNTHETIC_TRANSACTIONS = 2_000;
export const LARGE_VAULT_TRANSACTION_COUNT = 1_200;
export const MAX_HORIZONTAL_OVERFLOW_PX = 2;
export const MIN_INTERACTIVE_TARGET_PX = 44;

const ALL_PROJECTS = Object.freeze(['chromium','firefox','webkit','tablet','mobile-chromium','mobile-webkit']);

const profile = (id,label,projects,inputMode,motionPreference,lowResource = false,syntheticTransactionCount = 0) => Object.freeze({
  id,label,projects:Object.freeze([...projects]),inputMode,motionPreference,lowResource,syntheticTransactionCount,
  maxRouteReadyMs:V130_PERFORMANCE_BUDGETS.routeReadyMs,
  maxEnhancementMs:V130_PERFORMANCE_BUDGETS.enhancementMs,
  maxHorizontalOverflowPx:MAX_HORIZONTAL_OVERFLOW_PX,
  minInteractiveTargetPx:MIN_INTERACTIVE_TARGET_PX,
  safetyMessagingRequired:true,deviceForkAllowed:false,persistentCacheAllowed:false
});

export const RESILIENCE_PROFILES = Object.freeze([
  profile('desktop-keyboard','Desktop keyboard completion',['chromium','firefox','webkit'],'keyboard','no-preference'),
  profile('android-touch','Android touch completion',['mobile-chromium'],'touch','no-preference'),
  profile('ipad-touch','iPad touch completion',['tablet'],'touch','no-preference'),
  profile('iphone-touch','iPhone touch completion',['mobile-webkit'],'touch','no-preference'),
  profile('reduced-motion','Reduced-motion completion',ALL_PROJECTS,'mixed','reduce'),
  profile('large-vault-low-resource','Large-vault low-resource completion',['chromium','mobile-chromium','tablet'],'mixed','no-preference',true,LARGE_VAULT_TRANSACTION_COUNT)
]);

function fail(message) {
  throw new Error(`Resilience contract rejected: ${message}`);
}

function finiteNonNegative(value,name) {
  if (!Number.isFinite(value) || value < 0) fail(`${name} must be a finite non-negative number`);
  return value;
}

function whole(value,name) {
  finiteNonNegative(value,name);
  if (!Number.isInteger(value)) fail(`${name} must be a whole number`);
  return value;
}

function isoDateFromIndex(index) {
  const monthOffset = index % 24;
  const year = 2026 - Math.floor(monthOffset / 12);
  const month = 12 - (monthOffset % 12);
  const day = (index % 27) + 1;
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function getResilienceProfile(id) {
  const found = RESILIENCE_PROFILES.find((entry) => entry.id === id);
  if (!found) fail(`unknown profile ${id}`);
  return found;
}

export function createSyntheticLargeVault(transactionCount = LARGE_VAULT_TRANSACTION_COUNT) {
  whole(transactionCount,'transactionCount');
  if (transactionCount < 1 || transactionCount > MAX_SYNTHETIC_TRANSACTIONS) fail(`transactionCount must be between 1 and ${MAX_SYNTHETIC_TRANSACTIONS}`);
  const transactions = Array.from({ length:transactionCount }, (_,index) => {
    const type = index % 23 === 0 ? 'Income' : index % 17 === 0 ? 'Transfer' : 'Expense';
    const amount = type === 'Income' ? -(2_500 + (index % 7) * 125) : type === 'Transfer' ? 100 + (index % 9) * 25 : 5 + ((index * 37) % 495) + 0.25;
    const category = type === 'Income' ? 'Income' : type === 'Transfer' ? 'Transfer' : ['Groceries','Utilities','Household','Transportation','Subscriptions'][index % 5];
    const label = type === 'Income' ? 'Synthetic Payroll' : type === 'Transfer' ? 'Synthetic Transfer' : `Synthetic Merchant ${String(index % 40).padStart(2,'0')}`;
    return Object.freeze({
      id:`v135-transaction-${String(index + 1).padStart(4,'0')}`,
      date:isoDateFromIndex(index),name:label,merchant:label,amount,type,category,
      account:`Synthetic Account ${(index % 4) + 1}`,owner:`Synthetic Owner ${(index % 2) + 1}`,
      reviewed:index % 11 !== 0,pending:index % 29 === 0
    });
  });
  return Object.freeze({
    version:'v135-synthetic-large-vault-1',appVersion:'v135-test',
    source:Object.freeze({ fileName:'v135-synthetic-large-vault.json',institution:'Synthetic Resilience Bank' }),
    lastSavedAt:'2026-08-06T00:00:00.000Z',transactions:Object.freeze(transactions)
  });
}

export function validateSyntheticLargeVault(vault,expectedCount = vault.transactions.length) {
  whole(expectedCount,'expectedCount');
  if (vault.version !== 'v135-synthetic-large-vault-1' || vault.appVersion !== 'v135-test') fail('synthetic vault identity is invalid');
  if (vault.source?.institution !== 'Synthetic Resilience Bank' || vault.source?.fileName !== 'v135-synthetic-large-vault.json') fail('synthetic source identity is invalid');
  if (vault.transactions.length !== expectedCount || vault.transactions.length > MAX_SYNTHETIC_TRANSACTIONS) fail('synthetic transaction count is invalid');
  const ids = new Set();
  vault.transactions.forEach((transaction) => {
    if (!/^v135-transaction-\d{4}$/.test(transaction.id) || ids.has(transaction.id)) fail('synthetic transaction IDs must be unique and deterministic');
    ids.add(transaction.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) fail('synthetic transaction date is invalid');
    if (!Number.isFinite(transaction.amount)) fail('synthetic transaction amount is invalid');
    if (!transaction.account.startsWith('Synthetic Account ') || !transaction.owner.startsWith('Synthetic Owner ')) fail('synthetic identities must remain fictional');
  });
  return true;
}

export function evaluateResilienceEvidence(profileId,evidence) {
  const selected = getResilienceProfile(profileId);
  const numericKeys = Object.freeze([
    'completedWorkflows','expectedWorkflows','routeReadyMs','enhancementMs','horizontalOverflowPx','minimumTargetPx',
    'storageWriteDelta','networkRequestDelta','observerDelta','duplicateDispatches','syntheticTransactionCount'
  ]);
  numericKeys.forEach((key) => finiteNonNegative(evidence[key],key));
  const failures = [];
  if (!Number.isInteger(evidence.completedWorkflows) || evidence.completedWorkflows !== evidence.expectedWorkflows || evidence.expectedWorkflows < 1) failures.push('all expected workflows must complete');
  if (evidence.routeReadyMs > selected.maxRouteReadyMs) failures.push('routeReadyMs exceeded the retained v130 ceiling');
  if (evidence.enhancementMs > selected.maxEnhancementMs) failures.push('enhancementMs exceeded the retained v130 ceiling');
  if (evidence.horizontalOverflowPx > selected.maxHorizontalOverflowPx) failures.push('horizontal overflow exceeded the v135 contract');
  if (evidence.minimumTargetPx < selected.minInteractiveTargetPx) failures.push('interactive target size fell below the v135 contract');
  if (evidence.storageWriteDelta !== 0) failures.push('unexpected browser storage writes were observed');
  if (evidence.networkRequestDelta !== 0) failures.push('unexpected network requests were observed');
  if (evidence.observerDelta !== 0) failures.push('unexpected runtime observers were observed');
  if (evidence.duplicateDispatches !== 0) failures.push('duplicate action dispatch was observed');
  if (!evidence.safetyMessagingVisible) failures.push('required safety messaging was not visible');
  if (!evidence.focusVisible) failures.push('visible focus evidence was not present');
  if (selected.motionPreference === 'reduce' && !evidence.reducedMotionRespected) failures.push('reduced-motion preference was not respected');
  if (evidence.deviceForkUsed) failures.push('device-specific application behavior is forbidden');
  if (evidence.persistentCacheUsed) failures.push('persistent cache or service-worker behavior is forbidden');
  if (evidence.syntheticTransactionCount !== selected.syntheticTransactionCount) failures.push('synthetic transaction count does not match the selected profile');
  return Object.freeze({
    release:RESILIENCE_RELEASE,profileId:selected.id,ok:failures.length === 0,
    failures:Object.freeze(failures),evidence:Object.freeze({ ...evidence })
  });
}

export function validateResilienceProfiles() {
  if (RESILIENCE_PROFILES.length !== 6) fail('the resilience catalog must contain exactly six profiles');
  const ids = new Set();
  const covered = new Set();
  RESILIENCE_PROFILES.forEach((entry) => {
    if (!entry.id || !entry.label || ids.has(entry.id)) fail('profile IDs and labels must be unique and non-empty');
    ids.add(entry.id);
    entry.projects.forEach((project) => covered.add(project));
    if (entry.maxRouteReadyMs !== V130_PERFORMANCE_BUDGETS.routeReadyMs || entry.maxEnhancementMs !== V130_PERFORMANCE_BUDGETS.enhancementMs) fail('v135 may not weaken retained v130 timing ceilings');
    if (entry.deviceForkAllowed !== false || entry.persistentCacheAllowed !== false || entry.safetyMessagingRequired !== true) fail('profile safeguards are invalid');
    if (entry.syntheticTransactionCount < 0 || entry.syntheticTransactionCount > MAX_SYNTHETIC_TRANSACTIONS) fail('profile synthetic transaction count is invalid');
  });
  if (covered.size !== ALL_PROJECTS.length || ALL_PROJECTS.some((project) => !covered.has(project))) fail('all six supported Playwright projects must be covered');
  const reduced = getResilienceProfile('reduced-motion');
  if (reduced.motionPreference !== 'reduce' || reduced.projects.length !== ALL_PROJECTS.length) fail('reduced-motion coverage must span all supported projects');
  const large = getResilienceProfile('large-vault-low-resource');
  if (!large.lowResource || large.syntheticTransactionCount !== LARGE_VAULT_TRANSACTION_COUNT) fail('large-vault profile is invalid');
  return true;
}
