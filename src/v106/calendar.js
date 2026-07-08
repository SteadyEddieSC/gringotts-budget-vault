import {
  calendarEvents, dte, flow, getMonth, money, monthLabel, reportAmount,
  rowsForMonth, shiftMonth, txName
} from '../v103/core.js';

function isoDate(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function calendarModel(selectedMonth = getMonth()) {
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthIndex = month - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = new Date(year, monthIndex, 1).getDay();
  const scheduled = calendarEvents().filter((event) => String(event.date).startsWith(selectedMonth));
  const transactions = rowsForMonth(selectedMonth);
  const byDate = new Map();

  const ensure = (date) => {
    if (!byDate.has(date)) byDate.set(date, { bills: [], paydays: [], transactions: [], income: 0, spending: 0, transfers: 0 });
    return byDate.get(date);
  };

  scheduled.forEach((event) => {
    const bucket = ensure(event.date);
    if (event.type === 'payday') bucket.paydays.push(event);
    else bucket.bills.push(event);
  });

  transactions.forEach((transaction) => {
    const date = dte(transaction);
    if (!date) return;
    const bucket = ensure(date);
    bucket.transactions.push(transaction);
    const amount = reportAmount(transaction);
    const kind = flow(transaction);
    if (kind === 'Income') bucket.income += amount;
    else if (kind === 'Transfer') bucket.transfers += amount;
    else bucket.spending += amount;
  });

  const days = [];
  for (let slot = 0; slot < leading; slot += 1) days.push({ empty: true, key: `lead-${slot}` });
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = isoDate(year, monthIndex, day);
    days.push({ day, date, ...(byDate.get(date) || { bills: [], paydays: [], transactions: [], income: 0, spending: 0, transfers: 0 }) });
  }

  const scheduledDays = [...byDate.entries()].map(([date, bucket]) => {
    const bills = bucket.bills.reduce((sum, event) => sum + Number(event.amount || 0), 0);
    const paydays = bucket.paydays.reduce((sum, event) => sum + Number(event.amount || 0), 0);
    return { date, bills, paydays, net: paydays - bills };
  }).filter((day) => day.bills || day.paydays).sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  const pressureDays = [];
  scheduledDays.forEach((day) => {
    cumulative += day.net;
    if (cumulative < 0) pressureDays.push({ ...day, cumulative });
  });

  return {
    month: selectedMonth,
    label: monthLabel(selectedMonth),
    year,
    monthIndex,
    days,
    byDate,
    scheduled,
    transactions,
    pressureDays,
    previousMonth: shiftMonth(selectedMonth, -1),
    nextMonth: shiftMonth(selectedMonth, 1)
  };
}

export function dayDetails(date, selectedMonth = getMonth()) {
  const model = calendarModel(selectedMonth);
  const bucket = model.byDate.get(date) || { bills: [], paydays: [], transactions: [], income: 0, spending: 0, transfers: 0 };
  return {
    date,
    ...bucket,
    scheduledNet: bucket.paydays.reduce((sum, event) => sum + Number(event.amount || 0), 0) - bucket.bills.reduce((sum, event) => sum + Number(event.amount || 0), 0),
    transactionRows: bucket.transactions.slice().sort((a, b) => txName(a).localeCompare(txName(b)))
  };
}

export function calendarSummary(selectedMonth = getMonth()) {
  const model = calendarModel(selectedMonth);
  const bills = model.scheduled.filter((event) => event.type === 'bill').reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const paydays = model.scheduled.filter((event) => event.type === 'payday').reduce((sum, event) => sum + Number(event.amount || 0), 0);
  return {
    bills,
    paydays,
    scheduledNet: paydays - bills,
    pressureDays: model.pressureDays.length,
    transactionDays: [...model.byDate.values()].filter((bucket) => bucket.transactions.length).length
  };
}

export function calendarAccessibleLabel(day) {
  if (day.empty) return '';
  const parts = [`${day.date}`];
  if (day.bills.length) parts.push(`${day.bills.length} bill${day.bills.length === 1 ? '' : 's'}`);
  if (day.paydays.length) parts.push(`${day.paydays.length} payday${day.paydays.length === 1 ? '' : 's'}`);
  if (day.transactions.length) parts.push(`${day.transactions.length} transaction${day.transactions.length === 1 ? '' : 's'}`);
  if (day.spending) parts.push(`${money(day.spending)} spending`);
  return parts.join(', ');
}
