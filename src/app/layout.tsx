import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  verification: {
    google: 'MUip6cu8OH4oOYyaZKJIo5xoPElQToe0wMp-1J3JcAA',
  },
  title: 'Virel – Premium Companion Services in London',
  description: 'Exclusive premium companion services in London. Discreet, professional, and elegant experiences with verified companions.',
  keywords: ['london', 'premium', 'companion', 'services', 'luxury'],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://virel-v3.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://virel-v3.vercel.app',
    siteName: 'Virel',
    title: 'Virel – Premium Companion Services in London',
    description: 'Exclusive premium companion services in London',
    images: [
      {
        url: 'https://virel-v3.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Virel — Elite London Escorts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virel – Premium Companion Services in London',
    description: 'Elite verified companions in London. Incall & outcall. Discreet.',
    images: ['https://virel-v3.vercel.app/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Virel',
    url: 'https://virel-v3.vercel.app',
    logo: 'https://virel-v3.vercel.app/logo.png',
    description: 'Premium escort agency in London. Verified, sophisticated companions for incall and outcall.',
    areaServed: { '@type': 'City', name: 'London', containedInPlace: { '@type': 'Country', name: 'United Kingdom' } },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'English' },
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
