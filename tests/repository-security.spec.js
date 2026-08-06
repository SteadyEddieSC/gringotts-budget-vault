import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { currentPackageVersion, currentVersion } from './helpers/release.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const expectAll = (source, values) => values.forEach((value) => expect(source).toContain(value));
const noRemote = (source, label) => expect(source, `${label} must remain local-first`).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
const noStore = (source, label) => expect(source, `${label} must not add persistence`).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
const workflows = () => fs.readdirSync(path.join(root, '.github', 'workflows'))
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => ({ name, source:read(`.github/workflows/${name}`) }));

test('third-party Actions are pinned and protected workflows retain least privilege', () => {
  const unpinned = [];
  for (const workflow of workflows()) {
    for (const match of workflow.source.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)) {
      const reference = match[1];
      if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
      if (!/^[0-9a-f]{40}$/i.test(reference.slice(reference.lastIndexOf('@') + 1))) unpinned.push(`${workflow.name}: ${reference}`);
    }
  }
  expect(unpinned).toEqual([]);
  for (const name of ['playwright.yml','quality.yml','security.yml','supply-chain.yml','codeql.yml']) {
    const source = read(`.github/workflows/${name}`);
    expect(source).not.toMatch(/\bpull_request_target\s*:|\bpermissions\s*:\s*write-all\b|^\s*contents:\s*write\s*$/im);
    expectAll(source, ['ready_for_review','github.event.pull_request.draft == false']);
  }
  expect(read('.github/workflows/codeql.yml')).toMatch(/^permissions: read-all$/m);
  expect(read('.github/workflows/codeql.yml')).toContain('security-events: write');
});

test('Cloudflare and Lighthouse retain the local-first resource boundary', () => {
  expectAll(read('_headers'), [
    "default-src 'self'","connect-src 'self'","worker-src 'none'","frame-ancestors 'none'",
    'X-Content-Type-Options: nosniff','X-Frame-Options: DENY','Referrer-Policy: no-referrer',
    'Cross-Origin-Opener-Policy: same-origin','Cross-Origin-Resource-Policy: same-origin'
  ]);
  expectAll(read('lighthouserc.cjs'), [
    "target: 'filesystem'","outputDir: './lighthouse-reports'",
    "'network-requests': ['error', { maxLength: 45",
    "'resource-summary:script:size': ['error', { maxNumericValue: 500000"
  ]);
});

test('parser, TypeScript, quality, and browser matrices remain mandatory', () => {
  const playwright = read('.github/workflows/playwright.yml');
  const quality = read('.github/workflows/quality.yml');
  const packageJson = read('package.json');
  expectAll(playwright, [
    'npm ci --ignore-scripts','Run exact release consistency diagnostics','npm run release:check 2>&1 | tee release-consistency.log',
    'Run strict TypeScript and browser-free parser tests','node --check src/release-manifest.js',
    'node --check src/boot-v126.js','node --check src/v134/export-contracts.js',
    'node --check src/v135/resilience-contracts.js','node --check src/boot-v135.js',
    '--project=chromium','--project=firefox','--project=webkit','--project=mobile-chromium','--project=tablet','--project=mobile-webkit'
  ]);
  expect(playwright.indexOf('Run exact release consistency diagnostics')).toBeLessThan(playwright.indexOf('Install Chromium and system dependencies'));
  expect(playwright.indexOf('Run strict TypeScript and browser-free parser tests')).toBeLessThan(playwright.indexOf('Install Chromium and system dependencies'));
  expectAll(quality, ['npm ci --ignore-scripts','npm exec --yes --package=@lhci/cli@0.15.1 -- lhci']);
  expect(quality).not.toContain('temporaryPublicStorage: true');
  expect(quality).not.toContain('--update-snapshots');
  expectAll(packageJson, [
    `"version": "${currentPackageVersion}"`,'"release:check": "node scripts/release-consistency.mjs"',
    '"typecheck": "tsc -p tsconfig.json"','"typescript": "5.9.2"',
    'tests/v134-reporting-export-contracts.spec.js','tests/v135-cross-device-low-resource-resilience.spec.js',
    'quality-tests/visual-contracts.spec.js'
  ]);
  expect(read('package-lock.json')).toContain('https://registry.npmjs.org/@playwright/test/-/test-1.61.1.tgz');
});

test('analytical and maintenance modules add no remote channel or silent authoritative-vault write', () => {
  const localOnly = [
    'src/v120/import-receipt-audit-model.js','src/v121/receipt-integrity-model.js',
    'src/v122/account-cleanup-model.js','src/v123/recurring-decisions-model.js','src/v124/scenario-model.js',
    'src/v125/close-history-model.js','src/v126/runtime.js','src/v126/legacy-adapter.js','src/v126/storage-inventory.js',
    'src/v127/ux-policy.js','src/v128/portable-vault.js','src/v129/workflow-evidence.js','src/v129/integration.js',
    'src/v130/performance-contracts.js','src/v130/runtime-health.js','src/v131/decision-contracts.js','src/v131/integration.js',
    'src/release-manifest.js','src/v133/longevity-drills.js','src/v134/export-contracts.js','src/v134/local-export.js',
    'src/v135/resilience-contracts.js','src/boot-v135.js'
  ];
  for (const file of localOnly) {
    const source = read(file);
    noRemote(source, file);
    expect(source).not.toContain("localStorage.setItem('gringottsBudgetVault.latest'");
  }
  for (const file of [
    'src/v129/integration.js','src/v130/performance-contracts.js','src/v130/runtime-health.js',
    'src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js',
    'src/release-manifest.js','src/v133/longevity-drills.js','src/v134/export-contracts.js','src/v134/local-export.js',
    'src/v135/resilience-contracts.js','src/boot-v135.js'
  ]) noStore(read(file), file);
});

test('authoritative transaction writes retain backup, rollback, verification, and one-domain ownership', () => {
  const parser = read('src/v115/parser.js');
  const importer = read('src/v115/bank-import.js');
  noRemote(parser, 'v115 parser');
  noRemote(importer, 'v115 importer');
  expect(parser).not.toMatch(/localStorage|sessionStorage|\bsave\s*\(/);
  expectAll(importer, [
    'Download the populated destination backup before importing','Import verification failed: transaction count mismatch.',
    'localStorage.setItem(destination.key','localStorage.setItem(destination.key, previousRaw)',
    "IMPORT_HISTORY_KEY = 'gringottsImportHistory.v1'"
  ]);
  expect(importer).not.toContain('transactions: incomingRows');
  expectAll(read('src/v126/release.js'), [
    "domain('gringottsBudgetVault.latest', 'vault', 'authoritative'",'Only the authoritative vault may contain transaction copies.',
    '43-sheet reliability-capped Vault Workbook',"stableRescue: 'rescue-v105.html'"
  ]);
  expect(read('src/v126/storage-inventory.js')).toContain('gringottsImportHistory.v1');
});

test('bounded metadata, immutable close evidence, and retained recovery controls remain present', () => {
  for (const [file, marker] of [
    ['src/v117/profile-model.js','MAX_IMPORT_PROFILES = 24'],
    ['src/v118/profile-portability-model.js','MAX_PROFILE_BUNDLE_BYTES = 256 * 1024'],
    ['src/v119/profile-versioning-model.js','MAX_PROFILE_REVISIONS = 60'],
    ['src/v121/receipt-integrity-model.js','MAX_IMPORT_BATCH_LINKS = 80'],
    ['src/v122/account-cleanup-model.js','MAX_ACCOUNT_CLEANUP_DECISIONS = 120'],
    ['src/v123/recurring-decisions-model.js','MAX_RECURRING_DECISIONS = 120'],
    ['src/v124/scenario-model.js','MAX_SCENARIOS = 24']
  ]) expect(read(file)).toContain(marker);
  expectAll(read('src/v125/close-history-model.js'), [
    "evidenceSource = 'close-snapshot'",'closedEvidenceUsesImmutableSnapshots: true','transferNeutral: true',
    'pendingExcluded: true','automaticWriteAvailable: false','transactionCopiesStored: false','causationClaimed: false'
  ]);
  expect(read('src/v125/close-history-model.js')).not.toMatch(/localStorage|sessionStorage/);
  expect(exists('rescue-v105.html')).toBe(true);
});

test('v126 remains sole lifecycle, dispatcher, and observer owner with bounded route recovery', () => {
  const boot = read('src/boot-v126.js');
  const runtime = read('src/v126/runtime.js');
  expectAll(runtime, [
    "observerOwner: 'v126-runtime-coordinator'","actionOwner: 'v126-action-dispatcher'",'maxEnhancementPasses: 3','new MutationObserver'
  ]);
  expectAll(boot, [
    'createRuntimeCoordinator','createActionDispatcher','installLegacyLayer','const MAX_BASE_ROUTE_REPLAYS = 2;',
    'lastRouteReplayAttempts','routeReplayRecoveries','did not activate after bounded attempts'
  ]);
  expect(boot).not.toMatch(/while\s*\(true\)|setInterval\s*\(/);
  for (const file of [
    'src/v126/release.js','src/boot-v127.js','src/boot-v128.js','src/v129/integration.js','src/v130/runtime-health.js',
    'src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js','src/release-manifest.js',
    'src/v133/longevity-drills.js','src/v134/export-contracts.js','src/v134/local-export.js','src/v135/resilience-contracts.js'
  ]) expect(read(file)).not.toContain('new MutationObserver');
});

test('retained v127-v134 architecture remains explicit and non-authorizing', () => {
  expectAll(read('src/v127/roadmap-horizon.js'), [
    "version: 'v134', status: 'shipped'","version: 'v135', status: 'current'","version: 'v136', status: 'directional'",'ROADMAP_HORIZON.length !== 10'
  ]);
  expectAll(read('src/boot-v128.js'), ['typeScriptStrict: true','encryptionReady: false','cloudAdaptersEnabled: false','networkImplementationAdded: false']);
  expectAll(read('src/v129/workflow-evidence.js'), ['automaticTelemetry: false','financialDataIncluded: false']);
  expect(read('src/v129/workflow-evidence.js')).not.toContain('gringottsBudgetVault.latest');
  expectAll(read('src/v130/performance-contracts.ts'), [
    'maxNetworkRequests: 45','maxScriptBytes: 500_000','maxWorkbookSheets: 43','maxRuntimeObservers: 1','maxPrimaryDestinations: 6','maxSessionSamples: 12'
  ]);
  expectAll(read('src/v131/decision-contracts.js'), [
    "state = 'evidence-incomplete'","state = 'runtime-blocked'",'automaticApproval: false','financialDataIncluded: false','remoteTransmission: false'
  ]);
  expect(read('src/boot-v132.js').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe("export * from './release-manifest.js';");
  expectAll(read('src/v133/longevity-drills.js'), [
    'authoritativeVaultRead: false','authoritativeVaultWrite: false','automaticCleanup: false','networkRequired: false','persistentStoreAdded: false'
  ]);
  expectAll(read('src/v134/export-contracts.js'), [
    "EXPORT_CONTRACT_RELEASE = 'v134'",'WORKBOOK_SHEET_CAP = 43','EXPORT_CATALOG','WORKBOOK_OWNERSHIP','assertExportPayloadSafe'
  ]);
  expectAll(read('src/v134/local-export.js'), ['executeLocalExport',"status:'cancelled'", "status:'dispatched'",'revokeObjectURL']);
});

test('v135 is current, test-owned, bounded, and absent from normal startup', () => {
  const manifest = read('src/release-manifest.js');
  const js = read('src/v135/resilience-contracts.js');
  const ts = read('src/v135/resilience-contracts.ts');
  expectAll(manifest, [
    "version:'v135'","packageVersion:'135.0.0'","name:'Cross-Device & Low-Resource Resilience'",
    "bootSpecifier:'src/release-manifest.js?v=135release1'",'maxNetworkRequests:45','maxScriptBytes:500_000',
    'maxWorkbookSheets:43','maxRuntimeObservers:1','maxPrimaryDestinations:6','window.GringottsV135',
    'profileCount:6','largeVaultTransactionCount:1200','contractsLazy:true','contractsLoaded:false',
    'window.GringottsV134','retainedOutputCount:16','catalogLoaded:false','executorLoaded:false'
  ]);
  expect(manifest).not.toMatch(/^import .*v135\/resilience-contracts\.js/gm);
  expect(manifest).not.toMatch(/^import .*v134\/(?:export-contracts|local-export)\.js/gm);
  for (const source of [js, ts]) {
    expectAll(source, [
      "RESILIENCE_RELEASE = 'v135'",'RESILIENCE_PROFILES','LARGE_VAULT_TRANSACTION_COUNT','MAX_SYNTHETIC_TRANSACTIONS',
      'evaluateResilienceEvidence','deviceForkAllowed:false','persistentCacheAllowed:false'
    ]);
    noRemote(source, 'v135 resilience contract');
    noStore(source, 'v135 resilience contract');
    expect(source).not.toMatch(/navigator\.userAgent|userAgentData|new MutationObserver|serviceWorker|CacheStorage|caches\./);
  }
  expect(read('src/boot-v135.js').replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe("export * from './release-manifest.js';");
  for (const file of ['index.html','app.html']) {
    const shell = read(file);
    expectAll(shell, ['<title>Gringotts Budget Vault</title>','src/release-manifest.js?v=135release1']);
    expect(shell).not.toMatch(/<script[^>]+src=["']src\/boot-v(?:129|130|131|132|133|134|135)\.js/i);
  }
});

test('v135 release, security, testing, and repository-control records are complete', () => {
  const required = [
    'SECURITY.md','.github/dependabot.yml','.github/workflows/codeql.yml','.github/workflows/playwright.yml',
    '.github/workflows/quality.yml','.github/workflows/security.yml','.github/workflows/supply-chain.yml','.github/workflows/scorecard.yml',
    'README.md','ROADMAP.md','TESTING.md','QUALITY_GATES.md','scripts/privacy-history-scan.mjs','scripts/release-consistency.mjs',
    'src/boot-v135.js','src/v135/resilience-contracts.js','src/v135/resilience-contracts.ts',
    'tests-node/v135-cross-device-resilience.test.mjs','tests-node/v135-keyboard-route-replay.test.mjs',
    'tests/v135-cross-device-low-resource-resilience.spec.js',
    'RELEASE_NOTES_v135_CROSS_DEVICE_LOW_RESOURCE_RESILIENCE.md','V135_SECURITY_REVIEW.md','V135_IMPLEMENTATION_SCOPE.md',
    'RELEASE_NOTES_v134_REPORTING_EXPORT_CONTRACT_CONSOLIDATION.md','V134_SECURITY_REVIEW.md','V134_IMPLEMENTATION_SCOPE.md'
  ];
  expect(required.filter((file) => !exists(file))).toEqual([]);
  expect(currentVersion).toBe('v135');
});
