// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

import { ModelCard } from '@/components/public/ModelCard'
import '../service.css'

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = await prisma.service.findFirst({
    where: { slug, isActive: true, isPublic: true },
    select: { publicName: true, title: true, name: true, seoTitle: true, seoDescription: true },
  })
  if (!service) return {}
  const displayName = service.publicName || service.title || service.name
  return {
    title: service.seoTitle || `${displayName} London`,
    description: service.seoDescription || `${displayName} companions in London. Verified, discreet. From £${siteConfig.priceFrom}/hr. ${siteConfig.name} companion agency.`,
    alternates: { canonical: `${siteConfig.domain}/services/${slug}` },
    openGraph: {
      title: service.seoTitle || `${displayName} London | Vaurel`,
      description: service.seoDescription || `${displayName} companions in London. Verified, discreet. From £${siteConfig.priceFrom}/hr.`,
      url: `${siteConfig.domain}/services/${slug}`,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: service.seoTitle || `${displayName} London | Vaurel`,
      description: service.seoDescription || `${displayName} companions in London. Verified, discreet.`,
    },
  }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const service = await prisma.service.findFirst({
    where: { slug, isActive: true, isPublic: true },
  })
  if (!service) notFound()

  const displayName = service.publicName || service.title || service.name

  const [modelServices, districts, related] = await Promise.all([
    prisma.modelService.findMany({
      where: { serviceId: service.id, isEnabled: true },
      select: { modelId: true },
    }),
    prisma.district.findMany({
      where: { isActive: true },
      select: { name: true, slug: true, tier: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.service.findMany({
      where: {
        isActive: true,
        isPublic: true,
        id: { not: service.id },
        category: service.category,
      },
      select: { slug: true, publicName: true, title: true, name: true, id: true },
      take: 4,
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // Fill related services from other categories if needed
  if (related.length < 6) {
    const others = await prisma.service.findMany({
      where: {
        isActive: true,
        isPublic: true,
        id: { notIn: [service.id, ...related.map(r => r.id)] },
      },
      select: { slug: true, publicName: true, title: true, name: true, id: true },
      take: 6 - related.length,
      orderBy: { isPopular: 'desc' },
    })
    related.push(...others)
  }

  const modelIds = modelServices.map(ms => ms.modelId)
  const models = modelIds.length > 0
    ? await prisma.model.findMany({
        where: { id: { in: modelIds }, status: 'active', deletedAt: null },
        include: {
          media: { where: { isPublic: true, isPrimary: true }, select: { url: true }, take: 1 },
          modelLocations: {
            where: { isPrimary: true },
            include: { district: { select: { name: true } } },
            take: 1,
          },
          modelRates: { where: { callType: 'incall' }, take: 1 },
        },
        take: 12,
      })
    : []

  const faqItems = [
    {
      q: `What is ${displayName}?`,
      a: service.introText || `${displayName} is a premium service offered by Vaurel companions in London. Each companion providing this service has been personally verified and selected for quality.`,
    },
    {
      q: `How much does ${displayName} cost in London?`,
      a: `Rates for ${displayName} with Vaurel start from £${siteConfig.priceFrom} per hour for incall appointments. Outcall to hotels and private addresses across London is also available. Prices vary by companion and duration — see individual profiles for exact rates.`,
    },
    {
      q: `How do I book ${displayName} with Vaurel?`,
      a: `Contact our team via WhatsApp or Telegram — we respond within 15 minutes, 24 hours a day. Simply let us know your preferred date, time, location and duration. All enquiries are handled with complete discretion.`,
    },
    {
      q: `Is ${displayName} available as outcall in London?`,
      a: `Yes. Many of our companions offering ${displayName} are available for outcall to hotels and private residences across all major London districts including Mayfair, Knightsbridge, Chelsea, Kensington and beyond.`,
    },
  ]

  const graphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: displayName,
        description: service.introText || service.fullDescription || `${displayName} with premium London companions.`,
        provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.domain },
        areaServed: { '@type': 'City', name: 'London' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteConfig.domain}/services` },
          { '@type': 'ListItem', position: 3, name: displayName, item: `${siteConfig.domain}/services/${slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: 8 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li><Link href="/services" style={{ color: '#6b6560', textDecoration: 'none' }}>Services</Link></li>
            <li style={{ color: '#4a4540' }}>/</li>
            <li aria-current="page" style={{ color: '#C5A572' }}>{displayName}</li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          <em style={{ fontStyle: 'italic', color: '#C5A572' }}>{displayName}</em> in London
        </h1>

        {/* About Section */}
        <div style={{ maxWidth: 680, margin: '0 0 64px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            About {displayName}
          </h2>

          {/* Intro text — highlighted block */}
          {service.introText && (
            <p style={{
              fontSize: 16,
              color: '#c5b99a',
              lineHeight: 1.8,
              margin: '0 0 24px',
              fontStyle: 'italic',
              borderLeft: '2px solid rgba(201,168,76,0.3)',
              paddingLeft: 16
            }}>
              {service.introText}
            </p>
          )}

          {/* Full description */}
          {service.fullDescription ? (
            service.fullDescription.split('\n\n').filter(Boolean).map((para: string, i: number) => (
              <p key={i} style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: '0 0 16px' }}>
                {para}
              </p>
            ))
          ) : (
            <>
              <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: '0 0 12px' }}>
                {displayName} is one of the most sought-after services among our London clientele.
                Our verified companions who offer {displayName} are selected for their professionalism,
                warmth, and ability to create a genuinely memorable experience. Whether you are visiting
                London for business or pleasure, this service is available for both incall and outcall
                appointments across all major districts.
              </p>
              <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
                Rates start from £{siteConfig.priceFrom} per hour. Our concierge team is available
                24/7 to arrange your booking with a guaranteed 30-minute response time.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Our Companions */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
            Our Companions
          </h2>
          <span style={{ fontSize: 11, color: '#4a4540', letterSpacing: '.15em' }}>{models.length} AVAILABLE</span>
        </div>
        {models.length > 0 ? (
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
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>No companions currently listed for {displayName}.</p>
            <Link href="/companions" className="svc-cta">Browse All Companions</Link>
          </div>
        )}
      </section>

      {/* Available Locations */}
      {districts.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Available Locations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {districts.map(d => (
              <Link key={d.slug} href={`/london/${d.slug}-escorts/`} className="svc-loc-link">
                {d.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Related Services */}
      {related.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Related Services
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {related.map(r => (
              <Link key={r.slug} href={`/services/${r.slug}`} className="svc-rel">
                <span style={{ fontSize: 14, color: '#ddd5c8' }}>{r.publicName || r.title || r.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 64 }}>
          {faqItems.map(f => (
            <div key={f.q}>
              <p className="svc-faq-q">{f.q}</p>
              <p className="svc-faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link href="/find-your-match" className="svc-cta">
          Find Your {displayName} Companion
        </Link>
      </section>

    </main>
  )
}
