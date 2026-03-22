// @ts-nocheck
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'

import { CompanionsClient } from '@/components/public/CompanionsClient'
import { CompanionFilters } from '@/components/public/CompanionFilters'
import { SortTabs } from '@/components/public/SortTabs'
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
  const service = typeof searchParams.service === 'string' ? searchParams.service : undefined
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'recommended'

  // Build stats filter (merged so multiple stats conditions don't overwrite each other)
  const statsFilter: any = {}
  if (hairColor && hairColor !== 'any') {
    statsFilter.hairColour = { contains: hairColor, mode: 'insensitive' }
  }
  if (nationality && nationality !== 'any') {
    statsFilter.nationality = { equals: nationality, mode: 'insensitive' }
  }
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

  const [models, allDistricts, filterNationalities, filterHairColors, filterExperiences] = await Promise.all([
    prisma.model.findMany({
      where,
      orderBy,
      include: {
        stats: true,
        media: { where: { isPrimary: true, isPublic: true }, take: 1 },
        modelLocations: {
          include: { district: { select: { name: true } } },
          take: 1,
        },
        modelRates: {
          take: 1,
        },
      },
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, name: true, slug: true },
    }),
    // Unique nationalities from active models
    prisma.modelStats.findMany({
      where: {
        nationality: { not: null },
        model: { status: 'active', deletedAt: null },
      },
      select: { nationality: true },
      distinct: ['nationality'],
      orderBy: { nationality: 'asc' },
    }),
    // Unique hair colours from active models
    prisma.modelStats.findMany({
      where: {
        hairColour: { not: null },
        model: { status: 'active', deletedAt: null },
      },
      select: { hairColour: true },
      distinct: ['hairColour'],
      orderBy: { hairColour: 'asc' },
    }),
    // Experience services for filter
    prisma.service.findMany({
      where: {
        isActive: true,
        isPublic: true,
        slug: { in: ['gfe', 'dinner-date', 'travel-companion', 'overnight', 'duo'] },
      },
      select: { slug: true, publicName: true, title: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  const nationalities = filterNationalities
    .map((s: any) => s.nationality)
    .filter(Boolean) as string[]
  const hairColors = filterHairColors
    .map((s: any) => s.hairColour)
    .filter(Boolean) as string[]
  const experiences = filterExperiences.map((s: any) => ({
    slug: s.slug,
    label: s.publicName ?? s.title,
  }))

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

  // Fallback districts for models without DB district data
  const DISTRICT_FALLBACK: Record<string, string> = {
    marsalina: 'Earls Court',
    marzena: 'Knightsbridge',
    angelina: 'Kensington',
    comely: 'Mayfair',
    veruca: 'Chelsea',
    burana: 'Belgravia',
    vicky: 'Notting Hill',
    watari: 'Marylebone',
  }

  // Prepare client-side data
  const clientModels = filteredModels.map((model: any) => {
    const photo = model.media[0]?.url ?? null
    const district = model.modelLocations?.[0]?.district?.name ?? DISTRICT_FALLBACK[model.slug] ?? null
    const incallPrice = model.modelRates?.[0]?.incallPrice
      ? Number(model.modelRates[0].incallPrice)
      : minPrices[model.id] ?? null

    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      nationality: model.stats?.nationality ?? null,
      availability: model.availability,
      districtName: district,
      minIncallPrice: incallPrice,
      coverPhotoUrl: photo,
    }
  })

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `London Companions — ${siteConfig.name}`,
    url: `${siteConfig.domain}/companions`,
    numberOfItems: clientModels.length,
    itemListElement: clientModels.slice(0, 10).map((m: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
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
            {clientModels.length} companion{clientModels.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sidebar + Results */}
        <div className="catalog-layout">
          <CompanionFilters
            districts={allDistricts}
            nationalities={nationalities}
            hairColors={hairColors}
            experiences={experiences}
            currentFilters={{ hairColor, nationality, districtId, availability, minPrice, maxPrice, service, sort }}
          />

          <div>
            {/* Sort tabs */}
            <div className="results-header">
              <span className="results-count">{clientModels.length} result{clientModels.length !== 1 ? 's' : ''}</span>
              <SortTabs current={sort} />
            </div>

            <CompanionsClient initialData={clientModels} />
          </div>
        </div>

      </div>
    </>
  )
}
