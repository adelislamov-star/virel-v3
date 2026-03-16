// @ts-nocheck
export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ModelCard } from '@/components/public/ModelCard'
import { CompanionFilters } from '@/components/public/CompanionFilters'
import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

export const metadata: Metadata = {
  title: 'London Companions',
  description: 'Browse our exclusive selection of London companions.',
  alternates: { canonical: 'https://virel-v3.vercel.app/companions' },
  openGraph: {
    title: 'London Companions',
    description: 'Browse our exclusive selection of London companions.',
    url: 'https://virel-v3.vercel.app/companions',
    siteName: 'Virel',
    locale: 'en_GB',
    type: 'website',
  },
}

const PAGE_SIZE = 20

export default async function CompanionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const hairColor = typeof searchParams.hairColor === 'string' ? searchParams.hairColor : undefined
  const nationality = typeof searchParams.nationality === 'string' ? searchParams.nationality : undefined
  const districtId = typeof searchParams.districtId === 'string' ? searchParams.districtId : undefined
  const availability = typeof searchParams.availability === 'string' ? searchParams.availability : undefined
  const minPrice = typeof searchParams.minPrice === 'string' ? searchParams.minPrice : undefined
  const maxPrice = typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : undefined
  const age = typeof searchParams.age === 'string' ? searchParams.age : undefined
  const service = typeof searchParams.service === 'string' ? searchParams.service : undefined
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'recommended'
  const page = Math.max(1, parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1', 10) || 1)

  // Build where clause
  const where: any = {
    status: 'active',
    
    deletedAt: null,
    ...(hairColor && hairColor !== 'any' && {
      stats: { hairColour: { contains: hairColor, mode: 'insensitive' } },
    }),
    ...(nationality && nationality !== 'any' && {
      stats: { nationality: { equals: nationality, mode: 'insensitive' } },
    }),
    ...(districtId && {
      modelLocations: { some: { districtId } },
    }),
    ...(service && {
      services: { some: { service: { slug: service }, isEnabled: true } },
    }),
    ...(availability === 'available-now' && { availability: 'Available Now' }),
    ...(age === '18-24' && { stats: { age: { gte: 18, lte: 24 } } }),
    ...(age === '25-30' && { stats: { age: { gte: 25, lte: 30 } } }),
    ...(age === '30plus' && { stats: { age: { gte: 30 } } }),
  }

  // Sort
  const orderBy: any = sort === 'newest'
    ? { createdAt: 'desc' as const }
    : [{ isExclusive: 'desc' as const }, { isVerified: 'desc' as const }, { createdAt: 'desc' as const }]

  const [models, totalCount, allDistricts] = await Promise.all([
    prisma.model.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        stats: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelLocations: {
          where: { isPrimary: true },
          include: { district: { select: { name: true } } },
          take: 1,
        },
        modelRates: {
          take: 1,
        },
      },
    }),
    prisma.model.count({ where }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, name: true, slug: true },
    }),
  ])

  // Fetch min prices via raw SQL
  let minPrices: Record<string, number> = {}
  try {
    const modelIds = models.map((m: any) => m.id)
    if (modelIds.length > 0) {
      const rates: any[] = await prisma.$queryRaw`
        SELECT model_id, MIN(price) as min_price
        FROM model_rates
        WHERE model_id = ANY(${modelIds}::text[])
          AND is_active = true
          AND price > 0
        GROUP BY model_id
      `
      for (const r of rates) {
        minPrices[r.model_id] = Number(r.min_price)
      }
    }
  } catch {}

  // Apply price filters client-side (since pricing is in a separate table)
  let filteredModels = models
  if (minPrice) {
    const min = parseFloat(minPrice)
    filteredModels = filteredModels.filter((m: any) => (minPrices[m.id] ?? Infinity) >= min)
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice)
    filteredModels = filteredModels.filter((m: any) => (minPrices[m.id] ?? 0) <= max)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Build URL for pagination/filters
  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const all = { hairColor, nationality, districtId, availability, minPrice, maxPrice, age, service, sort, ...overrides }
    for (const [k, v] of Object.entries(all)) {
      if (v && v !== 'any' && v !== 'recommended' && k !== 'page') params.set(k, v)
    }
    if (overrides.page && overrides.page !== '1') params.set('page', overrides.page)
    const qs = params.toString()
    return `/companions${qs ? `?${qs}` : ''}`
  }

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'London Companions — Virel',
    url: 'https://virel-v3.vercel.app/companions',
    numberOfItems: totalCount,
    itemListElement: filteredModels.map((m: any, i: number) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `https://virel-v3.vercel.app/companions/${m.slug}`,
      name: m.name,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      <style>{`
        .catalog-root { font-family: 'DM Sans', sans-serif; background: #080808; color: #ddd5c8; min-height: 100vh; }

        .catalog-header { padding: 120px 80px 80px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        @media(max-width:600px){ .catalog-header{padding:80px 24px 60px;} }
        .catalog-eyebrow { font-size: 10px; letter-spacing: .25em; color: #808080; text-transform: uppercase; display: block; margin-bottom: 16px; }
        .catalog-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 6vw, 80px); font-weight: 300; color: #f0e8dc; margin: 0 0 12px; line-height: 1; }
        .catalog-title em { font-style: italic; color: #f0e8dc; }
        .catalog-desc { font-size: 14px; color: #6b6560; max-width: 500px; line-height: 1.8; margin: 0; }
        .catalog-count { font-size: 11px; letter-spacing: .12em; color: #3a3530; text-transform: uppercase; margin-top: 20px; }

        .catalog-layout { display: grid; grid-template-columns: 260px 1fr; gap: 0; }
        @media(max-width:900px){ .catalog-layout { grid-template-columns:1fr; } }

        /* SIDEBAR */
        .sidebar { border-right: 1px solid rgba(255,255,255,0.05); padding: 32px 24px; }
        @media(max-width:900px){ .sidebar { border-right:none; border-bottom:1px solid rgba(255,255,255,0.05); padding:24px; } }
        .sb-section { margin-bottom: 28px; }
        .sb-label { font-size: 10px; letter-spacing: .2em; color: #808080; text-transform: uppercase; margin-bottom: 12px; display: block; }
        .sb-option { display: block; padding: 6px 0; font-size: 12px; color: #6b6560; cursor: pointer; text-decoration: none; transition: color .15s; }
        .sb-option:hover { color: #ddd5c8; }
        .sb-option.active { color: #C5A572; }
        .sb-clear { display: inline-block; margin-top: 16px; padding: 8px 16px; font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: #6b6560; border: 1px solid rgba(255,255,255,0.07); text-decoration: none; transition: all .2s; background: none; cursor: pointer; font-family: inherit; }
        .sb-clear:hover { color: #ddd5c8; border-color: rgba(255,255,255,0.2); }

        /* RESULTS */
        .results-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .results-count { font-size: 11px; letter-spacing: .08em; color: #3a3530; }
        .sort-select { background: transparent; border: 1px solid rgba(255,255,255,0.07); color: #6b6560; padding: 6px 12px; font-size: 11px; font-family: inherit; cursor: pointer; }
        .sort-select option { background: #111; }

        .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; padding: 2px; }
        @media(max-width:1100px){ .results-grid { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:600px){ .results-grid { grid-template-columns: 1fr; } }

        .no-results { padding: 80px 40px; text-align: center; font-family: 'Cormorant Garamond', serif; font-size: 24px; color: #3a3530; }

        /* PAGINATION */
        .pagination { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 48px 24px; }
        .pg-link { padding: 8px 14px; font-size: 12px; color: #6b6560; text-decoration: none; border: 1px solid rgba(255,255,255,0.07); transition: all .2s; }
        .pg-link:hover { color: #ddd5c8; border-color: rgba(255,255,255,0.2); }
        .pg-link.active { color: #C5A572; border-color: rgba(197,165,114,.4); }
        .pg-link.disabled { opacity: 0.3; pointer-events: none; }
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
          <h1 className="catalog-title">London <em>Companions</em></h1>
          <p className="catalog-desc">
            A curated selection of sophisticated companions available across London's most prestigious districts.
            Every profile verified, every photo authentic.
          </p>
          <p className="catalog-count">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} companion{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sidebar + Results */}
        <div className="catalog-layout">
          <CompanionFilters
            districts={allDistricts}
            currentFilters={{ hairColor, nationality, districtId, availability, minPrice, maxPrice, age, service, sort }}
          />

          <div>
            {/* Sort bar */}
            <div className="results-header">
              <span className="results-count">{filteredModels.length} result{filteredModels.length !== 1 ? 's' : ''}</span>
            </div>

            {filteredModels.length === 0 ? (
              <div className="no-results">
                <p>No companions found matching your filters.</p>
                <Link href="/companions" className="sb-clear" style={{ display: 'inline-block', marginTop: 24 }}>
                  Clear All Filters
                </Link>
              </div>
            ) : (
              <div className="results-grid">
                {filteredModels.map((model: any) => {
                  const photo = model.media[0]?.url
                  const district = model.modelLocations?.[0]?.district?.name ?? null
                  const incallPrice = model.modelRates?.[0]?.incallPrice
                    ? Number(model.modelRates[0].incallPrice)
                    : minPrices[model.id] ?? null

                  return (
                    <ModelCard
                      key={model.id}
                      name={model.name}
                      slug={model.slug}
                      tagline={model.tagline}
                      coverPhotoUrl={photo}
                      availability={model.availability}
                      isVerified={model.isVerified}
                      isExclusive={model.isExclusive}
                      districtName={district}
                      minIncallPrice={incallPrice}
                    />
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="pagination">
                <Link
                  href={buildUrl({ page: String(Math.max(1, page - 1)) })}
                  className={`pg-link${page <= 1 ? ' disabled' : ''}`}
                >
                  ← Prev
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={buildUrl({ page: String(p) })}
                    className={`pg-link${p === page ? ' active' : ''}`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={buildUrl({ page: String(Math.min(totalPages, page + 1)) })}
                  className={`pg-link${page >= totalPages ? ' disabled' : ''}`}
                >
                  Next →
                </Link>
              </nav>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
