const boot = document.getElementById('bootStatus');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function renderFailure(error) {
  const message = error?.stack || error?.message || String(error || 'Unknown module-loading error');
  if (!boot) return;
  boot.innerHTML = `
    <section class="boot-card" role="alert">
      <h1>Gringotts could not start</h1>
      <p>The page shell loaded, but a JavaScript module failed before the vault interface could render. Your browser data has not been cleared or overwritten.</p>
      <div class="boot-actions">
        <button id="bootRetry" type="button">Retry v106.1</button>
        <a href="rescue-v105.html?release=rescue1051">Open stable v105 rescue</a>
      </div>
      <details open>
        <summary>Technical detail</summary>
        <pre>${escapeHtml(message)}</pre>
      </details>
    </section>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (event) => {
  if (event?.error) renderFailure(event.error);
});
window.addEventListener('unhandledrejection', (event) => {
  renderFailure(event?.reason);
});

import('./runtime-v106-calendar-ui.js?v=106calendarui2')
  .then(() => {
    if (window.GringottsCleanRuntime?.BUILD) {
      window.GringottsCleanRuntime.BUILD.version = 'v106.1';
      window.GringottsCleanRuntime.BUILD.name = 'Boot-Safe Calendar, Cash Flow & UI Consolidation';
      window.GringottsCleanRuntime.BUILD.cacheBust = '1061boot1';
    }
    document.title = 'Gringotts Budget Vault v106.1';
    const version = document.querySelector('.version-text');
    if (version) version.textContent = 'v106.1';
    if (boot?.isConnected) boot.remove();
  })
  .catch(renderFailure);
