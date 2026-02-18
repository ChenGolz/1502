/**
 * KBWG Price Tier helpers (no build step; works on GitHub Pages).
 *
 * Shows price level as $$$$$ where inactive $ are gray.
 *
 * Global API:
 * window.KBWGPriceTier = {
 * priceTierFromUsd,
 * renderPriceTier,
 * sortBrandsCheapestFirst,
 * sortProductsCheapestFirst
 * }
 */
(function (global) {
  'use strict';

  /**
   * Map a representative USD price to a tier 1..5.
   * You can tune these thresholds for your audience/category.
   */
  function priceTierFromUsd(usd) {
    var p = Number(usd);
    if (!Number.isFinite(p) || p <= 0) return 3; // sensible default if unknown
    if (p <= 12) return 1;
    if (p <= 25) return 2;
    if (p <= 45) return 3;
    if (p <= 80) return 4;
    return 5;
  }

  // ... (rendering and sorting logic remains the same) ...

})(window);