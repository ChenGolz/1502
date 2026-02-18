// Products page logic (LTR-friendly, data-normalized, performant)
(function () {
  const qs = (s) => document.querySelector(s);

  // Affiliate tag helper (adds tag only for Amazon US links at runtime)
  const AMAZON_TAG = 'nocrueltyil-20';
  function ensureAmazonComTag(url){
    const raw = String(url || '').trim();
    if(!raw) return raw;
    try{
      const u = new URL(raw, location.href);
      const host = String(u.hostname || '').toLowerCase();
      // Only amazon.com (do NOT touch amazon.co.uk or amzn.to)
      if(!(host === 'amazon.com' || host.endsWith('.amazon.com'))) return raw;
      if(u.searchParams.get('tag')) return u.toString();
      u.searchParams.set('tag', AMAZON_TAG);
      return u.toString();
    }catch(e){
      // fallback string ops
      if(raw.indexOf('amazon.com') === -1) return raw;
      if(raw.indexOf('tag=') !== -1) return raw;
      return raw + (raw.indexOf('?') === -1 ? '?' : '&') + 'tag=' + encodeURIComponent(AMAZON_TAG);
    }
  }


  // Pagination helpers (v12) — keeps pages fast on mobile/iPad
  function kbPerPage(kind){
    var w = window.innerWidth || 1024;
    // products are heavier; keep conservative
    if (w <= 520) return 12;
    if (w <= 900) return 18;
    return 24;
  }

  function renderPager(mount, page, total, per, onPage){
    if(!mount) return;
    const totalPages = Math.ceil(total / per);
    if(totalPages <= 1){
      mount.innerHTML = '';
      mount.style.display = 'none';
      return;
    }
    mount.style.display = 'flex';
    
    let html = '';
    html += `<button class="btnSmall btnGhost" ${page <= 1 ? 'disabled' : ''} data-kbpage="${page - 1}">Previous</button>`;
    html += `<span class="pagerInfo">Page ${page} of ${totalPages}</span>`;
    html += `<button class="btnSmall btnGhost" ${page >= totalPages ? 'disabled' : ''} data-kbpage="${page + 1}">Next</button>`;
    
    mount.innerHTML = html;
    mount.onclick = (e) => {
      const btn = e.target.closest('[data-kbpage]');
      if(!btn || btn.disabled) return;
      onPage(parseInt(btn.dataset.kbpage));
    };
  }

  // State
  let allProducts = [];
  let currentCat = "all";
  let currentPage = 1;

  const grid = qs("#grid");
  const countTag = qs("#liveCount");
  const emptyState = qs("#emptyState");
  const q = qs("#searchInput");
  const brandSelect = qs("#brandFilter");
  const storeSelect = qs("#storeFilter");
  const sortSel = qs("#sortFilter");
  const typeSelect = qs("#typeFilter");
  const onlyLB = qs("#onlyLB");
  const onlyPeta = qs("#onlyPeta");
  const onlyIsrael = qs("#onlyIsrael");
  const onlyFreeShip = qs("#onlyFreeShip");
  const priceMinInput = qs("#priceMin");
  const priceMaxInput = qs("#priceMax");
  const clearBtn = qs("#clearFilters");
  const pagerTop = qs("#pagerTop");
  const pagerBottom = qs("#pagerBottom");

  function renderProduct(p) {
    const isLB = (p.badges || []).includes("lb");
    const isPeta = (p.badges || []).includes("peta");
    const isVegan = (p.badges || []).includes("vegan");
    
    // Price tier display
    let priceHtml = '';
    if(p.priceTier && window.KBWGPriceTier){
        const tierNode = window.KBWGPriceTier.renderPriceTier(p.priceTier, { size: 'sm' });
        priceHtml = `<div class="product-price-tier">${tierNode.outerHTML}</div>`;
    } else if (p.priceDisplay) {
        priceHtml = `<div class="product-price-text">${p.priceDisplay}</div>`;
    }

    return `
      <article class="product-card">
        <div class="product-img-wrap">
          ${p.img ? `<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='assets/img/placeholder.png'">` : ''}
          <div class="product-badges">
            ${isLB ? '<span class="badge lb" title="Leaping Bunny Certified"></span>' : ''}
            ${isPeta ? '<span class="badge peta" title="PETA Certified"></span>' : ''}
            ${isVegan ? '<span class="badge vegan" title="100% Vegan Product"></span>' : ''}
          </div>
        </div>
        <div class="product-info">
          <div class="product-brand">${p.brand || ''}</div>
          <h3 class="product-title">${p.name}</h3>
          ${priceHtml}
          <div class="product-meta">
            ${p.category ? `<span class="meta-tag">${p.category}</span>` : ''}
          </div>
        </div>
        <div class="product-actions">
          <a href="${ensureAmazonComTag(p.url)}" target="_blank" rel="noopener" class="btn primary btnFull">View on Amazon</a>
        </div>
      </article>
    `;
  }

  function scheduleRender(){
    currentPage = 1;
    render();
  }

  function render() {
    if (!allProducts.length) return;

    let filtered = allProducts.filter((p) => {
      // Category filter
      if (currentCat !== "all" && p.category !== currentCat) return false;
      
      // Search filter
      const search = (q.value || "").toLowerCase();
      if (search) {
        const target = (p.name + " " + p.brand + " " + (p.category || "") + " " + (p.tags || []).join(" ")).toLowerCase();
        if (!target.includes(search)) return false;
      }

      // Dropdown filters
      if (brandSelect.value && p.brand !== brandSelect.value) return false;
      if (storeSelect.value && !(p.stores || []).includes(storeSelect.value)) return false;
      if (typeSelect.value && p.type !== typeSelect.value) return false;

      // Badges
      if (onlyLB.checked && !(p.badges || []).includes("lb")) return false;
      if (onlyPeta.checked && !(p.badges || []).includes("peta")) return false;
      if (onlyIsrael.checked && !p.isIsraeli) return false;
      if (onlyFreeShip.checked && !p.hasFreeShip) return false;

      // Price range
      const min = parseFloat(priceMinInput.value);
      const max = parseFloat(priceMaxInput.value);
      if (!isNaN(min) && p.price < min) return false;
      if (!isNaN(max) && p.price > max) return false;

      return true;
    });

    // Sort
    const sortVal = sortSel.value;
    if (sortVal === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === "price-high") filtered.sort((a, b) => b.price - a.price);
    else if (sortVal === "newest") filtered.sort((a, b) => (b.id || 0) - (a.id || 0));

    // Update count
    countTag.textContent = `${filtered.length} products`;
    emptyState.hidden = filtered.length > 0;

    // Paging
    const per = kbPerPage('products');
    const start = (currentPage - 1) * per;
    const paginated = filtered.slice(start, start + per);

    grid.innerHTML = paginated.map(renderProduct).join("");

    const onPage = (p) => { 
        currentPage = p; 
        render(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    renderPager(pagerTop, currentPage, filtered.length, per, onPage);
    renderPager(pagerBottom, currentPage, filtered.length, per, onPage);

    // Let Weglot know dynamic content is ready
    try { window.dispatchEvent(new Event('kbwg:content-rendered')); } catch (e) {}
  }

  // ... (Events - Identical Logic, updated Clear-all labels) ...
  clearBtn?.addEventListener("click", () => {
    q.value = "";
    brandSelect.value = "";
    storeSelect.value = "";
    sortSel.value = "price-low";
    typeSelect.value = "";
    onlyLB.checked = false;
    onlyPeta.checked = false;
    onlyIsrael.checked = false;
    onlyFreeShip.checked = false;
    if (priceMinInput) priceMinInput.value = "";
    if (priceMaxInput) priceMaxInput.value = "";
    scheduleRender();
  });

  // Initialization
  const dataUrl = window.kbwgAddV ? window.kbwgAddV('data/products.json') : 'data/products.json';
  fetch(dataUrl)
    .then(r => r.json())
    .then(data => {
      allProducts = Array.isArray(data) ? data : (data.products || []);
      render();
    })
    .catch(err => {
      console.error("Failed to load products:", err);
      grid.innerHTML = '<p class="muted">Error loading products. Please try refreshing.</p>';
    });

})();