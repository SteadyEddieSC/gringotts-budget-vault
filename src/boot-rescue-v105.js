const boot = document.getElementById('bootStatus');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function renderFailure(error) {
  const message = error?.stack || error?.message || String(error || 'Unknown module-loading error');
  if (!boot) return;
  boot.innerHTML = `<section class="boot-card" role="alert"><h1>Stable rescue could not start</h1><p>No browser data was cleared or overwritten.</p><button id="bootRetry" type="button">Retry</button><details open><summary>Technical detail</summary><pre>${escapeHtml(message)}</pre></details></section>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (event) => { if (event?.error) renderFailure(event.error); });
window.addEventListener('unhandledrejection', (event) => renderFailure(event?.reason));

import('./runtime-v105-budget-intelligence.js?v=rescue1051')
  .then(() => { if (boot?.isConnected) boot.remove(); })
  .catch(renderFailure);
