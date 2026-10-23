import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NEXUS",
    template: "%s | NEXUS",
  },
  description: "Sistem inventaris barang per ruangan — 1 unit, 1 kode, 1 kebenaran",
  other: {
    "strix-verification": "strix-verify-edd7e07feecaddccbcc4910d34950093",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Terapkan tema dari localStorage sebelum cat pertama (anti FOUC). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
