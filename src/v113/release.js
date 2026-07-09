import { BUILD } from '../v103/core.js';
import { installV113DownloadOverrides } from './reporting.js';

function setTextIfChanged(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function normalizeV113Labels(root = document) {
  root.querySelectorAll?.('.report-option h3').forEach((heading) => {
    if (/28-sheet Vault Workbook/i.test(heading.textContent || '')) setTextIfChanged(heading, '30-sheet Vault Workbook');
  });
  const workbookButton = root.querySelector?.('#vaultXlsx');
  setTextIfChanged(workbookButton, 'Download 30-sheet Workbook');
  const workbookCard = workbookButton?.closest('.report-option');
  const workbookDescription = workbookCard?.querySelector('p');
  setTextIfChanged(workbookDescription, 'Includes the complete Household Reporting III workbook plus Household Insights and Recurring Opportunities.');

  root.querySelectorAll?.('.sheet-list').forEach((list) => {
    const names = [...list.querySelectorAll('li')].map((item) => item.textContent?.trim());
    ['Household Insights', 'Recurring Opportunities'].forEach((name) => {
      if (!names.includes(name)) {
        const item = document.createElement('li');
        item.textContent = name;
        list.appendChild(item);
      }
    });
    const card = list.closest('.card');
    const description = card?.querySelector('p');
    setTextIfChanged(description, 'The deeper workbook contains 30 sheets.');
  });
}

function installV113UiEnhancements() {
  normalizeV113Labels(document);
  const main = document.getElementById('main');
  if (!main) return;
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      normalizeV113Labels(main);
    });
  });
  observer.observe(main, { childList: true, subtree: true });
}

export function activateV113() {
  Object.assign(BUILD, {
    version: 'v113',
    name: 'Household Insights IV',
    runtime: 'src/runtime-v111-reporting.js + src/v113',
    cacheBust: '113insights1'
  });
  if (window.GringottsCleanRuntime?.BUILD) Object.assign(window.GringottsCleanRuntime.BUILD, BUILD);
  installV113DownloadOverrides();
  installV113UiEnhancements();
  return BUILD;
}
