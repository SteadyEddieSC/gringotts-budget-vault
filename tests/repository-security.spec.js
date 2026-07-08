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

test('public repository security control files remain present', () => {
  const required = [
    'SECURITY.md',
    '.github/dependabot.yml',
    '.github/workflows/codeql.yml',
    '.github/workflows/playwright.yml',
    '.github/workflows/security.yml',
    '.github/workflows/supply-chain.yml',
    '.github/workflows/scorecard.yml',
    'scripts/privacy-history-scan.mjs'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  expect(missing, 'Missing repository security controls').toEqual([]);
});
