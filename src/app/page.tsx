// @ts-nocheck
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { FAQ } from '@/components/FAQ'
import { prisma } from '@/lib/db/client'

export const metadata = {
  title: 'London Escorts | Premium Escort Agency London | Virel',
  description: 'London\'s premier escort agency. Verified, sophisticated companions for incall and outcall. Discreet, elegant, available 24/7 across London\'s finest districts.',
  alternates: { canonical: 'https://virel-v3.vercel.app' },
}

const DISTRICTS = [
  { name: 'Mayfair', slug: 'mayfair' },
  { name: 'Kensington', slug: 'kensington' },
  { name: 'Knightsbridge', slug: 'knightsbridge' },
  { name: 'Chelsea', slug: 'chelsea' },
  { name: 'Belgravia', slug: 'belgravia' },
  { name: 'Marylebone', slug: 'marylebone' },
  { name: 'Westminster', slug: 'westminster' },
  { name: 'Soho', slug: 'soho' },
  { name: 'Canary Wharf', slug: 'canary-wharf' },
]

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .home-root { font-family: 'DM Sans', sans-serif; background: #080808; color: #ddd5c8; }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* HERO */
        .hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; overflow: hidden; padding: 120px 24px 80px; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 100% 100%, rgba(201,168,76,0.03) 0%, transparent 50%); }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px); background-size: 80px 80px; }
        .hero-line { width: 1px; height: 60px; background: linear-gradient(to bottom, transparent, rgba(201,168,76,0.6), transparent); margin: 0 auto 40px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 10px; border: 1px solid rgba(201,168,76,0.2); padding: 8px 20px; font-size: 10px; letter-spacing: .25em; color: #c9a84c; text-transform: uppercase; margin-bottom: 40px; }
        .hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #c9a84c; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(52px, 8vw, 100px); font-weight: 300; line-height: 1; letter-spacing: -.01em; color: #f0e8dc; margin: 0 0 12px; }
        .hero-title em { font-style: italic; color: #c9a84c; }
        .hero-sub { font-size: 14px; color: #6b6560; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 48px; }
        .hero-cta-primary { background: #c9a84c; color: #080808; padding: 18px 48px; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; font-weight: 500; text-decoration: none; transition: background .2s; }
        .hero-cta-primary:hover { background: #e0bf6a; }
        .hero-cta-secondary { border: 1px solid rgba(255,255,255,0.12); color: #ddd5c8; padding: 18px 48px; font-size: 12px; letter-spacing: .15em; text-transform: uppercase; text-decoration: none; transition: border-color .2s; }
        .hero-cta-secondary:hover { border-color: rgba(201,168,76,0.4); }
        .hero-stats { display: flex; gap: 60px; margin-top: 80px; padding-top: 48px; border-top: 1px solid rgba(255,255,255,0.06); }
        .hero-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: #c9a84c; display: block; }
        .hero-stat-label { font-size: 10px; letter-spacing: .18em; color: #6b6560; text-transform: uppercase; }

        /* SECTION COMMON */
        .section { padding: 100px 40px; max-width: 1280px; margin: 0 auto; }
        .section-eyebrow { font-size: 10px; letter-spacing: .25em; color: #c9a84c; text-transform: uppercase; margin-bottom: 20px; display: block; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5vw, 64px); font-weight: 300; line-height: 1.05; color: #f0e8dc; margin: 0 0 16px; }
        .section-desc { font-size: 14px; color: #6b6560; max-width: 480px; line-height: 1.8; }

        /* MODELS GRID */
        .models-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 60px; }
        @media(max-width:900px){ .models-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:600px){ .models-grid{grid-template-columns:1fr;} }

        .model-card { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; display: block; text-decoration: none; }
        .model-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.25,.46,.45,.94); filter: grayscale(15%); }
        .model-card:hover img { transform: scale(1.07); filter: grayscale(0%); }
        .model-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.3) 40%, transparent 70%); transition: background .4s; }
        .model-card:hover .model-card-overlay { background: linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.4) 50%, transparent 70%); }
        .model-card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 32px 28px; }
        .model-card-name { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: #fff; margin: 0 0 6px; letter-spacing: .02em; }
        .model-card-meta { font-size: 11px; letter-spacing: .12em; color: rgba(255,255,255,0.45); text-transform: uppercase; }
        .model-card-cta { display: inline-block; margin-top: 16px; font-size: 10px; letter-spacing: .18em; color: #c9a84c; text-transform: uppercase; border-bottom: 1px solid rgba(201,168,76,0.3); padding-bottom: 2px; opacity: 0; transform: translateY(8px); transition: opacity .3s, transform .3s; }
        .model-card:hover .model-card-cta { opacity: 1; transform: none; }

        .model-card-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); }
        .model-card-placeholder-icon { font-size: 48px; color: #2a2520; margin-bottom: 12px; }
        .model-card-placeholder-text { font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: .15em; color: #3a3530; text-transform: uppercase; }

        /* DIVIDER */
        .gold-divider { width: 60px; height: 1px; background: #c9a84c; margin: 0 auto; }

        /* TRUST */
        .trust-section { background: #0d0d0d; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 80px 40px; }
        .trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px; max-width: 960px; margin: 0 auto; text-align: center; }
        @media(max-width:700px){ .trust-grid{grid-template-columns:1fr; gap:40px;} }
        .trust-icon { font-size: 20px; color: #c9a84c; margin-bottom: 20px; letter-spacing: .1em; }
        .trust-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: #f0e8dc; margin: 0 0 12px; }
        .trust-text { font-size: 13px; color: #6b6560; line-height: 1.8; }

        /* DISTRICTS */
        .district-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(255,255,255,0.05); margin-top: 60px; border: 1px solid rgba(255,255,255,0.05); }
        @media(max-width:700px){ .district-grid{grid-template-columns:1fr 1fr;} }
        .district-item { background: #080808; padding: 28px 24px; text-decoration: none; display: flex; justify-content: space-between; align-items: center; transition: background .2s; }
        .district-item:hover { background: #0f0e0c; }
        .district-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; color: #ddd5c8; }
        .district-arrow { font-size: 14px; color: #3a3530; transition: color .2s; }
        .district-item:hover .district-arrow { color: #c9a84c; }

        /* HOW IT WORKS */
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px; margin-top: 60px; }
        @media(max-width:700px){ .how-grid{grid-template-columns:1fr; gap:40px;} }
        .how-num { font-family: 'Cormorant Garamond', serif; font-size: 72px; font-weight: 300; color: rgba(201,168,76,0.15); line-height: 1; margin-bottom: 20px; }
        .how-title { font-size: 15px; font-weight: 500; color: #ddd5c8; margin-bottom: 10px; }
        .how-text { font-size: 13px; color: #6b6560; line-height: 1.8; }

        /* FAQ */
        .faq-wrap { max-width: 720px; margin: 0 auto; }
      `}</style>

      <div className="home-root">
        <Header />

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="hero-line" />
            <div className="hero-badge">
              <span className="hero-dot" />
              London's Premier Companion Agency
            </div>
            <h1 className="hero-title">
              Elite London<br />
              <em>Escorts</em>
            </h1>
            <p className="hero-sub">Verified · Sophisticated · Discreet</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/london-escorts" className="hero-cta-primary">Browse Companions</Link>
              <Link href="/contact" className="hero-cta-secondary">Private Enquiry</Link>
            </div>
            <div className="hero-stats">
              {[
                { num: '100%', label: 'Verified' },
                { num: '24/7', label: 'Available' },
                { num: '30min', label: 'Confirmation' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <span className="hero-stat-num">{s.num}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST ── */}
        <div className="trust-section">
          <div className="trust-grid">
            {[
              { icon: '✦', title: 'Fully Verified', text: 'Every companion is personally verified. Authentic photos, real identities — guaranteed without exception.' },
              { icon: '◈', title: 'Absolute Discretion', text: 'Your privacy is our highest priority. Confidential bookings, no data sharing, total anonymity.' },
              { icon: '◉', title: 'Curated Selection', text: 'Handpicked companions across Mayfair, Chelsea, Kensington and London\'s most prestigious addresses.' },
            ].map(item => (
              <div key={item.title}>
                <div className="trust-icon">{item.icon}</div>
                <h3 className="trust-title">{item.title}</h3>
                <p className="trust-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURED COMPANIONS ── */}
        <div style={{ padding: '100px 0 0' }}>
          <div className="section" style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span className="section-eyebrow">Available Now</span>
                <h2 className="section-title">Featured<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Companions</em></h2>
              </div>
              <Link href="/london-escorts" style={{ fontSize: 11, letterSpacing: '.15em', color: '#6b6560', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #3a3530', paddingBottom: 2, marginBottom: 8 }}>
                View All
              </Link>
            </div>
          </div>

          <div className="models-grid" style={{ marginTop: 40 }}>
            {models.map((model: any) => {
              const photo = model.media[0]?.url
              const age = model.stats?.age
              const nationality = model.stats?.nationality
              return (
                <Link key={model.id} href={`/catalog/${model.slug}`} className="model-card">
                  {photo
                    ? <img src={photo} alt={model.name} loading="lazy" />
                    : (
                      <div className="model-card-placeholder">
                        <div className="model-card-placeholder-icon">◈</div>
                        <div className="model-card-placeholder-text">Photo Coming Soon</div>
                      </div>
                    )
                  }
                  <div className="model-card-overlay" />
                  <div className="model-card-content">
                    <h3 className="model-card-name">{model.name}</h3>
                    <p className="model-card-meta">
                      {[age && `${age} yrs`, nationality].filter(Boolean).join('  ·  ')}
                    </p>
                    <span className="model-card-cta">View Profile →</span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Link href="/london-escorts" style={{ display: 'inline-block', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', padding: '16px 48px', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color .2s' }}>
              View All Companions
            </Link>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span className="section-eyebrow">Simple Process</span>
              <h2 className="section-title" style={{ textAlign: 'center' }}>How to Book</h2>
            </div>
            <div className="how-grid">
              {[
                { num: '01', title: 'Browse & Choose', text: 'Explore our curated selection of verified companions. Each profile is authentic, every photo approved.' },
                { num: '02', title: 'Submit Request', text: 'Fill in your preferred date, time and duration. Your enquiry is handled with complete discretion.' },
                { num: '03', title: 'Confirmation', text: 'Receive confirmation within 30 minutes. Professional, reliable, every single time.' },
              ].map(item => (
                <div key={item.num}>
                  <div className="how-num">{item.num}</div>
                  <h4 className="how-title">{item.title}</h4>
                  <p className="how-text">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DISTRICTS ── */}
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 0 }}>
            <div>
              <span className="section-eyebrow">London Coverage</span>
              <h2 className="section-title">Escorts by<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>District</em></h2>
            </div>
          </div>
          <div className="district-grid">
            {DISTRICTS.map(d => (
              <Link key={d.slug} href={`/escorts-in/${d.slug}`} className="district-item">
                <span className="district-name">Escorts in {d.name}</span>
                <span className="district-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' }}>
          <div className="section">
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <span className="section-eyebrow">Got Questions?</span>
              <h2 className="section-title" style={{ textAlign: 'center' }}>Frequently<br /><em style={{ fontStyle: 'italic', color: '#c9a84c' }}>Asked</em></h2>
            </div>
            <div className="faq-wrap">
              <FAQ />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
