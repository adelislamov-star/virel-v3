// @ts-nocheck
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
import { prisma } from '@/lib/db/client'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const model = await prisma.model.findUnique({ where: { slug: params.slug } })
  if (!model) return { title: 'Not Found' }
  return {
    title: `${model.name} — London Companion | Virel`,
    description: `${model.name} is a premium verified companion available in London for incall and outcall. Discreet, sophisticated, available now.`,
    alternates: { canonical: `https://virel-v3.vercel.app/catalog/${params.slug}` },
  }
}

const RATE_ORDER = ['30min','45min','1hour','90min','2hours','extra_hour','overnight']
const RATE_LABELS: Record<string, string> = {
  '30min': '30 min', '45min': '45 min', '1hour': '1 hour',
  '90min': '90 min', '2hours': '2 hours', 'extra_hour': 'Extra hour', 'overnight': 'Overnight'
}

export default async function ModelProfilePage({ params }: Props) {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug, status: 'active', visibility: 'public' },
    include: {
      stats: true,
      media: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' } },
      primaryLocation: true,
    },
  })

  if (!model) notFound()

  let rates: any[] = []
  try {
    rates = await prisma.$queryRaw`
      SELECT duration_type, call_type, price, taxi_fee, currency
      FROM model_rates
      WHERE model_id = ${model.id} AND is_active = true
      ORDER BY price ASC
    `
  } catch (e) {}

  let services: any[] = []
  try {
    services = await prisma.$queryRaw`
      SELECT s.title, s.slug
      FROM model_services ms
      JOIN services s ON s.id = ms."serviceId"
      WHERE ms."modelId" = ${model.id} AND ms."isEnabled" = true
      ORDER BY s.title ASC
    `
  } catch (e) {}

  const primaryPhoto = model.media.find((m: any) => m.isPrimary)?.url || model.media[0]?.url
  const gallery = model.media.filter((m: any) => m.isPublic)

  // Sort rates by logical order
  const incallRates = rates
    .filter((r: any) => r.call_type === 'incall')
    .sort((a: any, b: any) => RATE_ORDER.indexOf(a.duration_type) - RATE_ORDER.indexOf(b.duration_type))
  const outcallRates = rates
    .filter((r: any) => r.call_type === 'outcall')
    .sort((a: any, b: any) => RATE_ORDER.indexOf(a.duration_type) - RATE_ORDER.indexOf(b.duration_type))

  const stats = model.stats

  const lowestPrice = rates.length > 0 ? Math.min(...rates.map((r: any) => Number(r.price))) : null

  const profileSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: model.name,
        url: `https://virel-v3.vercel.app/catalog/${model.slug}`,
        image: primaryPhoto || undefined,
        description: `${model.name} is a premium verified companion available in London for incall and outcall.`,
        jobTitle: 'Companion',
        worksFor: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
        address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
      },
      {
        '@type': 'Service',
        name: `${model.name} — London Escort`,
        url: `https://virel-v3.vercel.app/catalog/${model.slug}`,
        description: `${model.name} is a premium verified companion available in London for incall and outcall.`,
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
        areaServed: { '@type': 'City', name: 'London' },
        ...(lowestPrice ? { offers: { '@type': 'Offer', price: lowestPrice, priceCurrency: 'GBP', availability: 'https://schema.org/InStock' } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'Companions', item: 'https://virel-v3.vercel.app/london-escorts' },
          { '@type': 'ListItem', position: 3, name: model.name, item: `https://virel-v3.vercel.app/catalog/${model.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .profile-root { font-family: 'DM Sans', sans-serif; background: #0a0a0a; color: #e8e0d4; min-height: 100vh; }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .gold { color: #c9a84c; }
        .gold-border { border-color: #c9a84c; }
        .stat-divider { border-color: rgba(255,255,255,0.07); }

        .gallery-main { position: relative; width: 100%; height: 85vh; min-height: 600px; overflow: hidden; background: #111; }
        .gallery-main img { width: 100%; height: 100%; object-fit: cover; object-position: top center; transition: transform 0.8s cubic-bezier(.25,.46,.45,.94); }
        .gallery-main:hover img { transform: scale(1.03); }

        .thumb { aspect-ratio: 1; overflow: hidden; background: #111; cursor: pointer; opacity: 0.65; transition: opacity .3s; }
        .thumb:hover { opacity: 1; }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }

        .rate-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .rate-row:last-child { border-bottom: none; }

        .tag { display: inline-block; padding: 5px 14px; border: 1px solid rgba(201,168,76,0.25); color: #a89060; font-size: 12px; letter-spacing: .04em; margin: 3px; transition: all .2s; }
        .tag:hover { border-color: #c9a84c; color: #c9a84c; }

        .booking-panel { background: #111; border: 1px solid rgba(255,255,255,0.08); }

        .sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; padding: 16px 20px; background: linear-gradient(to top, rgba(10,10,10,1) 60%, transparent); display: none; }
        @media (max-width: 1024px) { .sticky-cta { display: block; } }

        .available-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; margin-right: 8px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{ opacity:1; box-shadow: 0 0 0 0 rgba(74,222,128,.4); } 50%{ box-shadow: 0 0 0 6px rgba(74,222,128,0); } }

        .section-label { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #c9a84c; margin-bottom: 20px; }

        .fade-in { animation: fadeUp .6s ease both; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
      `}</style>

      <div className="profile-root">
        <Header />

        {/* Breadcrumb */}
        <div style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <nav style={{ fontSize: 12, letterSpacing: '.06em', color: '#6b6560' }}>
            <Link href="/" style={{ color: '#6b6560', textDecoration: 'none' }}>HOME</Link>
            <span style={{ margin: '0 10px' }}>—</span>
            <Link href="/london-escorts" style={{ color: '#6b6560', textDecoration: 'none' }}>COMPANIONS</Link>
            <span style={{ margin: '0 10px' }}>—</span>
            <span style={{ color: '#c9a84c' }}>{model.name.toUpperCase()}</span>
          </nav>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 40px 120px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div className="fade-in">

            {/* Main photo */}
            <div className="gallery-main" style={{ marginBottom: 8 }}>
              {primaryPhoto
                ? <img src={primaryPhoto} alt={model.name} />
                : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                    <div style={{ textAlign: 'center', color: '#333' }}>
                      <div style={{ fontSize: 60, marginBottom: 16 }}>◈</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, letterSpacing: '.15em' }}>PHOTO COMING SOON</div>
                    </div>
                  </div>
                )
              }
              {/* Name overlay on photo */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '60px 32px 32px', background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="available-dot" />
                  <span style={{ fontSize: 11, letterSpacing: '.12em', color: '#4ade80' }}>AVAILABLE NOW</span>
                </div>
                <h1 className="serif" style={{ fontSize: 52, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '.02em' }}>
                  {model.name}
                </h1>
                {stats && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '.08em' }}>
                    {[stats.age && `${stats.age} YRS`, stats.nationality?.toUpperCase(), model.primaryLocation?.name?.toUpperCase()].filter(Boolean).join('  ·  ')}
                  </p>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 60 }}>
                {gallery.slice(0, 10).map((photo: any) => (
                  <div key={photo.id} className="thumb">
                    <img src={photo.url} alt={model.name} loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div style={{ marginBottom: 60 }}>
                <p className="section-label">Profile</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
                  {[
                    ['Age', stats.age ? `${stats.age}` : null],
                    ['Height', stats.height ? `${stats.height} cm` : null],
                    ['Weight', stats.weight ? `${stats.weight} kg` : null],
                    ['Bust', stats.bustSize || null],
                    ['Hair', stats.hairColour || null],
                    ['Eyes', stats.eyeColour || null],
                    ['Nationality', stats.nationality || null],
                    ['Languages', stats.languages?.length ? stats.languages.join(', ') : null],
                  ].filter(([, v]) => v).map(([label, value], i) => (
                    <div key={label as string} style={{ padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRight: (i % 3 !== 2) ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingRight: 20, paddingLeft: i % 3 === 0 ? 0 : 20 }}>
                      <p style={{ fontSize: 10, letterSpacing: '.15em', color: '#6b6560', marginBottom: 6, textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: 15, fontWeight: 400, color: '#e8e0d4', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rates */}
            {(incallRates.length > 0 || outcallRates.length > 0) && (
              <div style={{ marginBottom: 60 }}>
                <p className="section-label">Rates</p>
                <div style={{ display: 'grid', gridTemplateColumns: outcallRates.length > 0 ? '1fr 1fr' : '1fr', gap: 40 }}>
                  {incallRates.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, letterSpacing: '.1em', color: '#c9a84c', marginBottom: 16, textTransform: 'uppercase' }}>Incall</p>
                      {incallRates.map((r: any, i: number) => (
                        <div key={i} className="rate-row">
                          <span style={{ fontSize: 14, color: '#9a9189' }}>{RATE_LABELS[r.duration_type] || r.duration_type}</span>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#e8e0d4' }}>£{Number(r.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {outcallRates.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, letterSpacing: '.1em', color: '#c9a84c', marginBottom: 16, textTransform: 'uppercase' }}>Outcall</p>
                      {outcallRates.map((r: any, i: number) => (
                        <div key={i} className="rate-row">
                          <span style={{ fontSize: 14, color: '#9a9189' }}>{RATE_LABELS[r.duration_type] || r.duration_type}</span>
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#e8e0d4' }}>£{Number(r.price)}<span style={{ fontSize: 12, color: '#6b6560', marginLeft: 6 }}>+taxi</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div>
                <p className="section-label">Services</p>
                <div style={{ marginTop: -4 }}>
                  {services.map((svc: any) => (
                    <span key={svc.slug} className="tag">{svc.title}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — BOOKING PANEL ── */}
          <div style={{ position: 'sticky', top: 32 }}>
            <div className="booking-panel" style={{ padding: '40px 36px' }}>
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 28, marginBottom: 28 }}>
                <h2 className="serif" style={{ fontSize: 36, fontWeight: 300, margin: '0 0 8px', letterSpacing: '.02em' }}>{model.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="available-dot" />
                  <span style={{ fontSize: 12, letterSpacing: '.1em', color: '#4ade80' }}>AVAILABLE NOW</span>
                </div>
              </div>

              {/* Quick stats */}
              {stats && (
                <div style={{ display: 'flex', gap: 24, marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {stats.age && <div><p style={{ fontSize: 9, letterSpacing: '.15em', color: '#6b6560', marginBottom: 4 }}>AGE</p><p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.age}</p></div>}
                  {stats.height && <div><p style={{ fontSize: 9, letterSpacing: '.15em', color: '#6b6560', marginBottom: 4 }}>HEIGHT</p><p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.height} cm</p></div>}
                  {stats.bustSize && <div><p style={{ fontSize: 9, letterSpacing: '.15em', color: '#6b6560', marginBottom: 4 }}>BUST</p><p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.bustSize}</p></div>}
                </div>
              )}

              {/* Booking form */}
              <BookingForm model={{ id: model.id, name: model.name, rates }} />

              {/* Trust signals */}
              <div style={{ marginTop: 28, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  '✦  Confirmation within 30 minutes',
                  '◈  100% discreet & confidential',
                  '◉  Verified authentic profile',
                ].map(item => (
                  <p key={item} style={{ fontSize: 12, color: '#6b6560', letterSpacing: '.04em', margin: '8px 0' }}>{item}</p>
                ))}
              </div>
            </div>

            {/* Back link */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/london-escorts" style={{ fontSize: 12, letterSpacing: '.1em', color: '#6b6560', textDecoration: 'none', textTransform: 'uppercase' }}>
                ← All Companions
              </Link>
            </div>
          </div>
        </div>

        {/* ── STICKY MOBILE CTA ── */}
        <div className="sticky-cta">
          <a href="#booking" style={{ display: 'block', background: '#c9a84c', color: '#0a0a0a', textAlign: 'center', padding: '16px', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 15, letterSpacing: '.06em', textDecoration: 'none', textTransform: 'uppercase' }}>
            Book {model.name} — Request Now
          </a>
        </div>

        <Footer />
      </div>
    </>
  )
}
