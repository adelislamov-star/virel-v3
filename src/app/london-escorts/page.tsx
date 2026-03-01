// @ts-nocheck
export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CatalogFilter } from '@/components/catalog/CatalogFilter'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'London Escorts | Premium Companions | Virel',
  description: 'Browse our curated selection of verified premium companions in London. Sophisticated, discreet, available for incall and outcall across all major districts.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://virel-v3.vercel.app/london-escorts' },
  openGraph: {
    title: 'London Escorts | Premium Companions | Virel',
    description: 'Browse verified premium companions in London. Discreet, sophisticated, available 24/7.',
    url: 'https://virel-v3.vercel.app/london-escorts',
    siteName: 'Virel',
    locale: 'en_GB',
    type: 'website',
  },
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

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'London Escorts — Virel',
    url: 'https://virel-v3.vercel.app/london-escorts',
    numberOfItems: models.length,
    itemListElement: models.map((m: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://virel-v3.vercel.app/catalog/${m.slug}`,
      name: m.name,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .catalog-root { font-family: 'DM Sans', sans-serif; background: #080808; color: #ddd5c8; min-height: 100vh; }

        .catalog-header { padding: 80px 40px 60px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        @media(max-width:600px){ .catalog-header{padding:60px 20px 40px;} }
        .catalog-eyebrow { font-size: 10px; letter-spacing: .25em; color: #c9a84c; text-transform: uppercase; display: block; margin-bottom: 16px; }
        .catalog-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 6vw, 80px); font-weight: 300; color: #f0e8dc; margin: 0 0 12px; line-height: 1; }
        .catalog-title em { font-style: italic; color: #c9a84c; }
        .catalog-desc { font-size: 14px; color: #6b6560; max-width: 500px; line-height: 1.8; margin: 0; }
        .catalog-count { font-size: 11px; letter-spacing: .12em; color: #3a3530; text-transform: uppercase; margin-top: 20px; }

        .districts-bar { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid rgba(255,255,255,0.05); scrollbar-width: none; }
        .districts-bar::-webkit-scrollbar { display: none; }
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

        {/* Filter + Grid — client component */}
        <CatalogFilter models={models} totalCount={models.length} />

        <Footer />
      </div>
    </>
  )
}
