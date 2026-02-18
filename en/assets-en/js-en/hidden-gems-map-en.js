(function () {
  // ... (initial logic) ...

  function render() {
    const grid = $('#hgGrid');
    const empty = $('#hgEmpty');
    const countEl = $('#hgCount');

    // ... (filtering logic) ...

    if (STATE.filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.innerHTML = 'No places found matching your search.';
      if (countEl) countEl.textContent = '0 results';
      return;
    }

    if (countEl) countEl.textContent = `Showing ${STATE.filtered.length} places`;

    // ... (card rendering) ...
    // "Visit Website" / "Directions" labels
    const btnLabel = it.type === 'shop' ? 'Visit Store' : 'View Menu / Details';
    // ...
  }

  function setupUI() {
    const q = $('#hgSearch');
    const c = $('#hgCountry');
    const s = $('#hgSort');
    const r = $('#hgReset');

    // Inside setupUI, ensure the select options for sorting are handled or updated in HTML
    // Sort labels: 'country' -> 'By Country', 'name' -> 'By Name'
  }
})();