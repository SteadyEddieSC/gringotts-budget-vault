let installed = false;

const TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);

function setAttributeIfChanged(element, name, value) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function normalizeTablists(root = document) {
  root.querySelectorAll?.('[role="tablist"]').forEach((tablist) => {
    const tabs = [...tablist.children].filter((element) => element.matches?.('button'));
    if (!tabs.length) return;

    const selected = tabs.find((tab) => tab.classList.contains('active')) || tabs[0];
    tabs.forEach((tab) => {
      const isSelected = tab === selected;
      setAttributeIfChanged(tab, 'role', 'tab');
      setAttributeIfChanged(tab, 'aria-selected', String(isSelected));
      setAttributeIfChanged(tab, 'tabindex', isSelected ? '0' : '-1');
    });
  });
}

function handleTabKeyboard(event) {
  if (!TAB_KEYS.has(event.key)) return;
  const current = event.target.closest?.('[role="tab"]');
  const tablist = current?.closest?.('[role="tablist"]');
  if (!current || !tablist) return;

  const tabs = [...tablist.querySelectorAll(':scope > [role="tab"]')].filter((tab) => !tab.disabled);
  const currentIndex = tabs.indexOf(current);
  if (currentIndex < 0 || tabs.length < 2) return;

  event.preventDefault();
  let nextIndex = currentIndex;
  if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;

  const next = tabs[nextIndex];
  next.focus();
  next.click();
}

export function installAccessibilityEnhancements() {
  if (installed) return;
  installed = true;

  const main = document.getElementById('main');
  main?.setAttribute('tabindex', '-1');
  normalizeTablists(document);

  if (main) {
    const observer = new MutationObserver(() => normalizeTablists(main));
    observer.observe(main, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const primaryNav = document.getElementById('primaryNav');
      const menuToggle = document.getElementById('menuToggle');
      if (primaryNav?.classList.contains('open')) {
        primaryNav.classList.remove('open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.focus();
      }
      return;
    }
    handleTabKeyboard(event);
  });
}
