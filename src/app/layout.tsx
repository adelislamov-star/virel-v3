import type { Metadata } from 'next'
import '../styles/globals.css'
import { CookieBanner } from '@/components/public/CookieBanner'
import { siteConfig } from '@/../config/site'

const BASE_URL = siteConfig.domain

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: 'MUip6cu8OH4oOYyaZKJIo5xoPElQToe0wMp-1J3JcAA',
  },
  title: {
    default: `${siteConfig.name} – Premium Companion Services in London`,
    template: `%s | ${siteConfig.name} London`,
  },
  description: 'Exclusive premium companion services in London. Discreet, professional, and elegant experiences with verified companions.',
  keywords: ['london escorts', 'escort agency london', 'premium companions london', 'virel'],
  robots: { index: true, follow: true },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: BASE_URL,
    siteName: siteConfig.name,
    title: `${siteConfig.name} – Premium Companion Services in London`,
    description: 'Exclusive premium companion services in London. Discreet, professional and elegant.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} – Premium Companion Services in London`,
    description: 'Elite verified companions in London. Incall & outcall. Discreet.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: BASE_URL,
    description: 'Premium escort agency in London. Verified, sophisticated companions for incall and outcall.',
    areaServed: { '@type': 'City', name: 'London', containedInPlace: { '@type': 'Country', name: 'United Kingdom' } },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'English' },
  }

  return (
    <html lang={siteConfig.lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
