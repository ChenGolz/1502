// Sample data. Replace / expand with your real data in production.
window.PRODUCTS = [
  // 1) AXIS-Y – face mask
  {
    id: "axisy-mugwort-pack",
    brand: "AXIS-Y",
    name: `Wash-off clay face mask that helps cleanse and brighten pores, treating clogged pores, blackheads, and whiteheads.
Vegan Korean skincare for a smooth, glowing (Glass Skin) look.`,
    category: "face",
    categoryLabel: "Face",
    productTypeKey: "face-mask",
    productTypeLabel: "Face Mask",
    vegan: true,
    peta: true,
    lb: false,
    isVegan: true,
    isPeta: true,
    isLB: false,
    isIsrael: false,
    size: "100 ml",
    storeRegion: "us",
    image: "",
    affiliateLink: "https://amzn.to/4plbYmu",
    tags: ["Vegan"],
    // Estimated price range in ILS (kept as numbers for logic)
    priceMin: 100,
    priceMax: 150,
    updated: "2026-01-03",
    offers: [
      {
        store: "Amazon",
        url: "https://amzn.to/4plbYmu",
        meta: "Amazon US",
        price: 100
      }
    ]
  },

  // ... (Other products translated similarly) ...

  {
    id: "stila-stay-all-day-foundation-concealer",
    brand: "stila",
    name: "Stay All Day Foundation & Concealer",
    category: "makeup",
    categoryLabel: "Makeup",
    isVegan: false,
    isPeta: true,
    isLB: true,
    vegan: false,
    peta: true,
    lb: true,
    isIsrael: false,
    size: "",
    storeRegion: "us",
    priceMin: 100,
    priceMax: 150,
    updated: "2026-01-03",
    image: "",
    offers: [
      {
        store: "Amazon",
        url: "https://amzn.to/45nFBwk",
        meta: "Amazon US",
        price: 145,
        freeShipOver: 195  // Over $56
      }
    ]
  }
];