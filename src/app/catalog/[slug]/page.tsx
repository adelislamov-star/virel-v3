// @ts-nocheck
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
import { GalleryViewer } from '@/components/profile/GalleryViewer'
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

  const stats = model.stats
  const lowestPrice = rates.length > 0 ? Math.min(...rates.map((r: any) => Number(r.price))) : null

  // Clean service labels — remove explicit abbreviations
  const SERVICE_REMAP: Record<string, string> = {
    'COB (Cum on body)': 'Finishing on body',
    'OWC (Blow job with condom)': 'Protected oral',
    'DT (Deep throat)': 'Deep throat',
    'DFK (Deep French kissing with tongue)': 'Deep French kissing',
    'FK (French kissing without tongue)': 'French kissing',
    'GFE': 'Girlfriend Experience',
    'PSE (Porn Star Experience)': 'Uninhibited experience',
    'MMF for double price (Male-Male-Female)': 'MMF duo (double rate)',
    'Bi DUO (lesbian show)': 'Bi duo experience',
    'Couples (includes Bi services)': 'Couples experience',
    'DUO (ladies serve client)': 'Duo — ladies serve',
    'Rimming Receiving (licking anal hole of lady)': 'Rimming receiving',
    'OWC': 'Protected oral',
  }

  const cleanedServices = services.map((s: any) => ({
    ...s,
    displayTitle: SERVICE_REMAP[s.title] || s.title,
  }))

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

        .gallery-main { position: relative; width: 100%; height: 85vh; min-height: 600px; overflow: hidden; background: #111; }
        .gallery-main img { width: 100%; height: 100%; object-fit: cover; object-position: top center; transition: transform 0.8s cubic-bezier(.25,.46,.45,.94); }
        .gallery-main:hover img { transform: scale(1.03); }

        .tag { display: inline-block; padding: 5px 14px; border: 1px solid rgba(201,168,76,0.2); color: #9a8860; font-size: 12px; letter-spacing: .04em; margin: 3px; transition: all .2s; cursor: default; }
        .tag:hover { border-color: rgba(201,168,76,0.5); color: #c9a84c; }

        .booking-panel { background: #111; border: 1px solid rgba(255,255,255,0.08); }

        .sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; padding: 16px 20px; background: linear-gradient(to top, rgba(10,10,10,1) 60%, transparent); display: none; }
        @media (max-width: 1024px) { .sticky-cta { display: block; } }

        .section-label { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #c9a84c; margin-bottom: 20px; }

        .fade-in { animation: fadeUp .6s ease both; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }

        .avail-badge {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #7a7060;
        }
        .avail-line {
          display: inline-block; width: 28px; height: 1px; background: #c9a84c; opacity: 0.5;
        }
      `}</style>

      <div className="profile-root">
        <Header />

        {/* NO breadcrumb — SEO handled via JSON-LD schema only */}

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 40px 120px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div className="fade-in">

            {/* Gallery */}
            {primaryPhoto ? (
              <GalleryViewer
                photos={gallery.map((p: any) => ({ id: p.id, url: p.url }))}
                modelName={model.name}
                primaryUrl={primaryPhoto}
              />
            ) : (
              <div className="gallery-main" style={{ marginBottom: 8 }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                  <div style={{ textAlign: 'center', color: '#333' }}>
                    <div style={{ fontSize: 60, marginBottom: 16 }}>◈</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, letterSpacing: '.15em' }}>PHOTO COMING SOON</div>
                  </div>
                </div>
              </div>
            )}

            {/* Name overlay */}
            <div style={{ position: 'relative', marginTop: -120, marginBottom: 72, pointerEvents: 'none' }}>
              <div style={{ padding: '60px 32px 32px', background: 'linear-gradient(to top, rgba(0,0,0,.88) 0%, transparent 100%)' }}>
                <div className="avail-badge" style={{ marginBottom: 14 }}>
                  <span className="avail-line" />
                  Available in London
                </div>
                <h1 className="serif" style={{ fontSize: 56, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '.01em' }}>
                  {model.name}
                </h1>
                {stats && (
                  <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '.1em' }}>
                    {[stats.age && `${stats.age} yrs`, stats.nationality, model.primaryLocation?.name].filter(Boolean).join('  ·  ')}
                  </p>
                )}
              </div>
            </div>

            {/* Profile stats */}
            {stats && (
              <div style={{ marginBottom: 72 }}>
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
                    <div key={label as string} style={{
                      padding: '20px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      borderRight: (i % 3 !== 2) ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      paddingRight: 20,
                      paddingLeft: i % 3 === 0 ? 0 : 20
                    }}>
                      <p style={{ fontSize: 9, letterSpacing: '.18em', color: '#5a5450', marginBottom: 7, textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: 15, fontWeight: 400, color: '#d8d0c4', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experiences — renamed from Services, labels cleaned */}
            {cleanedServices.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <p className="section-label">Experiences</p>
                <div style={{ marginTop: -4 }}>
                  {cleanedServices.map((svc: any) => (
                    <span key={svc.slug} className="tag">{svc.displayTitle}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Back link — mobile */}
            <div style={{ marginTop: 48, display: 'none' }} className="mobile-back">
              <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.12em', color: '#5a5450', textDecoration: 'none', textTransform: 'uppercase' }}>
                ← All Companions
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN — BOOKING PANEL ── */}
          <div style={{ position: 'sticky', top: 32 }}>
            <div className="booking-panel" style={{ padding: '40px 36px' }}>

              {/* Header — no green dot, just name + subtle availability */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 28, marginBottom: 28 }}>
                <h2 className="serif" style={{ fontSize: 38, fontWeight: 300, margin: '0 0 10px', letterSpacing: '.01em' }}>{model.name}</h2>
                <div className="avail-badge">
                  <span className="avail-line" />
                  Available in London
                </div>
              </div>

              {/* Quick stats */}
              {stats && (
                <div style={{ display: 'flex', gap: 28, marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {stats.age && (
                    <div>
                      <p style={{ fontSize: 9, letterSpacing: '.18em', color: '#5a5450', marginBottom: 5 }}>AGE</p>
                      <p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.age}</p>
                    </div>
                  )}
                  {stats.height && (
                    <div>
                      <p style={{ fontSize: 9, letterSpacing: '.18em', color: '#5a5450', marginBottom: 5 }}>HEIGHT</p>
                      <p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.height} cm</p>
                    </div>
                  )}
                  {stats.bustSize && (
                    <div>
                      <p style={{ fontSize: 9, letterSpacing: '.18em', color: '#5a5450', marginBottom: 5 }}>BUST</p>
                      <p style={{ fontSize: 16, color: '#e8e0d4', margin: 0 }}>{stats.bustSize}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Booking form */}
              <BookingForm model={{ id: model.id, name: model.name, rates }} />

              {/* Trust signals */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  ['◈', 'Confirmed within 30 minutes'],
                  ['◉', '100% discreet & confidential'],
                  ['✦', 'Verified authentic profile'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                    <span style={{ fontSize: 11, color: '#c9a84c', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: '#5a5450', letterSpacing: '.04em' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back link — desktop */}
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.12em', color: '#5a5450', textDecoration: 'none', textTransform: 'uppercase' }}>
                ← All Companions
              </Link>
            </div>
          </div>
        </div>

        {/* ── STICKY MOBILE CTA ── */}
        <div className="sticky-cta">
          <a href="#booking" style={{
            display: 'block', background: '#c9a84c', color: '#0a0a0a',
            textAlign: 'center', padding: '16px',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
            fontSize: 13, letterSpacing: '.1em',
            textDecoration: 'none', textTransform: 'uppercase'
          }}>
            Arrange a Meeting with {model.name}
          </a>
        </div>

        <Footer />
      </div>
    </>
  )
}
