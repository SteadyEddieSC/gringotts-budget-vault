import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCloseTrendModel,
  buildCloseTrendPackage,
  closeStateForMonth,
  closeTrendWorkbookSheets,
  previousCalendarMonth
} from '../src/v125/close-history-model.js';

const transactions = [
  { id: 'may-pay', date: '2026-05-01', name: 'Synthetic Pay', amount: -5000, type: 'Income', category: 'Income', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'may-rent', date: '2026-05-03', name: 'Synthetic Housing', amount: 1200, type: 'Expense', category: 'Housing', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'may-shop', date: '2026-05-10', name: 'Synthetic Store', amount: 400, type: 'Expense', category: 'Shopping', account: 'Test Card', reviewed: true, pending: false },
  { id: 'may-transfer', date: '2026-05-12', name: 'Move to Savings', amount: 1000, type: 'Transfer', category: 'Transfer', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'jun-pay', date: '2026-06-01', name: 'Synthetic Pay', amount: -5200, type: 'Income', category: 'Income', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'jun-rent', date: '2026-06-03', name: 'Synthetic Housing', amount: 1200, type: 'Expense', category: 'Housing', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'jun-shop', date: '2026-06-10', name: 'Synthetic Store', amount: 250, type: 'Expense', category: 'Shopping', account: 'Test Card', reviewed: true, pending: false },
  { id: 'jun-transfer', date: '2026-06-12', name: 'Move from Savings', amount: -700, type: 'Transfer', category: 'Transfer', account: 'Test Checking', reviewed: true, pending: false },
  { id: 'jun-pending', date: '2026-06-20', name: 'Pending Synthetic', amount: 999, type: 'Expense', category: 'Shopping', account: 'Test Card', reviewed: true, pending: true }
];

const closeStore = {
  months: {
    '2026-05': { events: [{ type: 'close', timestamp: '2026-06-02T00:00:00Z', snapshot: {
      transactionCount: 4,
      metrics: { income: 5000, spend: 1600, transfers: 1000, net: 3400, pending: 0, review: 0 },
      categories: [{ category: 'Housing', amount: 1200 }, { category: 'Shopping', amount: 400 }],
      accounts: [{ earliest: '2026-05-01', latest: '2026-05-12' }, { earliest: '2026-05-10', latest: '2026-05-10' }]
    } }] },
    '2026-06': { events: [{ type: 'close', timestamp: '2026-07-02T00:00:00Z', snapshot: {
      transactionCount: 4,
      metrics: { income: 5200, spend: 1450, transfers: 700, net: 3750, pending: 0, review: 0 },
      categories: [{ category: 'Housing', amount: 1200 }, { category: 'Shopping', amount: 250 }],
      accounts: [{ earliest: '2026-06-01', latest: '2026-06-12' }, { earliest: '2026-06-10', latest: '2026-06-10' }]
    } }] }
  }
};

test('resolves prior calendar months and close revisions', () => {
  assert.equal(previousCalendarMonth('2026-01'), '2025-12');
  assert.deepEqual(closeStateForMonth(closeStore, '2026-05'), {
    status: 'closed', revision: 1, closeEvents: 1, reopenEvents: 0,
    lastEventType: 'close', lastEventAt: '2026-06-02T00:00:00Z',
    snapshot: closeStore.months['2026-05'].events[0].snapshot
  });
});

test('explains operating changes while keeping transfers neutral and pending rows excluded', () => {
  const model = buildCloseTrendModel(transactions, closeStore, '2026-06');
  assert.equal(model.comparisonMonth, '2026-05');
  assert.equal(model.current.money.income, 5200);
  assert.equal(model.current.money.expense, 1450);
  assert.equal(model.current.money.operatingNet, 3750);
  assert.equal(model.current.money.transferVolume, 700);
  assert.equal(model.current.counts.pending, 0);
  assert.equal(model.current.evidence.source, 'close-snapshot');
  assert.equal(model.trend.operatingDelta, 350);
  assert.equal(model.trend.state, 'improved');
  assert.equal(model.drivers[0].id, 'income');
  assert.ok(model.warnings.some((warning) => /Transfers/.test(warning)));
  assert.ok(model.warnings.some((warning) => /immutable close snapshot/.test(warning)));
  assert.ok(model.warnings.some((warning) => /correlation/.test(warning)));
});

test('marks open or uneven coverage as reduced confidence without inventing certainty', () => {
  const openStore = { months: { '2026-05': closeStore.months['2026-05'] } };
  const uneven = [...transactions, {
    id: 'jun-extra-account', date: '2026-06-18', name: 'Synthetic Fee', amount: 10,
    type: 'Expense', category: 'Financial', account: 'Third Account', reviewed: false, pending: false
  }];
  const model = buildCloseTrendModel(uneven, openStore, '2026-06');
  assert.equal(model.current.status, 'open');
  assert.equal(model.coverage.direction, 'review');
  assert.notEqual(model.confidence.level, 'high');
  assert.ok(model.confidence.reasons.some((reason) => /Account coverage changed/.test(reason)));
});

test('includes a requested open month even before transactions post', () => {
  const model = buildCloseTrendModel(transactions, closeStore, '2026-07');
  assert.equal(model.selectedMonth, '2026-07');
  assert.equal(model.current.counts.posted, 0);
  assert.ok(model.history.some((entry) => entry.month === '2026-07'));
  assert.notEqual(model.confidence.level, 'high');
});

test('keeps closed-month totals immutable when later posted rows differ', () => {
  const changed = transactions.map((entry) => entry.id === 'jun-shop' ? { ...entry, amount: 925 } : entry);
  const model = buildCloseTrendModel(changed, closeStore, '2026-06');
  assert.equal(model.current.money.expense, 1450);
  assert.equal(model.current.money.operatingNet, 3750);
  assert.equal(model.current.evidence.source, 'close-snapshot');
  assert.equal(model.current.evidence.snapshotCurrentMismatch, false, 'amount-only edits do not alter count coverage; snapshot still remains authoritative');
  assert.ok(model.warnings.some((warning) => /correlation/.test(warning)));
});

test('lowers confidence when current row coverage differs from a retained close snapshot', () => {
  const changed = transactions.filter((entry) => entry.id !== 'jun-shop');
  const model = buildCloseTrendModel(changed, closeStore, '2026-06');
  assert.equal(model.current.money.operatingNet, 3750);
  assert.equal(model.current.evidence.snapshotCurrentMismatch, true);
  assert.ok(model.confidence.reasons.some((reason) => /no longer match/.test(reason)));
});

test('exports aggregates only and refuses household-detail field names', () => {
  const model = buildCloseTrendModel(transactions, closeStore, '2026-06');
  const payload = buildCloseTrendPackage(model);
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const forbidden of ['synthetic pay', 'test checking', 'test card', 'transactionid', 'merchant']) {
    assert.equal(serialized.includes(forbidden), false, `forbidden detail leaked: ${forbidden}`);
  }
  assert.equal(payload.boundaries.automaticWriteAvailable, false);
  assert.equal(payload.boundaries.transactionCopiesStored, false);
});

test('adds two aggregate-only workbook sheets', () => {
  const model = buildCloseTrendModel(transactions, closeStore, '2026-06');
  const sheets = closeTrendWorkbookSheets(model);
  assert.deepEqual(sheets.map((sheet) => sheet.name), ['Close Trends', 'Close Drivers']);
  assert.ok(sheets[0].rows.length >= 3);
  assert.ok(sheets[1].rows.some((row) => row[0] === 'Transfer Rule'));
});
