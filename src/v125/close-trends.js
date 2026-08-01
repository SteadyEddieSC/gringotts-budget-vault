import { downloadJson, getMonth, stamp } from '../v103/core.js';
import {
  buildCloseTrendPackage
} from './close-history-model.js';
import {
  closeTrendReportModelV125
} from './reporting.js';

let installed = false;
let selectedMonth = '';

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function metric(label, value, detail = '') {
  const card = element('article', 'kpi close-trend-kpi');
  card.append(element('strong', '', value), element('span', '', label));
  if (detail) card.append(element('small', '', detail));
  return card;
}

function monthOption(month, selected) {
  const option = element('option', '', month);
  option.value = month;
  option.selected = month === selected;
  return option;
}

function confidenceClass(level) {
  return level === 'high' ? 'good-note' : level === 'medium' ? 'warning-note' : 'risk-note';
}

function modelSignature(model) {
  return JSON.stringify({
    selectedMonth: model?.selectedMonth || '',
    comparisonMonth: model?.comparisonMonth || '',
    current: model?.current ? {
      status: model.current.status, revision: model.current.revision,
      counts: model.current.counts, coverage: model.current.coverage, money: model.current.money
    } : null,
    previous: model?.previous ? {
      status: model.previous.status, revision: model.previous.revision,
      counts: model.previous.counts, coverage: model.previous.coverage, money: model.previous.money
    } : null,
    confidence: model?.confidence,
    drivers: model?.drivers,
    warnings: model?.warnings
  });
}

function renderDriverTable(model) {
  const wrap = element('div', 'table-wrap close-driver-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Month-to-month operating-net drivers');
  const table = element('table', 'ledger close-driver-table');
  const head = element('thead');
  const headRow = element('tr');
  ['Driver', 'Prior', 'Selected', 'Change', 'Operating impact', 'Direction'].forEach((label) => headRow.append(element('th', '', label)));
  head.append(headRow);
  const body = element('tbody');
  (model.drivers || []).forEach((driver) => {
    const row = element('tr');
    [
      driver.label,
      money(driver.previous),
      money(driver.current),
      money(driver.delta),
      money(driver.operatingImpact),
      driver.direction
    ].forEach((value) => row.append(element('td', '', value)));
    body.append(row);
  });
  if (!model.drivers?.length) {
    const row = element('tr');
    const cell = element('td', '', 'No prior-month driver comparison is available.');
    cell.colSpan = 6;
    row.append(cell);
    body.append(row);
  }
  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function historyTable(model) {
  const wrap = element('div', 'table-wrap close-history-table-wrap');
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Close history aggregate trend');
  const table = element('table', 'ledger close-history-table');
  const head = element('thead');
  const headRow = element('tr');
  ['Month', 'Close state', 'Revision', 'Reopens', 'Evidence', 'Posted', 'Pending excluded', 'Income', 'Expenses', 'Operating net'].forEach((label) => headRow.append(element('th', '', label)));
  head.append(headRow);
  const body = element('tbody');
  (model.history || []).forEach((summary) => {
    const row = element('tr');
    [
      summary.month,
      summary.status,
      String(summary.revision),
      String(summary.reopenEvents),
      summary.evidence.source === 'close-snapshot' ? 'Immutable close snapshot' : 'Posted rows',
      String(summary.counts.posted),
      String(summary.counts.pending),
      money(summary.money.income),
      money(summary.money.expense),
      money(summary.money.operatingNet)
    ].forEach((value) => row.append(element('td', '', value)));
    body.append(row);
  });
  table.append(head, body);
  wrap.append(table);
  return wrap;
}

function trendCard(model) {
  const card = element('article', 'card close-trend-card');
  card.dataset.v125CloseTrend = 'true';
  const titleRow = element('div', 'section-title-row');
  const intro = element('div');
  intro.append(
    element('h3', '', 'Close history & trend explainability'),
    element('p', '', 'Explain month-to-month operating changes with transfer-neutral totals, coverage warnings, and explicit confidence.')
  );
  titleRow.append(intro, element('div', 'section-meta', 'Aggregate only · local'));

  const controls = element('div', 'close-trend-controls');
  const label = element('label', 'close-trend-month-control');
  label.append(element('span', '', 'Review month'));
  const select = document.createElement('select');
  select.id = 'closeTrendMonth';
  (model.history || []).map((entry) => entry.month).forEach((month) => select.append(monthOption(month, model.selectedMonth)));
  label.append(select);
  const download = element('button', 'btn secondary', 'Download Aggregate Trend');
  download.type = 'button';
  download.id = 'downloadCloseTrend';
  controls.append(label, download);

  const period = element('p', 'close-trend-period', model.comparisonMonth
    ? `Comparison period: ${model.comparisonMonth} to ${model.selectedMonth}.`
    : `Review period: ${model.selectedMonth || 'No month available'}; no prior comparison is available.`);

  const confidence = element('div', `note compact-note ${confidenceClass(model.confidence.level)}`);
  confidence.append(
    element('strong', '', `${model.confidence.level[0].toUpperCase()}${model.confidence.level.slice(1)} confidence · ${model.confidence.score}/100`),
    element('p', '', model.confidence.reasons.join(' '))
  );

  const metrics = element('div', 'kpi-grid close-trend-metrics');
  metrics.append(
    metric('Operating net', money(model.current?.money?.operatingNet), model.current?.evidence?.source === 'close-snapshot' ? 'Immutable close snapshot' : 'Open-month posted estimate'),
    metric('Month change', model.trend.operatingDelta === null ? '—' : money(model.trend.operatingDelta), model.trend.state),
    metric('Transfers excluded', money(model.current?.money?.transferVolume), `${model.current?.counts?.transfers || 0} row(s)`),
    metric('Coverage', `${model.current?.counts?.accounts || 0} account(s)`, `${model.current?.counts?.posted || 0} posted · ${model.current?.counts?.pending || 0} pending excluded`)
  );

  const headline = element('div', 'summary-box close-trend-headline');
  headline.append(element('strong', '', model.trend.headline));
  if (model.coverage?.direction === 'review') headline.append(element('p', '', model.coverage.detail));

  const warnings = element('div', 'close-trend-warnings');
  (model.warnings || []).forEach((warning) => warnings.append(element('div', 'note compact-note warning-note', warning)));

  const details = element('details', 'close-history-details');
  const summary = element('summary', '', 'Review aggregate close history');
  details.append(summary, historyTable(model));

  const boundary = element('div', 'note compact-note close-trend-boundary', 'No automatic apply or write is available. This analysis does not change transactions, budgets, forecast settings, debts, goals, recurring decisions, or close history.');
  card.append(titleRow, controls, period, confidence, metrics, headline, renderDriverTable(model), warnings, details, boundary);
  return card;
}

export function enhanceCloseTrendPage(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Close & Forecast') return false;
  const existing = page.querySelector('.close-trend-card');
  const model = closeTrendReportModelV125(selectedMonth || getMonth());
  selectedMonth = model.selectedMonth;
  const signature = modelSignature(model);
  if (existing?.dataset.v125Signature === signature) return true;
  const next = trendCard(model);
  next.dataset.v125Signature = signature;
  if (existing) existing.replaceWith(next);
  else page.append(next);
  page.dataset.v125CloseTrendEnhanced = 'true';
  return true;
}

export function enhanceCloseTrendGuidedPlan(page) {
  if (!page || page.querySelector('h2')?.textContent?.trim() !== 'Guided Household Plan') return false;
  let card = page.querySelector('.v125-close-trend-plan-card');
  const model = closeTrendReportModelV125(selectedMonth || getMonth());
  const signature = modelSignature(model);
  if (card?.dataset.v125Signature === signature) return true;
  if (!card) {
    card = element('article', 'card v125-close-trend-plan-card');
    page.append(card);
  }
  card.dataset.v125Signature = signature;
  card.replaceChildren(
    element('h3', '', 'Close trend conversation'),
    element('p', '', `${model.trend.headline} Confidence is ${model.confidence.level} (${model.confidence.score}/100).`),
    element('div', 'note compact-note', 'Discuss the largest operating driver and any coverage warning before changing the household plan.')
  );
  return true;
}

export function enhanceCloseTrendReports(root) {
  const select = root?.querySelector('#reportPreviewPage');
  if (!select) return false;
  let option = [...select.options].find((candidate) => candidate.value === 'close-trends');
  if (!option) {
    option = monthOption('close-trends', false);
    option.textContent = 'Close trends';
    select.append(option);
  }
  const page = root.querySelector('[data-report-page="close-trends"]');
  const host = select.closest('.section.active') || select.closest('.section') || root;
  const model = closeTrendReportModelV125(selectedMonth || getMonth());
  const signature = modelSignature(model);
  if (page?.dataset.v125Signature === signature) return true;
  const section = element('section', 'report-preview-page v125-close-trend-report');
  section.dataset.v125Signature = signature;
  section.dataset.reportPage = 'close-trends';
  section.hidden = select.value !== 'close-trends';
  section.append(
    element('h3', '', 'Close history & trend explainability'),
    element('p', '', `${model.trend.headline} Confidence: ${model.confidence.level} (${model.confidence.score}/100).`),
    renderDriverTable(model),
    element('div', 'note compact-note', 'Aggregate-only report. Transfers and pending rows are excluded from operating comparisons.')
  );
  if (page) page.replaceWith(section);
  else host.append(section);
  return true;
}

function installInteractions() {
  if (installed) return;
  installed = true;
  document.addEventListener('change', (event) => {
    const monthSelect = event.target.closest?.('#closeTrendMonth');
    if (monthSelect) {
      selectedMonth = monthSelect.value;
      enhanceCloseTrendPage(monthSelect.closest('.section'));
      return;
    }
    const reportSelect = event.target.closest?.('#reportPreviewPage');
    if (!reportSelect) return;
    const root = reportSelect.closest('.section.active') || reportSelect.closest('.section') || document.getElementById('main');
    root?.querySelectorAll('[data-report-page]').forEach((page) => {
      if (page.dataset.reportPage === 'close-trends') page.hidden = reportSelect.value !== 'close-trends';
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest?.('#downloadCloseTrend')) return;
    event.preventDefault();
    const model = closeTrendReportModelV125(selectedMonth || getMonth());
    downloadJson(`Gringotts_v125_close_trend_${model.selectedMonth || 'month'}_${stamp()}.json`, buildCloseTrendPackage(model));
    announce('Aggregate close trend downloaded');
  });
}

export function installCloseTrendFeatures() {
  installInteractions();
  const registry = window.GringottsV125 || (window.GringottsV125 = {});
  Object.assign(registry, {
    closeTrendReady: true,
    enhanceCloseTrendPage,
    enhanceCloseTrendGuidedPlan,
    enhanceCloseTrendReports,
    closeTrendModel: closeTrendReportModelV125
  });
  return registry;
}
