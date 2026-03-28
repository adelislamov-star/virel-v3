import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CookieBanner } from '@/components/public/CookieBanner'
import { Navbar } from '@/components/layout/Navbar'
import { FooterNew } from '@/components/layout/FooterNew'
import { FloatingContacts } from '@/components/layout/FloatingContacts'
import { BookingModalProvider } from '@/components/public/BookingModalProvider'
import { siteConfig } from '@/../config/site'
import '../styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const BASE_URL = siteConfig.domain

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: 'MUip6cu8OH4oOYyaZKJIo5xoPElQToe0wMp-1J3JcAA',
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Vaurel is London's premier escort agency — discreet, sophisticated companion services across Mayfair, Kensington, Chelsea and beyond. Available 24/7.",
  keywords: ['london escorts', 'escort agency london', 'premium companions london', 'vaurel'],
  robots: { index: true, follow: true },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: BASE_URL,
    siteName: siteConfig.name,
    title: `${siteConfig.name} – Premium Companion Services in London`,
    description: "Vaurel is London's premier escort agency — discreet, sophisticated companion services across Mayfair, Kensington, Chelsea and beyond. Available 24/7.",
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vaurel_london',
    title: `${siteConfig.name} – Premium Companion Services in London`,
    description: "Vaurel is London's premier escort agency — discreet, sophisticated companion services across Mayfair, Kensington, Chelsea and beyond. Available 24/7.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteConfig.lang} className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev" />
        <link rel="dns-prefetch" href="https://pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev" />
      </head>
      <body>
        <BookingModalProvider>
          <Navbar />
          {children}
          <FooterNew />
          <FloatingContacts />
          <CookieBanner />
        </BookingModalProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
