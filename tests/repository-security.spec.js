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

test('all third-party GitHub Actions are pinned to full commit SHAs', () => {
  const failures = [];
  for (const workflow of workflowFiles()) {
    const usesPattern = /^\s*uses:\s*([^\s#]+).*$/gm;
    for (const match of workflow.content.matchAll(usesPattern)) {
      const reference = match[1];
      if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
      const at = reference.lastIndexOf('@');
      const ref = at >= 0 ? reference.slice(at + 1) : '';
      if (!/^[0-9a-f]{40}$/i.test(ref)) failures.push(`${workflow.name}: ${reference}`);
    }
  }
  expect(failures, 'Unpinned GitHub Action references').toEqual([]);
});

test('workflows avoid dangerous broad permissions and privileged PR triggers', () => {
  const failures = [];
  for (const workflow of workflowFiles()) {
    if (/\bpull_request_target\s*:/i.test(workflow.content)) failures.push(`${workflow.name}: pull_request_target`);
    if (/\bpermissions\s*:\s*write-all\b/i.test(workflow.content)) failures.push(`${workflow.name}: permissions write-all`);
    if (/\bcontents\s*:\s*write\b/i.test(workflow.content)) failures.push(`${workflow.name}: contents write`);
  }
  expect(failures, 'Dangerous workflow capabilities').toEqual([]);
});

test('CodeQL keeps read-only defaults and grants write access only to security events', () => {
  const workflow = read('.github/workflows/codeql.yml');
  expect(workflow).toMatch(/^permissions: read-all$/m);
  expect(workflow).toMatch(/analyze:[\s\S]*?permissions:\n\s+actions: read\n\s+contents: read\n\s+security-events: write/);
  expect(workflow).not.toMatch(/^\s+packages:\s*(read|write)\s*$/m);
});

test('Cloudflare headers preserve the local-first browser boundary', () => {
  const headers = read('_headers');
  const required = [
    "default-src 'self'", "frame-ancestors 'none'", "connect-src 'self'", "worker-src 'none'",
    'X-Content-Type-Options: nosniff', 'X-Frame-Options: DENY', 'Referrer-Policy: no-referrer',
    'Cross-Origin-Opener-Policy: same-origin', 'Cross-Origin-Resource-Policy: same-origin'
  ];
  for (const value of required) expect(headers).toContain(value);
});

test('quality automation stays local and avoids public or binary baseline storage', () => {
  const workflow = read('.github/workflows/quality.yml');
  const lighthouse = read('lighthouserc.cjs');
  const packageJson = read('package.json');
  expect(workflow).toContain('npm exec --yes --package=@lhci/cli@0.15.1 -- lhci');
  expect(workflow).toContain('quality-tests/tab-semantics.spec.js quality-tests/visual-contracts.spec.js');
  expect(workflow).toContain('quality-tests/accessibility.spec.js');
  expect(workflow).toContain('npm ci --ignore-scripts');
  expect(workflow).not.toContain('treosh/lighthouse-ci-action');
  expect(workflow).not.toContain('temporaryPublicStorage: true');
  expect(workflow).not.toContain('--update-snapshots');
  expect(workflow).not.toContain('quality-tests/__screenshots__');
  expect(packageJson).toContain('quality-tests/visual-contracts.spec.js');
  expect(packageJson).not.toContain('visual-regression.spec.js');
  expect(lighthouse).toContain("target: 'filesystem'");
  expect(lighthouse).toContain("outputDir: './lighthouse-reports'");
  expect(lighthouse).toContain("http://127.0.0.1:4173/?quality=lighthouse");
  expect(lighthouse).toContain("'network-requests': ['error', { maxLength: 45");
});

test('parser preflight runs before browser installation and release workflows stay staged', () => {
  const playwright = read('.github/workflows/playwright.yml');
  const quality = read('.github/workflows/quality.yml');
  const security = read('.github/workflows/security.yml');
  const supplyChain = read('.github/workflows/supply-chain.yml');
  const codeql = read('.github/workflows/codeql.yml');
  for (const workflow of [playwright, quality, security, supplyChain, codeql]) {
    expect(workflow).toContain("github.event.pull_request.draft == false");
    expect(workflow).toContain('ready_for_review');
  }
  expect(playwright).toContain('name: Parser and static preflight');
  expect(playwright).toContain('run: npm run test:parser');
  expect(playwright).toContain('needs: parser-preflight');
  for (const module of [
    'src/v117/profile-model.js', 'src/v117/import-profiles.js',
    'src/v118/profile-portability-model.js', 'src/v118/institution-patterns.js',
    'src/v118/profile-portability.js', 'src/v118/release.js',
    'src/v119/profile-versioning-model.js', 'src/v119/profile-versioning.js',
    'src/v119/release.js', 'src/boot-v119.js'
  ]) expect(playwright).toContain(`node --check ${module}`);
  expect(playwright.indexOf('Run browser-free parser tests')).toBeLessThan(playwright.indexOf('Install Chromium and system dependencies'));
  expect(playwright.indexOf('Run Chromium desktop preflight')).toBeLessThan(playwright.indexOf('Install Firefox and WebKit after Chromium passes'));
  expect(playwright.indexOf('Run Android Chromium preflight')).toBeLessThan(playwright.indexOf('Install WebKit after Android Chromium passes'));
  expect(playwright).toMatch(/Upload Playwright failure diagnostics[\s\S]*?if: failure\(\)/);
  expect(quality).toMatch(/Upload quality failure diagnostics[\s\S]*?if: failure\(\)/);
  expect(quality).toMatch(/Upload Lighthouse failure reports[\s\S]*?if: failure\(\)/);
});

test('v113 insight calculation stays read-only and local', () => {
  const engine = read('src/v113/insights.js');
  const views = read('src/v113/views.js');
  const reporting = read('src/v113/reporting.js');
  for (const source of [engine, views, reporting]) expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(engine).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem|\bsave\s*\(/);
  expect(engine).toContain('Pending transactions are counted but excluded from unusual-spending comparisons.');
});

test('v114 Guided Planning writes only explicit separate checklist metadata', () => {
  const engine = read('src/v114/planning.js');
  const views = read('src/v114/views.js');
  const reporting = read('src/v114/reporting.js');
  for (const source of [engine, views, reporting]) {
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
    expect(source).not.toContain('gringottsBudgetVault.latest');
  }
  expect(engine).toContain("export const GUIDED_PLAN_KEY = 'gringottsGuidedPlan.v1'");
  expect(engine).toContain('Only an explicit Save Plan Item action stores checklist status');
  expect(engine).toContain('Planning-item read-back verification failed.');
});

test('v115 parser is pure and the guarded writer preserves backup and verification controls', () => {
  const parser = read('src/v115/parser.js');
  const importer = read('src/v115/bank-import.js');
  const views = read('src/v115/views.js');
  const release = read('src/v115/release.js');
  for (const source of [parser, importer, views, release]) expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(parser).not.toMatch(/localStorage|sessionStorage|\bsave\s*\(/);
  expect(parser).toContain('MAX_BANK_EXPORT_BYTES');
  expect(parser).toContain('MAX_BANK_EXPORT_ROWS');
  expect(importer).toContain('Download the populated destination backup before importing');
  expect(importer).toContain('Import verification failed: transaction count mismatch.');
  expect(importer).toContain('localStorage.setItem(destination.key');
  expect(importer).toContain('localStorage.setItem(destination.key, previousRaw)');
  expect(importer).toContain("export const IMPORT_HISTORY_KEY = 'gringottsImportHistory.v1'");
  expect(importer).not.toContain('transactions: incomingRows');
});

test('v117 mapping profiles remain bounded metadata and cannot write the vault or use the network', () => {
  const model = read('src/v117/profile-model.js');
  const controller = read('src/v117/import-profiles.js');
  for (const source of [model, controller]) expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(model).not.toMatch(/localStorage|sessionStorage/);
  expect(model).toContain("IMPORT_PROFILES_KEY = 'gringottsImportProfiles.v1'");
  expect(model).toContain('MAX_IMPORT_PROFILES = 24');
  expect(model).not.toContain('sourceFingerprint');
  expect(model).not.toContain('fileName');
  expect(controller).toContain('localStorage.setItem(IMPORT_PROFILES_KEY');
  expect(controller).toContain('Import profile verification failed');
  expect(controller).not.toContain('gringottsBudgetVault.latest');
  expect(controller).not.toContain('localStorage.setItem(destination');
});

test('v118 portability remains metadata-only, rollback-verified, and separate from the vault', () => {
  const model = read('src/v118/profile-portability-model.js');
  const patterns = read('src/v118/institution-patterns.js');
  const controller = read('src/v118/profile-portability.js');
  for (const source of [model, patterns, controller]) expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(model).not.toMatch(/localStorage|sessionStorage/);
  expect(patterns).not.toMatch(/localStorage|sessionStorage/);
  expect(model).toContain("PROFILE_BUNDLE_KIND = 'gringotts-import-profile-bundle'");
  expect(model).toContain('MAX_PROFILE_BUNDLE_BYTES = 256 * 1024');
  expect(model).toContain('Replace an identity-matched');
  expect(controller).toContain('localStorage.setItem(IMPORT_PROFILES_KEY');
  expect(controller).toContain('The previous local profile library was restored.');
  expect(controller).not.toContain('gringottsBudgetVault.latest');
  expect(controller).not.toContain('localStorage.setItem(destination');
});

test('v119 revision history and dry-run diagnostics remain bounded metadata-only channels', () => {
  const model = read('src/v119/profile-versioning-model.js');
  const controller = read('src/v119/profile-versioning.js');
  const release = read('src/v119/release.js');
  const boot = read('src/boot-v119.js');
  const index = read('index.html');
  const app = read('app.html');
  for (const source of [model, controller, release]) expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(model).not.toMatch(/localStorage|sessionStorage/);
  expect(model).toContain("PROFILE_REVISIONS_KEY = 'gringottsImportProfileRevisions.v1'");
  expect(model).toContain('MAX_PROFILE_REVISIONS = 60');
  expect(model).toContain('MAX_REVISIONS_PER_PROFILE = 8');
  expect(model).toContain("DRY_RUN_DIAGNOSTIC_KIND = 'gringotts-import-dry-run-diagnostic'");
  expect(model).toContain('destinationAccountLabelIncluded: false');
  expect(controller).toContain('localStorage.setItem(PROFILE_REVISIONS_KEY');
  expect(controller).toContain('Previous profile and revision metadata were restored.');
  expect(controller).not.toContain('gringottsBudgetVault.latest');
  expect(controller).not.toContain('localStorage.setItem(destination');
  expect(release).not.toContain('gringottsBudgetVault.latest');
  expect(release).toContain("version: 'v119'");
  expect(index).toContain('src/boot-v119.js?v=119diagnostics1');
  expect(app).toContain('src/boot-v119.js?v=119diagnostics1');
  expect(index).not.toContain('styles/v119.css');
  expect(app).not.toContain('styles/v119.css');
  expect(boot).toContain("import('./v118/release.js?v=119diagnostics2')");
  expect(boot).toContain("import('./v119/release.js?v=119diagnostics2')");
  expect(boot).toContain("['tools', 'reports'].includes(route)");
  expect(boot).not.toContain('serviceWorker');
});

test('public repository security and quality control files remain present', () => {
  const required = [
    'SECURITY.md', '.github/dependabot.yml', '.github/workflows/codeql.yml',
    '.github/workflows/playwright.yml', '.github/workflows/quality.yml',
    '.github/workflows/security.yml', '.github/workflows/supply-chain.yml',
    '.github/workflows/scorecard.yml', 'playwright.quality.config.js', 'lighthouserc.cjs',
    'quality-baselines/v112-layout-contracts.json', 'quality-tests/accessibility.spec.js',
    'quality-tests/tab-semantics.spec.js', 'quality-tests/visual-contracts.spec.js',
    'src/boot-v119.js', 'src/v113/insights.js', 'src/v114/planning.js',
    'src/v115/parser.js', 'src/v115/bank-import.js', 'src/v115/reporting.js',
    'src/v115/release.js', 'src/v115/views.js', 'src/v116/release.js',
    'src/v117/profile-model.js', 'src/v117/import-profiles.js',
    'src/v118/profile-portability-model.js', 'src/v118/institution-patterns.js',
    'src/v118/profile-portability.js', 'src/v118/release.js',
    'src/v119/profile-versioning-model.js', 'src/v119/profile-versioning.js', 'src/v119/release.js',
    'styles/v114.css', 'styles/v115.css', 'styles/v116.css', 'styles/v117.css', 'styles/v118.css', 'styles/v119.css',
    'tests-node/bank-parser.test.mjs', 'tests-node/import-profile-model.test.mjs',
    'tests-node/profile-portability-model.test.mjs', 'tests-node/institution-patterns.test.mjs',
    'tests-node/profile-versioning-diagnostics.test.mjs',
    'tests/import-profiles.spec.js', 'tests/profile-portability.spec.js',
    'tests/profile-versioning-diagnostics.spec.js', 'tests/v116-ui-architecture.spec.js',
    'tests/fixtures/bank-import/synthetic-signed.csv',
    'tests/fixtures/bank-import/synthetic-debit-credit.csv',
    'tests/fixtures/bank-import/synthetic-card-activity.csv',
    'tests/fixtures/bank-import/synthetic-credit-union-ledger.csv',
    'tests/fixtures/bank-import/synthetic-digital-wallet.csv',
    'tests/fixtures/bank-import/synthetic.qfx', 'BANK_IMPORT_ROADMAP.md',
    'scripts/privacy-history-scan.mjs'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  expect(missing, 'Missing repository security or quality controls').toEqual([]);
});
