import { BUILD } from '../v103/core.js';
import { saveGuidedPlanItem } from './planning.js';
import { installV114DownloadOverrides } from './reporting.js';

function toast(message) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
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

let interactionsInstalled = false;
export function activateV114(options = {}) {
  Object.assign(BUILD, {
    version: 'v114',
    name: 'Guided Household Planning',
    runtime: 'src/runtime-v111-reporting.js + src/v114',
    cacheBust: '114guided1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  if (options.installDownloads !== false) installV114DownloadOverrides();
  if (!interactionsInstalled) {
    interactionsInstalled = true;
    installGuidedPlanningInteractions();
  }
  return BUILD;
}
