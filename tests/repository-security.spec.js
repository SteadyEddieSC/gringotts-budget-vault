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
    "default-src 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self'",
    "worker-src 'none'",
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
    'Referrer-Policy: no-referrer',
    'Cross-Origin-Opener-Policy: same-origin',
    'Cross-Origin-Resource-Policy: same-origin'
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
});

test('release workflows skip draft PRs, stage expensive browsers, and upload diagnostics only on failure', () => {
  const playwright = read('.github/workflows/playwright.yml');
  const quality = read('.github/workflows/quality.yml');
  const security = read('.github/workflows/security.yml');
  const supplyChain = read('.github/workflows/supply-chain.yml');
  const codeql = read('.github/workflows/codeql.yml');
  for (const workflow of [playwright, quality, security, supplyChain, codeql]) {
    expect(workflow).toContain("github.event.pull_request.draft == false");
    expect(workflow).toContain('ready_for_review');
  }
  expect(playwright.indexOf('Run Chromium desktop preflight')).toBeLessThan(playwright.indexOf('Install Firefox and WebKit after Chromium passes'));
  expect(playwright.indexOf('Run Android Chromium preflight')).toBeLessThan(playwright.indexOf('Install WebKit after Android Chromium passes'));
  expect(playwright.indexOf('Install WebKit after Android Chromium passes')).toBeLessThan(playwright.indexOf('Run iPad and iPhone WebKit gates'));
  expect(playwright).toMatch(/Upload Playwright failure diagnostics[\s\S]*?if: failure\(\)/);
  expect(quality).toMatch(/Upload quality failure diagnostics[\s\S]*?if: failure\(\)/);
  expect(quality).toMatch(/Upload Lighthouse failure reports[\s\S]*?if: failure\(\)/);
});

test('v113 insight calculation stays read-only and local', () => {
  const engine = read('src/v113/insights.js');
  const views = read('src/v113/views.js');
  const reporting = read('src/v113/reporting.js');
  expect(engine).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(engine).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
  expect(engine).not.toMatch(/\bsave\s*\(/);
  expect(views).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(reporting).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  expect(engine).toContain('Pending transactions are counted but excluded from unusual-spending comparisons.');
});

test('v114 Guided Planning writes only explicit separate checklist metadata', () => {
  const engine = read('src/v114/planning.js');
  const views = read('src/v114/views.js');
  const release = read('src/v114/release.js');
  const reporting = read('src/v114/reporting.js');
  for (const source of [engine, views, release, reporting]) {
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
    expect(source).not.toMatch(/localStorage\.setItem|sessionStorage\.setItem/);
    expect(source).not.toContain('gringottsBudgetVault.latest');
  }
  expect(engine).toContain("export const GUIDED_PLAN_KEY = 'gringottsGuidedPlan.v1'");
  expect(engine).toContain('Only an explicit Save Plan Item action stores checklist status');
  expect(engine).toContain('Planning-item read-back verification failed.');
  expect(read('index.html')).toContain('src/boot-v114.js?v=114guided1');
  expect(read('app.html')).toContain('src/boot-v114.js?v=114guided1');
});

test('public repository security and quality control files remain present', () => {
  const required = [
    'SECURITY.md',
    '.github/dependabot.yml',
    '.github/workflows/codeql.yml',
    '.github/workflows/playwright.yml',
    '.github/workflows/quality.yml',
    '.github/workflows/security.yml',
    '.github/workflows/supply-chain.yml',
    '.github/workflows/scorecard.yml',
    'playwright.quality.config.js',
    'lighthouserc.cjs',
    'quality-baselines/v112-layout-contracts.json',
    'quality-tests/accessibility.spec.js',
    'quality-tests/tab-semantics.spec.js',
    'quality-tests/visual-contracts.spec.js',
    'src/boot-v114.js',
    'src/v113/insights.js',
    'src/v113/reporting.js',
    'src/v113/release.js',
    'src/v113/views.js',
    'src/v114/planning.js',
    'src/v114/reporting.js',
    'src/v114/release.js',
    'src/v114/views.js',
    'styles/v113.css',
    'styles/v114.css',
    'BANK_IMPORT_ROADMAP.md',
    'scripts/privacy-history-scan.mjs'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  expect(missing, 'Missing repository security or quality controls').toEqual([]);
});
