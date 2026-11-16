// Restaurants we show as a sales preview (not customers yet). Their menu gets
// the restaurant's own logo, a small "Preview prepared for ..." banner so it
// isn't mistaken for their official menu, and stays out of search engines.
// When a restaurant signs up, remove it from here (and put the logo in Supabase).

type Preview = {
  /** Path under /public. */
  logo: string;
  /** Wide logos (signs, wordmarks) are shown as a banner instead of a circle. */
  wide: boolean;
};

const PREVIEWS: Record<string, Preview> = {
  "ironside-cafe": { logo: "/images/ironside/brand-logo.jpg", wide: true },
};

export function getPreview(slug: string): Preview | undefined {
  return PREVIEWS[slug];
}
