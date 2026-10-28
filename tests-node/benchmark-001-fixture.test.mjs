import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ACCOUNTS,
  MONTHS,
  buildBenchmark001,
  toActualCsv,
  toGringottsCsv,
  writeBenchmark001
} from '../scripts/benchmark-001-generate.mjs';

test('BENCHMARK-001 fixture is deterministic, synthetic, and complete', () => {
  const first = buildBenchmark001();
  const second = buildBenchmark001();

  assert.deepEqual(first, second);
  assert.equal(first.syntheticOnly, true);
  assert.equal(first.transactions.length, 177);
  assert.deepEqual(first.period.months, MONTHS);
  assert.equal(first.accounts.length, 6);
  assert.deepEqual(first.accounts, ACCOUNTS);

  const representedAccounts = new Set(first.transactions.map(({ account }) => account));
  assert.deepEqual(representedAccounts, new Set(ACCOUNTS.map(({ name }) => name)));

  for (const transaction of first.transactions) {
    assert.match(transaction.id, /^syn-\d{4}$/);
    assert.match(transaction.account, /^SYNTHETIC /);
    assert.match(transaction.payee, /^SYNTHETIC /);
    assert.equal(transaction.notes, 'SYNTHETIC BENCHMARK-001');
    assert.ok(MONTHS.includes(transaction.date.slice(0, 7)));
    assert.equal(Number.isFinite(transaction.amount), true);
  }

  assert.equal(first.household.adults.length, 2);
  assert.equal(first.goals.length, 3);
  assert.equal(first.hypotheticalScenarios.length, 2);
});

test('BENCHMARK-001 contains the intended price drift and irregular-expense evidence', () => {
  const scenario = buildBenchmark001();
  const streamBox = scenario.transactions.filter(({ payee }) => (
    payee === 'SYNTHETIC StreamBox'
  ));
  assert.deepEqual(
    streamBox.map(({ amount }) => amount),
    [-17.99, -17.99, -17.99, -21.99, -21.99, -21.99]
  );

  const irregular = scenario.transactions.filter(({ category }) => (
    category === 'Annual / Irregular'
  ));
  assert.equal(irregular.length, 3);
  assert.deepEqual(
    irregular.map(({ amount }) => amount),
    [-320, -1100, -650]
  );
});

test('Actual and Gringotts CSVs derive from the same canonical transaction meaning', () => {
  const scenario = buildBenchmark001();
  const actualChecking = toActualCsv(scenario, 'SYNTHETIC Checking');
  const gringotts = toGringottsCsv(scenario);

  assert.match(actualChecking, /^Date,Payee,Notes,Category,Amount,Imported ID\n/);
  assert.doesNotMatch(actualChecking.split('\n')[0], /Account/);
  assert.match(actualChecking, /SYNTHETIC Payroll A/);
  assert.match(actualChecking, /,3200\.00,syn-/);
  assert.match(actualChecking, /,-1850\.00,syn-/);

  assert.match(
    gringotts,
    /^Date,Description,Amount,Category,Account,Memo,Transaction ID,Type\n/
  );
  assert.match(gringotts, /SYNTHETIC Payroll A,-3200\.00,Income,SYNTHETIC Checking/);
  assert.match(gringotts, /SYNTHETIC Harbor Mortgage,1850\.00,Housing,SYNTHETIC Checking/);

  const payroll = scenario.transactions.find(({ payee }) => (
    payee === 'SYNTHETIC Payroll A'
  ));
  const mortgage = scenario.transactions.find(({ payee }) => (
    payee === 'SYNTHETIC Harbor Mortgage'
  ));
  assert.equal(payroll.amount, 3200);
  assert.equal(mortgage.amount, -1850);

  // Actual uses positive inflow / negative outflow. Gringotts' retained
  // bank-import convention uses the inverse sign for Income/Expense amounts.
  assert.match(actualChecking, /SYNTHETIC Payroll A[^]*?3200\.00/);
  assert.match(actualChecking, /SYNTHETIC Harbor Mortgage[^]*?-1850\.00/);
  assert.match(gringotts, /SYNTHETIC Payroll A[^]*?-3200\.00/);
  assert.match(gringotts, /SYNTHETIC Harbor Mortgage[^]*?1850\.00/);
});

test('CLI writer emits account-scoped Actual files and an all-account Gringotts file', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'gringotts-benchmark-001-'));
  const result = await writeBenchmark001(outputDir);

  assert.equal(result.transactionCount, 177);
  assert.equal(result.accountCount, 6);

  const scenario = JSON.parse(await readFile(path.join(outputDir, 'scenario.json'), 'utf8'));
  assert.equal(scenario.id, 'BENCHMARK-001');
  assert.equal(scenario.transactions.length, 177);

  const gringotts = await readFile(
    path.join(outputDir, 'gringotts-all-accounts.csv'),
    'utf8'
  );
  assert.equal(gringotts, toGringottsCsv(buildBenchmark001()));

  for (const account of ACCOUNTS) {
    const slug = account.name
      .replace(/^SYNTHETIC\s+/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const actual = await readFile(
      path.join(outputDir, `actual-${slug}.csv`),
      'utf8'
    );
    assert.equal(actual, toActualCsv(buildBenchmark001(), account.name));
  }
});
