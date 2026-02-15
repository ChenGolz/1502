// KBWG Language + i18n helper. Build: 2026-02-15-v3
(function(){
  'use strict';

  function normLang(raw){
    raw = String(raw || '').toLowerCase().trim();
    if (!raw) return '';
    if (raw === 'iw') raw = 'he';
    if (raw.startsWith('he')) return 'he';
    if (raw.startsWith('en')) return 'en';
    return '';
  }

  function getQueryLang(){
    try{
      var p = new URLSearchParams(location.search);
      return normLang(p.get('lang'));
    }catch(e){ return ''; }
  }

  function getPathLang(){
    try{
      var p = (location.pathname || '').toLowerCase();
      if (p.endsWith('-en.html')) return 'en';
      if (p.includes('/en/')) return 'en';
      return 'he';
    }catch(e){ return 'he'; }
  }

  function getLang(){
    // Prefer the file-based language (index.html vs index-en.html).
    // Keep ?lang=en as an optional override/back-compat.
    var q = getQueryLang();
    if (q) return q;
    return getPathLang();
  }

  function setHtmlLangDir(lang){
    try{
      var html = document.documentElement;
      html.lang = (lang === 'en') ? 'en' : 'he';
      html.dir  = (lang === 'en') ? 'ltr' : 'rtl';
      html.classList.toggle('lang-en', lang === 'en');
      html.classList.toggle('lang-he', lang !== 'en');
    }catch(e){}
  }

  function switchPathForLang(pathname, lang){
    pathname = pathname || '';
    // Normalize directory URLs to index.html
    if (pathname.endsWith('/')) pathname = pathname + 'index.html';
    if (!pathname.endsWith('.html')) return pathname; // best-effort
    if (lang === 'en'){
      if (pathname.endsWith('-en.html')) return pathname;
      return pathname.replace(/\.html$/i, '-en.html');
    }
    // he
    return pathname.replace(/-en\.html$/i, '.html');
  }

  function withLangFile(url, lang){
    try{
      lang = normLang(lang) || getLang();
      if (!url) return url;
      if (/^(https?:)?\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url) || url.startsWith('#')) return url;
      if (url.startsWith('assets/') || url.startsWith('data/')) return url;

      var u = new URL(url, location.href);
      u.searchParams.delete('lang'); // prefer file-based
      u.pathname = switchPathForLang(u.pathname, lang);

      return u.pathname.replace(/^\//,'') + (u.search ? u.search : '') + (u.hash || '');
    }catch(e){
      // fallback: naive replace
      if (lang === 'en'){
        return url.replace(/\.html(\b|[?#])/i, '-en.html$1');
      }
      return url.replace(/-en\.html(\b|[?#])/i, '.html$1');
    }
  }

  function setLang(lang){
    lang = normLang(lang) || 'he';
    var current = getLang();
    if (lang === current) return;

    try{
      var u = new URL(location.href);
      u.searchParams.delete('lang');
      u.pathname = switchPathForLang(u.pathname, lang);
      location.href = u.toString();
    }catch(e){
      // best-effort
      var p = switchPathForLang(location.pathname, lang);
      location.href = p + (location.hash || '');
    }
  }

  // Apply ASAP based on current page language
  setHtmlLangDir(getLang());

  // ---- JSON helpers ----
  function jsonPath(name){
    var lang = getLang();
    return 'data/' + name + '-' + lang + '.json';
  }

  function fetchJson(url){
    return fetch(url, { cache: 'no-store' }).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function fetchLangJson(name, fallbackUrl){
    var primary = jsonPath(name);
    return fetchJson(primary).catch(function(){
      if (!fallbackUrl) fallbackUrl = 'data/' + name + '.json';
      return fetchJson(fallbackUrl);
    });
  }

  // ---- Auto-rewrite internal links to the current language file variant ----
  function patchLinks(){
    try{
      var lang = getLang();
      var links = document.querySelectorAll('a[href]');
      links.forEach(function(a){
        var href = a.getAttribute('href');
        if (!href) return;
        if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
        if (href.startsWith('assets/') || href.startsWith('data/')) return;

        if (href.endsWith('.html') || href.includes('.html?') || href.includes('.html#') || href.endsWith('-en.html')){
          a.setAttribute('href', withLangFile(href, lang));
        }
      });
    }catch(e){}
  }

  // ---- Simple language toggle UI ----
  function renderToggle(slot){
    if (!slot || slot.__kbwgLangRendered) return;
    slot.__kbwgLangRendered = true;

    var lang = getLang();
    var wrap = document.createElement('div');
    wrap.className = 'kbwgLangToggle';
    wrap.innerHTML =
      '<button type="button" class="kbwgLangBtn" data-lang="he" aria-label="עברית">HE</button>' +
      '<button type="button" class="kbwgLangBtn" data-lang="en" aria-label="English">EN</button>';

    wrap.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('.kbwgLangBtn');
      if(!btn) return;
      var next = btn.getAttribute('data-lang');
      setLang(next);
    });

    slot.innerHTML = '';
    slot.appendChild(wrap);

    try{
      var buttons = slot.querySelectorAll('.kbwgLangBtn');
      buttons.forEach(function(b){
        b.classList.toggle('isActive', b.getAttribute('data-lang') === lang);
      });
    }catch(e){}
  }

  function initLangUi(){
    renderToggle(document.getElementById('langSlotDesktop'));
    renderToggle(document.getElementById('langSlotMobile'));
  }

  function injectToggleStyles(){
    if (document.getElementById('kbwgLangToggleStyle')) return;
    var css = ''
      + '.kbwgLangToggle{display:inline-flex;gap:6px;align-items:center;}'
      + '.kbwgLangBtn{border:1px solid rgba(15,23,42,.18);background:rgba(255,255,255,.75);border-radius:10px;padding:6px 8px;font-weight:800;cursor:pointer;line-height:1;font-size:12px;}'
      + '.kbwgLangBtn.isActive{background:rgba(0,200,83,.14);border-color:rgba(0,200,83,.45);}';
    var st = document.createElement('style');
    st.id = 'kbwgLangToggleStyle';
    st.textContent = css;
    document.head.appendChild(st);
  }

  injectToggleStyles();

  document.addEventListener('DOMContentLoaded', function(){
    patchLinks();
    initLangUi();
    // In case header is injected after DOMContentLoaded
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      initLangUi();
      if (document.getElementById('langSlotMobile') || tries > 40) clearInterval(t);
    }, 250);
  });

  // Expose API
  window.kbwgGetLang = getLang;
  window.kbwgSetLang = setLang;
  window.kbwgWithLang = withLangFile;
  window.kbwgJsonPath = jsonPath;
  window.kbwgFetchLangJson = fetchLangJson;
})();
