// KBWG Language + i18n helper. Build: 2026-02-15-v2
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

  function setHtmlLangDir(lang){
    try{
      var html = document.documentElement;
      html.lang = (lang === 'en') ? 'en' : 'he';
      html.dir  = (lang === 'en') ? 'ltr' : 'rtl';
      html.classList.toggle('lang-en', lang === 'en');
      html.classList.toggle('lang-he', lang !== 'en');
    }catch(e){}
  }

  function getLang(){
    // Default is Hebrew/RTL unless the URL explicitly asks for English.
    var q = getQueryLang();
    return (q === 'en') ? 'en' : 'he';
  }

  function withLangParam(url, lang){
    try{
      lang = normLang(lang) || getLang();
      if (!url) return url;

      // External / special schemes / anchors
      if (/^(https?:)?\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url) || url.startsWith('#')) return url;
      if (url.startsWith('assets/') || url.startsWith('data/')) return url;

      // Compute GitHub Pages project base (e.g. "/1502/") so we can generate absolute paths safely.
      var baseDir = location.pathname.replace(/\/[^\/]*$/, '/'); // "/1502/"
      var parts = baseDir.split('/').filter(Boolean);
      var project = parts.length ? parts[0] : ''; // "1502" (empty on root domain)

      // If href accidentally includes the project folder ("1502/..."), strip it to avoid "/1502/1502/...".
      var cleaned = url;
      if (project){
        if (cleaned.startsWith(project + '/')) cleaned = cleaned.slice(project.length + 1);
        if (cleaned.startsWith('/' + project + '/')) cleaned = cleaned.slice(project.length + 2);
      }

      // Resolve against the project base directory (not against the current file URL)
      var u = new URL(cleaned, location.origin + baseDir);

      if (lang === 'en') u.searchParams.set('lang', 'en');
      else u.searchParams.delete('lang');

      // Use an ABSOLUTE path so it never becomes "/1502/1502/..." when clicked.
      return u.pathname + (u.search ? u.search : '') + (u.hash || '');
    }catch(e){
      // Minimal fallback string ops (best-effort)
      if (lang === 'en'){
        if (url.indexOf('lang=') !== -1){
          return url.replace(/([?&])lang=[^&]*/,'$1lang=en').replace(/[?&]$/,'');
        }
        return url + (url.indexOf('?') === -1 ? '?lang=en' : '&lang=en');
      }
      // remove lang param
      return url
        .replace(/([?&])lang=[^&]*&?/,'$1')
        .replace(/\?&/,'?')
        .replace(/[?&]$/,'');
    }
  }


  function setLang(lang, opts){
    lang = normLang(lang) || 'he';
    opts = opts || {};
    try{ localStorage.setItem('kbwg_lang', lang); }catch(e){}
    setHtmlLangDir(lang);

    if (opts.updateUrl !== false){
      try{
        var u = new URL(location.href);
        if (lang === 'en') u.searchParams.set('lang', 'en');
        else u.searchParams.delete('lang');
        location.href = u.toString();
        return;
      }catch(e){}
    }
  }

  // Apply ASAP
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

  
  // ---- Fix accidental "1502/..." relative links on GitHub Pages (prevents /1502/1502/...) ----
  function sanitizeProjectRelativeLinks(){
    try{
      var baseDir = location.pathname.replace(/\/[^\/]*$/, '/'); // "/1502/"
      var parts = baseDir.split('/').filter(Boolean);
      var project = parts.length ? parts[0] : '';
      if (!project) return;

      var links = document.querySelectorAll('a[href]');
      links.forEach(function(a){
        var href = a.getAttribute('href');
        if (!href) return;
        if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

        // If it's "1502/xyz.html" make it "/1502/xyz.html" (absolute) to avoid duplication.
        if (href.startsWith(project + '/')){
          a.setAttribute('href', '/' + href);
        }
        // If it's already "/1502/1502/xyz", collapse it.
        if (href.startsWith('/' + project + '/' + project + '/')){
          a.setAttribute('href', '/' + project + '/' + href.slice(('/' + project + '/' + project + '/').length));
        }
      });
    }catch(e){}
  }

// ---- Auto-append lang param to internal links ----
  function patchLinks(){
    try{
      var lang = getLang();
      if (lang !== 'en') return;
      var links = document.querySelectorAll('a[href]');
      links.forEach(function(a){
        var href = a.getAttribute('href');
        if (!href) return;
        if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
        if (href.startsWith('assets/') || href.startsWith('data/')) return;
        if (href.includes('lang=')) return;

        if (href.endsWith('.html') || href.includes('.html?') || href === './' || href === '.' || href === 'index.html'){
          a.setAttribute('href', withLangParam(href, lang));
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
      setLang(next, { updateUrl: true });
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

  
  function placeDesktopSlotAfterAbout(){
    try{
      var slot = document.getElementById('langSlotDesktop');
      if (!slot) return;

      // Prefer the "About" top-level group (details/summary)
      var aboutGroup = null;
      var summaries = document.querySelectorAll('#siteHeader .navGroup > summary');
      summaries.forEach(function(s){
        var t = (s.textContent || '').trim();
        if (t === 'אודות' || t.toLowerCase() === 'about'){
          aboutGroup = s.closest('.navGroup');
        }
      });

      // Fallback: some headers use plain links
      if (!aboutGroup){
        var links = document.querySelectorAll('#siteHeader nav.nav > a, #siteHeader nav.nav a');
        links.forEach(function(a){
          var t = (a.textContent || '').trim();
          if (t === 'אודות' || t.toLowerCase() === 'about'){
            aboutGroup = a;
          }
        });
      }

      if (!aboutGroup) return;

      // Only move if it's not already right after
      if (aboutGroup.nextElementSibling === slot) return;

      aboutGroup.insertAdjacentElement('afterend', slot);
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
    sanitizeProjectRelativeLinks();
    patchLinks();
    initLangUi();
    // In case header is injected after DOMContentLoaded
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      sanitizeProjectRelativeLinks();
      initLangUi();
      if (document.getElementById('langSlotMobile') || tries > 40) clearInterval(t);
    }, 250);
  });

  // Expose API
  window.kbwgGetLang = getLang;
  window.kbwgSetLang = setLang;
  window.kbwgWithLang = withLangParam;
  window.kbwgJsonPath = jsonPath;
  window.kbwgFetchLangJson = fetchLangJson;
})();
