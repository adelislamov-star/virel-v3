// @ts-nocheck
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
import { sortRates } from '@/lib/sortRates'
import { durationLabel } from '@/lib/durationLabel'
import { DragGallery, ExpToggle, RevealInit, ServiceTagsCollapse } from '@/components/profile/ProfileInteractive'
import { StickyBookBar } from '@/components/profile/StickyBookBar'
import { prisma } from '@/lib/db/client'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const model = await prisma.model.findUnique({ where: { slug: params.slug } })
  if (!model) return { title: 'Not Found' }
  return {
    title: `${model.name} — London Companion | Virel`,
    description: `${model.name} is a premium verified companion available in London for incall and outcall. Discreet, sophisticated, available now.`,
    alternates: { canonical: `https://virel-v3.vercel.app/companions/${params.slug}` },
  }
}

const SERVICE_REMAP: Record<string, string> = {
  // Explicit acts → discreet names
  'COB (Cum on body)': 'Finishing on body',
  'CIF (Cum in face)': 'Finishing on face',
  'OWC (Blow job with condom)': 'Protected oral',
  'OWO (Blow job without condom)': 'Oral without protection',
  'DT (Deep throat)': 'Deep throat',
  'A-Level (Anal sex)': 'A-level',
  'A-Level': 'A-level',
  'A-LEVEL (ANAL SEX)': 'A-level',
  '69': '69',
  'CIF (Cum in Face)': 'Finishing on face',
  'COF (Cum on face)': 'Finishing on face',
  // Acronyms → readable
  'DFK (Deep French kissing with tongue)': 'Deep French kissing',
  'FK (French kissing without tongue)': 'French kissing',
  'GFE': 'Girlfriend Experience',
  'PSE (Porn Star Experience)': 'Uninhibited experience',
  'PSE': 'Uninhibited experience',
  // Group experiences
  'MMF for double price (Male-Male-Female)': 'MMF duo (double rate)',
  'MMF (Male-Male-Female)': 'MMF duo',
  'Bi DUO (lesbian show)': 'Bi duo experience',
  'Couples (includes Bi services)': 'Couples experience',
  'Couples (Includes Bi Services)': 'Couples experience',
  'Couples (includes bi services)': 'Couples experience',
  'DUO (ladies serve client)': 'Duo — ladies serve',
  // Body acts → neutral
  'Rimming Receiving (licking anal hole of lady)': 'Rimming receiving',
  'Rimming Giving (licking anal hole of client)': 'Rimming giving',
  'Squirting': 'Squirting',
  'Fisting': 'Fisting',
  'Watersports (giving)': 'Watersports — giving',
  'Watersports (receiving)': 'Watersports — receiving',
  'Striptease/Lapdance': 'Striptease & lapdance',
}

const CONNECTION_TAGS = ['Girlfriend Experience','Deep French kissing','French kissing','Dirty Talk','Roleplay']
const TOUCH_TAGS = ['Body to Body Massage','Erotic Massage','Massage','Lapdancing','Striptease','Face Sitting','Foot Fetish']
const SPECIAL_TAGS = ['Uninhibited experience','Tie and Tease','Light Domination','Smoking Fetish','Toys']

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

  // Organize rates by call_type for table display (3.2)
  const incallRates = rates.filter((r: any) => r.call_type === 'incall')
  const outcallRates = rates.filter((r: any) => r.call_type === 'outcall')
  // Merge into unified table rows — durations derived from DB, sorted via shared utility
  const allDurations = sortRates(
    [...new Set(rates.map((r: any) => r.duration_type))].map(d => ({ duration_type: d }))
  ).map(d => d.duration_type)
  const ratesTable = allDurations.map(dur => ({
    duration: dur,
    label: durationLabel(dur),
    incall: incallRates.find((r: any) => r.duration_type === dur)?.price,
    outcall: outcallRates.find((r: any) => r.duration_type === dur)?.price,
  }))

  // Fetch similar models (3.4) — same nationality or random, exclude current
  let similarModels: any[] = []
  try {
    similarModels = await prisma.model.findMany({
      where: {
        status: 'active',
        visibility: 'public',
        id: { not: model.id },
        ...(stats?.nationality ? { stats: { nationality: stats.nationality } } : {}),
      },
      include: {
        stats: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
    // If not enough with same nationality, fill with random
    if (similarModels.length < 3) {
      const existingIds = [model.id, ...similarModels.map((m: any) => m.id)]
      const more = await prisma.model.findMany({
        where: {
          status: 'active',
          visibility: 'public',
          id: { notIn: existingIds },
        },
        include: {
          stats: true,
          media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        },
        take: 3 - similarModels.length,
        orderBy: { createdAt: 'desc' },
      })
      similarModels = [...similarModels, ...more]
    }
  } catch (e) {}

  // Fetch min prices for similar models
  let similarPrices: Record<string, number> = {}
  try {
    const simIds = similarModels.map((m: any) => m.id)
    if (simIds.length > 0) {
      const simRates: any[] = await prisma.$queryRaw`
        SELECT model_id, MIN(price) as min_price
        FROM model_rates
        WHERE model_id = ANY(${simIds}::text[]) AND is_active = true
        GROUP BY model_id
      `
      for (const r of simRates) {
        similarPrices[r.model_id] = Number(r.min_price)
      }
    }
  } catch (e) {}

  const cleanedServices = services.map((s: any) => ({
    ...s,
    displayTitle: SERVICE_REMAP[s.title] || s.title,
  }))

  const connSvcs = cleanedServices.filter((s: any) => CONNECTION_TAGS.includes(s.displayTitle))
  const touchSvcs = cleanedServices.filter((s: any) => TOUCH_TAGS.includes(s.displayTitle))
  const specialSvcs = cleanedServices.filter((s: any) => SPECIAL_TAGS.includes(s.displayTitle))
  const extraSvcs = cleanedServices.filter((s: any) =>
    !CONNECTION_TAGS.includes(s.displayTitle) &&
    !TOUCH_TAGS.includes(s.displayTitle) &&
    !SPECIAL_TAGS.includes(s.displayTitle)
  )

  const galleryPhotos = gallery.map((p: any, i: number) => ({
    id: p.id,
    url: p.url,
    alt: `${model.name} — London companion, photograph ${i + 1}`,
  }))

  const profileSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: model.name,
        url: `https://virel-v3.vercel.app/companions/${model.slug}`,
        image: primaryPhoto || undefined,
        description: `${model.name} is a premium verified companion available in London.`,
        jobTitle: 'Companion',
        worksFor: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
        address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
      },
      {
        '@type': 'Service',
        name: `${model.name} — London Escort`,
        url: `https://virel-v3.vercel.app/companions/${model.slug}`,
        provider: { '@type': 'Organization', name: 'Virel', url: 'https://virel-v3.vercel.app' },
        areaServed: { '@type': 'City', name: 'London' },
        ...(lowestPrice ? { offers: { '@type': 'Offer', price: lowestPrice, priceCurrency: 'GBP', availability: 'https://schema.org/InStock' } } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://virel-v3.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'Companions', item: 'https://virel-v3.vercel.app/london-escorts' },
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
        .serif { font-family:'Cormorant Garamond',Georgia,serif; }

        /* HERO — split layout (3.1) */
        .hero-split { display:flex; min-height:100vh; position:relative; align-items:stretch; }
        .hero-photo { width:60%; position:relative; overflow:hidden; min-height:100vh; }
        .hero-photo img { width:100%; height:100%; object-fit:cover; object-position:center 15%; }
        .hero-info { width:40%; display:flex; flex-direction:column; justify-content:center; padding:120px 56px 80px; animation:fadeUp .9s ease both; }
        .hero-name { font-family:'Cormorant Garamond',serif; font-size:clamp(48px,6vw,80px); font-weight:300; color:#f5f0e8; margin:0 0 12px; line-height:.95; letter-spacing:-.01em; }
        .hero-sub { font-size:12px; letter-spacing:.12em; color:rgba(255,255,255,.4); text-transform:uppercase; margin:0 0 28px; }
        .hero-price { font-family:'Cormorant Garamond',serif; font-size:27px; letter-spacing:.03em; color:#C5A572; margin:0 0 32px; font-weight:300; line-height:1; }
        .hero-divider { width:48px; height:1px; background:rgba(255,255,255,.1); margin:0 0 32px; }
        .btn-hero { display:inline-block; padding:17px 44px; background:var(--gold); color:#080808; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:.22em; text-transform:uppercase; text-decoration:none; border:none; cursor:pointer; transition:background .3s,transform .3s; text-align:center; align-self:flex-start; }
        .btn-hero:hover { background:#d4b45a; transform:translateY(-2px); }
        .hero-trust { margin-top:28px; display:flex; flex-direction:column; gap:8px; }
        .hero-trust-item { font-size:11px; letter-spacing:.08em; color:rgba(255,255,255,.35); display:flex; align-items:center; gap:10px; }
        .hero-trust-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; flex-shrink:0; }

        /* GALLERY */
        .gallery-section { padding:120px 0 120px 80px; overflow:hidden; }
        .gallery-track { display:flex; gap:16px; overflow-x:auto; padding-right:80px; scrollbar-width:none; cursor:grab; -webkit-overflow-scrolling:touch; user-select:none; }
        .gallery-track::-webkit-scrollbar { display:none; }
        .gallery-track.grabbing { cursor:grabbing; }
        .gallery-item { flex-shrink:0; width:300px; height:420px; overflow:hidden; }
        .gallery-item img { width:100%; height:100%; object-fit:cover; object-position:top; transition:transform .7s ease; pointer-events:none; display:block; }
        .gallery-item:hover img { transform:scale(1.05); }
        .gallery-hint { margin-top:20px; padding-right:80px; font-size:9px; letter-spacing:.18em; color:var(--muted); text-align:right; text-transform:uppercase; }

        /* SECTION LABEL */
        .section-label { font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:var(--muted); margin-bottom:40px; }

        /* INTRO */
        .intro-section { padding:0 80px 120px; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:start; }
        .intro-text { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:300; line-height:1.65; color:var(--text); border-left:1px solid var(--border); padding-left:36px; }
        .intro-attrs { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--border); }
        .attr-cell { background:var(--dark); padding:22px 24px; }
        .attr-lbl { font-size:8px; letter-spacing:.22em; text-transform:uppercase; color:#5a5450; margin-bottom:7px; }
        .attr-val { font-family:'Cormorant Garamond',serif; font-size:19px; font-weight:300; color:var(--text); }

        /* BOOKING */
        .booking-outer { padding:0 80px 120px; }
        .booking-header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:56px; border-bottom:1px solid var(--border); padding-bottom:24px; }
        .booking-title { font-family:'Cormorant Garamond',serif; font-size:48px; font-weight:300; font-style:italic; color:var(--white); margin:0; }
        .booking-subtitle { font-size:10px; letter-spacing:.15em; color:var(--muted); text-transform:uppercase; }
        .booking-left-header { display:none; }
        .booking-left-intro { display:none; }
        .booking-guarantees { display:none; }
        .booking-panel { background:transparent; border:none; padding:0; position:static; }
        .panel-name { display:none; }

        /* EXPERIENCES */
        .exp-section { padding:0 80px 120px; }
        .exp-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--border); margin-top:40px; }
        .exp-category { background:var(--dark); padding:36px 32px; }
        .exp-cat-title { font-size:9px; letter-spacing:.25em; text-transform:uppercase; color:var(--muted); margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--border); }
        .exp-list { list-style:none; padding:0; margin:0; }
        .exp-list li { font-family:'Cormorant Garamond',serif; font-size:17px; font-weight:300; color:var(--text); padding:6px 0; border-bottom:1px solid rgba(255,255,255,.04); line-height:1.3; }
        .exp-list li:last-child { border-bottom:none; }
        .exp-more-btn { margin-top:20px; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); cursor:pointer; background:none; border:none; font-family:'DM Sans',sans-serif; padding:0; display:inline-flex; align-items:center; gap:8px; transition:gap .3s; }
        .exp-more-btn:hover { gap:14px; }

        /* ASSURANCE */
        .assurance-section { border-top:1px solid var(--border); display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
        .assurance-item { background:var(--black); padding:56px 48px; text-align:center; }
        .assurance-glyph { font-size:22px; color:var(--muted); margin-bottom:20px; display:block; }
        .assurance-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:300; color:var(--text); margin-bottom:12px; }
        .assurance-desc { font-size:11px; letter-spacing:.06em; line-height:1.9; color:var(--muted); }

        /* RATES TABLE (3.2) */
        .rates-section { padding:0 80px 120px; }
        .rates-table { width:100%; max-width:900px; border-collapse:collapse; table-layout:fixed; }
        .rates-table col:nth-child(1) { width:50%; }
        .rates-table col:nth-child(2), .rates-table col:nth-child(3) { width:25%; }
        .rates-table thead th { padding:12px 0; text-align:left; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#808080; font-weight:400; border-bottom:1px solid #2A2A2A; }
        .rates-table thead th:not(:first-child) { text-align:right; padding-left:16px; }
        .rates-table tbody td { padding:16px 0; border-bottom:1px solid #1A1A1A; }
        .rates-table tbody td:first-child { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; color:var(--text); }
        .rates-table tbody td:not(:first-child) { text-align:right; font-size:14px; color:#C5A572; letter-spacing:.04em; padding-left:16px; }

        /* SERVICE TAGS (3.3) */
        .service-section { padding:0 64px 80px; }
        .service-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:24px; }
        .service-tag { display:inline-block; padding:6px 14px; border:1px solid #2A2A2A; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#808080; text-decoration:none; transition:border-color .2s, color .2s; }
        .service-tag:hover { border-color:var(--white); color:var(--white); }
        .service-more-btn { display:inline-block; padding:6px 14px; border:1px solid #2A2A2A; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#808080; background:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:border-color .2s,color .2s; }
        .service-more-btn:hover { border-color:var(--white); color:var(--white); }

        /* SIMILAR COMPANIONS (3.4) */
        .similar-section { padding:120px 80px; border-top:1px solid #1A1A1A; }
        .similar-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:40px; }
        .sim-card { position:relative; aspect-ratio:3/4; overflow:hidden; background:#111; display:block; text-decoration:none; }
        .sim-card img { width:100%; height:100%; object-fit:cover; transition:transform 1s cubic-bezier(.25,.46,.45,.94); filter:grayscale(10%); }
        .sim-card:hover img { transform:scale(1.06); filter:grayscale(0%); }
        .sim-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.9) 0%,transparent 55%); }
        .sim-content { position:absolute; bottom:0; left:0; right:0; padding:28px 24px; }
        .sim-name { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:300; color:#fff; margin:0 0 4px; }
        .sim-meta { font-size:10px; letter-spacing:.1em; color:rgba(255,255,255,.4); text-transform:uppercase; margin:0; }
        .sim-price { font-size:12px; letter-spacing:.05em; text-transform:uppercase; color:#C5A572; margin:6px 0 0; }

        /* BACK */
        .back-link { display:block; text-align:center; padding:48px; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#5a5450; text-decoration:none; transition:color .2s; }
        .back-link:hover { color:var(--white); }

        /* REVEAL — only hides when JS is confirmed running */
        body.js-ready .reveal { opacity:0; transform:translateY(18px); transition:opacity .75s ease,transform .75s ease; }
        body.js-ready .reveal.visible { opacity:1; transform:none; }

        /* ANIMATIONS */
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* MOBILE */
        @media (max-width:900px) {
          .hero-split { flex-direction:column; min-height:auto; }
          .hero-photo { width:100%; height:60vh; min-height:400px; }
          .hero-info { width:100%; padding:40px 24px 48px; }
          .gallery-section { padding:80px 0 80px 24px; }
          .gallery-item { width:240px; height:340px; }
          .gallery-hint { padding-right:24px; }
          .intro-section { grid-template-columns:1fr; padding:0 24px 80px; gap:48px; }
          .rates-section { padding:0 24px 80px; }
          .service-section { padding:0 24px 80px; }
          .booking-outer { padding:0 24px 80px; }
          .booking-header { flex-direction:column; gap:8px; }
          .booking-panel { position:static; }
          .exp-section { padding:0 24px 80px; }
          .exp-grid { grid-template-columns:1fr; }
          .assurance-section { grid-template-columns:1fr; }
          .assurance-item { padding:40px 32px; }
          .similar-section { padding:80px 24px; }
          .similar-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:600px) {
          .similar-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="profile-root">
        <Header />
        <RevealInit />

        {/* ── HERO — split layout (3.1) ── */}
        <section className="hero-split">
          <div className="hero-photo">
            {primaryPhoto
              ? <Image fill src={primaryPhoto} alt={model.name} style={{ objectFit: 'cover', objectPosition: 'center 15%' }} sizes="60vw" priority />
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#111,#1a1a1a)' }} />
            }
          </div>
          <div className="hero-info">
            <h1 className="hero-name">{model.name}</h1>
            {stats && (
              <p className="hero-sub">
                {[stats.age, stats.nationality].filter(Boolean).join(' · ')}
              </p>
            )}
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 17,
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'rgba(232,224,212,0.32)',
              letterSpacing: '0.03em',
              margin: '0 0 28px',
              lineHeight: 1.6,
            }}>
              An evening that begins where ordinary ends
            </p>
            <div className="hero-divider" />
            {lowestPrice && (
              <p className="hero-price">From £{lowestPrice.toLocaleString('en-GB')}/hour</p>
            )}
            <a href="#booking" className="btn-hero">Book Now</a>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <span className="hero-trust-dot" />
                Available Now
              </div>
              <div className="hero-trust-item">
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>◆</span>
                Confirmed in 30 min
              </div>
            </div>
          </div>
        </section>
        {/* Sticky bar — observes .btn-hero, only appears after hero Book Now scrolls out of view */}
        <StickyBookBar modelName={model.name} minPrice={lowestPrice} />

        {/* ── DRAG GALLERY ── */}
        {galleryPhotos.length > 1 && (
          <section className="gallery-section reveal">
            <p className="section-label">Portfolio</p>
            <DragGallery photos={galleryPhotos} modelName={model.name} />
            <p className="gallery-hint">{galleryPhotos.length} photographs &nbsp;·&nbsp; Drag to explore</p>
          </section>
        )}

        {/* ── INTRO + ATTRS ── */}
        {stats && (
          <section className="intro-section reveal">
            <div className="intro-text">
              {(model as any).bio ? (
                (model as any).bio
              ) : (
                <>
                  {model.name} brings a rare combination of warmth and sophistication
                  to every encounter. Fluent in English
                  {stats.languages?.includes('Portuguese') ? ' and Portuguese' : ''},
                  she creates an atmosphere of genuine connection where every detail
                  is attended to with complete discretion and care.
                </>
              )}
            </div>
            <div className="intro-attrs">
              {[
                ['Age', stats.age ? `${stats.age}` : null],
                ['Height', stats.height ? `${stats.height} cm` : null],
                ['Figure', stats.weight ? `${stats.weight} kg · ${stats.bustSize || ''}`.trim().replace(/·\s*$/, '') : stats.bustSize || null],
                ['Hair · Eyes', [stats.hairColour, stats.eyeColour].filter(Boolean).join(' · ') || null],
                ['Nationality', stats.nationality || null],
                ['Languages', stats.languages?.length ? stats.languages.join(', ') : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="attr-cell">
                  <p className="attr-lbl">{label}</p>
                  <p className="attr-val">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── RATES TABLE (3.2) ── */}
        {ratesTable.length > 0 && (
          <section className="rates-section reveal">
            <p className="section-label">Rates</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="rates-table">
                <colgroup>
                  <col className="col-dur" />
                  <col className="col-price" />
                  <col className="col-price" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Duration</th>
                    <th>Incall</th>
                    <th>Outcall</th>
                  </tr>
                </thead>
                <tbody>
                  {ratesTable.map(row => (
                    <tr key={row.duration}>
                      <td>{row.label}</td>
                      <td>{row.incall ? `£${Number(row.incall).toLocaleString('en-GB')}` : '—'}</td>
                      <td>{row.outcall ? `£${Number(row.outcall).toLocaleString('en-GB')}` : 'On request'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── SERVICE TAGS (3.3) ── */}
        {cleanedServices.length > 0 && (
          <section className="service-section reveal">
            <ServiceTagsCollapse tags={cleanedServices.map((s: any) => ({ slug: s.slug, displayTitle: s.displayTitle }))} />
          </section>
        )}

        {/* ── EXPERIENCES ── */}
        {cleanedServices.length > 0 && (
          <section className="exp-section reveal">
            <p className="section-label">Experiences</p>
            <div className="exp-grid">
              <div className="exp-category">
                <p className="exp-cat-title">Connection</p>
                <ul className="exp-list">
                  {connSvcs.map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)}
                </ul>
              </div>
              <div className="exp-category">
                <p className="exp-cat-title">Touch & Wellness</p>
                <ul className="exp-list">
                  {touchSvcs.map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)}
                </ul>
              </div>
              <div className="exp-category">
                <p className="exp-cat-title">Specialities</p>
                <ul className="exp-list">
                  {specialSvcs.map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)}
                </ul>
                {extraSvcs.length > 0 && (
                  <ExpToggle>
                    <ul className="exp-list" style={{ marginTop:0 }}>
                      {extraSvcs.map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)}
                    </ul>
                  </ExpToggle>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── BOOKING ── */}
        <section className="booking-outer reveal" id="booking">
          <div className="booking-header">
            <h2 className="serif booking-title">Arrange a Meeting</h2>
            <div className="booking-subtitle">Confirmation within 30 minutes</div>
          </div>

          <div className="booking-panel">
            <BookingForm model={{ id: model.id, name: model.name, rates }} />
          </div>
        </section>

        {/* ── ASSURANCE ── */}
        <section className="assurance-section reveal">
          {[
            ['◆','Absolute Discretion','Your privacy is our highest priority. All enquiries and arrangements remain strictly confidential.'],
            ['◆','Verified Authentic','Every profile on Virel is personally verified. The photographs and information you see are genuine.'],
            ['◆','30-Minute Response','All enquiries are acknowledged within 30 minutes. We respect your time as much as your privacy.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="assurance-item">
              <span className="assurance-glyph">{icon}</span>
              <div className="assurance-title">{title}</div>
              <p className="assurance-desc">{desc}</p>
            </div>
          ))}
        </section>

        <Link href="/london-escorts" className="back-link reveal">← All Companions</Link>

        {/* ── SIMILAR COMPANIONS (3.4) ── */}
        {similarModels.length > 0 && (
          <section className="similar-section reveal">
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              fontWeight: 300,
              color: '#FAFAFA',
              margin: 0,
            }}>
              Discover
            </h3>
            <div className="similar-grid">
              {similarModels.map((sim: any) => {
                const simPhoto = sim.media[0]?.url
                const simAge = sim.stats?.age
                const simNat = sim.stats?.nationality
                const simPrice = similarPrices[sim.id]
                return (
                  <Link key={sim.id} href={`/companions/${sim.slug}`} className="sim-card">
                    {simPhoto
                      ? <Image fill src={simPhoto} alt={sim.name} style={{ objectFit: 'cover' }} sizes="33vw" />
                      : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#111', color:'#2a2520', fontSize:40 }}>◈</div>
                    }
                    <div className="sim-overlay" />
                    <div className="sim-content">
                      <p className="sim-name">{sim.name}</p>
                      <p className="sim-meta">
                        {[simAge && `${simAge} yrs`, simNat].filter(Boolean).join(' · ')}
                      </p>
                      {simPrice && (
                        <p className="sim-price">From £{simPrice.toLocaleString('en-GB')}/hr</p>
                      )}
                    </div>
                  </Link>
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
