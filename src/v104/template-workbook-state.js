import { dte, getMonth, monthLabel, txName, txs } from '../v103/core.js';

const TEMPLATE_ROW_LIMIT = 10000;
let selectedTemplate = null;

export function clearSelectedTemplate() { selectedTemplate = null; }
export function getSelectedTemplate() { return selectedTemplate; }
export function setSelectedTemplate(value) { selectedTemplate = value; }

export function templateRows() {
  const rows = txs()
    .filter((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(dte(transaction)))
    .sort((a, b) => dte(a).localeCompare(dte(b)) || txName(a).localeCompare(txName(b)));
  return rows.length > TEMPLATE_ROW_LIMIT ? rows.slice(rows.length - TEMPLATE_ROW_LIMIT) : rows;
}

export function trackerTemplateSnapshot() {
  const rows = templateRows();
  return {
    valid: Boolean(selectedTemplate),
    fileName: selectedTemplate?.fileName || '',
    sheets: selectedTemplate?.sheets || [],
    transactions: rows.length,
    totalTransactions: txs().length,
    truncated: txs().filter((transaction) => /^\d{4}-\d{2}-\d{2}$/.test(dte(transaction))).length > TEMPLATE_ROW_LIMIT,
    selectedMonth: getMonth(),
    selectedMonthLabel: monthLabel(getMonth())
  };
}
