import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Fraunces, Manrope } from "next/font/google";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MENU_THEME } from "@/lib/theme";
import "../globals.css";

// Brand fonts (docs/brand/BRAND.md): Fraunces for names and headlines, Manrope for everything else.
// Self-hosted by Next, so no extra request to Google on the restaurant's Wi-Fi.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLocale(lang)) return {};
  return {
    title: {
      default: "Reality Food",
      template: "%s | Reality Food",
    },
    description: getDictionary(lang).site.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets full-screen views (AR, bottom bars) reach the notch and home bar; they pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: MENU_THEME === "dark" ? "#191A1F" : "#E7E7E7",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (converters, translators, password managers) add attributes to <html>/<body> before React loads. Only these two tags, one level deep. */}
      <body className={`min-h-full flex flex-col ${MENU_THEME === "dark" ? "rf-dark" : ""}`} suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only z-100 rounded-lg bg-(--rf-accent) px-4 py-3 font-bold text-(--rf-ink) focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {getDictionary(lang).site.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
