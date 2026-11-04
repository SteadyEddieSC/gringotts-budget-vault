import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const scanner = fileURLToPath(new URL('../scripts/privacy-history-scan.mjs', import.meta.url));
const fixture = 'tests/fixtures/benchmark-001/spreadsheet-exit/transactions.csv';
const preapproved = 'tests/fixtures/bank-import/synthetic-signed.csv';
const syntheticOnly = 'date,description\n2026-11-03,SYNTHETIC';
const patternOnly = 'account number ' + '7'.repeat(9);

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function write(root, path, content) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

function commit(root, message) {
  git(root, 'add', '.');
  git(root, '-c', 'user.name=Synthetic', '-c', 'user.email=synthetic@example.invalid',
    'commit', '-q', '-m', message);
}

function inSyntheticRepo(run) {
  const root = mkdtempSync(join(tmpdir(), 'gringotts-privacy-69-'));
  try {
    git(root, 'init', '-q', '-b', 'main');
    return run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function scan(root) {
  return spawnSync(process.execPath, [scanner], { cwd: root, encoding: 'utf8' });
}

test('only the exact synthetic spreadsheet-exit filename is path exempt', () => {
  inSyntheticRepo((root) => {
    write(root, fixture, syntheticOnly);
    commit(root, 'synthetic fixture');
    const result = scan(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Privacy history scan passed/);
  });
});

test('path exemption never excuses historical sensitive content after overwrite', () => {
  inSyntheticRepo((root) => {
    write(root, fixture, patternOnly);
    commit(root, 'synthetic sensitive pattern');
    write(root, fixture, syntheticOnly);
    commit(root, 'replace with harmless synthetic fixture');
    const result = scan(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /account number next to a label/);
    assert.match(result.stderr, /spreadsheet-exit\/transactions\.csv/);
  });
});

test('content scanning checks identical blobs even if an older path is fully exempt', () => {
  inSyntheticRepo((root) => {
    write(root, preapproved, patternOnly);
    commit(root, 'existing fully allowed synthetic fixture');
    write(root, fixture, patternOnly);
    commit(root, 'reuse blob under path-only exception');
    const result = scan(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /account number next to a label/);
  });
});

test('other transaction or ledger filenames continue to fail closed', () => {
  inSyntheticRepo((root) => {
    write(root, 'tests/fixtures/benchmark-001/spreadsheet-exit/other-transactions.csv', syntheticOnly);
    commit(root, 'other CSV must not be exempt');
    const result = scan(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /transaction or ledger CSV export/);
    assert.match(result.stderr, /other-transactions\.csv/);
  });
});
