// @ts-nocheck
export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'London Escorts — Premier Companion Agency',
  description: 'London escorts agency — verified, discreet, sophisticated. Available across all London districts. From £250/hr. Response within 30 minutes.',
  alternates: { canonical: `${siteConfig.domain}/london-escorts` },
  openGraph: {
    title: 'London Escorts — Premier Companion Agency | Vaurel',
    description: 'London escorts agency — verified, discreet, sophisticated. Available across all London districts. From £250/hr. Response within 30 minutes.',
    url: `${siteConfig.domain}/london-escorts`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [{ url: `${siteConfig.domain}/opengraph-image.png`, width: 1200, height: 630 }],
  },
}

export default async function LondonEscortsPage() {
  const [models, districts] = await Promise.all([
    prisma.model.findMany({
      where: { status: 'active', deletedAt: null },
      include: {
        media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true } } },
          take: 1,
        },
        modelRates: { take: 1 },
      },
      orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      select: { name: true, slug: true },
      take: 12,
    }),
  ])

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'London Escorts' }]} />
      <Header />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <nav aria-label="breadcrumb" style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 40 }}>
          <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
          <span style={{ margin: '0 12px' }}>—</span>
          <span style={{ color: '#c9a84c' }}>LONDON ESCORTS</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          London <em style={{ fontStyle: 'italic', color: '#C5A572' }}>Escorts</em>
        </h1>

        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680, margin: '0 0 48px' }}>
          Vaurel is London's premier escort agency — verified, discreet, sophisticated.
          Browse our companions available across Mayfair, Kensington, Chelsea, Belgravia and beyond.
          All profiles personally verified. From £{siteConfig.priceFrom}/hr.
        </p>
      </section>

      {/* Districts */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 48px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', marginBottom: 16 }}>
          Browse by district
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {districts.map(d => (
            <Link
              key={d.slug}
              href={`/london/${d.slug}-escorts`}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                color: '#6b6560',
                border: '1px solid rgba(255,255,255,0.07)',
                textDecoration: 'none',
                transition: 'all .2s',
              }}
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Companions grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <p style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', marginBottom: 24 }}>
          {models.length} companion{models.length !== 1 ? 's' : ''} available
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {models.map((model: any) => (
            <ModelCard
              key={model.id}
              name={model.name}
              slug={model.slug}
              tagline={model.tagline}
              coverPhotoUrl={model.media[0]?.url ?? null}
              availability={model.availability}
              isVerified={model.isVerified}
              isExclusive={model.isExclusive}
              districtName={model.modelLocations?.[0]?.district?.name ?? null}
              minIncallPrice={model.modelRates?.[0]?.incallPrice ? Number(model.modelRates[0].incallPrice) : null}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link
            href="/companions"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              fontSize: 11,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: '#ddd5c8',
              border: '1px solid rgba(197,165,114,0.4)',
              textDecoration: 'none',
            }}
          >
            View All Companions
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
