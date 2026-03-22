// @ts-nocheck
export const revalidate = 3600

import { Metadata } from 'next'
import Link from 'next/link'

import { ModelCard } from '@/components/public/ModelCard'
import { CompanionFilters } from '@/components/public/CompanionFilters'
import { prisma } from '@/lib/db/client'

import { siteConfig } from '@/../config/site'
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema'
import './companions.css'

export const metadata: Metadata = {
  title: 'London Companions',
  description: 'Browse verified London companions at Vaurel — elite escort agency. Available in Mayfair, Kensington, Chelsea & beyond. From £250/hr. 30-min response.',
  alternates: { canonical: `${siteConfig.domain}/companions` },
  openGraph: {
    title: 'London Companions',
    description: 'Browse verified London companions at Vaurel — elite escort agency. Available in Mayfair, Kensington, Chelsea & beyond. From £250/hr. 30-min response.',
    url: `${siteConfig.domain}/companions`,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [{ url: `${siteConfig.domain}/opengraph-image.png`, width: 1200, height: 630 }],
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

  // Build stats filter (merged so multiple stats conditions don't overwrite each other)
  const statsFilter: any = {}
  if (hairColor && hairColor !== 'any') {
    statsFilter.hairColour = { contains: hairColor, mode: 'insensitive' }
  }
  if (nationality && nationality !== 'any') {
    statsFilter.nationality = { equals: nationality, mode: 'insensitive' }
  }
  if (age === '18-24') { statsFilter.age = { gte: 18, lte: 24 } }
  else if (age === '25-30') { statsFilter.age = { gte: 25, lte: 30 } }
  else if (age === '30plus') { statsFilter.age = { gte: 30 } }

  // Build where clause
  const where: any = {
    status: 'active',
    deletedAt: null,
    ...(Object.keys(statsFilter).length > 0 && { stats: statsFilter }),
    ...(districtId && {
      modelLocations: { some: { districtId } },
    }),
    ...(service && {
      services: { some: { service: { slug: service }, isEnabled: true } },
    }),
    ...(availability === 'available-now' && { availability: 'Available Now' }),
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

  // Fetch min prices via Prisma
  let minPrices: Record<string, number> = {}
  {
    const modelIds = models.map((m: any) => m.id)
    if (modelIds.length > 0) {
      const rates = await prisma.modelRate.findMany({
        where: {
          modelId: { in: modelIds },
          callRateMaster: { durationMin: 60 },
          OR: [
            { incallPrice: { gt: 0 } },
            { outcallPrice: { gt: 0 } },
          ],
        },
        select: {
          modelId: true,
          incallPrice: true,
          outcallPrice: true,
        },
      })
      for (const r of rates) {
        const prices = [r.incallPrice, r.outcallPrice].filter((p): p is number => p != null && p > 0)
        if (prices.length === 0) continue
        const min = Math.min(...prices)
        if (!minPrices[r.modelId] || min < minPrices[r.modelId]) {
          minPrices[r.modelId] = min
        }
      }
    }
  }

  // Apply price filters client-side (since pricing is in a separate table)
  let filteredModels = models
  if (minPrice) {
    const min = parseFloat(minPrice)
    filteredModels = filteredModels.filter((m: any) => (minPrices[m.id] ?? Infinity) >= min)
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice)
    filteredModels = filteredModels.filter((m: any) => (minPrices[m.id] ?? 0) < max)
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
    name: `London Companions — ${siteConfig.name}`,
    url: `${siteConfig.domain}/companions`,
    numberOfItems: totalCount,
    itemListElement: filteredModels.map((m: any, i: number) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `${siteConfig.domain}/companions/${m.slug}`,
      name: m.name,
    })),
  }

  return (
    <>
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'Companions' }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      <div className="catalog-root">

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

      </div>
    </>
  )
}
