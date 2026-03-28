// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import './station.css'

import { ModelCard } from '@/components/public/ModelCard'

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; station: string }> }): Promise<Metadata> {
  const { slug, station } = await params
  const hubSlug = station.replace(/-station$/, '')
  const hub = await prisma.transportHub.findFirst({
    where: { slug: hubSlug, isActive: true },
    select: { name: true, description: true, seoTitle: true, seoDescription: true },
  })
  if (!hub) return {}
  const wordCount = hub.description?.split(' ').length ?? 0
  return {
    title: hub.seoTitle || `Companions near ${hub.name} Station`,
    description: hub.seoDescription || `Find premium companions near ${hub.name} Station in London. Verified escorts available for incall and outcall.`,
    alternates: { canonical: `${siteConfig.domain}/london/${slug}/${station}` },
    robots: { index: false, follow: false },
  }
}

export default async function TransportHubPage({ params }: { params: Promise<{ slug: string; station: string }> }) {
  const { slug, station } = await params
  const districtSlug = slug.replace(/-escorts$/, '')
  const hubSlug = station.replace(/-station$/, '')

  const hub = await prisma.transportHub.findFirst({
    where: { slug: hubSlug, isActive: true },
    include: { district: true },
  })
  if (!hub) notFound()

  // Models in the parent district
  const models = await prisma.model.findMany({
    where: {
      status: 'active',
      deletedAt: null,
      modelLocations: { some: { district: { slug: districtSlug } } },
    },
    include: {
      media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
      modelLocations: {
        where: { isPrimary: true },
        include: { district: { select: { name: true } } },
        take: 1,
      },
      modelRates: {
        where: { callType: 'incall' },
        take: 1,
      },
    },
    take: 12,
  })

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
      { '@type': 'ListItem', position: 2, name: hub.district.name, item: `${siteConfig.domain}/london/${slug}/` },
      { '@type': 'ListItem', position: 3, name: `${hub.name} Station` },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href={`/london/${slug}/`} style={{ color: '#6b6560', textDecoration: 'none' }}>{hub.district.name}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#C5A572' }}>{hub.name} Station</span>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          Companions near <em style={{ fontStyle: 'italic', color: '#C5A572' }}>{hub.name} Station</em>, London
        </h1>

        {hub.description && (
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, maxWidth: 680, margin: '0 0 64px' }}>
            {hub.description}
          </p>
        )}
      </section>

      {/* Models */}
      {models.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
              Companions in the Area
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {models.map((m: any) => (
              <ModelCard
                key={m.id}
                name={m.name}
                slug={m.slug}
                tagline={m.tagline}
                coverPhotoUrl={m.media?.[0]?.url || null}
                availability={m.availability}
                isVerified={m.isVerified}
                isExclusive={m.isExclusive}
                districtName={m.modelLocations?.[0]?.district?.name}
                minIncallPrice={m.modelRates?.[0]?.price ? Number(m.modelRates[0].price) : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Getting Here */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
          Getting Here
        </h2>
        <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: '0 0 32px' }}>
          {hub.walkingMinutes
            ? `${hub.walkingMinutes} minutes walk from ${hub.district.name} centre.`
            : `Conveniently located in ${hub.district.name}.`}
        </p>
        <Link href={`/london/${slug}/`} className="hub-cta">
          Explore All Companions in {hub.district.name}
        </Link>
      </section>

    </main>
  )
}
