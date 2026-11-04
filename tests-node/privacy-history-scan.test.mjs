import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
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

function simulateHistoricalReadFailure(kind) {
  const source = readFileSync(scanner, 'utf8').replace(/^import[^\n]*\n/, '');
  const objectId = 'a'.repeat(40);
  const commit = 'b'.repeat(40);
  const outputs = [];
  const gitStub = (exe, args) => {
    assert.equal(exe, 'git');
    if (args[0] === 'log' && args.includes('--name-only')) return fixture + '\n';
    if (args[0] === 'log') return commit + '\n';
    if (args[0] === 'ls-tree') {
      if (kind === 'directory') {
        return `100644 blob ${objectId}\t${fixture}/a.txt\n100644 blob ${'c'.repeat(40)}\t${fixture}/z.txt\n`;
      }
      if (kind === 'subpath') return `100644 blob ${objectId}\t${fixture}/a.txt\n`;
      const objectType = kind === 'gitlink' ? 'commit' : 'blob';
      return `100644 ${objectType} ${objectId}\t${fixture}\n`;
    }
    if (args[0] === 'rev-list') return `${objectId} ${preapproved}\n`;
    if (args[0] === 'cat-file' && args[1] === '-t') {
      if (kind === 'type') throw new Error('Synthetic missing object');
      return 'blob\n';
    }
    if (args[0] === 'cat-file' && args[1] === '-p') {
      if (kind === 'content') {
        const error = new Error('Synthetic 64MiB output limit');
        error.code = 'ENOBUFS';
        throw error;
      }
      return syntheticOnly;
    }
    throw new Error('Unexpected simulated Git invocation: ' + args.join(' '));
  };
  assert.throws(
    () => runInNewContext(source, {
      execFileSync: gitStub,
      process: { cwd: () => '.', exit: () => { throw new Error('false PASS'); } },
      console: { log: (message) => outputs.push(message), error: (message) => outputs.push(message) }
    }),
    /Privacy history scan incomplete/,
    'Uninspectable historical fixture must never produce a successful scan'
  );
  assert.equal(outputs.some((message) => /scan passed/.test(message)), false);
}

test('missing historical object type fails closed under the path-only exemption', () => {
  simulateHistoricalReadFailure('type');
});

test('oversized or unreadable historical content fails closed even with an exempt blob alias', () => {
  simulateHistoricalReadFailure('content');
});

test('a historical fixture gitlink is not silently exempted as a CSV blob', () => {
  simulateHistoricalReadFailure('gitlink');
});

test('directory at the exempt CSV path cannot conceal unenumerated historical descendants', () => {
  simulateHistoricalReadFailure('directory');
});

test('a single descendant of the exempt CSV filename is not treated as the exact file', () => {
  simulateHistoricalReadFailure('subpath');
});

test('real Git history rejects a directory masquerading as the exact synthetic CSV', () => {
  inSyntheticRepo((root) => {
    write(root, fixture + '/a.txt', syntheticOnly);
    write(root, fixture + '/z.txt', patternOnly);
    write(root, preapproved, patternOnly);
    commit(root, 'synthetic directory and content alias');
    const result = scan(root);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /Privacy history scan incomplete/);
    assert.match(result.stderr, /ambiguous historical fixture path/);
  });
});
