import { best, getMonth } from '../v103/core.js';
import { expandedWorkbookSheetsV124 } from '../v124/reporting.js';
import {
  buildCloseTrendModel,
  closeTrendWorkbookSheets
} from './close-history-model.js';

export const CLOSE_HISTORY_KEY = 'gringottsMonthClose.v1';

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function activeTransactionsV125() {
  const candidate = best();
  const direct = candidate?.obj?.transactions;
  const nested = candidate?.obj?.data?.transactions;
  const ledger = candidate?.obj?.ledger?.transactions;
  const transactions = Array.isArray(direct) ? direct : Array.isArray(nested) ? nested : Array.isArray(ledger) ? ledger : [];
  return transactions.filter((entry) => entry && typeof entry === 'object');
}

export function closeHistoryStoreV125() {
  return readJson(CLOSE_HISTORY_KEY, { months: {} });
}

export function closeTrendReportModelV125(month = getMonth()) {
  return buildCloseTrendModel(activeTransactionsV125(), closeHistoryStoreV125(), month);
}

export function expandedWorkbookSheetsV125(month = getMonth(), model) {
  const base = expandedWorkbookSheetsV124(month, model);
  return [...base, ...closeTrendWorkbookSheets(closeTrendReportModelV125(month))];
}

function money(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function driverLine(driver) {
  const sign = driver.operatingImpact > 0 ? '+' : '';
  return `- ${driver.label}: ${sign}${money(driver.operatingImpact)} operating-net impact (${driver.direction})`;
}

export function closeTrendMarkdownV125(model = closeTrendReportModelV125(), { heading = 'Close History & Trend Explainability' } = {}) {
  const current = model.current;
  const previous = model.previous;
  const lines = [
    `## ${heading}`,
    '',
    `- Selected month: ${model.selectedMonth || 'Not available'} (${current?.status || 'open'}, revision ${current?.revision || 0}, ${current?.reopenEvents || 0} reopen event(s))`,
    `- Selected evidence: ${current?.evidence?.source === 'close-snapshot' ? 'immutable close snapshot' : 'currently posted open-month rows'}`,
    `- Comparison month: ${model.comparisonMonth || 'Not available'}${previous ? ` (${previous.status}, revision ${previous.revision}, ${previous.reopenEvents || 0} reopen event(s))` : ''}`,
    `- Trend: ${model.trend?.headline || 'No comparison available.'}`,
    `- Confidence: ${model.confidence?.level || 'low'} (${model.confidence?.score ?? 0}/100)`,
    `- Selected operating net: ${money(current?.money?.operatingNet)}`,
    `- Transfers excluded from operating comparison: ${money(current?.money?.transferVolume)}`,
    '',
    '### Largest drivers',
    ...(model.drivers?.length ? model.drivers.map(driverLine) : ['- No prior-month drivers are available.']),
    '',
    '### Confidence and coverage notes',
    ...(model.confidence?.reasons || []).map((reason) => `- ${reason}`),
    ...(model.warnings || []).map((warning) => `- ${warning}`),
    '',
    '> Planning aid only. Drivers show aggregate correlation, not proof of causation. Pending rows are excluded; transfers remain neutral; no transaction, budget, forecast, debt, goal, or close record was changed.'
  ];
  return lines.join('\n');
}
