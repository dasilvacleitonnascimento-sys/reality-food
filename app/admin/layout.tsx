import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "../globals.css";

// The Reality Food admin panel: its own root layout (English only, light theme,
// never indexed). Diner pages live under app/[lang].
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["600"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Reality Food admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E7E7E7",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only z-100 rounded-lg bg-(--rf-accent) px-4 py-3 font-bold text-(--rf-ink) focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
