// Business settings shown on the public site. Edit here, not in the pages.

export const SITE = {
  name: "Reality Food",
  /** Where "Book a demo" goes. Leave empty to send people to the live demo instead. */
  salesEmail: "",
  pricing: {
    setupUsd: 600,
    monthlyUsd: 99,
    /** Dishes we scan in 3D as part of setup. */
    dishesIncluded: 15,
  },
  demos: [
    { slug: "ironside-cafe", name: "Ironside Cafe", note: "Full café menu · 46 dishes in 3D" },
    { slug: "demo-bistro", name: "Demo Bistro", note: "Plated dishes · built from real photos" },
  ],
} as const;
