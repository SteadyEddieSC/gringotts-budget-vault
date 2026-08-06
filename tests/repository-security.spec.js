import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { currentPackageVersion, currentVersion } from './helpers/release.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expectAll = (source, values) => values.forEach((value) => expect(source).toContain(value));
const noRemote = (source, label) => expect(source, `${label} must remain local-first`).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
const noBrowserStore = (source, label) => expect(source, `${label} must not add browser persistence`).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
const workflowFiles = () => fs.readdirSync(path.join(root, '.github', 'workflows'))
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => ({ name, content:read(`.github/workflows/${name}`) }));

test('all third-party GitHub Actions remain pinned to full commit SHAs', () => {
  const failures = [];
  for (const workflow of workflowFiles()) {
    for (const match of workflow.content.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)) {
      const reference = match[1];
      if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
      if (!/^[0-9a-f]{40}$/i.test(reference.slice(reference.lastIndexOf('@') + 1))) failures.push(`${workflow.name}: ${reference}`);
    }
  }
  expect(failures, 'Unpinned GitHub Action references').toEqual([]);
});

test('workflows retain least privilege, safe pull-request triggers, and draft gating', () => {
  for (const name of ['playwright.yml','quality.yml','security.yml','supply-chain.yml','codeql.yml']) {
    const workflow = read(`.github/workflows/${name}`);
    expect(workflow).not.toMatch(/\bpull_request_target\s*:|\bpermissions\s*:\s*write-all\b|^\s*contents:\s*write\s*$/im);
    expectAll(workflow, ['ready_for_review', 'github.event.pull_request.draft == false']);
  }
  expect(read('.github/workflows/codeql.yml')).toMatch(/^permissions: read-all$/m);
  expect(read('.github/workflows/codeql.yml')).toMatch(/security-events: write/);
});

test('Cloudflare headers preserve the local-first browser boundary', () => {
  expectAll(read('_headers'), [
    "default-src 'self'", "frame-ancestors 'none'", "connect-src 'self'", "worker-src 'none'",
    'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Referrer-Policy: no-referrer',
    'Cross-Origin-Opener-Policy: same-origin', 'Cross-Origin-Resource-Policy: same-origin'
  ]);
});

test('quality automation retains accessibility, visual, and Lighthouse budgets through v135', () => {
  const workflow = read('.github/workflows/quality.yml');
  const lighthouse = read('lighthouserc.cjs');
  const packageJson = read('package.json');
  expect(workflow).toContain('npm exec --yes --package=@lhci/cli@0.15.1 -- lhci');
  for (const file of [
    'quality-tests/accessibility.spec.js','quality-tests/v120-accessibility.spec.js','quality-tests/v121-accessibility.spec.js',
    'quality-tests/v122-accessibility.spec.js','quality-tests/v123-accessibility.spec.js','quality-tests/v124-accessibility.spec.js',
    'quality-tests/v125-accessibility.spec.js','quality-tests/v126-accessibility.spec.js','quality-tests/v127-accessibility.spec.js',
    'quality-tests/v129-accessibility.spec.js','quality-tests/v130-accessibility.spec.js','quality-tests/v131-accessibility.spec.js',
    'quality-tests/v132-accessibility.spec.js','quality-tests/tab-semantics.spec.js','quality-tests/visual-contracts.spec.js'
  ]) expectAll(`${workflow}\n${packageJson}`, [file]);
  expect(workflow).toContain('npm ci --ignore-scripts');
  expect(workflow).not.toContain('temporaryPublicStorage: true');
  expect(workflow).not.toContain('--update-snapshots');
  expectAll(lighthouse, [
    "target: 'filesystem'", "outputDir: './lighthouse-reports'",
    "'network-requests': ['error', { maxLength: 45",
    "'resource-summary:script:size': ['error', { maxNumericValue: 500000"
  ]);
});

test('parser preflight owns syntax, release consistency, TypeScript, and v135 contracts before browser installation', () => {
  const workflow = read('.github/workflows/playwright.yml');
  const packageJson = read('package.json');
  for (const module of [
    'src/v117/profile-model.js','src/v117/import-profiles.js',
    'src/v118/profile-portability-model.js','src/v118/institution-patterns.js','src/v118/profile-portability.js','src/v118/release.js',
    'src/v119/profile-versioning-model.js','src/v119/profile-versioning.js','src/v119/release.js',
    'src/v120/import-receipt-audit-model.js','src/v120/import-receipt-audit.js','src/v120/roadmap-horizon.js','src/v120/release.js',
    'src/v121/receipt-integrity-model.js','src/v121/receipt-integrity.js','src/v121/roadmap-horizon.js','src/v121/reporting.js','src/v121/release.js',
    'src/v122/account-cleanup-model.js','src/v122/account-cleanup-export.js','src/v122/account-cleanup-export-controller.js','src/v122/account-cleanup.js','src/v122/roadmap-horizon.js','src/v122/reporting.js',
    'src/v123/recurring-decisions-model.js','src/v123/recurring-decisions.js','src/v123/roadmap-horizon.js','src/v123/reporting.js',
    'src/v124/scenario-model.js','src/v124/scenario-comparison.js','src/v124/reporting.js','src/v124/release.js','src/boot-v124.js',
    'src/v125/close-history-model.js','src/v125/close-trends.js','src/v125/roadmap-horizon.js','src/v125/reporting.js','src/v125/release.js','src/boot-v125.js',
    'src/v126/runtime.js','src/v126/legacy-adapter.js','src/v126/storage-inventory.js','src/v126/roadmap-horizon.js','src/v126/release.js','src/boot-v126.js',
    'src/v127/ux-policy.js','src/v127/roadmap-horizon.js','src/boot-v127.js',
    'src/v128/contracts.js','src/v128/portable-vault.js','src/boot-v128.js',
    'src/v129/workflow-evidence.js','src/v129/workflow-review.js','src/v129/integration.js','src/boot-v129.js',
    'src/v130/performance-contracts.js','src/v130/runtime-health.js','src/boot-v130.js',
    'src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js','src/boot-v131.js',
    'src/release-manifest.js','src/boot-v132.js','src/v133/longevity-drills.js','src/boot-v133.js',
    'src/v134/export-contracts.js','src/v134/local-export.js','src/boot-v134.js',
    'src/v135/resilience-contracts.js','src/boot-v135.js',
    'scripts/release-consistency.mjs','tests/helpers/release.js'
  ]) expect(workflow).toContain(`node --check ${module}`);
  for (const excluded of [
    'src/v127/release.js','src/v128/contracts.ts','src/v129/workflow-evidence.ts',
    'src/v130/performance-contracts.ts','src/v131/decision-contracts.ts','src/v133/longevity-drills.ts',
    'src/v134/export-contracts.ts','src/v134/local-export.ts','src/v135/resilience-contracts.ts'
  ]) expect(workflow).not.toContain(`node --check ${excluded}`);
  expectAll(packageJson, [
    `"version": "${currentPackageVersion}"`,
    '"release:check": "node scripts/release-consistency.mjs"',
    '"typecheck": "tsc -p tsconfig.json"',
    '"typescript": "5.9.2"',
    'tests/v134-reporting-export-contracts.spec.js',
    'tests/v135-cross-device-low-resource-resilience.spec.js'
  ]);
  expectAll(workflow, [
    'Run exact release consistency diagnostics',
    'npm run release:check 2>&1 | tee release-consistency.log',
    'Run strict TypeScript and browser-free parser tests',
    'release-consistency.log', 'npm ci --ignore-scripts'
  ]);
  expect(read('package-lock.json')).toContain('https://registry.npmjs.org/@playwright/test/-/playwright-test-1.61.1.tgz'.replace('/playwright-test-','/@playwright/test/-/test-'));
  expect(workflow.indexOf('Run exact release consistency diagnostics')).toBeLessThan(workflow.indexOf('Install Chromium and system dependencies'));
  expect(workflow.indexOf('Run strict TypeScript and browser-free parser tests')).toBeLessThan(workflow.indexOf('Install Chromium and system dependencies'));
  expect(workflow.indexOf('Run Chromium desktop preflight')).toBeLessThan(workflow.indexOf('Install Firefox and WebKit after Chromium passes'));
  expect(workflow.indexOf('Run Android Chromium preflight')).toBeLessThan(workflow.indexOf('Install WebKit after Android Chromium passes'));
});

test('analytical, portability, evidence, performance, decision, longevity, export, and resilience infrastructure remain local-only', () => {
  const localOnly = [
    'src/v113/insights.js','src/v113/views.js','src/v114/planning.js','src/v114/views.js',
    'src/v120/import-receipt-audit-model.js','src/v120/import-receipt-audit.js',
    'src/v121/receipt-integrity-model.js','src/v121/receipt-integrity.js',
    'src/v122/account-cleanup-model.js','src/v122/account-cleanup-export.js','src/v122/account-cleanup-export-controller.js','src/v122/account-cleanup.js',
    'src/v123/recurring-decisions-model.js','src/v123/recurring-decisions.js','src/v123/reporting.js',
    'src/v124/scenario-model.js','src/v124/scenario-comparison.js','src/v124/reporting.js',
    'src/v125/close-history-model.js','src/v125/close-trends.js','src/v125/reporting.js','src/v125/release.js',
    'src/v126/runtime.js','src/v126/legacy-adapter.js','src/v126/storage-inventory.js','src/v126/roadmap-horizon.js','src/v126/release.js','src/boot-v126.js',
    'src/v127/ux-policy.js','src/v127/roadmap-horizon.js','src/boot-v127.js',
    'src/v128/contracts.js','src/v128/portable-vault.js','src/boot-v128.js',
    'src/v129/workflow-evidence.js','src/v129/workflow-review.js','src/v129/integration.js','src/boot-v129.js',
    'src/v130/performance-contracts.js','src/v130/runtime-health.js','src/boot-v130.js',
    'src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js','src/boot-v131.js',
    'src/release-manifest.js','src/boot-v132.js','src/boot-v133.js','src/v133/longevity-drills.js',
    'src/boot-v134.js','src/v134/export-contracts.js','src/v134/local-export.js',
    'src/boot-v135.js','src/v135/resilience-contracts.js'
  ];
  localOnly.forEach((file) => noRemote(read(file), file));
  for (const file of localOnly) expect(read(file)).not.toContain("localStorage.setItem('gringottsBudgetVault.latest'");
  for (const file of [
    'src/v129/integration.js','src/v130/performance-contracts.js','src/v130/runtime-health.js','src/boot-v130.js',
    'src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js','src/boot-v131.js',
    'src/release-manifest.js','src/boot-v132.js','src/boot-v133.js','src/v133/longevity-drills.js',
    'src/boot-v134.js','src/v134/export-contracts.js','src/v134/local-export.js',
    'src/boot-v135.js','src/v135/resilience-contracts.js'
  ]) noBrowserStore(read(file), file);
});

test('v115 transaction writes retain backup, rollback, and verification controls', () => {
  const parser = read('src/v115/parser.js');
  const importer = read('src/v115/bank-import.js');
  noRemote(parser, 'v115 parser');
  noRemote(importer, 'v115 importer');
  expect(parser).not.toMatch(/localStorage|sessionStorage|\bsave\s*\(/);
  expectAll(importer, [
    'Download the populated destination backup before importing',
    'Import verification failed: transaction count mismatch.',
    'localStorage.setItem(destination.key', 'localStorage.setItem(destination.key, previousRaw)',
    "IMPORT_HISTORY_KEY = 'gringottsImportHistory.v1'"
  ]);
  expect(importer).not.toContain('transactions: incomingRows');
});

test('bounded metadata stores remain separate from transactions', () => {
  for (const [file, contract] of [
    ['src/v117/profile-model.js','MAX_IMPORT_PROFILES = 24'],
    ['src/v118/profile-portability-model.js','MAX_PROFILE_BUNDLE_BYTES = 256 * 1024'],
    ['src/v119/profile-versioning-model.js','MAX_PROFILE_REVISIONS = 60'],
    ['src/v121/receipt-integrity-model.js','MAX_IMPORT_BATCH_LINKS = 80'],
    ['src/v122/account-cleanup-model.js','MAX_ACCOUNT_CLEANUP_DECISIONS = 120'],
    ['src/v123/recurring-decisions-model.js','MAX_RECURRING_DECISIONS = 120'],
    ['src/v124/scenario-model.js','MAX_SCENARIOS = 24']
  ]) expect(read(file)).toContain(contract);
  expect(read('src/v125/close-history-model.js')).not.toMatch(/localStorage|sessionStorage/);
  expect(read('src/v126/storage-inventory.js')).toContain('gringottsImportHistory.v1');
  expect(read('src/v126/release.js')).toContain("domain('gringottsBudgetVault.latest', 'vault', 'authoritative'");
  expect(read('src/v126/release.js')).toContain('Only the authoritative vault may contain transaction copies.');
});

test('v125 keeps immutable closed evidence and aggregate-only non-mutating exports', () => {
  const model = read('src/v125/close-history-model.js');
  const controller = read('src/v125/close-trends.js');
  const reporting = read('src/v125/reporting.js');
  const release = read('src/v125/release.js');
  [model, controller, reporting, release].forEach((source) => noRemote(source, 'v125 source'));
  expectAll(model, [
    "evidenceSource = 'close-snapshot'", 'closedEvidenceUsesImmutableSnapshots: true', 'snapshotCurrentMismatch',
    'transferNeutral: true', 'pendingExcluded: true', 'automaticWriteAvailable: false',
    'transactionCopiesStored: false', 'causationClaimed: false'
  ]);
  expect(controller).not.toContain('gringottsBudgetVault.latest');
  expectAll(release, ["version: 'v125'", '43-sheet Vault Workbook']);
});

test('v126 remains sole lifecycle, dispatcher, and observer owner with bounded route recovery', () => {
  const boot = read('src/boot-v126.js');
  const runtime = read('src/v126/runtime.js');
  const adapter = read('src/v126/legacy-adapter.js');
  const release = read('src/v126/release.js');
  expectAll(runtime, ["observerOwner: 'v126-runtime-coordinator'", "actionOwner: 'v126-action-dispatcher'", 'maxEnhancementPasses: 3', 'new MutationObserver']);
  expectAll(adapter, ['V126SuppressedObserver', 'dispatcher.register']);
  expectAll(boot, [
    'createRuntimeCoordinator','createActionDispatcher','installLegacyLayer',
    'const MAX_BASE_ROUTE_REPLAYS = 2;','routeReplayRecoveries','lastRouteReplayAttempts','bounded attempts'
  ]);
  expect(boot).not.toMatch(/while\s*\(true\)|setInterval\s*\(/);
  for (const file of [
    'src/v126/release.js','src/boot-v127.js','src/boot-v128.js','src/v129/integration.js','src/boot-v129.js',
    'src/v130/runtime-health.js','src/boot-v130.js','src/v131/decision-contracts.js','src/v131/decision-gate-ui.js',
    'src/v131/integration.js','src/boot-v131.js','src/release-manifest.js','src/boot-v132.js','src/boot-v133.js',
    'src/v133/longevity-drills.js','src/boot-v134.js','src/v134/export-contracts.js','src/v134/local-export.js',
    'src/boot-v135.js','src/v135/resilience-contracts.js'
  ]) expect(read(file)).not.toContain('new MutationObserver');
  expectAll(release, ['43-sheet reliability-capped Vault Workbook', "version: 'v126'", "stableRescue: 'rescue-v105.html'"]);
});

test('v127 and v128 retain presentation and portable-vault boundaries', () => {
  const policy = read('src/v127/ux-policy.js');
  const roadmap = read('src/v127/roadmap-horizon.js');
  const boot127 = read('src/boot-v127.js');
  const contractsTs = read('src/v128/contracts.ts');
  const portableTs = read('src/v128/portable-vault.ts');
  const portableJs = read('src/v128/portable-vault.js');
  const boot128 = read('src/boot-v128.js');
  expectAll(policy, ["version: 'v127'", 'workbookSheets: 43']);
  expectAll(roadmap, ["version: 'v135', status: 'current'", "version: 'v136'", 'ROADMAP_HORIZON.length !== 10']);
  expectAll(boot127, ["import './boot-v126.js?v=127base2'", 'observerAdded: false', 'storageWritesAdded: false', 'networkBudgetDelta: 0']);
  expectAll(contractsTs, ["AUTHORITATIVE_VAULT_KEY = 'gringottsBudgetVault.latest'", 'interface VaultStorageAdapter']);
  expectAll(portableTs, ['createPortableVaultPackage', 'integrity verification failed']);
  noRemote(portableJs, 'v128 portable vault');
  noBrowserStore(portableJs, 'v128 portable vault');
  expectAll(boot128, ["import './boot-v126.js?v=128base1'", 'typeScriptStrict: true', 'encryptionReady: false', 'cloudAdaptersEnabled: false', 'networkImplementationAdded: false']);
});

test('v129-v131 remain manual, privacy-filtered, runtime-owned, and budget-authoritative', () => {
  const evidenceTs = read('src/v129/workflow-evidence.ts');
  const evidenceJs = read('src/v129/workflow-evidence.js');
  const review = read('src/v129/workflow-review.js');
  const integration129 = read('src/v129/integration.js');
  expectAll(evidenceTs, ['interface WorkflowObservation', 'WORKFLOW_INVENTORY', "buildExportFilename('workflow-review'"]);
  expectAll(evidenceJs, ['automaticTelemetry: false', 'financialDataIncluded: false', "buildExportFilename('workflow-review'"]);
  expect(evidenceJs).not.toContain('gringottsBudgetVault.latest');
  noRemote(evidenceJs, 'v129 evidence model');
  noBrowserStore(evidenceJs, 'v129 evidence model');
  expectAll(review, ['const reviewState = new Map()', 'Download Local Review JSON', "id:'workflow-review'", "dispatcher.register('click','v129-workflow-review-actions'"]);
  expect(review).not.toMatch(/document\.addEventListener\('(change|click)'/);
  expectAll(integration129, ['registerWithCoordinator = true', 'registeredAsRelease', 'dispatcherOwned: true', 'coordinatorOwned: true']);

  const performanceTs = read('src/v130/performance-contracts.ts');
  const performanceJs = read('src/v130/performance-contracts.js');
  expectAll(performanceTs, [
    'interface PerformanceBudgetInput','evaluatePerformanceBudget','maxNetworkRequests: 45','maxScriptBytes: 500_000',
    'maxWorkbookSheets: 43','maxRuntimeObservers: 1','maxPrimaryDestinations: 6','maxSessionSamples: 12'
  ]);
  expectAll(performanceJs, ['evaluatePerformanceBudget','maxNetworkRequests: 45','maxScriptBytes: 500_000','maxWorkbookSheets: 43']);

  const decisionTs = read('src/v131/decision-contracts.ts');
  const decisionJs = read('src/v131/decision-contracts.js');
  const decisionUi = read('src/v131/decision-gate-ui.js');
  const integration131 = read('src/v131/integration.js');
  expectAll(decisionTs, ["GateState = 'evidence-incomplete'", "'runtime-blocked'", "'decision-ready'", 'evaluateRuntimeEvidence']);
  expectAll(decisionJs, ['automaticApproval: false','financialDataIncluded: false','persistentStoreUsed: false','remoteTransmission: false']);
  expectAll(decisionUi, ['Choose Workflow Review JSON','Download Decision Record',"id:'decision-record'",'window.GringottsV130?.snapshot?.()']);
  expect(decisionUi).not.toMatch(/document\.addEventListener\('(change|click)'/);
  expectAll(integration131, ["import('./decision-gate-ui.js?v=131ui2')", 'integrationLazy:true', 'uiLazy:true', 'automaticApproval:false']);
});

test('v132 compatibility remains manifest-only', () => {
  const executable = read('src/boot-v132.js').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  expect(executable).toBe("export * from './release-manifest.js';");
  noRemote(executable, 'v132 compatibility source');
  noBrowserStore(executable, 'v132 compatibility source');
  expect(executable).not.toMatch(/registerRelease|new MutationObserver|gringottsBudgetVault\.latest/);
});

test('v133 remains lazy and synthetic-only under v135', () => {
  const manifest = read('src/release-manifest.js');
  const boot = read('src/boot-v133.js');
  const drillJs = read('src/v133/longevity-drills.js');
  const drillTs = read('src/v133/longevity-drills.ts');
  expectAll(manifest, [
    "version:'v135'", "previousRelease:'v134'", "import(`./v133/longevity-drills.js?v=${A.longevity}`)",
    'runSyntheticDrill:runLongevity', "featureRelease:'v133'"
  ]);
  expect(boot.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe("export * from './release-manifest.js';");
  expect(manifest).not.toMatch(/^import .*v133\/longevity-drills\.js/gm);
  expectAll(drillJs, [
    "LONGEVITY_DRILL_KIND = 'gringotts-local-data-longevity-drill'", 'LONGEVITY_SCENARIOS',
    'authoritativeVaultRead: false', 'authoritativeVaultWrite: false', 'automaticCleanup: false',
    'destructiveActionPerformed: false', 'networkRequired: false', 'persistentStoreAdded: false'
  ]);
  expectAll(drillTs, ['LongevityScenario', 'LongevityDrillReport', 'runLongevityDrill', 'createSyntheticLongLivedVault']);
  expect(drillJs).not.toMatch(/serviceWorker\.register|new MutationObserver|\.removeItem\s*\(|\.clear\s*\(|deleteDatabase\s*\(/);
});

test('v134 remains a lazy retained export capability under v135', () => {
  const manifest = read('src/release-manifest.js');
  const boot = read('src/boot-v134.js');
  const contractsJs = read('src/v134/export-contracts.js');
  const contractsTs = read('src/v134/export-contracts.ts');
  const executorJs = read('src/v134/local-export.js');
  const executorTs = read('src/v134/local-export.ts');
  expectAll(manifest, ['window.GringottsV134','retainedOutputCount:16','catalogLoaded:false','executorLoaded:false']);
  expect(boot.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe("export * from './release-manifest.js';");
  expect(manifest).not.toMatch(/^import .*v134\/(?:export-contracts|local-export)\.js/gm);
  expectAll(contractsJs, ["EXPORT_CONTRACT_RELEASE = 'v134'", 'WORKBOOK_SHEET_CAP = 43', 'EXPORT_CATALOG', 'WORKBOOK_OWNERSHIP', 'assertExportPayloadSafe']);
  expectAll(contractsTs, ['interface ExportContract','interface WorkbookOwnershipGroup','buildExportFilename','validateWorkbookOwnership']);
  expectAll(executorJs, ['executeLocalExport',"status:'cancelled'", "status:'dispatched'",'createObjectURL','revokeObjectURL']);
  expectAll(executorTs, ['interface LocalExportRequest','LocalExportResult','executeLocalExport']);
  for (const source of [contractsJs, contractsTs, executorJs, executorTs]) expect(source).not.toMatch(/new MutationObserver|serviceWorker\.register|setInterval\s*\(|\bretry\s*\(/);
});

test('v135 is current, test-owned, bounded, and absent from normal startup', () => {
  const manifest = read('src/release-manifest.js');
  const boot = read('src/boot-v135.js');
  const contractsJs = read('src/v135/resilience-contracts.js');
  const contractsTs = read('src/v135/resilience-contracts.ts');
  const index = read('index.html');
  const app = read('app.html');
  expectAll(manifest, [
    "version:'v135'", "packageVersion:'135.0.0'", "name:'Cross-Device & Low-Resource Resilience'",
    "bootSpecifier:'src/release-manifest.js?v=135release1'", 'maxNetworkRequests:45', 'maxScriptBytes:500_000',
    'maxWorkbookSheets:43','maxRuntimeObservers:1','maxPrimaryDestinations:6','window.GringottsV135',
    'profileCount:6','largeVaultTransactionCount:1200','contractsLoaded:false'
  ]);
  expect(boot.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toBe("export * from './release-manifest.js';");
  expect(manifest).not.toMatch(/^import .*v135\/resilience-contracts\.js/gm);
  for (const source of [contractsJs, contractsTs]) {
    expectAll(source, ["RESILIENCE_RELEASE = 'v135'",'RESILIENCE_PROFILES','LARGE_VAULT_TRANSACTION_COUNT','evaluateResilienceEvidence','deviceForkAllowed:false','persistentCacheAllowed:false']);
    noRemote(source, 'v135 resilience contract');
    noBrowserStore(source, 'v135 resilience contract');
    expect(source).not.toMatch(/navigator\.userAgent|userAgentData|new MutationObserver|serviceWorker|CacheStorage|caches\./);
  }
  for (const shell of [index, app]) {
    expectAll(shell, ['<title>Gringotts Budget Vault</title>','src/release-manifest.js?v=135release1','styles/v106-v107.css','styles/v116.css']);
    expect(shell).not.toMatch(/<title>[^<]*v\d+/i);
    expect(shell).not.toMatch(/<script[^>]+src=["']src\/boot-v(?:129|130|131|132|133|134|135)\.js/i);
  }
  expect(currentVersion).toBe('v135');
});

test('public repository quality and release-control files remain present through v135', () => {
  const required = [
    'SECURITY.md','.github/dependabot.yml','.github/workflows/codeql.yml','.github/workflows/playwright.yml',
    '.github/workflows/quality.yml','.github/workflows/security.yml','.github/workflows/supply-chain.yml','.github/workflows/scorecard.yml',
    'playwright.quality.config.js','lighthouserc.cjs','scripts/privacy-history-scan.mjs','scripts/release-consistency.mjs',
    'quality-tests/accessibility.spec.js','quality-tests/v124-accessibility.spec.js','quality-tests/v125-accessibility.spec.js',
    'quality-tests/v126-accessibility.spec.js','quality-tests/v127-accessibility.spec.js','quality-tests/v129-accessibility.spec.js',
    'quality-tests/v130-accessibility.spec.js','quality-tests/v131-accessibility.spec.js','quality-tests/v132-accessibility.spec.js',
    'quality-tests/tab-semantics.spec.js','quality-tests/visual-contracts.spec.js',
    'src/boot-v125.js','src/boot-v126.js','src/boot-v127.js','src/boot-v128.js','src/boot-v129.js','src/boot-v130.js',
    'src/boot-v131.js','src/boot-v132.js','src/boot-v133.js','src/boot-v134.js','src/boot-v135.js','src/release-manifest.js',
    'src/v126/runtime.js','src/v126/legacy-adapter.js','src/v126/storage-inventory.js','src/v127/ux-policy.js','src/v127/roadmap-horizon.js',
    'src/v128/contracts.ts','src/v128/contracts.js','src/v128/portable-vault.ts','src/v128/portable-vault.js',
    'src/v129/workflow-evidence.ts','src/v129/workflow-evidence.js','src/v129/workflow-review.js','src/v129/integration.js',
    'src/v130/performance-contracts.ts','src/v130/performance-contracts.js','src/v130/runtime-health.js',
    'src/v131/decision-contracts.ts','src/v131/decision-contracts.js','src/v131/decision-gate-ui.js','src/v131/integration.js',
    'src/v133/longevity-drills.ts','src/v133/longevity-drills.js',
    'src/v134/export-contracts.ts','src/v134/export-contracts.js','src/v134/local-export.ts','src/v134/local-export.js',
    'src/v135/resilience-contracts.ts','src/v135/resilience-contracts.js','tsconfig.json','tests/helpers/release.js',
    'tests-node/v129-workflow-evidence-review.test.mjs','tests-node/v130-performance-maintenance.test.mjs',
    'tests-node/v131-observed-needs-decision-gate.test.mjs','tests-node/v132-release-test-infrastructure.test.mjs',
    'tests-node/v133-local-data-longevity.test.mjs','tests-node/v134-reporting-export-contracts.test.mjs',
    'tests-node/v135-cross-device-resilience.test.mjs','tests-node/v135-keyboard-route-replay.test.mjs',
    'tests/v129-workflow-evidence-review.spec.js','tests/v130-performance-maintenance.spec.js',
    'tests/v131-observed-needs-decision-gate.spec.js','tests/v132-release-test-infrastructure.spec.js',
    'tests/v133-local-data-longevity.spec.js','tests/v134-reporting-export-contracts.spec.js',
    'tests/v135-cross-device-low-resource-resilience.spec.js','tests/fixtures/longevity/README.md',
    'RELEASE_NOTES_v129_HOUSEHOLD_WORKFLOW_EVIDENCE_REVIEW.md','V129_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v130_PERFORMANCE_MAINTENANCE_HARDENING.md','V130_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v131_OBSERVED_NEEDS_DECISION_GATE.md','V131_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md','V132_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v133_LOCAL_DATA_LONGEVITY_DRILLS.md','V133_SECURITY_REVIEW.md','V133_IMPLEMENTATION_SCOPE.md',
    'RELEASE_NOTES_v134_REPORTING_EXPORT_CONTRACT_CONSOLIDATION.md','V134_SECURITY_REVIEW.md','V134_IMPLEMENTATION_SCOPE.md',
    'RELEASE_NOTES_v135_CROSS_DEVICE_LOW_RESOURCE_RESILIENCE.md','V135_SECURITY_REVIEW.md','V135_IMPLEMENTATION_SCOPE.md'
  ];
  expect(required.filter((file) => !fs.existsSync(path.join(root, file))), 'Missing repository security or quality controls').toEqual([]);
  expect(currentVersion).toBe('v135');
});
