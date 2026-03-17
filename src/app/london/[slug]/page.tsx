// @ts-nocheck
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'

export const revalidate = 3600

export async function generateStaticParams() {
  const districts = await prisma.district.findMany({
    where: { isActive: true },
    select: { slug: true },
  })
  return districts.map(d => ({ slug: `${d.slug}-escorts` }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const districtSlug = slug.replace(/-escorts$/, '')
  const district = await prisma.district.findUnique({
    where: { slug: districtSlug },
    select: { name: true, seoTitle: true, seoDescription: true },
  })
  if (!district) return {}
  return {
    title: `${district.name} Escorts London`,
    description: district.seoDescription || `Premium companions available in ${district.name}, London. Verified, discreet, and elegant.`,
    alternates: { canonical: `${siteConfig.domain}/london/${slug}/` },
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
    const p = m.modelRates?.[0]?.incallPrice
    return p && (min === 0 || p < min) ? p : min
  }, 0)

  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${siteConfig.name} — ${district.name}`,
    description: district.description || `Premium companions in ${district.name}, London.`,
    address: { '@type': 'PostalAddress', addressLocality: district.name, addressRegion: 'London', addressCountry: 'GB' },
  }
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
      { '@type': 'ListItem', position: 2, name: 'London Escorts', item: `${siteConfig.domain}/london-escorts` },
      { '@type': 'ListItem', position: 3, name: `${district.name} Escorts`, item: `${siteConfig.domain}/london/${slug}/` },
    ],
  }

  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`
        .dist-link { display:block; padding:16px 20px; border:1px solid rgba(255,255,255,0.07); text-decoration:none; color:#ddd5c8; font-size:14px; transition:border-color .25s; }
        .dist-link:hover { border-color:rgba(197,165,114,0.4); }
        .dist-cta { display:inline-block; padding:16px 40px; background:#C5A572; color:#0A0A0A; font-size:11px; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:background .25s; font-family:inherit; }
        .dist-cta:hover { background:#d4b87a; }
        .dist-tag { display:inline-block; padding:6px 16px; border:1px solid rgba(255,255,255,0.06); font-size:12px; color:#6b6560; }
        .faq-q { font-size:15px; color:#f0e8dc; font-weight:400; margin:0 0 8px; }
        .faq-a { font-size:14px; color:#6b6560; line-height:1.8; margin:0; }
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Header />

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" style={{ fontSize: 12, color: '#4a4540', marginBottom: 32 }}>
          <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: 0, margin: 0, padding: 0 }}>
            <li><Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>Home</Link></li>
            <li><span style={{ margin: '0 8px' }}>/</span></li>
            <li><Link href="/london-escorts" style={{ color: '#6b6560', textDecoration: 'none' }}>London Escorts</Link></li>
            <li><span style={{ margin: '0 8px' }}>/</span></li>
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
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: '0 0 12px' }}>
            {district.name} is one of London&apos;s most prestigious districts, known for its luxury hotels,
            fine dining and exclusive atmosphere. Our verified companions in {district.name} are available
            for both incall and outcall appointments, offering a discreet and sophisticated experience
            from £{siteConfig.priceFrom} per hour.
          </p>
          <p style={{ fontSize: 15, color: '#8a8580', lineHeight: 1.9, margin: 0 }}>
            Whether you are staying at one of the many five-star hotels in {district.name} or
            visiting for business, Virel companions are available 24/7 with a guaranteed
            30-minute response time.
          </p>
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
                minIncallPrice={m.modelRates?.[0]?.incallPrice}
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


      {/* Popular Categories */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
          Popular Categories in {district.name}
        </h2>
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
      {((district.hotels && district.hotels.length > 0) || (district.restaurants && district.restaurants.length > 0)) && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Fine Dining & Hotels
          </h2>
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
      {nearbyDistricts.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 24px' }}>
            Nearby Areas
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {nearbyDistricts.map(d => (
              <Link key={d.slug} href={`/london/${d.slug}-escorts/`} className="dist-link">
                {d.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)', marginBottom: 48 }} />
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0e8dc', margin: '0 0 32px' }}>
          FAQ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p className="faq-q">Are companions available in {district.name} tonight?</p>
            <p className="faq-a">
              Yes, we have {models.length} companion{models.length !== 1 ? 's' : ''} available in {district.name}.
              Check individual profiles for real-time availability or contact our team for same-day bookings.
            </p>
          </div>
          <div>
            <p className="faq-q">What is the typical rate in {district.name}?</p>
            <p className="faq-a">
              {minPrice > 0
                ? `Rates in ${district.name} typically start from £${minPrice} per hour. Prices vary based on the companion, duration, and type of booking.`
                : `Please check individual companion profiles for current rates in ${district.name}. Contact our team for personalised quotes.`}
            </p>
          </div>
          <div>
            <p className="faq-q">Do you offer outcall in {district.name}?</p>
            <p className="faq-a">
              Yes, many of our companions offer outcall services to hotels and private residences in {district.name}.
              Outcall rates may differ from incall — check each companion&apos;s profile for details.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px', textAlign: 'center' }}>
        <Link href={`/book?district=${district.id}`} className="dist-cta">
          Book a Companion in {district.name}
        </Link>
      </section>

      <Footer />
    </main>
  )
}
