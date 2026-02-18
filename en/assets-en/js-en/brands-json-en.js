// // Build: 2026-02-11-v23
try { window.KBWG_BRANDS_BUILD = String(window.KBWG_BUILD || '2026-02-11-v1'); console.info('[KBWG] KBWG_BRANDS_BUILD ' + window.KBWG_BRANDS_BUILD); } catch(e) {}

// Resolve URLs correctly when Weglot serves pages under /en/ (or when hosted under a subpath, e.g. GitHub Pages).
function __kbwgSiteBaseFromScript(scriptName) {
  try {
    var src = '';
    try { src = (document.currentScript && document.currentScript.src) ? document.currentScript.src : ''; } catch (e) { src = ''; }
    if (!src) {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var ssrc = scripts[i] && scripts[i].src ? String(scripts[i].src) : '';
        if (ssrc.indexOf(scriptName) !== -1) { src = ssrc; break; }
      }
    }
    if (!src) return '/';

    var u = new URL(src, location.href);
    var p = u.pathname || '/';
    var idx = p.indexOf('/assets/js/');
    if (idx !== -1) return p.substring(0, idx) + '/';
    return '/';
  } catch (e) { return '/'; }
}

(function () {
  var siteBase = __kbwgSiteBaseFromScript('brands-json.js');

  function kbwgFetch(relPath) {
    var cleanPath = relPath.replace(/^\//, '');
    var finalUrl = siteBase + cleanPath;
    return fetch(finalUrl).then(function (r) {
      if (!r.ok) throw new Error('Fetch failed: ' + finalUrl);
      return r.json();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('brandGrid');
    if (!grid) return;

    var jsonPath = grid.getAttribute('data-json') || 'data/intl-brands.json';
    var pageKind = grid.getAttribute('data-page') || 'intl'; 

    Promise.all([kbwgFetch(jsonPath), kbwgFetch('data/index.json')])
      .then(function (res) {
        var brands = res[0];
        var idx = res[1];

        var searchInput = document.getElementById('brandSearch');
        var catSelect = document.getElementById('brandCategoryFilter');
        var priceSelect = document.getElementById('brandPriceFilter');
        var countEl = document.querySelector('[data-brands-count]');

        // Populate Categories
        if (catSelect) {
          var cats = [];
          brands.forEach(function (b) {
            if (b.categories) {
              b.categories.forEach(function (c) { if (cats.indexOf(c) === -1) cats.push(c); });
            }
          });
          cats.sort().forEach(function (c) {
            var opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            catSelect.appendChild(opt);
          });
        }

        // Populate Price Tiers
        if (priceSelect) {
          [1, 2, 3, 4, 5].forEach(function (v) {
            var opt = document.createElement('option');
            opt.value = v;
            opt.textContent = new Array(v + 1).join('$');
            priceSelect.appendChild(opt);
          });
        }

        function render(list) {
          grid.innerHTML = '';
          if (countEl) countEl.textContent = 'Showing ' + list.length + ' brands';

          list.forEach(function (b) {
            var card = document.createElement('div');
            card.className = 'brandCard contentCard';
            
            var tagsHtml = '';
            if (b.tags) {
              tagsHtml = '<div class="brandTags">' + b.tags.map(function(t){ 
                return '<span class="brandTag">' + t + '</span>'; 
              }).join('') + '</div>';
            }

            var priceHtml = '';
            if (b.price) {
              priceHtml = '<div class="brandPrice">' + new Array(b.price + 1).join('$') + '</div>';
            }

            var badgesHtml = '';
            if (b.badges) {
              badgesHtml = '<div class="brandBadges">' + b.badges.map(function(bg){
                var bObj = idx.badges[bg] || { label: bg };
                return '<span class="brandBadge" title="' + (bObj.description || '') + '">' + (bObj.icon || '') + ' ' + bObj.label + '</span>';
              }).join('') + '</div>';
            }

            var actionHtml = '';
            if (b.url) {
              actionHtml = '<a href="' + b.url + '" target="_blank" rel="noopener" class="btn primary btnFull">Visit Website</a>';
            }

            card.innerHTML = [
              '<div class="brandHeader">',
                '<h3>' + b.name + '</h3>',
                priceHtml,
              '</div>',
              '<div class="brandBody">',
                '<p class="brandDesc">' + (b.description || '') + '</p>',
                tagsHtml,
                badgesHtml,
              '</div>',
              '<div class="brandFooter">',
                actionHtml,
              '</div>'
            ].join('');
            grid.appendChild(card);
          });

          try { window.dispatchEvent(new Event('kbwg:content-rendered')); } catch (e) {}
        }

        function filter() {
          var q = searchInput ? searchInput.value.toLowerCase() : '';
          var cat = catSelect ? catSelect.value : '';
          var p = priceSelect ? parseInt(priceSelect.value) || 0 : 0;

          var filtered = brands.filter(function (b) {
            var matchQ = !q || b.name.toLowerCase().indexOf(q) !== -1 || (b.tags && b.tags.join(' ').toLowerCase().indexOf(q) !== -1) || (b.description && b.description.toLowerCase().indexOf(q) !== -1);
            var matchCat = !cat || (b.categories && b.categories.indexOf(cat) !== -1);
            var matchPrice = !p || (b.price && b.price <= p);
            return matchQ && matchCat && matchPrice;
          });
          render(filtered);
        }

        if (searchInput) searchInput.addEventListener('input', filter);
        if (catSelect) catSelect.addEventListener('change', filter);
        if (priceSelect) priceSelect.addEventListener('change', filter);

        render(brands);

        try { window.dispatchEvent(new Event('kbwg:content-rendered')); } catch (e) {}
      })
      .catch(function (err) {
        console.error(err);
        var isFile = false;
        try { isFile = location && location.protocol === 'file:'; } catch (e) { isFile = false; }

        if (isFile) {
          grid.innerHTML = [
            '<div class="infoCard">',
            '<strong>The site is currently running from a local file (file://),</strong> so the browser blocks JSON loading (CORS).',
            '<br>To make this work locally, run a small Local Server and then open the site via <code>http://localhost</code>.',
            '<br><br><strong>Windows:</strong> In the project folder, run:',
            '<br><code>py -m http.server 8000</code>',
            '<br>Then open: <code>http://localhost:8000/recommended-brands.html</code>',
            '<br><br>On GitHub Pages / a real website (https), this will work without any issues.',
            '</div>'
          ].join('');
        } else {
          grid.innerHTML = '<div class="infoCard">Error loading brands. Please try refreshing the page.</div>';
        }
      });
  });
})();