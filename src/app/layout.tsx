import type { Metadata, Viewport } from "next";
import { Inter, Geist, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chunkjournal.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ChunkJournal",
  description: "A collection of the worlds I've explored, the places I've built, and the memories I've made with the people I've met along the way.",
  openGraph: {
    title: "ChunkJournal",
    description: "A collection of the worlds I've explored, the places I've built, and the memories I've made with the people I've met along the way.",
    siteName: "ChunkJournal",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChunkJournal",
    description: "A collection of the worlds I've explored, the places I've built, and the memories I've made with the people I've met along the way.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        {children}
      </body>
    </html>
  );
}
