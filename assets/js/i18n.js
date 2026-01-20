(function () {
  const STATE = {
    data: null,
    lang: null,
    defaultLang: 'hy',
    supported: ['hy', 'en', 'ru'],
    labels: { hy: 'Հայ', en: 'EN', ru: 'РУ' },
  };

  function safeGet(obj, path, fallback) {
    try {
      return path.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function pickTranslation(key) {
    const d = STATE.data;
    const lang = STATE.lang;
    const def = STATE.defaultLang;
    return (
      (d[lang] && d[lang][key] != null ? d[lang][key] : null) ??
      (d[def] && d[def][key] != null ? d[def][key] : null) ??
      // fallback: first available
      (STATE.supported.map((l) => (d[l] ? d[l][key] : null)).find((v) => v != null) ?? '')
    );
  }

  function applyTranslations() {
    document.documentElement.setAttribute('lang', STATE.lang);
    document.documentElement.setAttribute('data-lang', STATE.lang);

    const nodes = document.querySelectorAll('[data-i18n-key]');
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n-key');
      if (!key) return;
      const val = pickTranslation(key);

      const attr = el.getAttribute('data-i18n-attr');
      const isHtml = el.getAttribute('data-i18n-html') === 'true';

      if (attr) {
        el.setAttribute(attr, String(val));
        return;
      }

      if (isHtml) {
        el.innerHTML = String(val);
      } else {
        el.textContent = String(val);
      }
    });

    const labelEl = document.getElementById('langLabel');
    if (labelEl) labelEl.textContent = STATE.labels[STATE.lang] || STATE.lang;

    try {
      localStorage.setItem('site.lang', STATE.lang);
    } catch {}
  }

  function nextLang() {
    const idx = STATE.supported.indexOf(STATE.lang);
    const next = STATE.supported[(idx + 1) % STATE.supported.length];
    STATE.lang = next;
    applyTranslations();
  }

  async function init() {
    const res = await fetch('content/site.json', { cache: 'no-store' });
    const data = await res.json();
    STATE.data = data;
    STATE.defaultLang = safeGet(data, '_meta.defaultLang', 'hy');
    STATE.supported = safeGet(data, '_meta.supported', ['hy', 'en', 'ru']);
    STATE.labels = safeGet(data, '_meta.labels', STATE.labels);

    let lang = null;
    try {
      lang = localStorage.getItem('site.lang');
    } catch {}

    if (!lang) lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang');
    if (!lang) lang = STATE.defaultLang;
    if (!STATE.supported.includes(lang)) lang = STATE.defaultLang;

    STATE.lang = lang;
    applyTranslations();

    const btn = document.getElementById('langBtn');
    if (btn) btn.addEventListener('click', nextLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
