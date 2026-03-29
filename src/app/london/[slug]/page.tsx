// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

import { ModelCard } from '@/components/public/ModelCard'
import { RichText } from '@/components/public/RichText'
// districtContent now stored directly on District model in DB
import '../district.css'
import { DISTRICTS } from '@/data/districts'

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  return DISTRICTS.map(d => ({ slug: `${d.slug}-escorts` }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const districtSlug = slug.replace(/-escorts$/, '')
  const district = await prisma.district.findUnique({
    where: { slug: districtSlug },
    select: { name: true, seoTitle: true, seoDescription: true },
  })
  if (!district) return {}

  const pageTitle = `${district.name} Escorts London | Vaurel`
  const pageDesc = district.seoDescription || `Premium companions available in ${district.name}, London. Verified, discreet, and elegant.`
  const pageUrl = `${siteConfig.domain}/london/${slug}`

  return {
    title: `${district.name} Escorts London`,
    description: pageDesc,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: pageUrl,
      type: 'website',
      siteName: 'Vaurel',
      images: [{
        url: `${siteConfig.domain}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: `${district.name} Escorts London — Vaurel`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [`${siteConfig.domain}/og-default.jpg`],
    },
  }
}

export default async function DistrictPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const districtSlug = slug.replace(/-escorts$/, '')

  const [district, models, nearbyDistricts] = await Promise.all([
    prisma.district.findUnique({
      where: { slug: districtSlug, isActive: true },
    }),
    prisma.model.findMany({
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
      take: 20,
    }),
    prisma.district.findMany({
      where: { isActive: true, slug: { not: districtSlug } },
      select: { name: true, slug: true, tier: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    }),
  ])

  if (!district) notFound()

  const minPrice = models.reduce((min, m) => {
    const p = m.modelRates?.[0]?.price ? Number(m.modelRates[0].price) : null
    return p && (min === 0 || p < min) ? p : min
  }, 0)

  // FAQ — custom or generic
  const faqItems = (district.faq as { q: string; a: string }[] | undefined)?.length ? (district.faq as { q: string; a: string }[]) : [
    {
      q: `Are companions available in ${district.name} tonight?`,
      a: `Yes, we have ${models.length} companion${models.length !== 1 ? 's' : ''} available in ${district.name}. Check individual profiles for real-time availability or contact our team for same-day bookings.`,
    },
    {
      q: `What is the typical rate in ${district.name}?`,
      a: minPrice > 0
        ? `Rates in ${district.name} typically start from £${minPrice} per hour. Prices vary based on the companion, duration, and type of booking.`
        : `Please check individual companion profiles for current rates in ${district.name}. Contact our team for personalised quotes.`,
    },
    {
      q: `Do you offer outcall in ${district.name}?`,
      a: `Yes, many of our companions offer outcall services to hotels and private residences in ${district.name}. Outcall rates may differ from incall — check each companion's profile for details.`,
    },
  ]

  // Strip HTML tags for schema.org plain text
  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '')

  const graphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: `${siteConfig.name} — ${district.name}`,
        description: district.description || `Premium companions in ${district.name}, London.`,
        address: { '@type': 'PostalAddress', addressLocality: district.name, addressRegion: 'London', addressCountry: 'GB' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
          { '@type': 'ListItem', position: 2, name: 'London Escorts', item: `${siteConfig.domain}/london-escorts` },
          { '@type': 'ListItem', position: 3, name: `${district.name} Escorts`, item: `${siteConfig.domain}/london/${slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) },
        })),
      },
    ],
  }

  const pStyle = { fontSize: 15, color: '#8a8580', lineHeight: 1.9 as const, margin: '0 0 12px' as const }
  const dividerStyle = { height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }
  const h2Style = { fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }} />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol className="bc-list" style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li><Link href="/london-escorts" style={{ color: '#6b6560', textDecoration: 'none' }}>London Escorts</Link></li>
            <li aria-current="page" style={{ color: '#C5A572' }}>{district.name} Escorts</li>
          </ol>
        </nav>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.1, margin: '0 0 24px' }}>
          <em style={{ fontStyle: 'italic', color: '#C5A572' }}>{district.name}</em> Escorts London
        </h1>

        {/* About Section */}
        <div style={{ maxWidth: 680, margin: '0 0 64px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            About {district.name}
          </h2>
          {district.aboutParagraphs?.length > 0 ? (
            district.aboutParagraphs.map((p, i) => (
              <p key={i} style={{ ...pStyle, margin: i === district.aboutParagraphs.length - 1 ? '0' : '0 0 12px' }}>{p}</p>
            ))
          ) : (
            <>
              <p style={pStyle}>
                {district.name} is one of London&apos;s most prestigious districts, known for its luxury hotels,
                fine dining and exclusive atmosphere. Our verified companions in {district.name} are available
                for both incall and outcall appointments, offering a discreet and sophisticated experience
                from £{siteConfig.priceFrom} per hour.
              </p>
              <p style={{ ...pStyle, margin: 0 }}>
                Whether you are staying at one of the many five-star hotels in {district.name} or
                visiting for business, Vaurel companions are available 24/7 with a guaranteed
                30-minute response time.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Models */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
            Our Companions in {district.name}
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
            <p style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>No companions currently listed in {district.name}.</p>
            <Link href="/companions" className="dist-cta">Browse Our Full Catalogue</Link>
          </div>
        )}
      </section>

      {/* Standard Text — data-driven with RichText for link parsing */}
      {district.standardTextParagraphs?.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={dividerStyle} />
          <div style={{ maxWidth: 680 }}>
            <h2 style={h2Style}>The Vaurel Standard</h2>
            {district.standardTextParagraphs.map((p, i) => (
              <p key={i} style={{ ...pStyle, margin: i === district.standardTextParagraphs.length - 1 ? '0' : '0 0 12px' }}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Popular Categories */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={dividerStyle} />
        <h2 style={h2Style}>Popular Categories in {district.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'Blonde Escorts', slug: 'blonde' },
            { name: 'Brunette Escorts', slug: 'brunette' },
            { name: 'Russian Escorts', slug: 'russian' },
            { name: 'GFE Escorts', slug: 'gfe' },
            { name: 'Busty Escorts', slug: 'busty' },
            { name: 'Mature Escorts', slug: 'mature' },
            { name: 'VIP Escorts', slug: 'vip' },
            { name: 'Dinner Date Escorts', slug: 'dinner-date' },
          ].map(cat => (
            <Link key={cat.slug} href={`/categories/${cat.slug}/`} className="dist-link">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Hotels & Restaurants */}
      {(district.hotels?.length > 0 || district.restaurants?.length > 0) && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={dividerStyle} />
          <h2 style={h2Style}>Fine Dining & Hotels</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {district.hotels?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', color: '#C5A572', margin: '0 0 12px', fontWeight: 400 }}>Hotels</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {district.hotels.map((h: string) => <span key={h} className="dist-tag">{h}</span>)}
                </div>
              </div>
            )}
            {district.restaurants?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, letterSpacing: '.15em', textTransform: 'uppercase', color: '#C5A572', margin: '0 0 12px', fontWeight: 400 }}>Restaurants</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {district.restaurants.map((r: string) => <span key={r} className="dist-tag">{r}</span>)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nearby Areas */}
      {(district.nearbyText || nearbyDistricts.length > 0) && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={dividerStyle} />
          <h2 style={h2Style}>Nearby Areas</h2>
          {district.nearbyText ? (
            <div style={{ maxWidth: 680 }}>
              <p style={{ ...pStyle, margin: 0 }}><RichText text={district.nearbyText} /></p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {nearbyDistricts.map(d => (
                <Link key={d.slug} href={`/london/${d.slug}-escorts/`} className="dist-link">
                  {d.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FAQ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={dividerStyle} />
        <h2 style={{ ...h2Style, margin: '0 0 32px' }}>FAQ</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {faqItems.map((f, i) => (
            <div key={i}>
              <p className="faq-q">{f.q}</p>
              <p className="faq-a"><RichText text={f.a} /></p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        {district.ctaText && (
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            {district.ctaText}
          </p>
        )}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/companions" className="dist-cta">Browse Companions</Link>
          <a
            href={siteConfig.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="dist-cta"
            style={{ background: 'transparent', border: '1px solid #C5A572', color: '#C5A572' }}
          >
            Message on Telegram
          </a>
        </div>
      </section>

    </main>
  )
}
