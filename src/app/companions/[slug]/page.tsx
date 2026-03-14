// @ts-nocheck
export const revalidate = 3600

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CompanionGallery } from '@/components/public/CompanionGallery'
import { BookingWidget } from '@/components/public/BookingWidget'
import { ViewTracker } from '@/components/public/ViewTracker'
import { ModelCard } from '@/components/public/ModelCard'
import { prisma } from '@/lib/db/client'

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const models = await prisma.model.findMany({
    where: { status: 'published', deletedAt: null },
    select: { slug: true },
  })
  return models.map(m => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug },
    select: {
      name: true, seoTitle: true, seoDescription: true, tagline: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1, select: { url: true } },
    },
  })
  if (!model) return {}
  const ogImage = model.media?.[0]?.url
  return {
    title: model.seoTitle ?? `${model.name} | Virel London`,
    description: model.seoDescription
      ?? `Book ${model.name}${model.tagline ? ` — ${model.tagline}` : ''}. London companion agency.`,
    openGraph: {
      images: ogImage ? [{ url: ogImage }] : [],
    },
    alternates: { canonical: `https://virel-v3.vercel.app/companions/${params.slug}` },
  }
}

const SERVICE_REMAP: Record<string, string> = {
  'COB (Cum on body)': 'Finishing on body',
  'CIF (Cum in face)': 'Finishing on face',
  'CIF (Cum in Face)': 'Finishing on face',
  'COF (Cum on face)': 'Finishing on face',
  'OWC (Blow job with condom)': 'Protected oral',
  'OWO (Blow job without condom)': 'Oral without protection',
  'DT (Deep throat)': 'Deep throat',
  'A-Level (Anal sex)': 'A-level',
  'A-Level': 'A-level',
  'A-LEVEL (ANAL SEX)': 'A-level',
  'DFK (Deep French kissing with tongue)': 'Deep French kissing',
  'FK (French kissing without tongue)': 'French kissing',
  'GFE': 'Girlfriend Experience',
  'PSE (Porn Star Experience)': 'Uninhibited experience',
  'PSE': 'Uninhibited experience',
  'MMF for double price (Male-Male-Female)': 'MMF duo (double rate)',
  'MMF (Male-Male-Female)': 'MMF duo',
  'Bi DUO (lesbian show)': 'Bi duo experience',
  'Couples (includes Bi services)': 'Couples experience',
  'Couples (Includes Bi Services)': 'Couples experience',
  'Couples (includes bi services)': 'Couples experience',
  'DUO (ladies serve client)': 'Duo — ladies serve',
  'Rimming Receiving (licking anal hole of lady)': 'Rimming receiving',
  'Rimming Giving (licking anal hole of client)': 'Rimming giving',
  'Watersports (giving)': 'Watersports — giving',
  'Watersports (receiving)': 'Watersports — receiving',
  'Striptease/Lapdance': 'Striptease & lapdance',
}

export default async function ModelProfilePage({ params }: Props) {
  const model = await prisma.model.findUnique({
    where: { slug: params.slug, status: 'published', visibility: 'public', deletedAt: null },
    include: {
      stats: true,
      media: { where: { isPublic: true }, orderBy: { sortOrder: 'asc' } },
      primaryLocation: true,
      modelRates: {
        include: { callRateMaster: true },
        orderBy: { callRateMaster: { sortOrder: 'asc' } },
      },
      modelLocations: {
        include: { district: true },
        orderBy: { isPrimary: 'desc' },
      },
      services: {
        where: { isEnabled: true, service: { isPublic: true } },
        include: { service: true },
        orderBy: { service: { sortOrder: 'asc' } },
      },
    },
  })

  if (!model) notFound()

  // Raw SQL fallback for min price only
  let rawMinPrice: number | null = null
  try {
    const raw: any[] = await prisma.$queryRaw`
      SELECT MIN(LEAST(COALESCE(incall_price, 999999), COALESCE(outcall_price, 999999))) as min_price
      FROM model_rates
      WHERE model_id = ${model.id}
    `
    if (raw[0]?.min_price && Number(raw[0].min_price) < 999999) {
      rawMinPrice = Number(raw[0].min_price)
    }
  } catch {}

  // Build rates from new schema (modelRates with callRateMaster)
  const widgetRates = model.modelRates.map((mr: any) => ({
    label: mr.callRateMaster.label,
    durationMin: mr.callRateMaster.durationMin,
    incallPrice: mr.incallPrice ? Number(mr.incallPrice) : null,
    outcallPrice: mr.outcallPrice ? Number(mr.outcallPrice) : null,
  }))

  // Build rates table from Prisma modelRates
  const ratesTable = widgetRates.map((r: any) => ({
    label: r.label,
    incall: r.incallPrice,
    outcall: r.outcallPrice,
  }))

  // Min price
  const allPrices = [
    ...widgetRates.map((r: any) => r.incallPrice).filter(Boolean),
    ...widgetRates.map((r: any) => r.outcallPrice).filter(Boolean),
  ]
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : rawMinPrice

  // Photos
  const primaryPhoto = model.media.find((m: any) => m.isPrimary)?.url || model.media[0]?.url || null
  const galleryUrls = model.media.filter((m: any) => m.isPublic && m.url !== primaryPhoto).map((m: any) => m.url)

  // Stats
  const stats = model.stats
  const aboutStats = [
    stats?.age && { label: 'Age', value: `${stats.age}` },
    stats?.height && { label: 'Height', value: `${stats.height} cm` },
    model.measurements && { label: 'Measurements', value: model.measurements },
    stats?.bustSize && { label: 'Bust', value: `${stats.bustSize}${stats?.bustType ? ` (${stats.bustType})` : ''}` },
    stats?.eyeColour && { label: 'Eyes', value: stats.eyeColour },
    stats?.hairColour && { label: 'Hair', value: [stats.hairColour, model.hairLength].filter(Boolean).join(', ') },
    stats?.nationality && { label: 'Nationality', value: stats.nationality },
    model.ethnicity && { label: 'Ethnicity', value: model.ethnicity },
    stats?.languages?.length && { label: 'Languages', value: stats.languages.join(', ') },
    model.education && { label: 'Education', value: model.education },
    model.travel && { label: 'Travel', value: model.travel },
    stats?.dressSize && { label: 'Dress Size', value: stats.dressSize },
    stats?.feetSize && { label: 'Shoe Size', value: stats.feetSize },
    stats?.smokingStatus && { label: 'Smoking', value: stats.smokingStatus },
    stats?.tattooStatus && stats.tattooStatus !== 'None' && { label: 'Tattoo', value: stats.tattooStatus },
  ].filter(Boolean) as { label: string; value: string }[]

  // Location
  const allDistricts = model.modelLocations.map((l: any) => l.district.name).join(' · ')
  const primaryDistrict = model.modelLocations.find((l: any) => l.isPrimary)?.district?.name
    ?? model.modelLocations[0]?.district?.name
    ?? model.primaryLocation?.title ?? null

  // Services (only public ones — filtered in Prisma query already)
  const regularServices = model.services
    .filter((ms: any) => !ms.isExtra)
    .map((ms: any) => SERVICE_REMAP[ms.service.title] || ms.service.publicName || ms.service.title)

  const extras = model.services
    .filter((ms: any) => ms.isExtra && ms.extraPrice)
    .map((ms: any) => ({
      name: SERVICE_REMAP[ms.service.title] || ms.service.title,
      price: Number(ms.extraPrice),
    }))

  const doublePriceServices = model.services
    .filter((ms: any) => ms.isDoublePrice)
    .map((ms: any) => SERVICE_REMAP[ms.service.title] || ms.service.publicName || ms.service.title)

  const poaServices = model.services
    .filter((ms: any) => ms.isPOA)
    .map((ms: any) => SERVICE_REMAP[ms.service.title] || ms.service.publicName || ms.service.title)

  // DUO partners
  let duoPartners: any[] = []
  if (model.duoPartnerIds?.length) {
    try {
      duoPartners = await prisma.model.findMany({
        where: { id: { in: model.duoPartnerIds }, status: 'published', deletedAt: null },
        select: { name: true, slug: true, tagline: true },
      })
    } catch {}
  }

  // Similar models
  let similarModels: any[] = []
  try {
    similarModels = await prisma.model.findMany({
      where: {
        status: 'published', visibility: 'public', deletedAt: null, id: { not: model.id },
        ...(stats?.nationality ? { stats: { nationality: stats.nationality } } : {}),
      },
      include: {
        stats: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelRates: { include: { callRateMaster: true }, orderBy: { callRateMaster: { durationMin: 'asc' } }, take: 1 },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
    if (similarModels.length < 3) {
      const existing = [model.id, ...similarModels.map((m: any) => m.id)]
      const more = await prisma.model.findMany({
        where: { status: 'published', visibility: 'public', deletedAt: null, id: { notIn: existing } },
        include: {
          stats: true,
          media: { where: { isPrimary: true, isPublic: true }, take: 1 },
          modelRates: { include: { callRateMaster: true }, orderBy: { callRateMaster: { durationMin: 'asc' } }, take: 1 },
        },
        take: 3 - similarModels.length,
        orderBy: { createdAt: 'desc' },
      })
      similarModels = [...similarModels, ...more]
    }
  } catch {}

  let similarPrices: Record<string, number> = {}
  try {
    const simIds = similarModels.map((m: any) => m.id)
    if (simIds.length > 0) {
      const simRates: any[] = await prisma.$queryRaw`
        SELECT model_id, MIN(LEAST(COALESCE(incall_price, 999999), COALESCE(outcall_price, 999999))) as min_price
        FROM model_rates
        WHERE model_id = ANY(${simIds}::text[])
        GROUP BY model_id
      `
      for (const r of simRates) similarPrices[r.model_id] = Number(r.min_price)
    }
  } catch {}

  const profileSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: model.name,
        url: `https://virel-v3.vercel.app/companions/${model.slug}`,
        image: primaryPhoto || undefined,
        description: model.seoDescription ?? model.bio ?? `${model.name} is a premium companion in London.`,
        worksFor: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'Companions', item: 'https://virel-v3.vercel.app/companions' },
          { '@type': 'ListItem', position: 3, name: model.name, item: `https://virel-v3.vercel.app/companions/${model.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --gold: #b8965a;
          --gold-light: #d4af6e;
          --gold-dim: rgba(184,150,90,0.12);
          --black: #0a0a0a;
          --dark: #111111;
          --card: #161616;
          --border: rgba(255,255,255,0.07);
          --text: #e8e0d4;
          --white: #f5f0e8;
          --muted: rgba(232,224,212,0.45);
        }
        .profile-root { font-family:'DM Sans',sans-serif; background:var(--black); color:var(--text); min-height:100vh; }

        /* BREADCRUMB */
        .breadcrumb { padding:20px 80px; font-size:11px; letter-spacing:.1em; color:#3a3530; }
        .breadcrumb a { color:#3a3530; text-decoration:none; transition:color .2s; }
        .breadcrumb a:hover { color:#ddd5c8; }

        /* MAIN LAYOUT — two columns */
        .profile-main { display:grid; grid-template-columns:60% 40%; gap:0; padding:0 80px 80px; }
        @media(max-width:900px) { .profile-main { grid-template-columns:1fr; padding:0 24px 40px; } }

        /* SECTION LABEL */
        .section-label { font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:var(--muted); margin-bottom:24px; margin-top:60px; }

        /* BIO */
        .bio-text { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; line-height:1.7; color:var(--text); border-left:1px solid var(--border); padding-left:28px; }

        /* ABOUT GRID */
        .about-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--border); }
        .about-cell { background:var(--dark); padding:18px 20px; }
        .about-lbl { font-size:8px; letter-spacing:.22em; text-transform:uppercase; color:#5a5450; margin-bottom:5px; }
        .about-val { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:300; color:var(--text); }

        /* LOCATION */
        .loc-block { padding:24px; background:var(--dark); border:1px solid var(--border); }
        .loc-main { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; color:var(--text); margin:0 0 8px; }
        .loc-station { font-size:12px; color:var(--muted); }

        /* SERVICES */
        .svc-tags { display:flex; flex-wrap:wrap; gap:8px; }
        .svc-tag { display:inline-block; padding:6px 14px; border:1px solid #2A2A2A; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#808080; }

        /* EXTRAS */
        .extras-list { display:flex; flex-wrap:wrap; gap:8px; }
        .extra-item { font-size:12px; color:var(--muted); padding:6px 14px; border:1px solid var(--border); }
        .extra-price { color:var(--gold); margin-left:4px; }

        /* WARDROBE */
        .wardrobe-tags { display:flex; flex-wrap:wrap; gap:8px; }
        .wardrobe-tag { padding:6px 14px; border:1px solid rgba(197,165,114,.2); font-size:11px; letter-spacing:.08em; color:#C5A572; text-transform:uppercase; }

        /* DUO */
        .duo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
        .duo-card { display:block; text-decoration:none; padding:20px; background:var(--dark); border:1px solid var(--border); transition:border-color .2s; }
        .duo-card:hover { border-color:rgba(197,165,114,.3); }
        .duo-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; color:var(--white); margin:0 0 4px; }
        .duo-tagline { font-size:11px; color:var(--muted); }

        /* RATES TABLE */
        .rates-table { width:100%; border-collapse:collapse; }
        .rates-table thead th { padding:12px 0; text-align:left; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#808080; font-weight:400; border-bottom:1px solid #2A2A2A; }
        .rates-table thead th:not(:first-child) { text-align:right; padding-left:16px; }
        .rates-table tbody td { padding:14px 0; border-bottom:1px solid #1A1A1A; }
        .rates-table tbody td:first-child { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:300; color:var(--text); }
        .rates-table tbody td:not(:first-child) { text-align:right; font-size:14px; color:#C5A572; letter-spacing:.04em; padding-left:16px; }

        /* SIMILAR */
        .similar-section { padding:80px 80px; border-top:1px solid #1A1A1A; }
        .similar-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:40px; }
        @media(max-width:900px) { .similar-section { padding:60px 24px; } .similar-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px) { .similar-grid { grid-template-columns:1fr; } }

        /* DISCLAIMER */
        .disclaimer { text-align:center; padding:48px 80px; border-top:1px solid var(--border); font-size:12px; color:#3a3530; letter-spacing:.04em; line-height:1.8; }
        @media(max-width:600px) { .disclaimer { padding:40px 24px; } }

        /* BACK */
        .back-link { display:block; text-align:center; padding:48px; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#5a5450; text-decoration:none; transition:color .2s; }
        .back-link:hover { color:var(--white); }

        /* CONTENT SECTIONS */
        .content-sections { padding:0 80px 80px; max-width:900px; }
        @media(max-width:900px) { .content-sections { padding:0 24px 60px; } }
      `}</style>

      <div className="profile-root">
        <ViewTracker slug={params.slug} />
        <Header />

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href="/">Home</Link>
          <span style={{ margin: '0 10px' }}>→</span>
          <Link href="/companions">Companions</Link>
          <span style={{ margin: '0 10px' }}>→</span>
          <span style={{ color: '#c9a84c' }}>{model.name}</span>
        </nav>

        {/* Main: Gallery + Booking Widget */}
        <div className="profile-main">
          <div style={{ paddingRight: 40 }}>
            <CompanionGallery
              coverPhotoUrl={primaryPhoto}
              galleryPhotoUrls={galleryUrls}
              name={model.name}
            />
          </div>
          <div>
            <BookingWidget
              modelName={model.name}
              modelSlug={model.slug}
              availability={model.availability}
              isVerified={model.isVerified}
              isExclusive={model.isExclusive}
              lastActiveAt={model.lastActiveAt?.toISOString() ?? null}
              rates={widgetRates.length > 0 ? widgetRates : ratesTable.map((r, i) => ({
                label: r.label,
                durationMin: (i + 1) * 60,
                incallPrice: r.incall,
                outcallPrice: r.outcall,
              }))}
            />
          </div>
        </div>

        {/* Content sections */}
        <div className="content-sections">
          {/* BIO */}
          {model.bio && (
            <>
              <p className="section-label">About</p>
              <div className="bio-text">{model.bio}</div>
            </>
          )}

          {/* ABOUT — stats grid */}
          {aboutStats.length > 0 && (
            <>
              <p className="section-label">Details</p>
              <div className="about-grid">
                {aboutStats.map(s => (
                  <div key={s.label} className="about-cell">
                    <p className="about-lbl">{s.label}</p>
                    <p className="about-val">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* LOCATION */}
          {(primaryDistrict || model.nearestStation) && (
            <>
              <p className="section-label">Location</p>
              <div className="loc-block">
                {allDistricts && <p className="loc-main">📍 {allDistricts}</p>}
                {model.nearestStation && (
                  <p className="loc-station">Nearest Station: {model.nearestStation}</p>
                )}
              </div>
            </>
          )}

          {/* RATES TABLE */}
          {ratesTable.length > 0 && (
            <>
              <p className="section-label">Rates</p>
              <div style={{ overflowX: 'auto' }}>
                <table className="rates-table">
                  <thead>
                    <tr>
                      <th>Duration</th>
                      <th>Incall</th>
                      <th>Outcall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratesTable.map(row => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.incall != null && row.incall > 0 ? `£${Number(row.incall).toLocaleString('en-GB')}` : 'On request'}</td>
                        <td>{row.outcall != null && row.outcall > 0 ? `£${Number(row.outcall).toLocaleString('en-GB')}` : 'On request'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SERVICES */}
          {regularServices.length > 0 && (
            <>
              <p className="section-label">Services</p>
              <div className="svc-tags">
                {regularServices.map((s: string) => (
                  <span key={s} className="svc-tag">{s}</span>
                ))}
              </div>
            </>
          )}

          {/* EXTRAS */}
          {(extras.length > 0 || doublePriceServices.length > 0 || poaServices.length > 0) && (
            <>
              <p className="section-label">Extras</p>
              <div className="extras-list">
                {extras.map(e => (
                  <span key={e.name} className="extra-item">
                    {e.name}<span className="extra-price">+£{e.price}</span>
                  </span>
                ))}
                {doublePriceServices.map((name: string) => (
                  <span key={name} className="extra-item">
                    {name}<span className="extra-price">{lowestPrice ? `From £${lowestPrice * 2}` : 'Double rate'}</span>
                  </span>
                ))}
                {poaServices.map((name: string) => (
                  <span key={name} className="extra-item">
                    {name}<span className="extra-price">POA</span>
                  </span>
                ))}
              </div>
            </>
          )}

          {/* WARDROBE */}
          {model.wardrobe?.length > 0 && (
            <>
              <p className="section-label">Wardrobe</p>
              <div className="wardrobe-tags">
                {model.wardrobe.map((w: string) => (
                  <span key={w} className="wardrobe-tag">{w}</span>
                ))}
              </div>
            </>
          )}

          {/* DUO PARTNERS */}
          {duoPartners.length > 0 && (
            <>
              <p className="section-label">Duo Available</p>
              <div className="duo-grid">
                {duoPartners.map((dp: any) => (
                  <Link key={dp.slug} href={`/companions/${dp.slug}`} className="duo-card">
                    <p className="duo-name">{dp.name}</p>
                    {dp.tagline && <p className="duo-tagline">{dp.tagline}</p>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* DISCLAIMER */}
        <div className="disclaimer">
          All services are for companionship only.<br />
          Any activities between consenting adults are a matter of personal choice.
        </div>

        <Link href="/companions" className="back-link">← All Companions</Link>

        {/* SIMILAR COMPANIONS */}
        {similarModels.length > 0 && (
          <section className="similar-section">
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28, fontWeight: 300, color: '#FAFAFA', margin: 0,
            }}>
              Discover
            </h3>
            <div className="similar-grid">
              {similarModels.map((sim: any) => {
                const simPhoto = sim.media[0]?.url ?? null
                const simPrice = sim.modelRates?.[0]?.incallPrice
                  ? Number(sim.modelRates[0].incallPrice)
                  : similarPrices[sim.id] ?? null

                return (
                  <ModelCard
                    key={sim.id}
                    name={sim.name}
                    slug={sim.slug}
                    tagline={sim.tagline}
                    coverPhotoUrl={simPhoto}
                    availability={sim.availability}
                    isVerified={sim.isVerified}
                    isExclusive={sim.isExclusive}
                    districtName={null}
                    minIncallPrice={simPrice}
                  />
                )
              })}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  )
}
