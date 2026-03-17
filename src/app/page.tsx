// @ts-nocheck
export const revalidate = 3600

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'
import { siteConfig } from '@/../config/site'

export const metadata = {
  title: `${siteConfig.name} | ${siteConfig.tagline}`,
  description: "Virel is London's premier escort agency — discreet, sophisticated companion services across Mayfair, Kensington, Chelsea and beyond. Available 24/7.",
  alternates: { canonical: siteConfig.domain },
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: "Virel is London's premier escort agency — discreet, sophisticated companion services across Mayfair, Kensington, Chelsea and beyond. Available 24/7.",
    url: siteConfig.domain,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
  },
}

export default async function HomePage() {
  const [featuredModels, districts, services] = await Promise.all([
    prisma.model.findMany({
      where: { status: 'active', deletedAt: null },
      orderBy: [{ isExclusive: 'desc' }, { isVerified: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      include: {
        stats: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true, slug: true } } },
          take: 1,
        },
        modelRates: {
          take: 1,
        },
      },
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      take: 10,
      include: { _count: { select: { modelLocations: true } } },
    }),
    prisma.service.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ isPopular: 'desc' }, { sortOrder: 'asc' }],
      take: 4,
      select: { name: true, slug: true, publicName: true, description: true, category: true },
    }),
  ])

  // Also fetch min prices via raw SQL for models that might not have modelRates yet
  let minPrices: Record<string, number> = {}
  try {
    const modelIds = featuredModels.map((m: any) => m.id)
    if (modelIds.length > 0) {
      const rates: any[] = await prisma.$queryRaw`
        SELECT "modelId",
               MIN(LEAST(
                 COALESCE("incallPrice", 999999),
                 COALESCE("outcallPrice", 999999)
               )) as min_price
        FROM model_rates
        WHERE "modelId" = ANY(${modelIds}::text[])
          AND ("incallPrice" > 0 OR "outcallPrice" > 0)
        GROUP BY "modelId"
      `
      for (const r of rates) {
        minPrices[r.modelId] = Number(r.min_price)
      }
    }
  } catch {}

  const heroModel = featuredModels[0]
  const heroPhoto = heroModel?.media[0]?.url
  const allPrices = Object.values(minPrices)
  const globalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : siteConfig.priceFrom

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${siteConfig.domain}/#business`,
        name: siteConfig.name,
        description: siteConfig.tagline,
        url: siteConfig.domain,
        email: siteConfig.email,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'London',
          addressCountry: 'GB',
        },
        areaServed: { '@type': 'City', name: 'London' },
        priceRange: '£££',
        openingHours: 'Mo-Su 00:00-24:00',
        sameAs: [siteConfig.telegram],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.domain}/#website`,
        url: siteConfig.domain,
        name: siteConfig.name,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteConfig.domain}/companions?q={search_term_string}`,
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
              text: 'Contact us via Telegram or email. We respond within 30 minutes and will guide you through the booking process.',
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
              text: `Our companions start from £${siteConfig.priceFrom} per hour. Rates vary depending on the companion and type of booking.`,
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <div className="home-root">
        <Header />

        {/* 1. HERO */}
        <section className="hero-split">
          <div className="hero-photo">
            {heroPhoto
              ? <Image width={1200} height={800} src={heroPhoto} alt="Premium London companion" style={{ objectFit: 'cover', objectPosition: 'center 15%', width: '100%', height: '100%' }} sizes="60vw" priority={true} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)' }} />
            }
            <div className="hero-photo-overlay" />
          </div>
          <div className="hero-text">
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(42px, 5vw, 64px)',
              fontWeight: 300,
              lineHeight: 1.05,
              color: '#FAFAFA',
              margin: '0 0 20px',
            }}>
              London's Finest<br />Companions
            </h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#C5A572',
              margin: '0 0 40px',
            }}>
              From £{globalMinPrice.toLocaleString(siteConfig.lang)} per hour
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/companions" className="btn-primary">
                Browse Companions
              </Link>
              <Link href="/find-your-match" className="btn-secondary">
                Find Your Match
              </Link>
            </div>
          </div>
        </section>

        {/* 2. TRUST BAR */}
        <div className="trust-bar-desktop">
          <span>◆ Personally Verified</span>
          <span className="sep">·</span>
          <span>30-Minute Response</span>
          <span className="sep">·</span>
          <span>Complete Discretion</span>
          <span className="sep">·</span>
          <span>Est. 2024</span>
        </div>
        <div className="trust-bar-mobile">
          <span>Personally Verified</span>
          <span>30-Minute Response</span>
          <span>Complete Discretion</span>
          <span>Est. 2024</span>
        </div>

        {/* 3. FEATURED COMPANIONS */}
        {featuredModels.length > 0 && (
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
                  Available Now
                </span>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1.05,
                  color: '#FAFAFA',
                  margin: 0,
                }}>
                  Featured Companions
                </h2>
              </div>
              <Link href="/companions" style={{ fontSize: 11, letterSpacing: '.15em', color: '#808080', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #333', paddingBottom: 2, marginBottom: 8 }}>
                View All
              </Link>
            </div>

            <div className="featured-grid">
              {featuredModels.slice(0, 6).map((model: any) => {
                const photo = model.media[0]?.url
                const district = model.modelLocations?.[0]?.district?.name ?? model.primaryLocation?.title ?? null
                const incallPrice = model.modelRates?.[0]?.incallPrice
                  ? Number(model.modelRates[0].incallPrice)
                  : minPrices[model.id] ?? null

                return (
                  <ModelCard
                    key={model.id}
                    name={model.name}
                    slug={model.slug}
                    tagline={model.tagline}
                    coverPhotoUrl={photo}
                    availability={model.availability}
                    isVerified={model.isVerified}
                    isExclusive={model.isExclusive}
                    districtName={district}
                    minIncallPrice={incallPrice}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* 4. SMART MATCH */}
        <section className="smart-match">
          <p style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: '#808080', marginBottom: 16 }}>
            Personalized
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#FAFAFA',
            margin: '0 0 16px',
          }}>
            Not sure where to start?
          </h2>
          <p style={{ fontSize: 14, color: '#808080', margin: '0 0 36px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Answer 5 quick questions and we'll find your perfect companion.
          </p>
          <Link href="/find-your-match" className="btn-primary">
            Find Your Match
          </Link>
        </section>

        {/* 5. SERVICES PREVIEW */}
        {services.length > 0 && (
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
                  Experiences
                </span>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: '#FAFAFA',
                  margin: 0,
                }}>
                  Our Services
                </h2>
              </div>
              <Link href="/services" style={{ fontSize: 11, letterSpacing: '.15em', color: '#808080', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #333', paddingBottom: 2, marginBottom: 8 }}>
                View All
              </Link>
            </div>
            <div className="services-grid">
              {services.map((svc: any) => {
                const serviceLabel = svc.slug.split('-').map((w: string) => w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                return (
                <Link key={svc.slug} href={`/services/${svc.slug}`} className="svc-card">
                  <h3 className="svc-card-title">{serviceLabel}</h3>
                  {svc.description && <p className="svc-card-desc">{svc.description}</p>}
                </Link>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Link href="/categories" style={{ fontSize: 12, letterSpacing: '.15em', color: '#c9a84c', textDecoration: 'none', textTransform: 'uppercase', transition: 'color .2s' }}>
                Browse all categories →
              </Link>
            </div>
          </div>
        )}

        {/* 6. LONDON DISTRICTS */}
        {districts.length > 0 && (
          <div className="section">
            <span style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
              Locations
            </span>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#FAFAFA',
              margin: 0,
            }}>
              London Districts
            </h2>
            <div className="districts-grid">
              {districts.map((d: any) => (
                <Link key={d.id} href={`/london/${d.slug}-escorts/`} className="dist-card">
                  <p className="dist-name">{d.name}</p>
                  {d._count.modelLocations > 0 && (
                    <p className="dist-count">{d._count.modelLocations} companion{d._count.modelLocations !== 1 ? 's' : ''}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 7. SOCIAL PROOF */}
        <section className="social-proof">
          <p style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: '#808080', marginBottom: 24 }}>
            Trusted Agency
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(20px, 3vw, 28px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 560,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            "Professional, discreet, and exactly as described. The finest companion service in London."
          </p>
          <p style={{ marginTop: 16, fontSize: 13, color: '#606060' }}>
            — Verified Client, Mayfair
          </p>
        </section>

        {/* 8. WHY CHOOSE VIREL */}
        <div className="section">
          <span style={{ fontSize: 10, letterSpacing: '.25em', color: '#808080', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
            About Us
          </span>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#FAFAFA',
            margin: '0 0 32px',
          }}>
            Why Choose Virel
          </h2>
          <div style={{ maxWidth: 720, margin: '0 auto', fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, letterSpacing: '.01em' }}>
            <p style={{ marginBottom: 20 }}>
              Virel is a premier London escort agency built on discretion, trust, and an uncompromising
              standard of quality. Every companion on our roster is personally verified — we meet each
              individual, confirm their identity, and ensure their portfolio is authentic before they
              ever appear on the site.
            </p>
            <p style={{ marginBottom: 20 }}>
              As a discreet companion service in London, we cater to professionals, travellers, and
              discerning gentlemen who value privacy above all else. Whether you are looking for an
              elegant dinner date in Mayfair, a cultured evening in Kensington, or a relaxed encounter
              in Chelsea, our VIP companions deliver an experience that is both refined and effortless.
            </p>
            <p>
              What sets us apart is the personal touch. Our dedicated booking team responds within
              thirty minutes, matches you with the ideal elite companion based on your preferences,
              and handles every detail so you can focus on enjoying the moment. Professional,
              confidential, and available around the clock — that is the Virel standard.
            </p>
          </div>
        </div>

        {/* 9. FINAL CTA */}
        <section className="final-cta">
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#FAFAFA',
            margin: '0 0 16px',
          }}>
            Ready to make an arrangement?
          </h2>
          <p style={{ fontSize: 14, color: '#808080', margin: '0 0 36px' }}>
            Response within 30 minutes, guaranteed
          </p>
          <div className="final-cta-buttons">
            <Link href="/companions" className="btn-primary">
              Browse Companions
            </Link>
            <a href={siteConfig.telegram} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Message on Telegram
            </a>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
