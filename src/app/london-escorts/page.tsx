// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'London Escorts | Premium Companions | Virel',
  description: 'Browse our curated selection of verified premium companions in London. Sophisticated, discreet, available for incall and outcall across all major districts.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://virel-v3.vercel.app/london-escorts' },
}

export default async function LondonEscortsPage() {
  const models = await prisma.model.findMany({
    where: { status: 'active', visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    include: {
      stats: true,
      media: { where: { isPrimary: true, isPublic: true }, take: 1 },
      primaryLocation: true,
    },
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .catalog-root { font-family: 'DM Sans', sans-serif; background: #080808; color: #ddd5c8; min-height: 100vh; }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        .catalog-header { padding: 80px 40px 60px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .catalog-eyebrow { font-size: 10px; letter-spacing: .25em; color: #c9a84c; text-transform: uppercase; display: block; margin-bottom: 16px; }
        .catalog-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 6vw, 80px); font-weight: 300; color: #f0e8dc; margin: 0 0 12px; line-height: 1; }
        .catalog-title em { font-style: italic; color: #c9a84c; }
        .catalog-desc { font-size: 14px; color: #6b6560; max-width: 500px; line-height: 1.8; margin: 0; }
        .catalog-count { font-size: 11px; letter-spacing: .12em; color: #3a3530; text-transform: uppercase; margin-top: 20px; }

        .catalog-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; padding: 2px; background: rgba(255,255,255,0.03); }
        @media(max-width:1100px){ .catalog-grid{grid-template-columns:repeat(3,1fr);} }
        @media(max-width:750px){ .catalog-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:480px){ .catalog-grid{grid-template-columns:1fr;} }

        .model-card { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #111; display: block; text-decoration: none; }
        .model-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s cubic-bezier(.25,.46,.45,.94); filter: grayscale(10%); }
        .model-card:hover img { transform: scale(1.06); filter: grayscale(0%); }
        .model-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, transparent 55%); }
        .model-card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 24px; }
        .model-card-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: #fff; margin: 0 0 4px; }
        .model-card-meta { font-size: 10px; letter-spacing: .12em; color: rgba(255,255,255,0.4); text-transform: uppercase; }
        .model-card-view { display: inline-block; margin-top: 14px; font-size: 10px; letter-spacing: .15em; color: #c9a84c; text-transform: uppercase; opacity: 0; transform: translateY(6px); transition: opacity .25s, transform .25s; }
        .model-card:hover .model-card-view { opacity: 1; transform: none; }
        .model-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(135deg,#0f0f0f,#1a1811); }
        .model-placeholder-icon { font-size:40px; color:#2a2520; margin-bottom:10px; }
        .model-placeholder-text { font-family:'Cormorant Garamond',serif; font-size:11px; letter-spacing:.18em; color:#2a2520; text-transform:uppercase; }

        .districts-bar { display: flex; gap: 0; overflow-x: auto; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .district-link { flex-shrink: 0; padding: 18px 24px; font-size: 11px; letter-spacing: .12em; color: #6b6560; text-decoration: none; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.05); transition: color .2s, background .2s; white-space: nowrap; }
        .district-link:hover { color: #c9a84c; background: rgba(201,168,76,0.04); }
      `}</style>

      <div className="catalog-root">
        <Header />

        {/* Header */}
        <div className="catalog-header">
          <nav style={{ fontSize: 11, letterSpacing: '.1em', color: '#3a3530', marginBottom: 40 }}>
            <Link href="/" style={{ color: '#3a3530', textDecoration: 'none' }}>HOME</Link>
            <span style={{ margin: '0 12px' }}>—</span>
            <span style={{ color: '#c9a84c' }}>COMPANIONS</span>
          </nav>
          <span className="catalog-eyebrow">Verified & Available</span>
          <h1 className="catalog-title">London <em>Escorts</em></h1>
          <p className="catalog-desc">
            A curated selection of sophisticated companions available across London's most prestigious districts.
            Every profile verified, every photo authentic.
          </p>
          <p className="catalog-count">{models.length} companion{models.length !== 1 ? 's' : ''} available</p>
        </div>

        {/* Districts bar */}
        <div className="districts-bar">
          {['Mayfair','Kensington','Knightsbridge','Chelsea','Belgravia','Marylebone','Westminster','Soho','Canary Wharf'].map(d => (
            <Link key={d} href={`/escorts-in/${d.toLowerCase().replace(/\s+/g,'-')}`} className="district-link">
              {d}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {models.length > 0 ? (
          <div className="catalog-grid">
            {models.map((model: any) => {
              const photo = model.media[0]?.url
              const age = model.stats?.age
              const nationality = model.stats?.nationality
              return (
                <Link key={model.id} href={`/catalog/${model.slug}`} className="model-card">
                  {photo
                    ? <img src={photo} alt={model.name} loading="lazy" />
                    : (
                      <div className="model-placeholder">
                        <div className="model-placeholder-icon">◈</div>
                        <div className="model-placeholder-text">Photo Coming Soon</div>
                      </div>
                    )
                  }
                  <div className="model-card-overlay" />
                  <div className="model-card-content">
                    <h2 className="model-card-name">{model.name}</h2>
                    <p className="model-card-meta">{[age && `${age} yrs`, nationality].filter(Boolean).join('  ·  ')}</p>
                    <span className="model-card-view">View Profile →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '120px 40px', color: '#3a3530' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 300 }}>No companions available at the moment.</p>
          </div>
        )}

        <Footer />
      </div>
    </>
  )
}
