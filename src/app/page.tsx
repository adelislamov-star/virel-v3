// @ts-nocheck
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'

export const metadata = {
  title: "Virel | London's Premier Companion Agency",
  description: "Discover London's most exclusive companions. Sophisticated, discreet, memorable.",
  alternates: { canonical: 'https://virel-v3.vercel.app' },
  openGraph: {
    title: "Virel | London's Premier Companion Agency",
    description: "Discover London's most exclusive companions. Sophisticated, discreet, memorable.",
    url: 'https://virel-v3.vercel.app',
    siteName: 'Virel',
    locale: 'en_GB',
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
          where: { price: { gt: 0 } },
          orderBy: { price: 'asc' },
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
        SELECT model_id, MIN(price) as min_price
        FROM model_rates
        WHERE model_id = ANY(${modelIds}::text[])
          AND is_active = true
          AND price > 0
        GROUP BY model_id
      `
      for (const r of rates) {
        minPrices[r.model_id] = Number(r.min_price)
      }
    }
  } catch {}

  const heroModel = featuredModels[0]
  const heroPhoto = heroModel?.media[0]?.url
  const allPrices = Object.values(minPrices)
  const globalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 300

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://virel-v3.vercel.app/#organization',
        name: 'Virel',
        url: 'https://virel-v3.vercel.app',
        description: "London's premier companion agency",
        areaServed: { '@type': 'City', name: 'London' },
      },
      {
        '@type': 'LocalBusiness',
        '@id': 'https://virel-v3.vercel.app/#business',
        name: 'Virel',
        description: "London's premier companion agency",
        url: 'https://virel-v3.vercel.app',
        areaServed: { '@type': 'City', name: 'London' },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://virel-v3.vercel.app/#website',
        url: 'https://virel-v3.vercel.app',
        name: 'Virel',
        publisher: { '@id': 'https://virel-v3.vercel.app/#organization' },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .home-root { font-family: 'DM Sans', sans-serif; background: #0A0A0A; color: #ddd5c8; }

        /* ── HERO ── */
        .hero-split { display: flex; min-height: 100vh; }
        .hero-photo { width: 60%; position: relative; overflow: hidden; }
        .hero-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; }
        .hero-photo-overlay { position: absolute; inset: 0; background: linear-gradient(to right, transparent 70%, #0A0A0A 100%); }
        .hero-text { width: 40%; display: flex; flex-direction: column; justify-content: center; padding: 80px 64px; }

        @media (max-width: 900px) {
          .hero-split { flex-direction: column; min-height: auto; }
          .hero-photo { width: 100%; height: 50vh; min-height: 400px; }
          .hero-photo-overlay { background: linear-gradient(to bottom, transparent 60%, #0A0A0A 100%); }
          .hero-text { width: 100%; padding: 40px 24px 60px; }
        }

        /* ── TRUST BAR ── */
        .trust-bar-desktop { padding: 24px 40px; border-top: 1px solid #1A1A1A; border-bottom: 1px solid #1A1A1A; display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
        .trust-bar-desktop span { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #808080; white-space: nowrap; }
        .trust-bar-desktop .sep { color: #333; }
        .trust-bar-mobile { display: none; }
        @media (max-width: 640px) {
          .trust-bar-desktop { display: none; }
          .trust-bar-mobile { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 20px 24px; border-top: 1px solid #1A1A1A; border-bottom: 1px solid #1A1A1A; text-align: center; }
          .trust-bar-mobile span { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #808080; }
        }

        /* ── SECTION COMMON ── */
        .section { padding: 120px 80px; max-width: 1280px; margin: 0 auto; }
        @media (max-width: 900px) { .section { padding: 80px 24px; } }

        /* ── FEATURED GRID ── */
        .featured-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        @media (max-width: 900px) { .featured-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .featured-grid { grid-template-columns: 1fr; } }

        /* ── SMART MATCH ── */
        .smart-match { padding: 100px 80px; text-align: center; border-top: 1px solid #1A1A1A; border-bottom: 1px solid #1A1A1A; }
        @media (max-width: 600px) { .smart-match { padding: 80px 24px; } }

        /* ── SERVICES GRID ── */
        .services-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; }
        @media (max-width: 900px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .services-grid { grid-template-columns: 1fr; } }
        .svc-card { background: #111; border: 1px solid rgba(255,255,255,0.06); padding: 32px 24px; text-decoration: none; transition: border-color .2s, transform .2s; display: block; }
        .svc-card:hover { border-color: rgba(197,165,114,.3); transform: translateY(-2px); }
        .svc-card-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: #f0e8dc; margin: 0 0 8px; }
        .svc-card-desc { font-size: 12px; color: #6b6560; line-height: 1.6; margin: 0; }

        /* ── DISTRICTS GRID ── */
        .districts-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 48px; }
        @media (max-width: 900px) { .districts-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) { .districts-grid { grid-template-columns: repeat(2, 1fr); } }
        .dist-card { background: #111; border: 1px solid rgba(255,255,255,0.06); padding: 24px 20px; text-align: center; text-decoration: none; transition: border-color .2s; }
        .dist-card:hover { border-color: rgba(197,165,114,.3); }
        .dist-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; color: #f0e8dc; margin: 0 0 4px; }
        .dist-count { font-size: 10px; letter-spacing: .1em; color: #6b6560; text-transform: uppercase; }

        /* ── SOCIAL PROOF ── */
        .social-proof { padding: 120px 80px; text-align: center; border-top: 1px solid #1A1A1A; }
        @media (max-width: 600px) { .social-proof { padding: 80px 24px; } }

        /* ── FINAL CTA ── */
        .final-cta { padding: 120px 80px; text-align: center; border-top: 1px solid #1A1A1A; }
        @media (max-width: 600px) { .final-cta { padding: 80px 24px; } }
        .final-cta-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn-primary { display: inline-block; background: #C5A572; color: #0A0A0A; padding: 16px 36px; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; font-weight: 500; text-decoration: none; transition: background .2s; text-align: center; }
        .btn-primary:hover { background: #d4b87a; }
        .btn-secondary { display: inline-block; border: 1px solid #333; color: #fff; padding: 16px 36px; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; text-decoration: none; transition: border-color .2s, color .2s; text-align: center; }
        .btn-secondary:hover { border-color: #C5A572; color: #C5A572; }
        @media (max-width: 640px) {
          .final-cta-buttons { flex-direction: column; align-items: stretch; padding: 0 24px; }
          .final-cta-buttons .btn-primary, .final-cta-buttons .btn-secondary { width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <div className="home-root">
        <Header />

        {/* 1. HERO */}
        <section className="hero-split">
          <div className="hero-photo">
            {heroPhoto
              ? <Image fill src={heroPhoto} alt="Premium London companion" style={{ objectFit: 'cover', objectPosition: 'center 15%' }} sizes="60vw" priority />
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
              From £{globalMinPrice.toLocaleString('en-GB')} per hour
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
                const incallPrice = model.modelRates?.[0]?.price
                  ? Number(model.modelRates[0].price)
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
              {services.map((svc: any) => (
                <Link key={svc.slug} href={`/services/${svc.slug}`} className="svc-card">
                  <h3 className="svc-card-title">{svc.publicName || svc.name || svc.slug}</h3>
                  {svc.description && <p className="svc-card-desc">{svc.description}</p>}
                </Link>
              ))}
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

        {/* 8. FINAL CTA */}
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
            <a href="https://t.me/virel_bookings" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Message on Telegram
            </a>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
