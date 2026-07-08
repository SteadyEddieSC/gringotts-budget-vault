const boot = document.getElementById('bootStatus');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function renderFailure(error) {
  const message = error?.stack || error?.message || String(error || 'Unknown module-loading error');
  if (!boot) return;
  if (!boot.isConnected) document.body.replaceChildren(boot);
  boot.innerHTML = `
    <section class="boot-card" role="alert">
      <h1>Gringotts could not start</h1>
      <p>The page shell loaded, but a JavaScript module failed. Your browser-local vault has not been cleared or overwritten.</p>
      <div class="boot-actions">
        <button id="bootRetry" type="button">Retry v107</button>
        <a href="rescue-v105.html?release=rescue1051">Open stable v105 rescue</a>
      </div>
      <details open><summary>Technical detail</summary><pre>${escapeHtml(message)}</pre></details>
    </section>`;
  document.getElementById('bootRetry')?.addEventListener('click', () => location.reload());
}

window.addEventListener('error', (event) => { if (event?.error) renderFailure(event.error); });
window.addEventListener('unhandledrejection', (event) => renderFailure(event?.reason));

import('./runtime-v107-review-performance.js?v=107reviewperf1')
  .then(() => {
    document.title = 'Gringotts Budget Vault v107';
    const version = document.querySelector('.version-text');
    if (version) version.textContent = 'v107';
    if (boot?.isConnected) boot.remove();
  })
  .catch(renderFailure);
