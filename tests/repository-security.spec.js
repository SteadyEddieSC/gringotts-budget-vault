import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function workflowFiles() {
  const directory = path.join(root, '.github', 'workflows');
  return fs.readdirSync(directory)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => ({ name, content: fs.readFileSync(path.join(directory, name), 'utf8') }));
}

function expectNoRemoteRuntime(source, label) {
  expect(source, `${label} must remain local-first`).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
}

test('all third-party GitHub Actions remain pinned to full commit SHAs', () => {
  const failures = [];
  for (const workflow of workflowFiles()) {
    for (const match of workflow.content.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)) {
      const reference = match[1];
      if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
      const ref = reference.slice(reference.lastIndexOf('@') + 1);
      if (!/^[0-9a-f]{40}$/i.test(ref)) failures.push(`${workflow.name}: ${reference}`);
    }
  }
  expect(failures, 'Unpinned GitHub Action references').toEqual([]);
});

test('workflows retain least privilege, safe pull-request triggers, and draft gating', () => {
  const required = ['playwright.yml', 'quality.yml', 'security.yml', 'supply-chain.yml', 'codeql.yml'];
  for (const name of required) {
    const workflow = read(`.github/workflows/${name}`);
    expect(workflow).not.toMatch(/\bpull_request_target\s*:/i);
    expect(workflow).not.toMatch(/\bpermissions\s*:\s*write-all\b/i);
    expect(workflow).not.toMatch(/^\s*contents:\s*write\s*$/mi);
    expect(workflow).toContain('ready_for_review');
    expect(workflow).toContain('github.event.pull_request.draft == false');
  }
  const codeql = read('.github/workflows/codeql.yml');
  expect(codeql).toMatch(/^permissions: read-all$/m);
  expect(codeql).toMatch(/security-events: write/);
});

test('Cloudflare headers preserve the local-first browser boundary', () => {
  const headers = read('_headers');
  for (const value of [
    "default-src 'self'", "frame-ancestors 'none'", "connect-src 'self'", "worker-src 'none'",
    'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Referrer-Policy: no-referrer',
    'Cross-Origin-Opener-Policy: same-origin', 'Cross-Origin-Resource-Policy: same-origin'
  ]) expect(headers).toContain(value);
});

test('quality automation retains accessibility, visual, and Lighthouse budgets through v129', () => {
  const workflow = read('.github/workflows/quality.yml');
  const lighthouse = read('lighthouserc.cjs');
  const packageJson = read('package.json');
  expect(workflow).toContain('npm exec --yes --package=@lhci/cli@0.15.1 -- lhci');
  for (const file of [
    'quality-tests/v120-accessibility.spec.js', 'quality-tests/v121-accessibility.spec.js',
    'quality-tests/v122-accessibility.spec.js', 'quality-tests/v123-accessibility.spec.js',
    'quality-tests/v124-accessibility.spec.js', 'quality-tests/v125-accessibility.spec.js',
    'quality-tests/v126-accessibility.spec.js', 'quality-tests/v127-accessibility.spec.js',
    'quality-tests/v129-accessibility.spec.js'
  ]) {
    expect(workflow).toContain(file);
    expect(packageJson).toContain(file);
  }
  expect(workflow).toContain('npm ci --ignore-scripts');
  expect(workflow).not.toContain('temporaryPublicStorage: true');
  expect(workflow).not.toContain('--update-snapshots');
  expect(packageJson).toContain('quality-tests/visual-contracts.spec.js');
  expect(lighthouse).toContain("target: 'filesystem'");
  expect(lighthouse).toContain("outputDir: './lighthouse-reports'");
  expect(lighthouse).toContain("'network-requests': ['error', { maxLength: 45");
  expect(lighthouse).toContain("'script-treemap-data': ['error', { maxNumericValue: 500000");
});

test('parser preflight checks inherited and current release modules plus strict TypeScript before browser installation', () => {
  const playwright = read('.github/workflows/playwright.yml');
  const packageJson = read('package.json');
  const modules = [
    'src/v117/profile-model.js', 'src/v117/import-profiles.js',
    'src/v118/profile-portability-model.js', 'src/v118/institution-patterns.js',
    'src/v118/profile-portability.js', 'src/v118/release.js',
    'src/v119/profile-versioning-model.js', 'src/v119/profile-versioning.js', 'src/v119/release.js',
    'src/v120/import-receipt-audit-model.js', 'src/v120/import-receipt-audit.js', 'src/v120/roadmap-horizon.js', 'src/v120/release.js',
    'src/v121/receipt-integrity-model.js', 'src/v121/receipt-integrity.js', 'src/v121/roadmap-horizon.js', 'src/v121/reporting.js', 'src/v121/release.js',
    'src/v122/account-cleanup-model.js', 'src/v122/account-cleanup-export.js', 'src/v122/account-cleanup-export-controller.js',
    'src/v122/account-cleanup.js', 'src/v122/roadmap-horizon.js', 'src/v122/reporting.js',
    'src/v123/recurring-decisions-model.js', 'src/v123/recurring-decisions.js', 'src/v123/roadmap-horizon.js', 'src/v123/reporting.js',
    'src/v124/scenario-model.js', 'src/v124/scenario-comparison.js', 'src/v124/roadmap-horizon.js', 'src/v124/reporting.js', 'src/v124/release.js', 'src/boot-v124.js',
    'src/v125/close-history-model.js', 'src/v125/close-trends.js', 'src/v125/roadmap-horizon.js', 'src/v125/reporting.js', 'src/v125/release.js', 'src/boot-v125.js',
    'src/v126/runtime.js', 'src/v126/legacy-adapter.js', 'src/v126/storage-inventory.js',
    'src/v126/roadmap-horizon.js', 'src/v126/release.js', 'src/boot-v126.js',
    'src/v127/ux-policy.js', 'src/v127/roadmap-horizon.js', 'src/boot-v127.js',
    'src/v128/contracts.js', 'src/v128/portable-vault.js', 'src/boot-v128.js',
    'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/boot-v129.js'
  ];
  for (const module of modules) expect(playwright).toContain(`node --check ${module}`);
  expect(playwright).not.toContain('node --check src/v127/release.js');
  expect(playwright).not.toContain('node --check src/v128/contracts.ts');
  expect(playwright).not.toContain('node --check src/v129/workflow-evidence.ts');
  expect(packageJson).toContain('"typecheck": "tsc -p tsconfig.json"');
  expect(packageJson).toContain('"typescript": "5.9.2"');
  expect(playwright).toContain('npm ci --ignore-scripts');
  expect(playwright.indexOf('Run strict TypeScript and browser-free parser tests')).toBeLessThan(playwright.indexOf('Install Chromium and system dependencies'));
  expect(playwright.indexOf('Run Chromium desktop preflight')).toBeLessThan(playwright.indexOf('Install Firefox and WebKit after Chromium passes'));
  expect(playwright.indexOf('Run Android Chromium preflight')).toBeLessThan(playwright.indexOf('Install WebKit after Android Chromium passes'));
});

test('analytical, planning, portability, and workflow-evidence layers remain local and do not silently write the vault', () => {
  const localOnly = [
    'src/v113/insights.js', 'src/v113/views.js', 'src/v114/planning.js', 'src/v114/views.js',
    'src/v120/import-receipt-audit-model.js', 'src/v120/import-receipt-audit.js',
    'src/v121/receipt-integrity-model.js', 'src/v121/receipt-integrity.js',
    'src/v122/account-cleanup-model.js', 'src/v122/account-cleanup-export.js',
    'src/v122/account-cleanup-export-controller.js', 'src/v122/account-cleanup.js',
    'src/v123/recurring-decisions-model.js', 'src/v123/recurring-decisions.js', 'src/v123/reporting.js',
    'src/v124/scenario-model.js', 'src/v124/scenario-comparison.js', 'src/v124/reporting.js',
    'src/v125/close-history-model.js', 'src/v125/close-trends.js', 'src/v125/reporting.js', 'src/v125/release.js',
    'src/v126/runtime.js', 'src/v126/legacy-adapter.js', 'src/v126/storage-inventory.js',
    'src/v126/roadmap-horizon.js', 'src/v126/release.js',
    'src/v127/ux-policy.js', 'src/v127/roadmap-horizon.js', 'src/boot-v127.js',
    'src/v128/contracts.js', 'src/v128/portable-vault.js', 'src/boot-v128.js',
    'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/boot-v129.js'
  ];
  for (const file of localOnly) expectNoRemoteRuntime(read(file), file);
  for (const file of [
    'src/v114/planning.js', 'src/v120/import-receipt-audit.js', 'src/v121/receipt-integrity.js',
    'src/v122/account-cleanup.js', 'src/v123/recurring-decisions.js', 'src/v124/scenario-comparison.js',
    'src/v125/close-trends.js', 'src/v126/release.js', 'src/boot-v127.js',
    'src/v128/portable-vault.js', 'src/boot-v128.js', 'src/v129/workflow-evidence.js',
    'src/v129/workflow-review.js', 'src/boot-v129.js'
  ]) expect(read(file)).not.toContain("localStorage.setItem('gringottsBudgetVault.latest'");
});

test('v115 transaction writes retain backup, rollback, and verification controls', () => {
  const parser = read('src/v115/parser.js');
  const importer = read('src/v115/bank-import.js');
  expectNoRemoteRuntime(parser, 'v115 parser');
  expectNoRemoteRuntime(importer, 'v115 importer');
  expect(parser).not.toMatch(/localStorage|sessionStorage|\bsave\s*\(/);
  expect(importer).toContain('Download the populated destination backup before importing');
  expect(importer).toContain('Import verification failed: transaction count mismatch.');
  expect(importer).toContain('localStorage.setItem(destination.key');
  expect(importer).toContain('localStorage.setItem(destination.key, previousRaw)');
  expect(importer).toContain("IMPORT_HISTORY_KEY = 'gringottsImportHistory.v1'");
  expect(importer).not.toContain('transactions: incomingRows');
});

test('bounded metadata stores remain separate from transactions', () => {
  const contracts = [
    ['src/v117/profile-model.js', 'MAX_IMPORT_PROFILES = 24'],
    ['src/v118/profile-portability-model.js', 'MAX_PROFILE_BUNDLE_BYTES = 256 * 1024'],
    ['src/v119/profile-versioning-model.js', 'MAX_PROFILE_REVISIONS = 60'],
    ['src/v121/receipt-integrity-model.js', 'MAX_IMPORT_BATCH_LINKS = 80'],
    ['src/v122/account-cleanup-model.js', 'MAX_ACCOUNT_CLEANUP_DECISIONS = 120'],
    ['src/v123/recurring-decisions-model.js', 'MAX_RECURRING_DECISIONS = 120'],
    ['src/v124/scenario-model.js', 'MAX_SCENARIOS = 24']
  ];
  for (const [file, contract] of contracts) expect(read(file)).toContain(contract);
  expect(read('src/v125/close-history-model.js')).not.toMatch(/localStorage|sessionStorage/);
  expect(read('src/v126/storage-inventory.js')).toContain('gringottsImportHistory.v1');
  expect(read('src/boot-v127.js')).not.toMatch(/localStorage|sessionStorage/);
  expect(read('src/boot-v128.js')).not.toMatch(/localStorage|sessionStorage/);
  for (const file of ['src/v129/workflow-evidence.js', 'src/v129/workflow-review.js', 'src/boot-v129.js']) {
    expect(read(file)).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  }
});

test('v125 keeps immutable closed evidence and aggregate-only non-mutating exports', () => {
  const model = read('src/v125/close-history-model.js');
  const controller = read('src/v125/close-trends.js');
  const reporting = read('src/v125/reporting.js');
  const release = read('src/v125/release.js');
  for (const source of [model, controller, reporting, release]) expectNoRemoteRuntime(source, 'v125 source');
  expect(model).toContain("evidenceSource = 'close-snapshot'");
  expect(model).toContain('closedEvidenceUsesImmutableSnapshots: true');
  expect(model).toContain('snapshotCurrentMismatch');
  expect(model).toContain('transferNeutral: true');
  expect(model).toContain('pendingExcluded: true');
  expect(model).toContain('automaticWriteAvailable: false');
  expect(model).toContain('transactionCopiesStored: false');
  expect(model).toContain('causationClaimed: false');
  expect(controller).not.toContain('gringottsBudgetVault.latest');
  expect(release).toContain("version: 'v125'");
  expect(release).toContain('43-sheet Vault Workbook');
});

test('v126 owns one route lifecycle and specialist action dispatcher', () => {
  const boot = read('src/boot-v126.js');
  const runtime = read('src/v126/runtime.js');
  const adapter = read('src/v126/legacy-adapter.js');
  const release = read('src/v126/release.js');
  expect(runtime).toContain("observerOwner: 'v126-runtime-coordinator'");
  expect(runtime).toContain("actionOwner: 'v126-action-dispatcher'");
  expect(runtime).toContain('maxEnhancementPasses: 3');
  expect(runtime).toContain('new MutationObserver');
  expect(adapter).toContain('V126SuppressedObserver');
  expect(adapter).toContain('dispatcher.register');
  expect(boot).toContain('createRuntimeCoordinator');
  expect(boot).toContain('createActionDispatcher');
  expect(boot).toContain('installLegacyLayer');
  expect(release).not.toContain('new MutationObserver');
  expect(release).toContain('43-sheet reliability-capped Vault Workbook');
  expect(release).toContain("version: 'v126'");
  expect(release).toContain("stableRescue: 'rescue-v105.html'");
});

test('v127 retains the budget-neutral presentation policy without runtime or storage ownership', () => {
  const policy = read('src/v127/ux-policy.js');
  const roadmap = read('src/v127/roadmap-horizon.js');
  const boot = read('src/boot-v127.js');
  expect(policy).toContain("version: 'v127'");
  expect(policy).toContain('workbookSheets: 43');
  expect(roadmap).toContain("version: 'v136'");
  expect(roadmap).toContain('ROADMAP_HORIZON.length !== 10');
  expect(boot).toContain("import './boot-v126.js?v=127base2'");
  expect(boot).not.toContain("from './v127/");
  expect(boot).not.toContain('new MutationObserver');
  expect(boot).not.toMatch(/localStorage|sessionStorage/);
  expect(boot).toContain('observerAdded: false');
  expect(boot).toContain('storageWritesAdded: false');
  expect(boot).toContain('networkBudgetDelta: 0');
  expect(boot).toContain('Retained v113 household-insight styles are consolidated here');
});

test('v128 adds strict portable-vault contracts without network, storage, encryption, or cloud implementation', () => {
  const contractsTs = read('src/v128/contracts.ts');
  const portableTs = read('src/v128/portable-vault.ts');
  const portableJs = read('src/v128/portable-vault.js');
  const boot = read('src/boot-v128.js');
  expect(contractsTs).toContain("AUTHORITATIVE_VAULT_KEY = 'gringottsBudgetVault.latest'");
  expect(contractsTs).toContain('interface VaultStorageAdapter');
  expect(portableTs).toContain('createPortableVaultPackage');
  expect(portableTs).toContain('integrity verification failed');
  expect(portableJs).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB/);
  expect(boot).toContain("import './boot-v126.js?v=128base1'");
  expect(boot).not.toContain('new MutationObserver');
  expect(boot).not.toMatch(/localStorage|sessionStorage/);
  expect(boot).toContain('typeScriptStrict: true');
  expect(boot).toContain('encryptionReady: false');
  expect(boot).toContain('cloudAdaptersEnabled: false');
  expect(boot).toContain('networkImplementationAdded: false');
  expect(boot).toContain('networkBudgetDelta: 0');
});

test('v129 adds manual workflow evidence without telemetry, persistence, financial reads, or automatic decisions', () => {
  const modelTs = read('src/v129/workflow-evidence.ts');
  const modelJs = read('src/v129/workflow-evidence.js');
  const controller = read('src/v129/workflow-review.js');
  const boot = read('src/boot-v129.js');
  expect(modelTs).toContain('interface WorkflowObservation');
  expect(modelTs).toContain('WORKFLOW_INVENTORY');
  expect(modelJs).toContain('automaticTelemetry: false');
  expect(modelJs).toContain('financialDataIncluded: false');
  expect(modelJs).not.toContain('gringottsBudgetVault.latest');
  expect(modelJs).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB/);
  expect(controller).toContain('const reviewState = new Map()');
  expect(controller).toContain('Download Local Review JSON');
  expect(controller).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB/);
  expect(boot).toContain("import './boot-v128.js?v=129base2'");
  expect(boot).toContain("import('./v129/workflow-review.js?v=129evidence2')");
  expect(boot).toContain("window.addEventListener('click',handleClick,true)");
  expect(boot).not.toContain('new MutationObserver');
  expect(boot).not.toMatch(/localStorage|sessionStorage/);
  expect(boot).toContain('automaticTelemetry: false');
  expect(boot).toContain('financialDataRead: false');
  expect(boot).toContain('persistentStoreAdded: false');
  expect(boot).toContain('networkImplementationAdded: false');
  expect(boot).toContain('lazyController: true');
  expect(boot).toContain('networkBudgetDelta: 0');
});

test('v129 owns the live static shells while preserving startup budgets through lazy loading', () => {
  const boot128 = read('src/boot-v128.js');
  const boot129 = read('src/boot-v129.js');
  const index = read('index.html');
  const app = read('app.html');
  expect(index).toContain('src/boot-v129.js?v=129evidence1');
  expect(app).toContain('src/boot-v129.js?v=129evidence1');
  expect(index).toContain('styles/v106-v107.css');
  expect(app).toContain('styles/v106-v107.css');
  expect(index).not.toContain('styles/v106.css');
  expect(app).not.toContain('styles/v106.css');
  expect(index).not.toContain('styles/v107.css');
  expect(app).not.toContain('styles/v107.css');
  expect(index).not.toContain('styles/v113.css');
  expect(app).not.toContain('styles/v113.css');
  expect(index).not.toContain('styles/v127.css');
  expect(app).not.toContain('styles/v127.css');
  expect(index).not.toContain('styles/v128.css');
  expect(app).not.toContain('styles/v128.css');
  expect(index).not.toContain('styles/v129.css');
  expect(app).not.toContain('styles/v129.css');
  expect(index).toContain('styles/v116.css');
  expect(app).toContain('styles/v116.css');
  expect(boot128).toContain('const V127_CSS = String.raw');
  expect(boot129).toContain("import('./v129/workflow-review.js?v=129evidence2')");
  expect(boot129).not.toContain('.v129-workflow-review{');
  expect(boot129).not.toContain('serviceWorker');
  for (const stylesheet of ['styles/v120.css', 'styles/v121.css', 'styles/v122.css', 'styles/v123.css', 'styles/v124.css', 'styles/v125.css', 'styles/v126.css']) {
    expect(index).not.toContain(stylesheet);
    expect(app).not.toContain(stylesheet);
  }
});

test('public repository quality and release-control files remain present through v129', () => {
  const required = [
    'SECURITY.md', '.github/dependabot.yml', '.github/workflows/codeql.yml',
    '.github/workflows/playwright.yml', '.github/workflows/quality.yml', '.github/workflows/security.yml',
    '.github/workflows/supply-chain.yml', '.github/workflows/scorecard.yml',
    'playwright.quality.config.js', 'lighthouserc.cjs', 'scripts/privacy-history-scan.mjs',
    'quality-tests/accessibility.spec.js', 'quality-tests/v124-accessibility.spec.js',
    'quality-tests/v125-accessibility.spec.js', 'quality-tests/v126-accessibility.spec.js',
    'quality-tests/v127-accessibility.spec.js', 'quality-tests/v129-accessibility.spec.js',
    'quality-tests/tab-semantics.spec.js', 'quality-tests/visual-contracts.spec.js',
    'src/boot-v125.js', 'src/boot-v126.js', 'src/boot-v127.js', 'src/boot-v128.js', 'src/boot-v129.js',
    'src/v125/release.js', 'src/v126/release.js', 'src/v126/runtime.js', 'src/v126/legacy-adapter.js',
    'src/v126/storage-inventory.js', 'src/v126/roadmap-horizon.js', 'src/v127/ux-policy.js',
    'src/v127/roadmap-horizon.js', 'src/v128/contracts.ts', 'src/v128/contracts.js',
    'src/v128/portable-vault.ts', 'src/v128/portable-vault.js',
    'src/v129/workflow-evidence.ts', 'src/v129/workflow-evidence.js', 'src/v129/workflow-review.js',
    'tsconfig.json', 'styles/v106-v107.css', 'styles/v113.css', 'styles/v116.css',
    'tests-node/close-history-explainability.test.mjs', 'tests-node/v125-release-contract.test.mjs',
    'tests-node/v126-runtime-consolidation.test.mjs', 'tests-node/v127-ux-polish.test.mjs',
    'tests-node/v128-typescript-portable-vault.test.mjs', 'tests-node/v129-workflow-evidence-review.test.mjs',
    'tests/close-history-explainability.spec.js', 'tests/runtime-consolidation.spec.js',
    'tests/ux-polish-simplification.spec.js', 'tests/v128-portable-vault-foundation.spec.js',
    'tests/v129-workflow-evidence-review.spec.js', 'BANK_IMPORT_ROADMAP.md',
    'RELEASE_NOTES_v127_UX_POLISH_SIMPLIFICATION.md', 'V127_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v128_TYPESCRIPT_PORTABLE_VAULT_FOUNDATION.md', 'V128_SECURITY_REVIEW.md',
    'RELEASE_NOTES_v129_HOUSEHOLD_WORKFLOW_EVIDENCE_REVIEW.md', 'V129_SECURITY_REVIEW.md'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  expect(missing, 'Missing repository security or quality controls').toEqual([]);
});
