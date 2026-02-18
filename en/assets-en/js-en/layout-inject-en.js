// Build: 2026-02-04-v20
// Shared layout injector (header + footer) for KBWG static pages
// Loads partials/header.html into #siteHeaderMount and partials/footer.html into #siteFooterMount
(function () {
// ============================================================
// KBWG single version + fetch helpers
// Update KBWG_BUILD below to bust cache for ALL pages + JSON.
// ============================================================
const KBWG_BUILD = '2026-02-11-v1';
window.KBWG_BUILD = window.KBWG_BUILD || KBWG_BUILD;
window.KBWG_VER = window.KBWG_VER || window.KBWG_BUILD;

// ... (logic remains the same) ...

  function fireReady() {
    try { window.dispatchEvent(new CustomEvent('kbwg:layout-ready')); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('kbwg:content-rendered')); } catch (e) {}
    console.log('[KBWG] Layout injected & ready.');
  }
// ...
})();