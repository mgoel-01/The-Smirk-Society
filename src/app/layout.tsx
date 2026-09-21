import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Dancing_Script, Inter } from "next/font/google";
import { EVENT } from "@/lib/event";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-dancing",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = `${EVENT.name} ${EVENT.year} — ${EVENT.tagline}`;
const description = `${EVENT.tagline}. ${EVENT.dateLabel}, ${EVENT.timeLabel} at ${EVENT.venue}, ${EVENT.venueArea}. Live band, DJ, dhol, food and shopping stalls. Book your pass online.`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: { default: title, template: `%s — ${EVENT.name} ${EVENT.year}` },
  description,
  keywords: [
    "dandiya night ghaziabad",
    "garba 2026",
    "navratri ghaziabad",
    "Smirk N Raas",
    "dandiya tickets",
    "Chancellor Club",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_IN",
    siteName: `${EVENT.name} ${EVENT.year}`,
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#12040C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${dancing.variable} ${inter.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
