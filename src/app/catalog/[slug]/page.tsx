// @ts-nocheck
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BookingForm } from '@/components/booking/BookingForm'
// GalleryViewer kept for lightbox — drag gallery rendered inline
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        :root {
          --gold: #c9a84c;
          --gold-dim: rgba(201,168,76,0.12);
          --black: #0a0a0a;
          --dark: #111111;
          --card: #161616;
          --border: rgba(255,255,255,0.07);
          --text: #e8e0d4;
          --muted: rgba(232,224,212,0.42);
        }

        .profile-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--black);
          color: var(--text);
          min-height: 100vh;
        }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* ── HERO ── */
        .hero {
          position: relative;
          height: 100vh;
          min-height: 640px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          transition: transform 8s ease;
        }
        .hero:hover .hero-bg { transform: scale(1.03); }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10,10,10,0.15) 0%,
            rgba(10,10,10,0.0) 35%,
            rgba(10,10,10,0.0) 50%,
            rgba(10,10,10,0.72) 78%,
            rgba(10,10,10,1.0) 100%
          );
        }
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          padding: 0 64px 72px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
        }
        .hero-left { animation: fadeUp .9s ease both; }
        .hero-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 18px;
          animation: fadeUp .9s .2s ease both;
          flex-shrink: 0;
        }
        .avail-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 14px;
        }
        .avail-line {
          display: inline-block;
          width: 32px;
          height: 1px;
          background: var(--gold);
          opacity: 0.6;
        }
        .hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(64px, 8vw, 110px);
          font-weight: 300;
          color: #fff;
          margin: 0;
          line-height: 0.92;
          letter-spacing: -.01em;
        }
        .hero-sub {
          margin-top: 14px;
          font-size: 11px;
          letter-spacing: .14em;
          color: rgba(255,255,255,0.38);
          text-transform: uppercase;
        }
        .hero-attrs {
          display: flex;
          gap: 24px;
          font-size: 11px;
          letter-spacing: .1em;
          color: rgba(255,255,255,0.35);
        }
        .hero-attrs span { color: rgba(255,255,255,0.6); }
        .btn-hero {
          display: inline-block;
          padding: 17px 44px;
          background: var(--gold);
          color: #080808;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .22em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background .3s, transform .3s;
        }
        .btn-hero:hover { background: #d4b45a; transform: translateY(-2px); }
        .scroll-hint {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 8px;
          letter-spacing: .28em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
          animation: fadeIn 2s 1.2s ease both;
        }
        .scroll-line {
          width: 1px;
          height: 36px;
          background: var(--gold);
          animation: scrollLine 2.2s ease infinite;
        }
        @keyframes scrollLine {
          0%   { transform: scaleY(0); transform-origin: top; }
          50%  { transform: scaleY(1); transform-origin: top; }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        /* ── GALLERY DRAG ── */
        .gallery-section {
          padding: 100px 0 100px 64px;
          overflow: hidden;
        }
        .section-label {
          font-size: 9px;
          letter-spacing: .3em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 40px;
        }
        .gallery-track {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-right: 64px;
          scrollbar-width: none;
          cursor: grab;
          -webkit-overflow-scrolling: touch;
        }
        .gallery-track::-webkit-scrollbar { display: none; }
        .gallery-track.grabbing { cursor: grabbing; }
        .gallery-item {
          flex-shrink: 0;
          width: 300px;
          height: 420px;
          overflow: hidden;
          position: relative;
        }
        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          transition: transform .7s ease;
          pointer-events: none;
          display: block;
        }
        .gallery-item:hover img { transform: scale(1.05); }
        .gallery-hint {
          margin-top: 20px;
          padding-right: 64px;
          font-size: 9px;
          letter-spacing: .18em;
          color: var(--muted);
          text-align: right;
          text-transform: uppercase;
        }

        /* ── INTRO ── */
        .intro-section {
          padding: 0 64px 100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        .intro-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          line-height: 1.65;
          font-style: italic;
          color: var(--text);
          border-left: 1px solid var(--gold);
          padding-left: 36px;
          opacity: 0.9;
        }
        .intro-attrs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        .attr-cell {
          background: var(--dark);
          padding: 22px 24px;
        }
        .attr-lbl {
          font-size: 8px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: #5a5450;
          margin-bottom: 7px;
        }
        .attr-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px;
          font-weight: 300;
          color: var(--text);
        }

        /* ── BOOKING SECTION ── */
        .booking-outer {
          padding: 0 64px 100px;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 64px;
          align-items: start;
        }
        .booking-left-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 28px;
          margin-bottom: 0;
        }
        .booking-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px;
          font-weight: 300;
          color: var(--text);
          margin: 0 0 6px;
        }
        .booking-subtitle {
          font-size: 10px;
          letter-spacing: .14em;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* ── PANEL ── */
        .booking-panel {
          background: var(--dark);
          border: 1px solid var(--border);
          padding: 36px 32px;
          position: sticky;
          top: 32px;
        }
        .panel-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 300;
          margin: 0 0 10px;
        }

        /* ── EXPERIENCES ── */
        .exp-section { padding: 0 64px 100px; }
        .exp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          margin-top: 40px;
        }
        .exp-category {
          background: var(--dark);
          padding: 36px 32px;
        }
        .exp-cat-title {
          font-size: 9px;
          letter-spacing: .25em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .exp-list { list-style: none; padding: 0; margin: 0; }
        .exp-list li {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 300;
          color: var(--text);
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          line-height: 1.3;
        }
        .exp-list li:last-child { border-bottom: none; }
        .exp-more-btn {
          margin-top: 20px;
          font-size: 9px;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--gold);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: gap .3s;
        }
        .exp-more-btn:hover { gap: 14px; }
        .exp-hidden { display: none; }
        .exp-hidden.open { display: block; }

        /* ── ASSURANCE ── */
        .assurance-section {
          border-top: 1px solid var(--border);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
        }
        .assurance-item {
          background: var(--black);
          padding: 56px 48px;
          text-align: center;
        }
        .assurance-glyph {
          font-size: 22px;
          color: var(--gold);
          margin-bottom: 20px;
          display: block;
        }
        .assurance-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: var(--text);
          margin-bottom: 12px;
        }
        .assurance-desc {
          font-size: 11px;
          letter-spacing: .06em;
          line-height: 1.9;
          color: var(--muted);
        }

        /* ── BACK ── */
        .back-link {
          display: block;
          text-align: center;
          padding: 48px;
          font-size: 10px;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #5a5450;
          text-decoration: none;
          transition: color .2s;
        }
        .back-link:hover { color: var(--gold); }

        /* ── STICKY MOBILE CTA ── */
        .sticky-cta {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 12px 20px 20px;
          background: linear-gradient(to top, rgba(10,10,10,1) 60%, transparent);
          display: none;
        }
        @media (max-width: 1024px) { .sticky-cta { display: block; } }

        /* ── TAG ── */
        .tag {
          display: inline-block;
          padding: 5px 14px;
          border: 1px solid rgba(201,168,76,0.2);
          color: #9a8860;
          font-size: 12px;
          letter-spacing: .04em;
          margin: 3px;
          transition: all .2s;
          cursor: default;
        }
        .tag:hover { border-color: rgba(201,168,76,0.5); color: var(--gold); }

        /* ── REVEAL ── */
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity .85s ease, transform .85s ease;
        }
        .reveal.visible { opacity: 1; transform: none; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── MOBILE ── */
        @media (max-width: 900px) {
          .hero-content { padding: 0 24px 60px; flex-direction: column; align-items: flex-start; }
          .hero-right { align-items: flex-start; }
          .gallery-section { padding: 72px 0 72px 24px; }
          .gallery-item { width: 240px; height: 340px; }
          .gallery-hint { padding-right: 24px; }
          .intro-section { grid-template-columns: 1fr; padding: 0 24px 72px; gap: 48px; }
          .booking-outer { grid-template-columns: 1fr; padding: 0 24px 72px; }
          .booking-panel { position: static; }
          .exp-section { padding: 0 24px 72px; }
          .exp-grid { grid-template-columns: 1fr; }
          .assurance-section { grid-template-columns: 1fr; }
          .assurance-item { padding: 40px 32px; }
        }
      `}</style>

      {/* Scripts for interactivity — gallery drag, reveal, exp toggle */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Gallery drag
          const track = document.getElementById('galleryTrack');
          if (track) {
            let isDown = false, startX, scrollLeft;
            track.addEventListener('mousedown', e => {
              isDown = true; track.classList.add('grabbing');
              startX = e.pageX - track.offsetLeft;
              scrollLeft = track.scrollLeft;
            });
            ['mouseleave','mouseup'].forEach(ev => track.addEventListener(ev, () => {
              isDown = false; track.classList.remove('grabbing');
            }));
            track.addEventListener('mousemove', e => {
              if (!isDown) return;
              e.preventDefault();
              track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 1.4;
            });
          }

          // Scroll reveal
          const observer = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
          }, { threshold: 0.08 });
          document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

          // Experiences toggle
          window.toggleExp = function() {
            const more = document.getElementById('expMore');
            const btn = document.getElementById('expMoreBtn');
            if (!more || !btn) return;
            more.classList.toggle('open');
            btn.textContent = more.classList.contains('open') ? 'Show less ←' : 'Show all experiences →';
          };
        });
      ` }} />

      <div className="profile-root">
        <Header />

        {/* ── HERO ── */}
        {primaryPhoto && (
          <section className="hero">
            <div
              className="hero-bg"
              style={{ backgroundImage: `url('${primaryPhoto}')` }}
            />
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-left">
                <div className="avail-badge">
                  <span className="avail-line" />
                  Available in London
                </div>
                <h1 className="serif hero-name">{model.name}</h1>
                {stats && (
                  <p className="hero-sub">
                    {[stats.age && `${stats.age} yrs`, stats.nationality, 'London'].filter(Boolean).join('  ·  ')}
                  </p>
                )}
              </div>
              <div className="hero-right">
                {stats && (
                  <div className="hero-attrs">
                    {stats.height && <span>{stats.height} cm</span>}
                    {stats.bustSize && <span>{stats.bustSize}</span>}
                    {stats.hairColour && <span>{stats.hairColour} hair</span>}
                  </div>
                )}
                <a href="#booking" className="btn-hero">Arrange a Meeting</a>
              </div>
            </div>
            <div className="scroll-hint">
              <div className="scroll-line" />
              Discover
            </div>
          </section>
        )}

        {/* ── DRAG GALLERY ── */}
        {gallery.length > 1 && (
          <section className="gallery-section reveal">
            <p className="section-label">Portfolio</p>
            <div className="gallery-track" id="galleryTrack">
              {gallery.map((photo: any) => (
                <div key={photo.id} className="gallery-item">
                  <img src={photo.url} alt={model.name} loading="lazy" />
                </div>
              ))}
            </div>
            <p className="gallery-hint">{gallery.length} photographs &nbsp;·&nbsp; Drag to explore</p>
          </section>
        )}

        {/* ── INTRO + PROFILE ATTRS ── */}
        {stats && (
          <section className="intro-section reveal">
            <div className="intro-text">
              {model.name} brings a rare combination of warmth and sophistication
              to every encounter. Fluent in English
              {stats.languages?.includes('Portuguese') ? ' and Portuguese' : ''},
              she creates an atmosphere of genuine connection where every detail
              is attended to with complete discretion and care.
            </div>
            <div className="intro-attrs">
              {[
                ['Age', stats.age ? `${stats.age}` : null],
                ['Height', stats.height ? `${stats.height} cm` : null],
                ['Figure', stats.weight ? `${stats.weight} kg · ${stats.bustSize || ''}` : stats.bustSize || null],
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

        {/* ── BOOKING ── */}
        <section className="booking-outer reveal" id="booking">
          {/* Left: heading only */}
          <div>
            <div className="booking-left-header">
              <h2 className="serif booking-title">Arrange a Meeting</h2>
              <p className="booking-subtitle">Confirmation within 30 minutes</p>
            </div>
          </div>

          {/* Right: panel */}
          <div className="booking-panel">
            <h3 className="serif panel-name">{model.name}</h3>
            <div className="avail-badge" style={{ marginBottom: 24 }}>
              <span className="avail-line" />
              Available in London
            </div>

            {stats && (
              <div style={{ display: 'flex', gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {stats.age && (
                  <div>
                    <p style={{ fontSize: 8, letterSpacing: '.2em', color: '#5a5450', marginBottom: 4, textTransform: 'uppercase' }}>Age</p>
                    <p style={{ fontSize: 15, color: 'var(--text)', margin: 0 }}>{stats.age}</p>
                  </div>
                )}
                {stats.height && (
                  <div>
                    <p style={{ fontSize: 8, letterSpacing: '.2em', color: '#5a5450', marginBottom: 4, textTransform: 'uppercase' }}>Height</p>
                    <p style={{ fontSize: 15, color: 'var(--text)', margin: 0 }}>{stats.height} cm</p>
                  </div>
                )}
                {stats.bustSize && (
                  <div>
                    <p style={{ fontSize: 8, letterSpacing: '.2em', color: '#5a5450', marginBottom: 4, textTransform: 'uppercase' }}>Bust</p>
                    <p style={{ fontSize: 15, color: 'var(--text)', margin: 0 }}>{stats.bustSize}</p>
                  </div>
                )}
              </div>
            )}

            <BookingForm model={{ id: model.id, name: model.name, rates }} />

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                ['◈', 'Confirmed within 30 minutes'],
                ['◉', '100% discreet & confidential'],
                ['✦', 'Verified authentic profile'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '9px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--gold)', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 11, color: '#5a5450', letterSpacing: '.04em' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXPERIENCES ── */}
        {cleanedServices.length > 0 && (
          <section className="exp-section reveal">
            <p className="section-label">Experiences</p>
            <div className="exp-grid">

              {/* Connection */}
              <div className="exp-category">
                <p className="exp-cat-title">Connection</p>
                <ul className="exp-list">
                  {cleanedServices
                    .filter((s: any) => ['Girlfriend Experience','Deep French kissing','French kissing','Dirty Talk','Roleplay'].includes(s.displayTitle))
                    .map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)
                  }
                </ul>
              </div>

              {/* Touch */}
              <div className="exp-category">
                <p className="exp-cat-title">Touch & Wellness</p>
                <ul className="exp-list">
                  {cleanedServices
                    .filter((s: any) => ['Body to Body Massage','Erotic Massage','Massage','Lapdancing','Striptease','Face Sitting','Foot Fetish'].includes(s.displayTitle))
                    .map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)
                  }
                </ul>
              </div>

              {/* Specialities */}
              <div className="exp-category">
                <p className="exp-cat-title">Specialities</p>
                <ul className="exp-list">
                  {cleanedServices
                    .filter((s: any) => ['Uninhibited experience','Tie and Tease','Light Domination','Smoking Fetish','Toys'].includes(s.displayTitle))
                    .map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)
                  }
                </ul>
                {/* Hidden extras */}
                <div className="exp-hidden" id="expMore">
                  <ul className="exp-list" style={{ marginTop: 0 }}>
                    {cleanedServices
                      .filter((s: any) => !['Girlfriend Experience','Deep French kissing','French kissing','Dirty Talk','Roleplay','Body to Body Massage','Erotic Massage','Massage','Lapdancing','Striptease','Face Sitting','Foot Fetish','Uninhibited experience','Tie and Tease','Light Domination','Smoking Fetish','Toys'].includes(s.displayTitle))
                      .map((s: any) => <li key={s.slug}>{s.displayTitle}</li>)
                    }
                  </ul>
                </div>
                <button className="exp-more-btn" id="expMoreBtn" onClick={() => (window as any).toggleExp?.()}>
                  Show all experiences →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── ASSURANCE ── */}
        <section className="assurance-section reveal">
          <div className="assurance-item">
            <span className="assurance-glyph">◈</span>
            <div className="assurance-title">Absolute Discretion</div>
            <p className="assurance-desc">Your privacy is our highest priority. All enquiries and arrangements remain strictly confidential.</p>
          </div>
          <div className="assurance-item">
            <span className="assurance-glyph">◉</span>
            <div className="assurance-title">Verified Authentic</div>
            <p className="assurance-desc">Every profile on Virel is personally verified. The photographs and information you see are genuine.</p>
          </div>
          <div className="assurance-item">
            <span className="assurance-glyph">✦</span>
            <div className="assurance-title">30-Minute Response</div>
            <p className="assurance-desc">All enquiries are acknowledged within 30 minutes. We respect your time as much as your privacy.</p>
          </div>
        </section>

        <Link href="/london-escorts" className="back-link reveal">← All Companions</Link>

        {/* ── STICKY MOBILE CTA ── */}
        <div className="sticky-cta">
          <a href="#booking" style={{
            display: 'block',
            background: 'var(--gold)',
            color: '#080808',
            textAlign: 'center',
            padding: '16px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: '.12em',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}>
            Arrange a Meeting with {model.name}
          </a>
        </div>

        <Footer />
      </div>
    </>
  )
}
