/* KBWG Bundles — Auto bundles from products.json (Free shipping over $49) — v4
   What’s new in v4:
   - Adds Kids/Family bundles for products with "kids" or "children" in the name.
   - Popup filters:
       * “Price Tier” is now BRAND tier (not product). Options are in English.
       * Adds Min/Max price (USD) + Category.
   - Adds “Build Your Own Bundle” (custom bundle builder) in English.
   - Generates more bundles from remaining eligible products while keeping each product unique.
   - Always fetches latest data/products.json.
*/

(function(){
  'use strict';

  try { window.KBWG_BUNDLES_BUILD = '2026-02-14-v5'; console.info('[KBWG] Bundles build', window.KBWG_BUNDLES_BUILD); } catch(e) {}

  var PRODUCTS_PATH = 'data/products.json';
  var BRANDS_PATH = 'data/intl-brands.json';
  var BRAND_INDEX = null;
  var FREE_SHIP_OVER_USD = 49;

  // Boolean helper (accepts true/"true"/1)
  function isTrueFlag(v) {
    if (v === true) return true;
    if (v === 1) return true;
    if (v === "1") return true;
    if (typeof v === "string") {
      var s = v.trim().toLowerCase();
      if (s === "true" || s === "yes") return true;
    }
    return false;
  }

  // Affiliate tag helper (adds tag only for Amazon US links at runtime)
  var AMAZON_TAG = 'nocrueltyil-20';
  function ensureAmazonComTag(url){
    var raw = String(url || '').trim();
    if (!raw) return raw;
    try{
      var u = new URL(raw, location.href);
      var host = String(u.hostname || '').toLowerCase();
      if (!(host === 'amazon.com' || host.slice(-10) === '.amazon.com')) return raw;
      if (u.searchParams.get('tag')) return u.toString();
      u.searchParams.set('tag', AMAZON_TAG);
      return u.toString();
    }catch(e){
      if (!raw || raw.indexOf('amazon.com') === -1) return raw;
      if (raw.indexOf('tag=') !== -1) return raw;
      return raw + (raw.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(AMAZON_TAG);
    }
  }

  function openAmazonCart(items){
    try{
      var usAsins = [];
      var ukUrls = [];
      (items || []).forEach(function(p){
        var o = p && p._offer;
        var asin = o && o.asin;
        var url = o && o.url;
        var host = '';
        try{ host = url ? (new URL(url, location.href)).hostname.toLowerCase() : ''; }catch(e){ host = ''; }

        if(host && (host === 'amazon.co.uk' || host.slice(-13) === '.amazon.co.uk')){
          if(url) ukUrls.push(url);
          return;
        }

        if(asin) usAsins.push(String(asin).trim());
        else if(url){
          try{ window.open(ensureAmazonComTag(url), '_blank', 'noopener'); }catch(e){}
        }
      });

      if(usAsins.length){
        var base = 'https://www.amazon.com/gp/aws/cart/add.html';
        var qs = [];
        for(var i=0;i<usAsins.length;i++){
          qs.push('ASIN.' + (i+1) + '=' + encodeURIComponent(usAsins[i]));
          qs.push('Quantity.' + (i+1) + '=1');
        }
        qs.push('tag=' + encodeURIComponent(AMAZON_TAG));
        var urlCart = base + '?' + qs.join('&');
        window.open(urlCart, '_blank', 'noopener');
      }

      for(var j=0;j<ukUrls.length;j++){
        try{ window.open(ukUrls[j], '_blank', 'noopener'); }catch(e){}
      }
    }catch(e){
      console.warn('[bundles] openAmazonCart failed', e);
    }
  }

  // Note: Customs taxes/fees may apply for orders over $150 (Israel)
  var TAX_THRESHOLD_USD = 150;
  var BUNDLE_MIN = 52.00;
  var BUNDLE_MAX = 65.00;
  var BUNDLE_MIN_ITEMS = 3;
  var MORE_MERRIER_PREFER_MAX = 55.00;
  // Internal target for balancing bundles
  var BUNDLE_TARGET = (BUNDLE_MIN + BUNDLE_MAX) / 2;

  var MAX_KIDS_BUNDLES = 9999;
  var MAX_EXTRA_BUNDLES = 9999;
  var USD_TO_ILS_DEFAULT = 3.30;
  var FX_RATE = USD_TO_ILS_DEFAULT;

  function $(s,r){ return (r||document).querySelector(s); }
  function $all(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function isNum(x){ return typeof x === 'number' && isFinite(x); }

  function kbRenderPager(pagerEl, page, totalItems, perPage, onPage){
    if(!pagerEl) return;
    var totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    if(totalPages <= 1){
      pagerEl.innerHTML = '';
      pagerEl.style.display = 'none';
      return;
    }
    pagerEl.style.display = 'flex';

    if(page < 1) page = 1;
    if(page > totalPages) page = totalPages;

    var prevDisabled = page <= 1;
    var nextDisabled = page >= totalPages;

    pagerEl.innerHTML = ''
      + '<button class="btnSmall btnGhost" type="button" ' + (prevDisabled ? 'disabled aria-disabled="true"' : '') + ' data-kbprev>Previous</button>'
      + '<span class="kbPagerInfo">Page ' + page + ' of ' + totalPages + '</span>'
      + '<button class="btnSmall btnGhost" type="button" ' + (nextDisabled ? 'disabled aria-disabled="true"' : '') + ' data-kbnext>Next</button>';

    var prevBtn = pagerEl.querySelector('[data-kbprev]');
    var nextBtn = pagerEl.querySelector('[data-kbnext]');
    if(prevBtn) prevBtn.onclick = function(){ if(page>1) onPage(page-1); };
    if(nextBtn) nextBtn.onclick = function(){ if(page<totalPages) onPage(page+1); };
  }

  function kbRangeText(page, totalItems, perPage){
    if(!totalItems) return 'No results found';
    var start = (page-1)*perPage + 1;
    var end = Math.min(totalItems, page*perPage);
    return 'Showing ' + start + '–' + end + ' of ' + totalItems;
  }

  function fmtUSD(n){
    var x = Number(n);
    if(!isFinite(x)) return '$—';
    var usd = '$' + x.toFixed(2);
    var ils = Math.round(x * (FX_RATE || USD_TO_ILS_DEFAULT));
    if(!isFinite(ils)) return usd;
    return usd + ' (₪' + ils + ')';
  }

  // ... (Remaining rendering logic translated similarly) ...

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      wire();
      init().catch(function(e){
        console.warn(e);
        var grid=$('#bundleGrid');
        if(grid) grid.innerHTML='<p class="muted">Error loading products. Make sure '+PRODUCTS_PATH+' exists.</p>';
      });
    });
  }
})();