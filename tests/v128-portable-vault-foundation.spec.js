import { test, expect, openPrimary } from './helpers/app.js';

test('preserves the v128 typed foundation under v130 without adding a runtime, observer, store, or cloud adapter', async ({ app }) => {
  const { page } = app;
  await expect(page.locator('.version-text')).toHaveText('v130');
  const state = await page.evaluate(() => ({
    coordinator:window.GringottsV126.coordinator.snapshot(), ux:window.GringottsV127.snapshot(),
    foundation:window.GringottsV128.snapshot(), evidence:window.GringottsV129.snapshot(),
    hardening:window.GringottsV130.snapshot(), build:window.GringottsCleanRuntime.BUILD,
    primaryDestinations:document.querySelectorAll('[data-tab]').length
  }));
  expect(state.coordinator.observerCount).toBe(1);
  expect(state.coordinator.observerOwner).toBe('v126-runtime-coordinator');
  expect(state.ux.release).toBe('v127');
  expect(state.foundation).toMatchObject({
    release:'v128', typeScriptStrict:true, portableFormat:'gringotts-portable-vault', portableFormatVersion:1,
    portableSchemaVersion:1, integrityAlgorithm:'SHA-256', encryptionReady:false, cloudAdaptersEnabled:false,
    networkImplementationAdded:false, observerAdded:false, storageWritesAdded:false,
    primaryDestinations:6, workbookSheets:43, networkBudgetDelta:0
  });
  expect(state.evidence).toMatchObject({
    release:'v129', hostRelease:'v130', integrationLoaded:false, automaticTelemetry:false, financialDataRead:false,
    persistentStoreAdded:false, networkImplementationAdded:false, observerAdded:false,
    dispatcherOwned:false, coordinatorOwned:true, registeredAsRelease:false, lazyController:true
  });
  expect(state.hardening).toMatchObject({
    release:'v130', financialDataRead:false, persistentStoreAdded:false, networkImplementationAdded:false,
    observerAdded:false, serviceWorkerAdded:false, workflowIntegrationLazy:true, diagnosticsLazy:true
  });
  expect(state.build.version).toBe('v130');
  expect(state.build.runtime).toContain('v128 UX/typed foundation');
  expect(state.build.runtime).toContain('lazy v129 workflow integration');
  expect(state.build.runtime).toContain('lazy v130 diagnostics');
  expect(state.primaryDestinations).toBe(6);
});

test('round-trips a portable vault in the browser without network or storage mutation', async ({ app }) => {
  const { page } = app;
  const result = await page.evaluate(async () => {
    const module = await import('/src/v128/portable-vault.js');
    const before = Object.fromEntries(Object.entries(localStorage));
    const requests = [];
    const originalFetch = window.fetch;
    window.fetch = async (...args) => { requests.push(String(args[0])); return originalFetch(...args); };
    try {
      const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
      const packageValue = await module.createPortableVaultPackage(vault,{ createdAt:'2026-08-03T03:30:00.000Z', sourceRelease:'v128' });
      const serialized = module.serializePortableVaultPackage(packageValue);
      const parsed = await module.parsePortableVaultPackage(serialized);
      return {
        before, after:Object.fromEntries(Object.entries(localStorage)), requests, valid:parsed.valid,
        count:parsed.package.manifest.transactionCount, digest:parsed.package.manifest.integrity.digest,
        privacy:parsed.package.manifest.privacy, filename:module.portableVaultFilename('2026-08-03T03:30:00.000Z')
      };
    } finally { window.fetch = originalFetch; }
  });
  expect(result.after).toEqual(result.before);
  expect(result.requests).toEqual([]);
  expect(result.valid).toBe(true);
  expect(result.count).toBeGreaterThan(0);
  expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(result.privacy).toEqual({ deviceLocal:true, networkRequired:false, cloudStored:false, encryption:'none-foundation-only' });
  expect(result.filename).toBe('Gringotts_Vault_2026-08-03T03-30-00-000Z.gringotts');
});

test('rejects portable-vault tampering before any restore decision', async ({ app }) => {
  const { page } = app;
  const message = await page.evaluate(async () => {
    const module = await import('/src/v128/portable-vault.js');
    const vault = JSON.parse(localStorage.getItem('gringottsBudgetVault.latest'));
    const packageValue = await module.createPortableVaultPackage(vault,{ createdAt:'2026-08-03T03:30:00.000Z', sourceRelease:'v128' });
    packageValue.vault.transactions[0].amount = Number(packageValue.vault.transactions[0].amount || 0) + 1;
    try { await module.validatePortableVaultPackage(packageValue); return ''; }
    catch (error) { return error.message; }
  });
  expect(message).toMatch(/integrity verification failed/i);
});

test('shows v127 through v129 shipped with v130 current in the ten-release roadmap', async ({ app }) => {
  const { page } = app;
  await openPrimary(page,'Tools');
  await page.getByRole('tab',{ name:'Roadmap', exact:true }).click();
  await expect(page.getByRole('heading',{ name:'v127–v136 Reliability Roadmap', exact:true })).toBeVisible();
  await expect(page.locator('.roadmap-horizon-card')).toHaveCount(10);
  for (const version of ['v127','v128','v129']) {
    const shipped = page.locator(`[data-roadmap-version="${version}"]`);
    await expect(shipped).toHaveAttribute('data-roadmap-status','shipped');
    await expect(shipped.locator('.badge')).toHaveText('Shipped');
  }
  const current = page.locator('[data-roadmap-version="v130"]');
  await expect(current).toHaveAttribute('data-roadmap-status','current');
  await expect(current.locator('.badge')).toHaveText('Current release');
  await expect(current.getByRole('heading',{ name:'v130 — Performance & Maintenance Hardening', exact:true })).toBeVisible();
});
