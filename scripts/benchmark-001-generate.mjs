import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const BENCHMARK_ID = 'BENCHMARK-001';
export const MONTHS = Object.freeze([
  '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'
]);

export const ACCOUNTS = Object.freeze([
  { name: 'SYNTHETIC Checking', kind: 'checking', openingBalance: 2500 },
  { name: 'SYNTHETIC Savings', kind: 'savings', openingBalance: 8000 },
  { name: 'SYNTHETIC Card Alpha', kind: 'credit', openingBalance: -900 },
  { name: 'SYNTHETIC Card Beta', kind: 'credit', openingBalance: -4200 },
  { name: 'SYNTHETIC Auto Loan', kind: 'loan', openingBalance: -18500 },
  { name: 'SYNTHETIC Cash', kind: 'cash', openingBalance: 150 }
]);

const ELECTRIC = [145.22, 158.40, 151.73, 172.11, 166.85, 149.64];
const GROCERIES = [
  [132.45, 148.12, 126.33, 155.20],
  [139.18, 152.04, 129.80, 160.25],
  [143.77, 149.51, 135.16, 158.44],
  [146.23, 155.62, 138.05, 162.91],
  [141.88, 151.29, 133.67, 159.72],
  [145.31, 154.08, 137.42, 161.55]
];
const FUEL = [
  [58.14, 61.22], [59.07, 60.88], [61.15, 63.02],
  [60.44, 62.57], [59.91, 61.48], [58.77, 60.35]
];

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function accountSlug(name) {
  return name
    .replace(/^SYNTHETIC\s+/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildBenchmark001() {
  const transactions = [];
  const add = ({
    date, account, payee, category, amount, kind = 'Expense',
    notes = 'SYNTHETIC BENCHMARK-001'
  }) => {
    transactions.push({
      id: `syn-${String(transactions.length + 1).padStart(4, '0')}`,
      date,
      account,
      payee,
      category,
      amount: money(amount),
      kind,
      notes
    });
  };

  MONTHS.forEach((month, index) => {
    [
      ['01', 'SYNTHETIC Payroll A', 'Income', 3200, 'Income'],
      ['15', 'SYNTHETIC Payroll B', 'Income', 3200, 'Income'],
      ['03', 'SYNTHETIC Harbor Mortgage', 'Housing', -1850, 'Expense'],
      ['06', 'SYNTHETIC Electric Utility', 'Utilities', -ELECTRIC[index], 'Expense'],
      ['08', 'SYNTHETIC Water Utility', 'Utilities', -65, 'Expense'],
      ['10', 'SYNTHETIC Fiber Internet', 'Utilities', -79.99, 'Expense'],
      ['12', 'SYNTHETIC Auto Insurance', 'Insurance', -186, 'Expense'],
      ['14', 'SYNTHETIC Transfer to Savings', 'Transfer', -500, 'Transfer'],
      ['18', 'SYNTHETIC Auto Loan Payment', 'Debt', -425, 'Expense'],
      ['20', 'SYNTHETIC ATM Withdrawal', 'Transfer', -120, 'Transfer'],
      ['24', 'SYNTHETIC Card Alpha Payment', 'Transfer', -900, 'Transfer'],
      ['26', 'SYNTHETIC Card Beta Payment', 'Transfer', -300, 'Transfer']
    ].forEach(([day, payee, category, amount, kind]) => add({
      date: `${month}-${day}`,
      account: 'SYNTHETIC Checking',
      payee,
      category,
      amount,
      kind
    }));

    add({
      date: `${month}-14`, account: 'SYNTHETIC Savings',
      payee: 'SYNTHETIC Transfer from Checking', category: 'Transfer',
      amount: 500, kind: 'Transfer'
    });
    add({
      date: `${month}-20`, account: 'SYNTHETIC Cash',
      payee: 'SYNTHETIC ATM Transfer In', category: 'Transfer',
      amount: 120, kind: 'Transfer'
    });
    add({
      date: `${month}-22`, account: 'SYNTHETIC Cash',
      payee: 'SYNTHETIC Cash Market', category: 'Groceries',
      amount: -(38.50 + index)
    });
    add({
      date: `${month}-18`, account: 'SYNTHETIC Auto Loan',
      payee: 'SYNTHETIC Payment from Checking', category: 'Transfer',
      amount: 425, kind: 'Transfer'
    });

    GROCERIES[index].forEach((amount, purchaseIndex) => add({
      date: `${month}-${String(4 + purchaseIndex * 5).padStart(2, '0')}`,
      account: 'SYNTHETIC Card Alpha',
      payee: `SYNTHETIC Market ${purchaseIndex + 1}`,
      category: 'Groceries',
      amount: -amount
    }));
    FUEL[index].forEach((amount, purchaseIndex) => add({
      date: `${month}-${String(7 + purchaseIndex * 12).padStart(2, '0')}`,
      account: 'SYNTHETIC Card Alpha',
      payee: `SYNTHETIC Fuel Stop ${purchaseIndex + 1}`,
      category: 'Fuel',
      amount: -amount
    }));
    add({
      date: `${month}-11`, account: 'SYNTHETIC Card Alpha',
      payee: 'SYNTHETIC StreamBox', category: 'Subscriptions',
      amount: index < 3 ? -17.99 : -21.99
    });
    add({
      date: `${month}-13`, account: 'SYNTHETIC Card Alpha',
      payee: 'SYNTHETIC Cloud Storage', category: 'Subscriptions',
      amount: -9.99
    });
    add({
      date: `${month}-24`, account: 'SYNTHETIC Card Alpha',
      payee: 'SYNTHETIC Payment from Checking', category: 'Transfer',
      amount: 900, kind: 'Transfer'
    });

    add({
      date: `${month}-05`, account: 'SYNTHETIC Card Beta',
      payee: 'SYNTHETIC Family Dining', category: 'Dining',
      amount: -(85 + index * 2)
    });
    add({
      date: `${month}-16`, account: 'SYNTHETIC Card Beta',
      payee: 'SYNTHETIC Household Supply', category: 'Household',
      amount: -(75 + index * 1.5)
    });
    add({
      date: `${month}-21`, account: 'SYNTHETIC Card Beta',
      payee: 'SYNTHETIC Books and Learning', category: 'Education',
      amount: -(60 + index)
    });
    add({
      date: `${month}-26`, account: 'SYNTHETIC Card Beta',
      payee: 'SYNTHETIC Payment from Checking', category: 'Transfer',
      amount: 300, kind: 'Transfer'
    });
  });

  [
    ['2026-05-09', 'SYNTHETIC Vehicle Registration', -320],
    ['2026-07-17', 'SYNTHETIC Home Annual Premium', -1100],
    ['2026-09-23', 'SYNTHETIC Medical Deductible', -650]
  ].forEach(([date, payee, amount]) => add({
    date,
    account: 'SYNTHETIC Checking',
    payee,
    category: 'Annual / Irregular',
    amount
  }));

  return {
    id: BENCHMARK_ID,
    version: 1,
    syntheticOnly: true,
    currency: 'USD',
    period: { start: '2026-05-01', end: '2026-10-31', months: MONTHS },
    household: {
      adults: [
        { id: 'adult-a', label: 'SYNTHETIC Adult A' },
        { id: 'adult-b', label: 'SYNTHETIC Adult B' }
      ]
    },
    accounts: ACCOUNTS,
    goals: [
      { id: 'reserve', label: 'SYNTHETIC Emergency Reserve', target: 12000 },
      { id: 'sinking-fund', label: 'SYNTHETIC Annual Expense Sinking Fund', target: 2400 },
      { id: 'debt-payoff', label: 'SYNTHETIC Card Beta Payoff', targetBalance: 0, startingBalance: -4200 }
    ],
    hypotheticalScenarios: [
      { id: 'large-purchase', label: 'SYNTHETIC Large Purchase', amount: -4800 },
      { id: 'income-reduction', label: 'SYNTHETIC Temporary Income Reduction', percent: 25, durationMonths: 2 }
    ],
    expectedSignals: {
      recurringPriceDrift: {
        payee: 'SYNTHETIC StreamBox',
        from: 17.99,
        to: 21.99,
        firstChangedMonth: '2026-08'
      },
      irregularExpenseCount: 3,
      accountCount: ACCOUNTS.length
    },
    transactions
  };
}

export function buildExpectedOutcomes(scenario = buildBenchmark001()) {
  const closingBalances = Object.fromEntries(scenario.accounts.map((account) => {
    const movement = scenario.transactions
      .filter((transaction) => transaction.account === account.name)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return [account.name, money(account.openingBalance + movement)];
  }));

  const irregular = scenario.transactions.filter(({ category }) => (
    category === 'Annual / Irregular'
  ));
  const income = scenario.transactions.filter(({ kind }) => kind === 'Income');
  const baselineMonthlyIncome = money(
    income.reduce((sum, transaction) => sum + transaction.amount, 0) / MONTHS.length
  );
  const reserveGoal = scenario.goals.find(({ id }) => id === 'reserve');
  const savingsClosingBalance = closingBalances['SYNTHETIC Savings'];
  const largePurchase = scenario.hypotheticalScenarios.find(({ id }) => (
    id === 'large-purchase'
  ));
  const incomeReduction = scenario.hypotheticalScenarios.find(({ id }) => (
    id === 'income-reduction'
  ));
  const liquidFundsBefore = money([
    'SYNTHETIC Checking', 'SYNTHETIC Savings', 'SYNTHETIC Cash'
  ].reduce((sum, accountName) => sum + closingBalances[accountName], 0));
  const monthlyIncomeLoss = money(
    baselineMonthlyIncome * incomeReduction.percent / 100
  );

  return {
    benchmarkId: scenario.id,
    fixtureVersion: scenario.version,
    syntheticOnly: true,
    asOfDate: scenario.period.end,
    counts: {
      transactions: scenario.transactions.length,
      accounts: scenario.accounts.length,
      adults: scenario.household.adults.length,
      months: scenario.period.months.length
    },
    accountClosingBalances: closingBalances,
    recurringPriceDrift: scenario.expectedSignals.recurringPriceDrift,
    irregularExpenses: {
      count: irregular.length,
      totalOutflow: money(-irregular.reduce((sum, transaction) => (
        sum + transaction.amount
      ), 0))
    },
    reserve: {
      target: reserveGoal.target,
      savingsClosingBalance,
      gap: money(Math.max(0, reserveGoal.target - savingsClosingBalance))
    },
    scenarios: {
      largePurchase: {
        canonicalAmount: largePurchase.amount,
        liquidFundsBefore,
        liquidFundsAfter: money(liquidFundsBefore + largePurchase.amount)
      },
      incomeReduction: {
        percent: incomeReduction.percent,
        durationMonths: incomeReduction.durationMonths,
        baselineMonthlyIncome,
        monthlyIncomeLoss,
        totalIncomeLoss: money(monthlyIncomeLoss * incomeReduction.durationMonths)
      }
    }
  };
}

export function toActualCsv(scenario, accountName) {
  const rows = [['Date', 'Payee', 'Notes', 'Category', 'Amount', 'Imported ID']];
  scenario.transactions
    .filter((transaction) => transaction.account === accountName)
    .forEach((transaction) => rows.push([
      transaction.date,
      transaction.payee,
      transaction.notes,
      transaction.category,
      transaction.amount.toFixed(2),
      transaction.id
    ]));
  return csv(rows);
}

export function toGringottsCsv(scenario) {
  const rows = [[
    'Date', 'Description', 'Amount', 'Category',
    'Account', 'Memo', 'Transaction ID', 'Type'
  ]];
  scenario.transactions.forEach((transaction) => rows.push([
    transaction.date,
    transaction.payee,
    (-transaction.amount).toFixed(2),
    transaction.category,
    transaction.account,
    transaction.notes,
    transaction.id,
    transaction.kind
  ]));
  return csv(rows);
}

export function buildArtifactContents(scenario = buildBenchmark001()) {
  const artifacts = {
    'scenario.json': json(scenario),
    'expected-outcomes.json': json(buildExpectedOutcomes(scenario)),
    'gringotts-all-accounts.csv': toGringottsCsv(scenario)
  };

  for (const account of scenario.accounts) {
    artifacts[`actual-${accountSlug(account.name)}.csv`] = toActualCsv(
      scenario,
      account.name
    );
  }

  return artifacts;
}

export function buildManifest(artifactContents, scenario = buildBenchmark001()) {
  const artifacts = Object.keys(artifactContents)
    .sort()
    .map((artifactPath) => ({
      path: artifactPath,
      bytes: Buffer.byteLength(artifactContents[artifactPath], 'utf8'),
      sha256: sha256(artifactContents[artifactPath])
    }));

  return {
    benchmarkId: scenario.id,
    fixtureVersion: scenario.version,
    syntheticOnly: true,
    artifactCount: artifacts.length,
    artifacts
  };
}

export async function writeBenchmark001(outputDir = path.resolve(
  'tests', 'fixtures', 'benchmark-001', 'generated'
)) {
  const scenario = buildBenchmark001();
  const artifactContents = buildArtifactContents(scenario);
  const manifest = buildManifest(artifactContents, scenario);
  const manifestContent = json(manifest);

  await mkdir(outputDir, { recursive: true });
  for (const [artifactPath, content] of Object.entries(artifactContents)) {
    await writeFile(path.join(outputDir, artifactPath), content, 'utf8');
  }
  await writeFile(path.join(outputDir, 'manifest.json'), manifestContent, 'utf8');

  return {
    outputDir,
    transactionCount: scenario.transactions.length,
    accountCount: scenario.accounts.length,
    artifactCount: manifest.artifactCount,
    manifestSha256: sha256(manifestContent)
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const outputDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : undefined;
  const result = await writeBenchmark001(outputDir);
  console.log(JSON.stringify(result, null, 2));
}
