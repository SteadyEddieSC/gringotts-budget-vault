import { BUILD } from '../v103/core.js';
import {
  clearBankImportSession, executeImport, prepareDuplicateReview, prepareImportBackup,
  selectBankExportFile, setFuzzyDecision, setImportAcknowledged, setImportDestination,
  snapshot as bankSnapshot, updateBankMapping, updateBankOption
} from './bank-import.js';
import { expandedWorkbookSheetsV115, installV115DownloadOverrides } from './reporting.js';

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
}

function refreshImport() {
  const button = document.querySelector('[data-tools-section="import"]');
  if (button) button.click();
}

function installBankImportInteractions() {
  document.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.id === 'bankImportFile') {
      event.stopImmediatePropagation();
      await selectBankExportFile(target.files?.[0], toast, refreshImport);
      return;
    }
    if (target.matches('[data-bank-mapping]')) {
      event.stopImmediatePropagation();
      if (!updateBankMapping(target.dataset.bankMapping, target.value)) toast('That source mapping could not be applied');
      refreshImport();
      return;
    }
    if (target.matches('[data-bank-option]')) {
      event.stopImmediatePropagation();
      const value = target.type === 'checkbox' ? target.checked : target.value;
      if (!updateBankOption(target.dataset.bankOption, value)) toast('That normalization option could not be applied');
      refreshImport();
      return;
    }
    if (target.id === 'bankImportDestination') {
      event.stopImmediatePropagation();
      if (!setImportDestination(target.value)) toast(bankSnapshot().error || 'Destination could not be selected');
      refreshImport();
      return;
    }
    if (target.matches('[data-bank-fuzzy-decision]')) {
      event.stopImmediatePropagation();
      setFuzzyDecision(target.dataset.bankFuzzyDecision, target.value);
      refreshImport();
      return;
    }
    if (target.id === 'bankImportAck') {
      event.stopImmediatePropagation();
      setImportAcknowledged(target.checked);
      const button = document.getElementById('commitBankImport');
      if (button) button.disabled = !bankSnapshot().ready;
    }
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if (!button) return;
    if (button.id === 'prepareBankDuplicateReview') {
      event.preventDefault();
      event.stopImmediatePropagation();
      prepareDuplicateReview(toast, refreshImport);
      return;
    }
    if (button.id === 'prepareBankImportBackup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (prepareImportBackup(toast)) refreshImport();
      return;
    }
    if (button.id === 'commitBankImport') {
      event.preventDefault();
      event.stopImmediatePropagation();
      executeImport(toast, refreshImport);
      return;
    }
    if (button.id === 'resetBankImport') {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearBankImportSession();
      toast('Bank import session cleared');
      refreshImport();
    }
  }, true);
}

let installed = false;
export function activateV115() {
  Object.assign(BUILD, {
    version: 'v115',
    name: 'Bank Export Import & Mapping',
    runtime: 'src/runtime-v111-reporting.js + src/v114 + src/v115',
    cacheBust: '115bankimport1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  if (window.GringottsCleanRuntime) {
    window.GringottsCleanRuntime.imports = { snapshot: bankSnapshot };
    window.GringottsCleanRuntime.reports = {
      ...(window.GringottsCleanRuntime.reports || {}),
      expandedWorkbookSheetsV115
    };
  }
  installV115DownloadOverrides();
  if (!installed) {
    installed = true;
    installBankImportInteractions();
  }
  return BUILD;
}
