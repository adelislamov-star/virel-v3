// @ts-nocheck
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

export const metadata = {
  title: 'London Escorts | Premium Escort Agency London | Virel',
  description: 'London\'s premier escort agency. Verified, sophisticated companions for incall and outcall. Discreet, elegant, available 24/7 across London\'s finest districts.',
  alternates: { canonical: 'https://virel-v3.vercel.app' },
  openGraph: {
    title: 'London Escorts | Premium Escort Agency | Virel',
    description: 'London\'s premier escort agency. Verified, sophisticated companions available 24/7.',
    url: 'https://virel-v3.vercel.app',
    siteName: 'Virel',
    locale: 'en_GB',
    type: 'website',
  },
}

const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://virel-v3.vercel.app/#organization',
      name: 'Virel',
      url: 'https://virel-v3.vercel.app',
      description: 'Premium escort agency in London. Verified, sophisticated companions for incall and outcall across London.',
      areaServed: { '@type': 'City', name: 'London', '@id': 'https://www.wikidata.org/wiki/Q84' },
      contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'English' },
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://virel-v3.vercel.app/#business',
      name: 'Virel London Escorts',
      url: 'https://virel-v3.vercel.app',
      description: 'London\'s premier escort agency offering verified, sophisticated companions for incall and outcall.',
      address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
      openingHours: 'Mo-Su 00:00-23:59',
      priceRange: '£££',
      telephone: '',
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

export default async function HomePage() {
  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  // Fetch minimum prices for all featured models
  let minPrices: Record<string, number> = {}
  try {
    const modelIds = models.map((m: any) => m.id)
    if (modelIds.length > 0) {
      const rates: any[] = await prisma.$queryRaw`
        SELECT model_id, MIN(price) as min_price
        FROM model_rates
        WHERE model_id = ANY(${modelIds}::text[]) AND is_active = true
        GROUP BY model_id
      `
      for (const r of rates) {
        minPrices[r.model_id] = Number(r.min_price)
      }
    }
  } catch (e) {}

  // Use first 3 models for featured section
  const featured = models.slice(0, 3)
  // Hero photo from first model
  const heroModel = models[0]
  const heroPhoto = heroModel?.media[0]?.url
  // Compute overall lowest price for hero
  const allPrices = Object.values(minPrices)
  const globalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 300

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

        .f-card { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; display: block; text-decoration: none; }
        .f-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.25,.46,.45,.94); filter: grayscale(10%); }
        .f-card:hover img { transform: scale(1.06); filter: grayscale(0%); }
        .f-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.3) 40%, transparent 70%); }
        .f-card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 32px 28px; }
        .f-card-name { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300; color: #fff; margin: 0 0 6px; }
        .f-card-meta { font-size: 11px; letter-spacing: .12em; color: rgba(255,255,255,0.45); text-transform: uppercase; margin: 0; }
        .f-card-price { font-size: 14px; letter-spacing: .05em; text-transform: uppercase; color: #C5A572; margin: 8px 0 0; }
        .f-card-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); }

        /* ── SOCIAL PROOF ── */
        .social-proof { padding: 100px 40px; text-align: center; border-top: 1px solid #1A1A1A; }
        @media (max-width: 600px) { .social-proof { padding: 64px 24px; } }

        /* ── FINAL CTA ── */
        .final-cta { padding: 120px 40px; text-align: center; border-top: 1px solid #1A1A1A; }
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

        {/* ═══ 1. HERO — split layout ═══ */}
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
            <div>
              <Link href="/london-escorts" className="btn-primary">
                Explore Companions
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 2. TRUST BAR ═══ */}
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

        {/* ═══ 3. FEATURED COMPANIONS — 3 cards ═══ */}
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{ fontSize: 10, letterSpacing: '.25em', color: '#C5A572', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>
                Available Now
              </span>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 300,
                lineHeight: 1.05,
                color: '#FAFAFA',
                margin: 0,
              }}>
                Featured Companions
              </h2>
            </div>
            <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.15em', color: '#808080', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #333', paddingBottom: 2, marginBottom: 8 }}>
              View All
            </Link>
          </div>

          <div className="featured-grid">
            {featured.map((model: any) => {
              const photo = model.media[0]?.url
              const age = model.stats?.age
              const nationality = model.stats?.nationality
              const minPrice = minPrices[model.id]
              return (
                <Link key={model.id} href={`/companions/${model.slug}`} className="f-card">
                  {photo
                    ? <Image fill src={photo} alt={model.name} style={{ objectFit: 'cover' }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
                    : (
                      <div className="f-card-placeholder">
                        <span style={{ fontSize: 48, color: '#2a2520', marginBottom: 12 }}>◈</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '.15em', color: '#3a3530', textTransform: 'uppercase' }}>Photo Coming Soon</span>
                      </div>
                    )
                  }
                  <div className="f-card-overlay" />
                  <div className="f-card-content">
                    <h3 className="f-card-name">{model.name}</h3>
                    <p className="f-card-meta">
                      {[age && `${age} yrs`, nationality].filter(Boolean).join('  ·  ')}
                    </p>
                    {minPrice && (
                      <p className="f-card-price">
                        From £{minPrice.toLocaleString('en-GB')}/hr
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ═══ 4. SOCIAL PROOF ═══ */}
        <section className="social-proof">
          <p style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: '#C5A572', marginBottom: 24 }}>
            Trusted Agency
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(20px, 3vw, 28px)',
            fontWeight: 300,
            fontStyle: 'italic',
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

        {/* ═══ 5. FINAL CTA ═══ */}
        <section className="final-cta">
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 300,
            color: '#FAFAFA',
            margin: '0 0 16px',
          }}>
            Ready to make an arrangement?
          </h2>
          <p style={{ fontSize: 14, color: '#808080', margin: '0 0 36px' }}>
            Response within 30 minutes, guaranteed
          </p>
          <div className="final-cta-buttons">
            <Link href="/london-escorts" className="btn-primary">
              Browse Companions
            </Link>
            <a href="https://t.me/virel_bookings" target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Message on Telegram
            </a>
          </div>
        </section>

        {/* ═══ 6. FOOTER ═══ */}
        <Footer />
      </div>
    </>
  )
}
