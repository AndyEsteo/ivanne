(function () {
  const STORAGE_KEY = 'priv_unlock_key_v2';
  const gate = document.getElementById('access-gate');
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const errorEl = document.getElementById('gate-error');
  const submitBtn = document.getElementById('gate-submit-btn');

  function normalizeKey(raw) {
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits === '121124') return '12112024';
    return digits;
  }

  async function tryUnlock(candidateKey) {
    const cleanKey = normalizeKey(candidateKey);
    if (!cleanKey) return false;

    try {
      if (submitBtn) submitBtn.textContent = 'Desbloqueando... 🤍';
      const resp = await fetch('bundle.enc');
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const iv = bytes.slice(0, 12);
      const data = bytes.slice(12);

      const enc = new TextEncoder();
      const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(cleanKey));
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyHash,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedBuf = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );

      const decStr = new TextDecoder().decode(decryptedBuf);
      const payload = JSON.parse(decStr);

      document.title = payload.title || document.title;
      const root = document.getElementById('app-root');
      root.innerHTML = payload.html;
      gate.classList.add('is-unlocked');

      const fn = new Function(payload.js);
      fn();
      return true;
    } catch (err) {
      if (submitBtn) submitBtn.textContent = 'Desbloquear 🤍';
      return false;
    }
  }

  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.classList.add('hidden');
      const ok = await tryUnlock(input.value);
      if (!ok && errorEl) {
        errorEl.classList.remove('hidden');
        input.focus();
      }
    });
  }
})();