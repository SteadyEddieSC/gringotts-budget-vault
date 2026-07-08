let installed = false;

export function installAccessibilityEnhancements() {
  if (installed) return;
  installed = true;

  const main = document.getElementById('main');
  const menuToggle = document.getElementById('menuToggle');
  const primaryNav = document.getElementById('primaryNav');

  main?.setAttribute('tabindex', '-1');

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !primaryNav?.classList.contains('open')) return;
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.focus();
  });
}
