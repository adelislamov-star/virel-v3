// @ts-nocheck
export const revalidate = 3600

import type { Metadata } from 'next'
import { prisma } from '@/lib/db/client'
import { HeroSection } from '@/components/home/HeroSection'
import { TrustStrip } from '@/components/home/TrustStrip'
import { GallerySection } from '@/components/home/GallerySection'
import { TrustSignals } from '@/components/home/TrustSignals'
import { AboutSection } from '@/components/home/AboutSection'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { DistrictsSection } from '@/components/home/DistrictsSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { CtaSection } from '@/components/home/CtaSection'

export const metadata: Metadata = {
  title: 'London Escort Agency — Private Companion Services | Vaurel',
  description: 'Vaurel is a private companion agency in London. Personally verified companions available in Mayfair, Knightsbridge, Chelsea and Kensington. Discreet, effortless.',
  alternates: {
    canonical: 'https://vaurel.co.uk/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: 'https://vaurel.co.uk/',
    title: 'London Escort Agency — Private Companion Services | Vaurel',
    description: 'A private companion agency in London. Personally verified, discreet, effortless.',
    images: [{ url: 'https://vaurel.co.uk/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_GB',
    siteName: 'Vaurel',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://vaurel.co.uk/#business',
      name: 'Vaurel',
      description: 'Private companion agency in London.',
      url: 'https://vaurel.co.uk',
      email: 'bookings@vaurel.co.uk',
      address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
      areaServed: { '@type': 'City', name: 'London' },
      priceRange: '£££',
      openingHours: 'Mo-Su 00:00-24:00',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://vaurel.co.uk/#website',
      url: 'https://vaurel.co.uk',
      name: 'Vaurel',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://vaurel.co.uk/companions?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I book a companion in London?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Contact us via Telegram or email. We respond within 15 minutes and will guide you through the booking process.',
          },
        },
        {
          '@type': 'Question',
          name: 'What areas of London do you cover?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We cover all areas of London including Mayfair, Knightsbridge, Chelsea, Kensington, Belgravia and more. Outcall available across London.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are your rates?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our companions start from £250 per hour. Rates vary depending on the companion and type of booking.',
          },
        },
      ],
    },
  ],
}

export default async function HomePage() {
  const [featuredModels, services] = await Promise.all([
    prisma.model.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        media: { some: { isPrimary: true, isPublic: true } },
        slug: { notIn: ['vicky'] },
      },
      orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
      take: 8,
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1, select: { url: true } },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true } } },
          take: 1,
        },
      },
    }),
    prisma.service.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }],
      take: 6,
      select: { slug: true, title: true, publicName: true, description: true },
    }),
  ])

  // Fallback districts matching the approved mockup, used when DB has no district set
  const DISTRICT_FALLBACK: Record<string, string> = {
    marsalina: 'Earls Court',
    marzena: 'Knightsbridge',
    angelina: 'Kensington',
    comely: 'Mayfair',
    veruca: 'Chelsea',
    burana: 'Belgravia',
    vicky: 'Notting Hill',
    watari: 'Marylebone',
  }

  const companions = featuredModels
    .filter((m: any) => m.media[0]?.url)
    .slice(0, 6)
    .map((m: any) => ({
      slug: m.slug,
      name: m.name,
      tagline: m.tagline ?? null,
      photoUrl: m.media[0].url,
      district: m.modelLocations?.[0]?.district?.name ?? DISTRICT_FALLBACK[m.slug] ?? null,
    }))

  const heroPhotoUrl = companions[0]?.photoUrl ?? null
  const aboutPhotoUrl = companions[1]?.photoUrl ?? null

  const categories = services.map((s: any) => ({
    slug: s.slug,
    name: s.publicName || s.title,
    description: s.description,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ background: '#0C0B09', fontFamily: "'DM Sans','Helvetica Neue',sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
        <HeroSection heroPhotoUrl={heroPhotoUrl} />
        <TrustStrip />
        <GallerySection companions={companions} />
        <div className="rule" />
        <TrustSignals />
        <AboutSection photoUrl={aboutPhotoUrl} />
        <div className="rule" />
        <CategoriesSection categories={categories} />
        <DistrictsSection />
        <div className="rule" />
        <HowItWorks />
        <CtaSection />
      </div>
    </>
  )
}
