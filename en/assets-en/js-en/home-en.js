// Home page helpers (v14) — fast, minimal, non-salesy
(function(){
  // ... (core functions) ...

  function renderDealsTeaser(list){
    var grid = qs('#homeDealsGrid');
    if(!grid) return;
    
    var discounted = list.filter(function(p){ return p.isDiscounted; }).slice(0, 4);
    if(discounted.length === 0){
      qs('#homeDealsEmpty').textContent = 'No active deals today. Check back soon!';
      return;
    }
    // ... (render html) ...
    // "View Deal" label
  }

  function renderProductsTeaser(list){
    var grid = qs('#homeProductsGrid');
    if(!grid) return;
    
    var featured = list.slice(0, 4);
    if(featured.length === 0){
      qs('#homeProductsEmpty').textContent = 'Loading recommendations...';
      return;
    }
    // ...
  }

  function bindHomeSearch(){
    var input = qs('#homeSearchInput');
    // Placeholder updated in HTML, but logic handles redirect to /search.html
  }
})();