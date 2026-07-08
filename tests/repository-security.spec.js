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

test('quality automation stays local and avoids temporary public Lighthouse storage', () => {
  const workflow = read('.github/workflows/quality.yml');
  const lighthouse = read('lighthouserc.cjs');
  expect(workflow).toContain('npm exec --yes --package=@lhci/cli@0.15.1 -- lhci');
  expect(workflow).not.toContain('treosh/lighthouse-ci-action');
  expect(workflow).not.toContain('temporaryPublicStorage: true');
  expect(lighthouse).toContain("target: 'filesystem'");
  expect(lighthouse).toContain("outputDir: './lighthouse-reports'");
  expect(lighthouse).toContain("http://127.0.0.1:4173/?quality=lighthouse");
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
    'quality-tests/accessibility.spec.js',
    'quality-tests/visual-regression.spec.js',
    'scripts/privacy-history-scan.mjs'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  expect(missing, 'Missing repository security or quality controls').toEqual([]);
});
