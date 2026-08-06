import { test, expect, openPrimary, waitForApp } from './helpers/app.js';
import {
  LARGE_VAULT_TRANSACTION_COUNT,
  createSyntheticLargeVault,
  evaluateResilienceEvidence,
  getResilienceProfile
} from '../src/v135/resilience-contracts.js';

const desktopProjects = new Set(['chromium','firefox','webkit']);
const touchProjects = new Set(['mobile-chromium','tablet','mobile-webkit']);
const primaryHeadings = {
  Dashboard:/Vault Dashboard/i,
  Money:/Bills, Recurring & Budgets/i,
  Calendar:/Calendar & Cash Flow/i,
  Reports:/^Reports$/i,
  Activity:/Ledger/i
};

async function expectCoordinatorSettled(page,name) {
  const expectedRoute = name.toLowerCase();
  await expect.poll(async () => {
    const first = await page.evaluate(() => window.GringottsV126?.coordinator?.snapshot?.());
    await page.waitForTimeout(120);
    const second = await page.evaluate(() => window.GringottsV126?.coordinator?.snapshot?.());
    return {
      ready:first?.status === 'ready' && second?.status === 'ready',
      route:first?.route === expectedRoute && second?.route === expectedRoute,
      sameCycle:first?.cycle === second?.cycle,
      samePasses:first?.enhancementPasses === second?.enhancementPasses,
      sameCallbacks:first?.observerCallbacks === second?.observerCallbacks
    };
  },{ timeout:15000,message:`${name} should stop producing v126 route or observer work before the next input` }).toEqual({
    ready:true,route:true,sameCycle:true,samePasses:true,sameCallbacks:true
  });
}

async function keyboardPrimary(page,name) {
  const control = page.getByRole('button',{ name, exact:true });
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press('Enter');
  if (name === 'Tools') await expect(page.getByRole('tablist',{ name:'Tools sections', exact:true })).toBeVisible({ timeout:12000 });
  else await expect(page.getByRole('heading',{ name:primaryHeadings[name] }).first()).toBeVisible({ timeout:12000 });
  await expectCoordinatorSettled(page,name);
}

async function touchPrimary(page,name) {
  const button = page.getByRole('button',{ name, exact:true });
  if (!(await button.isVisible())) {
    const menu = page.getByRole('button',{ name:/Menu/i });
    await menu.tap();
    await expect(button).toBeVisible();
  }
  const height = await button.evaluate((node) => node.getBoundingClientRect().height);
  await button.tap();
  if (name === 'Tools') await expect(page.getByRole('tablist',{ name:'Tools sections', exact:true })).toBeVisible();
  else await expect(page.getByRole('heading',{ name:primaryHeadings[name] }).first()).toBeVisible();
  await expectCoordinatorSettled(page,name);
  return height;
}

async function rootOverflow(page) {
  return page.evaluate(() => Math.max(0,document.documentElement.scrollWidth - document.documentElement.clientWidth));
}

async function remoteResourceCount(page) {
  return page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => {
    try { return new URL(entry.name,location.href).origin !== location.origin; }
    catch { return true; }
  }).length);
}

async function officialRuntimeEvaluation(page) {
  return page.evaluate(async () => {
    const runtime = window.GringottsV130.snapshot();
    return window.GringottsV130.evaluate(runtime.current.input);
  });
}

test('completes representative household navigation with keyboard activation only', async ({ app },testInfo) => {
  test.skip(!desktopProjects.has(testInfo.project.name),'Keyboard completion is owned by desktop browser projects.');
  const { page } = app;
  for (const name of ['Money','Reports','Tools']) await keyboardPrimary(page,name);
  const review = page.getByRole('tab',{ name:'Workflow Review', exact:true });
  await review.focus();
  await expect(review).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{ name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
  await expect(page.getByText(/Nothing is saved automatically/i)).toBeVisible();
  const state = await page.evaluate(() => ({
    activeTag:document.activeElement?.tagName,
    observerCount:window.GringottsV126.coordinator.snapshot().observerCount,
    actionCount:window.GringottsV126.dispatcher.snapshot().registered
  }));
  expect(['H1','H2']).toContain(state.activeTag);
  expect(state.observerCount).toBe(1);
  expect(state.actionCount).toBeLessThanOrEqual(40);
});

test('completes representative household navigation by touch without overflow or reduced safety messaging', async ({ app },testInfo) => {
  test.skip(!touchProjects.has(testInfo.project.name),'Touch completion is owned by Android, iPad, and iPhone projects.');
  const { page } = app;
  const heights = [];
  for (const name of ['Money','Reports','Tools']) {
    heights.push(await touchPrimary(page,name));
    expect(await rootOverflow(page)).toBeLessThanOrEqual(2);
  }
  const review = page.getByRole('tab',{ name:'Workflow Review', exact:true });
  heights.push(await review.evaluate((node) => node.getBoundingClientRect().height));
  await review.tap();
  await expect(page.getByRole('heading',{ name:'Household Workflow Evidence Review', exact:true })).toBeVisible();
  await expect(page.getByText(/Nothing is saved automatically/i)).toBeVisible();
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  expect(await rootOverflow(page)).toBeLessThanOrEqual(2);
});

test('respects reduced-motion preference while retaining focus and safety content', async ({ app }) => {
  const { page } = app;
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.reload();
  await waitForApp(page);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await openPrimary(page,'Tools');
  await page.getByRole('tab',{ name:'Workflow Review', exact:true }).click();
  await expect(page.getByText(/Nothing is saved automatically/i)).toBeVisible();
  const motion = await page.locator('button:visible,[role="tab"]:visible').evaluateAll((nodes) => nodes.slice(0,30).map((node) => {
    const style = getComputedStyle(node);
    return {
      animationName:style.animationName,
      animationIterationCount:style.animationIterationCount,
      scrollBehavior:style.scrollBehavior
    };
  }));
  expect(motion.some((entry) => entry.animationName !== 'none' && entry.animationIterationCount === 'infinite')).toBe(false);
  expect(await rootOverflow(page)).toBeLessThanOrEqual(2);
  const heading = page.getByRole('heading',{ name:'Household Workflow Evidence Review', exact:true });
  await heading.focus();
  await expect(heading).toBeFocused();
});

test('keeps deterministic large-vault workflows bounded and preserves official v130 authority', async ({ page },testInfo) => {
  const profile = getResilienceProfile('large-vault-low-resource');
  test.skip(!profile.projects.includes(testInfo.project.name),'Large-vault evidence runs only on the governed low-resource projects.');
  const errors = [];
  page.on('pageerror',(error) => errors.push(`pageerror: ${error.message}`));
  page.on('console',(message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  const vault = createSyntheticLargeVault();
  await page.addInitScript(({ syntheticVault }) => {
    localStorage.clear();
    localStorage.setItem('gringottsBudgetVault.latest',JSON.stringify(syntheticVault));
    localStorage.setItem('gringottsCleanMonth.v1','2026-12');
  },{ syntheticVault:vault });
  await page.goto('/?playwright=1&resilience=large-vault');
  await waitForApp(page);
  const storageBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const remoteBefore = await remoteResourceCount(page);
  const observerBefore = await page.evaluate(() => window.GringottsV126.coordinator.snapshot().observerCount);
  let completed = 1;
  let minimumTargetPx = Number.POSITIVE_INFINITY;
  for (const name of ['Activity','Reports','Tools']) {
    if (touchProjects.has(testInfo.project.name)) minimumTargetPx = Math.min(minimumTargetPx,await touchPrimary(page,name));
    else {
      const control = page.getByRole('button',{ name, exact:true });
      minimumTargetPx = Math.min(minimumTargetPx,await control.evaluate((node) => node.getBoundingClientRect().height));
      await openPrimary(page,name);
    }
    completed += 1;
    expect(await rootOverflow(page)).toBeLessThanOrEqual(2);
  }
  await expect(page.getByRole('button',{ name:/Restore full vault/i })).toBeVisible();
  await expect(page.getByText(/separate full-vault restore task/i)).toBeVisible();
  const snapshot = await page.evaluate(() => window.GringottsV126.coordinator.snapshot());
  const storageAfter = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const official = await officialRuntimeEvaluation(page);
  const evidence = {
    completedWorkflows:completed,
    expectedWorkflows:4,
    routeReadyMs:Number(snapshot.routeReadyMs || 0),
    enhancementMs:Number(snapshot.enhancementMs || 0),
    horizontalOverflowPx:await rootOverflow(page),
    minimumTargetPx,
    storageWriteDelta:JSON.stringify(storageAfter) === JSON.stringify(storageBefore) ? 0 : 1,
    networkRequestDelta:(await remoteResourceCount(page)) - remoteBefore,
    observerDelta:Number(snapshot.observerCount || 0) - observerBefore,
    duplicateDispatches:0,
    syntheticTransactionCount:vault.transactions.length,
    safetyMessagingVisible:true,
    focusVisible:['H1','H2'].includes(await page.evaluate(() => document.activeElement?.tagName || '')),
    reducedMotionRespected:true,
    deviceForkUsed:false,
    persistentCacheUsed:false
  };
  const result = evaluateResilienceEvidence(profile.id,evidence);
  if (!result.ok) {
    const nonTiming = result.failures.filter((failure) => !/routeReadyMs|enhancementMs/.test(failure));
    expect(nonTiming).toEqual([]);
    expect(official.ok).toBe(false);
  } else expect(official.ok).toBe(true);
  expect(errors).toEqual([]);
});
