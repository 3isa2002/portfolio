import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime requests to Google, no layout shift.
// Only the display font is preloaded (SPEC §8).
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  // Body text only uses 400 (headings are Space Grotesk): one small static file instead of
  // the full variable font keeps the above-the-fold font bytes down (SPEC §8 LCP).
  weight: ["400"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  // One weight only (labels, tags, terminal): fewer font bytes before first paint.
  weight: ["400"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: t.meta.title, template: `%s · ${site.name}` },
  description: t.meta.description,
};

export const viewport: Viewport = {
  themeColor: "#07070B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-texture flex min-h-dvh flex-col">
        <a
          href="#main"
          className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60]"
        >
          {t.a11y.skipToContent}
        </a>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
