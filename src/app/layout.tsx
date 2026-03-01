import type { Metadata } from 'next'
import '../styles/globals.css'

const BASE_URL = 'https://virel-v3.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: 'MUip6cu8OH4oOYyaZKJIo5xoPElQToe0wMp-1J3JcAA',
  },
  title: {
    default: 'Virel – Premium Companion Services in London',
    template: '%s | Virel London',
  },
  description: 'Exclusive premium companion services in London. Discreet, professional, and elegant experiences with verified companions.',
  keywords: ['london escorts', 'escort agency london', 'premium companions london', 'virel'],
  robots: { index: true, follow: true },
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: BASE_URL,
    siteName: 'Virel',
    title: 'Virel – Premium Companion Services in London',
    description: 'Exclusive premium companion services in London. Discreet, professional and elegant.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virel – Premium Companion Services in London',
    description: 'Elite verified companions in London. Incall & outcall. Discreet.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Virel',
    url: BASE_URL,
    description: 'Premium escort agency in London. Verified, sophisticated companions for incall and outcall.',
    areaServed: { '@type': 'City', name: 'London', containedInPlace: { '@type': 'Country', name: 'United Kingdom' } },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'English' },
  }

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
