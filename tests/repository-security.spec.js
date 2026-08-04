import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expectAll = (source, values) => values.forEach((value) => expect(source).toContain(value));
const noRemote = (source, label) => expect(source, `${label} must remain local-first`).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
const noBrowserStore = (source, label) => expect(source, `${label} must not add browser persistence`).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
const workflowFiles = () => fs.readdirSync(path.join(root, '.github', 'workflows'))
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => ({ name, content: read(`.github/workflows/${name}`) }));

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
  for (const name of ['playwright.yml', 'quality.yml', 'security.yml', 'supply-chain.yml', 'codeql.yml']) {
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

test('quality automation retains accessibility, visual, and Lighthouse budgets through v130', () => {
  const workflow = read('.github/workflows/quality.yml');
  const lighthouse = read('lighthouserc.cjs');
  const packageJson = read('package.json');
  expect(workflow).toContain('npm exec --yes --package=@lhci/cli@0.15.1 -- lhci');
  for (const file of [
    'quality-tests/v120-accessibility.spec.js', 'quality-tests/v121-accessibility.spec.js',
    'quality-tests/v122-accessibility.spec.js', 'quality-tests/v123-accessibility.spec.js',
    'quality-tests/v124-accessibility.spec.js', 'quality-tests/v125-accessibility.spec.js',
    'quality-tests/v126-accessibility.spec.js', 'quality-tests/v127-accessibility.spec.js',
    'quality-tests/v129-accessibility.spec.js', 'quality-tests/v130-accessibility.spec.js'
  ]) expectAll(`${workflow}\n${packageJson}`, [file]);
  expectAll(workflow, ['npm ci --ignore-scripts']);
  expect(workflow).not.toContain('temporaryPublicStorage: true');
  expect(workflow).not.toContain('--update-snapshots');
  expect(packageJson).toContain('quality-tests/visual-contracts.spec.js');
  expectAll(lighthouse, [
    "target: 'filesystem'", "outputDir: './lighthouse-reports'",
    "'network-requests': ['error', { maxLength: 45",
    "'resource-summary:script:size': ['error', { maxNumericValue: 500000"
  ]);
});

test('parser preflight checks inherited and current release modules plus strict TypeScript before browser installation', () => {
  const workflow = read('.github/workflows/playwright.yml');
  const packageJson = read('package.json');
  const modules = [
    'src/v117/profile-model.js', 'src/v117/import-profiles.js',
    'src/v118/profile-portability-model.js', 'src/v118/institution-patterns.js', 'src/v118/profile-portability.js', 'src/v118/release.js',
    'src/v119/profile-versioning-model.js', 'src/v119/profile-versioning.js', 'src/v119/release.js',
    'src/v120/import-receipt-audit-model.js', 'src/v120/import-receipt-audit.js', 'src/v120/roadmap-horizon.js', 'src/v120/release.js',
    'src/v121/receipt-integrity-model.js', 'src/v121/receipt-integrity.js', 'src/v121/roadmap-horizon.js', 'src/v121/reporting.js', 'src/v121/release.js',
    'src/v122/account-cleanup-model.js', 'src/v122/account-cleanup-export.js', 'src/v122/account-cleanup-export-controller.js', 'src/v122/account-cleanup.js', 'src/v122/roadmap-horizon.js', 'src/v122/reporting.js',
    'src/v123/recurring-decisions-model.js', 'src/v123/recurring-decisions.js', 'src/v123/roadmap-horizon.js', 'src/v123/reporting.js',
    'src/v124/scenario-model.js', 'src/v124/scenario-comparison.js', 'src/v124/roadmap-horizon.js', 'src/v124/reporting.js', 'src/v124/release.js', 'src/boot-v124.js',
    'src/v125/close-history-model.js', 'src/v125/close-trends.js', 'src/v125/roadmap-horizon.js', 'src/v125/reporting.js', 'src/v125/release.js', 'src/boot-v125.js',
    'src/v126/runtime.js', 'src/v126/legacy-adapter.js', 'src/v126/storage-inventory.js', 'src/v126/roadmap-horizon.js', 'src/v126/release.js', 'src/boot-v126.js',
    'src/v127/ux-policy.js', 'src/v127/roadmap-horizon.js', 'src/boot-v127.js',
    'src/v128/contracts.js', 'src/v128/portable-vault.js', 'src/boot-v128.js',
    'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/v129/integration.js', 'src/boot-v129.js',
    'src/v130/performance-contracts.js', 'src/v130/runtime-health.js', 'src/boot-v130.js'
  ];
  modules.forEach((module) => expect(workflow).toContain(`node --check ${module}`));
  for (const excluded of ['src/v127/release.js', 'src/v128/contracts.ts', 'src/v129/workflow-evidence.ts', 'src/v130/performance-contracts.ts']) {
    expect(workflow).not.toContain(`node --check ${excluded}`);
  }
  expectAll(packageJson, ['"version": "130.0.0"', '"typecheck": "tsc -p tsconfig.json"', '"typescript": "5.9.2"']);
  expect(read('tsconfig.json')).toContain('src/v130/**/*.ts');
  expect(workflow).toContain('npm ci --ignore-scripts');
  expect(workflow.indexOf('Run strict TypeScript and browser-free parser tests')).toBeLessThan(workflow.indexOf('Install Chromium and system dependencies'));
  expect(workflow.indexOf('Run Chromium desktop preflight')).toBeLessThan(workflow.indexOf('Install Firefox and WebKit after Chromium passes'));
  expect(workflow.indexOf('Run Android Chromium preflight')).toBeLessThan(workflow.indexOf('Install WebKit after Android Chromium passes'));
});

test('analytical, planning, portability, workflow-evidence, and performance layers remain local and do not silently write the vault', () => {
  const localOnly = [
    'src/v113/insights.js', 'src/v113/views.js', 'src/v114/planning.js', 'src/v114/views.js',
    'src/v120/import-receipt-audit-model.js', 'src/v120/import-receipt-audit.js',
    'src/v121/receipt-integrity-model.js', 'src/v121/receipt-integrity.js',
    'src/v122/account-cleanup-model.js', 'src/v122/account-cleanup-export.js', 'src/v122/account-cleanup-export-controller.js', 'src/v122/account-cleanup.js',
    'src/v123/recurring-decisions-model.js', 'src/v123/recurring-decisions.js', 'src/v123/reporting.js',
    'src/v124/scenario-model.js', 'src/v124/scenario-comparison.js', 'src/v124/reporting.js',
    'src/v125/close-history-model.js', 'src/v125/close-trends.js', 'src/v125/reporting.js', 'src/v125/release.js',
    'src/v126/runtime.js', 'src/v126/legacy-adapter.js', 'src/v126/storage-inventory.js', 'src/v126/roadmap-horizon.js', 'src/v126/release.js',
    'src/v127/ux-policy.js', 'src/v127/roadmap-horizon.js', 'src/boot-v127.js',
    'src/v128/contracts.js', 'src/v128/portable-vault.js', 'src/boot-v128.js',
    'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/v129/integration.js', 'src/boot-v129.js',
    'src/v130/performance-contracts.js', 'src/v130/runtime-health.js', 'src/boot-v130.js'
  ];
  localOnly.forEach((file) => noRemote(read(file), file));
  for (const file of localOnly) expect(read(file)).not.toContain("localStorage.setItem('gringottsBudgetVault.latest'");
  for (const file of ['src/v129/integration.js', 'src/v130/performance-contracts.js', 'src/v130/runtime-health.js', 'src/boot-v130.js']) {
    noBrowserStore(read(file), file);
    expect(read(file)).not.toMatch(/gringottsBudgetVault\.latest|merchant_name|account_id|transaction_id/);
  }
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
    ['src/v117/profile-model.js', 'MAX_IMPORT_PROFILES = 24'],
    ['src/v118/profile-portability-model.js', 'MAX_PROFILE_BUNDLE_BYTES = 256 * 1024'],
    ['src/v119/profile-versioning-model.js', 'MAX_PROFILE_REVISIONS = 60'],
    ['src/v121/receipt-integrity-model.js', 'MAX_IMPORT_BATCH_LINKS = 80'],
    ['src/v122/account-cleanup-model.js', 'MAX_ACCOUNT_CLEANUP_DECISIONS = 120'],
    ['src/v123/recurring-decisions-model.js', 'MAX_RECURRING_DECISIONS = 120'],
    ['src/v124/scenario-model.js', 'MAX_SCENARIOS = 24']
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

test('v126 remains the sole route lifecycle, action dispatcher, and observer owner', () => {
  const boot = read('src/boot-v126.js');
  const runtime = read('src/v126/runtime.js');
  const adapter = read('src/v126/legacy-adapter.js');
  const release = read('src/v126/release.js');
  expectAll(runtime, ["observerOwner: 'v126-runtime-coordinator'", "actionOwner: 'v126-action-dispatcher'", 'maxEnhancementPasses: 3', 'new MutationObserver']);
  expectAll(adapter, ['V126SuppressedObserver', 'dispatcher.register']);
  expectAll(boot, ['createRuntimeCoordinator', 'createActionDispatcher', 'installLegacyLayer']);
  for (const file of ['src/v126/release.js', 'src/boot-v127.js', 'src/boot-v128.js', 'src/v129/integration.js', 'src/boot-v129.js', 'src/v130/runtime-health.js', 'src/boot-v130.js']) {
    expect(read(file)).not.toContain('new MutationObserver');
  }
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
  expectAll(roadmap, ["version: 'v136'", 'ROADMAP_HORIZON.length !== 10']);
  expectAll(boot127, ["import './boot-v126.js?v=127base2'", 'observerAdded: false', 'storageWritesAdded: false', 'networkBudgetDelta: 0']);
  expectAll(contractsTs, ["AUTHORITATIVE_VAULT_KEY = 'gringottsBudgetVault.latest'", 'interface VaultStorageAdapter']);
  expectAll(portableTs, ['createPortableVaultPackage', 'integrity verification failed']);
  noRemote(portableJs, 'v128 portable vault');
  noBrowserStore(portableJs, 'v128 portable vault');
  expectAll(boot128, ["import './boot-v126.js?v=128base1'", 'typeScriptStrict: true', 'encryptionReady: false', 'cloudAdaptersEnabled: false', 'networkImplementationAdded: false']);
});

test('v129 workflow evidence is manual-only and now uses v126 ownership', () => {
  const modelTs = read('src/v129/workflow-evidence.ts');
  const modelJs = read('src/v129/workflow-evidence.js');
  const controller = read('src/v129/workflow-review.js');
  const integration = read('src/v129/integration.js');
  const compatibilityBoot = read('src/boot-v129.js');
  expectAll(modelTs, ['interface WorkflowObservation', 'WORKFLOW_INVENTORY']);
  expectAll(modelJs, ['automaticTelemetry: false', 'financialDataIncluded: false']);
  expect(modelJs).not.toContain('gringottsBudgetVault.latest');
  noRemote(modelJs, 'v129 evidence model');
  noBrowserStore(modelJs, 'v129 evidence model');
  expectAll(controller, [
    'const reviewState = new Map()', 'Download Local Review JSON',
    "dispatcher.register('change','v129-workflow-review-fields'", "dispatcher.register('click','v129-workflow-review-actions'"
  ]);
  expect(controller).not.toMatch(/document\.addEventListener\('(change|click)'/);
  expectAll(integration, [
    "dispatcher.register('click', 'v129-workflow-review-route'", 'coordinator.registerRelease({',
    'dispatcherOwned: true', 'coordinatorOwned: true', 'standaloneClickListener: false', 'standaloneRouteReadyListener: false'
  ]);
  expect(integration).not.toMatch(/window\.addEventListener\('click'/);
  expect(compatibilityBoot).toContain("import './boot-v128.js?v=129base3'");
  expect(compatibilityBoot).toContain('installWorkflowReviewIntegration');
});

test('v130 enforces bounded performance contracts and flattens the active boot path without new persistence', () => {
  const contractsTs = read('src/v130/performance-contracts.ts');
  const contractsJs = read('src/v130/performance-contracts.js');
  const runtime = read('src/v130/runtime-health.js');
  const boot = read('src/boot-v130.js');
  const index = read('index.html');
  const app = read('app.html');
  expectAll(contractsTs, [
    'interface PerformanceBudgetInput', 'evaluatePerformanceBudget',
    'maxNetworkRequests: 45', 'maxScriptBytes: 500_000', 'maxWorkbookSheets: 43',
    'maxRuntimeObservers: 1', 'maxPrimaryDestinations: 6', 'maxSessionSamples: 12'
  ]);
  expectAll(contractsJs, ['evaluatePerformanceBudget', 'maxNetworkRequests: 45', 'maxScriptBytes: 500_000', 'maxWorkbookSheets: 43']);
  expectAll(runtime, [
    'memoryOnlyHistory: true', 'financialDataRead: false', 'persistentStoreAdded: false',
    'networkImplementationAdded: false', 'observerAdded: false', 'serviceWorkerAdded: false',
    'coordinator.registerRelease({', 'maxSessionSamples'
  ]);
  expectAll(boot, ["import './boot-v128.js?v=130base1'", 'installWorkflowReviewIntegration', 'installV130Performance']);
  expect(boot).not.toContain('boot-v129');
  for (const source of [contractsJs, runtime, boot]) {
    noRemote(source, 'v130 source');
    noBrowserStore(source, 'v130 source');
  }
  for (const shell of [index, app]) {
    expectAll(shell, ['Gringotts Budget Vault v130', 'src/boot-v130.js?v=130hardening1', 'styles/v106-v107.css', 'styles/v116.css']);
    expect(shell).not.toContain('src/boot-v129.js');
    for (const absent of [
      'styles/v106.css', 'styles/v107.css', 'styles/v113.css', 'styles/v127.css', 'styles/v128.css', 'styles/v129.css', 'styles/v130.css',
      'styles/v120.css', 'styles/v121.css', 'styles/v122.css', 'styles/v123.css', 'styles/v124.css', 'styles/v125.css', 'styles/v126.css'
    ]) expect(shell).not.toContain(absent);
  }
});

test('public repository quality and release-control files remain present through v130', () => {
  const required = [
    'SECURITY.md', '.github/dependabot.yml', '.github/workflows/codeql.yml', '.github/workflows/playwright.yml',
    '.github/workflows/quality.yml', '.github/workflows/security.yml', '.github/workflows/supply-chain.yml', '.github/workflows/scorecard.yml',
    'playwright.quality.config.js', 'lighthouserc.cjs', 'scripts/privacy-history-scan.mjs',
    'quality-tests/accessibility.spec.js', 'quality-tests/v124-accessibility.spec.js', 'quality-tests/v125-accessibility.spec.js',
    'quality-tests/v126-accessibility.spec.js', 'quality-tests/v127-accessibility.spec.js', 'quality-tests/v129-accessibility.spec.js',
    'quality-tests/v130-accessibility.spec.js', 'quality-tests/tab-semantics.spec.js', 'quality-tests/visual-contracts.spec.js',
    'src/boot-v125.js', 'src/boot-v126.js', 'src/boot-v127.js', 'src/boot-v128.js', 'src/boot-v129.js', 'src/boot-v130.js',
    'src/v125/release.js', 'src/v126/release.js', 'src/v126/runtime.js', 'src/v126/legacy-adapter.js', 'src/v126/storage-inventory.js',
    'src/v126/roadmap-horizon.js', 'src/v127/ux-policy.js', 'src/v127/roadmap-horizon.js',
    'src/v128/contracts.ts', 'src/v128/contracts.js', 'src/v128/portable-vault.ts', 'src/v128/portable-vault.js',
    'src/v129/workflow-evidence.ts', 'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/v129/integration.js',
    'src/v130/performance-contracts.ts', 'src/v130/performance-contracts.js', 'src/v130/runtime-health.js', 'tsconfig.json',
    'styles/v106-v107.css', 'styles/v113.css', 'styles/v116.css',
    'tests-node/close-history-explainability.test.mjs', 'tests-node/v125-release-contract.test.mjs',
    'tests-node/v126-runtime-consolidation.test.mjs', 'tests-node/v127-ux-polish.test.mjs',
    'tests-node/v128-typescript-portable-vault.test.mjs', 'tests-node/v129-workflow-evidence-review.test.mjs',
    'tests-node/v130-performance-maintenance.test.mjs',
    'tests/close-history-explainability.spec.js', 'tests/runtime-consolidation.spec.js', 'tests/ux-polish-simplification.spec.js',
    'tests/v128-portable-vault-foundation.spec.js', 'tests/v129-workflow-evidence-review.spec.js', 'tests/v130-performance-maintenance.spec.js',
    'BANK_IMPORT_ROADMAP.md',
    'RELEASE_NOTES_v127_UX_POLISH_SIMPLIFICATION.md', 'V127_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v128_TYPESCRIPT_PORTABLE_VAULT_FOUNDATION.md', 'V128_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v129_HOUSEHOLD_WORKFLOW_EVIDENCE_REVIEW.md', 'V129_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v130_PERFORMANCE_MAINTENANCE_HARDENING.md', 'V130_SECURITY_REVIEW.md'
  ];
  expect(required.filter((file) => !fs.existsSync(path.join(root, file))), 'Missing repository security or quality controls').toEqual([]);
});
