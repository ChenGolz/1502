// KBWG Language + i18n helper. Build: 2026-02-15-v4
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

  // If someone lands on a Hebrew file with ?lang=en (or vice versa),
  // redirect to the correct file variant so dir/lang match the actual page.
  function reconcileQueryLang(){
    var q = getQueryLang();
    if (!q) return;
    var pathLang = getPathLang();
    // Only redirect when the query disagrees with the file variant.
    if (q === pathLang) {
      // Still clean the URL by removing ?lang=...
      try{
        var u0 = new URL(location.href);
        u0.searchParams.delete('lang');
        if (u0.toString() !== location.href) location.replace(u0.toString());
      }catch(e){}
      return;
    }

    try{
      var u = new URL(location.href);
      u.searchParams.delete('lang');
      u.pathname = switchPathForLang(u.pathname, q);
      location.replace(u.toString());
    }catch(e){
      // best-effort
      var p = switchPathForLang(location.pathname, q);
      location.replace(p + (location.hash || ''));
    }
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

  // Apply ASAP based on current page language.
  // First, reconcile any legacy ?lang=... URLs to the correct file.
  reconcileQueryLang();
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

  // ---- Language toggle UI ----
  // We render a compact segmented control (HE | EN) that aligns nicely with the nav
  // and stays small enough on mobile.
  function renderToggle(slot){
    if (!slot) return;

    var lang = getLang();
    var existing = slot.querySelector && slot.querySelector('.kbwgLangToggle');
    if (!existing){
      var wrap = document.createElement('div');
      wrap.className = 'kbwgLangToggle';

      // Short labels for tight spaces + full labels for desktop polish.
      wrap.innerHTML =
        '<button type="button" class="kbwgLangBtn" data-lang="he" aria-label="עברית">'
          + '<span class="kbwgLangShort">HE</span><span class="kbwgLangFull">עברית</span>'
        + '</button>'
        + '<button type="button" class="kbwgLangBtn" data-lang="en" aria-label="English">'
          + '<span class="kbwgLangShort">EN</span><span class="kbwgLangFull">English</span>'
        + '</button>';

      wrap.addEventListener('click', function(e){
        var btn = e.target && e.target.closest && e.target.closest('.kbwgLangBtn');
        if(!btn) return;
        var next = btn.getAttribute('data-lang');
        setLang(next);
      });

      slot.innerHTML = '';
      slot.appendChild(wrap);
    }

    // Update active state (important because the header can be injected after load)
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
      + '.kbwgLangToggle{display:inline-flex;align-items:center;gap:0;border:1px solid rgba(15,23,42,.16);background:rgba(255,255,255,.75);border-radius:999px;padding:2px;box-shadow:0 1px 2px rgba(0,0,0,.04);}'
      + '.kbwgLangBtn{appearance:none;border:0;background:transparent;border-radius:999px;padding:7px 10px;font-weight:800;cursor:pointer;line-height:1;display:inline-flex;align-items:center;gap:6px;color:rgba(15,23,42,.78);}'
      + '.kbwgLangBtn:focus{outline:none;}'
      + '.kbwgLangBtn:focus-visible{box-shadow:0 0 0 3px rgba(42,91,154,.18);}'
      + '.kbwgLangBtn.isActive{background:rgba(0,200,83,.18);color:rgba(10,80,40,.92);}'
      + '.kbwgLangShort{display:none;}'
      + '.kbwgLangFull{display:inline; font-size:12.5px;}'
      + '@media (max-width: 900px){'
        + '.kbwgLangBtn{padding:6px 8px;}'
        + '.kbwgLangFull{display:none;}'
        + '.kbwgLangShort{display:inline; font-size:12px; letter-spacing:.2px;}'
      + '}'
      + '@media (max-width: 360px){.kbwgLangBtn{padding:6px 7px;}}';
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
