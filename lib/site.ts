// Business settings shown on the public site. Edit here, not in the pages.

/** Public address of the site (used in QR codes). Set NEXT_PUBLIC_SITE_URL; Vercel fills in its own URL. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const SITE = {
  name: "Reality Food",
  url: siteUrl.replace(/\/$/, ""),
  /** The dish visitors can try on their own table from the home page. */
  tryDish: { slug: "demo-bistro", id: "chocolate-cake", plateCm: 20 },
  /** Where "Book a demo" goes. Leave empty to send people to the live demo instead. */
  salesEmail: "",
  pricing: {
    setupUsd: 600,
    monthlyUsd: 52.9,
    /** Dishes we scan in 3D as part of setup. */
    dishesIncluded: 15,
  },
  demos: [
    { slug: "ironside-cafe", name: "Ironside Cafe", note: "Full café menu, with drinks and coffee in 3D" },
    { slug: "demo-bistro", name: "Demo Bistro", note: "Real dishes scanned with a phone" },
  ],
} as const;
