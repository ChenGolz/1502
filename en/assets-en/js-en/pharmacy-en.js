/* Pharmacy page (2026-02-04-v16) */
(function(){
  const state = { q: '', store: 'all' };
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function normalize(s){ return String(s||'').trim().toLowerCase(); }

  function storeLabel(id){
    if(id==='superpharm') return 'Super-Pharm';
    if(id==='be') return 'Be';
    if(id==='goodpharm') return 'Good Pharm';
    if(id==='shufersal') return 'Shufersal';
    return id;
  }

  // ... (matching logic) ...

    }catch(err){
      const mount = $('#phList');
      if(mount){
        mount.innerHTML = `<div class="contentCard"><p class="muted" style="margin:0;">Error loading pharmacy data. Please try again later.</p></div>`;
      }
      console.error('[Pharmacy] Load failed', err);
    }
  }
  // ...
})();