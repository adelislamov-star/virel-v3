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
    canonical: 'https://virel.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://virel.com',
    siteName: 'Virel',
    title: 'Virel – Premium Companion Services in London',
    description: 'Exclusive premium companion services in London',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Virel',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
