import { downloadJson, stamp } from '../v103/core.js';
import { buildAccountCleanupPackage } from './account-cleanup-export.js';

let installed = false;

function announce(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('show'), 3800);
}

function handleCleanupPlanDownload(event) {
  if (!event.target.closest?.('#downloadAccountCleanupPlan')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    const analysis = window.GringottsV122?.accountCleanupAnalysis?.();
    if (!analysis) throw new Error('Account cleanup analysis is not ready.');
    downloadJson(
      `Gringotts_v122_account_cleanup_plan_${stamp()}.json`,
      buildAccountCleanupPackage(analysis)
    );
    announce('Sanitized account cleanup plan downloaded');
  } catch (error) {
    announce(error?.message || 'Cleanup plan could not be downloaded');
  }
}

export function installAccountCleanupExportController() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', handleCleanupPlanDownload, true);
}
