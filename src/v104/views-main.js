import {
  BUILD, account, accountOwnerTotals, best, category, categoryTotals, cashflow, dte, esc,
  executiveSummary, flow, getMonth, meetingPack, merchantTotals, metrics, money, monthLabel,
  months, reportAmount, reportWarnings, rowsForMonth, txName, txs
} from '../v103/core.js';
import { workbookSheets } from '../v103/reports.js';
import { trackerTemplateSnapshot } from './template-workbook.js';

export function monthNavigator() {
  const month = getMonth();
  const available = months();
  const hasRows = available.includes(month);
  return `<div class="month-nav" aria-label="Report month navigation">
    <button class="btn secondary month-arrow" id="monthPrev" aria-label="Previous month">◀</button>
    <label class="month-center">
      <span>Selected report month</span>
      <input id="monthPicker" type="month" value="${esc(month)}" aria-label="Select year and month">
      <strong>${esc(monthLabel(month))}</strong>
    </label>
    <button class="btn secondary month-arrow" id="monthNext" aria-label="Next month">▶</button>
    <button class="btn secondary latest-button" id="monthLatest">Latest</button>
    <span class="month-status">${hasRows ? `${rowsForMonth(month).length} transactions` : 'No transactions in this month'}</span>
  </div>`;
}

function bars(items, maxItems = 8) {
  const selected = items.slice(0, maxItems);
  const max = selected[0]?.[1] || 1;
  return selected.length ? `<div class="bars">${selected.map(([label, amount]) => `
    <div class="bar-row"><span class="bar-label" title="${esc(label)}">${esc(label)}</span>
    <span class="bar-track"><span class="bar-fill" style="width:${Math.max(2, Math.min(100, amount / max * 100))}%"></span></span>
    <strong>${money(amount)}</strong></div>`).join('')}</div>` : '<p>No selected-month spending data.</p>';
}

export function dashboardView() {
  const month = getMonth();
  const m = metrics(month);
  const candidate = best();
  const warnings = reportWarnings(month);
  return `<section class="section active dashboard-report">
    <div class="section-title-row"><div><h2>Vault Dashboard</h2><p>Dashboard analysis and reports use one shared month.</p></div><div class="section-meta">${esc(monthLabel(month))}</div></div>
    ${monthNavigator()}
    <div class="kpi-grid">
      <article class="kpi"><strong>${m.count}</strong><span>Transactions</span></article>
      <article class="kpi"><strong>${money(m.income)}</strong><span>Income</span></article>
      <article class="kpi"><strong>${money(m.spend)}</strong><span>Household spending</span></article>
      <article class="kpi"><strong>${money(m.net)}</strong><span>Household net</span></article>
    </div>
    <article class="card executive-card"><div class="section-title-row"><div><h3>Executive Summary</h3><p>Plain-English family readout using the selected month.</p></div><button id="openReports" class="btn primary">Open Reports</button></div><p class="executive-text">${esc(executiveSummary(month))}</p></article>
    <div class="grid two">
      <article class="card"><h3>Spending by category</h3>${bars(categoryTotals(month))}</article>
      <article class="card"><h3>Top merchants</h3>${bars(merchantTotals(month))}</article>
      <article class="card"><h3>Owner / account split</h3>${bars(accountOwnerTotals(month))}</article>
      <article class="card"><h3>Report quality</h3><div class="notes">${warnings.map((warning) => `<div class="note">${esc(warning)}</div>`).join('') || '<div class="note good-note">No automatic report-quality warnings detected.</div>'}</div></article>
    </div>
    <div class="grid two">
      <article class="card"><h3>Runtime proof</h3><div class="summary-box compact">Loaded runtime: ${esc(BUILD.runtime)}\nBest vault: ${esc(candidate?.key || 'none')}\nBest-vault transactions: ${candidate?.transactions || 0}\nReport month: ${esc(month)}\nDestination key: ${esc(BUILD.storageKey)}</div></article>
      <article class="card"><h3>Safe restore status</h3><p>Import files stay in this browser. A populated transaction array, preview, acknowledgment, and explicit confirmation are still required before restore.</p><div class="button-row"><button class="btn primary" id="openImport">Open Import / Restore</button><button class="btn secondary" id="dashboardBackup">Download Backup</button></div></article>
    </div>
  </section>`;
}

export function reportsView() {
  const month = getMonth();
  const m = metrics(month);
  const pack = meetingPack(month);
  const template = trackerTemplateSnapshot();
  return `<section class="section active report-center">
    <div class="section-title-row"><div><h2>Reports Center</h2><p>Household reports are created locally in this browser. Nothing is uploaded.</p></div><div class="section-meta">${esc(monthLabel(month))}</div></div>
    ${monthNavigator()}
    <div class="grid two report-downloads screen-only">
      <article class="card report-option preferred-report">
        <h3>Wife's Annual Income & Expense Tracker</h3>
        <p>This is now the preferred household report. Choose your copy of the six-sheet annual tracker and Gringotts will replace its transaction data, update its category setup, set the annual year, set the selected monthly overview, and preserve its formulas, charts, and styling.</p>
        <label class="file-drop compact-drop" for="annualTrackerFile"><span><strong>${template.valid ? esc(template.fileName) : 'Choose annual tracker template (.xlsx)'}</strong><br>${template.valid ? `${template.transactions} transactions ready for ${esc(template.selectedMonthLabel)}` : 'The template remains local to this tab and is not uploaded or published.'}</span><input id="annualTrackerFile" type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"></label>
        ${template.valid ? `<div class="template-status"><strong>Template validated.</strong> Required sheets found: Setup, Transactions, Annual Overview, and Month Overview.${template.truncated ? ' Only the latest 10,000 dated transactions will fit the template.' : ''}</div>` : ''}
        <button id="filledAnnualTracker" class="btn primary" ${template.valid ? '' : 'disabled'}>Fill and Download Annual Tracker</button>
      </article>
      <article class="card report-option"><h3>Vault Workbook XLSX</h3><p>Curated 12-sheet workbook with executive summary, enriched transactions, monthly/category/merchant summaries, recurring charges, planning, rules, review queue, and metadata.</p><button id="vaultXlsx" class="btn primary">Download Vault Workbook XLSX</button></article>
      <article class="card report-option"><h3>Quick Transactions Export</h3><p>A lightweight five-column transaction list remains available for quick sharing or review.</p><div class="button-row"><button id="familyXlsx" class="btn secondary">Download Quick XLSX</button><button id="familyCsv" class="btn secondary">Download CSV</button></div></article>
      <article class="card report-option"><h3>Executive report</h3><p>Download or copy the selected-month family narrative.</p><div class="button-row"><button id="executiveMd" class="btn secondary">Download Markdown</button><button id="copyExecutive" class="btn secondary">Copy Summary</button></div></article>
      <article class="card report-option"><h3>Family meeting pack</h3><p>Questions, wins, risks, and action items for a household budget conversation.</p><div class="button-row"><button id="meetingMd" class="btn secondary">Download Meeting Pack</button><button id="printReports" class="btn secondary">Print / Save PDF</button></div></article>
    </div>
    <article class="card printable-report"><h2>Executive Summary — ${esc(monthLabel(month))}</h2><p class="executive-text">${esc(executiveSummary(month))}</p><div class="report-metrics"><span><strong>${m.count}</strong> Transactions</span><span><strong>${money(m.income)}</strong> Income</span><span><strong>${money(m.spend)}</strong> Spending</span><span><strong>${money(m.net)}</strong> Net</span></div></article>
    <div class="grid two printable-report"><article class="card"><h3>Questions to Decide Together</h3><ul>${pack.questions.map((value) => `<li>${esc(value)}</li>`).join('')}</ul></article><article class="card"><h3>Wins</h3><ul>${pack.wins.map((value) => `<li>${esc(value)}</li>`).join('')}</ul></article><article class="card"><h3>Risks & Watch Items</h3><ul>${pack.risks.map((value) => `<li>${esc(value)}</li>`).join('')}</ul></article><article class="card"><h3>Action Items</h3><ul>${pack.actions.map((value) => `<li>${esc(value)}</li>`).join('')}</ul></article></div>
    <article class="card screen-only"><h3>Vault workbook contents</h3><ul class="sheet-list">${workbookSheets(month).map((sheet) => `<li>${esc(sheet.name)}</li>`).join('')}</ul></article>
  </section>`;
}

export function ledgerView(search = '') {
  const query = search.toLowerCase();
  const rows = txs().filter((transaction) => !query || [dte(transaction), txName(transaction), category(transaction), account(transaction), String(transaction.amount)].join(' ').toLowerCase().includes(query)).slice(0, 500);
  return `<section class="section active"><div class="section-title-row"><div><h2>Ledger</h2><p>Showing up to 500 matching rows from the best-populated local vault.</p></div><div class="section-meta">${rows.length} shown</div></div><input id="q" class="search" placeholder="Search date, merchant, category, or account" value="${esc(search)}"><div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Name</th><th>Account</th><th>Category</th><th>Flow</th><th>Amount</th></tr></thead><tbody>${rows.map((transaction) => `<tr><td>${esc(dte(transaction))}</td><td>${esc(txName(transaction))}</td><td>${esc(account(transaction))}</td><td>${esc(category(transaction))}</td><td>${esc(flow(transaction))}</td><td class="${flow(transaction) === 'Income' ? 'amount-income' : 'amount-outflow'}">${money(reportAmount(transaction))}</td></tr>`).join('')}</tbody></table></div></section>`;
}

export function planningView() {
  const data = cashflow();
  const items = [...(data.bills || []).map((item) => ({ label: 'Bill', name: item.name, date: item.dueDate, amount: item.amount })), ...(data.paydays || []).map((item) => ({ label: 'Payday', name: item.name, date: item.date, amount: item.amount }))].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return `<section class="section active"><div class="section-title-row"><div><h2>Planning</h2><p>Keep bills and paydays in separate local planning storage.</p></div><div class="section-meta">${items.length} saved dates</div></div><article class="card"><h3>Add bill or payday</h3><div class="grid two"><div><input id="billName" placeholder="Bill name"><input id="billAmount" type="number" step="0.01" placeholder="Amount"><input id="billDate" type="date"><button id="addBill" class="btn primary">Add bill</button></div><div><input id="payName" placeholder="Payday name"><input id="payAmount" type="number" step="0.01" placeholder="Amount"><input id="payDate" type="date"><button id="addPay" class="btn primary">Add payday</button></div></div></article><article class="card"><h3>Saved planning dates</h3><div class="list">${items.map((item) => `<div class="list-item"><span><strong>${esc(item.label)}: ${esc(item.name)}</strong><br><small>${esc(item.date)}</small></span><span>${money(item.amount)}</span></div>`).join('') || '<p>No saved planning dates.</p>'}</div></article></section>`;
}
