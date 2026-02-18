/* KBWG Ingredient Detective — JSON-backed (v30)
   Loads ingredients from assets/data/ingredient-db.json and matches by keys.
*/
(function () {
  'use strict';
  // ... (logic remains the same) ...

  function noteBoxHTML(msg) {
    return `<div class="noteBox">${msg}</div>`;
  }

  function cardHTML(item) {
    const statusMap = {
      'טבעוני': { label: 'Vegan', color: '#10b981' },
      'רכיב מן החי': { label: 'Animal-derived', color: '#ef4444' },
      'תלוי מקור': { label: 'Source-dependent', color: '#f59e0b' }
    };
    const s = statusMap[item.status] || { label: item.status, color: '#64748b' };
    return `
      <div class="ingCard">
        <div class="ingStatus" style="background:${s.color}">${s.label}</div>
        <div class="ingName">${item.name}</div>
        ${item.description ? `<div class="ingDesc">${item.description}</div>` : ''}
      </div>`;
  }

  // ... (event listeners) ...
  const out = document.getElementById('detectiveResults');
  if (!window.INGREDIENT_DB) {
    out.innerHTML = noteBoxHTML('Loading database... Please try again in a moment.');
    return;
  }

  const tokens = splitIngredients(pasteIng.value);
  if (!tokens.length) {
    out.innerHTML = noteBoxHTML('No ingredients identified in the text provided.');
    return;
  }
  
  // Sorting order: Animal-derived first, then Source-dependent, then Vegan
  const order = { 'רכיב מן החי': 0, 'תלוי מקור': 1, 'טבעוני': 2 };
  // ...
})();