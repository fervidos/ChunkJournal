import type { Metadata, Viewport } from "next"
import { Inter, Geist, IBM_Plex_Sans } from "next/font/google"
import NavBar from "@/components/NavBar"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex",
})

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
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChunkJournal",
    description: "A collection of the worlds I've explored, the places I've built, and the memories I've made with the people I've met along the way.",
    images: ['/og-default.png'],
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${ibmPlexSans.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <NavBar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}
