import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";
import { brand } from "@/config/brand";
import { appConfig } from "@/config/app";
import { SiteHeader } from "@/components/ui/site-header";
import { SiteFooter } from "@/components/ui/site-footer";

// "optional": the headline font never re-renders late (protects LCP); next/font preloads it so it is normally ready.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "optional", weight: ["600"] });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: { default: `${brand.name}: Locally owned food in Las Vegas`, template: `%s · ${brand.name}` },
  description: brand.description,
  openGraph: { siteName: brand.name, type: "website", locale: "en_US" },
};

export const viewport: Viewport = { themeColor: brand.colors.background };

const brandVars = Object.fromEntries(
  Object.entries(brand.colors).map(([k, v]) => [`--brand-${k}`, v]),
) as React.CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`} style={brandVars}>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-mustard focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
