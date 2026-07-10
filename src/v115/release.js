import { BUILD } from '../v103/core.js';
import { saveGuidedPlanItem } from '../v114/planning.js';
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

function refreshPlan() {
  const planTab = document.querySelector('[data-activity-section="plan"]');
  if (planTab) planTab.click();
}

function navigate(tab, section) {
  const primary = document.querySelector(`[data-tab="${CSS.escape(tab)}"]`);
  if (!primary) return;
  primary.click();
  if (!section) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const selector = tab === 'money' ? `[data-money-section="${CSS.escape(section)}"]`
      : tab === 'activity' ? `[data-activity-section="${CSS.escape(section)}"]`
        : tab === 'tools' ? `[data-tools-section="${CSS.escape(section)}"]` : '';
    if (selector) document.querySelector(selector)?.click();
  }));
}

function installGuidedPlanningInteractions() {
  document.addEventListener('click', (event) => {
    const saveButton = event.target.closest?.('[data-save-plan]');
    if (saveButton) {
      event.preventDefault();
      const card = saveButton.closest('[data-plan-item]');
      try {
        const saved = saveGuidedPlanItem(saveButton.dataset.savePlan, {
          status: card?.querySelector('.plan-status')?.value,
          owner: card?.querySelector('.plan-owner')?.value,
          targetDate: card?.querySelector('.plan-date')?.value,
          notes: card?.querySelector('.plan-notes')?.value
        });
        toast(`Plan item saved as ${saved.status.replace('-', ' ')}`);
        refreshPlan();
      } catch (error) {
        toast(error?.message || 'Planning item could not be saved');
      }
      return;
    }

    const openButton = event.target.closest?.('[data-plan-open]');
    if (!openButton) return;
    event.preventDefault();
    navigate(openButton.dataset.planTab, openButton.dataset.planSection || '');
  });
}

function installBankImportInteractions(imports) {
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches('[data-bank-option="accountLabel"]')) return;
    imports.updateBankOption('accountLabel', target.value);
  }, true);

  document.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.id === 'bankImportFile') {
      event.stopImmediatePropagation();
      await imports.selectBankExportFile(target.files?.[0], toast, refreshImport);
      return;
    }
    if (target.matches('[data-bank-mapping]')) {
      event.stopImmediatePropagation();
      if (!imports.updateBankMapping(target.dataset.bankMapping, target.value)) toast('That source mapping could not be applied');
      refreshImport();
      return;
    }
    if (target.matches('[data-bank-option]')) {
      event.stopImmediatePropagation();
      const value = target.type === 'checkbox' ? target.checked : target.value;
      if (!imports.updateBankOption(target.dataset.bankOption, value)) toast('That normalization option could not be applied');
      refreshImport();
      return;
    }
    if (target.id === 'bankImportDestination') {
      event.stopImmediatePropagation();
      if (!imports.setImportDestination(target.value)) toast(imports.snapshot().error || 'Destination could not be selected');
      refreshImport();
      return;
    }
    if (target.matches('[data-bank-fuzzy-decision]')) {
      event.stopImmediatePropagation();
      imports.setFuzzyDecision(target.dataset.bankFuzzyDecision, target.value);
      refreshImport();
      return;
    }
    if (target.id === 'bankImportAck') {
      event.stopImmediatePropagation();
      imports.setImportAcknowledged(target.checked);
      const button = document.getElementById('commitBankImport');
      if (button) button.disabled = !imports.snapshot().ready;
    }
  }, true);

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if (!button) return;
    if (button.id === 'prepareBankDuplicateReview') {
      event.preventDefault();
      event.stopImmediatePropagation();
      imports.prepareDuplicateReview(toast, refreshImport);
      return;
    }
    if (button.id === 'prepareBankImportBackup') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (imports.prepareImportBackup(toast)) refreshImport();
      return;
    }
    if (button.id === 'commitBankImport') {
      event.preventDefault();
      event.stopImmediatePropagation();
      imports.executeImport(toast, refreshImport);
      return;
    }
    if (button.id === 'resetBankImport') {
      event.preventDefault();
      event.stopImmediatePropagation();
      imports.clearBankImportSession();
      toast('Bank import session cleared');
      refreshImport();
    }
  }, true);
}

let featurePromise = null;
let bankInteractionsInstalled = false;

export function prepareV115Route() {
  if (featurePromise) return featurePromise;
  featurePromise = Promise.all([
    import('./bank-import.js?v=115bankimport2'),
    import('../v114/reporting.js?v=115bankimport2')
  ]).then(([imports, legacyReporting]) => {
    const registry = window.GringottsV115 || (window.GringottsV115 = {});
    Object.assign(registry, {
      featuresReady: true,
      bankSnapshot: imports.snapshot,
      updateBankOption: imports.updateBankOption,
      importHistory: imports.importHistory,
      expandedWorkbookSheetsV114: legacyReporting.expandedWorkbookSheetsV114,
      familyMeetingMarkdownV114: legacyReporting.familyMeetingMarkdownV114,
      guidedPlanMarkdownV114: legacyReporting.guidedPlanMarkdownV114,
      expandedWorkbookSheetsV115
    });
    installV115DownloadOverrides();
    if (!bankInteractionsInstalled) {
      bankInteractionsInstalled = true;
      installBankImportInteractions(imports);
    }
    if (window.GringottsCleanRuntime) {
      window.GringottsCleanRuntime.imports = { snapshot: imports.snapshot };
      window.GringottsCleanRuntime.reports = {
        ...(window.GringottsCleanRuntime.reports || {}),
        expandedWorkbookSheetsV115
      };
    }
    return registry;
  }).catch((error) => {
    featurePromise = null;
    throw error;
  });
  return featurePromise;
}

function installRouteGate() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-tab]');
    const route = button?.dataset.tab;
    if (!button || !['tools', 'reports'].includes(route) || window.GringottsV115?.featuresReady) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    prepareV115Route()
      .then(() => button.click())
      .catch((error) => toast(error?.message || 'The v115 import and reporting features could not be loaded'));
  }, true);
}

let installed = false;
export function activateV115() {
  Object.assign(BUILD, {
    version: 'v115',
    name: 'Bank Export Import & Mapping',
    runtime: 'src/runtime-v111-reporting.js + lazy src/v115',
    cacheBust: '115bankimport2'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  const registry = window.GringottsV115 || (window.GringottsV115 = {});
  Object.assign(registry, { prepareRoute: prepareV115Route, featuresReady: false });
  if (!installed) {
    installed = true;
    installGuidedPlanningInteractions();
    installRouteGate();
  }
  return BUILD;
}
