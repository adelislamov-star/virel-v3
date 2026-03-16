// @ts-nocheck
import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Companion Services London | Virel',
  description: 'Explore our full range of companion services in London — GFE, massage, BDSM, fetish, roleplay and more.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://virel-v3.vercel.app/services' },
}

const CATEGORY_LABELS: Record<string, string> = {
  signature: 'Companion Services',
  wellness: 'Wellness & Massage',
  fetish: 'Fetish & Fantasy',
  classic: 'Classic Services',
  massage: 'Massage Services',
  bdsm: 'BDSM & Domination',
  entertainment: 'Entertainment',
  companionship: 'Companionship',
}

const HIDDEN_CATEGORIES = ['intimate', 'bespoke', 'Intimate', 'Bespoke']

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: [{ isPopular: 'desc' }, { category: 'asc' }, { sortOrder: 'asc' }],
    include: { _count: { select: { models: true } } },
  })

  // Group by category, exclude intimate/bespoke
  const grouped: Record<string, typeof services> = {}
  for (const svc of services) {
    const cat = svc.category || 'other'
    if (HIDDEN_CATEGORIES.includes(cat)) continue
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(svc)
  }

  const categories = Object.keys(grouped)

  return (
    <main style={{ background: '#080808', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#ddd5c8' }}>
      <style>{`
        .svc-card { display:block; padding:24px 28px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); text-decoration:none; transition:border-color .25s, background .25s; }
        .svc-card:hover { border-color:rgba(201,168,76,0.35); background:rgba(201,168,76,0.04); }
        .svc-card:hover .svc-name { color:#c9a84c; }
        .cat-pill { display:inline-block; padding:8px 18px; border:1px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#6b6560; text-decoration:none; transition:border-color .2s, color .2s; }
        .cat-pill:hover { border-color:rgba(201,168,76,0.4); color:#c9a84c; }
        .browse-btn { display:inline-block; border:1px solid rgba(201,168,76,0.4); color:#c9a84c; padding:16px 40px; font-size:11px; letter-spacing:.18em; text-transform:uppercase; text-decoration:none; transition:all .25s; font-family:inherit; }
        .browse-btn:hover { background:rgba(201,168,76,0.08); border-color:#c9a84c; }
      `}</style>

      <Header />

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 40px 64px' }}>
        <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 24 }}>Our Services</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 300, color: '#f0e8dc', lineHeight: 1.05, margin: '0 0 24px' }}>
          Companion Services<br />
          <em style={{ fontStyle: 'italic', color: '#c9a84c' }}>in London</em>
        </h1>
        <p style={{ fontSize: 15, color: '#6b6560', maxWidth: 520, lineHeight: 1.8, margin: '0 0 48px' }}>
          Browse all services available with our London companions. Please confirm availability with your chosen escort when booking.
        </p>

        {/* Category nav */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {categories.map(cat => (
            <a key={cat} href={`#${cat}`} className="cat-pill">{CATEGORY_LABELS[cat] || cat}</a>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />
      </div>

      {/* Categories */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          {categories.map(cat => (
            <div key={cat} id={cat}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: '#f0e8dc', margin: 0 }}>
                  {CATEGORY_LABELS[cat] || cat}
                </h2>
                <span style={{ fontSize: 11, letterSpacing: '.15em', color: '#3a3530', textTransform: 'uppercase' }}>
                  {grouped[cat].length} services
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: 'rgba(255,255,255,0.04)' }}>
                {grouped[cat].map(svc => {
                  const name = svc.publicName || svc.title || svc.name
                  const desc = svc.description ? svc.description.slice(0, 80) + (svc.description.length > 80 ? '...' : '') : ''
                  return (
                    <Link key={svc.slug} href={`/services/${svc.slug}`} className="svc-card">
                      <p className="svc-name" style={{ fontSize: 15, fontWeight: 400, color: '#ddd5c8', margin: '0 0 6px', transition: 'color .25s' }}>
                        {name}
                      </p>
                      {desc && (
                        <p style={{ fontSize: 12, color: '#4a4540', lineHeight: 1.7, margin: '0 0 8px' }}>
                          {desc}
                        </p>
                      )}
                      {svc._count.models > 0 && (
                        <p style={{ fontSize: 11, color: '#6b6560', margin: 0 }}>
                          {svc._count.models} companion{svc._count.models !== 1 ? 's' : ''}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px 120px' }}>
        <div style={{ border: '1px solid rgba(201,168,76,0.15)', padding: '64px 80px', textAlign: 'center', background: 'rgba(201,168,76,0.02)' }}>
          <p style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 20 }}>Ready to Book</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, color: '#f0e8dc', margin: '0 0 16px' }}>
            Find Your Perfect Companion
          </h2>
          <p style={{ fontSize: 14, color: '#4a4540', marginBottom: 40, maxWidth: 400, margin: '0 auto 40px' }}>
            Browse our verified London escorts and book your preferred service today.
          </p>
          <Link href="/companions" className="browse-btn">Browse Companions</Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
