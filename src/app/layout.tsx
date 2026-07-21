import type { Metadata } from "next";
import { Fraunces, Markazi_Text, Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const displayEn = Fraunces({
  variable: "--font-display-en",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const displayAr = Markazi_Text({
  variable: "--font-display-ar",
  subsets: ["arabic"],
  weight: ["600", "700"],
});

const sansEn = Inter({
  variable: "--font-sans-en",
  subsets: ["latin"],
});

const sansAr = IBM_Plex_Sans_Arabic({
  variable: "--font-sans-ar",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Restaurant QR Ordering",
  description: "Order from your table — no app, no login.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${displayEn.variable} ${displayAr.variable} ${sansEn.variable} ${sansAr.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-cream text-charcoal">
        {children}
      </body>
    </html>
  );
}
